import { normalizeDataset } from "../core/normalizeEngine.js";
import { calculateActionMetrics, calculateInspectionMetrics, calculateNRCompliance, calculateSLAIndicators } from "./metricsEngine.js";

function average(values = []) {
  return values.length > 0 ? values.reduce((sum, item) => sum + item, 0) / values.length : 0;
}

export function calculateEvidenceScore(input = {}) {
  const { actions } = normalizeDataset(input);
  if (actions.length === 0) return 100;
  const withEvidence = actions.filter((item) => item.evidencias.length > 0).length;
  return (withEvidence / actions.length) * 100;
}

export function calculateSLAComplianceScore(input = {}) {
  return calculateSLAIndicators(input).complianceRate;
}

export function calculateInspectionDisciplineScore(input = {}) {
  return calculateInspectionMetrics(input).completionRate;
}

export function calculateRiskControlScore(input = {}) {
  const { risks, actions } = normalizeDataset(input);
  if (risks.length === 0) return 100;
  const linkedActions = risks.filter((risk) => actions.some((action) => action.riskId === risk.id)).length;
  return (linkedActions / risks.length) * 100;
}

export function calculateNRComplianceScore(input = {}) {
  const items = calculateNRCompliance(input);
  return items.length > 0 ? average(items.map((item) => item.compliance)) : 100;
}

export function calculateMaturityScore(input = {}) {
  const dataset = normalizeDataset(input);
  const evidence = calculateEvidenceScore(dataset);
  const sla = calculateSLAComplianceScore(dataset);
  const inspection = calculateInspectionDisciplineScore(dataset);
  const riskControl = calculateRiskControlScore(dataset);
  const nrCompliance = calculateNRComplianceScore(dataset);
  const actionCompletion = calculateActionMetrics(dataset).completionRate;

  const scorePercent = average([evidence, sla, inspection, riskControl, nrCompliance, actionCompletion]);

  return {
    scorePercent,
    level:
      scorePercent >= 85
        ? "excelente"
        : scorePercent >= 70
          ? "avancado"
          : scorePercent >= 55
            ? "controlado"
            : scorePercent >= 35
              ? "basico"
              : "inicial",
    componentes: {
      evidencia: evidence,
      sla,
      inspecao: inspection,
      controleRisco: riskControl,
      conformidadeNr: nrCompliance,
      acoes: actionCompletion,
    },
  };
}
