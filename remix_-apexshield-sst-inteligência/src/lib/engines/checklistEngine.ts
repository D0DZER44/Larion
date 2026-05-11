import type {
  Checklist,
  ChecklistAnswer,
  ChecklistAnswerStatus,
  ChecklistFieldInputSuggestion,
  ChecklistOperationalDraftSuggestion,
  ChecklistQuestion,
} from '@/src/types/checklist';
import { ok, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import type { OperationalItemDraft } from '@/src/types/operationalItem';
import type { SSTRuleSeverity } from '@/src/types/sstRule';
import { applicabilityEngine, type ApplicabilityProfile } from './applicabilityEngine';
import { sstRuleEngine, type SSTRuleEvaluation } from './sstRuleEngine';
import { triageEngine } from './triageEngine';

export interface ChecklistFinding {
  questionId: string;
  questionText: string;
  answerStatus: ChecklistAnswerStatus;
  observation?: string;
  severity: SSTRuleSeverity;
  requiresEvidence: boolean;
  generatesItem: boolean;
  blocking: boolean;
  defaultDeadlineHours?: number;
  ruleId?: string;
  nr?: string;
  contextId?: string;
  activityId?: string;
  suggestedAction?: string;
  evidenceRefs: string[];
}

export interface ChecklistAnalysis {
  checklistId: string;
  answeredCount: number;
  missingAnswerQuestionIds: string[];
  nonConformingCount: number;
  criticalFindings: ChecklistFinding[];
  missingEvidenceQuestionIds: string[];
  fieldInputSuggestions: ChecklistFieldInputSuggestion[];
  operationalItemDraftSuggestions: ChecklistOperationalDraftSuggestion[];
  applicability?: ApplicabilityProfile;
  ruleEvaluation?: SSTRuleEvaluation;
}

export interface ChecklistEngineInput {
  checklist: Checklist;
  answers: ChecklistAnswer[];
  inspection?: Inspection;
  createdBy?: string;
}

function normalizeSeverity(value?: SSTRuleSeverity): SSTRuleSeverity {
  return value ?? 'media';
}

function normalizeAnswerStatus(answer: ChecklistAnswer, question: ChecklistQuestion): ChecklistAnswerStatus {
  if (answer.status) return answer.status;

  const raw = answer.answer;
  if (raw === true) return 'yes';
  if (raw === false) return 'no';

  const normalized = String(raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized === 'yes' || normalized === 'sim' || normalized === 'conforme') return 'yes';
  if (normalized === 'partial' || normalized === 'parcial') return 'partial';
  if (normalized === 'na' || normalized === 'n/a') return 'na';
  if (!normalized && question.answerType === 'text') return 'pending';
  return normalized ? 'no' : 'pending';
}

function questionCriticalStatuses(question: ChecklistQuestion): ChecklistAnswerStatus[] {
  return question.criticalStatuses ?? ['no', 'partial'];
}

function buildEvidenceRefs(answer: ChecklistAnswer): string[] {
  return [
    ...(answer.evidenceRefs ?? []),
    ...(answer.attachments ?? []).map((attachment) => attachment.id),
  ];
}

function toFinding(question: ChecklistQuestion, answer: ChecklistAnswer, defaultSeverity?: SSTRuleSeverity): ChecklistFinding {
  const answerStatus = normalizeAnswerStatus(answer, question);

  return {
    questionId: question.id,
    questionText: answer.question || question.text,
    answerStatus,
    observation: answer.observation,
    severity: normalizeSeverity(question.severity ?? defaultSeverity),
    requiresEvidence: answer.evidenceRequired ?? Boolean(question.requiresEvidence),
    generatesItem: question.generatesItem !== false,
    blocking: Boolean(question.blocking),
    defaultDeadlineHours: question.defaultDeadlineHours,
    ruleId: answer.ruleId ?? question.ruleId,
    nr: answer.nr ?? question.nr,
    contextId: question.contextId,
    activityId: question.activityId,
    suggestedAction: question.suggestedAction,
    evidenceRefs: buildEvidenceRefs(answer),
  };
}

function createSuggestedFieldInput(
  inspection: Inspection | undefined,
  checklist: Checklist,
  finding: ChecklistFinding,
  createdBy?: string
): ChecklistFieldInputSuggestion {
  const fieldInput: FieldInput = {
    id: globalThis.crypto.randomUUID(),
    title: finding.questionText,
    description: finding.observation ?? `Resposta critica (${finding.answerStatus}) detectada em checklist.`,
    origin: 'checklist',
    sector: inspection?.sector,
    operationalContextId: inspection?.operationalContextId ?? inspection?.contextId ?? finding.contextId,
    criticalActivityId: inspection?.criticalActivityId ?? finding.activityId,
    attachments: [],
    photos: [],
    suggestedPriority:
      finding.severity === 'critica'
        ? 'critica'
        : finding.severity === 'alta'
          ? 'alta'
          : finding.severity === 'media'
            ? 'media'
            : 'baixa',
    suggestedSeverity: finding.severity,
    suggestedNR: finding.nr,
    createdBy: createdBy ?? inspection?.createdBy,
    createdAt: inspection?.updatedAt ?? new Date().toISOString(),
    source: 'checklist',
    text: `${finding.questionText} ${finding.observation ?? ''}`.trim(),
    contextId: inspection?.operationalContextId ?? inspection?.contextId ?? finding.contextId,
    activityId: inspection?.criticalActivityId ?? finding.activityId,
    status: 'pending',
    metadata: {
      checklistId: checklist.id,
      questionId: finding.questionId,
      inspectionId: inspection?.id,
      generatedBy: 'checklistEngine',
    },
  };

  return {
    questionId: finding.questionId,
    fieldInput,
    rationale: [
      'Checklist e tratado como fonte de entrada para Triagem.',
      `Resposta critica detectada: ${finding.answerStatus}.`,
      ...(finding.nr ? [`NR sugerida: ${finding.nr}.`] : []),
    ],
  };
}

function buildDraftSuggestions(
  fieldInputSuggestions: ChecklistFieldInputSuggestion[],
  inspection: Inspection | undefined,
  checklistFindings: ChecklistFinding[],
  applicability: ApplicabilityProfile,
  ruleEvaluation: SSTRuleEvaluation
): ChecklistOperationalDraftSuggestion[] {
  return fieldInputSuggestions.flatMap((suggestion) => {
    const finding = checklistFindings.find((item) => item.questionId === suggestion.questionId);
    if (!finding) return [];

    const triageResult = triageEngine.classify({
      fieldInput: suggestion.fieldInput,
      inspection,
      applicability,
      checklistFindings: [finding],
      ruleEvaluation,
    });

    if (!triageResult.success) return [];

    return [
      {
        questionId: suggestion.questionId,
        draft: triageResult.data.draft as OperationalItemDraft,
        rationale: [
          'Draft gerado apenas como sugestao para Triagem.',
          ...triageResult.data.rationale,
        ],
      },
    ];
  });
}

export function analyzeChecklistExecution(
  input: ChecklistEngineInput
): EngineResult<ChecklistAnalysis> {
  const questionMap = new Map<string, ChecklistQuestion>();
  input.checklist.sections.forEach((section) =>
    section.questions.forEach((question) => questionMap.set(question.id, question))
  );

  const warnings: string[] = [];
  const criticalFindings: ChecklistFinding[] = [];
  const missingEvidenceQuestionIds: string[] = [];

  input.answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      warnings.push(`Resposta aponta para pergunta desconhecida: ${answer.questionId}.`);
      return;
    }

    const answerStatus = normalizeAnswerStatus(answer, question);
    const criticalStatuses = questionCriticalStatuses(question);
    const markedCritical = answer.isCritical === true;
    if (!markedCritical && !criticalStatuses.includes(answerStatus)) return;

    const finding = toFinding(question, answer, input.checklist.defaultSeverity);
    criticalFindings.push(finding);

    if (finding.requiresEvidence && finding.evidenceRefs.length === 0) {
      missingEvidenceQuestionIds.push(question.id);
    }
  });

  const missingAnswerQuestionIds = Array.from(questionMap.keys()).filter(
    (questionId) => !input.answers.some((answer) => answer.questionId === questionId)
  );

  if (missingAnswerQuestionIds.length > 0) {
    warnings.push('Checklist possui perguntas sem resposta e a leitura do motor pode ficar incompleta.');
  }

  const fieldInputSuggestions = criticalFindings.map((finding) =>
    createSuggestedFieldInput(input.inspection, input.checklist, finding, input.createdBy)
  );

  let applicability: ApplicabilityProfile | undefined;
  let ruleEvaluation: SSTRuleEvaluation | undefined;
  let operationalItemDraftSuggestions: ChecklistOperationalDraftSuggestion[] = [];

  if (criticalFindings.length > 0) {
    const combinedText = criticalFindings
      .map((finding) => `${finding.questionText} ${finding.observation ?? ''}`)
      .join(' ')
      .trim();

    const applicabilityResult = applicabilityEngine.resolve({
      inspection: input.inspection,
      text: combinedText,
    });

    warnings.push(...applicabilityResult.warnings);
    applicability = applicabilityResult.data;

    const ruleEvaluationResult = sstRuleEngine.evaluate({
      applicability,
      checklistFindings: criticalFindings,
      text: combinedText,
    });

    warnings.push(...ruleEvaluationResult.warnings);
    ruleEvaluation = ruleEvaluationResult.data;

    operationalItemDraftSuggestions = buildDraftSuggestions(
      fieldInputSuggestions,
      input.inspection,
      criticalFindings,
      applicability,
      ruleEvaluation
    );
  }

  return ok(
    {
      checklistId: input.checklist.id,
      answeredCount: input.answers.length,
      missingAnswerQuestionIds,
      nonConformingCount: criticalFindings.length,
      criticalFindings,
      missingEvidenceQuestionIds,
      fieldInputSuggestions,
      operationalItemDraftSuggestions,
      applicability,
      ruleEvaluation,
    },
    warnings
  );
}

export const checklistEngine = {
  analyze: analyzeChecklistExecution,
};
