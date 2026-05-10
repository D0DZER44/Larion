import { mapStoreStateToMotorDataset } from "../bridge";
import { calcularMultaEstimada } from "../../risk-calculations";
import { calculateMaturityScore } from "../engine/maturityEngine.js";
import {
  generateActionInsights,
  generateExecutiveSummary,
  generateLariCriticalAlerts,
  generateLariDailyBriefing,
  generateLariRecommendedActions,
  generateNRInsights,
  generateOperationalInsights,
  generateRiskInsights,
} from "../engine/insightEngine.js";

const MONTHS_TO_SHOW = 6;
const INVALID_RESPONSIBLES = ["", "a definir", "equipe", "sistema"];
const CRITICAL_STATUSES = ["critico", "critica"];

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function average(values = []) {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (numericValues.length === 0) return 0;
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function percent(part, total, fallback = 0) {
  if (total <= 0) return fallback;
  return clamp((part / total) * 100);
}

function toTimestamp(value, fallback = Date.now()) {
  if (!value) return fallback;
  if (typeof value === "number") return value;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateOnlyTimestamp(value) {
  const timestamp = toTimestamp(value, NaN);
  if (!Number.isFinite(timestamp)) return NaN;
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function toMonthKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(value)
    .replace(".", "")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function buildRecentMonths(referenceTime = Date.now(), total = MONTHS_TO_SHOW) {
  const months = [];
  const current = new Date(referenceTime);
  current.setDate(1);
  current.setHours(0, 0, 0, 0);

  for (let index = total - 1; index >= 0; index -= 1) {
    const monthDate = new Date(current);
    monthDate.setMonth(current.getMonth() - index);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({
      key: toMonthKey(monthDate),
      label: formatMonthLabel(monthDate),
      cutoff: monthEnd.getTime(),
    });
  }

  return months;
}

function isResolved(status = "") {
  const normalized = normalizeText(status);
  return normalized.includes("resolvido") || normalized.includes("mitig");
}

function isCriticalRisk(risk = {}) {
  const normalized = normalizeText(risk.nivel || risk.level || risk.severity || risk.severidade || risk.prioridade || "");
  return CRITICAL_STATUSES.some((term) => normalized.includes(term));
}

function isRiskOpenAt(risk = {}, cutoff = Date.now()) {
  const createdAt = toTimestamp(risk.criadoEm || risk.created_at || risk.createdAt);
  if (createdAt > cutoff) return false;

  if (!isResolved(risk.status)) return true;

  const updatedAt = toTimestamp(risk.atualizadoEm || risk.updated_at || risk.updatedAt, createdAt);
  return updatedAt > cutoff;
}

function isActionCompleted(status = "") {
  const normalized = normalizeText(status);
  return normalized.includes("concl") || normalized.includes("fechad");
}

function isActionCancelled(status = "") {
  return normalizeText(status).includes("cancel");
}

function isActionCompletedAt(action = {}, cutoff = Date.now()) {
  if (!isActionCompleted(action.status)) return false;
  const completedAt = toTimestamp(action.concluidoEm || action.completedAt || action.atualizadoEm || action.updated_at || action.updatedAt || action.criadoEm || action.created_at);
  return completedAt <= cutoff;
}

function isActionOverdueAt(action = {}, cutoff = Date.now()) {
  const createdAt = toTimestamp(action.criadoEm || action.created_at || action.createdAt);
  if (createdAt > cutoff) return false;
  if (isActionCompletedAt(action, cutoff) || isActionCancelled(action.status)) return false;
  const dueAt = toDateOnlyTimestamp(action.prazo || action.deadlineTime || action.deadline);
  if (!Number.isFinite(dueAt)) return false;
  return dueAt < cutoff;
}

function hasEvidence(action = {}) {
  const evidencias = action.evidencias || action.evidenceIds || action.evidenceUrls || [];
  return Array.isArray(evidencias) && evidencias.length > 0;
}

function isInspectionCompleted(status = "") {
  const normalized = normalizeText(status);
  return normalized.includes("concl") || normalized.includes("realiz") || normalized.includes("finaliz") || normalized.includes("reprov");
}

function isInspectionCompletedAt(inspection = {}, cutoff = Date.now()) {
  if (!isInspectionCompleted(inspection.status || inspection.situacao)) return false;
  const completedAt = toTimestamp(inspection.atualizadoEm || inspection.updated_at || inspection.updatedAt || inspection.criadoEm || inspection.created_at || inspection.createdAt);
  return completedAt <= cutoff;
}

function isInspectionDelayedAt(inspection = {}, cutoff = Date.now()) {
  const createdAt = toTimestamp(inspection.criadoEm || inspection.created_at || inspection.createdAt);
  if (createdAt > cutoff) return false;
  if (isInspectionCompletedAt(inspection, cutoff)) return false;
  const normalizedStatus = normalizeText(inspection.status || inspection.situacao);
  if (normalizedStatus.includes("atrasad")) return true;
  const dueAt = toDateOnlyTimestamp(inspection.data || inspection.proximaInspecao || inspection.dueDate);
  if (!Number.isFinite(dueAt)) return false;
  return dueAt < cutoff;
}

function isResponsibleDefined(value = "") {
  return !INVALID_RESPONSIBLES.includes(normalizeText(value));
}

function isStatusDefined(value = "") {
  return normalizeText(value).length > 0;
}

function getRiskTypeLabel(risk = {}) {
  return risk.tipoDeRisco || risk.titulo || risk.title || risk.atividade || "Risco operacional";
}

function getInspectionTitle(inspection = {}) {
  return inspection.titulo || inspection.title || inspection.nome || inspection.checklist || "Inspecao";
}

function getActionTitle(action = {}) {
  return action.titulo || action.title || "Acao corretiva";
}

function getInspectionItems(inspection = {}) {
  if (Array.isArray(inspection.items)) return inspection.items;

  if (Array.isArray(inspection.answers)) {
    return inspection.answers.map((answer) => ({
      status: answer.status || answer.resposta || (answer.isConform === true ? "Sim" : answer.isConform === false ? "Nao" : "Pendente"),
      nr: answer.nr || answer.nrRelacionada,
      nrRelacionada: answer.nrRelacionada || answer.nr,
      text: answer.text || answer.pergunta || answer.label,
    }));
  }

  return [];
}

function normalizeChecklistStatus(item = {}) {
  const rawStatus = item.status || item.answer || item.resposta;
  if (item.isConform === true) return "conforme";
  if (item.isConform === false) return "nao-conforme";

  const normalized = normalizeText(rawStatus);
  if (normalized === "sim" || normalized === "conforme") return "conforme";
  if (normalized === "nao" || normalized === "nao conforme" || normalized === "não" || normalized === "parcialmente") return "nao-conforme";
  if (normalized === "n/a" || normalized === "na" || normalized === "nao aplicavel" || normalized === "não aplicavel") return "na";
  return "pendente";
}

function extractNrInspectionStats(inspections = [], cutoff = Date.now()) {
  return inspections.reduce(
    (accumulator, inspection) => {
      const createdAt = toTimestamp(inspection.criadoEm || inspection.created_at || inspection.createdAt);
      if (createdAt > cutoff) return accumulator;

      getInspectionItems(inspection).forEach((item) => {
        const nr = item.nr || item.nrRelacionada || item.nrBase;
        if (!nr) return;

        const status = normalizeChecklistStatus(item);
        if (status === "pendente" || status === "na") return;

        accumulator.total += 1;
        if (status === "conforme") {
          accumulator.conformes += 1;
        } else {
          accumulator.problemByNr[nr] = (accumulator.problemByNr[nr] || 0) + 1;
        }
      });

      return accumulator;
    },
    { conformes: 0, total: 0, problemByNr: {} },
  );
}

function buildRiskRecurrenceStats(risks = [], cutoff = Date.now()) {
  const eligibleRisks = risks.filter((risk) => toTimestamp(risk.criadoEm || risk.created_at || risk.createdAt) <= cutoff);
  const grouped = eligibleRisks.reduce((accumulator, risk) => {
    const key = `${normalizeText(risk.setor || risk.sector_id || "geral")}::${normalizeText(getRiskTypeLabel(risk))}`;
    accumulator[key] ||= { count: 0, sample: risk };
    accumulator[key].count += 1;
    return accumulator;
  }, {});

  const recurringGroups = Object.values(grouped).filter((entry) => entry.count > 1);
  const recurringOccurrences = recurringGroups.reduce((sum, entry) => sum + (entry.count - 1), 0);

  return {
    recurringGroups,
    recurringOccurrences,
    recurrenceRate: eligibleRisks.length > 0 ? (recurringOccurrences / eligibleRisks.length) * 100 : 0,
  };
}

function buildActionDisciplineStats(actions = [], cutoff = Date.now()) {
  return actions.reduce(
    (accumulator, action) => {
      const createdAt = toTimestamp(action.criadoEm || action.created_at || action.createdAt);
      if (createdAt > cutoff) return accumulator;

      accumulator.totalChecks += 3;
      if (isResponsibleDefined(action.responsavel)) accumulator.completedChecks += 1;
      if (Number.isFinite(toDateOnlyTimestamp(action.prazo || action.deadlineTime || action.deadline))) accumulator.completedChecks += 1;
      if (isStatusDefined(action.status)) accumulator.completedChecks += 1;
      return accumulator;
    },
    { totalChecks: 0, completedChecks: 0 },
  );
}

function buildRiskDisciplineStats(risks = [], cutoff = Date.now()) {
  return risks.reduce(
    (accumulator, risk) => {
      const createdAt = toTimestamp(risk.criadoEm || risk.created_at || risk.createdAt);
      if (createdAt > cutoff) return accumulator;

      accumulator.totalChecks += 2;
      if (isResponsibleDefined(risk.responsavel)) accumulator.completedChecks += 1;
      if (isStatusDefined(risk.status)) accumulator.completedChecks += 1;
      return accumulator;
    },
    { totalChecks: 0, completedChecks: 0 },
  );
}

function buildInspectionDisciplineStats(inspections = [], cutoff = Date.now()) {
  return inspections.reduce(
    (accumulator, inspection) => {
      const createdAt = toTimestamp(inspection.criadoEm || inspection.created_at || inspection.createdAt);
      if (createdAt > cutoff) return accumulator;

      accumulator.totalChecks += 3;
      if (isResponsibleDefined(inspection.responsavel || inspection.inspector)) accumulator.completedChecks += 1;
      if (Number.isFinite(toDateOnlyTimestamp(inspection.data || inspection.proximaInspecao || inspection.dueDate))) accumulator.completedChecks += 1;
      if (isStatusDefined(inspection.status || inspection.situacao)) accumulator.completedChecks += 1;
      return accumulator;
    },
    { totalChecks: 0, completedChecks: 0 },
  );
}

function buildDisciplineScore(state = {}, cutoff = Date.now()) {
  const actionChecks = buildActionDisciplineStats(state.acoes || [], cutoff);
  const riskChecks = buildRiskDisciplineStats(state.riscos || [], cutoff);
  const inspectionChecks = buildInspectionDisciplineStats(state.inspecoes || [], cutoff);
  const totalChecks = actionChecks.totalChecks + riskChecks.totalChecks + inspectionChecks.totalChecks;
  const completedChecks = actionChecks.completedChecks + riskChecks.completedChecks + inspectionChecks.completedChecks;

  return {
    score: totalChecks > 0 ? percent(completedChecks, totalChecks) : 0,
    totalChecks,
    completedChecks,
  };
}

function buildCurrentSnapshot(state = {}, cutoff = Date.now()) {
  const risks = (state.riscos || []).filter((risk) => toTimestamp(risk.criadoEm || risk.created_at || risk.createdAt) <= cutoff);
  const actions = (state.acoes || []).filter((action) => toTimestamp(action.criadoEm || action.created_at || action.createdAt) <= cutoff);
  const inspections = (state.inspecoes || []).filter((inspection) => toTimestamp(inspection.criadoEm || inspection.created_at || inspection.createdAt) <= cutoff);

  const openRisks = risks.filter((risk) => isRiskOpenAt(risk, cutoff));
  const criticalOpenRisks = openRisks.filter((risk) => isCriticalRisk(risk));
  const overdueActions = actions.filter((action) => isActionOverdueAt(action, cutoff));
  const completedActions = actions.filter((action) => isActionCompletedAt(action, cutoff));
  const completedInTime = completedActions.filter((action) => {
    const dueAt = toDateOnlyTimestamp(action.prazo || action.deadlineTime || action.deadline);
    const completedAt = toDateOnlyTimestamp(action.concluidoEm || action.completedAt || action.atualizadoEm || action.updated_at || action.updatedAt);
    if (!Number.isFinite(dueAt) || !Number.isFinite(completedAt)) return false;
    return completedAt <= dueAt;
  });
  const completedWithEvidence = completedActions.filter((action) => hasEvidence(action));
  const delayedInspections = inspections.filter((inspection) => isInspectionDelayedAt(inspection, cutoff));
  const pendingEvidenceActions = actions.filter((action) => {
    const createdAt = toTimestamp(action.criadoEm || action.created_at || action.createdAt);
    if (createdAt > cutoff) return false;
    if (hasEvidence(action)) return false;
    return Boolean(action.exigeEvidencia) || isActionCompletedAt(action, cutoff);
  });

  const recurrence = buildRiskRecurrenceStats(risks, cutoff);
  const nrStats = extractNrInspectionStats(inspections, cutoff);
  const discipline = buildDisciplineScore(state, cutoff);

  const preventionScore = inspections.length > 0 ? percent(inspections.filter((inspection) => isInspectionCompletedAt(inspection, cutoff)).length, inspections.length) : 0;
  const nrComplianceScore = nrStats.total > 0 ? percent(nrStats.conformes, nrStats.total) : 0;

  let correctionVelocityScore = 100;
  if (actions.length > 0) {
    correctionVelocityScore = completedActions.length > 0 ? percent(completedInTime.length, completedActions.length) : 0;
  }

  let evidenceScore = 100;
  if (actions.length > 0) {
    evidenceScore = completedActions.length > 0 ? percent(completedWithEvidence.length, completedActions.length) : 0;
  }

  const recurrenceScore = risks.length > 0 ? clamp(100 - recurrence.recurrenceRate) : 100;
  const criticalRiskPenalty = criticalOpenRisks.length === 0
    ? 0
    : Math.min(100, criticalOpenRisks.length * 12 + percent(criticalOpenRisks.length, Math.max(openRisks.length, 1)) * 0.4);
  const criticalRiskScore = clamp(100 - criticalRiskPenalty);

  const axes = [
    {
      key: "prevention",
      label: "Prevencao",
      value: preventionScore,
      detail: `${inspections.filter((inspection) => isInspectionCompletedAt(inspection, cutoff)).length}/${inspections.length || 0} inspecoes concluidas`,
    },
    {
      key: "nrCompliance",
      label: "Conformidade NR",
      value: nrComplianceScore,
      detail: `${nrStats.conformes}/${nrStats.total || 0} itens conformes em NR`,
    },
    {
      key: "correctionSpeed",
      label: "Velocidade de correcao",
      value: correctionVelocityScore,
      detail: `${completedInTime.length}/${completedActions.length || 0} acoes no prazo`,
    },
    {
      key: "evidence",
      label: "Evidencias",
      value: evidenceScore,
      detail: `${completedWithEvidence.length}/${completedActions.length || 0} acoes concluidas com evidencia`,
    },
    {
      key: "recurrence",
      label: "Reincidencia",
      value: recurrenceScore,
      detail: `${recurrence.recurringGroups.length} grupos recorrentes detectados`,
    },
    {
      key: "criticalRisk",
      label: "Risco critico",
      value: criticalRiskScore,
      detail: `${criticalOpenRisks.length} riscos criticos abertos`,
    },
    {
      key: "discipline",
      label: "Disciplina operacional",
      value: discipline.score,
      detail: `${discipline.completedChecks}/${discipline.totalChecks || 0} validacoes operacionais completas`,
    },
  ];

  const weightedScore = average([
    axes.find((item) => item.key === "prevention")?.value * 1.05,
    axes.find((item) => item.key === "nrCompliance")?.value * 1.1,
    axes.find((item) => item.key === "correctionSpeed")?.value,
    axes.find((item) => item.key === "evidence")?.value * 0.95,
    axes.find((item) => item.key === "recurrence")?.value,
    axes.find((item) => item.key === "criticalRisk")?.value * 1.15,
    axes.find((item) => item.key === "discipline")?.value,
  ]);

  const conformidadeNr = nrComplianceScore;
  const evidencePending = pendingEvidenceActions.length;

  return {
    cutoff,
    inspections,
    risks,
    actions,
    openRisks,
    criticalOpenRisks,
    overdueActions,
    delayedInspections,
    pendingEvidenceActions,
    completedActions,
    completedInTime,
    completedWithEvidence,
    recurrence,
    nrStats,
    discipline,
    conformidadeNr,
    evidencePending,
    axes,
    score: clamp(weightedScore),
  };
}

function buildBottleneckSummary(snapshot = {}, previousSnapshot = null) {
  const sortedAxes = [...(snapshot.axes || [])].sort((left, right) => left.value - right.value);
  const weakestAxis = sortedAxes[0] || { key: "discipline", label: "Disciplina operacional", value: 0 };
  const strongestAxis = [...sortedAxes].reverse()[0] || weakestAxis;

  let biggestDrop = null;
  if (previousSnapshot && Array.isArray(previousSnapshot.axes)) {
    biggestDrop = snapshot.axes
      .map((axis) => {
        const previous = previousSnapshot.axes.find((item) => item.key === axis.key);
        return {
          ...axis,
          delta: axis.value - (previous ? previous.value : axis.value),
        };
      })
      .sort((left, right) => left.delta - right.delta)[0];
  }

  return {
    weakestAxis,
    strongestAxis,
    biggestDrop,
  };
}

function buildOperationalSummary(snapshot = {}, insightsVm = {}) {
  const level = snapshot.score >= 85
    ? "alto controle"
    : snapshot.score >= 70
      ? "operacao estavel"
      : snapshot.score >= 55
        ? "atencao moderada"
        : "pressao operacional";

  const criticalCount = snapshot.criticalOpenRisks?.length || 0;
  const overdueCount = snapshot.overdueActions?.length || 0;
  const pendingEvidence = snapshot.pendingEvidenceActions?.length || 0;
  const baseSummary = insightsVm.executiveSummary?.summary;

  if (baseSummary) {
    return `${baseSummary} O radar indica ${level}, com ${pendingEvidence} pendencias de evidencia.`;
  }

  return `${criticalCount} riscos criticos abertos, ${overdueCount} acoes vencidas e ${pendingEvidence} evidencias pendentes mantem a maturidade em ${level}.`;
}

function buildDiagnosis(snapshot = {}, previousSnapshot = null, intelligenceVm = {}) {
  const bottlenecks = buildBottleneckSummary(snapshot, previousSnapshot);
  const weakest = bottlenecks.weakestAxis;
  const strongest = bottlenecks.strongestAxis;
  const recommendedFromVm = intelligenceVm.recommendedActions?.[0];

  let hiddenRisk = "A trilha operacional esta equilibrada, sem risco oculto dominante identificado.";
  if ((snapshot.pendingEvidenceActions?.length || 0) > 0 && weakest.key !== "evidence") {
    hiddenRisk = "Ha conclusoes sem rastreabilidade suficiente. A ausencia de evidencia pode mascarar ganhos de score.";
  } else if ((snapshot.recurrence?.recurringGroups?.length || 0) > 0 && (snapshot.criticalOpenRisks?.length || 0) === 0) {
    hiddenRisk = "A reincidencia esta crescendo antes de virar risco critico aberto em massa.";
  } else if ((snapshot.overdueActions?.length || 0) > 0 && (snapshot.delayedInspections?.length || 0) > 0) {
    hiddenRisk = "A agenda operacional esta comprimida: inspeções atrasadas e correcoes vencidas tendem a derrubar o proximo ciclo.";
  }

  const actionByAxis = {
    prevention: "Reprogramar inspeções vencidas e redistribuir a agenda critica das proximas duas semanas.",
    nrCompliance: "Revisar checklists vinculados a NRs com maior volume de nao conformidade e padronizar resposta em campo.",
    correctionSpeed: "Atacar a fila de acoes concluidas fora do prazo com um mutirao de fechamento por responsavel.",
    evidence: "Vincular evidencias nas acoes ja concluidas antes de abrir novas frentes operacionais.",
    recurrence: "Executar plano de causa-raiz por setor/tipo de risco repetido e validar barreiras preventivas.",
    criticalRisk: "Abrir resposta imediata para riscos criticos abertos e acompanhar diariamente ate mitigacao.",
    discipline: "Cobrar responsavel, prazo e status obrigatorios em todos os registros abertos nesta semana.",
  };

  return {
    strength: {
      label: "Ponto forte",
      title: strongest.label,
      description: strongest.detail,
    },
    weakness: {
      label: "Ponto fraco",
      title: weakest.label,
      description: weakest.detail,
    },
    hiddenRisk: {
      label: "Risco oculto",
      title: bottlenecks.biggestDrop?.label || "Tendencia monitorada",
      description: hiddenRisk,
    },
    recommendedAction: {
      label: "Acao recomendada",
      title: weakest.label,
      description: recommendedFromVm || actionByAxis[weakest.key] || "Atuar no eixo com menor score nas proximas 24 horas.",
    },
  };
}

function buildTrendSeries(state = {}, referenceTime = Date.now()) {
  const months = buildRecentMonths(referenceTime);
  const series = months.map((month) => {
    const snapshot = buildCurrentSnapshot(state, month.cutoff);
    return {
      key: month.key,
      label: month.label,
      score: Math.round(snapshot.score),
      riscosCriticos: snapshot.criticalOpenRisks.length,
      acoesVencidas: snapshot.overdueActions.length,
      conformidadeNr: Math.round(snapshot.conformidadeNr),
      evidenciasPendentes: snapshot.evidencePending,
      snapshot,
    };
  });

  return {
    months,
    series,
  };
}

function buildRankings(state = {}, snapshot = {}, previousSnapshot = null) {
  const sectorMap = {};
  snapshot.openRisks.forEach((risk) => {
    const sector = risk.setor || risk.sector_id || "Geral";
    sectorMap[sector] = (sectorMap[sector] || 0) + 1;
  });
  const sectorEntry = Object.entries(sectorMap).sort((left, right) => right[1] - left[1])[0];

  const nrComplianceByNr = snapshot.nrStats.problemByNr || {};
  const nrEntry = Object.entries(nrComplianceByNr).sort((left, right) => right[1] - left[1])[0];

  const overdueByResponsible = snapshot.overdueActions.reduce((accumulator, action) => {
    const responsible = action.responsavel || "Sem responsavel";
    accumulator[responsible] = (accumulator[responsible] || 0) + 1;
    return accumulator;
  }, {});
  const responsibleEntry = Object.entries(overdueByResponsible).sort((left, right) => right[1] - left[1])[0];

  const recurringTypes = snapshot.recurrence.recurringGroups.reduce((accumulator, entry) => {
    const type = getRiskTypeLabel(entry.sample);
    accumulator[type] = (accumulator[type] || 0) + entry.count;
    return accumulator;
  }, {});
  const recurringTypeEntry = Object.entries(recurringTypes).sort((left, right) => right[1] - left[1])[0];

  const biggestDrop = buildBottleneckSummary(snapshot, previousSnapshot).biggestDrop;

  return [
    {
      id: "sector",
      label: "Setor com mais risco",
      value: sectorEntry ? sectorEntry[0] : "Sem dados suficientes",
      meta: sectorEntry ? `${sectorEntry[1]} riscos abertos` : "O radar precisa de riscos ativos para rankear setores.",
    },
    {
      id: "nr",
      label: "NR mais problematica",
      value: nrEntry ? nrEntry[0] : "Sem base normativa",
      meta: nrEntry ? `${nrEntry[1]} itens nao conformes vinculados` : "Ainda nao ha itens avaliados com NR vinculada.",
    },
    {
      id: "responsible",
      label: "Responsavel com mais acoes atrasadas",
      value: responsibleEntry ? responsibleEntry[0] : "Sem atrasos atuais",
      meta: responsibleEntry ? `${responsibleEntry[1]} acoes vencidas` : "Nao ha backlog vencido por responsavel.",
    },
    {
      id: "riskType",
      label: "Tipo de risco mais recorrente",
      value: recurringTypeEntry ? recurringTypeEntry[0] : "Sem reincidencia relevante",
      meta: recurringTypeEntry ? `${recurringTypeEntry[1]} ocorrencias em repeticao` : "Nenhum padrao recorrente no momento.",
    },
    {
      id: "dropCause",
      label: "Principal causa de queda do score",
      value: biggestDrop ? biggestDrop.label : buildBottleneckSummary(snapshot).weakestAxis.label,
      meta: biggestDrop ? `${Math.round(biggestDrop.delta)} pts versus o mes anterior` : "Sem base historica anterior, usando o menor eixo atual.",
    },
  ];
}

function resolveEventImpact(log = {}, related = {}) {
  const type = normalizeText(log.event_type || log.eventType || "");
  if (type.includes("acao_concl")) return 8;
  if (type.includes("acao_ger")) return -3;
  if (type.includes("risco_ger")) return related.risk && isCriticalRisk(related.risk) ? -8 : -5;
  if (type.includes("motor_process")) return Number(log.metadata?.risks || 0) > 0 ? -4 : 2;
  if (type.includes("inspecao_criad")) return 1;
  if (type.includes("inspecao_edit")) return 0;
  return 0;
}

function buildTimeline(state = {}, snapshot = {}, referenceTime = Date.now()) {
  const risksById = Object.fromEntries((state.riscos || []).map((risk) => [risk.id, risk]));
  const actionsById = Object.fromEntries((state.acoes || []).map((action) => [action.id, action]));
  const inspectionsById = Object.fromEntries((state.inspecoes || []).map((inspection) => [inspection.id, inspection]));

  const events = (state.logs || [])
    .map((log) => {
      const originType = normalizeText(log.origin_type || "");
      const action = originType === "acao" ? actionsById[log.origin_id] : null;
      const risk = originType === "risco" ? risksById[log.origin_id] : action ? risksById[action.riscoId || action.riskId] : null;
      const inspection = originType === "inspecao"
        ? inspectionsById[log.origin_id]
        : action
          ? inspectionsById[action.inspecaoId || action.inspection_id]
          : risk
            ? inspectionsById[risk.inspecaoId || risk.inspection_id]
            : null;

      const timestamp = toTimestamp(log.created_at || log.createdAt);
      if (timestamp > referenceTime) return null;

      return {
        id: log.id,
        timestamp,
        stage: originType === "acao" ? "Acao" : originType === "risco" ? "Risco" : "Inspecao",
        title: log.description || "Evento operacional registrado",
        description: [
          inspection ? `Inspecao: ${getInspectionTitle(inspection)}` : null,
          risk ? `Risco: ${getRiskTypeLabel(risk)}` : null,
          action ? `Acao: ${getActionTitle(action)}` : null,
        ].filter(Boolean).join(" | "),
        impact: resolveEventImpact(log, { risk, action, inspection }),
        href: originType === "acao" ? "/operacao/acoes" : originType === "risco" ? "/operacao/riscos" : "/operacao/inspecoes",
        chain: [inspection ? "Inspecao" : null, risk ? "Risco" : null, action ? "Acao" : null].filter(Boolean),
      };
    })
    .filter(Boolean);

  const derivedEvidenceEvents = snapshot.completedActions
    .filter((action) => hasEvidence(action))
    .map((action) => ({
      id: `evidence-${action.id}`,
      timestamp: toTimestamp(action.atualizadoEm || action.updated_at || action.updatedAt || action.criadoEm || action.created_at),
      stage: "Evidencia",
      title: `Evidencia consolidada em ${getActionTitle(action)}`,
      description: `Acao ${action.responsavel || "sem responsavel"} fechada com rastreabilidade registrada.`,
      impact: 6,
      href: "/operacao/acoes",
      chain: ["Acao", "Evidencia"],
    }));

  const derivedDeadlineEvents = snapshot.overdueActions.map((action) => ({
    id: `deadline-${action.id}`,
    timestamp: toTimestamp(action.prazo || action.deadlineTime || action.deadline, Date.now()),
    stage: "Prazo",
    title: `Prazo vencido em ${getActionTitle(action)}`,
    description: `Responsavel: ${action.responsavel || "nao definido"} | Prazo: ${action.prazo || "nao informado"}`,
    impact: -5,
    href: "/operacao/acoes",
    chain: ["Acao", "Prazo"],
  }));

  return [...events, ...derivedEvidenceEvents, ...derivedDeadlineEvents]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 10);
}

function buildHeaderCards(snapshot = {}) {
  const recurrenceCount = snapshot.recurrence.recurringGroups.length;
  return [
    {
      id: "criticalOpen",
      label: "Riscos criticos abertos",
      value: snapshot.criticalOpenRisks.length,
      sub: snapshot.criticalOpenRisks.length > 0 ? `${snapshot.openRisks.length} riscos ativos no total` : "Sem criticidade aberta agora",
      tone: "critical",
      href: "/operacao/riscos",
    },
    {
      id: "overdueActions",
      label: "Acoes vencidas",
      value: snapshot.overdueActions.length,
      sub: snapshot.overdueActions.length > 0 ? "Backlog fora do SLA operacional" : "SLA corrente sem vencimentos",
      tone: "warning",
      href: "/operacao/acoes",
    },
    {
      id: "delayedInspections",
      label: "Inspecoes atrasadas",
      value: snapshot.delayedInspections.length,
      sub: snapshot.delayedInspections.length > 0 ? "Agenda fora do planejado" : "Agenda em dia",
      tone: "info",
      href: "/operacao/inspecoes",
    },
    {
      id: "pendingEvidence",
      label: "Evidencias pendentes",
      value: snapshot.evidencePending,
      sub: snapshot.evidencePending > 0 ? "Fechamentos sem rastreabilidade completa" : "Rastreabilidade consistente",
      tone: "neutral",
      href: "/operacao/acoes",
    },
    {
      id: "recurrence",
      label: "Reincidencia",
      value: recurrenceCount,
      sub: recurrenceCount > 0 ? `${Math.round(snapshot.recurrence.recurrenceRate)}% do parque com repeticao` : "Sem repeticao relevante",
      tone: "warning",
      href: "/operacao/riscos",
    },
    {
      id: "nrCompliance",
      label: "Conformidade NR",
      value: `${Math.round(snapshot.conformidadeNr)}%`,
      sub: snapshot.nrStats.total > 0 ? `${snapshot.nrStats.conformes}/${snapshot.nrStats.total} itens avaliados` : "Sem itens normativos avaliados",
      tone: "success",
      href: "/operacao/inspecoes",
    },
  ];
}

function resolveScoreLevel(score = 0) {
  if (score >= 85) return "Maturidade elevada";
  if (score >= 70) return "Maturidade consistente";
  if (score >= 55) return "Maturidade controlada";
  if (score >= 35) return "Maturidade fragil";
  return "Maturidade inicial";
}

export function buildIntelligenceViewModel(state = {}) {
  const dataset = mapStoreStateToMotorDataset(state);
  return {
    dataset,
    maturity: calculateMaturityScore(dataset),
    briefing: generateLariDailyBriefing(dataset),
    alerts: generateLariCriticalAlerts(dataset),
    recommendedActions: generateLariRecommendedActions(dataset),
    executiveSummary: generateExecutiveSummary(dataset),
    sections: {
      operational: generateOperationalInsights(dataset),
      risks: generateRiskInsights(dataset),
      actions: generateActionInsights(dataset),
      normative: generateNRInsights(dataset),
    },
  };
}

export function calculateMaturityRadarAxes(state = {}, cutoff = Date.now()) {
  return buildCurrentSnapshot(state, cutoff).axes;
}

export function calculateMaturityExecutiveSummary(state = {}, referenceTime = Date.now()) {
  const currentSnapshot = buildCurrentSnapshot(state, referenceTime);
  const trend = buildTrendSeries(state, referenceTime);
  const previousSeries = trend.series[trend.series.length - 2];
  const previousSnapshot = previousSeries ? previousSeries.snapshot : null;
  const bottlenecks = buildBottleneckSummary(currentSnapshot, previousSnapshot);
  const intelligenceVm = buildIntelligenceViewModel(state);
  const delta = currentSnapshot.score - (previousSnapshot ? previousSnapshot.score : currentSnapshot.score);

  return {
    score: Math.round(currentSnapshot.score),
    previousScore: Math.round(previousSnapshot ? previousSnapshot.score : currentSnapshot.score),
    delta: Math.round(delta * 10) / 10,
    bottleneck: bottlenecks.weakestAxis.label,
    summary: buildOperationalSummary(currentSnapshot, intelligenceVm),
    level: resolveScoreLevel(currentSnapshot.score),
    scoreLabel: bottlenecks.weakestAxis.detail,
    snapshot: currentSnapshot,
    previousSnapshot,
    intelligenceVm,
    trend,
  };
}

export function buildMaturityMonthlyTrend(state = {}, referenceTime = Date.now()) {
  return buildTrendSeries(state, referenceTime);
}

export function buildMaturityDiagnosis(state = {}, referenceTime = Date.now()) {
  const executive = calculateMaturityExecutiveSummary(state, referenceTime);
  return buildDiagnosis(executive.snapshot, executive.previousSnapshot, executive.intelligenceVm);
}

export function buildMaturityTimeline(state = {}, referenceTime = Date.now()) {
  const snapshot = buildCurrentSnapshot(state, referenceTime);
  return buildTimeline(state, snapshot, referenceTime);
}

export function buildTargetCentralPageModel(state = {}) {
  const referenceTime = Date.now();
  const hasOperationalData = Boolean(
    (state.inspecoes || []).length ||
    (state.riscos || []).length ||
    (state.acoes || []).length ||
    (state.logs || []).length,
  );

  const executive = calculateMaturityExecutiveSummary(state, referenceTime);
  const diagnosis = buildDiagnosis(executive.snapshot, executive.previousSnapshot, executive.intelligenceVm);
  const rankings = buildRankings(state, executive.snapshot, executive.previousSnapshot);
  const timeline = buildTimeline(state, executive.snapshot, referenceTime);
  const topCards = buildHeaderCards(executive.snapshot);
  const trend = executive.trend;
  const engineScore = executive.intelligenceVm.maturity;

  return {
    hasOperationalData,
    executive: {
      score: executive.score,
      previousScore: executive.previousScore,
      delta: executive.delta,
      bottleneck: executive.bottleneck,
      summary: executive.summary,
      level: executive.level,
      scoreLabel: executive.scoreLabel,
      engineScore: Math.round(engineScore.scorePercent),
    },
    topCards,
    radarAxes: executive.snapshot.axes.map((axis) => ({
      ...axis,
      value: Math.round(axis.value),
    })),
    diagnosis,
    trend: {
      series: trend.series.map((item) => ({
        label: item.label,
        score: item.score,
        riscosCriticos: item.riscosCriticos,
        acoesVencidas: item.acoesVencidas,
        conformidadeNr: item.conformidadeNr,
        evidenciasPendentes: item.evidenciasPendentes,
      })),
      latestLabel: trend.series[trend.series.length - 1]?.label || "Atual",
    },
    rankings,
    timeline,
    automaticInsights: [
      ...executive.intelligenceVm.sections.operational,
      ...executive.intelligenceVm.sections.actions,
      ...executive.intelligenceVm.sections.normative,
    ].slice(0, 4),
    criticalAlerts: executive.intelligenceVm.alerts.slice(0, 3),
  };
}

function isResolvedRiskStatus(status = "") {
  return isResolved(status);
}

export function buildNormativeMotorViewModel(state = {}) {
  const riscos = state.riscos || [];
  const regrasMap = {};
  let estimada = 0;
  let evitada = 0;
  let regrasAcionadasCount = 0;

  riscos.forEach((risk) => {
    const multa = Number(risk.multaEstimada || calcularMultaEstimada(risk).multaEstimada || 0);
    const resolved = isResolvedRiskStatus(risk.status);
    if (resolved) evitada += multa;
    else estimada += multa;

    if (risk.nr) {
      regrasMap[risk.nr] ||= { count: 0, multaEstimada: 0, evitada: 0, detalhes: [] };
      regrasMap[risk.nr].count += 1;
      if (resolved) regrasMap[risk.nr].evitada += multa;
      else regrasMap[risk.nr].multaEstimada += multa;
      regrasMap[risk.nr].detalhes.push(risk);
      regrasAcionadasCount += 1;
    }
  });

  return {
    estimada,
    evitada,
    regrasAcionadasCount,
    regrasData: Object.entries(regrasMap)
      .map(([nr, stats]) => ({ nr, ...stats }))
      .sort((left, right) => right.multaEstimada - left.multaEstimada),
  };
}
