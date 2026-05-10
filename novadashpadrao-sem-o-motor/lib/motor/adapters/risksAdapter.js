import { normalizeDataset } from "../core/normalizeEngine.js";
import { getRiskByNRChart, getRiskBySectorChart } from "../engine/chartEngine.js";
import { generateRisksFromNonConformities } from "../engine/operationalEngine.js";
import { calculateRiskMetrics } from "../engine/metricsEngine.js";
import { mapStoreStateToMotorDataset, severityToTargetLevel } from "../bridge";

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeRiskStatus(status = "") {
  const normalized = normalizeText(status);
  if (normalized.includes("resolvido")) return "Resolvido";
  if (normalized.includes("mitig")) return "Mitigado";
  if (normalized.includes("anal")) return "Em análise";
  if (normalized.includes("andamento")) return "Em andamento";
  if (normalized.includes("pendente") || normalized.includes("tratar")) return "Aberto";
  return status || "Aberto";
}

function normalizeRiskPriority(priority = "", level = "") {
  const normalized = normalizeText(priority || level);
  if (normalized.includes("crit") || normalized === "p1") return "Crítica";
  if (normalized.includes("alta") || normalized.includes("alto") || normalized === "p2") return "Alta";
  if (normalized.includes("media") || normalized.includes("medio") || normalized === "p3") return "Média";
  return "Baixa";
}

function normalizeRiskView(risk = {}) {
  const level = severityToTargetLevel(risk.nivel || risk.severidade || risk.gravidade || risk.prioridade || "Médio");
  return {
    ...risk,
    id: risk.id,
    titulo: risk.titulo || risk.title || risk.tipoDeRisco || risk.atividade || "Risco operacional",
    title: risk.title || risk.titulo || risk.tipoDeRisco || risk.atividade || "Risco operacional",
    atividade: risk.atividade || risk.tipoDeRisco || risk.titulo || risk.title || "Atividade não especificada",
    status: normalizeRiskStatus(risk.status),
    nivel: level,
    prioridade: risk.prioridade || normalizeRiskPriority(risk.priority, level),
    prazo: risk.prazo || "Sem prazo",
    gravidade: risk.gravidade || risk.severidade || level,
    probabilidade: risk.probabilidade || "Média",
    tipoDeRisco: risk.tipoDeRisco || risk.titulo || risk.title || "Risco de segurança",
    setor: risk.setor || risk.sector_id || risk.category || "Geral",
    pacote: risk.pacote || risk.package || "Base SST",
    package: risk.package || risk.pacote || "Base SST",
    chanceIncidente: Number(risk.chanceIncidente || 0),
    multaEstimada: Number(risk.multaEstimada || 0),
  };
}

export function adaptRisksFromNonConformities(nonConformities = [], context = {}) {
  return generateRisksFromNonConformities(nonConformities, context);
}

export function buildRisksViewModel(state = {}) {
  const dataset = normalizeDataset(state);
  return {
    metrics: calculateRiskMetrics(dataset),
    charts: {
      bySector: getRiskBySectorChart(dataset),
      byNR: getRiskByNRChart(dataset),
    },
    risks: dataset.risks,
  };
}

export function buildTargetRisksViewModel(state = {}, options = {}) {
  const activePackages = new Set(options.activePackages || []);
  const includeInactivePackages = Boolean(options.includeInactivePackages);
  const filteredRisks = (state.riscos || []).filter((risk) => {
    const pacote = risk?.pacote || risk?.package || "Base SST";
    if (includeInactivePackages) return true;
    return pacote === "Base SST" || activePackages.has(pacote);
  });
  const dataset = mapStoreStateToMotorDataset({
    ...state,
    riscos: filteredRisks,
  });

  return {
    metrics: calculateRiskMetrics(dataset),
    charts: {
      bySector: getRiskBySectorChart(dataset),
      byNR: getRiskByNRChart(dataset),
    },
    risks: filteredRisks.map((risk) => normalizeRiskView(risk)),
  };
}
