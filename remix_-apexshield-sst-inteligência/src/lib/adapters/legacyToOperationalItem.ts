import type { EngineResult } from '../../types/engineResult';
import { fail, ok } from '../../types/engineResult';
import type { Evidence, EvidenceType } from '../../types/evidence';
import type { FieldInput } from '../../types/fieldInput';
import type {
  OperationalItem,
  OperationalItemDraft,
  OperationalItemEvidencePlan,
  OperationalItemKind,
  OperationalItemPriority,
  OperationalItemSourceType,
  OperationalItemStatus,
} from '../../types/operationalItem';
import type { SSTRuleSeverity } from '../../types/sstRule';

export interface LegacyRiskLike {
  id: string;
  titulo?: string;
  title?: string;
  descricao?: string;
  observacao?: string;
  observacoes?: string;
  setor?: string;
  sector?: string;
  atividade?: string;
  nr?: string;
  origem?: string;
  severidade?: string;
  nivel?: string;
  criticidade?: string;
  prioridade?: string;
  status?: string;
  prazo?: string;
  responsavel?: string;
  evidencias?: string;
  acaoVinculada?: string;
  criadoEm?: string;
  updatedAt?: string;
  atualizadoEm?: string;
}

export interface LegacyActionEvidenceLike {
  id?: string;
  url?: string;
  tipo?: string;
  descricao?: string;
  dataUpload?: string;
  enviadoPor?: string;
}

export interface LegacyActionLike {
  id: string;
  titulo?: string;
  title?: string;
  descricao?: string;
  setor?: string;
  origem?: string;
  prioridade?: string;
  severidade?: string;
  criticidade?: string;
  status?: string;
  faseExecucao?: string;
  prazo?: string;
  responsavel?: string;
  exigeEvidencia?: boolean;
  evidencia?: LegacyActionEvidenceLike[];
  evidencias?: LegacyActionEvidenceLike[] | string;
  riscoId?: string;
  inspecaoId?: string;
  nrRelacionada?: string;
  regraId?: string;
  criadoEm?: string;
  updatedAt?: string;
  atualizadoEm?: string;
}

export interface LegacyInspectionLike {
  id: string;
  titulo?: string;
  title?: string;
  observacoes?: string;
  descricao?: string;
  setor?: string;
  atividade?: string;
  status?: string;
  checklistId?: string;
  items?: unknown[];
  respostas?: unknown[];
  origem?: string;
  nr?: string;
  data?: string;
  inspector?: string;
  createdBy?: string;
  criadoEm?: string;
  updatedAt?: string;
  atualizadoEm?: string;
}

export interface LegacyInspectionCriticalAnswer {
  questionId: string;
  question: string;
  answer: string;
  isCritical: boolean;
  nr?: string;
  ruleId?: string;
  evidenceRequired: boolean;
  attachments: string[];
}

export interface LegacyInspectionConversionData {
  fieldInput: FieldInput;
  suggestedOperationalItem?: OperationalItemDraft;
  criticalAnswers: LegacyInspectionCriticalAnswer[];
}

export interface LegacyOperationalItemConversionData {
  item: OperationalItem;
  evidences: Evidence[];
}

type LegacyEntityType = 'risk' | 'action' | 'inspection';

interface StatusMappingResult {
  status: OperationalItemStatus;
  warnings: string[];
}

function normalizeText(value?: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function compact<T>(values: Array<T | undefined | null | false>): T[] {
  return values.filter(Boolean) as T[];
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function slugify(value?: string): string | undefined {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || undefined;
}

function toIsoDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.length === 10 ? `${trimmed}T00:00:00.000Z` : trimmed;
  }

  const brDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return undefined;
}

function deriveTitle(
  sourceId: string,
  entityType: LegacyEntityType,
  ...candidates: Array<string | undefined>
): { title: string; warning?: string } {
  const title = candidates.find((candidate) => candidate && candidate.trim());

  if (title) {
    return { title: title.trim() };
  }

  return {
    title: `${entityType === 'inspection' ? 'Inspecao' : entityType === 'risk' ? 'Risco' : 'Acao'} legado ${sourceId}`,
    warning: `Titulo ausente no legado (${entityType}:${sourceId}); fallback aplicado.`,
  };
}

