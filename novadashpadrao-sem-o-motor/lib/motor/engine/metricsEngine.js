import { normalizeDataset } from "../core/normalizeEngine.js";
import { getYearMonthKey, getYearWeekKey, isOverdue, toIsoDate } from "../core/dateUtils.js";
import { SEVERITY_WEIGHTS } from "../core/constants.js";

function ensureDataset(input = {}) {
  return Array.isArray(input)
    ? { inspections: [], nonConformities: [], risks: input, actions: [] }
    : normalizeDataset(input);
}

function groupCount(items, keyFactory) {
  return items.reduce((accumulator, item) => {
    const key = keyFactory(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

export function calculateInspectionMetrics(input = {}) {
  const { inspections } = ensureDataset(input);
  const total = inspections.length;
  const completed = inspections.filter((item) => item.status === "Concluída").length;
  const pending = inspections.filter((item) => item.status === "Agendada" || item.status === "Em andamento").length;

  return {
    total,
    completed,
    pending,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

export function calculateRiskMetrics(input = {}) {
  const { risks } = ensureDataset(input);
  return {
    total: risks.length,
    open: risks.filter((item) => item.status === "Aberto").length,
    critical: risks.filter((item) => item.status === "Aberto" && item.severidade === "Crítica").length,
    bySeverity: ["Baixa", "Média", "Alta", "Crítica"].map((severity) => ({
      severity,
      value: risks.filter((item) => item.severidade === severity).length,
    })),
  };
}

export function calculateActionMetrics(input = {}, options = {}) {
  const { actions } = ensureDataset(input);
  const referenceDate = options.referenceDate || Date.now();
  const total = actions.length;
  const completed = actions.filter((item) => item.status === "Concluída").length;
  const open = actions.filter((item) => item.status === "Pendente" || item.status === "Em andamento" || item.status === "Reaberta").length;
  const overdue = actions.filter((item) => item.status !== "Concluída" && isOverdue(item.prazo, referenceDate)).length;
  const withoutEvidence = actions.filter((item) => item.status !== "Concluída" && item.evidencias.length === 0).length;

  return {
    total,
    open,
    completed,
    overdue,
    withoutEvidence,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

export function calculateNRCompliance(input = {}) {
  const { risks, nonConformities } = ensureDataset(input);
  const accumulator = {};

  [...nonConformities, ...risks].forEach((item) => {
    const nr = item.nr || "Sem NR";
    if (!accumulator[nr]) {
      accumulator[nr] = { nr, total: 0, open: 0 };
    }
    accumulator[nr].total += 1;
    if (item.status === "Aberto" || item.status === "Aberta" || item.status === "Em análise") {
      accumulator[nr].open += 1;
    }
  });

  return Object.values(accumulator).map((entry) => ({
    ...entry,
    compliance: entry.total > 0 ? ((entry.total - entry.open) / entry.total) * 100 : 100,
  }));
}

export function calculateSectorRanking(input = {}) {
  const { inspections, risks, actions } = ensureDataset(input);
  const accumulator = {};

  inspections.forEach((item) => {
    const sector = item.setor || "Geral";
    accumulator[sector] ||= { chave: sector, inspecoes: 0, riscos: 0, acoes: 0, scoreRelativo: 0 };
    accumulator[sector].inspecoes += 1;
  });

  risks.forEach((item) => {
    const sector = item.setor || "Geral";
    accumulator[sector] ||= { chave: sector, inspecoes: 0, riscos: 0, acoes: 0, scoreRelativo: 0 };
    accumulator[sector].riscos += 1;
    accumulator[sector].scoreRelativo += SEVERITY_WEIGHTS[item.severidade] || 1;
  });

  actions.forEach((item) => {
    const sector = item.setor || item.riskSector || "Geral";
    accumulator[sector] ||= { chave: sector, inspecoes: 0, riscos: 0, acoes: 0, scoreRelativo: 0 };
    accumulator[sector].acoes += 1;
  });

  return Object.values(accumulator).sort((left, right) => right.scoreRelativo - left.scoreRelativo);
}

export function calculateResponsibleRanking(input = {}) {
  const { inspections, actions } = ensureDataset(input);
  const accumulator = {};

  inspections.forEach((item) => {
    const responsible = item.responsavel || "A definir";
    accumulator[responsible] ||= { chave: responsible, inspecoes: 0, acoes: 0, concluidas: 0, scoreRelativo: 0 };
    accumulator[responsible].inspecoes += 1;
  });

  actions.forEach((item) => {
    const responsible = item.responsavel || "A definir";
    accumulator[responsible] ||= { chave: responsible, inspecoes: 0, acoes: 0, concluidas: 0, scoreRelativo: 0 };
    accumulator[responsible].acoes += 1;
    if (item.status === "Concluída") {
      accumulator[responsible].concluidas += 1;
      accumulator[responsible].scoreRelativo += 10;
    }
  });

  return Object.values(accumulator).sort((left, right) => right.scoreRelativo - left.scoreRelativo);
}

export function calculateSLAIndicators(input = {}, options = {}) {
  const { actions } = ensureDataset(input);
  const referenceDate = options.referenceDate || Date.now();
  const today = toIsoDate(referenceDate);
  const overdue = actions.filter((item) => item.status !== "Concluída" && item.prazo < today).length;
  const compliant = actions.filter((item) => item.status === "Concluída" || item.prazo >= today).length;
  const total = actions.length;

  return {
    total,
    compliant,
    overdue,
    complianceRate: total > 0 ? (compliant / total) * 100 : 100,
  };
}

export function calculateRecurrenceIndicators(input = {}) {
  const { nonConformities } = ensureDataset(input);
  const grouped = groupCount(nonConformities, (item) => `${item.nr || "Sem NR"}:${item.setor}:${item.ruleId || item.pergunta}`);
  const recurringEntries = Object.entries(grouped).filter(([, value]) => value > 1);

  return {
    total: nonConformities.length,
    recurring: recurringEntries.length,
    recurrenceRate: nonConformities.length > 0 ? (recurringEntries.length / nonConformities.length) * 100 : 0,
    grouped,
  };
}

export function calculateDashboardMetrics(input = {}, options = {}) {
  const dataset = ensureDataset(input);
  const inspectionMetrics = calculateInspectionMetrics(dataset);
  const riskMetrics = calculateRiskMetrics(dataset);
  const actionMetrics = calculateActionMetrics(dataset, options);
  const nrCompliance = calculateNRCompliance(dataset);
  const sectorRanking = calculateSectorRanking(dataset);
  const responsibleRanking = calculateResponsibleRanking(dataset);
  const recurrenceIndicators = calculateRecurrenceIndicators(dataset);
  const risksBySector = Object.entries(groupCount(dataset.risks, (item) => item.setor || "Geral")).map(([name, value]) => ({ name, value }));

  return {
    totalInspections: inspectionMetrics.total,
    completedInspections: inspectionMetrics.completed,
    pendingInspections: inspectionMetrics.pending,
    totalRisks: riskMetrics.total,
    openRisks: riskMetrics.open,
    openCriticalRisks: riskMetrics.critical,
    totalActions: actionMetrics.total,
    pendingActions: actionMetrics.open,
    overdueActions: actionMetrics.overdue,
    actionsWithoutEvidence: actionMetrics.withoutEvidence,
    actionsCompleted: actionMetrics.completed,
    inspectionCompletionRate: inspectionMetrics.completionRate,
    actionCompletionRate: actionMetrics.completionRate,
    nrCompliance,
    sectorRanking,
    responsibleRanking,
    slaIndicators: calculateSLAIndicators(dataset, options),
    recurrenceIndicators,
    risksBySector,
  };
}

export function getTimeAggregation(items = [], mode = "month") {
  const keyFactory = mode === "week"
    ? (item) => getYearWeekKey(item.createdAt)
    : (item) => getYearMonthKey(item.createdAt);

  return Object.entries(groupCount(items, keyFactory))
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
