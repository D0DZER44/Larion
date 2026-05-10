import { normalizeDataset } from "../core/normalizeEngine.js";
import { closeAction, canCloseAction, reopenAction } from "../engine/operationalEngine.js";
import { calculateActionMetrics } from "../engine/metricsEngine.js";
import { getActionsByStatusChart } from "../engine/chartEngine.js";
import { mapStoreStateToMotorDataset } from "../bridge";

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

function dedupeStrings(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
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

function findRelatedStandardRisk(nonConformity = {}, inspection = {}) {
  const risks = Array.isArray(inspection?.standardRisks) ? inspection.standardRisks : [];
  const targetNr = nonConformity?.nrCode || nonConformity?.nr || "";
  return (
    risks.find((risk) => Array.isArray(risk?.nrs) && risk.nrs.includes(targetNr)) ||
    risks.find((risk) => normalizeText(risk?.nome) === normalizeText(nonConformity?.titulo)) ||
    risks[0] ||
    null
  );
}

function buildAutomaticRisksFromInspections(state = {}, options = {}) {
  const activePackages = new Set(options.activePackages || []);
  const includeInactivePackages = Boolean(options.includeInactivePackages);
  const existingKeys = new Set(
    (state.riscos || []).map((risk) =>
      [
        risk?.inspection_id || risk?.inspecaoId || "",
        risk?.ruleId || "",
        normalizeText(risk?.origem || ""),
        normalizeText(risk?.titulo || risk?.tipoDeRisco || ""),
      ].join("|"),
    ),
  );

  return (state.inspecoes || []).flatMap((inspection) => {
    const packageName = inspection?.pacote || inspection?.package || "Base SST";
    if (!includeInactivePackages && packageName !== "Base SST" && !activePackages.has(packageName)) {
      return [];
    }

    const nonConformities = Array.isArray(inspection?.nonConformityItems)
      ? inspection.nonConformityItems
      : [];

    return nonConformities
      .filter((item) => normalizeText(item?.origem) === "checklist_padrao")
      .map((item) => {
        const relatedStandardRisk = findRelatedStandardRisk(item, inspection);
        const riskKey = [
          item?.inspectionId || inspection?.id || "",
          item?.ruleId || "",
          "checklist_padrao",
          normalizeText(item?.titulo || relatedStandardRisk?.nome || ""),
        ].join("|");

        if (existingKeys.has(riskKey)) return null;

        const expectedEvidence = dedupeStrings([
          ...(Array.isArray(relatedStandardRisk?.evidenciasEsperadas)
            ? relatedStandardRisk.evidenciasEsperadas
            : []),
          ...(Array.isArray(inspection?.expectedEvidence) ? inspection.expectedEvidence : []),
        ]);
        const recommendedActions = dedupeStrings([
          item?.acaoRecomendada,
          ...(Array.isArray(relatedStandardRisk?.acoesRecomendadas)
            ? relatedStandardRisk.acoesRecomendadas
            : []),
          ...(Array.isArray(inspection?.recommendedActions) ? inspection.recommendedActions : []),
        ]);

        return {
          id: `auto-risk-${inspection?.id || "inspection"}-${item?.id || item?.ruleId || crypto.randomUUID()}`,
          titulo: item?.titulo || relatedStandardRisk?.nome || item?.pergunta || "Risco operacional",
          title: item?.titulo || relatedStandardRisk?.nome || item?.pergunta || "Risco operacional",
          descricao:
            item?.descricao ||
            `Não conformidade detectada na inspeção ${inspection?.titulo || inspection?.checklist || inspection?.id || ""}.`,
          atividade: inspection?.tipoInspecao || inspection?.activityLabel || inspection?.atividade || "",
          activityId: item?.activityId || inspection?.activityId || "",
          setor: inspection?.ondeUsar || inspection?.setor || item?.setor || "Geral",
          sectorId: item?.sectorId || inspection?.sectorId || "",
          nr: item?.nrCode || item?.nr || "",
          nrCode: item?.nrCode || item?.nr || "",
          inspection_id: item?.inspectionId || inspection?.id || "",
          inspecaoId: item?.inspectionId || inspection?.id || "",
          ruleId: item?.ruleId || "",
          severidade: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          nivel: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          gravidade: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          prioridade: item?.prioridade || relatedStandardRisk?.prioridadeSugerida || "Alta",
          status: "Aberto",
          pacote: packageName,
          package: packageName,
          origem: "checklist_padrao",
          tipoDeRisco: relatedStandardRisk?.nome || item?.titulo || item?.pergunta || "Risco operacional",
          riscoPadraoRelacionado: relatedStandardRisk || null,
          acaoRecomendada: recommendedActions[0] || "",
          acoesRecomendadas: recommendedActions,
          evidenciasEsperadas: expectedEvidence,
          expectedEvidence,
          recommendedAction: recommendedActions[0] || "",
          checklistId: inspection?.checklistId || inspection?.standardChecklistTemplate?.id || "",
          checklist: inspection?.checklist || inspection?.standardChecklistTemplate?.titulo || "",
          responsavel: inspection?.responsavel || "",
          created_at: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          updated_at: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          criadoEm: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          atualizadoEm: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
        };
      })
      .filter(Boolean);
  });
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
