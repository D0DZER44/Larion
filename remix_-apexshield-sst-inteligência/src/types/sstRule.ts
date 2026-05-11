export type SSTRuleId = string;

export type SSTRuleScope = 'universal' | 'nr' | 'context' | 'criticalActivity';

export type SSTRuleSeverity = 'baixa' | 'media' | 'alta' | 'critica';

export interface SSTRule {
  id: SSTRuleId;
  scope: SSTRuleScope;
  title: string;
  description?: string;
  nr?: string;
  contextId?: string;
  activityId?: string;
  package: string;
  severity: SSTRuleSeverity;
  condition: string;
  suggestedAction: string;
  defaultDeadlineHours: number;
  requiresEvidence: boolean;
  blocking?: boolean;
  estimatedFineBrl?: number;
  baseIncidentChance?: number;
  generatesItem: boolean;
  impactsScore: boolean;
  keywords?: string[];
  requiredDocuments?: string[];
  fixed?: boolean;
  editable?: boolean;
  removable?: boolean;
  active: boolean;
  legalReference?: string;
}

export type SSTRuleRef = Pick<SSTRule, 'id' | 'title' | 'nr' | 'severity' | 'package'>;
