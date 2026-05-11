export type ComplianceStatus =
  | 'nao_avaliado'
  | 'conforme'
  | 'nao_conforme'
  | 'em_correcao'
  | 'aguardando_evidencia'
  | 'validado';

export interface ComplianceSnapshot {
  itemId: string;
  nrIds: string[];
  ruleId?: string;
  complianceStatus: ComplianceStatus;
  evidenceRequired: boolean;
  evidenceCount: number;
  auditable: boolean;
  warnings: string[];
}
