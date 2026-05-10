import { normalizeDataset } from "../core/normalizeEngine.js";
import { calcularChanceIncidente, calcularMultaEstimada } from "../../risk-calculations";
import {
  generateActionInsights,
  generateExecutiveSummary,
  generateLariCriticalAlerts,
  generateLariDailyBriefing,
  generateLariRecommendedActions,
  generateNRInsights,
  generateOperationalInsights,
  generateRiskInsights,
} from "../engine/insightEngine.js";

export function buildIntelligenceViewModel(state = {}) {
  const dataset = normalizeDataset(state);
  return {
    briefing: generateLariDailyBriefing(dataset),
    alerts: generateLariCriticalAlerts(dataset),
    recommendedActions: generateLariRecommendedActions(dataset),
    executiveSummary: generateExecutiveSummary(dataset),
    sections: {
      operational: generateOperationalInsights(dataset),
      risks: generateRiskInsights(dataset),
      actions: generateActionInsights(dataset),
      normative: generateNRInsights(dataset),
    },
  };
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isResolved(status = "") {
  const normalized = normalizeText(status);
  return normalized.includes("resolvido") || normalized.includes("mitig");
}

function getRiskSeverityLevel(risk = {}) {
  const normalized = normalizeText(risk.nivel || risk.level || risk.severity || risk.severidade || "");
  if (normalized.includes("crit")) return "Crítico";
  if (normalized.includes("alto") || normalized.includes("alta")) return "Alto";
  if (normalized.includes("medio") || normalized.includes("media")) return "Médio";
  return "Baixo";
}

function formatCurrency(value = 0) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
}

