import { addDaysToIso } from "../core/dateUtils.js";
import { generateId } from "../core/idUtils.js";
import { calculatePriority } from "./severityEngine.js";
import { findPackageById, findPackageOfNR } from "../nrs/nrPackages.js";
import { findSegmentById } from "../nrs/nrSegments.js";
import { NR_ACTIVITY_TO_NRS, NR_RULES, listRulesByActivity } from "../nrs/nrRules.js";

function shouldTriggerRule(rule, answer = {}) {
  const response = answer.resposta || answer.answer || "pendente";
  const evidences = Array.isArray(answer.evidencias) ? answer.evidencias : [];

  switch (rule.condicaoDisparo) {
    case "ANSWER_NEGATIVE":
      return response === "não";
    case "ANSWER_POSITIVE":
      return response === "sim";
    case "ANSWER_NA":
      return response === "não-aplicável";
    case "EVIDENCE_MISSING":
      return rule.exigeEvidencia && evidences.length === 0;
    case "ALWAYS":
      return true;
    default:
      return false;
  }
}

export function getApplicableNRs(activityType, sector, options = {}) {
  const activityNRs = NR_ACTIVITY_TO_NRS[activityType] || [];
  const segmentNRs = findSegmentById(options.segmento || sector)?.nrsRecomendadas || [];
  const packageNRs = options.pacote ? (findPackageById(options.pacote)?.nrs || []) : [];
  return [...new Set([...activityNRs, ...segmentNRs, ...packageNRs])];
}

export function getApplicableRules(activityType, sector, options = {}) {
  const applicableNRs = new Set(getApplicableNRs(activityType, sector, options));
  return listRulesByActivity(activityType).filter((rule) => applicableNRs.has(rule.nr));
}

export function evaluateChecklistAnswer(answer = {}, context = {}) {
  const activityType = context.activityType || answer.atividade || "uso-de-epi";
  const rules = getApplicableRules(activityType, context.sector || context.setor || "Geral", context);

  return rules.map((rule) => ({
    rule,
    triggered: shouldTriggerRule(rule, answer),
    reason: shouldTriggerRule(rule, answer)
      ? "Resposta disparou a regra normativa."
      : "Regra avaliada sem disparo para a resposta informada.",
  }));
}

export function generateNonConformityFromRule(rule, answer = {}, context = {}) {
  const now = Date.now();
  const pacote = context.pacote || findPackageOfNR(rule.nr)?.id || "Base SST";
  const prioridade = calculatePriority({ severidade: rule.severidadePadrao, recurrence: 0 });

  return {
    id: generateId("NC"),
    inspectionId: context.inspectionId,
    questionId: answer.perguntaId || answer.id,
    pergunta: answer.pergunta || rule.perguntaChecklist,
    resposta: answer.resposta || answer.answer || "não",
    titulo: rule.titulo,
    descricao: rule.descricao,
    setor: context.sector || context.setor || "Geral",
    atividade: context.activityType || "uso-de-epi",
    status: "Aberta",
    severidade: rule.severidadePadrao,
    prioridade,
    pacote,
    nr: rule.nr,
    ruleId: rule.id,
    acaoRecomendada: rule.acaoRecomendada,
    evidenciasFornecidas: Array.isArray(answer.evidencias) ? answer.evidencias : [],
    exigeEvidencia: Boolean(rule.exigeEvidencia),
    prazoSugeridoDias: rule.prazoSugeridoDias,
    prazoSugeridoData: addDaysToIso(now, rule.prazoSugeridoDias),
    origem: "motor-normativo",
    createdAt: now,
    updatedAt: now,
  };
}

export function evaluateChecklistSet(checklistAnswers = [], context = {}) {
  return checklistAnswers.flatMap((answer) =>
    evaluateChecklistAnswer(answer, context)
      .filter((result) => result.triggered)
      .map((result) => generateNonConformityFromRule(result.rule, answer, context)),
  );
}

export function getNormativeCatalogSnapshot() {
  return {
    totalRules: NR_RULES.length,
    activeRules: NR_RULES.filter((rule) => rule.ativa).length,
    activitiesCovered: Object.keys(NR_ACTIVITY_TO_NRS).length,
  };
}
