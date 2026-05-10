import { generateId } from "./idUtils.js";
import { toIsoDate, toTimestamp } from "./dateUtils.js";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeChecklistAnswer(answer = {}) {
  return {
    id: answer.id || answer.perguntaId || generateId("ANS"),
    perguntaId: answer.perguntaId || answer.id || generateId("QST"),
    pergunta: answer.pergunta || answer.texto || "",
    resposta: answer.resposta || answer.answer || "pendente",
    observacao: answer.observacao || answer.note || "",
    evidencias: ensureArray(answer.evidencias || answer.evidenceIds || answer.evidenceUrls),
    respondedAt: answer.respondedAt ? toTimestamp(answer.respondedAt) : undefined,
  };
}

export function normalizeInspection(inspection = {}) {
  const createdAt = inspection.createdAt ? toTimestamp(inspection.createdAt) : Date.now();
  return {
    id: inspection.id || generateId("INSP"),
    titulo: inspection.titulo || inspection.title || "Inspeção",
    setor: inspection.setor || inspection.sector || "Geral",
    responsavel: inspection.responsavel || inspection.responsible || "A definir",
    atividades: ensureArray(inspection.atividades || inspection.activities),
    status: inspection.status || "Agendada",
    data: inspection.data || toIsoDate(createdAt),
    hasNonConformity: Boolean(inspection.hasNonConformity),
    observacao: inspection.observacao || inspection.observation || "",
    checklistAnswers: ensureArray(inspection.checklistAnswers).map(normalizeChecklistAnswer),
    createdAt,
    updatedAt: inspection.updatedAt ? toTimestamp(inspection.updatedAt) : createdAt,
  };
}

export function normalizeNonConformity(nonConformity = {}) {
  const createdAt = nonConformity.createdAt ? toTimestamp(nonConformity.createdAt) : Date.now();
  return {
    id: nonConformity.id || generateId("NC"),
    inspectionId: nonConformity.inspectionId,
    questionId: nonConformity.questionId || nonConformity.perguntaId,
    pergunta: nonConformity.pergunta || "",
    resposta: nonConformity.resposta || "não",
    titulo: nonConformity.titulo || nonConformity.title || "Não conformidade identificada",
    descricao: nonConformity.descricao || nonConformity.description || "",
    setor: nonConformity.setor || nonConformity.sector || "Geral",
    atividade: nonConformity.atividade || nonConformity.activityType || "uso-de-epi",
    status: nonConformity.status || "Aberta",
    severidade: nonConformity.severidade || "Média",
    prioridade: nonConformity.prioridade || nonConformity.severidade || "Média",
    pacote: nonConformity.pacote || "Base SST",
    nr: nonConformity.nr,
    ruleId: nonConformity.ruleId,
    acaoRecomendada: nonConformity.acaoRecomendada || "",
    evidenciasFornecidas: ensureArray(nonConformity.evidenciasFornecidas || nonConformity.evidencias),
    exigeEvidencia: Boolean(nonConformity.exigeEvidencia),
    prazoSugeridoData: nonConformity.prazoSugeridoData || toIsoDate(createdAt),
    createdAt,
    updatedAt: nonConformity.updatedAt ? toTimestamp(nonConformity.updatedAt) : createdAt,
  };
}

export function normalizeRisk(risk = {}) {
  const createdAt = risk.createdAt ? toTimestamp(risk.createdAt) : Date.now();
  return {
    id: risk.id || generateId("RSK"),
    inspectionId: risk.inspectionId,
    nonConformityId: risk.nonConformityId,
    titulo: risk.titulo || risk.title || "Risco operacional",
    descricao: risk.descricao || risk.description || "",
    setor: risk.setor || risk.sector || "Geral",
    responsavel: risk.responsavel || risk.responsible || "A definir",
    severidade: risk.severidade || "Média",
    prioridade: risk.prioridade || risk.severidade || "Média",
    status: risk.status || "Aberto",
    pacote: risk.pacote || "Base SST",
    nr: risk.nr,
    ruleId: risk.ruleId,
    origem: risk.origem || "motor-operacional",
    multaEstimada: Number(risk.multaEstimada || 0),
    recorrencia: Number(risk.recorrencia || 0),
    createdAt,
    updatedAt: risk.updatedAt ? toTimestamp(risk.updatedAt) : createdAt,
  };
}

export function normalizeAction(action = {}) {
  const createdAt = action.createdAt ? toTimestamp(action.createdAt) : Date.now();
  return {
    id: action.id || generateId("ACT"),
    riskId: action.riskId,
    inspectionId: action.inspectionId,
    nonConformityId: action.nonConformityId,
    titulo: action.titulo || action.title || "Ação corretiva",
    descricao: action.descricao || action.description || "",
    responsavel: action.responsavel || action.responsible || "A definir",
    status: action.status || "Pendente",
    prioridade: action.prioridade || "Média",
    prazo: action.prazo || toIsoDate(createdAt),
    evidencias: ensureArray(action.evidencias || action.evidenceIds || action.evidenceUrls),
    origem: action.origem || "motor-operacional",
    exigeEvidencia: Boolean(action.exigeEvidencia),
    motivoGeracao: action.motivoGeracao || "",
    createdAt,
    updatedAt: action.updatedAt ? toTimestamp(action.updatedAt) : createdAt,
    completedAt: action.completedAt ? toTimestamp(action.completedAt) : undefined,
  };
}

export function normalizeDataset(dataset = {}) {
  return {
    inspections: ensureArray(dataset.inspections).map(normalizeInspection),
    nonConformities: ensureArray(dataset.nonConformities).map(normalizeNonConformity),
    risks: ensureArray(dataset.risks).map(normalizeRisk),
    actions: ensureArray(dataset.actions).map(normalizeAction),
    evidences: ensureArray(dataset.evidences),
    sectors: ensureArray(dataset.sectors),
    responsibles: ensureArray(dataset.responsibles),
    settings: dataset.settings || {},
    auditLogs: ensureArray(dataset.auditLogs),
  };
}