function deriveOrigin(
  rawOrigin: string | undefined,
  defaultOrigin: OperationalItemSourceType
): { origin: OperationalItemSourceType; warning?: string } {
  const normalized = normalizeText(rawOrigin);

  if (!normalized) {
    return {
      origin: defaultOrigin,
      warning: `Origem ausente no legado; fallback aplicado: ${defaultOrigin}.`,
    };
  }

  if (normalized.includes('inspec')) {
    return { origin: 'inspection' };
  }

  if (normalized.includes('checklist')) {
    return { origin: 'checklist' };
  }

  if (normalized.includes('regra') || normalized.includes('norma')) {
    return { origin: 'rule' };
  }

  if (normalized.includes('manual') || normalized.includes('whatsapp') || normalized.includes('campo')) {
    return { origin: 'manual' };
  }

  return { origin: defaultOrigin };
}

function deriveSeverity(...candidates: Array<string | undefined>): SSTRuleSeverity | undefined {
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);

    if (!normalized) {
      continue;
    }

    if (normalized.includes('crit')) {
      return 'critica';
    }

    if (normalized.includes('alto') || normalized.includes('alta')) {
      return 'alta';
    }

    if (normalized.includes('med')) {
      return 'media';
    }

    if (normalized.includes('baix')) {
      return 'baixa';
    }
  }

  return undefined;
}

function derivePriority(
  rawPriority: string | undefined,
  severity: SSTRuleSeverity | undefined
): { priority: OperationalItemPriority; warning?: string } {
  const normalized = normalizeText(rawPriority);

  if (normalized) {
    if (normalized === 'p1' || normalized.includes('urgente') || normalized.includes('crit')) {
      return { priority: 'critica' };
    }

    if (normalized === 'p2' || normalized.includes('alta') || normalized.includes('alto')) {
      return { priority: 'alta' };
    }

    if (normalized === 'p3' || normalized.includes('med')) {
      return { priority: 'media' };
    }

    if (normalized === 'p4' || normalized.includes('baix')) {
      return { priority: 'baixa' };
    }
  }

  if (severity) {
    return {
      priority: severity,
      warning: `Prioridade ausente no legado; inferida pela severidade (${severity}).`,
    };
  }

  return {
    priority: 'media',
    warning: 'Prioridade ausente no legado; fallback aplicado: media.',
  };
}

function mapLegacyStatus(
  rawStatus: string | undefined,
  entityType: LegacyEntityType
): StatusMappingResult {
  const normalized = normalizeText(rawStatus).replace(/\s+/g, '_');

  if (!normalized) {
    return {
      status: 'triaged',
      warnings: ['Status ausente no legado; fallback aplicado: triaged.'],
    };
  }

  if (normalized === 'reaberta' || normalized === 'reaberto') {
    return {
      status: 'inProgress',
      warnings: ['Status legado reaberto nao existe no nucleo atual; mapeado para inProgress.'],
    };
  }

  if (normalized === 'aberto' || normalized === 'em_aberto' || normalized === 'identificado') {
    return {
      status: entityType === 'action' ? 'a_fazer' : 'triaged',
      warnings: [],
    };
  }

  if (normalized === 'em_analise' || normalized === 'monitorando') {
    return { status: 'triaged', warnings: [] };
  }

  if (normalized === 'com_acao' || normalized === 'em_mitigacao' || normalized === 'em_andamento' || normalized === 'iniciada') {
    return { status: 'inProgress', warnings: [] };
  }

  if (normalized === 'mitigado' || normalized === 'aguardando_validacao' || normalized === 'validada') {
    return { status: 'em_validacao', warnings: [] };
  }

  if (normalized === 'encerrado' || normalized === 'resolvido' || normalized === 'concluida' || normalized === 'concluido' || normalized === 'fechada' || normalized === 'realizada') {
    return { status: 'completed', warnings: [] };
  }

  if (normalized === 'cancelado' || normalized === 'cancelada' || normalized === 'anulada') {
    return { status: 'cancelled', warnings: [] };
  }

  if (normalized === 'pendente' || normalized === 'programada' || normalized === 'agendada') {
    return { status: 'a_fazer', warnings: [] };
  }

  if (normalized === 'aguardando_evidencia') {
    return { status: 'awaitingEvidence', warnings: [] };
  }

  if (normalized === 'vencida' || normalized === 'vencido' || normalized === 'atrasada' || normalized === 'em_atraso') {
    return { status: 'vencido', warnings: [] };
  }

  return {
    status: entityType === 'inspection' ? 'triaged' : 'triaged',
    warnings: [`Status legado "${rawStatus}" nao possui mapeamento direto; fallback aplicado: triaged.`],
  };
}

