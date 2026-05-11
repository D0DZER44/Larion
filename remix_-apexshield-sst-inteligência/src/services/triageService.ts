import { fail, ok, type EngineResult } from '@/src/types/engineResult';
import type { OperationalItemDraft } from '@/src/types/operationalItem';
import type {
  TriageDecisionData,
  TriageEngineInput,
  TriageOperationDispatch,
} from '@/src/types/triage';
import { triageEngine } from '@/src/lib/engines/triageEngine';

export interface TriageReviewEnvelope {
  input: TriageEngineInput;
  decision: TriageDecisionData;
}

export interface TriageDispatchEnvelope {
  decision: TriageDecisionData;
  operationDraft: OperationalItemDraft;
  dispatch: TriageOperationDispatch;
}

export function reviewTriageItem(input: TriageEngineInput): EngineResult<TriageReviewEnvelope> {
  const decisionResult = triageEngine.evaluate(input);
  if (!decisionResult.success) {
    return fail(decisionResult.errors, {
      input,
      decision: decisionResult.data,
    }, decisionResult.warnings);
  }

  return ok(
    {
      input,
      decision: decisionResult.data,
    },
    decisionResult.warnings
  );
}

export function sendTriageItemToOperation(
  draft: OperationalItemDraft,
  decision: TriageDecisionData
): EngineResult<TriageDispatchEnvelope> {
  if (!decision.readyToSendToOperation) {
    return fail(
      ['Item ainda nao esta pronto para sair da Triagem e entrar em Operacao.'],
      {
        decision,
        operationDraft: draft,
        dispatch: {
          status: 'a_fazer',
          sentAt: new Date().toISOString(),
          ready: true,
        },
      }
    );
  }

  const operationDraft: OperationalItemDraft = {
    ...draft,
    kind: decision.suggestedType,
    priority: decision.suggestedPriority,
    status: 'a_fazer',
    contextId: draft.contextId ?? 'base_sst',
    dueAt: decision.suggestedDueDate ?? draft.dueAt,
    responsibleRole: draft.responsibleRole ?? decision.suggestedResponsibleRole,
    evidencePlan: {
      ...draft.evidencePlan,
      required: decision.requiresEvidence,
      minimumCount:
        decision.requiresEvidence && draft.evidencePlan.minimumCount === 0
          ? 1
          : draft.evidencePlan.minimumCount,
    },
  };

  return ok({
    decision,
    operationDraft,
    dispatch: {
      status: 'a_fazer',
      sentAt: new Date().toISOString(),
      ready: true,
    },
  });
}

export const triageService = {
  review: reviewTriageItem,
  sendToOperation: sendTriageItemToOperation,
};
