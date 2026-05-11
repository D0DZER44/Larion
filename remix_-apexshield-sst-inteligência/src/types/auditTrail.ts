export type AuditTrailEventType =
  | 'item_criado'
  | 'item_triado'
  | 'responsavel_atribuido'
  | 'prazo_alterado'
  | 'status_alterado'
  | 'evidencia_adicionada'
  | 'item_enviado_para_validacao'
  | 'item_concluido'
  | 'item_reaberto'
  | 'item_cancelado';

export interface AuditTrailEntry {
  id: string;
  itemId: string;
  eventType: AuditTrailEventType;
  occurredAt: string;
  actor?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  immutable: true;
}

export interface AuditTrailComparisonInput<T> {
  before?: T;
  after: T;
  actor?: string;
  note?: string;
}
