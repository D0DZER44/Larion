import { normalizeDataset } from "../core/normalizeEngine.js";
import { closeAction, canCloseAction, reopenAction } from "../engine/operationalEngine.js";
import { calculateActionMetrics } from "../engine/metricsEngine.js";
import { getActionsByStatusChart } from "../engine/chartEngine.js";
import { mapStoreStateToMotorDataset } from "../bridge";
import { buildAutomaticRisksFromInspections, dedupeStrings } from "./automaticRiskAdapter.js";

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeActionStatus(action = {}) {
  const rawStatus = normalizeText(action.status || "");
  if (rawStatus.includes("concl") || rawStatus.includes("fech")) return "Concluída";
  if (rawStatus.includes("cancel")) return "Cancelada";
  if (rawStatus.includes("venc")) return "Vencida";
  if (rawStatus.includes("andamento") || Number(action.progresso || 0) > 0) return "Em andamento";

  const prazo = action.prazo || action.due_date || action.deadlineTime;
  if (prazo) {
    const deadline = new Date(prazo);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline) {
      return "Vencida";
    }
  }

  return "Pendente";
}

function normalizeActionPriority(action = {}) {
  const rawPriority = normalizeText(action.priority || action.prioridade || "");
  if (rawPriority.includes("crit") || rawPriority === "p1") return "Crítica";
  if (rawPriority.includes("alta") || rawPriority === "p2") return "Alta";
  if (rawPriority.includes("media") || rawPriority.includes("medio") || rawPriority === "p3") return "Média";
  return "Baixa";
}

function getSuggestedDueDate(priority = "", fallbackDate = "") {
  if (fallbackDate) return fallbackDate;

  const normalized = normalizeText(priority);
  let days = 15;
  if (normalized.includes("crit")) days = 1;
  else if (normalized.includes("alta")) days = 3;
  else if (normalized.includes("media") || normalized.includes("medio")) days = 7;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split("T")[0];
}

function buildDerivedActionFromRisk(risk = {}) {
  const nowIso = new Date().toISOString();
  const riskId = risk.id || risk.riscoId || risk.risk_id;
  const prioridade = risk.prioridade || risk.priority || "Alta";
  const expectedEvidence = dedupeStrings([
    ...(Array.isArray(risk?.evidenciasEsperadas) ? risk.evidenciasEsperadas : []),
    ...(Array.isArray(risk?.expectedEvidence) ? risk.expectedEvidence : []),
  ]);

  return {
    id: `derived-action-${riskId}`,
    titulo:
      risk.acaoRecomendada ||
      risk.recommendedAction ||
      `Mitigar ${risk.titulo || risk.title || risk.tipoDeRisco || risk.atividade || "risco identificado"}`,
    descricao:
      risk.descricao ||
      `Ação derivada automaticamente do risco ${risk.titulo || risk.title || risk.tipoDeRisco || risk.atividade || "identificado"}.`,
    prioridade,
    status: risk.status === "Resolvido" || risk.status === "Mitigado" ? "Concluída" : "Pendente",
    setor: risk.setor || risk.category || risk.sector_id || "Não definido",
    sectorId: risk.sectorId || risk.sector_id || "",
    responsavel:
      risk.responsavel ||
      risk.validadorCorrecao ||
      risk.executorCorrecao ||
      "Não atribuído",
    prazo: getSuggestedDueDate(prioridade, risk.prazo || risk.due_date || risk.deadlineTime || ""),
    progresso: 0,
    origem: "Risco",
    item_origem_tipo: "risco",
    item_origem_id: riskId,
    riscoId: riskId,
    risk_id: riskId,
    riscoVinculado: risk.titulo || risk.title || risk.tipoDeRisco || "",
    nrRelacionada: risk.nr || risk.nrRelacionada || risk.nrCode || "",
    nrCode: risk.nrCode || risk.nr || risk.nrRelacionada || "",
    pacote: risk.pacote || risk.package || "Base SST",
    atividade: risk.atividade || "",
    activityId: risk.activityId || "",
    evidenciasEsperadas: expectedEvidence,
    expectedEvidence,
    exigeEvidencia: expectedEvidence.length > 0,
    acaoRecomendada: risk.acaoRecomendada || risk.recommendedAction || "",
    criadoEm: risk.criadoEm || risk.created_at || nowIso,
    atualizadoEm: risk.atualizadoEm || risk.updated_at || nowIso,
    evidencia: [],
    historico: [],
    derivedFromRisk: true,
  };
}

export function adaptActionLifecycle(action = {}, evidences = [], options = {}) {
  return {
    canClose: canCloseAction(action, evidences, options),
    close: () => closeAction(action, evidences, options),
    reopen: (reason) => reopenAction(action, reason, options.referenceDate),
  };
}

export function buildActionsViewModel(state = {}, options = {}) {
  const dataset = normalizeDataset(state);
  return {
    metrics: calculateActionMetrics(dataset, options),
    chart: getActionsByStatusChart(dataset),
    actions: dataset.actions,
  };
}

