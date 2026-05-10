import { normalizeDataset } from "../core/normalizeEngine.js";

function makeRiskMapItem(risk, relatedActions = []) {
  return {
    id: risk.id,
    setor: risk.setor,
    atividade: risk.atividade || risk.titulo,
    nr: risk.nr,
    descricao: risk.descricao || risk.titulo,
    severidade: risk.severidade,
    status: relatedActions.some((item) => item.status === "Concluída") ? "Em controle" : "Identificado",
    riskIds: [risk.id],
    inspectionIds: risk.inspectionId ? [risk.inspectionId] : [],
    actionIds: relatedActions.map((item) => item.id),
    evidenceIds: relatedActions.flatMap((item) => item.evidencias || []),
    reincidencia: Number(risk.recorrencia || 0),
    controles: relatedActions.map((item) => ({
      id: item.id,
      tipo: "administrativo",
      descricao: item.titulo,
      status: item.status === "Concluída" ? "verificado" : "planejado",
    })),
    ultimaAtualizacao: risk.updatedAt,
    createdAt: risk.createdAt,
  };
}

export function generatePGRRiskMap(input = {}) {
  const dataset = normalizeDataset(input);
  return dataset.risks.map((risk) => makeRiskMapItem(risk, dataset.actions.filter((action) => action.riskId === risk.id)));
}

export function generatePGRInventory(input = {}) {
  return generatePGRRiskMap(input).map((item) => ({
    id: item.id,
    setor: item.setor,
    atividade: item.atividade,
    severidade: item.severidade,
    status: item.status,
  }));
}

export function generateRiskControlPlan(input = {}) {
  return generatePGRRiskMap(input).map((item) => ({
    riskId: item.id,
    setor: item.setor,
    controles: item.controles,
    actionIds: item.actionIds,
  }));
}

export function updatePGRFromInspection(input = {}, inspection = {}) {
  return generatePGRRiskMap({ ...normalizeDataset(input), inspections: [...(input.inspections || []), inspection] });
}

export function updatePGRFromRisk(input = {}, risk = {}) {
  return generatePGRRiskMap({ ...normalizeDataset(input), risks: [...(input.risks || []), risk] });
}

export function updatePGRFromAction(input = {}, action = {}) {
  return generatePGRRiskMap({ ...normalizeDataset(input), actions: [...(input.actions || []), action] });
}

export function calculatePGRStatus(input = {}) {
  const map = generatePGRRiskMap(input);
  if (map.length === 0) return "Encerrado";
  if (map.some((item) => item.severidade === "Crítica" && item.status !== "Em controle")) return "Sob ação";
  if (map.some((item) => item.status === "Identificado")) return "Identificado";
  return "Em controle";
}

export function getPGRCriticalItems(input = {}) {
  return generatePGRRiskMap(input).filter((item) => item.severidade === "Crítica" || item.reincidencia > 1);
}
