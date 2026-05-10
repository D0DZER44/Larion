// @ts-nocheck

import { listActiveNRs } from "./nrs/nrCatalog.js";
import { findPackageOfNR, NR_PACKAGES } from "./nrs/nrPackages.js";
import { listSegmentsForNR } from "./nrs/nrSegments.js";
import { NR_ACTIVITY_TO_NRS, NR_RULES } from "./nrs/nrRules.js";
import { generateNonConformitiesFromInspection, generateRisksFromNonConformities, generateActionsFromRisks } from "./engine/operationalEngine.js";
import { estimateRiskFinancialImpact, estimateActionDelayImpact } from "./engine/financialImpactEngine.js";
import { calculateOperationalCriticality, calculatePriority, calculateSeverity } from "./engine/severityEngine.js";

const HUMAN_ACTIVITY_BY_CODE = {
  "uso-de-epi": "Uso de EPI",
  "trabalho-em-altura": "Trabalho em altura",
  "espaco-confinado": "Espaço confinado",
  eletricidade: "Manutenção elétrica",
  "maquina-sem-protecao": "Operação de máquinas",
  "movimentacao-de-carga": "Movimentação de cargas",
  inflamaveis: "Inflamáveis",
  sinalizacao: "Sinalização",
  ergonomia: "Ergonomia",
  "emergencia-incendio": "Emergência / incêndio",
  "construcao-civil": "Construção civil",
};

const ACTIVITY_CODE_BY_TEXT = {
  "uso de epi": "uso-de-epi",
  epi: "uso-de-epi",
  "trabalho em altura": "trabalho-em-altura",
  altura: "trabalho-em-altura",
  "espaco confinado": "espaco-confinado",
  "espaço confinado": "espaco-confinado",
  eletrica: "eletricidade",
  elétrica: "eletricidade",
  eletricidade: "eletricidade",
  maquina: "maquina-sem-protecao",
  máquina: "maquina-sem-protecao",
  maquinas: "maquina-sem-protecao",
  máquinas: "maquina-sem-protecao",
  carga: "movimentacao-de-carga",
  cargas: "movimentacao-de-carga",
  movimentacao: "movimentacao-de-carga",
  movimentação: "movimentacao-de-carga",
  inflamavel: "inflamaveis",
  inflamável: "inflamaveis",
  inflamaveis: "inflamaveis",
  inflamáveis: "inflamaveis",
  sinalizacao: "sinalizacao",
  sinalização: "sinalizacao",
  ergonomia: "ergonomia",
  incendio: "emergencia-incendio",
  incêndio: "emergencia-incendio",
  emergencia: "emergencia-incendio",
  emergência: "emergencia-incendio",
  construcao: "construcao-civil",
  construção: "construcao-civil",
  obra: "construcao-civil",
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString().split("T")[0];
  if (typeof value === "string" && value.includes("T")) return value.split("T")[0];
  if (typeof value === "string") return value;
  return new Date(value).toISOString().split("T")[0];
}

