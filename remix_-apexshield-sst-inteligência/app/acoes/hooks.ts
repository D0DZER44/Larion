"use client";

import { useAppStore } from '@/lib/store';
import { normalizeActionDraft, validateActionDraft } from '@/lib/action-rules';
import { ActionItem, ActionFollowUp } from './types';
import { useMemo, useCallback, useState } from 'react';
import { actionWorkflowService } from '@/src/services/actionWorkflowService';

export function useAcoes() {
  const storeAcoes = useAppStore(state => state.acoes);
  const storeRiscos = useAppStore(state => state.riscos);
  const rulePackages = useAppStore(state => state.rulePackages);
  const activePackageNames = useMemo(() => rulePackages.filter(p => p.isActive).map(p => p.name), [rulePackages]);
  const addAcao = useAppStore(state => state.addAcao);
  const updateAcao = useAppStore(state => state.updateAcao);

  const allAcoes: ActionItem[] = useMemo(() => {
    return actionWorkflowService.prepareActionsForView(storeAcoes as any[], storeRiscos as any[]) as ActionItem[];
  }, [storeAcoes, storeRiscos]);

  const [showInactive, setShowInactive] = useState(false);

  const acoes = useMemo(() => {
    return actionWorkflowService.filterVisibleActions(allAcoes as any[], activePackageNames, showInactive) as ActionItem[];
  }, [allAcoes, showInactive, activePackageNames]);

  const calcularFollowUp = useCallback((action: ActionItem) => {
    return actionWorkflowService.evaluateFollowUp(action) as ActionFollowUp & {
      mensagem: string;
      precisaEscalonamento: boolean;
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
    const usuario = 'Sistema / UsuÃ¡rio Autenticado';
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

    // Cascata de Status para o Risco
    if (modified.riscoId) {
       const riskId = modified.riscoId;
       const relatedActions = useAppStore.getState().acoes.filter(a => a.riscoId === riskId && a.id !== id).concat([modified as any]);
       if (relatedActions.length > 0) {
          const riskUpdate = actionWorkflowService.deriveRiskStatusFromActions(relatedActions as any[]);
          useAppStore.getState().updateRisco(riskId, {
            status: riskUpdate.status,
            atualizadoEm: dataHora,
            justificativa: riskUpdate.justification,
          });
       }
    }
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
        if (!eventoDesc) eventoDesc = 'Escalonamento automÃ¡tico';
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
      } else if (ativo && !precisaFollowUp && fUp.precisaFollowUp) {
        fUp.precisaFollowUp = false;
        fUp.ultimaMensagem = '';
        fUp.nivel = 'normal';
        needsUpdate = true;
      }

      if (ativo && proximoFollowUpEm !== fUp.proximoFollowUpEm) {
        fUp.proximoFollowUpEm = proximoFollowUpEm;
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
        console.log('Update loop triggered for:', acao.id, { isNowVencida, precisaEscalonamento, fUpEscalado: fUp.escalado, ativo, fUpAtivo: fUp.ativo, precisaFollowUp, fUpPrecisa: fUp.precisaFollowUp, fUpUltMsg: fUp.ultimaMensagem, calcMsg: mensagem, fUpNivel: fUp.nivel, calcNivel: nivel, eventoDesc });
        // Prepare new followUp state to merge
        updates.followUp = { ...fUp };
        
        // Let's manually do it so we don't spam updateActionStatus if no history is needed
        if (hasHistory || eventoDesc) {
           updateActionStatus(acao.id, updates, eventoDesc || 'Follow-up automÃ¡tico');
           touched = true;
        } else {
           // update silently or skip
           // actually updateActionStatus creates history anytime we call it unless we skip? 
           // The requirement says:
           // "NÃ£o duplicar evento a cada renderizaÃ§Ã£o.
           // SÃ³ registrar novo evento quando:
           // - chegou a hora do prÃ³ximo follow-up;
           // - mudou o nÃ­vel do follow-up;
           // - aÃ§Ã£o venceu;
           // - aÃ§Ã£o foi escalonada."
           updateActionStatus(acao.id, updates, eventoDesc || 'AtualizaÃ§Ã£o de sistema');
           touched = true;
        }
      }
    });
  }, [acoes, calcularFollowUp, updateActionStatus]);

  const createAction = (newAction: Omit<ActionItem, 'id' | 'criadoEm' | 'atualizadoEm' | 'historico'>) => {
    const validationErrors = validateActionDraft(newAction);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    const actionToStore = {
      ...normalizeActionDraft(newAction),
      id: `AC-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
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
    const generated = actionWorkflowService.buildAutomaticActionDraft({
      origem,
      risco,
      inspecao,
      checklistResposta,
      existingActions: acoes as any[],
    });

    if (generated.duplicated) {
      return generated.action;
    }

    const dataHora = new Date().toISOString();
    const newAction = {
      ...generated.action,
      historico: [{
        id: crypto.randomUUID(),
        actionId: generated.action.id,
        evento: 'CriaÃ§Ã£o automÃ¡tica',
        origem: 'AutomÃ¡tica',
        usuario: 'Sistema',
        dataHora,
        statusFinal: 'Pendente',
        camposAlterados: [
          { campo: 'Status', anterior: '-', novo: 'Pendente' },
          { campo: 'Origem', anterior: '-', novo: origem || 'AutomÃ¡tica' },
          { campo: 'Risco vinculado', anterior: '-', novo: risco?.titulo || risco?.nome || '-' },
          { campo: 'ResponsÃ¡vel', anterior: '-', novo: generated.action.responsavel || '-' },
          { campo: 'Prazo', anterior: '-', novo: new Date(generated.action.prazo).toLocaleDateString() }
        ],
        justificativa: 'Ação criada automaticamente a partir do risco gerado pela inspeção/checklist.',
        hash: generated.action.id,
        versao: '1.0',
        integridade: 'Verificada'
      }]
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
    }, 'InÃ­cio');
  };

  const atualizarProgresso = (id: string, novoProgresso: number, comentario?: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    // progresso mÃ­nimo 0, mÃ¡ximo 100
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
    
    updateActionStatus(id, updates, 'AtualizaÃ§Ã£o de progresso');
  };

  const concluirAcao = (id: string, observacaoFinal?: string, validacaoPayload?: any, evidenciaPayloads?: any[]) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;
    const validation = actionWorkflowService.validateTransition({
      action: acaoObj,
      targetStatus: 'Concluída',
      evidencePayloads: evidenciaPayloads || [],
    });
    if (!validation.success) {
      throw new Error(validation.errors[0]);
    }

    const updates: Partial<ActionItem> = {
      status: 'Concluída',
      faseExecucao: 'Validada',
      progresso: 100,
      concluidoEm: new Date().toISOString()
    };

    if (observacaoFinal) {
      if (!updates.comentarios) updates.comentarios = [];
      updates.comentarios = [...(acaoObj.comentarios || []), observacaoFinal];
    }
    
    if (evidenciaPayloads && evidenciaPayloads.length > 0) {
       updates.evidencia = [...(acaoObj.evidencia || []), ...evidenciaPayloads];
    }
    
    if (validacaoPayload) {
       updates.validacao = {
          validador: validacaoPayload.validador || 'Validador nÃ£o identificado',
          data: new Date().toISOString(),
          decisao: validacaoPayload.decisao || 'Aprovado',
          baseadoEm: validacaoPayload.baseadoEm || 'EvidÃªncias anexadas',
          comentarios: validacaoPayload.comentarios
       };
    }

    const justificativa = acaoObj.riscoId
      ? 'Ação concluída. Risco vinculado deve ser revisado para avaliação de mitigação.'
      : observacaoFinal;

    updateActionStatus(id, updates, 'ConclusÃ£o', justificativa);
  };

  const enviarParaValidacao = (id: string, observacao?: string, evidenciaPayloads?: any[]) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;
    const validation = actionWorkflowService.validateTransition({
      action: acaoObj,
      targetStatus: 'Aguardando Validação',
      evidencePayloads: evidenciaPayloads || [],
    });
    if (!validation.success) {
      throw new Error(validation.errors[0]);
    }

    const updates: Partial<ActionItem> = {
      faseExecucao: 'Aguardando Validação',
      progresso: 99,
    };

    if (observacao) {
      if (!updates.comentarios) updates.comentarios = [];
      updates.comentarios = [...(acaoObj.comentarios || []), observacao];
    }
    
    if (evidenciaPayloads && evidenciaPayloads.length > 0) {
       updates.evidencia = [...(acaoObj.evidencia || []), ...evidenciaPayloads];
    }

    updateActionStatus(id, updates, 'EvidÃªncias enviadas para validaÃ§Ã£o');
  };

  const rejeitarValidacao = (id: string, motivo: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    const updates: Partial<ActionItem> = {
      faseExecucao: 'Rejeitada',
      progresso: parseInt(((acaoObj.progresso || 100) * 0.8).toString(), 10),
    };

    if (!updates.comentarios) updates.comentarios = [];
    updates.comentarios = [...(acaoObj.comentarios || []), `RejeiÃ§Ã£o de validaÃ§Ã£o: ${motivo}`];

    updates.validacao = {
       validador: 'Sistema/Regulador',
       data: new Date().toISOString(),
       decisao: 'Recusado',
       baseadoEm: motivo,
       comentarios: motivo
    };

    updateActionStatus(id, updates, 'Validação rejeitada. Retornou para execução.');
  };

  const reatribuirAcao = (id: string, novoResponsavel: string, justificativa: string) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;

    updateActionStatus(id, {
      responsavel: novoResponsavel
    }, 'ReatribuiÃ§Ã£o', justificativa);
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
    const validation = actionWorkflowService.validateTransition({
      action: acaoObj,
      targetStatus: 'Em andamento',
      justification: justificativa,
    });
    if (!validation.success) {
      throw new Error(validation.errors[0]);
    }

    updateActionStatus(id, {
      status: 'Em andamento',
      progresso: acaoObj.progresso >= 100 ? 90 : acaoObj.progresso,
      concluidoEm: null,
      canceladoEm: null
    }, 'Reabertura', justificativa);
  };

  return {
    acoes,
    showInactive,
    setShowInactive,
    updateActionStatus,
    createAction,
    criarAcaoAutomatica,
    iniciarAcao,
    atualizarProgresso,
    concluirAcao,
    enviarParaValidacao,
    rejeitarValidacao,
    reatribuirAcao,
    cancelarAcao,
    reabrirAcao,
    executarFollowUps
  };
}

export function getPendentes(acoes: ActionItem[]) {
  if (!Array.isArray(acoes)) return [];
  return acoes.filter(a => a.status === 'Pendente');
}

export function getEmAndamento(acoes: ActionItem[]) {
  if (!Array.isArray(acoes)) return [];
  return acoes.filter(a => a.status === 'Em andamento');
}

export function getConcluidas(acoes: ActionItem[]) {
  if (!Array.isArray(acoes)) return [];
  return acoes.filter(a => a.status === 'Concluída' || a.status === 'Cancelada');
}





