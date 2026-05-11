import type { OperationalItemStatus } from './operationalItem';

export type AutomationTrigger =
  | 'critical_without_responsible'
  | 'due_date_passed'
  | 'completion_without_required_evidence'
  | 'triage_sent_to_operation'
  | 'evidence_added'
  | 'reopened';

export type AutomationAction =
  | 'mark_alert'
  | 'set_status_vencido'
  | 'block_transition'
  | 'set_status_a_fazer'
  | 'set_status_em_validacao'
  | 'require_justification';

export interface AutomationRule {
  id: string;
  label: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  active: boolean;
  safe: true;
  forbiddenActions?: Array<'delete_item' | 'force_complete_critical_without_evidence' | 'remove_history' | 'create_definitive_penalty' | 'send_direct_to_completed'>;
}

export interface AutomationExecutionEvent {
  ruleId: string;
  action: AutomationAction;
  applied: boolean;
  message: string;
  nextStatus?: OperationalItemStatus;
}
