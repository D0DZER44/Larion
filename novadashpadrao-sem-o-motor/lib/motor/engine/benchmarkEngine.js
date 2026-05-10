import { normalizeDataset } from "../core/normalizeEngine.js";
import { calculateResponsibleRanking, calculateSectorRanking } from "./metricsEngine.js";

function withRelativeScore(items = []) {
  const max = Math.max(...items.map((item) => item.scoreRelativo || 0), 1);
  return items.map((item) => ({
    ...item,
    scoreRelativo: Math.round(((item.scoreRelativo || 0) / max) * 100),
  }));
}

export function generateInternalBenchmark(input = {}, scope = "setor") {
  return scope === "responsavel"
    ? compareResponsibles(input)
    : scope === "unidade"
      ? compareUnits(input)
      : compareSectors(input);
}

export function compareSectors(input = {}) {
  return withRelativeScore(calculateSectorRanking(normalizeDataset(input)));
}

export function compareResponsibles(input = {}) {
  return withRelativeScore(calculateResponsibleRanking(normalizeDataset(input)));
}

export function compareUnits(input = {}) {
  const { inspections } = normalizeDataset(input);
  const grouped = inspections.reduce((accumulator, item) => {
    const unit = item.unidade || item.unit || "Unidade principal";
    accumulator[unit] ||= { chave: unit, inspecoes: 0, scoreRelativo: 0 };
    accumulator[unit].inspecoes += 1;
    accumulator[unit].scoreRelativo += item.status === "Concluída" ? 10 : 3;
    return accumulator;
  }, {});
  return withRelativeScore(Object.values(grouped));
}

export function compareCurrentVsPreviousPeriod(currentInput = {}, previousInput = {}) {
  const current = normalizeDataset(currentInput);
  const previous = normalizeDataset(previousInput);
  return {
    current: {
      inspections: current.inspections.length,
      risks: current.risks.length,
      actions: current.actions.length,
    },
    previous: {
      inspections: previous.inspections.length,
      risks: previous.risks.length,
      actions: previous.actions.length,
    },
  };
}
