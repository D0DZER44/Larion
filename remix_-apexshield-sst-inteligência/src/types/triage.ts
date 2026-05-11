import type { Evidence } from './evidence';
import type { FieldInput, FieldInputOrigin } from './fieldInput';
import type {
  OperationalItemDraft,
  OperationalItemKind,
  OperationalItemPriority,
  OperationalItemStatus,
} from './operationalItem';
import type { SSTRuleSeverity } from './sstRule';

export type TriageOrigin = FieldInputOrigin | 'operational_item' | 'legacy';

export interface TriageRuleData {
  ruleId?: string;
  ruleTitle?: string;
  requiresEvidence?: boolean;
  suggestedDueHours?: number;
  suggestedResponsibleRole?: string;
}

export interface TriageEngineInput {
  fieldInput?: FieldInput;
  operationalItemDraft?: OperationalItemDraft;
  operationalContextId?: string;
  criticalActivityId?: string;
  severity?: SSTRuleSeverity;
  origin?: TriageOrigin;
  sector?: string;
  attachments?: Evidence[];
  photos?: Evidence[];
  ruleData?: TriageRuleData;
  status?: OperationalItemStatus;
  responsible?: string;
  responsibleRole?: string;
  dueAt?: string;
  dueHours?: number;
  cancellationJustification?: string;
}

export interface TriageDecisionData {
  suggestedType: OperationalItemKind;
  suggestedPriority: OperationalItemPriority;
  suggestedSeverity: SSTRuleSeverity;
  suggestedDueDate?: string;
  suggestedDueHours?: number;
  suggestedResponsibleRole: string;
  requiresEvidence: boolean;
  triageWarnings: string[];
  readyToSendToOperation: boolean;
}

export interface TriageOperationDispatch {
  status: 'a_fazer';
  sentAt: string;
  ready: true;
}
