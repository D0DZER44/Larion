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
  const filteredActions = (state.acoes || []).filter((action) => {
    const pacote = action?.pacote || action?.package || "Base SST";
    if (includeInactivePackages) return true;
    return pacote === "Base SST" || activePackages.has(pacote);
  });
  const risksById = Object.fromEntries((state.riscos || []).map((risk) => [risk.id, risk]));
  const dataset = mapStoreStateToMotorDataset({
    ...state,
    acoes: filteredActions,
  });

  return {
    metrics: calculateActionMetrics(dataset, options),
    chart: getActionsByStatusChart(dataset),
    actions: filteredActions.map((action) => {
      const relatedRisk = risksById[action.risk_id || action.riscoId || action.item_origem_id];
      const pacote = action.pacote || action.package || relatedRisk?.pacote || relatedRisk?.package || "Base SST";
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
          new Date().toISOString().split("T")[0],
        progresso: Number(action.progresso || 0),
        origem: action.origem || action.originText || (action.item_origem_tipo === "inspecao" ? "Inspeção" : action.item_origem_tipo === "risco" ? "Risco" : "Manual"),
        riscoId: action.riscoId || action.risk_id || (action.item_origem_tipo === "risco" ? action.item_origem_id : undefined),
        riscoVinculado: action.riscoVinculado || relatedRisk?.titulo || relatedRisk?.title || "",
        inspecaoId: action.inspecaoId || (action.item_origem_tipo === "inspecao" ? action.item_origem_id : undefined),
        checklistId: action.checklistId || "",
        perguntaOrigem: action.perguntaOrigem || "",
        respostaOrigem: action.respostaOrigem || "",
        nrRelacionada: action.nrRelacionada || action.nr || relatedRisk?.nr,
        pacote,
        multaEstimada: Number(action.multaEstimada || 0),
        chanceIncidente: action.chanceIncidente || "Baixa",
        criadoEm: action.criadoEm || action.createdAt || new Date().toISOString(),
        atualizadoEm: action.atualizadoEm || action.updatedAt || new Date().toISOString(),
        iniciadoEm: action.iniciadoEm || null,
        concluidoEm: action.concluidoEm || null,
        evidencia: action.evidencia || [],
        historico: action.historico || [],
      };
    }),
  };
}
