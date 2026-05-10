import { normalizeDataset } from "../core/normalizeEngine.js";
import { mapStoreStateToMotorDataset } from "../bridge";
import {
  generateAuditReportData,
  generateExecutiveReportData,
  generateFinancialImpactReportData,
  generateMaturityReportData,
  generateNRReportData,
  generatePGRReportData,
} from "../engine/reportEngine.js";

function adaptReportsDataset(state = {}) {
  if (state.inspecoes || state.riscos || state.acoes) {
    return mapStoreStateToMotorDataset(state);
  }

  return normalizeDataset(state);
}

export function buildReportsViewModel(state = {}) {
  const dataset = adaptReportsDataset(state);
  return {
    executive: generateExecutiveReportData(dataset),
    audit: generateAuditReportData(dataset),
    normative: generateNRReportData(dataset),
    pgr: generatePGRReportData(dataset),
    financial: generateFinancialImpactReportData(dataset),
    maturity: generateMaturityReportData(dataset),
  };
}
