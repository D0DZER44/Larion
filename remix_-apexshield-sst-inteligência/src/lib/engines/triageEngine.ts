import type { OperationalItemDraft, OperationalItemEvidencePlan, OperationalItemKind, OperationalItemPriority } from '@/src/types/operationalItem';
import { ok, fail, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import type { TriageDecisionData, TriageEngineInput as InboxTriageEngineInput } from '@/src/types/triage';
import type { ChecklistFinding } from './checklistEngine';
import type { ApplicabilityProfile } from './applicabilityEngine';
import type { SSTRuleEvaluation } from './sstRuleEngine';

export interface TriageEngineInput {
  fieldInput?: FieldInput;
  inspection?: Inspection;
  applicability: ApplicabilityProfile;
  checklistFindings?: ChecklistFinding[];
  ruleEvaluation: SSTRuleEvaluation;
}

export interface TriageDecision {
  priority: OperationalItemPriority;
  kind: OperationalItemKind;
  suggestedResponsibleRole: string;
  suggestedEvidencePlan: OperationalItemEvidencePlan;
  rationale: string[];
  draft: OperationalItemDraft;
}

const priorityRank: OperationalItemPriority[] = ['baixa', 'media', 'alta', 'critica'];

function priorityToSeverity(priority: OperationalItemPriority): 'baixa' | 'media' | 'alta' | 'critica' {
  return priority;
}

function severityToPriority(value?: string): OperationalItemPriority {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('crit')) return 'critica';
  if (normalized.includes('alt')) return 'alta';
  if (normalized.includes('med')) return 'media';
  return 'baixa';
}

function maxPriority(values: OperationalItemPriority[]): OperationalItemPriority {
  return values.sort((a, b) => priorityRank.indexOf(b) - priorityRank.indexOf(a))[0] ?? 'baixa';
}

function addHours(baseDate: string, hours: number): string {
  const base = new Date(baseDate);
  base.setHours(base.getHours() + Math.max(hours, 0));
  return base.toISOString();
}

function inferOrigin(input: InboxTriageEngineInput): string | undefined {
  return input.origin ?? input.fieldInput?.origin ?? input.fieldInput?.source ?? (input.operationalItemDraft ? 'operational_item' : undefined);
}

function inferContextId(input: InboxTriageEngineInput): string | undefined {
  return (
    input.operationalContextId ??
    input.fieldInput?.operationalContextId ??
    input.fieldInput?.contextId ??
    input.operationalItemDraft?.contextId
  );
}

function inferSeverity(input: InboxTriageEngineInput): 'baixa' | 'media' | 'alta' | 'critica' {
  return (
    input.severity ??
    input.fieldInput?.suggestedSeverity ??
    input.operationalItemDraft?.ruleLinks?.[0]?.severity ??
    priorityToSeverity(input.operationalItemDraft?.priority ?? 'baixa')
  );
}

function inferPriority(input: InboxTriageEngineInput): OperationalItemPriority {
  return (
    input.operationalItemDraft?.priority ??
    input.fieldInput?.suggestedPriority ??
    severityToPriority(inferSeverity(input))
  );
}

function inferSuggestedType(input: InboxTriageEngineInput): OperationalItemKind {
  if (input.operationalItemDraft?.kind) return input.operationalItemDraft.kind;

  const priority = inferPriority(input);
  const severity = inferSeverity(input);
  const hasRuleSignal = Boolean(input.ruleData?.ruleId);
  const hasAttachment = (input.attachments?.length ?? 0) > 0 || (input.photos?.length ?? 0) > 0;

  if (priority === 'critica' || severity === 'critica') return 'criticalDeviation';
  if (hasRuleSignal) return 'nonconformity';
  if (hasAttachment) return 'incidentSignal';
  return 'observation';
}

function inferSuggestedDueHours(input: InboxTriageEngineInput): number | undefined {
  if (typeof input.dueHours === 'number') return input.dueHours;
  if (typeof input.ruleData?.suggestedDueHours === 'number') return input.ruleData.suggestedDueHours;

  const severity = inferSeverity(input);
  if (severity === 'critica') return 24;
  if (severity === 'alta') return 72;
  if (severity === 'media') return 168;
  return 720;
}

function inferRequiresEvidence(input: InboxTriageEngineInput): boolean {
  if (typeof input.ruleData?.requiresEvidence === 'boolean') return input.ruleData.requiresEvidence;

  const severity = inferSeverity(input);
  return severity === 'critica' || severity === 'alta';
}

function inferResponsibleRole(input: InboxTriageEngineInput): string {
  return (
    input.responsibleRole ??
    input.operationalItemDraft?.responsibleRole ??
    input.ruleData?.suggestedResponsibleRole ??
    (inferSeverity(input) === 'critica' ? 'SSO / Lider operacional' : 'Lider operacional')
  );
}

