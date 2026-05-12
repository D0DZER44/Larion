import { normalizeActionDraft, validateActionDraft } from '@/lib/action-rules';
import { evidenceEngine } from '@/src/lib/engines/evidenceEngine';
import type { Evidence } from '@/src/types/evidence';
import type { OperationalItem, OperationalItemStatus } from '@/src/types/operationalItem';

type GenericRecord = Record<string, any>;

export interface ActionFollowUpEvaluation {
  ativo: boolean;
  nivel: 'normal' | 'atenção' | 'urgente' | 'bloqueada';
  proximoFollowUpEm: string | null;
  mensagem: string;
  precisaFollowUp: boolean;
  precisaEscalonamento: boolean;
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function mapPriority(rawPriority: string | undefined) {
  const normalized = normalizeText(rawPriority);
  if (normalized.includes('crit') || normalized === 'p1') return 'Crítica';
  if (normalized.includes('alta') || normalized === 'p2') return 'Alta';
  if (normalized.includes('media') || normalized.includes('média') || normalized === 'p3') return 'Média';
  return 'Baixa';
}

function mapStatus(rawAction: GenericRecord) {
  let baseStatus = 'Pendente';
  const rawStatus = typeof rawAction.status === 'string' ? normalizeText(rawAction.status) : '';

  if (rawStatus === 'concluida' || rawStatus === 'concluido' || rawStatus === 'fechada') {
    baseStatus = 'Concluída';
  } else if (rawStatus === 'cancelada') {
    baseStatus = 'Cancelada';
  } else if (rawStatus === 'em andamento' || rawStatus === 'em_andamento' || Number(rawAction.progresso) > 0) {
    baseStatus = 'Em andamento';
  }

  const prazoStr = rawAction.prazo || rawAction.due_date || rawAction.deadlineTime;
  if ((baseStatus === 'Pendente' || baseStatus === 'Em andamento') && prazoStr) {
    const prazoDate = new Date(prazoStr);
    prazoDate.setHours(23, 59, 59, 999);
    if (new Date() > prazoDate) {
      baseStatus = 'Vencida';
    }
  }

  return baseStatus;
}

function mapActionStatusToOperationalStatus(status: string, faseExecucao?: string): OperationalItemStatus {
  const normalizedStatus = normalizeText(status);
  const normalizedPhase = normalizeText(faseExecucao);

  if (normalizedPhase.includes('aguardando valid')) return 'em_validacao';
  if (normalizedPhase.includes('aguardando evid')) return 'awaitingEvidence';
  if (normalizedStatus.includes('conclu')) return 'completed';
  if (normalizedStatus.includes('cancel')) return 'cancelled';
  if (normalizedStatus.includes('venc')) return 'vencido';
  if (normalizedStatus.includes('andamento')) return 'inProgress';
  return 'a_fazer';
}

function mapTargetStatus(targetStatus: string): OperationalItemStatus {
  const normalized = normalizeText(targetStatus);
  if (normalized.includes('conclu')) return 'completed';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('valid')) return 'em_validacao';
  if (normalized.includes('andamento')) return 'inProgress';
  if (normalized.includes('venc')) return 'vencido';
  return 'a_fazer';
}

function mapActionEvidenceToEngineEvidence(action: GenericRecord, evidencePayloads: GenericRecord[] = []): Evidence[] {
  const baseEvidences = Array.isArray(action.evidencia) ? action.evidencia : [];
  const merged = [...baseEvidences, ...evidencePayloads];

  return merged.map((evidence, index) => ({
    id: evidence.id || `${action.id}-evidence-${index + 1}`,
    itemId: action.id,
    type: normalizeText(evidence.tipo).includes('foto')
      ? 'foto'
      : normalizeText(evidence.tipo).includes('assin')
        ? 'assinatura'
        : 'arquivo',
    description: evidence.descricao || evidence.description || `Evidencia ${index + 1}`,
    url: evidence.url,
    createdBy: evidence.enviadoPor || evidence.createdBy || 'legacy-action',
    createdAt: evidence.dataUpload || evidence.createdAt || new Date().toISOString(),
    validationStatus: evidence.validationStatus || 'aprovada',
    history: evidence.history || [],
  }));
}

