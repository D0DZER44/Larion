import type { CriticalActivityCatalogId } from '@/src/lib/catalogs/nrCatalog';
import type { OperationalSSTRule } from './nrRules';
import { NR_RULES } from './nrRules';

function expandByActivity(rule: OperationalSSTRule): OperationalSSTRule[] {
  return rule.criticalActivityIds.map((criticalActivityId) => ({
    ...rule,
    activityId: criticalActivityId,
  }));
}

function uniqueByIdAndActivity(rules: OperationalSSTRule[]) {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    const key = `${rule.id}:${rule.activityId ?? 'sem-atividade'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const CRITICAL_ACTIVITY_RULES: OperationalSSTRule[] = uniqueByIdAndActivity(
  NR_RULES.filter((rule) => rule.criticalActivityIds.length > 0).flatMap(expandByActivity)
);

export function getRulesByCriticalActivity(
  criticalActivityId: CriticalActivityCatalogId
): OperationalSSTRule[] {
  return CRITICAL_ACTIVITY_RULES.filter((rule) => rule.activityId === criticalActivityId);
}
