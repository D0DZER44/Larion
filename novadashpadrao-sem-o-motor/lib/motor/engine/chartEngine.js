import { normalizeDataset } from "../core/normalizeEngine.js";
import { calculateNRCompliance, calculateResponsibleRanking, calculateSectorRanking, getTimeAggregation } from "./metricsEngine.js";

function ensureDataset(input = {}) {
  return normalizeDataset(input);
}

export function getRiskBySectorChart(input = {}) {
  const { risks } = ensureDataset(input);
  const grouped = risks.reduce((accumulator, item) => {
    const sector = item.setor || "Geral";
    accumulator[sector] = (accumulator[sector] || 0) + 1;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function getRiskByNRChart(input = {}) {
  const { risks, nonConformities } = ensureDataset(input);
  const combined = [...risks, ...nonConformities];
  const grouped = combined.reduce((accumulator, item) => {
    const nr = item.nr || "Sem NR";
    accumulator[nr] = (accumulator[nr] || 0) + 1;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function getActionsByStatusChart(input = {}) {
  const { actions } = ensureDataset(input);
  const grouped = actions.reduce((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] || 0) + 1;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function getInspectionsByMonthChart(input = {}) {
  const { inspections } = ensureDataset(input);
  return getTimeAggregation(inspections, "month").map((item) => ({ name: item.label, value: item.value }));
}

export function getNonConformitiesByWeekChart(input = {}) {
  const { nonConformities } = ensureDataset(input);
  return getTimeAggregation(nonConformities, "week").map((item) => ({ name: item.label, value: item.value }));
}

export function getMonthlyTrendChart(input = {}) {
  const { inspections, risks, actions } = ensureDataset(input);
  const indexes = new Map();

  getTimeAggregation(inspections, "month").forEach((item) => {
    indexes.set(item.label, { date: item.label, inspections: item.value, risks: 0, actions: 0 });
  });
  getTimeAggregation(risks, "month").forEach((item) => {
    const current = indexes.get(item.label) || { date: item.label, inspections: 0, risks: 0, actions: 0 };
    current.risks = item.value;
    indexes.set(item.label, current);
  });
  getTimeAggregation(actions, "month").forEach((item) => {
    const current = indexes.get(item.label) || { date: item.label, inspections: 0, risks: 0, actions: 0 };
    current.actions = item.value;
    indexes.set(item.label, current);
  });

  return [...indexes.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function getNRComplianceChart(input = {}) {
  return calculateNRCompliance(input).map((item) => ({ name: item.nr, value: Math.round(item.compliance) }));
}

export function getSectorRankingChart(input = {}) {
  return calculateSectorRanking(input).map((item) => ({ name: item.chave, value: item.scoreRelativo }));
}

export function getResponsibleRankingChart(input = {}) {
  return calculateResponsibleRanking(input).map((item) => ({ name: item.chave, value: item.scoreRelativo }));
}
