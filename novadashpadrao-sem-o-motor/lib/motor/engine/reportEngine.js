import { normalizeDataset } from "../core/normalizeEngine.js";
import { getActionsByStatusChart, getMonthlyTrendChart, getNRComplianceChart, getRiskByNRChart, getRiskBySectorChart } from "./chartEngine.js";
import { generateExecutiveSummary, generateLariCriticalAlerts } from "./insightEngine.js";
import { calculateDashboardMetrics } from "./metricsEngine.js";
import { estimateTotalExposure } from "./financialImpactEngine.js";
import { calculateMaturityScore } from "./maturityEngine.js";
import { generatePGRRiskMap } from "./pgrEngine.js";

function baseReport(kind, title, summary, sections, metrics = {}) {
  return {
    id: `${kind}-${Date.now()}`,
    kind,
    titulo: title,
    geradoEm: Date.now(),
    resumo: summary,
    metricas: metrics,
    secoes: sections,
  };
}

export function generateExecutiveReportData(input = {}) {
  const dataset = normalizeDataset(input);
  const summary = generateExecutiveSummary(dataset);
  const dashboard = calculateDashboardMetrics(dataset);
  return baseReport(
    "executivo",
    "Relatório Executivo",
    summary.summary,
    [
      { titulo: "Riscos por setor", tipo: "grafico", dados: getRiskBySectorChart(dataset) },
      { titulo: "Tendência mensal", tipo: "grafico", dados: getMonthlyTrendChart(dataset) },
      { titulo: "Alertas críticos", tipo: "lista", dados: generateLariCriticalAlerts(dataset) },
    ],
    dashboard,
  );
}

export function generateAuditReportData(input = {}) {
  const dataset = normalizeDataset(input);
  return baseReport(
    "auditoria",
    "Relatório de Auditoria",
    `${dataset.auditLogs.length} eventos de auditoria registrados.`,
    [{ titulo: "Eventos", tipo: "tabela", dados: dataset.auditLogs }],
    { totalEventos: dataset.auditLogs.length },
  );
}

export function generateNRReportData(input = {}) {
  const dataset = normalizeDataset(input);
  return baseReport(
    "operacional",
    "Relatório Normativo",
    "Consolidação de aderência normativa por NR.",
    [
      { titulo: "Conformidade por NR", tipo: "grafico", dados: getNRComplianceChart(dataset) },
      { titulo: "Ocorrências por NR", tipo: "grafico", dados: getRiskByNRChart(dataset) },
    ],
  );
}

export function generatePGRReportData(input = {}) {
  const dataset = normalizeDataset(input);
  const riskMap = generatePGRRiskMap(dataset);
  return baseReport(
    "pgr",
    "Relatório PGR Vivo",
    `${riskMap.length} itens ativos no mapa de riscos do PGR.`,
    [{ titulo: "Mapa de riscos", tipo: "tabela", dados: riskMap }],
    { totalItens: riskMap.length },
  );
}

export function generateFinancialImpactReportData(input = {}) {
  const dataset = normalizeDataset(input);
  const exposure = estimateTotalExposure(dataset.risks, dataset.actions, dataset.nonConformities);
  return baseReport(
    "impacto-financeiro",
    "Relatório de Impacto Financeiro",
    exposure.explicacao,
    [{ titulo: "Resumo financeiro", tipo: "texto", dados: exposure }],
    exposure,
  );
}

export function generateMaturityReportData(input = {}) {
  const dataset = normalizeDataset(input);
  const maturity = calculateMaturityScore(dataset);
  return baseReport(
    "maturidade",
    "Relatório de Maturidade",
    `Score geral de maturidade: ${Math.round(maturity.scorePercent)}%.`,
    [
      { titulo: "Componentes", tipo: "tabela", dados: maturity.componentes },
      { titulo: "Ações por status", tipo: "grafico", dados: getActionsByStatusChart(dataset) },
    ],
    maturity,
  );
}