function buildOperationalItemFromAction(action: GenericRecord): OperationalItem {
  const priority = mapPriority(action.prioridade || action.priority);

  return {
    id: action.id,
    title: action.titulo || action.title || action.oQue || 'Acao operacional',
    description: action.descricao || action.description,
    kind: priority === 'Crítica' ? 'criticalDeviation' : 'improvement',
    priority:
      priority === 'Crítica' ? 'critica' : priority === 'Alta' ? 'alta' : priority === 'Média' ? 'media' : 'baixa',
    status: mapActionStatusToOperationalStatus(action.status, action.faseExecucao),
    sector: action.setor,
    nrIds: action.nrRelacionada ? [action.nrRelacionada] : [],
    primaryNr: action.nrRelacionada,
    primaryRuleId: action.regraId,
    sourceLinks: [
      {
        type: action.inspecaoId ? 'inspection' : 'manual',
        id: action.id,
        label: action.titulo || action.title,
      },
    ],
    ruleLinks: [],
    blocking: priority === 'Crítica',
    responsible: action.responsavel,
    dueAt: action.prazo,
    evidencePlan: {
      required: Boolean(action.exigeEvidencia) || priority === 'Crítica' || priority === 'Alta',
      minimumCount: 1,
      acceptedKinds: ['foto', 'arquivo', 'observacao', 'registro'],
      blockingForCompletion: true,
      rationale: ['Compatibilidade de workflow de acoes.'],
    },
    evidenceRequired: Boolean(action.exigeEvidencia) || priority === 'Crítica' || priority === 'Alta',
    evidenceIds: (Array.isArray(action.evidencia) ? action.evidencia : []).map((e: GenericRecord) => e.id).filter(Boolean),
    recommendedActions: [],
    history: [],
    createdAt: action.criadoEm || new Date().toISOString(),
    updatedAt: action.atualizadoEm || action.criadoEm || new Date().toISOString(),
  };
}

export function normalizeLegacyActionForView(action: GenericRecord, linkedRisk?: GenericRecord) {
  const normalized = normalizeActionDraft({
    id: action.id,
    titulo: action.title || action.titulo || '',
    descricao: action.description || action.descricao || '',
    prioridade: mapPriority(action.priority || action.prioridade),
    status: mapStatus(action),
    setor: action.category || action.setor || action.sector_id || '',
    responsavel: action.responsavel || action.responsible?.name || '',
    prazo:
      (typeof action.prazo === 'string' ? action.prazo : null) ||
      (typeof action.due_date === 'string' ? action.due_date : null) ||
      (typeof action.deadlineTime === 'string' ? action.deadlineTime : null) ||
      '',
    progresso: action.progresso || 0,
    origem:
      action.origem ||
      action.originText ||
      (action.item_origem_tipo === 'inspecao' ? 'Inspeção' : action.item_origem_tipo === 'risco' ? 'Risco' : 'Manual'),
    riscoId: action.riscoId || action.risk_id || (action.item_origem_tipo === 'risco' ? action.item_origem_id : undefined),
    riscoVinculado: action.riscoVinculado || linkedRisk?.titulo || linkedRisk?.title || '',
    inspecaoId: action.inspecaoId || (action.item_origem_tipo === 'inspecao' ? action.item_origem_id : undefined),
    checklistId: action.checklistId || '',
    perguntaOrigem: action.perguntaOrigem || '',
    respostaOrigem: action.respostaOrigem || '',
    nrRelacionada: action.nrRelacionada || action.nr || linkedRisk?.nr,
    pacote: action.pacote || linkedRisk?.pacote || linkedRisk?.package || 'Base SST',
    multaEstimada: action.multaEstimada || 0,
    chanceIncidente: action.chanceIncidente || 'Baixa',
    criadoEm: action.criadoEm || action.createdAt || new Date().toISOString(),
    atualizadoEm: action.atualizadoEm || new Date().toISOString(),
    iniciadoEm: action.iniciadoEm || null,
    concluidoEm: action.concluidoEm || null,
    oQue: action.oQue,
    porQue: action.porQue,
    onde: action.onde,
    quem: action.quem,
    quando: action.quando,
    como: action.como,
    quantoCusta: action.quantoCusta ?? action.valorEstimado,
    exigeEvidencia: action.exigeEvidencia,
    evidencia: action.evidencia || [],
    historico: action.historico || [],
    faseExecucao: action.faseExecucao,
    followUp: action.followUp,
    comentarios: action.comentarios || [],
    validacao: action.validacao,
  });

  return normalized;
}

