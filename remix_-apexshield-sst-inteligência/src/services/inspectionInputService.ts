import type { Checklist, ChecklistAnswer } from '@/src/types/checklist';
import type { Inspection } from '@/src/types/inspection';
import { checklistEngine, type ChecklistAnalysis } from '@/src/lib/engines/checklistEngine';
import { ok, type EngineResult } from '@/src/types/engineResult';
import {
  inspectionInputEngine,
  type InspectionExecutionSummary,
} from '@/src/lib/engines/inspectionInputEngine';
import type { LegacyInspectionConversionData } from '@/src/lib/adapters/legacyToOperationalItem';

export interface InspectionInputEnvelope {
  inspection: Inspection;
  checklist: Checklist;
  analysis: ChecklistAnalysis;
}

export interface LegacyInspectionExecutionEnvelope {
  summary: InspectionExecutionSummary;
  triage: LegacyInspectionConversionData;
  inspectionPatch: Record<string, unknown>;
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

export function prepareLegacyInspectionInputsForTriage(input: {
  inspection: Record<string, unknown>;
  items: Record<string, unknown>[];
}): EngineResult<LegacyInspectionExecutionEnvelope> {
  const summaryResult = inspectionInputEngine.analyzeExecution(input);
  const triageResult = inspectionInputEngine.prepareForTriage(input);

  return ok(
    {
      summary: summaryResult.data,
      triage: triageResult.data,
      inspectionPatch: {
        triagePreparedAt: new Date().toISOString(),
        triageSourceId: triageResult.data.fieldInput.id,
        triageCriticalAnswersCount: triageResult.data.criticalAnswers.length,
        triageWarnings: triageResult.warnings,
        triagePayload: triageResult.data,
      },
    },
    [...summaryResult.warnings, ...triageResult.warnings]
  );
}

export const inspectionInputService = {
  prepareForTriage: prepareInspectionInputsForTriage,
  prepareLegacyForTriage: prepareLegacyInspectionInputsForTriage,
};
