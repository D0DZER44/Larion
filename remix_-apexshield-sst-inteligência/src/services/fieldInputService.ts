import type { Checklist } from '@/src/types/checklist';
import type { FieldInput } from '@/src/types/fieldInput';
import { fieldInputEngine, type FieldInputPreparation } from '@/src/lib/engines/fieldInputEngine';
import { applicabilityEngine, type ApplicabilityProfile } from '@/src/lib/engines/applicabilityEngine';
import { ok, fail, type EngineResult } from '@/src/types/engineResult';

export interface FieldInputTriageEnvelope {
  fieldInput: FieldInput;
  preparation: FieldInputPreparation;
  applicability: ApplicabilityProfile;
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
    status: input.status ?? 'pending',
  };
}

export function prepareFieldInputForTriage(
  input: FieldInput,
  checklists: Checklist[] = []
): EngineResult<FieldInputTriageEnvelope> {
  const normalizedInput = normalizeFieldInput(input);

  const preparationResult = fieldInputEngine.prepare(normalizedInput, checklists);
  if (!preparationResult.success) {
    return fail(preparationResult.errors, {
      fieldInput: normalizedInput,
      preparation: preparationResult.data,
      applicability: {
        contexts: [],
        activities: [],
        nrEntries: [],
        matchedKeywords: [],
        requiredDocuments: [],
      },
    }, preparationResult.warnings);
  }

  const applicabilityResult = applicabilityEngine.resolve({
    fieldInput: normalizedInput,
    text: `${normalizedInput.title} ${normalizedInput.description ?? ''}`.trim(),
  });

  return ok(
    {
      fieldInput: normalizedInput,
      preparation: preparationResult.data,
      applicability: applicabilityResult.data,
    },
    [...preparationResult.warnings, ...applicabilityResult.warnings]
  );
}

export const fieldInputService = {
  prepareForTriage: prepareFieldInputForTriage,
};