export function evaluateActionFollowUp(action: GenericRecord): ActionFollowUpEvaluation {
  if (action.status === 'Concluída' || action.status === 'Cancelada') {
    return {
      ativo: false,
      nivel: 'normal',
      proximoFollowUpEm: null,
      mensagem: '',
      precisaFollowUp: false,
      precisaEscalonamento: false,
    };
  }

  let nivel: ActionFollowUpEvaluation['nivel'] = 'normal';
  let precisaFollowUp = false;
  let precisaEscalonamento = false;
  let mensagem = '';
  let hasBloqueio = false;

  if (action.comentarios?.some((comment: string) => normalizeText(comment).includes('bloquei') || normalizeText(comment).includes('impediment'))) {
    hasBloqueio = true;
    nivel = 'bloqueada';
    precisaFollowUp = true;
    mensagem = 'Esta ação possui impedimento informado. Verifique o bloqueio e atualize o status.';
  }

  const agora = new Date();
  const vencimento = action.prazo ? new Date(action.prazo) : null;
  if (vencimento) vencimento.setHours(23, 59, 59, 999);

  const ultimaAtualizacao = new Date(action.atualizadoEm || action.criadoEm);
  const horasSemAtualizacao = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);
  const isVencida = action.status === 'Vencida' || (vencimento && agora > vencimento);
  const isVenceHoje =
    vencimento &&
    vencimento.getDate() === agora.getDate() &&
    vencimento.getMonth() === agora.getMonth() &&
    vencimento.getFullYear() === agora.getFullYear();

  if (isVencida) {
    nivel = 'urgente';
    precisaFollowUp = true;
    mensagem = 'Esta ação está vencida e precisa de prioridade imediata.';
  } else if (isVenceHoje) {
    nivel = 'atenção';
    precisaFollowUp = true;
    mensagem = 'Esta ação vence hoje. Atualize o progresso ou conclua a execução.';
  }

  const nextFollowUp = new Date(ultimaAtualizacao);
  if (!precisaFollowUp && !hasBloqueio) {
    if (action.prioridade === 'Crítica') {
      nextFollowUp.setHours(nextFollowUp.getHours() + 4);
      if (horasSemAtualizacao >= 8) precisaEscalonamento = true;
      if (horasSemAtualizacao >= 4) {
        precisaFollowUp = true;
        mensagem =
          action.status === 'Pendente'
            ? 'Esta ação crítica ainda não foi iniciada. Inicie a execução ou justifique o atraso.'
            : 'Esta ação está em andamento, mas não recebeu atualização recente.';
      }
    } else if (action.prioridade === 'Alta') {
      nextFollowUp.setHours(nextFollowUp.getHours() + 24);
      if (horasSemAtualizacao >= 48) precisaEscalonamento = true;
      if (horasSemAtualizacao >= 24) {
        precisaFollowUp = true;
        mensagem = 'Esta ação está em andamento, mas não recebeu atualização recente.';
      }
    } else if (action.prioridade === 'Média') {
      nextFollowUp.setDate(nextFollowUp.getDate() + 2);
      if (horasSemAtualizacao >= 96) precisaEscalonamento = true;
      if (horasSemAtualizacao >= 48) {
        precisaFollowUp = true;
        mensagem = 'Esta ação está em andamento, mas não recebeu atualização recente.';
      }
    } else {
      nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      if (horasSemAtualizacao >= 168) precisaEscalonamento = true;
      if (horasSemAtualizacao >= 168) {
        precisaFollowUp = true;
        mensagem = 'Esta ação está em andamento, mas não recebeu atualização recente.';
      }
    }
  }

  if (precisaEscalonamento) {
    mensagem = 'Esta ação foi escalonada automaticamente por atraso ou ausência de atualização.';
    nivel = 'urgente';
  }

  return {
    ativo: true,
    nivel,
    proximoFollowUpEm: nextFollowUp.toISOString(),
    mensagem,
    precisaFollowUp,
    precisaEscalonamento,
  };
}

export function validateActionWorkflowTransition(input: {
  action: GenericRecord;
  targetStatus: string;
  justification?: string;
  evidencePayloads?: GenericRecord[];
}) {
  const item = buildOperationalItemFromAction(input.action);
  const evidences = mapActionEvidenceToEngineEvidence(input.action, input.evidencePayloads);
  return evidenceEngine.validateTransition({
    item,
    evidences,
    targetStatus: mapTargetStatus(input.targetStatus),
    justification: input.justification,
  });
}

export function deriveRiskStatusFromActions(actions: GenericRecord[]) {
  const criticalActions = actions.filter((action) => ['Crítica', 'Alta'].includes(action.prioridade));
  const relevantActions = criticalActions.length > 0 ? criticalActions : actions;
  const allValidated = relevantActions.every(
    (action) => action.faseExecucao === 'Validada' || action.status === 'Cancelada'
  );
  const allCompleted = relevantActions.every((action) => ['Concluída', 'Cancelada'].includes(action.status));

  if (allValidated && allCompleted) {
    return {
      status: 'Mitigado',
      justification: 'Risco mitigado automaticamente pois todas as ações relevantes foram validadas.',
    };
  }

  if (relevantActions.some((action) => action.faseExecucao === 'Aguardando Validação' || action.status === 'Concluída')) {
    return {
      status: 'Em análise',
      justification: 'Aguardando validação de ações pendentes.',
    };
  }

  return {
    status: 'Aberto',
    justification: 'Risco reaberto ou em andamento.',
  };
}

