import type { Evidence } from '../../types/evidence';
import type { OperationalItem, OperationalItemStatus } from '../../types/operationalItem';

export interface LegacyRiskOutput {
  id: string;
  titulo: string;
  descricao?: string;
  setor: string;
  atividade?: string;
  nr: string;
  origem: string;
  severidade?: string;
  prioridade: string;
  status: string;
  prazo?: string;
  responsavel?: string;
  evidencias?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface LegacyActionOutput {
  id: string;
  titulo: string;
  descricao?: string;
  setor?: string;
  origem: string;
  prioridade: string;
  status: string;
  prazo?: string;
  responsavel?: string;
  exigeEvidencia?: boolean;
  evidencia: Array<{
    id: string;
    url?: string;
    tipo: string;
    descricao: string;
    dataUpload: string;
    enviadoPor: string;
  }>;
  riscoId?: string;
  inspecaoId?: string;
  nrRelacionada?: string;
  regraId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

function mapStatusToLegacy(item: OperationalItem, model: 'risk' | 'action'): string {
  const status = item.status as OperationalItemStatus;

  switch (status) {
    case 'triaged':
      return model === 'risk' ? 'Em análise' : 'Pendente';
    case 'a_fazer':
    case 'ready':
      return 'Pendente';
    case 'inProgress':
      return model === 'risk' ? 'Em mitigação' : 'Em andamento';
    case 'awaitingEvidence':
      return 'Aguardando Evidência';
    case 'em_validacao':
      return model === 'risk' ? 'Mitigado' : 'Aguardando Validação';
    case 'vencido':
      return 'Vencida';
    case 'completed':
      return model === 'risk' ? 'Resolvido' : 'Concluída';
    case 'cancelled':
      return 'Cancelada';
    case 'draft':
    default:
      return model === 'risk' ? 'Aberto' : 'Em aberto';
  }
}

function mapPriorityToLegacy(priority: OperationalItem['priority']): string {
  switch (priority) {
    case 'critica':
      return 'Crítica';
    case 'alta':
      return 'Alta';
    case 'media':
      return 'Média';
    case 'baixa':
    default:
      return 'Baixa';
  }
}

function mapSourceToLegacy(item: OperationalItem): string {
  const source = item.sourceLinks[0]?.type;

  switch (source) {
    case 'inspection':
      return 'Inspeção';
    case 'checklist':
      return 'Checklist';
    case 'rule':
      return 'Regra';
    case 'fieldInput':
      return 'Campo';
    case 'legacy':
    case 'manual':
    default:
      return 'Manual';
  }
}

function mapEvidenceType(type: Evidence['type']): string {
  switch (type) {
    case 'foto':
      return 'Foto';
    case 'assinatura':
      return 'Assinatura';
    case 'observacao':
      return 'Observação';
    case 'registro':
      return 'Registro';
    case 'checklist':
      return 'Checklist';
    case 'arquivo':
    default:
      return 'Documento';
  }
}

export function operationalItemToLegacyRisk(item: OperationalItem): LegacyRiskOutput {
  return {
    id: item.sourceLinks[0]?.id || item.id,
    titulo: item.title,
    descricao: item.description,
    setor: item.sector || 'Nao informado',
    atividade: item.activityId,
    nr: item.primaryNr || item.nrIds[0] || 'Nao informado',
    origem: mapSourceToLegacy(item),
    severidade: item.priority,
    prioridade: mapPriorityToLegacy(item.priority),
    status: mapStatusToLegacy(item, 'risk'),
    prazo: item.dueAt,
    responsavel: item.responsible,
    evidencias: item.evidenceIds.join(', '),
    criadoEm: item.createdAt,
    atualizadoEm: item.updatedAt,
  };
}

export function operationalItemToLegacyAction(
  item: OperationalItem,
  evidences: Evidence[] = []
): LegacyActionOutput {
  return {
    id: item.sourceLinks[0]?.id || item.id,
    titulo: item.title,
    descricao: item.description,
    setor: item.sector,
    origem: mapSourceToLegacy(item),
    prioridade: mapPriorityToLegacy(item.priority),
    status: mapStatusToLegacy(item, 'action'),
    prazo: item.dueAt,
    responsavel: item.responsible,
    exigeEvidencia: item.evidencePlan.required,
    evidencia: evidences.map((evidence) => ({
      id: evidence.id,
      url: evidence.url,
      tipo: mapEvidenceType(evidence.type),
      descricao: evidence.description,
      dataUpload: evidence.createdAt,
      enviadoPor: evidence.createdBy,
    })),
    riscoId: item.legacyReferences?.[0]?.riskId,
    inspecaoId: item.legacyReferences?.[0]?.inspectionId,
    nrRelacionada: item.primaryNr,
    regraId: item.primaryRuleId,
    criadoEm: item.createdAt,
    atualizadoEm: item.updatedAt,
  };
}
