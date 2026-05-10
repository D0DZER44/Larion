import { DEFAULT_SETTINGS } from "../core/constants.js";
import { normalizeDataset } from "../core/normalizeEngine.js";
import { mapStoreStateToMotorDataset } from "../bridge";

export function adaptOperationalSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    slaRules: { ...DEFAULT_SETTINGS.slaRules, ...(settings.slaRules || {}) },
    evidenceRequiredFor: Array.isArray(settings.evidenceRequiredFor)
      ? settings.evidenceRequiredFor
      : DEFAULT_SETTINGS.evidenceRequiredFor,
  };
}

function adaptConfigDataset(state = {}) {
  if (state.inspecoes || state.riscos || state.acoes) {
    return mapStoreStateToMotorDataset(state);
  }

  return normalizeDataset(state);
}

export function buildConfigViewModel(state = {}) {
  const dataset = adaptConfigDataset(state);
  const activePackages = (state.rulePackages || [])
    .filter((item) => item.isActive)
    .map((item) => item.name);
  const activeSegments = state.organization?.segmento
    ? [state.organization.segmento]
    : dataset.settings?.activeSegments || DEFAULT_SETTINGS.activeSegments;
  const activeAlertsCount = (state.alertas || []).filter((item) => item.status === "Ativo").length;
  const auditLogs = state.logs || dataset.auditLogs || [];
  const latestAuditEvent = [...auditLogs]
    .sort((left, right) => new Date(right.created_at || right.createdAt || 0).getTime() - new Date(left.created_at || left.createdAt || 0).getTime())[0];
  const criticalSettingsCount = [
    Number(Boolean(activePackages.length)),
    Number(Boolean(activeSegments.length)),
    Number(Boolean((state.engineConfig || {}).economia?.enabled)),
  ].reduce((sum, value) => sum + value, 0);

  return {
    settings: adaptOperationalSettings({
      ...(dataset.settings || {}),
      activePackages: activePackages.length > 0 ? activePackages : dataset.settings?.activePackages || DEFAULT_SETTINGS.activePackages,
      activeSegments,
    }),
    sectors: state.sectors || dataset.sectors,
    responsibles: state.users || dataset.responsibles,
    packages: activePackages.length > 0 ? activePackages : dataset.settings?.activePackages || DEFAULT_SETTINGS.activePackages,
    segments: activeSegments,
    alerts: state.alertas || [],
    audit: {
      totalEvents: auditLogs.length,
      latestEvent: latestAuditEvent || null,
    },
    summary: {
      criticalSettingsCount,
      activePackagesCount: activePackages.length > 0 ? activePackages.length : 1,
      activeAlertsCount,
      sectorsCount: (state.sectors || dataset.sectors || []).length,
      responsiblesCount: (state.users || dataset.responsibles || []).length,
      auditEventsCount: auditLogs.length,
    },
  };
}