function mapLegacyKind(entityType: 'risk' | 'action', priority: OperationalItemPriority): OperationalItemKind {
  if (entityType === 'action') {
    return priority === 'critica' ? 'criticalDeviation' : 'improvement';
  }

  return priority === 'critica' || priority === 'alta' ? 'criticalDeviation' : 'nonconformity';
}

function buildEvidencePlan(
  priority: OperationalItemPriority,
  requiresEvidence: boolean,
  rationale: string[]
): OperationalItemEvidencePlan {
  const shouldRequire = requiresEvidence || priority === 'alta' || priority === 'critica';
  const evidenceRationale = [...rationale];

  if (requiresEvidence) {
    evidenceRationale.push('Exigencia explicita herdada do legado.');
  } else if (priority === 'alta' || priority === 'critica') {
    evidenceRationale.push('Prioridade alta/critica exige evidencia por padrao de compatibilidade.');
  }

  return {
    required: shouldRequire,
    minimumCount: shouldRequire ? 1 : 0,
    acceptedKinds: ['foto', 'arquivo', 'observacao', 'registro', 'checklist'],
    blockingForCompletion: shouldRequire,
    rationale: evidenceRationale,
  };
}

function buildEvidenceHistory(createdAt: string, createdBy: string): Evidence['history'] {
  return [
    {
      action: 'criada',
      createdAt,
      createdBy,
      note: 'Evidencia convertida do modelo legado.',
    },
    {
      action: 'vinculada_ao_item',
      createdAt,
      createdBy,
      note: 'Compatibilidade legado -> OperationalItem.',
    },
  ];
}

function mapLegacyEvidenceType(rawType?: string): EvidenceType {
  const normalized = normalizeText(rawType);

  if (normalized.includes('foto')) {
    return 'foto';
  }

  if (normalized.includes('assin')) {
    return 'assinatura';
  }

  if (normalized.includes('obs')) {
    return 'observacao';
  }

  if (normalized.includes('registro')) {
    return 'registro';
  }

  return 'arquivo';
}

function parseLegacyEvidenceText(rawEvidence: string, itemId: string, createdAt: string): Evidence[] {
  const chunks = rawEvidence
    .split(/[\n;,]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.map((chunk, index) => ({
    id: `${itemId}-legacy-evidence-${index + 1}`,
    itemId,
    type: chunk.startsWith('http') ? 'arquivo' : 'observacao',
    description: chunk,
    url: chunk.startsWith('http') ? chunk : undefined,
    createdBy: 'legacy-import',
    createdAt,
    validationStatus: 'pendente',
    history: buildEvidenceHistory(createdAt, 'legacy-import'),
    metadata: {
      legacySource: 'string',
    },
  }));
}

function mapLegacyActionEvidences(
  itemId: string,
  evidences: LegacyActionEvidenceLike[] | string | undefined,
  createdAt: string
): Evidence[] {
  if (!evidences) {
    return [];
  }

  if (typeof evidences === 'string') {
    return parseLegacyEvidenceText(evidences, itemId, createdAt);
  }

  return evidences.map((evidence, index) => ({
    id: evidence.id || `${itemId}-legacy-evidence-${index + 1}`,
    itemId,
    type: mapLegacyEvidenceType(evidence.tipo),
    description: evidence.descricao || `Evidencia legada ${index + 1}`,
    url: evidence.url,
    createdBy: evidence.enviadoPor || 'legacy-import',
    createdAt: toIsoDate(evidence.dataUpload) || createdAt,
    validationStatus: 'pendente',
    history: buildEvidenceHistory(toIsoDate(evidence.dataUpload) || createdAt, evidence.enviadoPor || 'legacy-import'),
    metadata: {
      legacySource: 'action-evidence',
    },
  }));
}

function extractTextListFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }

      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        return String(record.url ?? record.name ?? record.fileName ?? record.id ?? '').trim();
      }

      return '';
    })
    .filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function extractCriticalInspectionAnswers(items: unknown[] | undefined): LegacyInspectionCriticalAnswer[] {
  if (!items?.length) {
    return [];
  }

  return items
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return undefined;
      }

      const question = String(
        record.question ?? record.pergunta ?? record.label ?? record.title ?? record.text ?? `Pergunta ${index + 1}`
      ).trim();
      const answer = String(
        record.answer ?? record.resposta ?? record.response ?? record.status ?? record.value ?? ''
      ).trim();
      const normalizedAnswer = normalizeText(answer);
      const explicitCritical = record.isCritical === true || record.critical === true || record.naoConforme === true;
      const derivedCritical =
        explicitCritical ||
        normalizedAnswer === 'nao' ||
        normalizedAnswer === 'não' ||
        normalizedAnswer.includes('parcial') ||
        normalizedAnswer.includes('reprov') ||
        normalizedAnswer.includes('irregular');

      if (!derivedCritical) {
        return undefined;
      }

      const criticalAnswer: LegacyInspectionCriticalAnswer = {
        questionId: String(record.questionId ?? record.id ?? `inspection-question-${index + 1}`),
        question,
        answer: answer || 'Nao informado',
        isCritical: true,
        nr: typeof record.nr === 'string' ? record.nr : typeof record.nrRelacionada === 'string' ? record.nrRelacionada : undefined,
        ruleId: typeof record.ruleId === 'string' ? record.ruleId : typeof record.regraId === 'string' ? record.regraId : undefined,
        evidenceRequired: record.evidenceRequired === true || record.exigeEvidencia === true,
        attachments: compact([
          ...extractTextListFromUnknown(record.attachments),
          ...extractTextListFromUnknown(record.anexos),
          ...extractTextListFromUnknown(record.photos),
        ]),
      };

      return criticalAnswer;
    })
    .filter((answer): answer is LegacyInspectionCriticalAnswer => Boolean(answer));
}