export function buildTargetCentralPageModel(state = {}) {
  const vm = buildIntelligenceViewModel(state);
  const riscos = state.riscos || [];
  const inspecoes = state.inspecoes || [];
  const acoes = state.acoes || [];
  const openRisks = riscos.filter((item) => !isResolved(item.status));
  const riscoCriticoAberto = openRisks.filter((item) => getRiskSeverityLevel(item) === "Crítico");
  const actionOpen = acoes.filter((item) => !["concluída", "cancelada"].includes(normalizeText(item.status)));
  const multaEmAberto = openRisks.reduce((sum, risk) => sum + Number(risk.multaEstimada || calcularMultaEstimada(risk).multaEstimada || 0), 0);
  const avgChance = openRisks.length > 0
    ? openRisks.reduce((sum, risk) => sum + Number(risk.chanceIncidente || calcularChanceIncidente(risk) || 0), 0) / openRisks.length
    : 0;
  const trabalhadoresExpostos = openRisks.reduce((sum, risk) => sum + Number(risk.trabalhadoresExpostos || 0), 0);
  const totalNCs = inspecoes.reduce((sum, item) => sum + Number(item.nonConformities || 0), 0);

  const trendValuesRiscos = [0, 5, 8, 12, openRisks.length];
  const trendValuesMulta = [0, 1, 2, 3, multaEmAberto];
  const trendValuesChance = [0, 1, 2, 3, avgChance];

  const KPIs = [
    { id: "c1", label: "Inspeções agendadas", val: inspecoes.filter((item) => normalizeText(item.status) === "agendada").length, sub: "Hoje ou futuro", navTo: "/inspecoes?filter=agendadas", navLabel: "Ver em Inspeções →" },
    { id: "c2", label: "Inspeções em andamento", val: inspecoes.filter((item) => ["em andamento", "iniciada"].includes(normalizeText(item.status))).length, sub: "Execução ativa", navTo: "/inspecoes", navLabel: "Continuar inspeções →" },
    { id: "c3", label: "Inspeções atrasadas", val: inspecoes.filter((item) => normalizeText(item.status) === "atrasada").length, sub: "Pendentes de execução", navTo: "/inspecoes?filter=atrasadas", navLabel: "Ver atrasadas →" },
    { id: "c4", label: "Inspeções realizadas", val: inspecoes.filter((item) => ["concluída", "realizada", "finalizada"].includes(normalizeText(item.status))).length, sub: "Registros finalizados", navTo: "/inspecoes?filter=concluidas", navLabel: "Ver realizadas →" },
    { id: "c5", label: "Pessoas em risco", val: trabalhadoresExpostos, sub: "Expostos a riscos abertos", navTo: "/riscos?filter=critico", navLabel: "Abrir em Riscos →", trend: trendValuesRiscos, sparkColor: "#ef4444" },
    { id: "c5b", label: "Riscos críticos", val: riscoCriticoAberto.length, sub: "Exigem ação imediata", navTo: "/riscos?filter=critico", navLabel: "Abrir em Riscos →" },
    { id: "c6", label: "Ações pendentes", val: actionOpen.length, sub: "Planos abertos", navTo: "/acoes?filter=pendentes", navLabel: "Abrir em Ações →" },
    { id: "c7", label: "Não conformidades", val: totalNCs, sub: "Detectadas em campo", navTo: "/inspecoes", navLabel: "Ver origem →" },
    { id: "c8", label: "Score de conformidade", val: `${Math.max(0, 100 - riscoCriticoAberto.length * 8 - actionOpen.length * 2)}%`, sub: "Geral", navTo: "/dashboard", navLabel: "Ver detalhes →" },
    { id: "c9", label: "Total de riscos", val: openRisks.length, sub: `${openRisks.length} ativos`, navTo: "/riscos", navLabel: "Ver todos →", trend: trendValuesRiscos, sparkColor: "#a855f7" },
    { id: "c10", label: "Multa estimada em aberto", val: formatCurrency(multaEmAberto), sub: "Potencial de multas", navTo: "/riscos", navLabel: "Ver riscos →", trend: trendValuesMulta, sparkColor: "#eab308" },
    { id: "c11", label: "Chance média de incidente", val: `${Math.round(avgChance)}%`, sub: "Risco moderado", navTo: "/riscos", navLabel: "Matriz de riscos →", trend: trendValuesChance, sparkColor: "#10b981" },
  ];

  const topCards = [KPIs.find((item) => item.id === "c9"), KPIs.find((item) => item.id === "c5"), KPIs.find((item) => item.id === "c10"), KPIs.find((item) => item.id === "c11")].filter(Boolean);
  const gridKPIs = KPIs.filter((item) => !topCards.some((card) => card.id === item.id));

  const riskLevelsCount = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 };
  openRisks.forEach((risk) => {
    riskLevelsCount[getRiskSeverityLevel(risk)] += 1;
  });

  const riskPieData = Object.entries(riskLevelsCount).map(([name, value]) => ({ name, value })).filter((item) => item.value > 0);
  const riskBySectorMap = {};
  openRisks.forEach((risk) => {
    const sector = risk.setor || risk.sector_id || "Indefinido";
    riskBySectorMap[sector] = (riskBySectorMap[sector] || 0) + 1;
  });
  const riskBarData = Object.entries(riskBySectorMap).map(([name, Total]) => ({ name, Total })).sort((left, right) => right.Total - left.Total).slice(0, 7);

  const multaByNRMap = {};
  openRisks.forEach((risk) => {
    const nr = risk.nr || "NR-Geral";
    multaByNRMap[nr] = (multaByNRMap[nr] || 0) + Number(risk.multaEstimada || calcularMultaEstimada(risk).multaEstimada || 0);
  });
  const nrBarData = Object.entries(multaByNRMap).map(([name, Total]) => ({ name, Total })).sort((left, right) => right.Total - left.Total).slice(0, 6);

  const topRisksByChance = [...openRisks].sort((left, right) => Number(right.chanceIncidente || calcularChanceIncidente(right) || 0) - Number(left.chanceIncidente || calcularChanceIncidente(left) || 0)).slice(0, 5);

  return {
    vm,
    openRisks,
    riscoCriticoAberto,
    actionOpen,
    multaEmAberto,
    avgChance,
    trabalhadoresExpostos,
    KPIs,
    topCards,
    gridKPIs,
    riskPieData,
    riskBarData,
    nrBarData,
    renderTopRisksChance: topRisksByChance.map((risk) => ({
      name: risk.titulo || risk.atividade || (risk.id ? risk.id.substring(0, 8) : "Risco"),
      chance: Number(risk.chanceIncidente || calcularChanceIncidente(risk) || 0),
    })),
    listRiscos: topRisksByChance.length > 0 ? openRisks.filter((risk) => getRiskSeverityLevel(risk) === "Crítico").slice(0, 5) : [],
    latestInspections: [...inspecoes].sort((left, right) => new Date(right.createdAt || right.created_at || 0).getTime() - new Date(left.createdAt || left.created_at || 0).getTime()).slice(0, 5),
  };
}

export function buildNormativeMotorViewModel(state = {}) {
  const riscos = state.riscos || [];
  const regrasMap = {};
  let estimada = 0;
  let evitada = 0;
  let regrasAcionadasCount = 0;

  riscos.forEach((risk) => {
    const multa = Number(risk.multaEstimada || calcularMultaEstimada(risk).multaEstimada || 0);
    const resolved = isResolved(risk.status);
    if (resolved) evitada += multa;
    else estimada += multa;

    if (risk.nr) {
      regrasMap[risk.nr] ||= { count: 0, multaEstimada: 0, evitada: 0, detalhes: [] };
      regrasMap[risk.nr].count += 1;
      if (resolved) regrasMap[risk.nr].evitada += multa;
      else regrasMap[risk.nr].multaEstimada += multa;
      regrasMap[risk.nr].detalhes.push(risk);
      regrasAcionadasCount += 1;
    }
  });

  return {
    estimada,
    evitada,
    regrasAcionadasCount,
    regrasData: Object.entries(regrasMap).map(([nr, stats]) => ({ nr, ...stats })).sort((left, right) => right.multaEstimada - left.multaEstimada),
  };
}
