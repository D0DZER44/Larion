import type { Evidence } from './evidence';
import type { OperationalItemKind, OperationalItemPriority } from './operationalItem';
import type { SSTRuleSeverity } from './sstRule';

export type FieldInputId = string;
export type FieldInputOrigin = 'manual' | 'inspection' | 'checklist' | 'audit' | 'lari';

export interface FieldInput {
  id: FieldInputId;
  title: string;
  description?: string;
  origin: FieldInputOrigin;
  sector?: string;
  operationalContextId?: string;
  criticalActivityId?: string;
  attachments?: Evidence[];
  photos?: Evidence[];
  suggestedPriority?: OperationalItemPriority;
  suggestedSeverity?: SSTRuleSeverity;
  suggestedNR?: string;
  createdBy?: string;
  createdAt: string;
  convertedToOperationalItemId?: string;

  // Compatibility aliases for the new engine layer during migration.
  source?: FieldInputOrigin;
  text?: string;
  contextId?: string;
  activityId?: string;
  reporter?: string;
  reporterPriority?: OperationalItemPriority;
  checklistHints?: string[];
  tags?: string[];
  geolocation?: { lat: number; lng: number };
  occurredAt?: string;
  status?: 'pending' | 'triaged' | 'discarded';
  resultingItemId?: string;
  metadata?: Record<string, unknown>;
}

export interface FieldInputTriagePayload {
  sourceType: 'field';
  routeTo: 'triage';
  fieldInputId: string;
  suggestedItemType: OperationalItemKind;
  suggestedPriority: OperationalItemPriority;
  suggestedSeverity: SSTRuleSeverity;
  suggestedContextId?: string;
  suggestedCriticalActivityId?: string;
  suggestedChecklistIds: string[];
  suggestedNrIds: string[];
  summary: string;
}
