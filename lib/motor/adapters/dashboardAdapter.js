import { normalizeDataset } from "../core/normalizeEngine.js";
import { getActionsByStatusChart, getMonthlyTrendChart, getNRComplianceChart, getRiskByNRChart, getRiskBySectorChart } from "../engine/chartEngine.js";
import { generateExecutiveSummary, generateLariCriticalAlerts, generateLariDailyBriefing, generateLariRecommendedActions } from "../engine/insightEngine.js";
import { calculateDashboardMetrics } from "../engine/metricsEngine.js";

export function adaptDashboardDataset(state = {}) {
  return normalizeDataset(state);
}

export function buildDashboardViewModel(state = {}, options = {}) {
  const dataset = adaptDashboardDataset(state);
  return {
    metrics: calculateDashboardMetrics(dataset, options),
    charts: {
      risksBySector: getRiskBySectorChart(dataset),
      risksByNR: getRiskByNRChart(dataset),
      actionsByStatus: getActionsByStatusChart(dataset),
      monthlyTrend: getMonthlyTrendChart(dataset),
      nrCompliance: getNRComplianceChart(dataset),
    },
    briefing: generateLariDailyBriefing(dataset),
    alerts: generateLariCriticalAlerts(dataset),
    executiveSummary: generateExecutiveSummary(dataset),
  };
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function severityWeight(level = "") {
  const normalized = normalizeText(level);
  if (normalized.includes("crit")) return 4;
  if (normalized.includes("alta") || normalized.includes("alto")) return 3;
  if (normalized.includes("media") || normalized.includes("medio")) return 2;
  return 1;
}

function classifyScore(score = 0) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Atenção";
  return "Crítico";
}

function formatScoreSeries(monthlyTrend = [], fallbackScore = 0, scoreTimeRange = "semana") {
  if (monthlyTrend.length === 0) {
    if (scoreTimeRange === "dia") {
      return ["08:00", "12:00", "16:00"].map((name) => ({ name, value: fallbackScore }));
    }
    if (scoreTimeRange === "semana") {
      return ["Seg", "Ter", "Qua", "Qui", "Sex"].map((name) => ({ name, value: fallbackScore }));
    }
    return ["S1", "S2", "S3", "S4"].map((name) => ({ name, value: fallbackScore }));
  }

  return monthlyTrend.slice(-5).map((item) => ({
    name: item.date || item.name || item.label,
    value: Math.max(0, 100 - ((item.risks || 0) * 8 + (item.actions || 0) * 4)),
  }));
}

export function buildTargetDashboardPageModel(state = {}, options = {}) {
  const dashboard = buildDashboardViewModel(state, options);
  const activeRisks = (state.riscos || []).filter((item) => !["resolvido", "mitigado"].includes(normalizeText(item.status)));
  const totalRiskCount = activeRisks.length || 1;
  const totalWorkersExposed = activeRisks.reduce((sum, item) => sum + Number(item.trabalhadoresExpostos || 0), 0);
  const riskSectorData = (dashboard.charts.risksBySector || []).map((item, index) => {
    const risksInSector = activeRisks.filter((risk) => (risk.setor || risk.sector_id || "Outros") === item.name);
    const avgSeverity = risksInSector.length > 0
      ? risksInSector.reduce((sum, risk) => sum + severityWeight(risk.nivel || risk.severidade || risk.prioridade), 0) / risksInSector.length
      : 0;

    return {
      ...item,
      percent: Math.round((item.value / totalRiskCount) * 100),
      avgPriorityLabel: avgSeverity >= 3.5 ? "Crítica" : avgSeverity >= 2.5 ? "Alta" : avgSeverity >= 1.5 ? "Média" : "Baixa",
      color: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#64748b"][index % 6],
    };
  });

  const nrCompliance = (dashboard.charts.nrCompliance || []).slice(0, 5).map((item) => ({
    nr: item.name,
    val: item.value,
    color: item.value >= 70 ? "bg-emerald-500" : item.value >= 40 ? "bg-orange-500" : "bg-red-500",
  }));

  const executiveSummary = dashboard.executiveSummary || {};
  const openRisksCount = dashboard.metrics?.openRisks || 0;
  const overdueActions = dashboard.metrics?.overdueActions || 0;
  const pendingInspections = dashboard.metrics?.pendingInspections || 0;
  const openCriticalRisks = dashboard.metrics?.openCriticalRisks || 0;
  const operationalScore = Math.max(0, Math.min(100, 100 - openCriticalRisks * 12 - overdueActions * 6 - pendingInspections * 4));

  return {
    dashboard,
    riskSectorData: riskSectorData.length > 0 ? riskSectorData : [{ name: "Sem dados", value: 1, percent: 100, avgPriorityLabel: "N/A", color: "#374151", isEmpty: true }],
    conformidadeNR: nrCompliance,
    topRisks: [...activeRisks]
      .sort((left, right) => Number(right.chanceIncidente || 0) - Number(left.chanceIncidente || 0))
      .slice(0, 5),
    lariRecommendations: generateLariRecommendedActions(adaptDashboardDataset(state)),
    scoreSeries: formatScoreSeries(dashboard.charts.monthlyTrend || [], operationalScore, options.scoreTimeRange),
    operationalScore,
    scoreClass: classifyScore(operationalScore),
    totalTrabalhadoresExpostos: totalWorkersExposed,
    openRisksCount,
    executiveSummary,
    alerts: dashboard.alerts || [],
  };
}
