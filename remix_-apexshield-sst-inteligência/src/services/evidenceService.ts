import { fail, ok, type EngineResult } from '@/src/types/engineResult';
import type {
  Evidence,
  EvidenceDraft,
  EvidenceHistoryEntry,
} from '@/src/types/evidence';
import type { OperationalItem } from '@/src/types/operationalItem';
import {
  evidenceEngine,
  type EvidenceMutationValidation,
  type EvidenceValidation,
  type EvidenceTransitionValidationInput,
} from '@/src/lib/engines/evidenceEngine';

export interface EvidenceCreateEnvelope {
  evidence: Evidence;
}

export interface EvidenceDecisionEnvelope {
  evidence: Evidence;
}

export interface EvidenceDeletionEnvelope {
  evidence: Evidence;
  validation: EvidenceMutationValidation;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildHistoryEntry(
  action: EvidenceHistoryEntry['action'],
  createdBy?: string,
  note?: string,
  previousValidationStatus?: Evidence['validationStatus'],
  nextValidationStatus?: Evidence['validationStatus']
): EvidenceHistoryEntry {
  return {
    action,
    createdAt: nowIso(),
    createdBy,
    note,
    previousValidationStatus,
    nextValidationStatus,
  };
}

export function createEvidence(
  draft: EvidenceDraft
): EngineResult<EvidenceCreateEnvelope> {
  const errors: string[] = [];

  if (!draft.itemId?.trim()) errors.push('Evidencia precisa estar vinculada a um item.');
  if (!draft.type) errors.push('Evidencia precisa informar o tipo.');
  if (!draft.description?.trim()) errors.push('Evidencia precisa ter descricao.');
  if (!draft.createdBy?.trim()) errors.push('Evidencia precisa informar quem registrou.');
  if (!draft.url?.trim() && !draft.text?.trim() && !draft.caption?.trim() && !draft.description?.trim()) {
    errors.push('Evidencia precisa conter conteudo minimo para rastreabilidade.');
  }

  const evidence: Evidence = {
    id: draft.id ?? globalThis.crypto.randomUUID(),
    itemId: draft.itemId,
    type: draft.type,
    description: draft.description,
    url: draft.url,
    createdBy: draft.createdBy,
    createdAt: draft.createdAt ?? nowIso(),
    validatedBy: draft.validatedBy,
    validatedAt: draft.validatedAt,
    validationStatus: draft.validationStatus ?? 'pendente',
    history:
      draft.history && draft.history.length > 0
        ? draft.history
        : [
            buildHistoryEntry(
              'criada',
              draft.createdBy,
              'Evidencia registrada no fluxo operacional.',
              undefined,
              draft.validationStatus ?? 'pendente'
            ),
          ],
    kind: draft.kind,
    text: draft.text,
    caption: draft.caption,
    hash: draft.hash,
    geolocation: draft.geolocation,
    uploadedBy: draft.uploadedBy ?? draft.createdBy,
    uploadedAt: draft.uploadedAt ?? draft.createdAt ?? nowIso(),
    inspectionId: draft.inspectionId,
    questionId: draft.questionId,
    attachments: draft.attachments,
    metadata: draft.metadata,
  };

  if (errors.length > 0) {
    return fail(errors, { evidence });
  }

  return ok({ evidence });
}

export function approveEvidence(
  evidence: Evidence,
  validatedBy: string,
  note?: string
): EngineResult<EvidenceDecisionEnvelope> {
  const updated: Evidence = {
    ...evidence,
    validatedBy,
    validatedAt: nowIso(),
    validationStatus: 'aprovada',
    history: [
      ...evidence.history,
      buildHistoryEntry('aprovada', validatedBy, note, evidence.validationStatus, 'aprovada'),
    ],
  };

  return ok({ evidence: updated });
}

export function rejectEvidence(
  evidence: Evidence,
  validatedBy: string,
  note: string
): EngineResult<EvidenceDecisionEnvelope> {
  if (!note.trim()) {
    return fail(['Rejeicao de evidencia exige justificativa.'], {
      evidence,
    });
  }

  const updated: Evidence = {
    ...evidence,
    validatedBy,
    validatedAt: nowIso(),
    validationStatus: 'rejeitada',
    history: [
      ...evidence.history,
      buildHistoryEntry('rejeitada', validatedBy, note, evidence.validationStatus, 'rejeitada'),
    ],
  };

  return ok({ evidence: updated });
}

export function validateEvidenceTransitionRequest(
  input: EvidenceTransitionValidationInput
): EngineResult<EvidenceValidation> {
  return evidenceEngine.validateTransition(input);
}

export function removeEvidence(
  item: OperationalItem,
  evidence: Evidence,
  actor?: string,
  note?: string
): EngineResult<EvidenceDeletionEnvelope> {
  const validation = evidenceEngine.validateDeletion(item);

  if (!validation.success) {
    const blockedEvidence: Evidence = {
      ...evidence,
      history: [
        ...evidence.history,
        buildHistoryEntry('remocao_bloqueada', actor, note ?? validation.errors[0]),
      ],
    };

    return fail(validation.errors, {
      evidence: blockedEvidence,
      validation: validation.data,
    }, validation.warnings);
  }

  return ok({
    evidence,
    validation: validation.data,
  });
}

export const evidenceService = {
  create: createEvidence,
  approve: approveEvidence,
  reject: rejectEvidence,
  validateTransition: validateEvidenceTransitionRequest,
  remove: removeEvidence,
};
