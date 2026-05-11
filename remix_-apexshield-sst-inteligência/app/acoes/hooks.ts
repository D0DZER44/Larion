"use client";

import { useAppStore } from '@/lib/store';
import { normalizeActionDraft, validateActionCompletion, validateActionDraft } from '@/lib/action-rules';
import { ActionItem, AcaoStatus, AcaoPrioridade, ActionFollowUp } from './types';
import { useMemo, useCallback, useState } from 'react';

export function useAcoes() {
  const storeAcoes = useAppStore(state => state.acoes);
  const storeRiscos = useAppStore(state => state.riscos);
  const rulePackages = useAppStore(state => state.rulePackages);
  const activePackageNames = useMemo(() => rulePackages.filter(p => p.isActive).map(p => p.name), [rulePackages]);
  const addAcao = useAppStore(state => state.addAcao);
  const updateAcao = useAppStore(state => state.updateAcao);
  const addLog = useAppStore(state => state.addLog);

  const allAcoes: ActionItem[] = useMemo(() => {
    return (storeAcoes || []).filter(a => {
      if (!a) return false;
      const textFields = [a.title, a.titulo, a.description, a.descricao, a.category].filter(Boolean).join(' ').toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!a.title && !a.titulo && !a.description && !a.descricao && !a.category) return false;
      return true;
    }).map((a: any) => {
      // Logic to parse status
      let baseStatus: AcaoStatus = 'Pendente';
      const rawStatus = typeof a.status === 'string' ? a.status.toLowerCase() : '';
      
      if (rawStatus === 'concluÃ­da' || rawStatus === 'concluÃ­do' || rawStatus === 'fechada') {
        baseStatus = 'ConcluÃ­da';
      } else if (rawStatus === 'cancelada') {
        baseStatus = 'Cancelada';
      } else if (rawStatus === 'em andamento' || a.progresso > 0) {
        baseStatus = 'Em andamento';
      }
      
      const prazoStr = a.prazo || a.due_date || a.deadlineTime;
      // Calculate Vencida if pending/em andamento and deadline has passed
      if ((baseStatus === 'Pendente' || baseStatus === 'Em andamento') && prazoStr) {
        const prazoDate = new Date(prazoStr);
        prazoDate.setHours(23, 59, 59, 999);
        if (new Date() > prazoDate) {
           baseStatus = 'Vencida';
        }
      }

      // Logic to parse priority
      let basePrioridade: AcaoPrioridade = 'MÃ©dia';
      const pri = a.priority || a.prioridade;
      const rawPri = typeof pri === 'string' ? pri.toLowerCase() : '';
      if (rawPri.includes('crÃ­tic') || rawPri === 'p1') basePrioridade = 'CrÃ­tica';
      else if (rawPri.includes('alta') || rawPri === 'p2') basePrioridade = 'Alta';
      else if (rawPri.includes('mÃ©dia') || rawPri === 'p3') basePrioridade = 'MÃ©dia';
      else if (rawPri.includes('baixa') || rawPri === 'p4') basePrioridade = 'Baixa';

      // Find risk
      const relatedRisk = storeRiscos.find(r => r.id === (a.risk_id || a.riscoId || a.item_origem_id));
      const pacote = a.pacote || relatedRisk?.pacote || relatedRisk?.package || 'Base SST';

      const normalized = normalizeActionDraft({
        id: a.id,
        titulo: a.title || a.titulo || '',
        descricao: a.description || a.descricao || '',
        prioridade: basePrioridade,
        status: baseStatus,
        setor: a.category || a.setor || a.sector_id || '',
        responsavel: a.responsavel || a.responsible?.name || '',
        prazo: (typeof a.prazo === 'string' ? a.prazo : null) || (typeof a.due_date === 'string' ? a.due_date : null) || (typeof a.deadlineTime === 'string' ? a.deadlineTime : null) || '',
        progresso: a.progresso || 0,
        origem: a.origem || a.originText || (a.item_origem_tipo === 'inspecao' ? 'InspeÃ§Ã£o' : a.item_origem_tipo === 'risco' ? 'Risco' : 'Manual'),
        riscoId: a.riscoId || a.risk_id || (a.item_origem_tipo === 'risco' ? a.item_origem_id : undefined),
        riscoVinculado: a.riscoVinculado || relatedRisk?.titulo || relatedRisk?.title || '',
        inspecaoId: a.inspecaoId || (a.item_origem_tipo === 'inspecao' ? a.item_origem_id : undefined),
        checklistId: a.checklistId || '',
        perguntaOrigem: a.perguntaOrigem || '',
        respostaOrigem: a.respostaOrigem || '',
        nrRelacionada: a.nrRelacionada || a.nr || relatedRisk?.nr,
        pacote,
        multaEstimada: a.multaEstimada || 0,
        chanceIncidente: a.chanceIncidente || 'Baixa',
        criadoEm: a.criadoEm || a.createdAt || new Date().toISOString(),
        atualizadoEm: a.atualizadoEm || new Date().toISOString(),
        iniciadoEm: a.iniciadoEm || null,
        concluidoEm: a.concluidoEm || null,
        oQue: a.oQue,
        porQue: a.porQue,
        onde: a.onde,
        quem: a.quem,
        quando: a.quando,
        como: a.como,
        quantoCusta: a.quantoCusta ?? a.valorEstimado,
        exigeEvidencia: a.exigeEvidencia,
        evidencia: a.evidencia || [],
        historico: a.historico || []
      });

      return normalized as ActionItem;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [storeAcoes, storeRiscos]);

  const [showInactive, setShowInactive] = useState(false);

  const acoes = useMemo(() => {
    if (showInactive) return allAcoes;
    return allAcoes.filter(a => {
      const p = (a as any).pacote || 'Base SST';
      return p === 'Base SST' || activePackageNames.includes(p);
    });
  }, [allAcoes, showInactive, activePackageNames]);

  const calcularFollowUp = useCallback((action: ActionItem) => {
    if (action.status === 'ConcluÃ­da' || action.status === 'Cancelada') {
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
      mensagem = "Esta aÃ§Ã£o possui impedimento informado. Verifique o bloqueio e atualize o status.";
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
      mensagem = "Esta aÃ§Ã£o estÃ¡ vencida e precisa de prioridade imediata.";
    } else if (isVenceHoje) {
      nivel = 'atenÃ§Ã£o';
      precisaFollowUp = true;
      mensagem = "Esta aÃ§Ã£o vence hoje. Atualize o progresso ou conclua a execuÃ§Ã£o.";
    }

    // Rules by priority
    let proximoFollowUpTemp = new Date(ultimaAtualizacao);
    if (!precisaFollowUp && !hasBloqueio) {
      if (action.prioridade === 'CrÃ­tica') {
        proximoFollowUpTemp.setHours(proximoFollowUpTemp.getHours() + 4);
        if (horasSemAtualizacao >= 8) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 4) {
          precisaFollowUp = true;
          mensagem = action.status === 'Pendente' ? 
            "Esta aÃ§Ã£o crÃ­tica ainda nÃ£o foi iniciada. Inicie a execuÃ§Ã£o ou justifique o atraso." : 
            "Esta aÃ§Ã£o estÃ¡ em andamento, mas nÃ£o recebeu atualizaÃ§Ã£o recente.";
        }
      } else if (action.prioridade === 'Alta') {
        proximoFollowUpTemp.setHours(proximoFollowUpTemp.getHours() + 24);
        if (horasSemAtualizacao >= 48) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 24) {
          precisaFollowUp = true;
          mensagem = "Esta aÃ§Ã£o estÃ¡ em andamento, mas nÃ£o recebeu atualizaÃ§Ã£o recente.";
        }
      } else if (action.prioridade === 'MÃ©dia') {
        proximoFollowUpTemp.setDate(proximoFollowUpTemp.getDate() + 2);
        if (horasSemAtualizacao >= 96) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 48) {
          precisaFollowUp = true;
          mensagem = "Esta aÃ§Ã£o estÃ¡ em andamento, mas nÃ£o recebeu atualizaÃ§Ã£o recente.";
        }
      } else {
        proximoFollowUpTemp.setDate(proximoFollowUpTemp.getDate() + 7);
        if (horasSemAtualizacao >= 168) precisaEscalonamento = true;
        if (horasSemAtualizacao >= 168) {
          precisaFollowUp = true;
          mensagem = "Esta aÃ§Ã£o estÃ¡ em andamento, mas nÃ£o recebeu atualizaÃ§Ã£o recente.";
        }
      }
    }

    if (precisaEscalonamento) {
      mensagem = "Esta aÃ§Ã£o foi escalonada automaticamente por atraso ou ausÃªncia de atualizaÃ§Ã£o.";
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
       
       const criticalActions = relatedActions.filter(a => ['CrÃ­tica', 'Alta'].includes(a.prioridade));
       // If risk has critical actions, require ALL critical actions to be validated for the risk to consider mitigated
       
       const relevantActions = criticalActions.length > 0 ? criticalActions : relatedActions;
       
       if (relevantActions.length > 0) {
          const allValidated = relevantActions.every(a => a.faseExecucao === 'Validada' || a.status === 'Cancelada');
          const allCompleted = relevantActions.every(a => ['ConcluÃ­da', 'Cancelada'].includes(a.status));
          
          if (allValidated && allCompleted) {
             useAppStore.getState().updateRisco(riskId, { status: 'Mitigado', atualizadoEm: dataHora, justificativa: 'Risco mitigado automaticamente pois todas as aÃ§Ãµes relevantes foram validadas.' });
          } else if (modified.faseExecucao === 'Aguardando ValidaÃ§Ã£o' || modified.status === 'ConcluÃ­da') {
             // Let's ensure it stays open/reviewing
             useAppStore.getState().updateRisco(riskId, { status: 'Em anÃ¡lise', atualizadoEm: dataHora, justificativa: 'Aguardando validaÃ§Ã£o de aÃ§Ãµes pendentes.' });
          } else {
             useAppStore.getState().updateRisco(riskId, { status: 'Aberto', atualizadoEm: dataHora, justificativa: 'Risco reaberto ou em andamento.' });
          }
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
      const isNowVencida = vencimentoStr && new Date() > vencimentoStr && existingStatus !== 'Vencida' && existingStatus !== 'ConcluÃ­da' && existingStatus !== 'Cancelada';

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
        evento: 'AÃ§Ã£o criada',
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
      // Se necessÃ¡rio atualizar algo na existente, farÃ­amos aqui, mas o requisito diz para nÃ£o criar nova.
      // updateActionStatus(acaoExistente.id, { ... }, 'AtualizaÃ§Ã£o automÃ¡tica');
      return acaoExistente;
    }

    const gerarTituloAcao = (riscoNome: string) => {
      const r = (riscoNome || '').toLowerCase();
      if (r.includes('linha de vida')) return 'Regularizar linha de vida';
      if (r.includes('epi')) return 'Regularizar EPI obrigatÃ³rio';
      if (r.includes('bloqueio elÃ©trico') || r.includes('loto')) return 'Regularizar bloqueio e etiquetagem';
      if (r.includes('espaÃ§o confinado')) return 'Regularizar procedimento de espaÃ§o confinado';
      if (r.includes('mÃ¡quina') || r.includes('equipamento') || r.includes('proteÃ§Ã£o')) return 'Regularizar proteÃ§Ã£o de mÃ¡quina/equipamento';
      if (r.includes('produto quÃ­mico')) return 'Regularizar controle de produto quÃ­mico';
      if (r.includes('sinalizaÃ§Ã£o')) return 'Regularizar sinalizaÃ§Ã£o de seguranÃ§a';
      return 'Tratar nÃ£o conformidade identificada';
    };

    const prioridade = risco?.prioridade || 'MÃ©dia';
    
    let prazo = risco?.prazo;
    if (!prazo) {
      const hoje = new Date();
      if (prioridade === 'CrÃ­tica') hoje.setDate(hoje.getDate() + 1);
      else if (prioridade === 'Alta') hoje.setDate(hoje.getDate() + 3);
      else if (prioridade === 'MÃ©dia') hoje.setDate(hoje.getDate() + 7);
      else hoje.setDate(hoje.getDate() + 15);
      prazo = hoje.toISOString();
    }

    const responsavel = inspecao?.responsavel || risco?.responsavel || 'SST + Supervisor da Ã¡rea';
    const setor = inspecao?.setor || risco?.setor || '';
    const nrRelacionada = risco?.nr || risco?.nrRelacionada || '';

    const descricao = `Esta aÃ§Ã£o foi criada automaticamente a partir de uma nÃ£o conformidade identificada na inspeÃ§Ã£o. Deve ser tratada para reduzir o risco vinculado e atualizar o status operacional.
    Risco: ${risco?.titulo || risco?.nome || '-'}
    NR: ${nrRelacionada}
    Setor: ${setor}
    Resposta da InspeÃ§Ã£o: ${checklistResposta?.texto ? checklistResposta.texto : (checklistResposta?.resposta || '-')}`;

    const dataHora = new Date().toISOString();
    const idAcao = `AC-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const historicoEvent = {
        id: crypto.randomUUID(),
        actionId: idAcao,
        evento: 'CriaÃ§Ã£o automÃ¡tica',
        origem: 'AutomÃ¡tica',
        usuario: 'Sistema',
        dataHora,
        statusFinal: 'Pendente',
        camposAlterados: [
          { campo: 'Status', anterior: '-', novo: 'Pendente' },
          { campo: 'Origem', anterior: '-', novo: origem || 'AutomÃ¡tica' },
          { campo: 'Risco vinculado', anterior: '-', novo: risco?.titulo || risco?.nome || '-' },
          { campo: 'ResponsÃ¡vel', anterior: '-', novo: responsavel },
          { campo: 'Prazo', anterior: '-', novo: new Date(prazo).toLocaleDateString() }
        ],
        justificativa: 'AÃ§Ã£o criada automaticamente a partir do risco gerado pela inspeÃ§Ã£o/checklist.',
        hash: idAcao, // Simple mock for new creation
        versao: '1.0',
        integridade: 'Verificada'
    };

    const newAction = {
      id: idAcao,
      titulo: gerarTituloAcao(risco?.titulo || risco?.nome),
      descricao,
      oQue: gerarTituloAcao(risco?.titulo || risco?.nome),
      porQue: (risco?.titulo || risco?.nome)
        ? `Reduzir o risco identificado: ${risco?.titulo || risco?.nome}`
        : 'Eliminar a nao conformidade identificada na inspecao.',
      onde: setor,
      quem: responsavel,
      quando: typeof prazo === 'string' ? prazo : new Date(prazo).toISOString().split('T')[0],
      como: checklistResposta?.acaoSugerida || risco?.acaoVinculada || 'Executar a correcao, testar o controle implantado e registrar a evidencia final.',
      quantoCusta: risco?.multaEstimada || undefined,
      prioridade,
      status: 'Pendente',
      setor,
      responsavel,
      prazo,
      progresso: 0,
      origem: origem || 'InspeÃ§Ã£o',
      riscoId: risco?.id,
      riscoVinculado: risco?.titulo || risco?.nome,
      inspecaoId: inspecao?.id,
      checklistId: checklistResposta?.checklistId,
      perguntaOrigem: checklistResposta?.pergunta,
      respostaOrigem: checklistResposta?.resposta || checklistResposta?.texto,
      nrRelacionada,
      multaEstimada: risco?.multaEstimada || 0,
      chanceIncidente: risco?.chanceIncidente || 'MÃ©dia',
      criadoEm: dataHora,
      atualizadoEm: dataHora,
      iniciadoEm: null,
      concluidoEm: null,
      canceladoEm: null,
      exigeEvidencia: typeof prioridade === 'string' && prioridade.toLowerCase().includes('cr'),
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
    const completionErrors = validateActionCompletion(acaoObj, evidenciaPayloads || []);
    if (completionErrors.length > 0) {
      throw new Error(completionErrors[0]);
    }

    const updates: Partial<ActionItem> = {
      status: 'ConcluÃ­da',
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
      ? 'AÃ§Ã£o concluÃ­da. Risco vinculado deve ser revisado para avaliaÃ§Ã£o de mitigaÃ§Ã£o.'
      : observacaoFinal;

    updateActionStatus(id, updates, 'ConclusÃ£o', justificativa);
  };

  const enviarParaValidacao = (id: string, observacao?: string, evidenciaPayloads?: any[]) => {
    const acaoObj = acoes.find(a => a.id === id);
    if (!acaoObj) return;
    const completionErrors = validateActionCompletion(acaoObj, evidenciaPayloads || []);
    if (completionErrors.length > 0) {
      throw new Error(completionErrors[0]);
    }

    const updates: Partial<ActionItem> = {
      faseExecucao: 'Aguardando ValidaÃ§Ã£o',
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

    updateActionStatus(id, updates, 'ValidaÃ§Ã£o rejeitada. Retornou para execuÃ§Ã£o.');
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
  return acoes.filter(a => a.status === 'ConcluÃ­da' || a.status === 'Cancelada');
}





