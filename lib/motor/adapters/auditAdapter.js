function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hashCode(value = "") {
  let hash = 0;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(index) | 0;
  }

  return Math.abs(hash).toString(16).padEnd(16, "0");
}

function labelFromEventType(eventType = "") {
  const normalized = normalizeText(eventType);

  if (normalized.includes("acao_concl")) return "Conclusão";
  if (normalized.includes("acao_ger")) return "Criação automática";
  if (normalized.includes("risco_ger")) return "Risco gerado";
  if (normalized.includes("inspecao_criad")) return "Inspeção criada";
  if (normalized.includes("inspecao_edit")) return "Inspeção atualizada";
  if (normalized.includes("relatorio_ger")) return "Relatório gerado";
  if (normalized.includes("motor_process")) return "Motor processado";

  return eventType || "Evento";
}

function resolveOriginLabel(log = {}) {
  const user = log.user_id || log.userId || "";
  if (!user || normalizeText(user) === "sistema") return "Sistema";
  return "Manual";
}

function isAutomaticOrigin(log = {}) {
  const origin = resolveOriginLabel(log);
  if (origin === "Sistema") return true;

  const eventType = normalizeText(log.event_type || log.eventType || "");
  return eventType.includes("ger") || eventType.includes("motor");
}

function getLogTimestamp(log = {}) {
  return log.created_at || log.createdAt || new Date().toISOString();
}

function buildChangedFields(log = {}, action = {}) {
  const eventType = normalizeText(log.event_type || "");

  if (eventType.includes("concl")) {
    return [{ campo: "Status", anterior: action.status || "Em andamento", novo: "Concluída" }];
  }

  if (eventType.includes("ger")) {
    return [{ campo: "Registro", anterior: null, novo: log.description || action.titulo || "Gerado pelo sistema" }];
  }

  return [{ campo: "Evento", anterior: null, novo: log.description || labelFromEventType(log.event_type) }];
}

function getRelevantIdsForAction(action = {}) {
  return [
    action.id,
    action.riskId,
    action.riscoId,
    action.risk_id,
    action.inspecaoId,
    action.inspection_id,
    action.item_origem_id,
  ].filter(Boolean);
}

function matchesRelevantIds(log = {}, relevantIds = []) {
  const originId = log.origin_id || log.originId || "";
  const ownId = log.id || "";
  return relevantIds.includes(originId) || relevantIds.includes(ownId);
}

export function buildAuditTimelineViewModel(state = {}, params = {}) {
  const relevantIds = [params.itemId, params.relatedInspectionId, params.relatedRiskId].filter(Boolean);
  const logs = (state.logs || [])
    .filter((log) => matchesRelevantIds(log, relevantIds))
    .sort((left, right) => new Date(left.created_at || 0).getTime() - new Date(right.created_at || 0).getTime());

  return {
    events: logs.map((log) => ({
      id: log.id || `audit-${hashCode(JSON.stringify(log))}`,
      eventType: log.event_type || "manual",
      label: labelFromEventType(log.event_type),
      description: log.description || "Evento registrado",
      createdAt: getLogTimestamp(log),
      userId: log.user_id || "Sistema",
      originType: log.origin_type || "sistema",
      originId: log.origin_id || "",
      isAutomatic: isAutomaticOrigin(log),
    })),
  };
}

function mapActionHistoryEvent(action = {}, event = {}, index = 0) {
  return {
    id: event.id || `HIS-${action.id}-evt${index}`,
    actionId: event.actionId || action.id,
    actionTitle: action.titulo,
    evento: event.evento || "Evento sem nome",
    origem: event.origem || "Manual",
    usuario: event.usuario || "Usuário Desconhecido",
    dataHora: event.dataHora || action.atualizadoEm || action.criadoEm || new Date().toISOString(),
    statusFinal: event.statusFinal || action.status,
    camposAlterados: Array.isArray(event.camposAlterados) && event.camposAlterados.length > 0
      ? event.camposAlterados.map((field) => ({
          campo: field.campo,
          anterior: field.anterior,
          novo: field.novo,
        }))
      : [{ campo: "Status", anterior: "-", novo: action.status }],
    riscoVinculado: action.riscoVinculado || "Não informado",
    inspecaoVinculada: action.origem || "Não informado",
    checklistPergunta: action.perguntaOrigem || "Não aplicável",
    justificativa: event.justificativa || `Alteração realizada por ${event.usuario || "desconhecido"}.`,
    hash: event.hash || hashCode(`${action.id}:${event.id || index}:${event.dataHora || ""}`),
    versao: event.versao || `v${index + 1}`,
    fonte: event.fonte || "Interface Web",
    ambiente: event.ambiente || "Produção",
    integridade: event.integridade || "Verificada",
    pacote: action.pacote,
  };
}

