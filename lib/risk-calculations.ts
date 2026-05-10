// @ts-nocheck

import { findPackageOfNR } from "./motor/nrs/nrPackages.js";
import { calculateOperationalCriticality, calculatePriority as motorCalculatePriority, calculateSeverity as motorCalculateSeverity, getFineBand } from "./motor/engine/severityEngine.js";
import { estimateRiskFinancialImpact } from "./motor/engine/financialImpactEngine.js";
import { buildNrMatrix, getHumanActivityLabel, mapHumanActivityToCode, severityToTargetLevel } from "./motor/bridge";

export type NivelRisco = "Crítico" | "Alto" | "Médio" | "Baixo";

export type RiskInstance = Record<string, any>;

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function severityToMotor(value = "") {
  const normalized = normalizeText(value);
  if (normalized.includes("crit")) return "Crítica";
  if (normalized.includes("alto") || normalized.includes("alta")) return "Alta";
  if (normalized.includes("medio") || normalized.includes("media")) return "Média";
  return "Baixa";
}

function targetPriority(priority = "") {
  const normalized = normalizeText(priority);
  if (normalized.includes("crit") || normalized === "p1" || normalized === "urgente") return "Crítica";
  if (normalized.includes("alto") || normalized.includes("alta") || normalized === "p2") return "Alta";
  if (normalized.includes("medio") || normalized.includes("media") || normalized === "p3") return "Média";
  return "Baixa";
}

function priorityToLevel(priority = "Baixa"): NivelRisco {
  if (priority === "Crítica") return "Crítico";
  if (priority === "Alta") return "Alto";
  if (priority === "Média") return "Médio";
  return "Baixo";
}

function dueDateLabel(priority = "Baixa") {
  if (priority === "Crítica") return "Imediato (até 24h)";
  if (priority === "Alta") return "Até 3 dias";
  if (priority === "Média") return "Até 7 dias";
  return "Até 15 dias";
}

export function gerarExplicacaoNormativa(nrRelacionada, respostaOrigem, checklistName) {
  const nr = nrRelacionada || "NR-01";
  const checklist = checklistName || "checklist operacional";
  return `Este risco foi interpretado pelo motor normativo a partir da ${nr} e do contexto do ${checklist}, considerando a resposta "${respostaOrigem || "não conforme"}".`;
}

export function calcularPrioridade(nr, severidade, atividade, respostaChecklist) {
  const priority = motorCalculatePriority({
    severidade: severityToMotor(severidade),
    recurrence: normalizeText(respostaChecklist).includes("não") ? 1 : 0,
    regulatoryCritical: ["NR-10", "NR-12", "NR-33", "NR-35"].includes((nr || "").toUpperCase()),
  });
  return targetPriority(priority);
}

export function calcularPrazo(prioridade, severidade) {
  return dueDateLabel(targetPriority(prioridade || severidade));
}

