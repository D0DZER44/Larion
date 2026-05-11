import { ok, type EngineResult } from '@/src/types/engineResult';
import type { ComplianceSnapshot, ComplianceStatus } from '@/src/types/compliance';
import type { OperationalItem, OperationalItemDraft } from '@/src/types/operationalItem';

function normalizeComplianceStatus(item: OperationalItem | OperationalItemDraft): ComplianceStatus {
  if (item.complianceStatus) return item.complianceStatus;
  if (item.status === 'completed') return 'validado';
  if ((item.evidenceRequired ?? item.evidencePlan.required) && item.evidenceIds.length < item.evidencePlan.minimumCount) {
    return 'aguardando_evidencia';
  }
  if (item.status === 'cancelled') return 'nao_avaliado';
  if (item.status === 'triaged' || item.status === 'a_fazer' || item.status === 'ready' || item.status === 'inProgress' || item.status === 'vencido' || item.status === 'awaitingEvidence' || item.status === 'em_validacao') {
    return 'em_correcao';
  }
  return 'nao_avaliado';
}

export function evaluateCompliance(
  item: OperationalItem | OperationalItemDraft
): EngineResult<ComplianceSnapshot> {
  const warnings: string[] = [];
  const nrIds = item.primaryNr ? Array.from(new Set([item.primaryNr, ...item.nrIds])) : item.nrIds;
  const ruleId = item.primaryRuleId ?? item.ruleLinks[0]?.ruleId;
  const evidenceRequired = item.evidenceRequired ?? item.evidencePlan.required;
  const complianceStatus = normalizeComplianceStatus(item);

  if (nrIds.length === 0) warnings.push('Item sem NR vinculada; compliance permanece apenas como organizacao operacional.');
  if (!ruleId) warnings.push('Item sem ruleId vinculado; rastreabilidade normativa pode ficar parcial.');
  if (evidenceRequired && item.evidenceIds.length < item.evidencePlan.minimumCount) {
    warnings.push('Item exige evidencia, mas ainda nao possui comprovacao suficiente.');
  }

  return ok({
    itemId: item.id ?? 'draft-item',
    nrIds,
    ruleId,
    complianceStatus,
    evidenceRequired,
    evidenceCount: item.evidenceIds.length,
    auditable: true,
    warnings,
  }, warnings);
}

export const complianceEngine = {
  evaluate: evaluateCompliance,
};
