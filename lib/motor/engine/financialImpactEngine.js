import { FINE_BANDS } from "../core/constants.js";
import { normalizeAction, normalizeNonConformity, normalizeRisk } from "../core/normalizeEngine.js";

function severityBand(severity = "Baixa") {
  return FINE_BANDS[severity] || FINE_BANDS["Baixa"];
}

export function estimateRiskFinancialImpact(riskInput = {}) {
  const risk = normalizeRisk(riskInput);
  const band = severityBand(risk.severidade);
  return {
    contexto: "risco",
    referenciaId: risk.id,
    band: risk.severidade.toLowerCase(),
    valorMin: band.min,
    valorMax: band.max,
    valorEstimado: risk.multaEstimada || band.estimated,
    fatores: [risk.nr, risk.setor].filter(Boolean),
    explicacao: `Estimativa baseada na severidade ${risk.severidade} e na exposição operacional do setor ${risk.setor}.`,
  };
}

export function estimateActionDelayImpact(actionInput = {}) {
  const action = normalizeAction(actionInput);
  const multiplier = action.prioridade === "Crítica" ? 2 : action.prioridade === "Alta" ? 1.5 : 1;
  const base = severityBand(action.prioridade).estimated;
  return {
    contexto: "acao-atrasada",
    referenciaId: action.id,
    band: action.prioridade.toLowerCase(),
    valorMin: Math.round(base * 0.5),
    valorMax: Math.round(base * multiplier),
    valorEstimado: Math.round(base * multiplier),
    fatores: [action.prioridade, action.status],
    explicacao: "Atrasos em ações corretivas elevam a exposição regulatória e operacional.",
  };
}

export function estimateEvidenceGapImpact(itemInput = {}) {
  const item = itemInput.riskId ? normalizeAction(itemInput) : normalizeNonConformity(itemInput);
  const severity = item.severidade || item.prioridade || "Média";
  const base = severityBand(severity).estimated;
  return {
    contexto: "evidencia-ausente",
    referenciaId: item.id,
    band: severity.toLowerCase(),
    valorMin: Math.round(base * 0.3),
    valorMax: Math.round(base * 0.8),
    valorEstimado: Math.round(base * 0.5),
    fatores: ["evidencia-ausente", severity],
    explicacao: "Ausência de evidência reduz rastreabilidade e aumenta risco de autuação.",
  };
}

export function estimateTotalExposure(risks = [], actions = [], nonConformities = []) {
  const riskTotal = risks.reduce((sum, item) => sum + estimateRiskFinancialImpact(item).valorEstimado, 0);
  const delayedActions = actions.filter((item) => item.status === "Vencida" || item.status === "Reaberta");
  const actionTotal = delayedActions.reduce((sum, item) => sum + estimateActionDelayImpact(item).valorEstimado, 0);
  const ncWithoutEvidence = nonConformities.filter((item) => item.exigeEvidencia && item.evidenciasFornecidas?.length === 0);
  const evidenceTotal = ncWithoutEvidence.reduce((sum, item) => sum + estimateEvidenceGapImpact(item).valorEstimado, 0);

  return {
    contexto: "consolidado",
    band: "consolidado",
    valorMin: riskTotal + actionTotal + evidenceTotal,
    valorMax: Math.round((riskTotal + actionTotal + evidenceTotal) * 1.25),
    valorEstimado: riskTotal + actionTotal + evidenceTotal,
    fatores: ["riscos", "acoes-vencidas", "evidencias-ausentes"],
    explicacao: "Exposição total consolidada a partir de riscos abertos, atrasos e lacunas de evidência.",
  };
}

export function generateFinancialImpactSummary(input = {}) {
  return estimateTotalExposure(input.risks || [], input.actions || [], input.nonConformities || []);
}
