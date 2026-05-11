import type { Evidence } from './evidence';
import type { ChecklistAnswer, ChecklistId } from './checklist';
import type { OperationalContextId } from './operationalContext';

export type InspectionId = string;

export type InspectionStatus =
  | 'scheduled'
  | 'today'
  | 'inProgress'
  | 'overdue'
  | 'completed'
  | 'cancelled';

export interface Inspection {
  id: InspectionId;
  title: string;
  checklistId: ChecklistId;
  checklistLabel?: string;
  sector: string;
  operationalContextId?: OperationalContextId;
  criticalActivityId?: string;
  nrIds?: string[];
  package?: string;
  responsible: string;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  status: InspectionStatus;
  answers: ChecklistAnswer[];
  attachments?: Evidence[];
  photos?: Evidence[];
  exposedWorkers?: number;
  exposedProfile?: string;
  notes?: string;
  fieldInputIds?: string[];
  evidenceIds?: string[];
  createdAt: string;
  createdBy?: string;
  updatedAt: string;

  // Compatibility aliases for the engine layer during migration.
  contextId?: OperationalContextId;
  generatedItemIds?: string[];
  extra?: Record<string, unknown>;
}
