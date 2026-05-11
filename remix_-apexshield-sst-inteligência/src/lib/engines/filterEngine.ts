import { ok, type EngineResult } from '@/src/types/engineResult';
import type { OperationalItem, OperationalItemStatus } from '@/src/types/operationalItem';
import type { WorkflowFilterKey } from '@/src/types/workflowConfig';

export interface FilterCriteria {
  status?: OperationalItemStatus[];
  priority?: string[];
  severity?: string[];
  responsible?: string[];
  sector?: string[];
  operationalContextId?: string[];
  criticalActivityId?: string[];
  nr?: string[];
  overdue?: boolean;
  unassigned?: boolean;
  awaitingEvidence?: boolean;
  origin?: string[];
}

export interface FilterEngineResult {
  items: OperationalItem[];
  total: number;
  appliedFilters: WorkflowFilterKey[];
}

function inferSeverity(item: OperationalItem): string {
  const severities = item.ruleLinks.map((rule) => rule.severity);
  if (severities.includes('critica')) return 'critica';
  if (severities.includes('alta')) return 'alta';
  if (severities.includes('media')) return 'media';
  return severities[0] ?? item.priority;
}

function isAwaitingEvidence(item: OperationalItem): boolean {
  return (
    item.status === 'awaitingEvidence' ||
    (item.evidencePlan.required && item.evidenceIds.length < item.evidencePlan.minimumCount)
  );
}

function isOverdue(item: OperationalItem): boolean {
  if (!item.dueAt || item.status === 'completed' || item.status === 'cancelled') return false;
  return new Date(item.dueAt).getTime() < Date.now();
}

function matchesArrayFilter(value: string | undefined, filter?: string[]): boolean {
  if (!filter || filter.length === 0) return true;
  if (!value) return false;
  return filter.includes(value);
}

export function filterOperationalItems(
  items: OperationalItem[],
  criteria: FilterCriteria
): EngineResult<FilterEngineResult> {
  const appliedFilters: WorkflowFilterKey[] = [];

  if (criteria.status?.length) appliedFilters.push('status');
  if (criteria.priority?.length) appliedFilters.push('priority');
  if (criteria.severity?.length) appliedFilters.push('severity');
  if (criteria.responsible?.length) appliedFilters.push('responsible');
  if (criteria.sector?.length) appliedFilters.push('sector');
  if (criteria.operationalContextId?.length) appliedFilters.push('operationalContext');
  if (criteria.criticalActivityId?.length) appliedFilters.push('criticalActivity');
  if (criteria.nr?.length) appliedFilters.push('nr');
  if (criteria.overdue) appliedFilters.push('overdue');
  if (criteria.unassigned) appliedFilters.push('unassigned');
  if (criteria.awaitingEvidence) appliedFilters.push('awaitingEvidence');
  if (criteria.origin?.length) appliedFilters.push('origin');

  const filtered = items.filter((item) => {
    if (criteria.status?.length && !criteria.status.includes(item.status)) return false;
    if (!matchesArrayFilter(item.priority, criteria.priority)) return false;
    if (!matchesArrayFilter(inferSeverity(item), criteria.severity)) return false;
    if (!matchesArrayFilter(item.responsible, criteria.responsible)) return false;
    if (!matchesArrayFilter(item.sector, criteria.sector)) return false;
    if (!matchesArrayFilter(item.contextId, criteria.operationalContextId)) return false;
    if (!matchesArrayFilter(item.activityId, criteria.criticalActivityId)) return false;
    if (criteria.nr?.length && !item.nrIds.some((nrId) => criteria.nr?.includes(nrId))) return false;
    if (criteria.overdue && !isOverdue(item)) return false;
    if (criteria.unassigned && Boolean(item.responsible)) return false;
    if (criteria.awaitingEvidence && !isAwaitingEvidence(item)) return false;
    if (criteria.origin?.length) {
      const origins = item.sourceLinks.map((link) => link.label ?? link.type);
      if (!origins.some((origin) => criteria.origin?.includes(origin))) return false;
    }
    return true;
  });

  return ok({
    items: filtered,
    total: filtered.length,
    appliedFilters,
  });
}

export const filterEngine = {
  filter: filterOperationalItems,
};
