import { ok, fail, type EngineResult } from '@/src/types/engineResult';
import type { OperationalItem, OperationalItemDraft } from '@/src/types/operationalItem';
import type { AutomationExecutionEvent, AutomationRule } from '@/src/types/automationRule';
import type { Evidence } from '@/src/types/evidence';

export const SAFE_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'auto-critical-without-responsible',
    label: 'Alerta para item critico sem responsavel',
    description: 'Marca alerta quando item critico nao possui responsavel definido.',
    trigger: 'critical_without_responsible',
    action: 'mark_alert',
    active: true,
    safe: true,
  },
  {
    id: 'auto-due-date-passed',
    label: 'Marcar item vencido quando prazo expira',
    description: 'Move o item para vencido quando o prazo ja passou e o item segue aberto.',
    trigger: 'due_date_passed',
    action: 'set_status_vencido',
    active: true,
    safe: true,
  },
  {
    id: 'auto-block-completion-without-evidence',
    label: 'Bloquear conclusao sem evidencia obrigatoria',
    description: 'Impede concluido quando evidencia obrigatoria ainda nao existe.',
    trigger: 'completion_without_required_evidence',
    action: 'block_transition',
    active: true,
    safe: true,
  },
  {
    id: 'auto-triage-to-operation',
    label: 'Mover item aprovado da Triagem para a_fazer',
    description: 'Quando a Triagem libera, o item segue para a_fazer.',
    trigger: 'triage_sent_to_operation',
    action: 'set_status_a_fazer',
    active: true,
    safe: true,
  },
  {
    id: 'auto-evidence-added-validation',
    label: 'Mover para em_validacao quando evidencia chega',
    description: 'Ao receber evidencia suficiente, item pode ir para em_validacao.',
    trigger: 'evidence_added',
    action: 'set_status_em_validacao',
    active: true,
    safe: true,
  },
  {
    id: 'auto-reopened-requires-justification',
    label: 'Reabertura exige justificativa',
    description: 'Qualquer reabertura deve registrar justificativa.',
    trigger: 'reopened',
    action: 'require_justification',
    active: true,
    safe: true,
  },
];

export interface AutomationContext {
  evidences?: Evidence[];
  targetStatus?: OperationalItem['status'];
  justification?: string;
  fromTriage?: boolean;
}

export interface AutomationResult {
  item: OperationalItemDraft;
  blocked: boolean;
  alerts: string[];
  events: AutomationExecutionEvent[];
}

function hasEnoughEvidence(item: OperationalItem | OperationalItemDraft, evidences: Evidence[] = []): boolean {
  const currentEvidenceCount = Math.max(item.evidenceIds.length, evidences.length);
  return currentEvidenceCount >= item.evidencePlan.minimumCount;
}

export function validateAutomationRules(rules: AutomationRule[]): EngineResult<AutomationRule[]> {
  const errors: string[] = [];

  rules.forEach((rule) => {
    if (!rule.safe) errors.push(`Automacao ${rule.id} nao e segura para o dominio SST.`);
    if (rule.forbiddenActions?.length) {
      errors.push(`Automacao ${rule.id} declara acao proibida para o dominio SST.`);
    }
    if (
      rule.action === 'set_status_a_fazer' &&
      rule.trigger !== 'triage_sent_to_operation'
    ) {
      errors.push(`Automacao ${rule.id} nao pode mover item para a_fazer fora da Triagem.`);
    }
  });

  if (errors.length > 0) return fail(errors, rules);
  return ok(rules);
}

export function applySafeAutomations(
  item: OperationalItem | OperationalItemDraft,
  context: AutomationContext = {},
  rules: AutomationRule[] = SAFE_AUTOMATION_RULES
): EngineResult<AutomationResult> {
  const validation = validateAutomationRules(rules);
  if (!validation.success) {
    return fail(validation.errors, {
      item,
      blocked: true,
      alerts: [],
      events: [],
    });
  }

  const alerts: string[] = [];
  const events: AutomationExecutionEvent[] = [];
  let blocked = false;
  let nextItem: OperationalItemDraft = { ...item };

  rules.filter((rule) => rule.active).forEach((rule) => {
    if (
      rule.trigger === 'critical_without_responsible' &&
      nextItem.priority === 'critica' &&
      !nextItem.responsible
    ) {
      alerts.push('Item critico sem responsavel definido.');
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: alerts[alerts.length - 1] });
    }

    if (
      rule.trigger === 'due_date_passed' &&
      nextItem.dueAt &&
      nextItem.status !== 'completed' &&
      nextItem.status !== 'cancelled' &&
      new Date(nextItem.dueAt).getTime() < Date.now()
    ) {
      nextItem.status = 'vencido';
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: 'Prazo expirado; item marcado como vencido.', nextStatus: 'vencido' });
    }

    if (
      rule.trigger === 'completion_without_required_evidence' &&
      context.targetStatus === 'completed' &&
      nextItem.evidencePlan.required &&
      !hasEnoughEvidence(nextItem, context.evidences)
    ) {
      blocked = true;
      alerts.push('Conclusao bloqueada: item exige evidencia obrigatoria.');
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: alerts[alerts.length - 1] });
    }

    if (
      rule.trigger === 'triage_sent_to_operation' &&
      context.fromTriage
    ) {
      nextItem.status = 'a_fazer';
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: 'Item enviado da Triagem para a_fazer.', nextStatus: 'a_fazer' });
    }

    if (
      rule.trigger === 'evidence_added' &&
      nextItem.evidencePlan.required &&
      hasEnoughEvidence(nextItem, context.evidences) &&
      (nextItem.status === 'awaitingEvidence' || nextItem.status === 'inProgress' || nextItem.status === 'vencido')
    ) {
      nextItem.status = 'em_validacao';
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: 'Evidencia suficiente recebida; item pode ir para em_validacao.', nextStatus: 'em_validacao' });
    }

    if (
      rule.trigger === 'reopened' &&
      context.targetStatus === 'inProgress' &&
      nextItem.status === 'completed' &&
      !context.justification?.trim()
    ) {
      blocked = true;
      alerts.push('Reabertura bloqueada: justificativa obrigatoria.');
      events.push({ ruleId: rule.id, action: rule.action, applied: true, message: alerts[alerts.length - 1] });
    }
  });

  return ok({
    item: nextItem,
    blocked,
    alerts,
    events,
  });
}

export const automationEngine = {
  validateRules: validateAutomationRules,
  apply: applySafeAutomations,
  defaults: SAFE_AUTOMATION_RULES,
};
