import { actionRequiresEvidence } from '@/lib/action-rules';
import type { OperationalItem } from '@/src/types/operationalItem';

type RiskLike = Record<string, any>;
type ActionLike = Record<string, any>;
type InspectionLike = Record<string, any>;

export type DashboardOwnerSummary = {
  owner: string;
  pendencias: number;
  riscos: number;
  acoes: number;
  inspecoes: number;
  custo: number;
};

export type DashboardSectorSummary = {
  sector: string;
  score: number;
  riscos: number;
  acoes: number;
  inspecoes: number;
  custo: number;
  evidencias: number;
};

export type DashboardContextSummary = {
  contextId: string;
  items: number;
  criticalItems: number;
  overdueItems: number;
  evidenceGaps: number;
};

export type DashboardNrSummary = {
  nr: string;
  score: number;
  riscos: number;
  multas: number;
};

export type DashboardCurrentProblem = {
  id: string;
  type: string;
  title: string;
  sector: string;
  owner: string;
  nr?: string;
  detail: string;
  cost: number;
  severity: number;
};

export interface DashboardMetricsInput {
  riscos: RiskLike[];
  acoes: ActionLike[];
  inspecoes: InspectionLike[];
  operationalItems?: OperationalItem[];
}

export interface DashboardMetrics {
  activeRisks: RiskLike[];
  activeActions: ActionLike[];
  overdueActions: ActionLike[];
  overdueInspections: InspectionLike[];
  criticalActionsWithoutEvidence: ActionLike[];
  activeRisksWithoutEvidence: RiskLike[];
  criticalItems: number;
  itemsWithoutResponsible: number;
  itemsWithoutEvidence: number;
  openRiskFines: number;
  openActionCosts: number;
  exposureTotal: number;
  evidenceGapTotal: number;
  currentProblems: DashboardCurrentProblem[];
  owners: DashboardOwnerSummary[];
  sectors: DashboardSectorSummary[];
  contexts: DashboardContextSummary[];
  nrs: DashboardNrSummary[];
  worstSector?: DashboardSectorSummary;
  topOwner?: DashboardOwnerSummary;
  topNr?: DashboardNrSummary;
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(value: unknown) {
  return stripAccents(String(value ?? '').trim().toLowerCase());
}

function parseMoney(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstMeaningful(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isOverdue(value: unknown) {
  const parsed = parseDate(value);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

function isRiskClosed(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes('resolv') || normalized.includes('mitig') || normalized.includes('fechad');
}

function isActionClosed(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes('conclu') || normalized.includes('fechad') || normalized.includes('cancelad');
}

function isInspectionClosed(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes('realiz') || normalized.includes('conclu') || normalized.includes('anulad');
}

function getRiskName(risk: RiskLike) {
  return firstMeaningful(risk.titulo, risk.title, risk.atividade, risk.descricao, 'Risco sem nome');
}

function getRiskSector(risk: RiskLike) {
  return firstMeaningful(risk.setor, risk.sector_id, risk.onde, 'Setor nao definido');
}

function getRiskNr(risk: RiskLike) {
  return firstMeaningful(risk.nr, risk.nrRelacionada, 'NR nao vinculada');
}

function getRiskOwner(risk: RiskLike) {
  return firstMeaningful(risk.responsavel, risk.validadorCorrecao, risk.executorCorrecao, 'Responsavel nao definido');
}

function getRiskSeverityWeight(risk: RiskLike) {
  const normalized = normalizeText(risk.criticidade || risk.nivel || risk.level || risk.prioridade || risk.severidade);
  if (normalized.startsWith('cr') || normalized === 'p1' || normalized.includes('urg')) return 4;
  if (normalized.includes('alt') || normalized === 'p2') return 3;
  if (normalized.includes('med') || normalized === 'p3') return 2;
  return 1;
}

function getActionName(action: ActionLike) {
  return firstMeaningful(action.oQue, action.titulo, action.title, action.descricao, 'Acao sem nome');
}

function getInspectionSector(inspection: InspectionLike) {
  return firstMeaningful(inspection.setor, inspection.ondeUsar, inspection.sector_id, inspection.onde, 'Setor nao definido');
}

function getActionSector(action: ActionLike, linkedRisk?: RiskLike, linkedInspection?: InspectionLike) {
  return firstMeaningful(
    action.onde,
    action.setor,
    action.sector_id,
    linkedRisk && getRiskSector(linkedRisk),
    linkedInspection && getInspectionSector(linkedInspection),
    'Setor nao definido'
  );
}

function getActionOwner(action: ActionLike) {
  return firstMeaningful(action.quem, action.responsavel, action.executor, action.validador, 'Responsavel nao definido');
}

function getActionCost(action: ActionLike) {
  const raw = action.quantoCusta ?? action.valorEstimado ?? action.custoEstimado;
  return parseMoney(raw);
}

function hasRiskEvidence(risk: RiskLike) {
  if (typeof risk.evidencias === 'string') return risk.evidencias.trim().length > 0;
  if (Array.isArray(risk.evidencia)) return risk.evidencia.length > 0;
  if (Array.isArray(risk.evidencias)) return risk.evidencias.length > 0;
  return false;
}

function getActionEvidenceCount(action: ActionLike) {
  if (Array.isArray(action.evidencia)) return action.evidencia.length;
  if (Array.isArray(action.evidencias)) return action.evidencias.length;
  if (typeof action.evidencias === 'string' && action.evidencias.trim()) return 1;
  return 0;
}

function getActionNr(action: ActionLike, linkedRisk?: RiskLike, linkedInspection?: InspectionLike) {
  return firstMeaningful(action.nr, action.nrRelacionada, linkedRisk && getRiskNr(linkedRisk), linkedInspection?.nr, 'NR nao vinculada');
}

function getInspectionName(inspection: InspectionLike) {
  return firstMeaningful(inspection.titulo, inspection.title, inspection.tipoInspecao, inspection.checklist, 'Inspecao sem nome');
}

function getInspectionOwner(inspection: InspectionLike) {
  return firstMeaningful(inspection.responsavel, inspection.inspector, 'Responsavel nao definido');
}

function getInspectionIssueCount(inspection: InspectionLike) {
  const answers = Array.isArray(inspection.answers) ? inspection.answers : [];
  const items = Array.isArray(inspection.items) ? inspection.items : [];

  const answerIssues = answers.filter((answer) => answer?.isConform === false).length;
  const itemIssues = items.filter((item) => {
    const status = normalizeText(item?.status ?? item?.answer);
    return status.startsWith('n') || status.includes('parc') || status.includes('reprov');
  }).length;
  const declaredIssues = Number(inspection.nonConformities || 0);

  return Math.max(answerIssues + itemIssues, declaredIssues);
}

function incrementOwner(map: Map<string, DashboardOwnerSummary>, owner: string, payload: Partial<DashboardOwnerSummary>) {
  const current = map.get(owner) || { owner, pendencias: 0, riscos: 0, acoes: 0, inspecoes: 0, custo: 0 };
  map.set(owner, {
    owner,
    pendencias: current.pendencias + (payload.pendencias || 0),
    riscos: current.riscos + (payload.riscos || 0),
    acoes: current.acoes + (payload.acoes || 0),
    inspecoes: current.inspecoes + (payload.inspecoes || 0),
    custo: current.custo + (payload.custo || 0),
  });
}

function incrementSector(map: Map<string, DashboardSectorSummary>, sector: string, payload: Partial<DashboardSectorSummary>) {
  const current = map.get(sector) || {
    sector,
    score: 0,
    riscos: 0,
    acoes: 0,
    inspecoes: 0,
    custo: 0,
    evidencias: 0,
  };
  map.set(sector, {
    sector,
    score: current.score + (payload.score || 0),
    riscos: current.riscos + (payload.riscos || 0),
    acoes: current.acoes + (payload.acoes || 0),
    inspecoes: current.inspecoes + (payload.inspecoes || 0),
    custo: current.custo + (payload.custo || 0),
    evidencias: current.evidencias + (payload.evidencias || 0),
  });
}

export function computeDashboardMetrics(input: DashboardMetricsInput): DashboardMetrics {
  const riskMap = new Map<string, RiskLike>();
  const inspectionMap = new Map<string, InspectionLike>();

  input.riscos.forEach((risk) => {
    if (risk?.id) riskMap.set(String(risk.id), risk);
  });

  input.inspecoes.forEach((inspection) => {
    if (inspection?.id) inspectionMap.set(String(inspection.id), inspection);
  });

  const activeRisks = input.riscos.filter((risk) => !isRiskClosed(risk.status));
  const activeActions = input.acoes.filter((action) => !isActionClosed(action.status));
  const overdueActions = activeActions.filter((action) => isOverdue(action.prazo || action.quando || action.due_date));
  const overdueInspections = input.inspecoes.filter(
    (inspection) => !isInspectionClosed(inspection.status || inspection.situacao) && isOverdue(inspection.data || inspection.proximaInspecao)
  );

  const criticalActionsWithoutEvidence = activeActions.filter(
    (action) => actionRequiresEvidence(action) && getActionEvidenceCount(action) === 0
  );
  const activeRisksWithoutEvidence = activeRisks.filter((risk) => !hasRiskEvidence(risk));

  const openRiskFines = activeRisks.reduce((total, risk) => total + Number(risk.multaEstimada || 0), 0);
  const openActionCosts = activeActions.reduce((total, action) => total + getActionCost(action), 0);
  const exposureTotal = openRiskFines + openActionCosts;

  const ownerMap = new Map<string, DashboardOwnerSummary>();
  const sectorMap = new Map<string, DashboardSectorSummary>();
  const nrMap = new Map<string, DashboardNrSummary>();
  const currentProblems: DashboardCurrentProblem[] = [];

  activeRisks.forEach((risk) => {
    const sector = getRiskSector(risk);
    const owner = getRiskOwner(risk);
    const nr = getRiskNr(risk);
    const severity = getRiskSeverityWeight(risk);
    const fine = Number(risk.multaEstimada || 0);
    const missingEvidence = hasRiskEvidence(risk) ? 0 : 1;

    incrementOwner(ownerMap, owner, { pendencias: 1, riscos: 1, custo: fine });
    incrementSector(sectorMap, sector, { score: severity * 3, riscos: 1, custo: fine, evidencias: missingEvidence });

    const nrCurrent = nrMap.get(nr) || { nr, score: 0, riscos: 0, multas: 0 };
    nrMap.set(nr, {
      nr,
      score: nrCurrent.score + severity * 3,
      riscos: nrCurrent.riscos + 1,
      multas: nrCurrent.multas + fine,
    });

    currentProblems.push({
      id: `risk-${risk.id}`,
      type: 'Risco',
      title: getRiskName(risk),
      sector,
      owner,
      nr,
      detail: firstMeaningful(risk.origem, risk.acaoVinculada, risk.descricao, 'Risco aberto sem tratamento concluido.'),
      cost: fine,
      severity,
    });
  });

  activeActions.forEach((action) => {
    const linkedRisk = action.riscoId ? riskMap.get(String(action.riscoId)) : undefined;
    const linkedInspection = action.inspecaoId ? inspectionMap.get(String(action.inspecaoId)) : undefined;
    const sector = getActionSector(action, linkedRisk, linkedInspection);
    const owner = getActionOwner(action);
    const cost = getActionCost(action);
    const overdue = isOverdue(action.prazo || action.quando || action.due_date);
    const severity = overdue ? 4 : actionRequiresEvidence(action) ? 3 : 2;
    const missingEvidence = actionRequiresEvidence(action) && getActionEvidenceCount(action) === 0 ? 1 : 0;
    const nr = getActionNr(action, linkedRisk, linkedInspection);

    incrementOwner(ownerMap, owner, { pendencias: 1, acoes: 1, custo: cost });
    incrementSector(sectorMap, sector, {
      score: overdue ? 4 : 2,
      acoes: 1,
      custo: cost,
      evidencias: missingEvidence,
    });

    if (nr && nr !== 'NR nao vinculada') {
      const nrCurrent = nrMap.get(nr) || { nr, score: 0, riscos: 0, multas: 0 };
      nrMap.set(nr, {
        nr,
        score: nrCurrent.score + (overdue ? 2 : 1),
        riscos: nrCurrent.riscos,
        multas: nrCurrent.multas,
      });
    }

    if (overdue || missingEvidence) {
      currentProblems.push({
        id: `action-${action.id}`,
        type: 'Acao',
        title: getActionName(action),
        sector,
        owner,
        nr,
        detail: overdue
          ? `Prazo vencido em ${firstMeaningful(action.prazo, action.quando, action.due_date, 'data nao informada')}.`
          : 'Acao critica ainda sem evidencia registrada.',
        cost,
        severity,
      });
    }
  });

  input.inspecoes.forEach((inspection) => {
    const issueCount = getInspectionIssueCount(inspection);
    const overdue = !isInspectionClosed(inspection.status || inspection.situacao) && isOverdue(inspection.data || inspection.proximaInspecao);
    if (!issueCount && !overdue) return;

    const sector = getInspectionSector(inspection);
    const owner = getInspectionOwner(inspection);
    const severity = overdue ? 3 : Math.min(4, Math.max(2, issueCount));

    incrementOwner(ownerMap, owner, { pendencias: 1, inspecoes: 1 });
    incrementSector(sectorMap, sector, { score: overdue ? 3 : issueCount * 2, inspecoes: 1 });

    currentProblems.push({
      id: `inspection-${inspection.id}`,
      type: 'Inspecao',
      title: getInspectionName(inspection),
      sector,
      owner,
      nr: firstMeaningful(inspection.nr, inspection.nrRelacionada),
      detail: overdue ? 'Inspecao vencida e ainda nao concluida.' : `${issueCount} item(ns) nao conforme(s) identificado(s).`,
      cost: 0,
      severity,
    });
  });

  const owners = Array.from(ownerMap.values()).sort((a, b) => {
    if (b.pendencias !== a.pendencias) return b.pendencias - a.pendencias;
    return b.custo - a.custo;
  });

  const sectors = Array.from(sectorMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.custo - a.custo;
  });

  const contextsMap = new Map<string, DashboardContextSummary>();
  (input.operationalItems || []).forEach((item) => {
    const contextId = item.contextId || 'base_sst';
    const current = contextsMap.get(contextId) || {
      contextId,
      items: 0,
      criticalItems: 0,
      overdueItems: 0,
      evidenceGaps: 0,
    };
    contextsMap.set(contextId, {
      contextId,
      items: current.items + 1,
      criticalItems: current.criticalItems + (item.priority === 'critica' ? 1 : 0),
      overdueItems: current.overdueItems + (item.status === 'vencido' ? 1 : 0),
      evidenceGaps: current.evidenceGaps + (item.evidencePlan.required && item.evidenceIds.length === 0 ? 1 : 0),
    });
  });

  const nrs = Array.from(nrMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.multas - a.multas;
  });

  currentProblems.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return b.cost - a.cost;
  });

  const criticalItems = (input.operationalItems || []).filter((item) => item.priority === 'critica').length;
  const itemsWithoutResponsible = (input.operationalItems || []).filter((item) => !item.responsible?.trim()).length;
  const itemsWithoutEvidence = (input.operationalItems || []).filter(
    (item) => item.evidencePlan.required && item.evidenceIds.length === 0
  ).length;

  return {
    activeRisks,
    activeActions,
    overdueActions,
    overdueInspections,
    criticalActionsWithoutEvidence,
    activeRisksWithoutEvidence,
    criticalItems,
    itemsWithoutResponsible,
    itemsWithoutEvidence,
    openRiskFines,
    openActionCosts,
    exposureTotal,
    evidenceGapTotal: criticalActionsWithoutEvidence.length + activeRisksWithoutEvidence.length,
    currentProblems,
    owners,
    sectors,
    contexts: Array.from(contextsMap.values()).sort((a, b) => b.items - a.items),
    nrs,
    worstSector: sectors[0],
    topOwner: owners[0],
    topNr: nrs[0],
  };
}

export const dashboardMetricsEngine = {
  compute: computeDashboardMetrics,
};