function inferDueDate(input: InboxTriageEngineInput): string | undefined {
  if (input.dueAt) return input.dueAt;
  if (input.operationalItemDraft?.dueAt) return input.operationalItemDraft.dueAt;

  const dueHours = inferSuggestedDueHours(input);
  if (typeof dueHours !== 'number') return undefined;

  const baseDate =
    input.fieldInput?.createdAt ??
    input.operationalItemDraft?.createdAt ??
    new Date().toISOString();

  return addHours(baseDate, dueHours);
}

export function evaluateTriageInbox(
  input: InboxTriageEngineInput
): EngineResult<TriageDecisionData> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const triageWarnings: string[] = [];

  const origin = inferOrigin(input);
  if (!origin) {
    errors.push('Triagem exige origem valida para revisar a pendencia.');
  }

  const contextId = inferContextId(input);
  if (!contextId) {
    warnings.push('Item sem contexto operacional definido; usando base_sst como fallback.');
    triageWarnings.push('Contexto ausente. Fallback aplicado: base_sst.');
  }

  const suggestedType = inferSuggestedType(input);
  const suggestedPriority = inferPriority(input);
  const suggestedSeverity = inferSeverity(input);
  const suggestedDueHours = inferSuggestedDueHours(input);
  const suggestedDueDate = inferDueDate(input);
  const suggestedResponsibleRole = inferResponsibleRole(input);
  const requiresEvidence = inferRequiresEvidence(input);

  const effectiveStatus = input.status ?? input.operationalItemDraft?.status ?? input.fieldInput?.status ?? 'triaged';
  const responsible = input.responsible ?? input.operationalItemDraft?.responsible;

  if (effectiveStatus === 'cancelled' && !input.cancellationJustification?.trim()) {
    errors.push('Item cancelado exige justificativa para permanecer na Triagem.');
  }

  if (suggestedSeverity === 'critica' && !responsible) {
    triageWarnings.push('Item critico ainda nao possui responsavel definido.');
  }

  if (suggestedSeverity === 'critica' && !suggestedDueDate) {
    triageWarnings.push('Item critico ainda nao possui prazo definido.');
  }

  if (requiresEvidence) {
    triageWarnings.push('Item pode exigir evidencia antes do encerramento operacional.');
  }

  const readyToSendToOperation =
    errors.length === 0 &&
    effectiveStatus !== 'cancelled' &&
    (suggestedSeverity !== 'critica' || (Boolean(responsible) && Boolean(suggestedDueDate)));

  const data: TriageDecisionData = {
    suggestedType,
    suggestedPriority,
    suggestedSeverity,
    suggestedDueDate,
    suggestedDueHours,
    suggestedResponsibleRole,
    requiresEvidence,
    triageWarnings,
    readyToSendToOperation,
  };

  if (errors.length > 0) {
    return fail(errors, data, warnings);
  }

  return ok(data, warnings);
}

function buildTitle(fieldInput?: FieldInput, findings: ChecklistFinding[] = []): string {
  const text = String(fieldInput?.title ?? fieldInput?.description ?? fieldInput?.text ?? '').trim();
  if (text) return text.length > 90 ? `${text.slice(0, 87).trim()}...` : text;
  if (findings.length > 0) return findings[0].questionText;
  return 'Item operacional sem titulo';
}

function classifyKind(priority: OperationalItemPriority, blocking: boolean, findings: ChecklistFinding[]): OperationalItemKind {
  if (blocking || priority === 'critica') return 'criticalDeviation';
  if (findings.length > 0) return 'nonconformity';
  return 'observation';
}