export function buildTargetActionsViewModel(state = {}, options = {}) {
  const activePackages = new Set(options.activePackages || []);
  const includeInactivePackages = Boolean(options.includeInactivePackages);
  const explicitActions = (state.acoes || []).filter((action) => {
    const pacote = action?.pacote || action?.package || "Base SST";
    if (includeInactivePackages) return true;
    return pacote === "Base SST" || activePackages.has(pacote);
  });
  const linkedRiskIds = new Set(
    explicitActions
      .map((action) => action.risk_id || action.riscoId || (action.item_origem_tipo === "risco" ? action.item_origem_id : undefined))
      .filter(Boolean),
  );
  const filteredManualRisks = (state.riscos || []).filter((risk) => {
    const pacote = risk?.pacote || risk?.package || "Base SST";
    if (includeInactivePackages) return true;
    return pacote === "Base SST" || activePackages.has(pacote);
  });
  const automaticRisks = buildAutomaticRisksFromInspections(state, options);
  const allRisks = [...filteredManualRisks, ...automaticRisks];
  const derivedActions = allRisks
    .filter((risk) => risk?.id && !linkedRiskIds.has(risk.id))
    .map((risk) => buildDerivedActionFromRisk(risk));
  const filteredActions = [...explicitActions, ...derivedActions];
  const risksById = Object.fromEntries(allRisks.map((risk) => [risk.id, risk]));
  const dataset = mapStoreStateToMotorDataset({
    ...state,
    riscos: allRisks,
    acoes: filteredActions,
  });

  return {
    metrics: calculateActionMetrics(dataset, options),
    chart: getActionsByStatusChart(dataset),
    actions: filteredActions.map((action) => {
      const relatedRisk = risksById[action.risk_id || action.riscoId || action.item_origem_id];
      const pacote = action.pacote || action.package || relatedRisk?.pacote || relatedRisk?.package || "Base SST";
      const evidenciasEsperadas = dedupeStrings([
        ...(Array.isArray(action.evidenciasEsperadas) ? action.evidenciasEsperadas : []),
        ...(Array.isArray(action.expectedEvidence) ? action.expectedEvidence : []),
        ...(Array.isArray(relatedRisk?.evidenciasEsperadas) ? relatedRisk.evidenciasEsperadas : []),
        ...(Array.isArray(relatedRisk?.expectedEvidence) ? relatedRisk.expectedEvidence : []),
      ]);

      return {
        ...action,
        id: action.id,
        titulo: action.title || action.titulo || "Nova Ação",
        descricao: action.description || action.descricao || "",
        prioridade: normalizeActionPriority(action),
        status: normalizeActionStatus(action),
        setor: action.category || action.setor || action.sector_id || "Não definido",
        responsavel: action.responsavel || action.responsible?.name || "Não atribuído",
        prazo:
          (typeof action.prazo === "string" ? action.prazo : null) ||
          (typeof action.due_date === "string" ? action.due_date : null) ||
          (typeof action.deadlineTime === "string" ? action.deadlineTime : null) ||
          getSuggestedDueDate(action.prioridade || action.priority || relatedRisk?.prioridade || relatedRisk?.priority || "Baixa"),
        progresso: Number(action.progresso || 0),
        origem: action.origem || action.originText || (action.item_origem_tipo === "inspecao" ? "Inspeção" : action.item_origem_tipo === "risco" ? "Risco" : "Manual"),
        riscoId: action.riscoId || action.risk_id || (action.item_origem_tipo === "risco" ? action.item_origem_id : undefined),
        riscoVinculado: action.riscoVinculado || relatedRisk?.titulo || relatedRisk?.title || "",
        inspecaoId: action.inspecaoId || action.inspectionId || relatedRisk?.inspecaoId || relatedRisk?.inspection_id || (action.item_origem_tipo === "inspecao" ? action.item_origem_id : undefined),
        inspectionId: action.inspecaoId || action.inspectionId || relatedRisk?.inspecaoId || relatedRisk?.inspection_id || (action.item_origem_tipo === "inspecao" ? action.item_origem_id : undefined),
        sectorId: action.sectorId || action.setorId || relatedRisk?.sectorId || "",
        activityId: action.activityId || relatedRisk?.activityId || "",
        checklistId: action.checklistId || "",
        perguntaOrigem: action.perguntaOrigem || "",
        respostaOrigem: action.respostaOrigem || "",
        nrRelacionada: action.nrRelacionada || action.nr || action.nrCode || relatedRisk?.nr || relatedRisk?.nrCode,
        nrCode: action.nrCode || action.nr || action.nrRelacionada || relatedRisk?.nrCode || relatedRisk?.nr,
        pacote,
        multaEstimada: Number(action.multaEstimada || 0),
        chanceIncidente: action.chanceIncidente || "Baixa",
        criadoEm: action.criadoEm || action.createdAt || new Date().toISOString(),
        atualizadoEm: action.atualizadoEm || action.updatedAt || new Date().toISOString(),
        iniciadoEm: action.iniciadoEm || null,
        concluidoEm: action.concluidoEm || null,
        evidencia: action.evidencia || [],
        evidenciasEsperadas,
        expectedEvidence: evidenciasEsperadas,
        exigeEvidencia: Boolean(action.exigeEvidencia) || evidenciasEsperadas.length > 0,
        historico: action.historico || [],
      };
    }),
  };
}
