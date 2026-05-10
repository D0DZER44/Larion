import { FINE_BANDS } from "../core/constants.js";
import {
  normalizeAction,
  normalizeInspection,
  normalizeNonConformity,
  normalizeRisk,
} from "../core/normalizeEngine.js";
import { generateId } from "../core/idUtils.js";
import { calculateDueDate, calculatePriority, calculateSeverity } from "./severityEngine.js";
import { evaluateChecklistAnswer, generateNonConformityFromRule } from "./normativeEngine.js";

export function generateNonConformitiesFromInspection(inspectionInput = {}, checklistAnswers = [], context = {}) {
  const inspection = normalizeInspection(inspectionInput);
  const answers = checklistAnswers.length > 0 ? checklistAnswers : inspection.checklistAnswers || [];

  return answers.flatMap((answer) =>
    evaluateChecklistAnswer(answer, {
      inspectionId: inspection.id,
      activityType: context.activityType || answer.atividade || inspection.atividades?.[0] || "uso-de-epi",
      sector: context.sector || inspection.setor,
      pacote: context.pacote,
    })
      .filter((evaluation) => evaluation.triggered)
      .map((evaluation) =>
        normalizeNonConformity(
          generateNonConformityFromRule(evaluation.rule, answer, {
            inspectionId: inspection.id,
            activityType: context.activityType || answer.atividade || inspection.atividades?.[0] || "uso-de-epi",
            sector: context.sector || inspection.setor,
            pacote: context.pacote,
          }),
        ),
      ),
  );
}

export function generateRisksFromNonConformities(nonConformities = [], context = {}) {
  return nonConformities.map((item) => {
    const nonConformity = normalizeNonConformity(item);
    const severidade = calculateSeverity(nonConformity.severidade || nonConformity);
    return normalizeRisk({
      id: generateId("RSK"),
      inspectionId: nonConformity.inspectionId,
      nonConformityId: nonConformity.id,
      titulo: nonConformity.titulo,
      descricao: nonConformity.descricao || nonConformity.acaoRecomendada,
      setor: nonConformity.setor,
      responsavel: context.responsavel || "Consultor SST",
      severidade,
      prioridade: calculatePriority(nonConformity),
      status: "Aberto",
      pacote: nonConformity.pacote,
      nr: nonConformity.nr,
      ruleId: nonConformity.ruleId,
      origem: "motor-operacional",
      multaEstimada: FINE_BANDS[severidade]?.estimated || 0,
      recorrencia: Number(context.recorrencia || 0),
    });
  });
}

export function generateActionsFromRisks(risks = [], context = {}) {
  return risks.map((item) => {
    const risk = normalizeRisk(item);
    return normalizeAction({
      id: generateId("ACT"),
      riskId: risk.id,
      inspectionId: risk.inspectionId,
      nonConformityId: risk.nonConformityId,
      titulo: `Tratar: ${risk.titulo}`,
      descricao: risk.descricao,
      responsavel: risk.responsavel || context.responsavel || "Consultor SST",
      status: "Pendente",
      prioridade: calculatePriority(risk),
      prazo: calculateDueDate(risk, context.referenceDate),
      evidencias: [],
      origem: "motor-operacional",
      exigeEvidencia: ["Alta", "Crítica"].includes(calculatePriority(risk)),
      motivoGeracao: `Gerada automaticamente a partir do risco ${risk.id}.`,
    });
  });
}

export function canCloseAction(actionInput = {}, evidences = [], options = {}) {
  const action = normalizeAction(actionInput);
  const required = action.exigeEvidencia || (options.evidenceRequiredFor || []).includes(action.prioridade);
  const evidenceList = evidences.length > 0 ? evidences : action.evidencias;
  return !required || evidenceList.length > 0;
}

export function closeAction(actionInput = {}, evidences = [], options = {}) {
  const action = normalizeAction(actionInput);
  if (!canCloseAction(action, evidences, options)) {
    throw new Error("A ação exige evidência antes do fechamento.");
  }

  const now = Date.now();
  return normalizeAction({
    ...action,
    evidencias: evidences.length > 0 ? evidences : action.evidencias,
    status: "Concluída",
    updatedAt: now,
    completedAt: now,
  });
}

export function reopenAction(actionInput = {}, reason = "", referenceDate = Date.now()) {
  const action = normalizeAction(actionInput);
  return normalizeAction({
    ...action,
    status: "Reaberta",
    updatedAt: referenceDate,
    completedAt: undefined,
    motivoGeracao: [action.motivoGeracao, reason].filter(Boolean).join(" | "),
  });
}
