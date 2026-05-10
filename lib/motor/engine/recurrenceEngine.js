import { normalizeDataset } from "../core/normalizeEngine.js";
import { stableKey } from "../core/idUtils.js";

function buildGroups(nonConformities = []) {
  return nonConformities.reduce((accumulator, item) => {
    const key = stableKey([item.nr || "sem-nr", item.setor, item.ruleId || item.pergunta]);
    accumulator[key] ||= [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
}

export function detectRecurringNonConformities(input = {}) {
  const { nonConformities } = normalizeDataset(input);
  return Object.entries(buildGroups(nonConformities))
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, total: items.length, latest: items[items.length - 1], items }));
}

export function calculateRecurrenceRate(input = {}) {
  const { nonConformities } = normalizeDataset(input);
  if (nonConformities.length === 0) return 0;
  const recurring = detectRecurringNonConformities({ nonConformities });
  return (recurring.length / nonConformities.length) * 100;
}

export function getRecurringRisksBySector(input = {}) {
  const recurring = detectRecurringNonConformities(input);
  const grouped = recurring.reduce((accumulator, item) => {
    const sector = item.latest?.setor || "Geral";
    accumulator[sector] = (accumulator[sector] || 0) + item.total;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function getRecurringRisksByNR(input = {}) {
  const recurring = detectRecurringNonConformities(input);
  const grouped = recurring.reduce((accumulator, item) => {
    const nr = item.latest?.nr || "Sem NR";
    accumulator[nr] = (accumulator[nr] || 0) + item.total;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function generateRecurrenceAlerts(input = {}) {
  return detectRecurringNonConformities(input).map((item) => ({
    id: `rec-${item.key}`,
    level: item.total >= 3 ? "alerta" : "atenção",
    titulo: "Recorrência detectada",
    descricao: `${item.total} ocorrências similares encontradas para ${item.latest?.setor || "Geral"}.`,
    referenciaIds: item.items.map((entry) => entry.id),
  }));
}