function buildBaseOperationalItem(params: {
  idPrefix: string;
  sourceId: string;
  title: string;
  description?: string;
  kind: OperationalItemKind;
  priority: OperationalItemPriority;
  status: OperationalItemStatus;
  sector?: string;
  activity?: string;
  nr?: string;
  responsible?: string;
  dueAt?: string;
  sourceType: OperationalItemSourceType;
  evidencePlan: OperationalItemEvidencePlan;
  evidenceRequired?: boolean;
  createdAt: string;
  updatedAt: string;
  ruleId?: string;
  tags?: string[];
  legacyReferences?: OperationalItem['legacyReferences'];
}): OperationalItem {
  const itemId = `${params.idPrefix}-${sanitizeId(params.sourceId)}`;
  const activityId = slugify(params.activity);

  return {
    id: itemId,
    title: params.title,
    description: params.description,
    kind: params.kind,
    priority: params.priority,
    status: params.status,
    sector: params.sector,
    activityId,
    nrIds: params.nr ? [params.nr] : [],
    primaryNr: params.nr,
    primaryRuleId: params.ruleId,
    sourceLinks: [
      {
        type: params.sourceType,
        id: params.sourceId,
        label: params.title,
        ruleId: params.ruleId,
      },
    ],
    ruleLinks: [],
    blocking: params.priority === 'critica',
    responsible: params.responsible,
    dueAt: params.dueAt,
    evidencePlan: params.evidencePlan,
    evidenceRequired: params.evidenceRequired ?? params.evidencePlan.required,
    evidenceIds: [],
    recommendedActions: params.description ? [params.description] : [],
    tags: params.tags,
    autoGenerated: false,
    legacyReferences: params.legacyReferences,
    history: [
      {
        toStatus: params.status,
        changedAt: params.createdAt,
        changedBy: 'legacy-compatibility',
        note: 'Item convertido do modelo legado.',
      },
    ],
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

export function legacyRiskToOperationalItem(
  risk: LegacyRiskLike
): EngineResult<LegacyOperationalItemConversionData> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const sourceId = risk.id;

  const { title, warning: titleWarning } = deriveTitle(sourceId, 'risk', risk.titulo, risk.title);
  const { origin, warning: originWarning } = deriveOrigin(risk.origem, 'manual');
  const severity = deriveSeverity(risk.severidade, risk.criticidade, risk.nivel);
  const { priority, warning: priorityWarning } = derivePriority(risk.prioridade, severity);
  const { status, warnings: statusWarnings } = mapLegacyStatus(
    risk.acaoVinculada ? 'com_acao' : risk.status,
    'risk'
  );
  const createdAt = toIsoDate(risk.criadoEm) || new Date().toISOString();
  const updatedAt = toIsoDate(risk.atualizadoEm || risk.updatedAt) || createdAt;
  const dueAt = toIsoDate(risk.prazo);

  warnings.push(...compact([titleWarning, originWarning, priorityWarning]), ...statusWarnings);

  if (!title.trim()) {
    errors.push(`Nao foi possivel converter o risco legado ${sourceId} sem titulo.`);
  }

  const evidencePlan = buildEvidencePlan(priority, Boolean(risk.evidencias), [
    'Risco legado convertido para item operacional.',
  ]);

  const item = buildBaseOperationalItem({
    idPrefix: 'compat-risk',
    sourceId,
    title,
    description: risk.descricao || risk.observacao || risk.observacoes,
    kind: mapLegacyKind('risk', priority),
    priority,
    status,
    sector: risk.setor || risk.sector,
    activity: risk.atividade,
    nr: risk.nr,
    responsible: risk.responsavel,
    dueAt,
    sourceType: origin,
    evidencePlan,
    evidenceRequired: evidencePlan.required,
    createdAt,
    updatedAt,
    tags: compact(['legacy:risco', risk.setor ? `sector:${slugify(risk.setor)}` : undefined, severity ? `severity:${severity}` : undefined]),
    legacyReferences: [
      {
        model: 'inspection-risk-action',
        riskId: sourceId,
      },
    ],
  });

  const evidences = typeof risk.evidencias === 'string' ? parseLegacyEvidenceText(risk.evidencias, item.id, createdAt) : [];
  item.evidenceIds = evidences.map((evidence) => evidence.id);

  if (errors.length > 0) {
    return fail(errors, { item, evidences }, warnings);
  }

  return ok({ item, evidences }, warnings);
}

export function legacyActionToOperationalItem(
  action: LegacyActionLike
): EngineResult<LegacyOperationalItemConversionData> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const sourceId = action.id;

  const { title, warning: titleWarning } = deriveTitle(sourceId, 'action', action.titulo, action.title);
  const { origin, warning: originWarning } = deriveOrigin(action.origem, 'manual');
  const severity = deriveSeverity(action.severidade, action.criticidade);
  const { priority, warning: priorityWarning } = derivePriority(action.prioridade, severity);
  const rawStatus = action.faseExecucao
    ? action.faseExecucao.replace(/Aguardando Evidencia/i, 'aguardando_evidencia').replace(/Aguardando Validação/i, 'mitigado')
    : action.status;
  const { status, warnings: statusWarnings } = mapLegacyStatus(rawStatus, 'action');
  const createdAt = toIsoDate(action.criadoEm) || new Date().toISOString();
  const updatedAt = toIsoDate(action.atualizadoEm || action.updatedAt) || createdAt;
  const dueAt = toIsoDate(action.prazo);
  const evidences = mapLegacyActionEvidences(
    `compat-action-${sanitizeId(sourceId)}`,
    action.evidencia ?? action.evidencias,
    createdAt
  );
  const explicitEvidence = action.exigeEvidencia === true || status === 'awaitingEvidence';

  warnings.push(...compact([titleWarning, originWarning, priorityWarning]), ...statusWarnings);

  if (!title.trim()) {
    errors.push(`Nao foi possivel converter a acao legada ${sourceId} sem titulo.`);
  }

  const evidencePlan = buildEvidencePlan(priority, explicitEvidence, [
    'Acao legada convertida para item operacional.',
  ]);

  const item = buildBaseOperationalItem({
    idPrefix: 'compat-action',
    sourceId,
    title,
    description: action.descricao,
    kind: mapLegacyKind('action', priority),
    priority,
    status,
    sector: action.setor,
    nr: action.nrRelacionada,
    responsible: action.responsavel,
    dueAt,
    sourceType: origin,
    evidencePlan,
    evidenceRequired: evidencePlan.required,
    createdAt,
    updatedAt,
    ruleId: action.regraId,
    tags: compact(['legacy:acao', action.setor ? `sector:${slugify(action.setor)}` : undefined]),
    legacyReferences: [
      {
        model: 'inspection-risk-action',
        actionId: sourceId,
        riskId: action.riscoId,
        inspectionId: action.inspecaoId,
      },
    ],
  });

  item.evidenceIds = evidences.map((evidence) => evidence.id);

  if (errors.length > 0) {
    return fail(errors, { item, evidences }, warnings);
  }

  return ok({ item, evidences }, warnings);
}

