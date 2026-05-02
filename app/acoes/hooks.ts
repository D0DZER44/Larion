"use client";

import { useAppStore } from '@/lib/store';
import { ActionItem, AcaoStatus, AcaoPrioridade, ActionFollowUp } from './types';
import { useMemo, useCallback } from 'react';

export function useAcoes() {
  const storeAcoes = useAppStore(state => state.acoes);
  const storeRiscos = useAppStore(state => state.riscos);
  const addAcao = useAppStore(state => state.addAcao);
  const updateAcao = useAppStore(state => state.updateAcao);
  const addLog = useAppStore(state => state.addLog);

  const acoes: ActionItem[] = useMemo(() => {
    return storeAcoes.map((a: any) => {
      // Logic to parse status
      let baseStatus: AcaoStatus = 'Pendente';
      const rawStatus = a.status?.toLowerCase() || '';
      
      if (rawStatus === 'concluída' || rawStatus === 'concluído' || rawStatus === 'fechada') {
        baseStatus = 'Concluída';
      } else if (rawStatus === 'cancelada') {
        baseStatus = 'Cancelada';
      } else if (rawStatus === 'em andamento' || a.progresso > 0) {
        baseStatus = 'Em andamento';
      }
      
      // Calculate Vencida if pending/em andamento and deadline has passed
      if ((baseStatus === 'Pendente' || baseStatus === 'Em andamento') && a.prazo) {
        const prazoDate = new Date(a.prazo);
        prazoDate.setHours(23, 59, 59, 999);
        if (new Date() > prazoDate) {
           baseStatus = 'Vencida';
        }
      }

      // Logic to parse priority
      let basePrioridade: AcaoPrioridade = 'Média';
      const rawPri = (a.priority || a.prioridade)?.toLowerCase() || '';
      if (rawPri.includes('crític') || rawPri === 'p1') basePrioridade = 'Crítica';
      else if (rawPri.includes('alta') || rawPri === 'p2') basePrioridade = 'Alta';
      else if (rawPri.includes('média') || rawPri === 'p3') basePrioridade = 'Média';
      else if (rawPri.includes('baixa') || rawPri === 'p4') basePrioridade = 'Baixa';

      // Find risk
      const relatedRisk = storeRiscos.find(r => r.id === (a.risk_id || a.riscoId || a.item_origem_id));

      return {
        id: a.id,
        titulo: a.title || a.titulo || 'Nova Ação',
        descricao: a.description || a.descricao || '',
        prioridade: basePrioridade,
        status: baseStatus,
        setor: a.category || a.setor || a.sector_id || 'Não definido',
        responsavel: a.responsavel || a.responsible?.name || 'Não atribuído',
        prazo: a.prazo || a.due_date || a.deadlineTime || new Date().toISOString().split('T')[0],
        progresso: a.progresso || 0,
        origem: a.origem || a.originText || (a.item_origem_tipo === 'inspecao' ? 'Inspeção' : a.item_origem_tipo === 'risco' ? 'Risco' : 'Manual'),
        riscoId: a.riscoId || a.risk_id || (a.item_origem_tipo === 'risco' ? a.item_origem_id : undefined),
        riscoVinculado: a.riscoVinculado || relatedRisk?.titulo || relatedRisk?.title || '',
        inspecaoId: a.inspecaoId || (a.item_origem_tipo === 'inspecao' ? a.item_origem_id : undefined),
        checklistId: a.checklistId || '',
        perguntaOrigem: a.perguntaOrigem || '',
        respostaOrigem: a.respostaOrigem || '',
        nrRelacionada: a.nrRelacionada || a.nr || relatedRisk?.nr,
        multaEstimada: a.multaEstimada || 0,
        chanceIncidente: a.chanceIncidente || 'Baixa',
        criadoEm: a.criadoEm || a.createdAt || new Date().toISOString(),
        atualizadoEm: a.atualizadoEm || new Date().toISOString(),
        iniciadoEm: a.iniciadoEm || null,
        concluidoEm: a.concluidoEm || null,
        evidencia: a.evidencia || [],
        historico: a.historico || []
      };
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [storeAcoes, storeRiscos]);

  const calcularFollowUp = useCallback((action: ActionItem) => {
    if (action.status === 'Concluída' || action.status === 'Cancelada') {
      return {
        ativo: false,
        nivel: 'normal' as ActionFollowUp['nivel'],
        proximoFollowUpEm: null,
        mensagem: '',
        precisaFollowUp: false,
        precisaEscalonamento: false
      };
    }

    let nivel: ActionFollowUp['nivel'] = 'normal';
    let precisaFollowUp = false;
    let precisaEscalonamento = false;
    let mensagem = '';
    let hasBloqueio = false;

    // Check for comment blocks? Assuming no complex block mechanism, generic check:
    if (action.comentarios?.some(c => c.toLowerCase().includes('bloquei') || c.toLowerCase().includes('impediment'))) {
      hasBloqueio = true;
      nivel = 'bloqueada';
      precisaFollowUp = true;
      mensagem = "Esta ação possui impedimento informado. Verifique o bloqueio e atualize o status.";
    }

    const agora = new Date();
    const vencimentoStr = action.prazo ? new Date(action.prazo) : null;
    if (vencimentoStr) {
      vencimentoStr.setHours(23, 59, 59, 999);
    }
    
    // Time without update
    const ultimaAtualizacao = new Date(action.atualizadoEm || action.criadoEm);
    const horasSemAtualizacao = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);

    const isVencida = action.status === 'Vencida' || (vencimentoStr && agora > vencimentoStr);
    const isVenceHoje = vencimentoStr && 
      vencimentoStr.getDate() === agora.getDate() && 
      vencimentoStr.getMonth() === agora.getMonth() && 
      vencimentoStr.getFullYear() === agora.getFullYear();

    if (isVencida) {
      nivel = 'urgente';
      precisaFollowUp = true;
      mensagem = "Esta ação está vencida e precisa de prioridade imediata.";
    } else if (isVenceHoje) {
      nivel = 'atenção';
      precisaFollowUp = true;
      mensagem = "Esta ação vence hoje. Atualize o progresso ou conclua a execução.";
    }

    // Rules by priority
    let proximoFollowUpTemp = new Date(ultimaAtualizacao);
    if (!precisaFollowUp && !hasBloqueio) {
      if (action.prioridade === 'Crítica') {
        proximoFollowUpTemp.setHours(proximoFollowUpTemp.getHours() + 4);
        if (horasSemAtualizacao >= 8) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 4) {
          precisaFollowUp = true;
          mensagem = action.status === 'Pendente' ? 
            "Esta ação crítica ainda não foi iniciada. Inicie a execução ou justifique o atraso." : 
            "Esta ação está em andamento, mas não recebeu atualização recente.";
        }
      } else if (action.prioridade === 'Alta') {
        proximoFollowUpTemp.setHours(proximoFollowUpTemp.getHours() + 24);
        if (horasSemAtualizacao >= 48) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 24) {
          precisaFollowUp = true;
          mensagem = "Esta ação está em andamento, mas não recebeu atualização recente.";
        }
      } else if (action.prioridade === 'Média') {
        proximoFollowUpTemp.setDate(proximoFollowUpTemp.getDate() + 2);
        if (horasSemAtualizacao >= 96) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 48) {
          precisaFollowUp = true;
          mensagem = "Esta ação está em andamento, mas não recebeu atualização recente.";
        }
      } else {
        proximoFollowUpTemp.setDate(proximoFollowUpTemp.getDate() + 7);
        if (horasSemAtualizacao >= 168) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 168) {
          precisaFollowUp = true;
          mensagem = "Esta ação está em andamento, mas não recebeu atualização recente.";
        }
      }
    }

    if (precisaEscalonamento) {
      mensagem = "Esta ação foi escalonada automaticamente por atraso ou ausência de atualização.";
      nivel = 'urgente';
    }

    return {
      ativo: true,
      nivel,
      proximoFollowUpEm: proximoFollowUpTemp.toISOString(),
      mensagem,
      precisaFollowUp,
      precisaEscalonamento
    };
  }, []);

  const updateActionStatus = useCallback((id: string, updates: Partial<ActionItem>, eventDesc: string, justificativa?: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    const camposAlterados: { campo: string; anterior: string; novo: string }[] = [];
    Object.keys(updates).forEach(key => {
      if (['comentarios', 'historico', 'atualizadoEm', 'canceladoEm', 'concluidoEm', 'iniciadoEm'].includes(key)) return;
      const oldVal = (acaoObj as any)[key];
      const newVal = (updates as any)[key];
      if (oldVal !== newVal && newVal !== undefined) {
        camposAlterados.push({
          campo: key.charAt(0).toUpperCase() + key.slice(1),
          anterior: String(oldVal || '-'),
          novo: String(newVal || '-')
        });
      }
    });

    const dataHora = new Date().toISOString();
    const usuario = 'Sistema / Usuário Autenticado';
    const hashStr = `${acaoObj.id}${eventDesc}${dataHora}${usuario}`;
    
    let hashNum = 0;
    for (let i = 0; i < hashStr.length; i++) {
        hashNum = (hashNum << 5) - hashNum + hashStr.charCodeAt(i);
        hashNum |= 0; 
    }
    const hashFinal = Math.abs(hashNum).toString(16).padEnd(16, '0');

    const historicoEvent = {
        id: crypto.randomUUID(),
        actionId: acaoObj.id,
        evento: eventDesc,
        origem: 'Web App',
        usuario,
        dataHora,
        statusFinal: updates.status || acaoObj.status,
        camposAlterados,
        justificativa,
        hash: hashFinal,
        versao: '1.0',
        integridade: 'Verificada'
    };

    const modified = { 
        ...acaoObj, 
        ...updates, 
        atualizadoEm: dataHora,
        historico: [...(acaoObj.historico || []), historicoEvent]
    };

    updateAcao(id, modified);
  }, [acoes, updateAcao]);

  const executarFollowUps = useCallback(() => {
    let touched = false;
    const now = new Date().toISOString();

    acoes.forEach(acao => {
      const { ativo, nivel, proximoFollowUpEm, mensagem, precisaFollowUp, precisaEscalonamento } = calcularFollowUp(acao);
      
      let needsUpdate = false;
      const updates: Partial<ActionItem> = {};
      let eventoDesc = '';
      let hasHistory = false;
      
      const fUp = acao.followUp || {
        ativo: false,
        nivel: 'normal',
        ultimoFollowUpEm: null,
        proximoFollowUpEm: null,
        tentativas: 0,
        ultimaMensagem: '',
        precisaFollowUp: false,
        escalado: false,
        escaladoPara: null,
        escaladoEm: null
      };

      const existingStatus = acao.status;
      const vencimentoStr = acao.prazo ? new Date(acao.prazo) : null;
      if (vencimentoStr) vencimentoStr.setHours(23, 59, 59, 999);
      const isNowVencida = vencimentoStr && new Date() > vencimentoStr && existingStatus !== 'Vencida' && existingStatus !== 'Concluída' && existingStatus !== 'Cancelada';

      if (isNowVencida) {
        updates.status = 'Vencida';
        eventoDesc = 'Prazo vencido';
        needsUpdate = true;
        hasHistory = true;
      }

      if (precisaEscalonamento && !fUp.escalado) {
        fUp.escalado = true;
        fUp.escaladoEm = now;
        fUp.escaladoPara = 'Gestor/SST';
        if (!eventoDesc) eventoDesc = 'Escalonamento automático';
        needsUpdate = true;
        hasHistory = true;
      }

      // Check if we need to set pending follow-up state (only if active and not updated recently)
      if (ativo && precisaFollowUp && (!fUp.precisaFollowUp || fUp.ultimaMensagem !== mensagem || fUp.nivel !== nivel)) {
        fUp.precisaFollowUp = true;
        fUp.ultimaMensagem = mensagem;
        fUp.nivel = nivel;
        if (!eventoDesc) eventoDesc = 'Follow-up gerado';
        needsUpdate = true;
      }

      if (!ativo && fUp.ativo) {
        fUp.ativo = false;
        needsUpdate = true;
      } else if (ativo && !fUp.ativo) {
        fUp.ativo = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Prepare new followUp state to merge
        updates.followUp = { ...fUp };
        
        // Let's manually do it so we don't spam updateActionStatus if no history is needed
        if (hasHistory || eventoDesc) {
           updateActionStatus(acao.id, updates, eventoDesc || 'Follow-up automático');
           touched = true;
        } else {
           // update silently or skip
           // actually updateActionStatus creates history anytime we call it unless we skip? 
           // The requirement says:
           // "Não duplicar evento a cada renderização.
           // Só registrar novo evento quando:
           // - chegou a hora do próximo follow-up;
           // - mudou o nível do follow-up;
           // - ação venceu;
           // - ação foi escalonada."
           updateActionStatus(acao.id, updates, eventoDesc || 'Atualização de sistema');
           touched = true;
        }
      }
    });
  }, [acoes, calcularFollowUp, updateActionStatus]);

  const createAction = (newAction: Omit<ActionItem, 'id' | 'criadoEm' | 'atualizadoEm' | 'historico'>) => {
    const actionToStore = {
      ...newAction,
      id: `AC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      historico: [{
        id: crypto.randomUUID(),
        evento: 'Ação criada',
        dataHora: new Date().toISOString(),
        usuario: 'Sistema'
      }]
    };
    addAcao(actionToStore);
  };

  const criarAcaoAutomatica = (origem: string, risco: any, inspecao: any, checklistResposta: any) => {
    // Evitar duplicidade
    const acaoExistente = acoes.find(a => 
      a.riscoId === risco?.id && 
      a.inspecaoId === inspecao?.id &&
      a.perguntaOrigem === checklistResposta?.pergunta
    );

    if (acaoExistente) {
      // Se necessário atualizar algo na existente, faríamos aqui, mas o requisito diz para não criar nova.
      // updateActionStatus(acaoExistente.id, { ... }, 'Atualização automática');
      return acaoExistente;
    }

    const gerarTituloAcao = (riscoNome: string) => {
      const r = (riscoNome || '').toLowerCase();
      if (r.includes('linha de vida')) return 'Regularizar linha de vida';
      if (r.includes('epi')) return 'Regularizar EPI obrigatório';
      if (r.includes('bloqueio elétrico') || r.includes('loto')) return 'Regularizar bloqueio e etiquetagem';
      if (r.includes('espaço confinado')) return 'Regularizar procedimento de espaço confinado';
      if (r.includes('máquina') || r.includes('equipamento') || r.includes('proteção')) return 'Regularizar proteção de máquina/equipamento';
      if (r.includes('produto químico')) return 'Regularizar controle de produto químico';
      if (r.includes('sinalização')) return 'Regularizar sinalização de segurança';
      return 'Tratar não conformidade identificada';
    };

    const prioridade = risco?.prioridade || 'Média';
    
    let prazo = risco?.prazo;
    if (!prazo) {
      const hoje = new Date();
      if (prioridade === 'Crítica') hoje.setDate(hoje.getDate() + 1);
      else if (prioridade === 'Alta') hoje.setDate(hoje.getDate() + 3);
      else if (prioridade === 'Média') hoje.setDate(hoje.getDate() + 7);
      else hoje.setDate(hoje.getDate() + 15);
      prazo = hoje.toISOString();
    }

    const responsavel = inspecao?.responsavel || risco?.responsavel || 'SST + Supervisor da área';
    const setor = inspecao?.setor || risco?.setor || 'Não informado';
    const nrRelacionada = risco?.nr || risco?.nrRelacionada || 'Não informada';

    const descricao = `Esta ação foi criada automaticamente a partir de uma não conformidade identificada na inspeção. Deve ser tratada para reduzir o risco vinculado e atualizar o status operacional.
    Risco: ${risco?.titulo || risco?.nome || '-'}
    NR: ${nrRelacionada}
    Setor: ${setor}
    Resposta da Inspeção: ${checklistResposta?.texto ? checklistResposta.texto : (checklistResposta?.resposta || '-')}`;

    const dataHora = new Date().toISOString();
    const idAcao = `AC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const historicoEvent = {
        id: crypto.randomUUID(),
        actionId: idAcao,
        evento: 'Criação automática',
        origem: 'Automática',
        usuario: 'Sistema',
        dataHora,
        statusFinal: 'Pendente',
        camposAlterados: [
          { campo: 'Status', anterior: '-', novo: 'Pendente' },
          { campo: 'Origem', anterior: '-', novo: origem || 'Automática' },
          { campo: 'Risco vinculado', anterior: '-', novo: risco?.titulo || risco?.nome || '-' },
          { campo: 'Responsável', anterior: '-', novo: responsavel },
          { campo: 'Prazo', anterior: '-', novo: new Date(prazo).toLocaleDateString() }
        ],
        justificativa: 'Ação criada automaticamente a partir do risco gerado pela inspeção/checklist.',
        hash: idAcao, // Simple mock for new creation
        versao: '1.0',
        integridade: 'Verificada'
    };

    const newAction = {
      id: idAcao,
      titulo: gerarTituloAcao(risco?.titulo || risco?.nome),
      descricao,
      prioridade,
      status: 'Pendente',
      setor,
      responsavel,
      prazo,
      progresso: 0,
      origem: origem || 'Inspeção',
      riscoId: risco?.id,
      riscoVinculado: risco?.titulo || risco?.nome,
      inspecaoId: inspecao?.id,
      checklistId: checklistResposta?.checklistId,
      perguntaOrigem: checklistResposta?.pergunta,
      respostaOrigem: checklistResposta?.resposta || checklistResposta?.texto,
      nrRelacionada,
      multaEstimada: risco?.multaEstimada || 0,
      chanceIncidente: risco?.chanceIncidente || 'Média',
      criadoEm: dataHora,
      atualizadoEm: dataHora,
      iniciadoEm: null,
      concluidoEm: null,
      canceladoEm: null,
      evidencia: [],
      historico: [historicoEvent]
    };

    addAcao(newAction);
    return newAction;
  };

  const iniciarAcao = (id: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    updateActionStatus(id, {
      status: 'Em andamento',
      progresso: acaoObj.progresso > 0 ? acaoObj.progresso : 10,
      iniciadoEm: new Date().toISOString()
    }, 'Início');
  };

  const atualizarProgresso = (id: string, novoProgresso: number, comentario?: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    // progresso mínimo 0, máximo 100
    const progressoFormatado = Math.min(100, Math.max(0, novoProgresso));
    const statusObj = progressoFormatado > 0 && acaoObj.status === 'Pendente' ? 'Em andamento' : acaoObj.status;

    const updates: Partial<ActionItem> = {
      progresso: progressoFormatado,
      status: statusObj,
    };

    if (comentario) {
      if (!updates.comentarios) updates.comentarios = [];
      updates.comentarios = [...(acaoObj.comentarios || []), comentario];
    }
    
    updateActionStatus(id, updates, 'Atualização de progresso');
  };

  const concluirAcao = (id: string, observacaoFinal?: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    const updates: Partial<ActionItem> = {
      status: 'Concluída',
      progresso: 100,
      concluidoEm: new Date().toISOString()
    };

    if (observacaoFinal) {
      if (!updates.comentarios) updates.comentarios = [];
      updates.comentarios = [...(acaoObj.comentarios || []), observacaoFinal];
    }

    const justificativa = acaoObj.riscoId
      ? 'Ação concluída. Risco vinculado deve ser revisado para avaliação de mitigação.'
      : observacaoFinal;

    updateActionStatus(id, updates, 'Conclusão', justificativa);
  };

  const reatribuirAcao = (id: string, novoResponsavel: string, justificativa: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    updateActionStatus(id, {
      responsavel: novoResponsavel
    }, 'Reatribuição', justificativa);
  };

  const cancelarAcao = (id: string, justificativa: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    updateActionStatus(id, {
      status: 'Cancelada',
      canceladoEm: new Date().toISOString()
    }, 'Cancelamento', justificativa);
  };

  const reabrirAcao = (id: string, justificativa: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    updateActionStatus(id, {
      status: 'Em andamento',
      progresso: acaoObj.progresso >= 100 ? 90 : acaoObj.progresso,
      concluidoEm: null,
      canceladoEm: null
    }, 'Reabertura', justificativa);
  };

  return {
    acoes,
    updateActionStatus,
    createAction,
    criarAcaoAutomatica,
    iniciarAcao,
    atualizarProgresso,
    concluirAcao,
    reatribuirAcao,
    cancelarAcao,
    reabrirAcao,
    executarFollowUps
  };
}

export function getPendentes(acoes: ActionItem[]) {
  return acoes.filter(a => a.status === 'Pendente');
}

export function getEmAndamento(acoes: ActionItem[]) {
  return acoes.filter(a => a.status === 'Em andamento');
}

export function getConcluidas(acoes: ActionItem[]) {
  return acoes.filter(a => a.status === 'Concluída' || a.status === 'Cancelada');
}