export function classifyForTriage(input: TriageEngineInput): EngineResult<TriageDecision> {
  const findings = input.checklistFindings ?? [];
  const priority = maxPriority([
    severityToPriority(input.fieldInput?.suggestedPriority ?? input.fieldInput?.reporterPriority),
    ...findings.map((finding) => severityToPriority(finding.severity)),
    ...input.ruleEvaluation.matchedRules.map((match) => severityToPriority(match.rule.severity)),
  ]);

  if (!input.fieldInput && !input.inspection && findings.length === 0) {
    return fail(
      ['Triagem precisa de origem valida para classificar o item operacional.'],
      {
        priority: 'baixa',
        kind: 'observation',
        suggestedResponsibleRole: 'Operacao',
        suggestedEvidencePlan: {
          required: false,
          minimumCount: 0,
          acceptedKinds: [],
          blockingForCompletion: false,
          rationale: [],
        },
        rationale: [],
        draft: {
          title: 'Item invalido',
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
      }
    );
  }

  const blocking = input.ruleEvaluation.blocking || findings.some((finding) => finding.blocking);
  const kind = classifyKind(priority, blocking, findings);
  const suggestedResponsibleRole =
    blocking || priority === 'critica' ? 'SSO / Lider operacional' : 'Lider operacional';
  const evidenceRequired =
    input.ruleEvaluation.requiredEvidence || findings.some((finding) => finding.requiresEvidence);
  const suggestedEvidencePlan: OperationalItemEvidencePlan = {
    required: evidenceRequired,
    minimumCount: blocking ? 2 : evidenceRequired ? 1 : 0,
    acceptedKinds: evidenceRequired ? ['foto', 'arquivo', 'checklist'] : [],
    blockingForCompletion: evidenceRequired,
    rationale: [
      ...(blocking ? ['Item bloqueante exige prova de regularizacao antes do encerramento.'] : []),
      ...(evidenceRequired ? ['Ha regra ou resposta critica exigindo evidencia.'] : []),
    ],
  };

  const deadlineHours = Math.min(
    ...[
      ...findings.map((finding) => finding.defaultDeadlineHours ?? Number.POSITIVE_INFINITY),
      ...input.ruleEvaluation.matchedRules.map((match) => match.rule.defaultDeadlineHours),
    ].filter((value) => Number.isFinite(value))
  );

  const createdAt =
    input.fieldInput?.createdAt ?? input.inspection?.createdAt ?? new Date().toISOString();

  const rationale = [
    `Prioridade calculada como ${priority}.`,
    ...(blocking ? ['Item precisa de tratamento imediato por impacto operacional bloqueante.'] : []),
    ...input.ruleEvaluation.matchedRules.slice(0, 5).map((match) => `Regra aplicada: ${match.rule.title}.`),
  ];

  const draft: OperationalItemDraft = {
    title: buildTitle(input.fieldInput, findings),
    description:
      findings.map((finding) => finding.observation ?? finding.questionText).filter(Boolean).join(' | ') ||
      input.fieldInput?.description ||
      input.fieldInput?.text,
    kind,
    priority,
    status: 'triaged',
    sector: input.fieldInput?.sector ?? input.inspection?.sector,
    contextId:
      input.fieldInput?.operationalContextId ??
      input.fieldInput?.contextId ??
      input.inspection?.operationalContextId ??
      input.inspection?.contextId ??
      input.applicability.contexts[0]?.id,
    activityId:
      input.fieldInput?.criticalActivityId ??
      input.fieldInput?.activityId ??
      input.inspection?.criticalActivityId ??
      input.applicability.activities[0]?.id,
    checklistId: input.inspection?.checklistId,
    inspectionId: input.inspection?.id,
    fieldInputId: input.fieldInput?.id,
    nrIds: Array.from(
      new Set([
        ...input.applicability.nrEntries.map((entry) => entry.id),
        ...findings.map((finding) => finding.nr).filter(Boolean) as string[],
      ])
    ),
    sourceLinks: [
      ...(input.fieldInput
        ? [{ type: 'fieldInput' as const, id: input.fieldInput.id, label: input.fieldInput.origin ?? input.fieldInput.source }]
        : []),
      ...(input.inspection ? [{ type: 'inspection' as const, id: input.inspection.id, label: input.inspection.title }] : []),
      ...findings.map((finding) => ({
        type: 'checklist' as const,
        id: input.inspection?.checklistId ?? 'checklist-sem-id',
        questionId: finding.questionId,
        label: finding.questionText,
        ruleId: finding.ruleId,
      })),
    ],
    ruleLinks: input.ruleEvaluation.matchedRules.map((match) => ({
      ruleId: match.rule.id,
      title: match.rule.title,
      scope: match.rule.scope,
      severity: match.rule.severity,
      matchedBy: match.matchedBy,
      blocking: match.rule.blocking,
    })),
    blocking,
    responsibleRole: suggestedResponsibleRole,
    dueAt: Number.isFinite(deadlineHours) ? addHours(createdAt, deadlineHours) : undefined,
    evidencePlan: suggestedEvidencePlan,
    evidenceIds: [],
    requiredDocuments: Array.from(
      new Set([...input.applicability.requiredDocuments, ...input.ruleEvaluation.requiredDocuments])
    ),
    recommendedActions: Array.from(
      new Set([
        ...input.ruleEvaluation.suggestedActions,
        ...findings.map((finding) => finding.suggestedAction).filter(Boolean) as string[],
      ])
    ),
    tags: input.fieldInput?.tags ?? [],
    detectedKeywords: input.applicability.matchedKeywords,
    autoGenerated: true,
  };

  return ok({
    priority,
    kind,
    suggestedResponsibleRole,
    suggestedEvidencePlan,
    rationale,
    draft,
  });
}

export const triageEngine = {
  evaluate: evaluateTriageInbox,
  classify: classifyForTriage,
};