function toTimestamp(value) {
  if (!value) return Date.now();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

export function severityToTargetLevel(severity = "Média") {
  const normalized = normalizeText(severity);
  if (normalized.includes("crit")) return "Crítico";
  if (normalized.includes("alta") || normalized.includes("alto")) return "Alto";
  if (normalized.includes("media") || normalized.includes("medio")) return "Médio";
  return "Baixo";
}

function priorityToTarget(priority = "Média") {
  const normalized = normalizeText(priority);
  if (normalized.includes("crit")) return "Crítica";
  if (normalized.includes("alta") || normalized.includes("alto")) return "Alta";
  if (normalized.includes("media") || normalized.includes("medio")) return "Média";
  return "Baixa";
}

function statusToMotorRisk(status = "Aberto") {
  const normalized = normalizeText(status);
  if (normalized.includes("resolvido")) return "Resolvido";
  if (normalized.includes("mitig")) return "Mitigado";
  if (normalized.includes("anal")) return "Em análise";
  return "Aberto";
}

function statusToMotorAction(status = "Pendente") {
  const normalized = normalizeText(status);
  if (normalized.includes("concl")) return "Concluída";
  if (normalized.includes("venc")) return "Vencida";
  if (normalized.includes("andamento") || normalized.includes("inici")) return "Em andamento";
  if (normalized.includes("reab")) return "Reaberta";
  return "Pendente";
}

function statusToTargetAction(status = "Pendente") {
  const normalized = normalizeText(status);
  if (normalized.includes("concl")) return "Concluída";
  if (normalized.includes("venc")) return "Vencida";
  if (normalized.includes("andamento")) return "Em andamento";
  if (normalized.includes("reab")) return "Em aberto";
  return "Pendente";
}

function statusToTargetRisk(status = "Aberto") {
  const normalized = normalizeText(status);
  if (normalized.includes("resolvido")) return "Resolvido";
  if (normalized.includes("mitig")) return "Mitigado";
  if (normalized.includes("anal")) return "Em mitigação";
  if (normalized.includes("ident")) return "Identificado";
  return "Aberto";
}

export function getHumanActivityLabel(activityCode = "") {
  return HUMAN_ACTIVITY_BY_CODE[activityCode] || activityCode;
}

export function mapHumanActivityToCode(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "uso-de-epi";

  const exactMatch = Object.entries(ACTIVITY_CODE_BY_TEXT).find(([key]) => normalized === key);
  if (exactMatch) return exactMatch[1];

  const containsMatch = Object.entries(ACTIVITY_CODE_BY_TEXT).find(([key]) => normalized.includes(key));
  if (containsMatch) return containsMatch[1];

  return "uso-de-epi";
}

export function getActivityCodesFromOrganization(organization = {}) {
  const fromActivities = (organization.atividadesCriticas || [])
    .map((activity) => mapHumanActivityToCode(activity))
    .filter(Boolean);

  if (fromActivities.length > 0) {
    return [...new Set(fromActivities)];
  }

  if (organization.segmento) {
    const segmentText = normalizeText(organization.segmento);
    if (segmentText.includes("constr")) return ["construcao-civil", "trabalho-em-altura"];
    if (segmentText.includes("ind")) return ["maquina-sem-protecao", "eletricidade", "uso-de-epi"];
    if (segmentText.includes("log")) return ["movimentacao-de-carga", "uso-de-epi"];
    if (segmentText.includes("saude") || segmentText.includes("hospital")) return ["uso-de-epi", "ergonomia"];
  }

  return ["uso-de-epi"];
}

export function buildFixedNrChecklists() {
  const groups = new Map();

  NR_RULES.forEach((rule) => {
    const key = `${rule.nr}:${rule.atividadeRelacionada}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: `fixed-${key}`,
        titulo: `Checklist ${rule.nr} - ${getHumanActivityLabel(rule.atividadeRelacionada)}`,
        title: `Checklist ${rule.nr} - ${getHumanActivityLabel(rule.atividadeRelacionada)}`,
        name: `Checklist ${rule.nr} - ${getHumanActivityLabel(rule.atividadeRelacionada)}`,
        category: rule.nr,
        status: "Ativo",
        proximaRevisao: "",
        sections: [
          {
            id: `${key}-section`,
            title: "Itens de Verificação",
            questions: [],
          },
        ],
        pacote: findPackageOfNR(rule.nr)?.id || "Base SST",
        segmentos: listSegmentsForNR(rule.nr).map((segment) => segment.id),
        atividades: [getHumanActivityLabel(rule.atividadeRelacionada)],
        nr: rule.nr,
        criticidadePadrao: rule.severidadePadrao,
        geraRiscoSeNaoConforme: true,
        ativo: true,
        regraFixa: true,
        segmento: listSegmentsForNR(rule.nr)[0]?.id || "Base SST",
        atividade: getHumanActivityLabel(rule.atividadeRelacionada),
        nrRelacionada: rule.nr,
      });
    }

    const checklist = groups.get(key);
    checklist.sections[0].questions.push({
      id: rule.id,
      text: rule.perguntaChecklist,
      type: "boolean",
      riskMap: rule.severidadePadrao,
      nr: rule.nr,
      nrRelacionada: rule.nr,
      criticidade: rule.severidadePadrao,
      regraId: rule.id,
      tipoRisco: rule.titulo,
      acaoSugerida: rule.acaoRecomendada,
    });
  });

  return Array.from(groups.values()).sort((left, right) => left.titulo.localeCompare(right.titulo));
}

export function buildInitialRiskRules() {
  return NR_RULES.map((rule) => ({
    id: rule.id,
    titulo: rule.titulo,
    pacote: findPackageOfNR(rule.nr)?.id || "Base SST",
    segmentos: listSegmentsForNR(rule.nr).map((segment) => segment.id),
    atividades: [getHumanActivityLabel(rule.atividadeRelacionada)],
    nrRelacionada: rule.nr,
    itemNormativoOpcional: rule.descricao,
    gatilhosTexto: [rule.perguntaChecklist],
    criticidade: severityToTargetLevel(rule.severidadePadrao),
    condicao: rule.condicaoDisparo,
    acaoSugerida: rule.acaoRecomendada,
    prazoPadraoHoras: rule.prazoSugeridoDias * 24,
    exigeEvidencia: Boolean(rule.exigeEvidencia),
    geraMultaEstimativa: true,
    faixaMultaPadrao: "",
    ativo: Boolean(rule.ativa),
  }));
}

export function buildNrMatrix() {
  return listActiveNRs().map((nr) => {
    const rules = NR_RULES.filter((rule) => rule.nr === nr.codigo);
    const segments = listSegmentsForNR(nr.codigo).map((segment) => segment.id);
    const maxSeverity = rules.reduce((current, rule) => {
      const levels = ["Baixa", "Média", "Alta", "Crítica"];
      return levels.indexOf(rule.severidadePadrao) > levels.indexOf(current) ? rule.severidadePadrao : current;
    }, "Baixa");

    return {
      id: nr.codigo,
      nome: nr.nome,
      descricaoCurta: nr.nome,
      pacote: nr.pacote,
      segmentosAplicaveis: segments.length > 0 ? segments : ["Todos"],
      atividadesRelacionadas: rules.map((rule) => getHumanActivityLabel(rule.atividadeRelacionada)),
      tipo: nr.pacote === "Base SST" ? "geral" : "setorial",
      ativa: nr.ativa,
      prioridadePadrao: maxSeverity,
      geraChecklist: rules.length > 0,
      geraRisco: rules.length > 0,
      geraMultaEstimativa: true,
    };
  });
}

export function getApplicableNrMatrix(params = {}) {
  const matrix = buildNrMatrix();
  const selectedPackages = new Set(["Base SST", ...(params.pacotesAtivos || [])]);
  const selectedSegment = params.segmentoOrganizacao || "Todos";
  const selectedActivityCodes = (params.atividadesCriticas || []).map((activity) => mapHumanActivityToCode(activity));

  return matrix.filter((nr) => {
    const packageMatch = selectedPackages.has(nr.pacote);
    const segmentMatch =
      selectedSegment === "Todos" ||
      nr.segmentosAplicaveis.includes("Todos") ||
      nr.segmentosAplicaveis.includes(selectedSegment);
    const activityMatch =
      selectedActivityCodes.length === 0 ||
      nr.atividadesRelacionadas.some((activity) => selectedActivityCodes.includes(mapHumanActivityToCode(activity)));

    return packageMatch || (segmentMatch && activityMatch);
  });
}

export function mapInspectionItemsToAnswers(items = []) {
  return items.map((item, index) => {
    const status = normalizeText(item.status || item.answer || "pendente");
    const mappedStatus =
      status === "sim" || status === "conforme"
        ? "sim"
        : status === "nao" || status === "não" || status === "parcialmente" || status === "nao conforme"
          ? "não"
          : status === "n/a" || status === "na" || status === "não aplicável" || status === "nao aplicavel"
            ? "não-aplicável"
            : "pendente";

    return {
      id: item.id || `ans-${index}`,
      perguntaId: item.regraId || item.id || `ans-${index}`,
      pergunta: item.text || item.pergunta || item.title || "",
      resposta: mappedStatus,
      observacao: item.observacao || item.note || "",
      evidencias: item.evidencia ? [item.evidencia] : [],
      riskMap: item.riskMap || item.criticidade || "Média",
      nr: item.nr || item.nrRelacionada,
    };
  });
}

export function mapTargetInspectionToMotor(inspection = {}) {
  const checklistName = inspection.checklist || inspection.tipoInspecao || inspection.titulo || inspection.nome || "Inspeção";
  return {
    id: inspection.id,
    titulo: inspection.titulo || inspection.title || checklistName,
    setor: inspection.setor || inspection.ondeUsar || "Geral",
    responsavel: inspection.responsavel || inspection.inspector || "A definir",
    atividades: [mapHumanActivityToCode(inspection.tipoInspecao || checklistName)],
    status: inspection.status || inspection.situacao || "Agendada",
    data: toIsoDate(inspection.data || inspection.proximaInspecao || inspection.created_at || inspection.criadoEm),
    hasNonConformity: Boolean(inspection.nonConformities),
    observacao: inspection.observacoes || inspection.observacao || "",
    createdAt: toTimestamp(inspection.criadoEm || inspection.created_at || inspection.createdAt),
    updatedAt: toTimestamp(inspection.atualizadoEm || inspection.updated_at || inspection.updatedAt),
    checklistAnswers: mapInspectionItemsToAnswers(inspection.items || []),
  };
}

export function mapTargetRiskToMotor(risk = {}) {
  return {
    id: risk.id,
    inspectionId: risk.inspection_id || risk.inspecaoId,
    titulo: risk.titulo || risk.title || risk.atividade || "Risco operacional",
    descricao: risk.descricao || "",
    setor: risk.setor || risk.sector_id || "Geral",
    severidade: calculateSeverity({ severidade: severityToTargetLevel(risk.nivel || risk.prioridade || risk.severidade || "Médio") }),
    prioridade: priorityToTarget(risk.prioridade || risk.priority || risk.nivel || "Média"),
    status: statusToMotorRisk(risk.status || "Aberto"),
    pacote: risk.pacote || risk.package || findPackageOfNR(risk.nr)?.id || "Base SST",
    nr: risk.nr,
    origem: risk.origem || "manual",
    multaEstimada: Number(risk.multaEstimada || 0),
    createdAt: toTimestamp(risk.criadoEm || risk.created_at || risk.createdAt),
    updatedAt: toTimestamp(risk.atualizadoEm || risk.updated_at || risk.updatedAt),
    recorrencia: Number(risk.recorrenciaHistorica || risk.recorrencia || 0),
  };
}

export function mapTargetActionToMotor(action = {}) {
  return {
    id: action.id,
    riskId: action.riscoId || action.riskId,
    inspectionId: action.inspecaoId || action.inspection_id,
    titulo: action.titulo || action.title || "Ação corretiva",
    descricao: action.descricao || action.description || "",
    responsavel: action.responsavel || "A definir",
    status: statusToMotorAction(action.status || "Pendente"),
    prioridade: priorityToTarget(action.prioridade || action.priority || "Média"),
    prazo: toIsoDate(action.prazo || action.deadlineTime || action.created_at),
    evidencias: action.evidencias || [],
    origem: action.origem || "manual",
    createdAt: toTimestamp(action.criadoEm || action.created_at || action.createdAt),
    updatedAt: toTimestamp(action.atualizadoEm || action.updated_at || action.updatedAt),
    completedAt: action.status === "Concluída" ? toTimestamp(action.updated_at || action.updatedAt) : undefined,
  };
}

export function mapStoreStateToMotorDataset(state = {}) {
  const inspections = (state.inspecoes || []).map((inspection) => mapTargetInspectionToMotor(inspection));
  const risks = (state.riscos || []).map((risk) => mapTargetRiskToMotor(risk));
  const actions = (state.acoes || []).map((action) => mapTargetActionToMotor(action));
  const auditLogs = (state.logs || []).map((log) => ({
    ...log,
    createdAt: log.created_at || log.createdAt || new Date().toISOString(),
  }));
  const nonConformities = inspections.flatMap((inspection) =>
    (inspection.checklistAnswers || [])
      .filter((answer) => answer.resposta === "não")
      .map((answer) => ({
        id: `nc-${inspection.id}-${answer.perguntaId}`,
        inspectionId: inspection.id,
        questionId: answer.perguntaId,
        pergunta: answer.pergunta,
        resposta: answer.resposta,
        titulo: answer.pergunta,
        descricao: answer.observacao || answer.pergunta,
        setor: inspection.setor,
        atividade: inspection.atividades?.[0] || "uso-de-epi",
        status: "Aberta",
        severidade: "Média",
        prioridade: "Média",
        pacote: "Base SST",
        nr: undefined,
        ruleId: answer.perguntaId,
        acaoRecomendada: answer.pergunta,
        evidenciasFornecidas: answer.evidencias || [],
        exigeEvidencia: false,
        prazoSugeridoData: inspection.data,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
      })),
  );

  return {
    inspections,
    risks,
    actions,
    nonConformities,
    evidences: [],
    sectors: state.sectors || [],
    responsibles: state.users || [],
    auditLogs,
    settings: state.configuracoes || {},
  };
}

function buildFallbackNonConformities(inspection, answers, generatedNonConformities) {
  const generatedKeys = new Set(generatedNonConformities.map((item) => item.questionId || item.ruleId || item.pergunta));

  return answers
    .filter((answer) => answer.resposta === "não")
    .filter((answer) => !generatedKeys.has(answer.perguntaId) && !generatedKeys.has(answer.pergunta))
    .map((answer) => ({
      id: `nc-fallback-${inspection.id}-${answer.perguntaId}`,
      inspectionId: inspection.id,
      questionId: answer.perguntaId,
      pergunta: answer.pergunta,
      resposta: answer.resposta,
      titulo: answer.pergunta,
      descricao: answer.observacao || `Não conformidade detectada em ${inspection.titulo}.`,
      setor: inspection.setor,
      atividade: inspection.atividades?.[0] || "uso-de-epi",
      status: "Aberta",
      severidade: answer.riskMap || "Média",
      prioridade: answer.riskMap || "Média",
      pacote: "Base SST",
      nr: undefined,
      ruleId: answer.perguntaId,
      acaoRecomendada: answer.pergunta,
      evidenciasFornecidas: answer.evidencias || [],
      exigeEvidencia: false,
      prazoSugeridoData: inspection.data,
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt,
    }));
}

function mapMotorRiskToTarget(risk, inspection) {
  const financialImpact = estimateRiskFinancialImpact({
    id: risk.id,
    setor: risk.setor,
    severidade: risk.severidade,
    multaEstimada: risk.multaEstimada,
    nr: risk.nr,
  });
  const chanceIncidente = Math.max(5, Math.min(95, calculateOperationalCriticality({ severidade: risk.severidade, recurrence: risk.recorrencia || 0 }) + 15));
  const impactoOperacional = chanceIncidente >= 75 ? "Crítico" : chanceIncidente >= 50 ? "Alto" : chanceIncidente >= 25 ? "Médio" : "Baixo";

  return {
    id: risk.id,
    titulo: risk.titulo,
    title: risk.titulo,
    descricao: risk.descricao,
    setor: risk.setor,
    nr: risk.nr || "NR-01",
    nivel: severityToTargetLevel(risk.severidade),
    severity: severityToTargetLevel(risk.severidade),
    status: statusToTargetRisk(risk.status),
    prioridade: priorityToTarget(risk.prioridade || calculatePriority(risk)),
    prazo: "",
    responsavel: inspection.responsavel,
    multaEstimada: financialImpact.valorEstimado,
    chanceIncidente,
    pacote: risk.pacote || findPackageOfNR(risk.nr)?.id || "Base SST",
    package: risk.pacote || findPackageOfNR(risk.nr)?.id || "Base SST",
    criadoEm: new Date(risk.createdAt).toISOString(),
    criado_at: new Date(risk.createdAt).toISOString(),
    created_at: new Date(risk.createdAt).toISOString(),
    atualizadoEm: new Date(risk.updatedAt).toISOString(),
    updated_at: new Date(risk.updatedAt).toISOString(),
    atividade: inspection.tipoInspecao || inspection.checklist || getHumanActivityLabel(mapHumanActivityToCode(inspection.tipoInspecao || inspection.checklist || "")),
    tipoDeRisco: risk.titulo,
    origem: "Inspeção / Checklist",
    inspection_id: risk.inspectionId,
    inspecaoId: risk.inspectionId,
    riscoId: risk.id,
    regraId: risk.ruleId,
    regraTitulo: risk.titulo,
    justificativa: risk.descricao,
    justificativaMulta: financialImpact.explicacao,
    justificativaIncidente: `Chance calculada com base em severidade ${severityToTargetLevel(risk.severidade)} e criticidade operacional.`,
    impactoOperacional,
    nivelConformidade: "Não conforme",
    trabalhadoresExpostos: Number(inspection.trabalhadoresExpostos || 0),
    perfilExposto: inspection.perfilExposto || "",
  };
}

function mapMotorActionToTarget(action, risk, inspection) {
  const delayImpact = estimateActionDelayImpact({
    id: action.id,
    prioridade: action.prioridade,
    status: action.status,
  });

  return {
    id: action.id,
    titulo: action.titulo,
    title: action.titulo,
    descricao: action.descricao,
    setor: risk?.setor || inspection.setor,
    status: statusToTargetAction(action.status),
    prioridade: priorityToTarget(action.prioridade),
    prazo: action.prazo,
    responsavel: action.responsavel || inspection.responsavel,
    riscoId: action.riskId,
    riskId: action.riskId,
    inspecaoId: action.inspectionId,
    inspection_id: action.inspectionId,
    pacote: risk?.pacote || "Base SST",
    package: risk?.pacote || "Base SST",
    criadoEm: new Date(action.createdAt).toISOString(),
    created_at: new Date(action.createdAt).toISOString(),
    atualizadoEm: new Date(action.updatedAt).toISOString(),
    updated_at: new Date(action.updatedAt).toISOString(),
    valorEstimado: delayImpact.valorEstimado,
    nr: risk?.nr,
    origem: "motor-operacional",
  };
}

export function synchronizeInspectionWithMotor(inspectionInput = {}, state = {}) {
  const inspection = mapTargetInspectionToMotor(inspectionInput);
  const answers = mapInspectionItemsToAnswers(inspectionInput.items || []);
  const generatedNonConformities = generateNonConformitiesFromInspection(inspection, answers, {
    activityType: inspection.atividades?.[0] || "uso-de-epi",
    sector: inspection.setor,
    pacote: inspectionInput.pacote || "Base SST",
    responsavel: inspection.responsavel,
  });
  const fallbackNonConformities = buildFallbackNonConformities(inspection, answers, generatedNonConformities);
  const nonConformities = [...generatedNonConformities, ...fallbackNonConformities];
  const generatedRisks = generateRisksFromNonConformities(nonConformities, {
    responsavel: inspection.responsavel,
    recurrence: 0,
  });
  const generatedActions = generateActionsFromRisks(generatedRisks, {
    responsavel: inspection.responsavel,
    referenceDate: inspection.updatedAt,
  });

  const risks = generatedRisks.map((risk) => mapMotorRiskToTarget(risk, inspectionInput));
  const riskById = Object.fromEntries(risks.map((risk) => [risk.id, risk]));
  const actions = generatedActions.map((action) => mapMotorActionToTarget(action, riskById[action.riskId], inspectionInput));

  const alerts = [
    ...risks
      .filter((risk) => risk.nivel === "Crítico" || risk.nivel === "Alto")
      .map((risk) => ({
        id: `alert-risk-${risk.id}`,
        type: "risco_gerado",
        title: `Risco ${risk.nivel} detectado`,
        description: risk.titulo,
        status: "Ativo",
        severity: risk.nivel,
        origin: "Risco",
        originId: risk.id,
        package: risk.pacote,
        nr: risk.nr,
        createdAt: new Date().toISOString(),
        link: "/operacao/riscos",
      })),
    ...actions.map((action) => ({
      id: `alert-action-${action.id}`,
      type: "acao_gerada",
      title: "Ação corretiva criada",
      description: action.titulo,
      status: "Ativo",
      severity: action.prioridade === "Crítica" ? "Crítico" : action.prioridade === "Alta" ? "Alto" : "Médio",
      origin: "Ação",
      originId: action.id,
      package: action.pacote,
      nr: action.nr,
      createdAt: new Date().toISOString(),
      link: "/operacao/acoes",
    })),
  ];

  const logs = [
    {
      id: `log-inspection-${inspection.id}-${Date.now()}`,
      empresa_id: inspectionInput.empresa_id || "1",
      user_id: inspection.responsavel || "Sistema",
      event_type: "motor_processado",
      description: `Motor processou ${nonConformities.length} não conformidades, ${risks.length} riscos e ${actions.length} ações para a inspeção ${inspection.titulo}.`,
      origin_type: "inspecao",
      origin_id: inspection.id,
      created_at: new Date().toISOString(),
      metadata: { inspectionId: inspection.id, nonConformities: nonConformities.length, risks: risks.length, actions: actions.length },
    },
  ];

  return {
    inspection: {
      ...inspectionInput,
      pacote: inspectionInput.pacote || findPackageOfNR(risks[0]?.nr || "NR-01")?.id || "Base SST",
      nonConformities: nonConformities.length,
      motorSyncVersion: "novosaassomotor-js",
      atualizadoEm: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    nonConformities,
    risks,
    actions,
    alerts,
    logs,
  };
}
