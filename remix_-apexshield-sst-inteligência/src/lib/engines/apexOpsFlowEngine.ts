import { fail, ok, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import type { Checklist } from '@/src/types/checklist';
import type { Evidence } from '@/src/types/evidence';
import type { OperationalItem, OperationalItemDraft } from '@/src/types/operationalItem';
import type { ApplicabilityProfile } from '@/src/lib/engines/applicabilityEngine';
import type { ChecklistAnalysis } from '@/src/lib/engines/checklistEngine';
import type { FieldInputPreparation } from '@/src/lib/engines/fieldInputEngine';
import type { SSTRuleEvaluation } from '@/src/lib/engines/sstRuleEngine';
import type { TriageDecisionData, TriageEngineInput, TriageOrigin } from '@/src/types/triage';
import type { IntelligenceSummary } from '@/src/lib/engines/intelligenceEngine';
import type { EvidenceValidation } from '@/src/lib/engines/evidenceEngine';
import { fieldInputService } from '@/src/services/fieldInputService';
import { inspectionInputService } from '@/src/services/inspectionInputService';
import { triageService } from '@/src/services/triageService';
import { sstRuleEngine } from '@/src/lib/engines/sstRuleEngine';
import { triageEngine } from '@/src/lib/engines/triageEngine';
import { operationalItemEngine } from '@/src/lib/engines/operationalItemEngine';
import { evidenceEngine } from '@/src/lib/engines/evidenceEngine';
import { intelligenceEngine } from '@/src/lib/engines/intelligenceEngine';

type ContextAlias =
  | 'base_sst'
  | 'manutencao'
  | 'construcao'
  | 'logistica'
  | 'facilities'
  | 'industria'
  | 'porto'
  | 'saude'
  | 'rural';

type ActivityAlias =
  | 'altura'
  | 'eletricidade'
  | 'maquinas'
  | 'espaco_confinado'
  | 'incendio'
  | 'ergonomia'
  | 'movimentacao_cargas'
  | 'produtos_quimicos';

const CONTEXT_ALIAS_MAP: Record<ContextAlias, string | undefined> = {
  base_sst: undefined,
  manutencao: 'oficina-manutencao',
  construcao: 'trabalho-altura',
  logistica: 'almoxarifado-logistico',
  facilities: 'linha-producao',
  industria: 'linha-producao',
  porto: 'patio-carga',
  saude: 'escritorio-operacional',
  rural: undefined,
};

const ACTIVITY_ALIAS_MAP: Record<ActivityAlias, string | undefined> = {
  altura: 'trabalho-altura',
  eletricidade: 'manutencao-eletrica',
  maquinas: 'operacao-maquinas',
  espaco_confinado: 'espaco-confinado',
  incendio: undefined,
  ergonomia: undefined,
  movimentacao_cargas: 'movimentacao-cargas',
  produtos_quimicos: 'trabalho-quente',
};

export interface ApexOpsFlowMetadata {
  requestedContextId?: string;
  resolvedContextId?: string;
  requestedCriticalActivityId?: string;
  resolvedCriticalActivityId?: string;
}

export interface ApexOpsFieldFlowInput {
  fieldInput: FieldInput;
  checklists?: Checklist[];
}

export interface ApexOpsChecklistFlowInput {
  inspection: Inspection;
  checklist: Checklist;
}

export interface ApexOpsFlowSnapshot {
  metadata: ApexOpsFlowMetadata;
  fieldInput?: FieldInput;
  inspection?: Inspection;
  checklist?: Checklist;
  checklistAnalysis?: ChecklistAnalysis;
  fieldInputPreparation?: FieldInputPreparation;
  applicability: ApplicabilityProfile;
  ruleEvaluation: SSTRuleEvaluation;
  triageDecision: TriageDecisionData;
  operationalItemDraft: OperationalItemDraft;
  operationalItem: OperationalItem;
  evidenceValidation: EvidenceValidation;
  intelligence: IntelligenceSummary;
}

export interface ApexOpsDispatchResult {
  item: OperationalItemDraft;
  triageDecision: TriageDecisionData;
  blocked: boolean;
  blockedReason?: string;
  dispatchStatus?: 'a_fazer';
}

export interface ApexOpsCompletionResult {
  itemId: string;
  targetStatus: 'completed';
  evidenceValidation: EvidenceValidation;
}

function mapContextAlias(value?: string): string | undefined {
  if (!value) return undefined;
  return CONTEXT_ALIAS_MAP[value as ContextAlias] ?? value;
}

function mapActivityAlias(value?: string): string | undefined {
  if (!value) return undefined;
  return ACTIVITY_ALIAS_MAP[value as ActivityAlias] ?? value;
}

function normalizeFieldInputAliases(fieldInput: FieldInput): {
  fieldInput: FieldInput;
  metadata: ApexOpsFlowMetadata;
  warnings: string[];
} {
  const requestedContextId = fieldInput.operationalContextId ?? fieldInput.contextId;
  const requestedCriticalActivityId = fieldInput.criticalActivityId ?? fieldInput.activityId;
  const resolvedContextId = mapContextAlias(requestedContextId);
  const resolvedCriticalActivityId = mapActivityAlias(requestedCriticalActivityId);
  const warnings: string[] = [];

  if (requestedContextId && !resolvedContextId) {
    warnings.push(`Contexto ${requestedContextId} segue sem mapeamento catalogado; o motor vai usar texto e regras para complementar a leitura.`);
  }

  if (requestedCriticalActivityId && !resolvedCriticalActivityId) {
    warnings.push(`Atividade critica ${requestedCriticalActivityId} segue sem mapeamento catalogado; o motor vai usar texto e regras para complementar a leitura.`);
  }

  return {
    fieldInput: {
      ...fieldInput,
      operationalContextId: resolvedContextId ?? fieldInput.operationalContextId,
      contextId: resolvedContextId ?? fieldInput.contextId,
      criticalActivityId: resolvedCriticalActivityId ?? fieldInput.criticalActivityId,
      activityId: resolvedCriticalActivityId ?? fieldInput.activityId,
      metadata: {
        ...fieldInput.metadata,
        requestedContextId,
        requestedCriticalActivityId,
      },
    },
    metadata: {
      requestedContextId,
      resolvedContextId,
      requestedCriticalActivityId,
      resolvedCriticalActivityId,
    },
    warnings,
  };
}

function normalizeInspectionAliases(inspection: Inspection): {
  inspection: Inspection;
  metadata: ApexOpsFlowMetadata;
  warnings: string[];
} {
  const requestedContextId = inspection.operationalContextId ?? inspection.contextId;
  const requestedCriticalActivityId = inspection.criticalActivityId;
  const resolvedContextId = mapContextAlias(requestedContextId);
  const resolvedCriticalActivityId = mapActivityAlias(requestedCriticalActivityId);
  const warnings: string[] = [];

  if (requestedContextId && !resolvedContextId) {
    warnings.push(`Contexto ${requestedContextId} segue sem mapeamento catalogado; a inspeção vai depender mais do texto e das regras.`);
  }

  if (requestedCriticalActivityId && !resolvedCriticalActivityId) {
    warnings.push(`Atividade critica ${requestedCriticalActivityId} segue sem mapeamento catalogado; a inspeção vai depender mais do texto e das regras.`);
  }

  return {
    inspection: {
      ...inspection,
      operationalContextId: resolvedContextId ?? inspection.operationalContextId,
      contextId: resolvedContextId ?? inspection.contextId,
      criticalActivityId: resolvedCriticalActivityId ?? inspection.criticalActivityId,
      extra: {
        ...inspection.extra,
        requestedContextId,
        requestedCriticalActivityId,
      },
    },
    metadata: {
      requestedContextId,
      resolvedContextId,
      requestedCriticalActivityId,
      resolvedCriticalActivityId,
    },
    warnings,
  };
}

function buildRuleText(fieldInput?: FieldInput, inspection?: Inspection): string {
  return [
    fieldInput?.title,
    fieldInput?.description,
    fieldInput?.text,
    inspection?.title,
    inspection?.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function collectFieldEvidences(fieldInput?: FieldInput): Evidence[] {
  return [...(fieldInput?.attachments ?? []), ...(fieldInput?.photos ?? [])];
}

function collectInspectionEvidences(inspection?: Inspection): Evidence[] {
  return [...(inspection?.attachments ?? []), ...(inspection?.photos ?? [])];
}

function inferOriginFromDraft(draft: OperationalItemDraft): TriageOrigin {
  const sourceType = draft.sourceLinks[0]?.type;
  if (sourceType === 'inspection') return 'inspection';
  if (sourceType === 'checklist') return 'checklist';
  if (sourceType === 'manual') return 'manual';
  return 'manual';
}

function buildRuleData(ruleEvaluation: SSTRuleEvaluation): TriageEngineInput['ruleData'] {
  const firstRule = ruleEvaluation.matchedRules[0]?.rule;
  return {
    ruleId: firstRule?.id,
    ruleTitle: firstRule?.title,
    requiresEvidence: ruleEvaluation.requiredEvidence,
    suggestedDueHours: firstRule?.defaultDeadlineHours,
  };
}

export function runFieldInputToTriageFlow(
  input: ApexOpsFieldFlowInput
): EngineResult<ApexOpsFlowSnapshot> {
  const normalized = normalizeFieldInputAliases(input.fieldInput);
  const preparationResult = fieldInputService.prepareForTriage(normalized.fieldInput, input.checklists ?? []);

  if (!preparationResult.success) {
    return fail(preparationResult.errors, {
      metadata: normalized.metadata,
      fieldInput: normalized.fieldInput,
      applicability: preparationResult.data.applicability,
      fieldInputPreparation: preparationResult.data.preparation,
      ruleEvaluation: {
        matchedRules: [],
        blocking: false,
        requiredEvidence: false,
        suggestedActions: [],
        requiredDocuments: [],
      },
      triageDecision: {
        suggestedType: 'observation',
        suggestedPriority: 'baixa',
        suggestedSeverity: 'baixa',
        suggestedResponsibleRole: 'Lider operacional',
        requiresEvidence: false,
        triageWarnings: [],
        readyToSendToOperation: false,
      },
      operationalItemDraft: {
        title: normalized.fieldInput.title,
        kind: 'observation',
        priority: 'baixa',
        status: 'draft',
        nrIds: [],
        sourceLinks: [],
        ruleLinks: [],
        blocking: false,
        evidencePlan: {
          required: false,
          minimumCount: 0,
          acceptedKinds: [],
          blockingForCompletion: false,
          rationale: [],
        },
        evidenceIds: [],
      },
      operationalItem: {
        id: 'invalid-item',
        title: normalized.fieldInput.title,
        kind: 'observation',
        priority: 'baixa',
        status: 'draft',
        nrIds: [],
        sourceLinks: [],
        ruleLinks: [],
        blocking: false,
        evidencePlan: {
          required: false,
          minimumCount: 0,
          acceptedKinds: [],
          blockingForCompletion: false,
          rationale: [],
        },
        evidenceIds: [],
        history: [],
        createdAt: normalized.fieldInput.createdAt,
        updatedAt: normalized.fieldInput.createdAt,
      },
      evidenceValidation: {
        required: false,
        minimumCount: 0,
        acceptedCount: 0,
        pendingOrApprovedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        missingCount: 0,
        acceptedEvidenceIds: [],
        pendingOrApprovedEvidenceIds: [],
        approvedEvidenceIds: [],
        rejectedEvidenceIds: [],
        canMoveToValidation: false,
        canComplete: true,
      },
      intelligence: {
        totalItems: 0,
        openItems: 0,
        blockedItems: 0,
        evidenceGapItems: 0,
        byPriority: {},
        byContext: [],
        byActivity: [],
        byNr: [],
        insights: [],
      },
    }, [...normalized.warnings, ...preparationResult.warnings]);
  }

  const ruleEvaluationResult = sstRuleEngine.evaluate({
    applicability: preparationResult.data.applicability,
    text: buildRuleText(preparationResult.data.fieldInput),
  });

  const triageClassification = triageEngine.classify({
    fieldInput: preparationResult.data.fieldInput,
    applicability: preparationResult.data.applicability,
    ruleEvaluation: ruleEvaluationResult.data,
  });

  if (!triageClassification.success) {
    return fail(triageClassification.errors, {
      metadata: normalized.metadata,
      fieldInput: preparationResult.data.fieldInput,
      applicability: preparationResult.data.applicability,
      fieldInputPreparation: preparationResult.data.preparation,
      ruleEvaluation: ruleEvaluationResult.data,
      triageDecision: {
        suggestedType: 'observation',
        suggestedPriority: 'baixa',
        suggestedSeverity: 'baixa',
        suggestedResponsibleRole: 'Lider operacional',
        requiresEvidence: false,
        triageWarnings: [],
        readyToSendToOperation: false,
      },
      operationalItemDraft: triageClassification.data.draft,
      operationalItem: {
        id: 'invalid-item',
        title: triageClassification.data.draft.title ?? 'Item invalido',
        kind: triageClassification.data.draft.kind ?? 'observation',
        priority: triageClassification.data.draft.priority ?? 'baixa',
        status: triageClassification.data.draft.status ?? 'draft',
        nrIds: triageClassification.data.draft.nrIds ?? [],
        sourceLinks: triageClassification.data.draft.sourceLinks ?? [],
        ruleLinks: triageClassification.data.draft.ruleLinks ?? [],
        blocking: triageClassification.data.draft.blocking ?? false,
        evidencePlan: triageClassification.data.draft.evidencePlan ?? {
          required: false,
          minimumCount: 0,
          acceptedKinds: [],
          blockingForCompletion: false,
          rationale: [],
        },
        evidenceIds: triageClassification.data.draft.evidenceIds ?? [],
        history: triageClassification.data.draft.history ?? [],
        createdAt: triageClassification.data.draft.createdAt ?? normalized.fieldInput.createdAt,
        updatedAt: triageClassification.data.draft.updatedAt ?? normalized.fieldInput.createdAt,
      },
      evidenceValidation: {
        required: false,
        minimumCount: 0,
        acceptedCount: 0,
        pendingOrApprovedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        missingCount: 0,
        acceptedEvidenceIds: [],
        pendingOrApprovedEvidenceIds: [],
        approvedEvidenceIds: [],
        rejectedEvidenceIds: [],
        canMoveToValidation: false,
        canComplete: true,
      },
      intelligence: {
        totalItems: 0,
        openItems: 0,
        blockedItems: 0,
        evidenceGapItems: 0,
        byPriority: {},
        byContext: [],
        byActivity: [],
        byNr: [],
        insights: [],
      },
    }, [...normalized.warnings, ...preparationResult.warnings, ...ruleEvaluationResult.warnings, ...triageClassification.warnings]);
  }

  const triageDecisionResult = triageEngine.evaluate({
    fieldInput: preparationResult.data.fieldInput,
    operationalItemDraft: triageClassification.data.draft,
    operationalContextId: preparationResult.data.fieldInput.operationalContextId,
    criticalActivityId: preparationResult.data.fieldInput.criticalActivityId,
    severity: triageClassification.data.priority,
    origin: preparationResult.data.fieldInput.origin,
    sector: preparationResult.data.fieldInput.sector,
    attachments: preparationResult.data.fieldInput.attachments,
    photos: preparationResult.data.fieldInput.photos,
    ruleData: buildRuleData(ruleEvaluationResult.data),
    status: triageClassification.data.draft.status,
    responsible: triageClassification.data.draft.responsible,
    dueAt: triageClassification.data.draft.dueAt,
  });

  const createdItemResult = operationalItemEngine.create(
    triageClassification.data.draft,
    preparationResult.data.fieldInput.createdBy
  );

  if (!createdItemResult.success) {
    return fail(createdItemResult.errors, {
      metadata: normalized.metadata,
      fieldInput: preparationResult.data.fieldInput,
      applicability: preparationResult.data.applicability,
      fieldInputPreparation: preparationResult.data.preparation,
      ruleEvaluation: ruleEvaluationResult.data,
      triageDecision: triageDecisionResult.data,
      operationalItemDraft: triageClassification.data.draft,
      operationalItem: createdItemResult.data,
      evidenceValidation: {
        required: false,
        minimumCount: 0,
        acceptedCount: 0,
        pendingOrApprovedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        missingCount: 0,
        acceptedEvidenceIds: [],
        pendingOrApprovedEvidenceIds: [],
        approvedEvidenceIds: [],
        rejectedEvidenceIds: [],
        canMoveToValidation: false,
        canComplete: true,
      },
      intelligence: {
        totalItems: 0,
        openItems: 0,
        blockedItems: 0,
        evidenceGapItems: 0,
        byPriority: {},
        byContext: [],
        byActivity: [],
        byNr: [],
        insights: [],
      },
    }, [...normalized.warnings, ...preparationResult.warnings, ...ruleEvaluationResult.warnings, ...triageDecisionResult.warnings, ...createdItemResult.warnings]);
  }

  const evidenceValidationResult = evidenceEngine.evaluate(
    createdItemResult.data,
    collectFieldEvidences(preparationResult.data.fieldInput)
  );

  const intelligenceResult = intelligenceEngine.generate([createdItemResult.data]);

  return ok(
    {
      metadata: normalized.metadata,
      fieldInput: preparationResult.data.fieldInput,
      fieldInputPreparation: preparationResult.data.preparation,
      applicability: preparationResult.data.applicability,
      ruleEvaluation: ruleEvaluationResult.data,
      triageDecision: triageDecisionResult.data,
      operationalItemDraft: triageClassification.data.draft,
      operationalItem: createdItemResult.data,
      evidenceValidation: evidenceValidationResult.data,
      intelligence: intelligenceResult.data,
    },
    [
      ...normalized.warnings,
      ...preparationResult.warnings,
      ...ruleEvaluationResult.warnings,
      ...triageDecisionResult.warnings,
      ...createdItemResult.warnings,
      ...evidenceValidationResult.warnings,
      ...intelligenceResult.warnings,
    ]
  );
}

export function runInspectionChecklistToTriageFlow(
  input: ApexOpsChecklistFlowInput
): EngineResult<ApexOpsFlowSnapshot> {
  const normalized = normalizeInspectionAliases(input.inspection);
  const inspectionPreparation = inspectionInputService.prepareForTriage(normalized.inspection, input.checklist);

  const analysis = inspectionPreparation.data.analysis;
  const suggestedFieldInput = analysis.fieldInputSuggestions[0]?.fieldInput;
  const draftSuggestion = analysis.operationalItemDraftSuggestions[0]?.draft;

  if (!suggestedFieldInput || !analysis.applicability || !analysis.ruleEvaluation || !draftSuggestion) {
    return fail(
      ['Checklist nao gerou entrada suficiente para Triagem neste fluxo integrado.'],
      {
        metadata: normalized.metadata,
        inspection: inspectionPreparation.data.inspection,
        checklist: input.checklist,
        checklistAnalysis: analysis,
        applicability: analysis.applicability ?? {
          contexts: [],
          activities: [],
          nrEntries: [],
          matchedKeywords: [],
          requiredDocuments: [],
        },
        ruleEvaluation: analysis.ruleEvaluation ?? {
          matchedRules: [],
          blocking: false,
          requiredEvidence: false,
          suggestedActions: [],
          requiredDocuments: [],
        },
        triageDecision: {
          suggestedType: 'observation',
          suggestedPriority: 'baixa',
          suggestedSeverity: 'baixa',
          suggestedResponsibleRole: 'Lider operacional',
          requiresEvidence: false,
          triageWarnings: [],
          readyToSendToOperation: false,
        },
        operationalItemDraft: {
          title: input.checklist.title,
          kind: 'observation',
          priority: 'baixa',
          status: 'draft',
          nrIds: [],
          sourceLinks: [],
          ruleLinks: [],
          blocking: false,
          evidencePlan: {
            required: false,
            minimumCount: 0,
            acceptedKinds: [],
            blockingForCompletion: false,
            rationale: [],
          },
          evidenceIds: [],
        },
        operationalItem: {
          id: 'invalid-item',
          title: input.checklist.title,
          kind: 'observation',
          priority: 'baixa',
          status: 'draft',
          nrIds: [],
          sourceLinks: [],
          ruleLinks: [],
          blocking: false,
          evidencePlan: {
            required: false,
            minimumCount: 0,
            acceptedKinds: [],
            blockingForCompletion: false,
            rationale: [],
          },
          evidenceIds: [],
          history: [],
          createdAt: normalized.inspection.createdAt,
          updatedAt: normalized.inspection.updatedAt,
        },
        evidenceValidation: {
          required: false,
          minimumCount: 0,
          acceptedCount: 0,
          pendingOrApprovedCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          missingCount: 0,
          acceptedEvidenceIds: [],
          pendingOrApprovedEvidenceIds: [],
          approvedEvidenceIds: [],
          rejectedEvidenceIds: [],
          canMoveToValidation: false,
          canComplete: true,
        },
        intelligence: {
          totalItems: 0,
          openItems: 0,
          blockedItems: 0,
          evidenceGapItems: 0,
          byPriority: {},
          byContext: [],
          byActivity: [],
          byNr: [],
          insights: [],
        },
      },
      [...normalized.warnings, ...inspectionPreparation.warnings]
    );
  }

  const fieldPreparation = fieldInputService.prepareForTriage(suggestedFieldInput);
  const triageDecisionResult = triageEngine.evaluate({
    fieldInput: fieldPreparation.data.fieldInput,
    operationalItemDraft: draftSuggestion,
    operationalContextId: fieldPreparation.data.fieldInput.operationalContextId,
    criticalActivityId: fieldPreparation.data.fieldInput.criticalActivityId,
    severity: draftSuggestion.priority,
    origin: 'checklist',
    sector: fieldPreparation.data.fieldInput.sector,
    attachments: fieldPreparation.data.fieldInput.attachments,
    photos: fieldPreparation.data.fieldInput.photos,
    ruleData: buildRuleData(analysis.ruleEvaluation),
    status: draftSuggestion.status,
    responsible: draftSuggestion.responsible,
    dueAt: draftSuggestion.dueAt,
  });

  const createdItemResult = operationalItemEngine.create(
    draftSuggestion,
    fieldPreparation.data.fieldInput.createdBy
  );

  if (!createdItemResult.success) {
    return fail(createdItemResult.errors, {
      metadata: normalized.metadata,
      fieldInput: fieldPreparation.data.fieldInput,
      inspection: inspectionPreparation.data.inspection,
      checklist: input.checklist,
      checklistAnalysis: analysis,
      fieldInputPreparation: fieldPreparation.data.preparation,
      applicability: analysis.applicability,
      ruleEvaluation: analysis.ruleEvaluation,
      triageDecision: triageDecisionResult.data,
      operationalItemDraft: draftSuggestion,
      operationalItem: createdItemResult.data,
      evidenceValidation: {
        required: false,
        minimumCount: 0,
        acceptedCount: 0,
        pendingOrApprovedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        missingCount: 0,
        acceptedEvidenceIds: [],
        pendingOrApprovedEvidenceIds: [],
        approvedEvidenceIds: [],
        rejectedEvidenceIds: [],
        canMoveToValidation: false,
        canComplete: true,
      },
      intelligence: {
        totalItems: 0,
        openItems: 0,
        blockedItems: 0,
        evidenceGapItems: 0,
        byPriority: {},
        byContext: [],
        byActivity: [],
        byNr: [],
        insights: [],
      },
    }, [...normalized.warnings, ...inspectionPreparation.warnings, ...fieldPreparation.warnings, ...triageDecisionResult.warnings, ...createdItemResult.warnings]);
  }

  const evidenceValidationResult = evidenceEngine.evaluate(
    createdItemResult.data,
    [...collectFieldEvidences(fieldPreparation.data.fieldInput), ...collectInspectionEvidences(inspectionPreparation.data.inspection)]
  );
  const intelligenceResult = intelligenceEngine.generate([createdItemResult.data]);

  return ok(
    {
      metadata: normalized.metadata,
      fieldInput: fieldPreparation.data.fieldInput,
      inspection: inspectionPreparation.data.inspection,
      checklist: input.checklist,
      checklistAnalysis: analysis,
      fieldInputPreparation: fieldPreparation.data.preparation,
      applicability: analysis.applicability,
      ruleEvaluation: analysis.ruleEvaluation,
      triageDecision: triageDecisionResult.data,
      operationalItemDraft: draftSuggestion,
      operationalItem: createdItemResult.data,
      evidenceValidation: evidenceValidationResult.data,
      intelligence: intelligenceResult.data,
    },
    [
      ...normalized.warnings,
      ...inspectionPreparation.warnings,
      ...fieldPreparation.warnings,
      ...triageDecisionResult.warnings,
      ...createdItemResult.warnings,
      ...evidenceValidationResult.warnings,
      ...intelligenceResult.warnings,
    ]
  );
}

export function attemptTriageToOperation(
  draft: OperationalItemDraft
): EngineResult<ApexOpsDispatchResult> {
  const triageReview = triageService.review({
    operationalItemDraft: draft,
    operationalContextId: draft.contextId,
    criticalActivityId: draft.activityId,
    severity: draft.priority,
    origin: inferOriginFromDraft(draft),
    sector: draft.sector,
    status: draft.status,
    responsible: draft.responsible,
    responsibleRole: draft.responsibleRole,
    dueAt: draft.dueAt,
    ruleData:
      draft.ruleLinks[0]
        ? {
            ruleId: draft.ruleLinks[0].ruleId,
            ruleTitle: draft.ruleLinks[0].title,
            requiresEvidence: draft.evidencePlan.required,
          }
        : undefined,
  });

  const missingResponsible = draft.priority === 'critica' && !draft.responsible;
  if (missingResponsible) {
    return fail(
      ['Item critico nao pode sair da Triagem sem responsavel definido.'],
      {
        item: draft,
        triageDecision: triageReview.data.decision,
        blocked: true,
        blockedReason: 'responsavel_obrigatorio',
      },
      triageReview.warnings
    );
  }

  const missingDueDate = draft.priority === 'critica' && !draft.dueAt;
  if (missingDueDate) {
    return fail(
      ['Item critico nao pode sair da Triagem sem prazo definido.'],
      {
        item: draft,
        triageDecision: triageReview.data.decision,
        blocked: true,
        blockedReason: 'prazo_obrigatorio',
      },
      triageReview.warnings
    );
  }

  const dispatchResult = triageService.sendToOperation(draft, triageReview.data.decision);
  if (!dispatchResult.success) {
    return fail(dispatchResult.errors, {
      item: dispatchResult.data.operationDraft,
      triageDecision: dispatchResult.data.decision,
      blocked: true,
      blockedReason: 'triagem_nao_liberada',
    }, [...triageReview.warnings, ...dispatchResult.warnings]);
  }

  return ok(
    {
      item: dispatchResult.data.operationDraft,
      triageDecision: dispatchResult.data.decision,
      blocked: false,
      dispatchStatus: dispatchResult.data.dispatch.status,
    },
    [...triageReview.warnings, ...dispatchResult.warnings]
  );
}

export function attemptCompletionWithEvidence(
  item: OperationalItem,
  evidences: Evidence[],
  justification?: string
): EngineResult<ApexOpsCompletionResult> {
  const validationResult = evidenceEngine.validateTransition({
    item,
    evidences,
    targetStatus: 'completed',
    justification,
  });

  if (!validationResult.success) {
    return fail(validationResult.errors, {
      itemId: item.id,
      targetStatus: 'completed',
      evidenceValidation: validationResult.data,
    }, validationResult.warnings);
  }

  return ok(
    {
      itemId: item.id,
      targetStatus: 'completed',
      evidenceValidation: validationResult.data,
    },
    validationResult.warnings
  );
}

export const apexOpsFlowEngine = {
  runFieldInputFlow: runFieldInputToTriageFlow,
  runChecklistFlow: runInspectionChecklistToTriageFlow,
  attemptTriageToOperation,
  attemptCompletionWithEvidence,
};
