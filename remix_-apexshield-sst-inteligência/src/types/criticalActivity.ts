import type { EvidenceKind } from './evidence';

export type CriticalActivityId = string;

export interface CriticalActivity {
  id: CriticalActivityId;
  name: string;
  keywords: string[];
  relatedNrs: string[];
  baseSeverity: 'baixa' | 'media' | 'alta' | 'critica';
  requiredPpe?: string[];
  requiredDocuments?: string[];
  requiredEvidenceKinds?: EvidenceKind[];
  contextIds?: string[];
  blocksOperationOnNonConformity?: boolean;
  active?: boolean;
}

export type CriticalActivityRef = Pick<CriticalActivity, 'id' | 'name' | 'baseSeverity'>;
