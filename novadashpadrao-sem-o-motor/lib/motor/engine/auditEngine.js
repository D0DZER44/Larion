import { generateId } from "../core/idUtils.js";

export function createAuditLog(payload = {}) {
  return {
    id: generateId("AUD"),
    entityType: payload.entityType || "entity",
    entityId: payload.entityId || generateId("ENT"),
    eventType: payload.eventType || "manual",
    userId: payload.userId,
    userName: payload.userName,
    before: payload.before,
    after: payload.after,
    reason: payload.reason,
    origin: payload.origin || "motor-js",
    nrCode: payload.nrCode,
    ruleId: payload.ruleId,
    createdAt: payload.createdAt || Date.now(),
  };
}

export function registerEntityCreated(entityType, entityId, after, origin = "manual") {
  return createAuditLog({ entityType, entityId, eventType: "entity-created", after, origin });
}

export function registerEntityUpdated(entityType, entityId, before, after, origin = "manual") {
  return createAuditLog({ entityType, entityId, eventType: "entity-updated", before, after, origin });
}

export function registerStatusChanged(entityType, entityId, beforeStatus, afterStatus, reason = "", origin = "manual") {
  return createAuditLog({
    entityType,
    entityId,
    eventType: "status-changed",
    before: { status: beforeStatus },
    after: { status: afterStatus },
    reason,
    origin,
  });
}

export function registerEvidenceAdded(entityType, entityId, evidence, origin = "manual") {
  return createAuditLog({ entityType, entityId, eventType: "evidence-added", after: { evidence }, origin });
}

export function registerActionClosed(entityId, evidence = [], origin = "motor-operacional") {
  return createAuditLog({ entityType: "Action", entityId, eventType: "action-closed", after: { evidence }, origin });
}

export function registerActionReopened(entityId, reason = "", origin = "manual") {
  return createAuditLog({ entityType: "Action", entityId, eventType: "action-reopened", reason, origin });
}

export function registerRuleTriggered(entityId, rule, context = {}) {
  return createAuditLog({
    entityType: "NonConformity",
    entityId,
    eventType: "rule-triggered",
    nrCode: rule.nr,
    ruleId: rule.id,
    after: context,
    origin: "motor-normativo",
  });
}
