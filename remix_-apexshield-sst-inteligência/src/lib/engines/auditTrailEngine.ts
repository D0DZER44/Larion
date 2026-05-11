import { ok, type EngineResult } from '@/src/types/engineResult';
import type { AuditTrailComparisonInput, AuditTrailEntry, AuditTrailEventType } from '@/src/types/auditTrail';
import type { OperationalItem, OperationalItemDraft } from '@/src/types/operationalItem';

function nowIso(): string {
  return new Date().toISOString();
}

function createEntry(
  itemId: string,
  eventType: AuditTrailEventType,
  actor?: string,
  note?: string,
  metadata?: Record<string, unknown>
): AuditTrailEntry {
  return {
    id: globalThis.crypto.randomUUID(),
    itemId,
    eventType,
    occurredAt: nowIso(),
    actor,
    note,
    metadata,
    immutable: true,
  };
}

export function createAuditTrailEntry(
  itemId: string,
  eventType: AuditTrailEventType,
  actor?: string,
  note?: string,
  metadata?: Record<string, unknown>
): EngineResult<AuditTrailEntry> {
  return ok(createEntry(itemId, eventType, actor, note, metadata));
}

export function deriveAuditTrailEntries(
  input: AuditTrailComparisonInput<OperationalItem | OperationalItemDraft>
): EngineResult<AuditTrailEntry[]> {
  const before = input.before;
  const after = input.after;
  const itemId = after.id ?? 'draft-item';
  const entries: AuditTrailEntry[] = [];

  if (!before) {
    entries.push(createEntry(itemId, 'item_criado', input.actor, input.note));
    if (after.status === 'triaged') {
      entries.push(createEntry(itemId, 'item_triado', input.actor, input.note));
    }
    return ok(entries);
  }

  if (!before.responsible && after.responsible) {
    entries.push(createEntry(itemId, 'responsavel_atribuido', input.actor, input.note, {
      responsible: after.responsible,
    }));
  }

  if (before.dueAt !== after.dueAt) {
    entries.push(createEntry(itemId, 'prazo_alterado', input.actor, input.note, {
      beforeDueAt: before.dueAt,
      afterDueAt: after.dueAt,
    }));
  }

  if (before.status !== after.status) {
    entries.push(createEntry(itemId, 'status_alterado', input.actor, input.note, {
      beforeStatus: before.status,
      afterStatus: after.status,
    }));

    if (after.status === 'em_validacao') {
      entries.push(createEntry(itemId, 'item_enviado_para_validacao', input.actor, input.note));
    }
    if (after.status === 'completed') {
      entries.push(createEntry(itemId, 'item_concluido', input.actor, input.note));
    }
    if (before.status === 'completed' && after.status !== 'completed') {
      entries.push(createEntry(itemId, 'item_reaberto', input.actor, input.note));
    }
    if (after.status === 'cancelled') {
      entries.push(createEntry(itemId, 'item_cancelado', input.actor, input.note));
    }
  }

  if ((after.evidenceIds?.length ?? 0) > (before.evidenceIds?.length ?? 0)) {
    entries.push(createEntry(itemId, 'evidencia_adicionada', input.actor, input.note, {
      beforeEvidenceCount: before.evidenceIds.length,
      afterEvidenceCount: after.evidenceIds.length,
    }));
  }

  return ok(entries);
}

export const auditTrailEngine = {
  create: createAuditTrailEntry,
  derive: deriveAuditTrailEntries,
};
