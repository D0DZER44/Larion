import type { Checklist, ChecklistAnswer } from '@/src/types/checklist';
import type { Inspection } from '@/src/types/inspection';
import { checklistEngine, type ChecklistAnalysis } from '@/src/lib/engines/checklistEngine';
import { ok, type EngineResult } from '@/src/types/engineResult';

export interface InspectionInputEnvelope {
  inspection: Inspection;
  checklist: Checklist;
  analysis: ChecklistAnalysis;
}

function normalizeInspection(inspection: Inspection): Inspection {
  return {
    ...inspection,
    operationalContextId: inspection.operationalContextId ?? inspection.contextId,
    contextId: inspection.contextId ?? inspection.operationalContextId,
  };
}

function enrichAnswersWithQuestions(checklist: Checklist, answers: ChecklistAnswer[]): ChecklistAnswer[] {
  const questionMap = new Map<string, { text: string }>();
  checklist.sections.forEach((section) =>
    section.questions.forEach((question) => questionMap.set(question.id, { text: question.text }))
  );

  return answers.map((answer) => ({
    ...answer,
    question: answer.question || questionMap.get(answer.questionId)?.text || 'Pergunta sem descricao',
  }));
}

export function prepareInspectionInputsForTriage(
  inspection: Inspection,
  checklist: Checklist
): EngineResult<InspectionInputEnvelope> {
  const normalizedInspection = normalizeInspection(inspection);
  const enrichedAnswers = enrichAnswersWithQuestions(checklist, normalizedInspection.answers);

  const analysisResult = checklistEngine.analyze({
    checklist,
    answers: enrichedAnswers,
    inspection: {
      ...normalizedInspection,
      answers: enrichedAnswers,
    },
    createdBy: normalizedInspection.createdBy,
  });

  return ok(
    {
      inspection: {
        ...normalizedInspection,
        answers: enrichedAnswers,
      },
      checklist,
      analysis: analysisResult.data,
    },
    analysisResult.warnings
  );
}

export const inspectionInputService = {
  prepareForTriage: prepareInspectionInputsForTriage,
};
