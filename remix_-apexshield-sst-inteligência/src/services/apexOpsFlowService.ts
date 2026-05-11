import { fail, ok, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import type { Checklist } from '@/src/types/checklist';
import type { Evidence } from '@/src/types/evidence';
import type { OperationalItem, OperationalItemDraft } from '@/src/types/operationalItem';
import type {
  ApexOpsChecklistFlowInput,
  ApexOpsCompletionResult,
  ApexOpsDispatchResult,
  ApexOpsFieldFlowInput,
  ApexOpsFlowSnapshot,
} from '@/src/lib/engines/apexOpsFlowEngine';
import { apexOpsFlowEngine } from '@/src/lib/engines/apexOpsFlowEngine';

export interface ApexOpsFlowServiceResult {
  snapshot: ApexOpsFlowSnapshot;
}

export function processManualEntry(
  fieldInput: FieldInput
): EngineResult<ApexOpsFlowServiceResult> {
  const result = apexOpsFlowEngine.runFieldInputFlow({
    fieldInput,
  });

  if (!result.success) {
    return fail(result.errors, { snapshot: result.data }, result.warnings);
  }
  return ok({ snapshot: result.data }, result.warnings);
}

export function processFieldInput(
  input: ApexOpsFieldFlowInput
): EngineResult<ApexOpsFlowServiceResult> {
  const result = apexOpsFlowEngine.runFieldInputFlow(input);
  if (!result.success) {
    return fail(result.errors, { snapshot: result.data }, result.warnings);
  }
  return ok({ snapshot: result.data }, result.warnings);
}

export function processInspectionChecklist(
  input: ApexOpsChecklistFlowInput
): EngineResult<ApexOpsFlowServiceResult> {
  const result = apexOpsFlowEngine.runChecklistFlow(input);
  if (!result.success) {
    return fail(result.errors, { snapshot: result.data }, result.warnings);
  }
  return ok({ snapshot: result.data }, result.warnings);
}

export function releaseFromTriage(
  draft: OperationalItemDraft
): EngineResult<ApexOpsDispatchResult> {
  return apexOpsFlowEngine.attemptTriageToOperation(draft);
}

export function validateCompletion(
  item: OperationalItem,
  evidences: Evidence[],
  justification?: string
): EngineResult<ApexOpsCompletionResult> {
  return apexOpsFlowEngine.attemptCompletionWithEvidence(item, evidences, justification);
}

export const apexOpsFlowService = {
  processManualEntry,
  processFieldInput,
  processInspectionChecklist,
  releaseFromTriage,
  validateCompletion,
};