export function legacyInspectionToFieldInput(
  inspection: LegacyInspectionLike
): EngineResult<LegacyInspectionConversionData> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const sourceId = inspection.id;
  const { title, warning: titleWarning } = deriveTitle(sourceId, 'inspection', inspection.titulo, inspection.title);
  const createdAt = toIsoDate(inspection.criadoEm || inspection.data) || new Date().toISOString();
  const updatedAt = toIsoDate(inspection.atualizadoEm || inspection.updatedAt) || createdAt;
  const criticalAnswers = extractCriticalInspectionAnswers(inspection.items ?? inspection.respostas);
  const severity: SSTRuleSeverity | undefined =
    criticalAnswers.length >= 2 ? 'critica' : criticalAnswers.length === 1 ? 'alta' : undefined;
  const { priority, warning: priorityWarning } = derivePriority(undefined, severity);
  const { status, warnings: statusWarnings } = mapLegacyStatus(inspection.status, 'inspection');

  warnings.push(...compact([titleWarning, priorityWarning]), ...statusWarnings);

  const fieldInput: FieldInput = {
    id: `compat-inspection-input-${sanitizeId(sourceId)}`,
    title,
    description: inspection.observacoes || inspection.descricao,
    origin: 'inspection',
    sector: inspection.setor,
    criticalActivityId: slugify(inspection.atividade),
    suggestedPriority: priority,
    suggestedSeverity: severity,
    suggestedNR: inspection.nr || criticalAnswers.find((answer) => answer.nr)?.nr,
    createdBy: inspection.inspector || inspection.createdBy || 'legacy-import',
    createdAt,
    source: 'inspection',
    contextId: undefined,
    activityId: slugify(inspection.atividade),
    status: status === 'completed' ? 'triaged' : 'pending',
    metadata: {
      sourceId,
      legacyStatus: inspection.status,
      updatedAt,
      checklistId: inspection.checklistId,
      criticalAnswers,
      preparedFor: 'triage',
    },
  };

  let suggestedOperationalItem: OperationalItemDraft | undefined;

  if (criticalAnswers.length > 0) {
    const evidenceRequired = criticalAnswers.some((answer) => answer.evidenceRequired);
    const evidencePlan = buildEvidencePlan(priority, evidenceRequired, [
      'Inspecao legada convertida em entrada para triagem.',
      'Rascunho operacional sugerido apenas para triagem.',
    ]);

    suggestedOperationalItem = {
      title,
      description: inspection.observacoes || criticalAnswers.map((answer) => `${answer.question}: ${answer.answer}`).join(' | '),
      kind: priority === 'critica' ? 'criticalDeviation' : 'nonconformity',
      priority,
      status: 'triaged',
      sector: inspection.setor,
      activityId: slugify(inspection.atividade),
      checklistId: inspection.checklistId,
      inspectionId: sourceId,
      fieldInputId: fieldInput.id,
      nrIds: compact([inspection.nr, criticalAnswers.find((answer) => answer.nr)?.nr]),
      primaryNr: inspection.nr || criticalAnswers.find((answer) => answer.nr)?.nr,
      sourceLinks: [
        {
          type: 'inspection',
          id: sourceId,
          label: title,
        },
      ],
      ruleLinks: [],
      blocking: priority === 'critica',
      evidencePlan,
      evidenceRequired: evidencePlan.required,
      evidenceIds: [],
      recommendedActions: criticalAnswers.map((answer) => `Validar na triagem: ${answer.question}`),
      tags: compact(['legacy:inspecao', inspection.setor ? `sector:${slugify(inspection.setor)}` : undefined]),
      autoGenerated: false,
      legacyReferences: [
        {
          model: 'inspection-risk-action',
          inspectionId: sourceId,
        },
      ],
      createdBy: inspection.inspector || inspection.createdBy || 'legacy-import',
      createdAt,
      updatedAt,
    };
  }

  if (!fieldInput.title.trim()) {
    errors.push(`Nao foi possivel converter a inspecao legada ${sourceId} sem titulo.`);
  }

  if (errors.length > 0) {
    return fail(errors, { fieldInput, suggestedOperationalItem, criticalAnswers }, warnings);
  }

  return ok({ fieldInput, suggestedOperationalItem, criticalAnswers }, warnings);
}