function mapActionLogEvent(action = {}, log = {}, index = 0) {
  const source = resolveOriginLabel(log);
  return {
    id: log.id || `LOG-${action.id}-${index}`,
    actionId: action.id,
    actionTitle: action.titulo,
    evento: labelFromEventType(log.event_type),
    origem: source,
    usuario: log.user_id || "Sistema",
    dataHora: getLogTimestamp(log),
    statusFinal: action.status,
    camposAlterados: buildChangedFields(log, action),
    riscoVinculado: action.riscoVinculado || "Não informado",
    inspecaoVinculada: action.origem || "Não informado",
    checklistPergunta: action.perguntaOrigem || "Não aplicável",
    justificativa: log.description || "Evento auditável registrado no motor.",
    hash: hashCode(`${action.id}:${log.id || index}:${log.description || ""}`),
    versao: `log-${index + 1}`,
    fonte: log.origin_type || "timeline",
    ambiente: "Produção",
    integridade: "Verificada",
    pacote: action.pacote,
  };
}

export function buildActionHistoryViewModel(state = {}, actions = []) {
  const logs = state.logs || [];
  const events = [];

  (actions || []).forEach((action) => {
    const relevantIds = getRelevantIdsForAction(action);
    const actionLogs = logs.filter((log) => matchesRelevantIds(log, relevantIds));

    (action.historico || []).forEach((event, index) => {
      events.push(mapActionHistoryEvent(action, event, index));
    });

    actionLogs.forEach((log, index) => {
      events.push(mapActionLogEvent(action, log, index));
    });
  });

  const deduped = Array.from(
    events.reduce((map, event) => {
      const key = `${event.actionId}:${event.id}`;
      if (!map.has(key)) {
        map.set(key, event);
      }
      return map;
    }, new Map()).values(),
  );

  return deduped.sort((left, right) => new Date(right.dataHora).getTime() - new Date(left.dataHora).getTime());
}

function getRelevantIdsForRisk(risk = {}) {
  return [
    risk.id,
    risk.riskId,
    risk.riscoId,
    risk.risk_id,
    risk.inspecaoId,
    risk.inspection_id,
    risk.item_origem_id,
  ].filter(Boolean);
}

function resolveRiskOrigin(risk = {}, logs = []) {
  if (logs.some((log) => isAutomaticOrigin(log))) return "Automática";

  const origin = normalizeText(risk.origem || risk.origin || "");
  if (origin.includes("inspe")) return "Automática";
  if (origin.includes("auto")) return "Automática";
  if (origin.includes("motor")) return "Automática";
  return "Manual";
}

function resolveRiskTitle(risk = {}) {
  return risk.tipoDeRisco || risk.titulo || risk.title || risk.atividade || "Risco operacional";
}

function resolveRiskNr(risk = {}) {
  if (Array.isArray(risk.nr)) return risk.nr[0] || "--";
  return risk.nr || risk.nrRelacionada || "--";
}

function resolveRiskAuditSummary(risk = {}, logs = []) {
  const createdAt = risk.criadoEm || risk.createdAt || risk.dataLancamento || getLogTimestamp(logs[logs.length - 1]) || new Date().toISOString();
  const latestLog = logs[0] || null;
  const updatedAt = latestLog ? getLogTimestamp(latestLog) : (risk.atualizadoEm || risk.updatedAt || createdAt);
  const updatedBy = latestLog ? (latestLog.user_id || latestLog.userId || "Sistema") : "Sistema";
  const version = logs.length > 0 ? String(logs.length) : "1";
  const hash = hashCode(`${risk.id || "risk"}:${updatedAt}:${resolveRiskTitle(risk)}`);
  const originLabel = resolveRiskOrigin(risk, logs);
  const originType = normalizeText(risk.origem || risk.origin || "");
  const originContext = originType.includes("inspe")
    ? "Inspeção de campo"
    : originLabel === "Automática"
      ? "Motor de Riscos"
      : "Inserção Manual";

  return {
    createdAt,
    updatedAt,
    updatedBy,
    version,
    hash,
    originLabel,
    originDisplay: risk.origem || (originLabel === "Automática" ? "Automática" : "Manual"),
    originContext,
  };
}

export function buildRiskHistoryViewModel(state = {}, risks = []) {
  return (risks || [])
    .map((risk) => {
      const relevantIds = getRelevantIdsForRisk(risk);
      const riskLogs = (state.logs || [])
        .filter((log) => matchesRelevantIds(log, relevantIds))
        .sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime());
      const audit = resolveRiskAuditSummary(risk, riskLogs);

      return {
        id: risk.id,
        riskId: risk.id,
        title: resolveRiskTitle(risk),
        originLabel: audit.originLabel,
        originDisplay: audit.originDisplay,
        originContext: audit.originContext,
        isAutomatic: audit.originLabel === "Automática",
        setor: risk.setor || "Não informado",
        atividade: risk.atividade || "Não informada",
        nr: resolveRiskNr(risk),
        status: risk.status || "Aberto",
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        updatedBy: audit.updatedBy,
        version: audit.version,
        hash: audit.hash,
        auditEvents: riskLogs.length,
      };
    })
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function buildRiskAuditDetailViewModel(state = {}, risk = {}) {
  const relevantIds = getRelevantIdsForRisk(risk);
  const logs = (state.logs || [])
    .filter((log) => matchesRelevantIds(log, relevantIds))
    .sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime());

  return resolveRiskAuditSummary(risk, logs);
}
