import type { Checklist } from '@/src/types/checklist';
import { ok, fail, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput, FieldInputTriagePayload } from '@/src/types/fieldInput';
import type { OperationalItemKind, OperationalItemPriority } from '@/src/types/operationalItem';
import type { SSTRuleSeverity } from '@/src/types/sstRule';
import { CRITICAL_ACTIVITIES } from '@/src/lib/catalogs/criticalActivities';
import { OPERATIONAL_CONTEXTS } from '@/src/lib/catalogs/operationalContexts';

export interface FieldInputPreparation {
  normalizedTitle: string;
  normalizedDescription: string;
  suggestedItemType: OperationalItemKind;
  suggestedPriority: OperationalItemPriority;
  suggestedSeverity: SSTRuleSeverity;
  suggestedContextId?: string;
  suggestedCriticalActivityId?: string;
  suggestedChecklistIds: string[];
  suggestedNrIds: string[];
  matchedKeywords: string[];
  triagePayload: FieldInputTriagePayload;
}

function normalizeText(value?: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeFieldInput(input: FieldInput): FieldInput {
  return {
    ...input,
    origin: input.origin ?? input.source ?? 'manual',
    title: input.title || String(input.text ?? '').trim() || 'Entrada de campo sem titulo',
    description: input.description ?? input.text,
    operationalContextId: input.operationalContextId ?? input.contextId,
    criticalActivityId: input.criticalActivityId ?? input.activityId,
    source: input.source ?? input.origin,
    text: input.text ?? input.description ?? input.title,
    contextId: input.contextId ?? input.operationalContextId,
    activityId: input.activityId ?? input.criticalActivityId,
    reporterPriority: input.reporterPriority ?? input.suggestedPriority,
    status: input.status ?? 'pending',
    resultingItemId: input.resultingItemId ?? input.convertedToOperationalItemId,
  };
}

function classifySeverity(value?: SSTRuleSeverity): SSTRuleSeverity {
  if (value) return value;
  return 'media';
}

function severityToPriority(severity: SSTRuleSeverity): OperationalItemPriority {
  if (severity === 'critica') return 'critica';
  if (severity === 'alta') return 'alta';
  if (severity === 'media') return 'media';
  return 'baixa';
}

function classifySuggestedItemType(
  severity: SSTRuleSeverity,
  hasEvidence: boolean,
  hasRuleSignal: boolean
): OperationalItemKind {
  if (severity === 'critica') return 'criticalDeviation';
  if (hasRuleSignal) return 'nonconformity';
  if (hasEvidence) return 'incidentSignal';
  return 'observation';
}

export function prepareFieldInput(
  input: FieldInput,
  checklists: Checklist[] = []
): EngineResult<FieldInputPreparation> {
  const normalizedInput = normalizeFieldInput(input);
  const normalizedTitle = normalizeText(normalizedInput.title);
  const normalizedDescription = normalizeText(normalizedInput.description);
  const combinedText = `${normalizedTitle} ${normalizedDescription}`.trim();
  const warnings: string[] = [];

  if (!combinedText && (normalizedInput.attachments?.length ?? 0) === 0 && (normalizedInput.photos?.length ?? 0) === 0) {
    return fail(
      ['Entrada de campo precisa de titulo, descricao ou anexo para seguir para triagem.'],
      {
        normalizedTitle: '',
        normalizedDescription: '',
        suggestedItemType: 'observation',
        suggestedPriority: 'baixa',
        suggestedSeverity: 'baixa',
        suggestedChecklistIds: [],
        suggestedNrIds: [],
        matchedKeywords: [],
        triagePayload: {
          sourceType: 'field',
          routeTo: 'triage',
          fieldInputId: normalizedInput.id,
          suggestedItemType: 'observation',
          suggestedPriority: 'baixa',
          suggestedSeverity: 'baixa',
          suggestedChecklistIds: [],
          suggestedNrIds: [],
          summary: 'Entrada invalida para triagem.',
        },
      }
    );
  }

  const detectedContext =
    OPERATIONAL_CONTEXTS.find((context) => context.id === normalizedInput.operationalContextId) ??
    OPERATIONAL_CONTEXTS.find((context) =>
      (context.keywords ?? []).some((keyword) => combinedText.includes(normalizeText(keyword)))
    );

  const detectedActivity =
    CRITICAL_ACTIVITIES.find((activity) => activity.id === normalizedInput.criticalActivityId) ??
    CRITICAL_ACTIVITIES.find((activity) =>
      activity.keywords.some((keyword) => combinedText.includes(normalizeText(keyword)))
    );

  const suggestedNrIds = Array.from(
    new Set([
      ...(normalizedInput.suggestedNR ? [normalizedInput.suggestedNR] : []),
      ...(detectedContext?.applicableNrs ?? []),
      ...(detectedActivity?.relatedNrs ?? []),
    ])
  );

  const suggestedChecklistIds = checklists
    .filter((checklist) => {
      if (detectedActivity && checklist.activities?.includes(detectedActivity.id)) return true;
      if (
        detectedContext &&
        checklist.sections.some((section) =>
          section.questions.some((question) => question.contextId === detectedContext.id)
        )
      ) {
        return true;
      }
      if (checklist.nr && suggestedNrIds.includes(checklist.nr)) return true;
      return false;
    })
    .map((checklist) => checklist.id);

  const suggestedSeverity = classifySeverity(normalizedInput.suggestedSeverity);
  const suggestedPriority = normalizedInput.suggestedPriority ?? severityToPriority(suggestedSeverity);
  const hasEvidence = (normalizedInput.attachments?.length ?? 0) > 0 || (normalizedInput.photos?.length ?? 0) > 0;
  const suggestedItemType = classifySuggestedItemType(
    suggestedSeverity,
    hasEvidence,
    suggestedNrIds.length > 0 || Boolean(detectedActivity)
  );

  if (!detectedContext) warnings.push('Nenhum contexto operacional foi sugerido automaticamente.');
  if (!detectedActivity) warnings.push('Nenhuma atividade critica foi sugerida automaticamente.');
  if (suggestedChecklistIds.length === 0) warnings.push('Nenhum checklist foi sugerido a partir desta entrada.');

  const matchedKeywords = Array.from(
    new Set([
      ...(detectedContext?.keywords ?? []).filter((keyword) => combinedText.includes(normalizeText(keyword))),
      ...(detectedActivity?.keywords ?? []).filter((keyword) => combinedText.includes(normalizeText(keyword))),
    ])
  );

  const triagePayload: FieldInputTriagePayload = {
    sourceType: 'field',
    routeTo: 'triage',
    fieldInputId: normalizedInput.id,
    suggestedItemType,
    suggestedPriority,
    suggestedSeverity,
    suggestedContextId: detectedContext?.id ?? normalizedInput.operationalContextId,
    suggestedCriticalActivityId: detectedActivity?.id ?? normalizedInput.criticalActivityId,
    suggestedChecklistIds,
    suggestedNrIds,
    summary: `${normalizedInput.origin}: ${normalizedInput.title}`,
  };

  return ok(
    {
      normalizedTitle,
      normalizedDescription,
      suggestedItemType,
      suggestedPriority,
      suggestedSeverity,
      suggestedContextId: triagePayload.suggestedContextId,
      suggestedCriticalActivityId: triagePayload.suggestedCriticalActivityId,
      suggestedChecklistIds,
      suggestedNrIds,
      matchedKeywords,
      triagePayload,
    },
    warnings
  );
}

export const fieldInputEngine = {
  prepare: prepareFieldInput,
};
