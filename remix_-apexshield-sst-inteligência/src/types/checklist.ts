import type { Evidence } from './evidence';
import type { FieldInput } from './fieldInput';
import type { OperationalItemDraft } from './operationalItem';
import type { OperationalContextId } from './operationalContext';
import type { CriticalActivityId } from './criticalActivity';
import type { SSTRuleSeverity } from './sstRule';

export type ChecklistId = string;
export type ChecklistQuestionId = string;

export type ChecklistAnswerStatus = 'pending' | 'yes' | 'no' | 'partial' | 'na';
export type ChecklistAnswerValue = ChecklistAnswerStatus | boolean | number | string | null;

export interface ChecklistQuestion {
  id: ChecklistQuestionId;
  text: string;
  answerType: 'yes-no-partial' | 'yes-no' | 'rating' | 'number' | 'text';
  nr?: string;
  package?: string;
  severity?: SSTRuleSeverity;
  suggestedAction?: string;
  requiresEvidence?: boolean;
  generatesItem?: boolean;
  defaultDeadlineHours?: number;
  ruleId?: string;
  contextId?: OperationalContextId;
  activityId?: CriticalActivityId;
  criticalStatuses?: ChecklistAnswerStatus[];
  blocking?: boolean;
  impactsScore?: boolean;
  fixed?: boolean;
  editable?: boolean;
  removable?: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  questions: ChecklistQuestion[];
}

export interface Checklist {
  id: ChecklistId;
  title: string;
  category?: string;
  package: string;
  nr?: string;
  sectors?: string[];
  activities?: CriticalActivityId[];
  defaultSeverity?: SSTRuleSeverity;
  sections: ChecklistSection[];
  active: boolean;
  fixed?: boolean;
}

export interface ChecklistAnswer {
  questionId: ChecklistQuestionId;
  question: string;
  answer: ChecklistAnswerValue;
  isCritical?: boolean;
  nr?: string;
  ruleId?: string;
  evidenceRequired?: boolean;
  attachments?: Evidence[];

  // Compatibility aliases for the engine layer during migration.
  status?: ChecklistAnswerStatus;
  observation?: string;
  evidenceRefs?: string[];
  answeredAt?: string;
  answeredBy?: string;
}

export interface ChecklistFieldInputSuggestion {
  questionId: string;
  fieldInput: FieldInput;
  rationale: string[];
}

export interface ChecklistOperationalDraftSuggestion {
  questionId: string;
  draft: OperationalItemDraft;
  rationale: string[];
}
