import { getOperationalItemsFromLegacyState } from '@/lib/store';
import {
  dashboardMetricsEngine,
  type DashboardMetrics,
} from '@/src/lib/engines/dashboardMetricsEngine';

type RiskLike = Record<string, any>;
type ActionLike = Record<string, any>;
type InspectionLike = Record<string, any>;

export interface DashboardRuntimeInput {
  riscos: RiskLike[];
  acoes: ActionLike[];
  inspecoes: InspectionLike[];
}

export function computeDashboardMetricsFromLegacyRuntime(
  input: DashboardRuntimeInput
): DashboardMetrics {
  const bridge = getOperationalItemsFromLegacyState(input as any);

  return dashboardMetricsEngine.compute({
    ...input,
    operationalItems: bridge.items,
  });
}

export const dashboardMetricsService = {
  fromLegacyRuntime: computeDashboardMetricsFromLegacyRuntime,
};