export function calcularMultaEstimada(risco: Partial<RiskInstance>) {
  const severity = severityToMotor(risco.severidade || risco.prioridade || risco.nivel || "Médio");
  const estimate = estimateRiskFinancialImpact({
    id: risco.id || "risk",
    setor: risco.setor || "Geral",
    severidade: severity,
    multaEstimada: risco.multaEstimada,
    nr: risco.nr || risco.nrRelacionada || "NR-01",
  });
  return {
    multaEstimada: estimate.valorEstimado,
    faixaMulta: `${estimate.valorMin.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a ${estimate.valorMax.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
  };
}

export function calcularChanceIncidente(risco: Partial<RiskInstance>): number {
  const score = calculateOperationalCriticality({
    severidade: severityToMotor(risco.severidade || risco.prioridade || risco.nivel || "Médio"),
    recurrence: Number(risco.recorrenciaHistorica || risco.recorrencia || 0),
    overdue: normalizeText(risco.status).includes("venc"),
  });
  return Math.max(5, Math.min(95, score + (risco.hasEpiEpc === false ? 10 : 0)));
}

export function calcularImpactoOperacional(risco: Partial<RiskInstance>, chance: number, multa: number): string {
  if (chance >= 75 || multa >= 50000) return "Crítico";
  if (chance >= 50 || multa >= 15000) return "Alto";
  if (chance >= 25 || multa >= 5000) return "Médio";
  return "Baixo";
}

export function calcularNivelConformidade(risco: Partial<RiskInstance>): string {
  const status = normalizeText(risco.status || "");
  if (status.includes("resolvido") || status.includes("mitig")) return "Conforme";
  if (risco.acaoVinculada || risco.riscoId) return "Atenção";
  if (normalizeText(risco.prioridade || risco.nivel).includes("crit")) return "Não conforme crítico";
  return "Não conforme";
}

export function applyManualRules(payload: Partial<RiskInstance>): RiskInstance {
  const severity = severityToMotor(payload.severidade || payload.gravidade || payload.nivel || "Médio");
  const prioridade = calcularPrioridade(payload.nr || payload.nrRelacionada || "NR-01", severity, payload.atividade || "", payload.respostaOrigem || "");
  const nivel = priorityToLevel(prioridade);
  const multa = calcularMultaEstimada({ ...payload, severidade: severity });
  const chance = calcularChanceIncidente({ ...payload, severidade: severity, prioridade });
  const impactoOperacional = calcularImpactoOperacional(payload, chance, multa.multaEstimada);
  const pacote = payload.pacote || payload.package || findPackageOfNR(payload.nr || payload.nrRelacionada || "NR-01")?.id || "Base SST";
  const createdAt = payload.criadoEm || payload.created_at || new Date().toISOString();

  return {
    ...payload,
    id: payload.id || crypto.randomUUID(),
    titulo: payload.titulo || payload.title || payload.tipoDeRisco || payload.atividade || "Risco operacional",
    title: payload.titulo || payload.title || payload.tipoDeRisco || payload.atividade || "Risco operacional",
    atividade: payload.atividade || getHumanActivityLabel(mapHumanActivityToCode(payload.atividade || "")),
    setor: payload.setor || "Geral",
    nr: payload.nr || payload.nrRelacionada || "NR-01",
    severidade: severity,
    gravidade: severity,
    prioridade,
    nivel,
    prazo: dueDateLabel(prioridade),
    status: payload.status || "Aberto",
    origem: payload.origem || "Manual",
    tipoDeRisco: payload.tipoDeRisco || payload.titulo || payload.title || "Risco de SST",
    probabilidade: payload.probabilidade || "Média",
    hasEpiEpc: payload.hasEpiEpc ?? true,
    hasTreinamento: payload.hasTreinamento ?? true,
    hasProcedimento: payload.hasProcedimento ?? true,
    dataLancamento: payload.dataLancamento || new Date().toISOString().split("T")[0],
    criadoEm: createdAt,
    created_at: createdAt,
    atualizadoEm: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    multaEstimada: multa.multaEstimada,
    faixaMulta: multa.faixaMulta,
    chanceIncidente: chance,
    impactoOperacional,
    nivelConformidade: calcularNivelConformidade({ ...payload, prioridade, nivel }),
    justificativaMulta: estimateRiskFinancialImpact({ id: payload.id || "risk", setor: payload.setor || "Geral", severidade: severity, nr: payload.nr || "NR-01" }).explicacao,
    justificativaIncidente: `Chance operacional calculada com base em severidade ${nivel} e criticidade do contexto.`,
    justificativa: gerarExplicacaoNormativa(payload.nr || payload.nrRelacionada, payload.respostaOrigem, payload.checklistOrigem),
    pacote,
    package: pacote,
    fatoresDeCalculo: [
      `NR base: ${payload.nr || payload.nrRelacionada || "NR-01"}`,
      `Severidade: ${severity}`,
      `Prioridade: ${prioridade}`,
    ],
  };
}

export function getNrMetrics({ inspections = [], risks = [], actions = [] }) {
  const accumulator = {};

  const ensureEntry = (nr) => {
    if (!accumulator[nr]) {
      accumulator[nr] = {
        nr,
        totalNaoConformidades: 0,
        totalRiscos: 0,
        totalAcoes: 0,
        riscosCriticos: 0,
        multaEstimada: 0,
        chanceMediaIncidente: 0,
        scoreImpactado: 0,
        acoesPendentes: 0,
        acoesConcluidas: 0,
        _chanceSum: 0,
      };
    }
    return accumulator[nr];
  };

  risks.forEach((risk) => {
    const nr = risk.nr || risk.nrRelacionada || "Sem NR";
    const entry = ensureEntry(nr);
    entry.totalRiscos += 1;
    if (severityToTargetLevel(risk.nivel || risk.severidade || risk.prioridade) === "Crítico") {
      entry.riscosCriticos += 1;
    }
    entry.multaEstimada += Number(risk.multaEstimada || calcularMultaEstimada(risk).multaEstimada || 0);
    const chance = Number(risk.chanceIncidente || calcularChanceIncidente(risk) || 0);
    entry._chanceSum += chance;
    entry.chanceMediaIncidente = Math.round(entry._chanceSum / entry.totalRiscos);
    entry.scoreImpactado += chance >= 75 ? 15 : chance >= 50 ? 10 : chance >= 25 ? 5 : 2;
  });

  actions.forEach((action) => {
    const nr = action.nr || "Sem NR";
    const entry = ensureEntry(nr);
    entry.totalAcoes += 1;
    if (normalizeText(action.status).includes("concl")) entry.acoesConcluidas += 1;
    else entry.acoesPendentes += 1;
  });

  inspections.forEach((inspection) => {
    (inspection.items || []).forEach((item) => {
      const status = normalizeText(item.status || "");
      if (status === "nao" || status === "não" || status === "parcialmente") {
        const nr = item.nr || item.nrRelacionada || "Sem NR";
        const entry = ensureEntry(nr);
        entry.totalNaoConformidades += 1;
      }
    });
  });

  return Object.values(accumulator).sort((left, right) => right.multaEstimada - left.multaEstimada);
}

export function formatCurrency(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
}
