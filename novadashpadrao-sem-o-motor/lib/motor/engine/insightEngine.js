import { normalizeDataset } from "../core/normalizeEngine.js";
import { calculateDashboardMetrics, calculateNRCompliance, calculateRecurrenceIndicators, calculateSLAIndicators } from "./metricsEngine.js";
import { estimateTotalExposure } from "./financialImpactEngine.js";

function makeInsight(id, category, level, titulo, descricao, acaoSugerida, referenciaIds = []) {
  return {
    id,
    category,
    level,
    titulo,
    descricao,
    acaoSugerida,
    referenciaIds,
    generatedAt: Date.now(),
  };
}

function ensureDataset(input = {}) {
  return normalizeDataset(input);
}

export function generateOperationalInsights(input = {}) {
  const dataset = ensureDataset(input);
  const metrics = calculateDashboardMetrics(dataset);
  const insights = [];

  if (metrics.pendingInspections > 0) {
    insights.push(
      makeInsight(
        "operational-pending-inspections",
        "operacional",
        "atenção",
        "Inspeções pendentes acumuladas",
        `${metrics.pendingInspections} inspeções aguardam execução ou conclusão.`,
        "Priorizar as inspeções vencidas e redistribuir agenda operacional.",
      ),
    );
  }

  if (metrics.openCriticalRisks > 0) {
    insights.push(
      makeInsight(
        "operational-critical-risks",
        "operacional",
        "crítico",
        "Riscos críticos em aberto",
        `${metrics.openCriticalRisks} riscos críticos ainda estão sem mitigação completa.`,
        "Acionar plano de resposta imediata e revisão de barreiras críticas.",
      ),
    );
  }

  return insights;
}

export function generateRiskInsights(input = {}) {
  const dataset = ensureDataset(input);
  const sectorRanking = calculateDashboardMetrics(dataset).sectorRanking.slice(0, 3);
  return sectorRanking.map((item, index) =>
    makeInsight(
      `risk-ranking-${index}`,
      "operacional",
      index === 0 ? "alerta" : "info",
      `Setor com maior pressão: ${item.chave}`,
      `${item.chave} concentra ${item.riscos} riscos e score relativo ${item.scoreRelativo}.`,
      "Revisar causas recorrentes e plano de ação do setor.",
    ),
  );
}

export function generateActionInsights(input = {}) {
  const dataset = ensureDataset(input);
  const sla = calculateSLAIndicators(dataset);
  return [
    makeInsight(
      "action-sla",
      "operacional",
      sla.overdue > 0 ? "alerta" : "info",
      "Indicador de SLA",
      `${sla.overdue} ações estão vencidas e ${Math.round(sla.complianceRate)}% estão em conformidade com SLA.`,
      "Atacar primeiro ações críticas vencidas com responsável definido.",
    ),
  ];
}

export function generateNRInsights(input = {}) {
  return calculateNRCompliance(input)
    .filter((item) => item.compliance < 80)
    .map((item) =>
      makeInsight(
        `nr-${item.nr}`,
        "normativo",
        item.compliance < 60 ? "alerta" : "atenção",
        `Conformidade abaixo do esperado em ${item.nr}`,
        `${item.nr} está com ${Math.round(item.compliance)}% de conformidade.`,
        "Revisar checklist, treinamentos e evidências vinculadas a esta NR.",
      ),
    );
}

export function generateExecutiveSummary(input = {}) {
  const dataset = ensureDataset(input);
  const metrics = calculateDashboardMetrics(dataset);
  const exposure = estimateTotalExposure(dataset.risks, dataset.actions, dataset.nonConformities);

  return {
    totalInspections: metrics.totalInspections,
    openCriticalRisks: metrics.openCriticalRisks,
    overdueActions: metrics.overdueActions,
    estimatedExposure: exposure.valorEstimado,
    summary: `${metrics.openCriticalRisks} riscos críticos, ${metrics.overdueActions} ações vencidas e exposição estimada de ${exposure.valorEstimado}.`,
  };
}

export function generateLariDailyBriefing(input = {}) {
  const dataset = ensureDataset(input);
  const recurrence = calculateRecurrenceIndicators(dataset);
  const summary = generateExecutiveSummary(dataset);
  return {
    titulo: "Briefing diário Lari",
    resumo: summary.summary,
    reincidencias: recurrence.recurring,
    prioridades: generateLariRecommendedActions(dataset).slice(0, 3),
  };
}

export function generateLariCriticalAlerts(input = {}) {
  return [
    ...generateOperationalInsights(input).filter((item) => item.level === "crítico" || item.level === "alerta"),
    ...generateNRInsights(input).filter((item) => item.level === "crítico" || item.level === "alerta"),
  ];
}

export function generateLariRecommendedActions(input = {}) {
  const dataset = ensureDataset(input);
  const recommendations = [];
  if (dataset.actions.some((item) => item.status === "Vencida" || item.status === "Reaberta")) {
    recommendations.push("Revisar fila de ações vencidas e redefinir responsáveis hoje.");
  }
  if (dataset.nonConformities.some((item) => item.exigeEvidencia && item.evidenciasFornecidas.length === 0)) {
    recommendations.push("Cobrar evidências pendentes das não conformidades críticas.");
  }
  if (dataset.risks.some((item) => item.severidade === "Crítica")) {
    recommendations.push("Executar varredura imediata dos riscos críticos por setor.");
  }
  return recommendations;
}
