import type { OperationalItemPriority, OperationalItemStatus } from './operationalItem';
import type { SSTRuleSeverity } from './sstRule';

export type WorkflowFilterKey =
  | 'status'
  | 'priority'
  | 'severity'
  | 'responsible'
  | 'sector'
  | 'operationalContext'
  | 'criticalActivity'
  | 'nr'
  | 'overdue'
  | 'unassigned'
  | 'awaitingEvidence'
  | 'origin';

export type WorkflowCustomFieldType = 'select' | 'text' | 'number' | 'date' | 'boolean';

export interface WorkflowStatusDefinition {
  key: OperationalItemStatus;
  label: string;
  description: string;
  fixed: true;
  visible: boolean;
  order: number;
}

export interface WorkflowCustomFieldDefinition {
  id: string;
  label: string;
  type: WorkflowCustomFieldType;
  description?: string;
  options?: string[];
  required?: boolean;
  active: boolean;
}

export interface WorkflowFilterPreset {
  id: string;
  label: string;
  filterKeys: WorkflowFilterKey[];
  active: boolean;
}

export interface WorkflowAlertConfig {
  criticalWithoutResponsible: boolean;
  overdueItem: boolean;
  missingEvidenceOnCompletion: boolean;
  reopenedRequiresJustification: boolean;
}

export interface WorkflowConfig {
  statuses: WorkflowStatusDefinition[];
  allowedFilters: WorkflowFilterKey[];
  customFields: WorkflowCustomFieldDefinition[];
  filterPresets: WorkflowFilterPreset[];
  allowedPriorities: OperationalItemPriority[];
  allowedSeverities: SSTRuleSeverity[];
  alerts: WorkflowAlertConfig;
  safeAutomationsOnly: true;
}
