import { actionRequiresEvidence } from '@/lib/action-rules';
import { ok, fail, type EngineResult } from '@/src/types/engineResult';
import type {
  Evidence,
  EvidenceKind,
  EvidenceType,
  EvidenceValidationStatus,
} from '@/src/types/evidence';
import type { OperationalItem } from '@/src/types/operationalItem';

export interface EvidenceValidation {
  required: boolean;
  minimumCount: number;
  acceptedCount: number;
  pendingOrApprovedCount: number;
  approvedCount: number;
  rejectedCount: number;
  missingCount: number;
  acceptedEvidenceIds: string[];
  pendingOrApprovedEvidenceIds: string[];
  approvedEvidenceIds: string[];
  rejectedEvidenceIds: string[];
  canMoveToValidation: boolean;
  canComplete: boolean;
}

export interface EvidenceTransitionValidationInput {
  item: OperationalItem;
  evidences: Evidence[];
  targetStatus: OperationalItem['status'];
  justification?: string;
}

export interface EvidenceMutationValidation {
  allowed: boolean;
  reason?: string;
  blockedByStatus?: OperationalItem['status'];
}

const legacyKindMap: Record<string, EvidenceType> = {
  photo: 'foto',
  pdf: 'arquivo',
  video: 'arquivo',
  audio: 'arquivo',
  text: 'observacao',
  url: 'registro',
  document: 'arquivo',
};

function normalizeEvidenceKind(kind?: EvidenceKind): EvidenceType | undefined {
  if (!kind) return undefined;
  return legacyKindMap[kind] ?? (kind as EvidenceType);
}

function resolveEvidenceType(evidence: Evidence): EvidenceType {
  return evidence.type ?? normalizeEvidenceKind(evidence.kind) ?? 'arquivo';
}

function isAcceptedByPlan(evidence: Evidence, acceptedKinds: EvidenceKind[]): boolean {
  if (acceptedKinds.length === 0) return true;

  const normalizedAcceptedKinds = acceptedKinds
    .map((kind) => normalizeEvidenceKind(kind))
    .filter(Boolean) as EvidenceType[];

  return normalizedAcceptedKinds.includes(resolveEvidenceType(evidence));
}

function requiresEvidenceByDefault(item: OperationalItem): boolean {
  return item.priority === 'critica' || item.priority === 'alta';
}

function hasPayload(evidence: Evidence): boolean {
  return Boolean(
    evidence.url?.trim() ||
      evidence.description?.trim() ||
      evidence.text?.trim() ||
      evidence.caption?.trim()
  );
}

function isLinkedToItem(item: OperationalItem, evidence: Evidence): boolean {
  if (evidence.itemId === item.id) return true;
  return item.evidenceIds.includes(evidence.id);
}

function isCountableForValidation(status: EvidenceValidationStatus): boolean {
  return status === 'pendente' || status === 'aprovada';
}

function isCountableForCompletion(status: EvidenceValidationStatus): boolean {
  return status === 'aprovada';
}

export function evaluateEvidenceState(
  item: OperationalItem,
  evidences: Evidence[]
): EngineResult<EvidenceValidation> {
  const requiredByPolicy =
    item.evidenceRequired ?? item.evidencePlan.required ?? false;
  const requiredByDefault = requiresEvidenceByDefault(item);
  const required = actionRequiresEvidence({
    exigeEvidencia: requiredByPolicy || requiredByDefault,
    prioridade: item.priority,
  });

  const acceptedKinds = item.evidencePlan.acceptedKinds;
  const linkedEvidences = evidences.filter((evidence) => isLinkedToItem(item, evidence));
  const accepted = linkedEvidences.filter((evidence) => {
    return isAcceptedByPlan(evidence, acceptedKinds) && hasPayload(evidence);
  });
  const pendingOrApproved = accepted.filter((evidence) =>
    isCountableForValidation(evidence.validationStatus)
  );
  const approved = accepted.filter((evidence) =>
    isCountableForCompletion(evidence.validationStatus)
  );
  const rejected = accepted.filter((evidence) => evidence.validationStatus === 'rejeitada');
  const discarded = linkedEvidences.filter(
    (evidence) => !accepted.some((candidate) => candidate.id === evidence.id)
  );
  const minimumCount = required ? Math.max(item.evidencePlan.minimumCount, 1) : 0;
  const missingCount = Math.max(0, minimumCount - approved.length);
  const result: EvidenceValidation = {
    required,
    minimumCount,
    acceptedCount: accepted.length,
    pendingOrApprovedCount: pendingOrApproved.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    missingCount,
    acceptedEvidenceIds: accepted.map((evidence) => evidence.id),
    pendingOrApprovedEvidenceIds: pendingOrApproved.map((evidence) => evidence.id),
    approvedEvidenceIds: approved.map((evidence) => evidence.id),
    rejectedEvidenceIds: [...rejected, ...discarded].map((evidence) => evidence.id),
    canMoveToValidation: pendingOrApproved.length > 0,
    canComplete: !required || missingCount === 0,
  };

  const warnings: string[] = [];
  if (requiredByDefault && !requiredByPolicy) {
    warnings.push('Item alto ou critico passou a exigir evidencia por padrao do dominio SST.');
  }

  if (required && approved.length === 0) {
    warnings.push('Item ainda nao possui evidencia aprovada para conclusao segura.');
  } else if (required && missingCount > 0) {
    warnings.push('Item ainda nao possui evidencia aprovada suficiente para concluir.');
  }

  return ok(result, warnings);
}

export function validateEvidenceForCompletion(
  item: OperationalItem,
  evidences: Evidence[]
): EngineResult<EvidenceValidation> {
  return validateEvidenceTransition({
    item,
    evidences,
    targetStatus: 'completed',
  });
}

export function validateEvidenceTransition(
  input: EvidenceTransitionValidationInput
): EngineResult<EvidenceValidation> {
  const evaluation = evaluateEvidenceState(input.item, input.evidences);
  const warnings = [...evaluation.warnings];
  const errors = [...evaluation.errors];

  if (
    input.targetStatus === 'em_validacao' &&
    evaluation.data.pendingOrApprovedCount === 0
  ) {
    errors.push('Item em_validacao precisa ter ao menos uma evidencia pendente ou aprovada.');
  }

  if (input.targetStatus === 'completed' && evaluation.data.required && !evaluation.data.canComplete) {
    errors.push('Item nao pode ser concluido sem evidencia aprovada suficiente.');
  }

  if (
    input.item.status === 'completed' &&
    input.targetStatus === 'inProgress' &&
    !input.justification?.trim()
  ) {
    errors.push('Reabertura exige justificativa.');
  }

  if (errors.length > 0) {
    return fail(Array.from(new Set(errors)), evaluation.data, warnings);
  }

  return ok(evaluation.data, warnings);
}

export function validateEvidenceDeletion(
  item: OperationalItem
): EngineResult<EvidenceMutationValidation> {
  const data: EvidenceMutationValidation = {
    allowed: item.status !== 'completed',
    blockedByStatus: item.status,
    reason:
      item.status === 'completed'
        ? 'Item concluido nao permite apagar evidencia.'
        : undefined,
  };

  if (!data.allowed) {
    return fail(['Item concluido nao permite apagar evidencia.'], data);
  }

  return ok(data);
}

export const evidenceEngine = {
  evaluate: evaluateEvidenceState,
  validateForCompletion: validateEvidenceForCompletion,
  validateTransition: validateEvidenceTransition,
  validateDeletion: validateEvidenceDeletion,
};