function buildSuggestedActionFromQuestion(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes('linha de vida')) return 'Regularizar linha de vida';
  if (normalized.includes('epi')) return 'Regularizar EPI obrigatório';
  if (normalized.includes('bloqueio eletrico')) return 'Regularizar bloqueio e etiquetagem';
  if (normalized.includes('espaco confinado')) return 'Regularizar procedimento de espaço confinado';
  if (normalized.includes('maquina') || normalized.includes('protecao')) return 'Regularizar proteção de máquina/equipamento';
  if (normalized.includes('quimico')) return 'Regularizar controle de produto químico';
  if (normalized.includes('sinalizacao')) return 'Regularizar sinalização de segurança';
  return 'Tratar não conformidade identificada';
}

export function buildAutomaticActionDraft(input: {
  origem: string;
  risco?: GenericRecord;
  inspecao?: GenericRecord;
  checklistResposta?: GenericRecord;
  existingActions?: GenericRecord[];
}) {
  const existingAction = (input.existingActions || []).find(
    (action) =>
      action.riscoId === input.risco?.id &&
      action.inspecaoId === input.inspecao?.id &&
      action.perguntaOrigem === input.checklistResposta?.pergunta
  );

  if (existingAction) {
    return {
      duplicated: true,
      action: existingAction,
      warnings: ['Acao automatica ja existia para este risco e pergunta de origem.'],
    };
  }

  const priority = input.risco?.prioridade || 'Média';
  let prazo = input.risco?.prazo;
  if (!prazo) {
    const hoje = new Date();
    if (priority === 'Crítica') hoje.setDate(hoje.getDate() + 1);
    else if (priority === 'Alta') hoje.setDate(hoje.getDate() + 3);
    else if (priority === 'Média') hoje.setDate(hoje.getDate() + 7);
    else hoje.setDate(hoje.getDate() + 15);
    prazo = hoje.toISOString();
  }

  const responsavel = input.inspecao?.responsavel || input.risco?.responsavel || 'SST + Supervisor da área';
  const setor = input.inspecao?.setor || input.risco?.setor || '';
  const nrRelacionada = input.risco?.nr || input.risco?.nrRelacionada || '';
  const titulo = buildSuggestedActionFromQuestion(input.risco?.titulo || input.risco?.nome || input.checklistResposta?.pergunta || '');
  const descricao = `Esta ação foi criada automaticamente a partir de uma não conformidade identificada na inspeção. Deve ser tratada para reduzir o risco vinculado e atualizar o status operacional.
Risco: ${input.risco?.titulo || input.risco?.nome || '-'}
NR: ${nrRelacionada}
Setor: ${setor}
Resposta da Inspeção: ${input.checklistResposta?.texto ? input.checklistResposta.texto : input.checklistResposta?.resposta || '-'}`;

  const draft = normalizeActionDraft({
    id: `AC-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
    titulo,
    descricao,
    oQue: titulo,
    porQue: input.risco?.titulo || input.risco?.nome
      ? `Reduzir o risco identificado: ${input.risco?.titulo || input.risco?.nome}`
      : 'Eliminar a nao conformidade identificada na inspecao.',
    onde: setor,
    quem: responsavel,
    quando: typeof prazo === 'string' ? prazo : new Date(prazo).toISOString().split('T')[0],
    como:
      input.checklistResposta?.acaoSugerida ||
      input.risco?.acaoVinculada ||
      'Executar a correcao, testar o controle implantado e registrar a evidencia final.',
    quantoCusta: input.risco?.multaEstimada || undefined,
    prioridade: priority,
    status: 'Pendente',
    setor,
    responsavel,
    prazo,
    progresso: 0,
    origem: input.origem || 'Inspeção',
    riscoId: input.risco?.id,
    riscoVinculado: input.risco?.titulo || input.risco?.nome,
    inspecaoId: input.inspecao?.id,
    checklistId: input.checklistResposta?.checklistId,
    perguntaOrigem: input.checklistResposta?.pergunta,
    respostaOrigem: input.checklistResposta?.resposta || input.checklistResposta?.texto,
    nrRelacionada,
    multaEstimada: input.risco?.multaEstimada || 0,
    chanceIncidente: input.risco?.chanceIncidente || 'Média',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    iniciadoEm: null,
    concluidoEm: null,
    canceladoEm: null,
    exigeEvidencia: priority === 'Crítica',
    evidencia: [],
    historico: [],
  });

  return {
    duplicated: false,
    action: draft,
    warnings: validateActionDraft(draft),
  };
}

export const actionWorkflowEngine = {
  normalize: normalizeLegacyActionForView,
  evaluateFollowUp: evaluateActionFollowUp,
  validateTransition: validateActionWorkflowTransition,
  deriveRiskStatusFromActions,
  buildAutomaticActionDraft,
};
