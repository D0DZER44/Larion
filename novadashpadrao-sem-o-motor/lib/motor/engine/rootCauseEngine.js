import { ROOT_CAUSE_CATEGORIES } from "../core/constants.js";
import { normalizeDataset } from "../core/normalizeEngine.js";

const CATEGORY_RULES = [
  { category: "Falta de EPI", keywords: ["epi", "capacete", "luva", "oculos"] },
  { category: "Falta de sinalização", keywords: ["sinal", "placa", "rotul"] },
  { category: "Falha de equipamento", keywords: ["maquina", "equipamento", "parada", "painel"] },
  { category: "Falha de procedimento", keywords: ["procedimento", "pet", "app", "loto"] },
  { category: "Falha de treinamento", keywords: ["treinamento", "habilit", "capacita"] },
  { category: "Falha de supervisão", keywords: ["liberacao", "supervis", "acompanhamento"] },
  { category: "Falha de planejamento", keywords: ["planejamento", "cronograma", "antecip"] },
];

function resolveText(item = {}) {
  return `${item.titulo || ""} ${item.descricao || ""} ${item.pergunta || ""}`.toLowerCase();
}

export function suggestRootCauseCategories(item = {}) {
  const text = resolveText(item);
  const matched = CATEGORY_RULES.filter((entry) => entry.keywords.some((keyword) => text.includes(keyword))).map((entry) => entry.category);
  return matched.length > 0 ? matched : ROOT_CAUSE_CATEGORIES.slice(0, 3);
}

export function classifyRootCause(item = {}) {
  const suggestions = suggestRootCauseCategories(item);
  return {
    categoria: suggestions[0],
    confianca: suggestions.length === 1 ? 0.9 : 0.65,
    evidencia: item.descricao || item.observacao || item.pergunta || "",
  };
}

export function getRootCauseDistribution(input = {}) {
  const { nonConformities, risks } = normalizeDataset(input);
  const grouped = [...nonConformities, ...risks].reduce((accumulator, item) => {
    const category = classifyRootCause(item).categoria;
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function generateRootCauseInsights(input = {}) {
  return getRootCauseDistribution(input)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((item) => ({
      id: `rc-${item.name}`,
      titulo: `Causa raiz predominante: ${item.name}`,
      descricao: `${item.value} ocorrências associadas a ${item.name}.`,
      categoria: item.name,
    }));
}
