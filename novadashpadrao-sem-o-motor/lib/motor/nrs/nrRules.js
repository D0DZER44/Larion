import {
  ACTIVITY_TEMPLATES,
  getChecklistByActivity,
  getExpectedEvidenceForActivity,
  getRecommendedActionsForActivity,
  getRisksByActivity,
} from "./activityTemplates.js";
import {
  getExpectedEvidenceByRisk,
  getRecommendedActionsByRisk,
} from "./sectorRiskTemplates.js";

/**
 * Checklist and normative rule catalog for the JavaScript normative engine.
 */

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeActivityKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const NR_ACTIVITY_TO_NRS = ACTIVITY_TEMPLATES.reduce((accumulator, activity) => {
  const values = unique(activity.relatedNrs || []);
  accumulator[activity.id] = values;
  (activity.aliases || []).forEach((alias) => {
    accumulator[alias] = values;
    accumulator[normalizeActivityKey(alias)] = values;
  });
  accumulator[normalizeActivityKey(activity.id)] = values;
  return accumulator;
}, {});

export const NR_RULES = ACTIVITY_TEMPLATES.flatMap((activity) => {
  const checklist = getChecklistByActivity(activity.id);
  const risks = getRisksByActivity(activity.id);
  const recommendedActions = getRecommendedActionsForActivity(activity.id);
  const expectedEvidence = getExpectedEvidenceForActivity(activity.id);

  return checklist.map((item, index) => {
    const linkedRisk = risks[index % Math.max(1, risks.length)] || null;
    const fallbackAction = recommendedActions[index % Math.max(1, recommendedActions.length)] || "regularizar condicao operacional";
    const fallbackEvidence = expectedEvidence[index % Math.max(1, expectedEvidence.length)] || "registro fotografico";
    const riskActions = linkedRisk ? getRecommendedActionsByRisk(linkedRisk.id) : [];
    const riskEvidence = linkedRisk ? getExpectedEvidenceByRisk(linkedRisk.id) : [];

    return {
      id: `RULE-${activity.id.toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
      nr: (activity.relatedNrs || [])[index % Math.max(1, (activity.relatedNrs || []).length)] || "NR-01",
      atividadeRelacionada: activity.id,
      activityAliases: activity.aliases || [],
      perguntaChecklist: item.label,
      titulo: `${activity.nome} - ${item.label}`,
      descricao: linkedRisk
        ? `Desvio potencial identificado para ${linkedRisk.nome} durante ${activity.nome}.`
        : `Desvio potencial identificado durante ${activity.nome}.`,
      condicaoDisparo: "ANSWER_NEGATIVE",
      severidadePadrao: linkedRisk?.severidadeSugerida || activity.severidadeSugerida || "Alta",
      prioridadeSugerida: linkedRisk?.prioridadeSugerida || activity.prioridadeSugerida || "P2",
      prazoSugeridoDias:
        linkedRisk?.prazoSugerido === "Imediato" || activity.prazoSugerido === "Imediato"
          ? 1
          : linkedRisk?.prazoSugerido?.includes("24")
            ? 1
            : linkedRisk?.prazoSugerido?.includes("48")
              ? 2
              : linkedRisk?.prazoSugerido?.includes("72")
                ? 3
                : 7,
      acaoRecomendada: riskActions[0] || fallbackAction,
      acoesRecomendadas: unique([...(riskActions || []), ...recommendedActions]),
      exigeEvidencia: true,
      evidenciasEsperadas: unique([...(riskEvidence || []), fallbackEvidence]),
      riskId: linkedRisk?.id || null,
      ativa: true,
    };
  });
});

export const NR_RULES_BY_ID = NR_RULES.reduce((accumulator, rule) => {
  accumulator[rule.id] = rule;
  return accumulator;
}, {});

function matchesActivity(rule, activityType) {
  const normalized = normalizeActivityKey(activityType);
  if (normalizeActivityKey(rule.atividadeRelacionada) === normalized) return true;
  return Array.isArray(rule.activityAliases)
    ? rule.activityAliases.some((alias) => normalizeActivityKey(alias) === normalized)
    : false;
}

export function listRulesByActivity(activityType) {
  return NR_RULES.filter((rule) => rule.ativa && matchesActivity(rule, activityType));
}

export function listRulesByNR(nr) {
  return NR_RULES.filter((rule) => rule.ativa && rule.nr === nr);
}

export function getRuleById(ruleId) {
  return NR_RULES_BY_ID[ruleId];
}

