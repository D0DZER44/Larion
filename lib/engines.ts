// lib/engines.ts

import { useAppStore, AppState, nrToPackage } from './store';
import { FineEngine } from './fineEngine';

// ==================================================
// NORMATIVE ENGINE
// ==================================================

export const NormativeEngine = {
  rules: [
    {
      keywords: ['trabalho em altura', 'altura', 'telhado', 'escada', 'andaime'],
      nr: 'NR-35',
      riskType: 'Queda de altura',
      severity: 'alta',
      documents: ['APR', 'PT', 'Treinamento NR-35', 'ASO', 'Checklist NR-35'],
      ppe: ['cinto paraquedista', 'talabarte', 'linha de vida', 'guarda-corpo'],
      recommendedAction: 'validar capacitação, autorização, ancoragem, EPI e inspeção antes da atividade'
    },
    {
      keywords: ['eletricidade', 'painel elétrico', 'manutenção elétrica', 'energizado', 'elétrico', 'eletrica'],
      nr: 'NR-10',
      riskType: 'Choque elétrico/Arco elétrico',
      severity: 'alta',
      documents: ['Treinamento NR-10', 'APR', 'PT', 'Prontuário Elétrico'],
      ppe: ['luva isolante', 'face shield', 'ferramenta isolada', 'bloqueio e etiquetagem'],
      recommendedAction: 'validar desenergização, bloqueio e autorização'
    },
    {
      keywords: ['espaço confinado', 'tanque', 'silo', 'galeria', 'confinado'],
      nr: 'NR-33',
      riskType: 'Atmosfera perigosa/Asfixia',
      severity: 'crítica',
      documents: ['PT', 'APR', 'Treinamento NR-33', 'Medição atmosférica'],
      ppe: ['detector de gases', 'ventilação', 'tripé', 'resgate'],
      recommendedAction: 'validar permissão de entrada, monitoramento e plano de resgate'
    },
    {
      keywords: ['máquinas', 'prensa', 'serra', 'torno', 'maquina', 'equipamento'],
      nr: 'NR-12',
      riskType: 'Aprisionamento/Corte/Esmagamento',
      severity: 'alta',
      documents: ['Inventário de máquinas', 'Análise de risco', 'Procedimento'],
      ppe: ['proteção fixa', 'proteção móvel', 'botão de emergência', 'bloqueio'],
      recommendedAction: 'validar proteções e bloqueios antes da operação'
    },
    {
      keywords: ['epi', 'capacete', 'luva', 'bota', 'protetor', 'óculos'],
      nr: 'NR-06',
      riskType: 'Exposição sem proteção adequada',
      severity: 'média',
      documents: ['Ficha de EPI', 'CA válido', 'Treinamento de uso'],
      ppe: [],
      recommendedAction: 'validar entrega, CA e treinamento'
    },
    {
      keywords: ['ergonomia', 'postura', 'levantamento de peso', 'repetitivo', 'peso'],
      nr: 'NR-17',
      riskType: 'Sobrecarga ergonômica',
      severity: 'média',
      documents: ['AET', 'Orientação ergonômica'],
      ppe: [],
      recommendedAction: 'avaliar posto e ajustar carga/ritmo'
    }
  ],

  detect(activityText: string) {
    const text = activityText.toLowerCase();
    const state = useAppStore.getState();
    const activePackages = state.rulePackages.filter(p => p.isActive).map(p => p.name);

    let candidates: any[] = [];

    this.rules.forEach(rule => {
      const matches = rule.keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        // RULE: Apply package filter
        const pacoteDaNR = nrToPackage[rule.nr] || "Base SST";
        const podeAplicarNR = pacoteDaNR === "Base SST" || activePackages.includes(pacoteDaNR);

        if (podeAplicarNR) {
          candidates.push({
            rule,
            matches,
            matchCount: matches.length
          });
        }
      }
    });

    if (candidates.length > 0) {
      // Sort by match count descending
      candidates.sort((a, b) => b.matchCount - a.matchCount);
      const best = candidates[0];
      
      return {
        ...best.rule,
        confidence: best.matchCount > 1 ? 'alta' : 'média',
        matchedKeywords: best.matches
      };
    }

    return null;
  },

  findByNR(nr: string) {
    return this.rules.find(r => r.nr === nr) || null;
  },

  getSuggestions(activityText: string) {
    const detection = this.detect(activityText);
    if (!detection) return null;
    return {
      message: `Identificamos relação com a ${detection.nr} (${detection.riskType}). Atenção para a severidade ${detection.severity.toUpperCase()}.`,
      action: detection.recommendedAction,
      ppe: detection.ppe
    };
  }
};

// ==================================================
// RISK ENGINE
// ==================================================

export const RiskEngine = {
  calculateRisk(input: { severity: string, exposedPeople: number, overdueInspections: number, overdueActions: number, nonConformities: number, recurrence: boolean, criticalActivity: boolean }) {
    let score = 0;
    
    // Base score by severity
    if (input.severity === 'crítica') score += 40;
    else if (input.severity === 'alta') score += 30;
    else if (input.severity === 'média') score += 15;
    else score += 5;

    // Modifiers
    score += Math.min(input.exposedPeople * 2, 20); // up to 20 pts
    score += Math.min(input.overdueInspections * 5, 15);
    score += Math.min(input.overdueActions * 5, 15);
    score += Math.min(input.nonConformities * 5, 10);
    
    if (input.recurrence) score += 15;
    if (input.criticalActivity) score += 20;

    return Math.min(score, 100);
  },

  getRiskLevel(score: number) {
    if (score <= 30) return 'baixo';
    if (score <= 60) return 'médio';
    if (score <= 80) return 'alto';
    return 'crítico';
  },

  getRiskColor(level: string) {
    switch (level.toLowerCase()) {
      case 'baixo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'médio': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'alto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'crítico': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  },

  generateRiskFromActivity(activityText: string) {
    const norm = NormativeEngine.detect(activityText);
    if (!norm) return null;

    let baseScore = norm.severity === 'crítica' ? 85 : norm.severity === 'alta' ? 65 : 45;
    
    return {
      title: `Risco de ${norm.riskType}`,
      level: this.getRiskLevel(baseScore),
      color: this.getRiskColor(this.getRiskLevel(baseScore)),
      source: norm.nr,
      recommendedPPE: norm.ppe
    };
  }
};

// ==================================================
// INSPECTION ENGINE
// ==================================================

export const InspectionEngine = {
  getStatus(inspection: any) {
    return inspection.status || 'Programada';
  },

  getOverdue(inspections: any[]) {
    return inspections.filter(i => i.status === 'Atrasada');
  },

  getToday(inspections: any[]) {
    const today = new Date().toISOString().split('T')[0];
    return inspections.filter(i => i.data && i.data.startsWith(today));
  },

  getScheduled(inspections: any[]) {
    return inspections.filter(i => i.status === 'Programada');
  },

  getCompleted(inspections: any[]) {
    return inspections.filter(i => i.status === 'Concluída');
  },

  getNonConformities(inspections: any[]) {
    return inspections.filter(i => i.score < 100 || (i.nonConformities && i.nonConformities.length > 0));
  },

  suggestActionFromInspection(inspection: any) {
    if (inspection.score < 100) {
      return {
        title: `Ação corretiva para a inspeção ${inspection.titulo}`,
        priority: inspection.score < 50 ? 'Urgente' : 'Alta',
        description: 'Corrigir as não conformidades apontadas no checklist da inspeção.'
      };
    }
    return null;
  },

  generateRiskSignal(inspection: any) {
    if (inspection.status === 'Atrasada' || inspection.score < 50) {
      return 'ALERTA: Risco elevado devido a falhas ou atrasos em inspeções críticas.';
    }
    return 'Inspeção regular.';
  }
};

// ==================================================
// ACTION ENGINE
// ==================================================

export const ActionEngine = {
  getBuckets(actions: any[]) {
    return {
      vencidas: actions.filter(a => a.status === 'Atrasada' || this.isOverdue(a)),
      hoje: actions.filter(a => {
        if(!a.prazo) return false;
        const today = new Date().toISOString().split('T')[0];
        return a.prazo.startsWith(today) && a.status !== 'Concluída';
      }),
      emAndamento: actions.filter(a => a.status === 'Em andamento'),
      aguardando: actions.filter(a => a.status === 'Em aberto'),
      concluidas: actions.filter(a => a.status === 'Concluída')
    };
  },

  isOverdue(action: any) {
    if (action.status === 'Concluída') return false;
    if (!action.prazo) return false;
    const deadline = new Date(action.prazo).getTime();
    const now = new Date().getTime();
    return deadline < now;
  },

  createFromRisk(risk: any) {
    return {
      id: `act-${crypto.randomUUID()}`,
      titulo: `Mitigar Risco: ${risk.titulo}`,
      riscoId: risk.id,
      prioridade: risk.nivel === 'Crítico' ? 'Urgente' : 'Alta',
      status: 'Em aberto',
      progresso: 0
    };
  },

  createFromInspection(inspection: any) {
    return {
      id: `act-insp-${crypto.randomUUID()}`,
      titulo: `Plano de Ação: ${inspection.titulo}`,
      inspecaoId: inspection.id,
      prioridade: 'Alta',
      status: 'Em aberto',
      progresso: 0
    };
  },

  updateStatus(actionId: string, status: string, actions: any[]) {
    return actions.map(a => a.id === actionId ? { ...a, status } : a);
  },

  getPriorityColor(priority: string) {
    switch (priority.toLowerCase()) {
      case 'urgente':
      case 'crítico': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'alta':
      case 'alto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'média':
      case 'médio': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'baixa':
      case 'baixo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  }
};

// ==================================================
// AUTOMATION ENGINE
// ==================================================

export const AutomationEngine = {
  processInspection(inspectionId: string) {
    const state = useAppStore.getState();
    const inspection = state.inspecoes.find(i => i.id === inspectionId);
    if (!inspection || !inspection.items) return;

    const pacotesAtivos = state.rulePackages.filter(p => p.isActive).map(p => p.name);
    const segmentoOrg = state.organization.segmento;
    const atividadesOrg = state.organization.atividadesCriticas;

    // Filter rules applicable to the organization context
    const regrasAplicaveis = state.riskRules.filter(regra => 
      regra.ativo && 
      pacotesAtivos.includes(regra.pacote) &&
      (
        regra.pacote === "Base SST" ||
        regra.segmentos.includes(segmentoOrg) ||
        regra.atividades.some(a => atividadesOrg.includes(a))
      )
    );

    const nonConformingItems = inspection.items.filter((item: any) => 
      item.status === 'Não' || item.status === 'Parcialmente'
    );

    const conformingItems = inspection.items.filter((item: any) => 
      item.status === 'Sim' || item.status === 'Conforme' || item.status === 'N/A'
    );

    const numEmpregados = state.engineConfig.economia.numEmpregados || 50;
    const reincidencia = state.engineConfig.economia.fatorReincidencia > 1.0;

    // PROCESS NON-CONFORMITIES
    nonConformingItems.forEach((item: any) => {
      // Find matching rule
      const matchingRule = regrasAplicaveis.find(r => 
        r.nrRelacionada === (item.nrRelacionada || item.nr) && 
        (r.pacote === 'Base SST' || r.atividades.some(a => (item.atividade === a || inspection.tipoInspecao === a)))
      );

      if (!matchingRule && !item.regraFixa) return;

      // RISK GENERATION
      const nr = matchingRule?.nrRelacionada || item.nr || item.nrRelacionada || 'NR-01';
      const severity = matchingRule?.criticidade || item.riskMap || 'Médio';
      
      const riskId = `risk-${inspectionId}-${matchingRule?.id || item.id}`;

      // Calculate Fine Range
      const fineEstimate = FineEngine.calcularFaixaMulta({
        nr,
        criticidade: severity,
        numeroEmpregados: numEmpregados,
        reincidencia: reincidencia,
        tipoInfracao: nr.includes('NR-07') || nr.includes('NR-09') || nr.includes('NR-32') ? 'Medicina' : 'Segurança'
      });

      // Inheritance of fields
      const riskPayload = {
        id: riskId,
        titulo: matchingRule ? matchingRule.titulo : `Desvio: ${item.text.substring(0, 50)}...`,
        atividade: inspection.tipoInspecao || 'Operação',
        setor: inspection.ondeUsar || 'Geral',
        nr: nr,
        nrRelacionada: nr,
        pacote: matchingRule?.pacote || item.pacote || 'Base SST',
        segmento: matchingRule?.segmentos?.[0] || segmentoOrg,
        prioridade: severity,
        nivel: severity,
        prazo: matchingRule?.prazoPadraoHoras ? `Até ${matchingRule.prazoPadraoHoras}h` : '72h',
        faixaMultaEstimativa: fineEstimate.faixaLabel, // Label for backward compatibility
        multaEstimativaMin: fineEstimate.minimoEstimado,
        multaEstimativaMax: fineEstimate.maximoEstimado,
        faixaMultaLabel: fineEstimate.faixaLabel,
        baseMulta: fineEstimate.baseLegal,
        disclaimerMulta: fineEstimate.disclaimer,
        origem: 'Inspeção / Checklist',
        inspection_id: inspectionId,
        checklist_item_id: item.id,
        regraId: matchingRule?.id || item.regraId || 'fixo',
        perguntaOrigem: item.text,
        respostaOrigem: item.status,
        status: 'Pendente',
        criadoEm: new Date().toISOString(),
        // Pessoa no Centro
        trabalhadoresExpostos: inspection.trabalhadoresExpostos || 0,
        perfilExposto: inspection.perfilExposto || '',
        impactoHumano: severity === 'Crítico' || severity === 'Alto' ? 'Acidente Grave/Fatal' : 'Acidente Leve/Moderado',
        executorCorrecao: 'Pendente designação',
        validadorCorrecao: inspection.responsavel || 'Operação / SSO'
      };

      const existingRisk = state.riscos.find(r => r.id === riskId);
      if (!existingRisk) {
        state.addRisco(riskPayload);
      } else {
        state.updateRisco(existingRisk.id, riskPayload);
      }

      // ACTION GENERATION
      const actionId = `act-${riskId}`;
      const actionPayload = {
        id: actionId,
        titulo: `Mitigação: ${riskPayload.titulo}`,
        descricao: matchingRule ? matchingRule.acaoSugerida : `Ação corretiva para a não conformidade "${item.text}"`,
        riscoId: riskId,
        nr: nr,
        pacote: riskPayload.pacote,
        criticidade: severity,
        prazo: riskPayload.prazo,
        acaoSugerida: matchingRule ? matchingRule.acaoSugerida : 'Corrigir desvio identificado',
        exigeEvidencia: matchingRule?.exigeEvidencia || false,
        responsavel: inspection.responsavel || 'Operação / SSO',
        validador: inspection.responsavel || 'Operação / SSO',
        executor: 'Pendente designação',
        trabalhadoresExpostos: inspection.trabalhadoresExpostos || 0,
        perfilExposto: inspection.perfilExposto || '',
        impactoHumano: severity === 'Crítico' || severity === 'Alto' ? 'Acidente Grave/Fatal' : 'Acidente Leve/Moderado',
        setor: riskPayload.setor,
        status: 'Em aberto',
        progresso: 0,
        inspecaoId: inspectionId,
        criadoEm: new Date().toISOString()
      };

      const existingAction = state.acoes.find(a => a.id === actionId);
      if (!existingAction) {
        state.addAcao(actionPayload);
      } else {
        state.updateAcao(existingAction.id, actionPayload);
      }
    });

    // PROCESS CONFORMITIES (Resolve pending risks)
    conformingItems.forEach((item: any) => {
       const riskIdPrefix = `risk-${inspectionId}-`;
       const relatedRisk = state.riscos.find(r => r.inspection_id === inspectionId && r.checklist_item_id === item.id);
       
       if (relatedRisk && relatedRisk.status !== 'Resolvido') {
          state.updateRisco(relatedRisk.id, { 
            status: 'Resolvido', 
            justificativa: `Conformidade atestada na inspeção #${inspectionId}.`,
            atualizadoEm: new Date().toISOString()
          });
          
          const relatedAction = state.acoes.find(a => a.riscoId === relatedRisk.id);
          if (relatedAction && relatedAction.status !== 'Concluída') {
             state.updateAcao(relatedAction.id, { 
               status: 'Concluída', 
               progresso: 100,
               dataConclusao: new Date().toISOString()
             });
          }
       }
    });
  }
};

// ==================================================
// ECONOMIC IMPACT ENGINE
// ==================================================

export const EconomicImpactEngine = {
  estimate(input: { severityLevel: 'baixo' | 'médio' | 'alto' | 'crítico', exposedPeople: number, recurrence: boolean }) {
    const config = useAppStore.getState().engineConfig;
    if (config && !config.economia.enabled) {
      return { min: 0, max: 0, currency: 'BRL', components: [], disclaimer: 'Cálculo de impacto econômico desabilitado nas configurações.' };
    }

    let min = 0;
    let max = 0;

    switch (input.severityLevel) {
      case 'baixo':
        min = 500;
        max = 2000;
        break;
      case 'médio':
        min = 2000;
        max = 6000;
        break;
      case 'alto':
        min = 6000;
        max = 18000;
        break;
      case 'crítico':
        min = 15000;
        max = 50000;
        break;
    }

    // Adjust based on config
    const custoHora = config ? config.economia.custoHoraParada : 500;
    const reincidenciaFator = config ? config.economia.fatorReincidencia : 1.2;
    const extraRecurrencePenalty = input.recurrence ? (reincidenciaFator - 1) : 0;
    
    // Additional cost if critical - add custoHora * some default hours
    const baseHourCost = (input.severityLevel === 'crítico') ? (custoHora * 24) : (input.severityLevel === 'alto' ? custoHora * 8 : 0);
    
    min += baseHourCost;
    max += baseHourCost * 2;

    const multiplier = 1 + (input.exposedPeople * 0.1) + extraRecurrencePenalty;
    min = Math.round(min * multiplier);
    max = Math.round(max * multiplier);

    return {
      min,
      max,
      currency: 'BRL',
      components: ['Multas Normativas', 'Afastamentos / FAP', 'Paralisação'],
      disclaimer: "Estimativa preventiva. O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento."
    };
  },

  explainEstimate(estimate: any) {
    return `Ao mitigar este risco, estimamos uma proteção econômica entre ${this.formatCurrency(estimate.min)} e ${this.formatCurrency(estimate.max)}.\n${estimate.disclaimer}`;
  },

  formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
};

// ==================================================
// DECISION ENGINE
// ==================================================

export const DecisionEngine = {
  getMainDecision(state?: any) {
    const currentState = state || AppState.get();
    
    const acoes = currentState?.acoes || [];
    const riscos = currentState?.riscos || [];
    const inspecoes = currentState?.inspecoes || [];
    const alertas = currentState?.alertas || [];

    const overdueActions = acoes.filter((a: any) => ActionEngine.isOverdue(a) || a.status === 'Atrasada').length;
    const criticalRisks = riscos.filter((r: any) => r.nivel === 'Crítico' || r.level === 'Crítico' || r.nivel === 'Crítico').length;
    const highRisks = riscos.filter((r: any) => r.nivel === 'Alto' || r.level === 'Alto' || r.nivel === 'Alto').length;
    const overdueInspections = inspecoes.filter((i: any) => i.status === 'Atrasada' || i.relativeDate === 'Atrasada').length;
    const activeAlerts = alertas.filter((a: any) => a.status === 'Ativo' || a.status === 'Aberto').length;

    const totalDataPoints = acoes.length + riscos.length + inspecoes.length + alertas.length;

    if (totalDataPoints === 0) {
      return {
        title: 'Dados Insuficientes',
        decision: 'Dados insuficientes para recomendar uma decisão operacional confiável.',
        reason: 'O sistema não possui registros ativos de riscos, inspeções ou ações para análise.',
        operationalImpact: 'Baixo',
        confidence: '0%',
        evidences: ['Nenhum registro encontrado no estado central'],
        timeline: '-',
        nextSteps: ['Iniciar cadastro de riscos', 'Agendar primeiras inspeções'],
        causeAndEffect: { causes: [], effect: 'Visibilidade nula da operação' }
      };
    }

    // Calcula Nível de Confiança
    // Começamos com uma base de 50%. Mais dados = mais confiança.
    // Completo: Evidências convergentes (ex: risco e ação relacionada).
    let confInt = 50 + Math.min(40, totalDataPoints * 2);
    if (criticalRisks > 0 && overdueActions > 0) confInt += 5; // Correlação de dados
    if (confInt > 99) confInt = 98;
    const confidence = `${confInt}%`;

    const evidences = [];
    if (criticalRisks > 0) evidences.push(`${criticalRisks} risco(s) crítico(s) não mitigado(s)`);
    if (overdueActions > 0) evidences.push(`${overdueActions} ação(ões) atrasada(s)`);
    if (overdueInspections > 0) evidences.push(`${overdueInspections} inspeção(ões) pendente(s)`);
    if (activeAlerts > 0) evidences.push(`${activeAlerts} alerta(s) ativo(s)`);

    // Regras de Decisão
    if (criticalRisks > 0 || overdueActions > 2 || (activeAlerts > 0 && criticalRisks > 0)) {
      return {
        title: 'Intervenção Crítica Necessária',
        decision: 'Paralisar atividades com risco crítico não mitigado e executar plano de ação emergencial.',
        reason: `Existem ${criticalRisks} riscos críticos abertos em combinação com ${overdueActions} ações vencidas, aumentando a probabilidade de incidentes.`,
        operationalImpact: 'Crítico',
        confidence,
        evidences: evidences.length > 0 ? evidences : ['Sinais de falha sistêmica no compliance'],
        timeline: 'Imediato (0-2h)',
        nextSteps: [
          'Isolar áreas e equipamentos com risco crítico',
          'Notificar responsáveis pelas ações e inspeções vencidas',
          'Revisar EPIs e procedimentos operacionais das áreas'
        ],
        causeAndEffect: {
          causes: ['Atrasos acumulados em tratativas', 'Riscos críticos não mitigados no prazo'],
          effect: 'Risco iminente de acidente grave e autuações'
        }
      };
    }

    if (highRisks > 0 || overdueActions > 0 || overdueInspections > 0) {
      return {
        title: 'Atenção Requerida',
        decision: 'Acelerar fechamento de inspeções atrasadas e criar ações para mitigar riscos altos.',
        reason: `Foram detectados ${highRisks} riscos altos e algumas pendências de prazos que precisam de tração.`,
        operationalImpact: 'Médio',
        confidence,
        evidences,
        timeline: 'Curto Prazo (24h-48h)',
        nextSteps: [
          'Cobrar responsáveis por ações e inspeções vencidas',
          'Avaliar criação de plano de mitigação para riscos altos'
        ],
        causeAndEffect: {
          causes: ['Acúmulo inicial de tarefas atrasadas', 'Riscos de alta severidade expostos'],
          effect: 'Aumento gradual da vulnerabilidade operacional'
        }
      };
    }

    return {
      title: 'Status Estável',
      decision: 'Manter a cadência de inspeções preventivas e revisar documentações.',
      reason: 'Indicadores operacionais dentro da normalidade, sem acúmulo de riscos ou atrasos críticos.',
      operationalImpact: 'Baixo',
      confidence,
      evidences: ['Sem pendências críticas', 'Sem riscos críticos documentados abertos'],
      timeline: 'Longo Prazo',
      nextSteps: ['Continuar monitoramento diário', 'Validar evidências de EPC/EPI periodicamente'],
      causeAndEffect: {
        causes: ['Processos sendo seguidos', 'Prazos em conformidade'],
        effect: 'Operação segura e protegida contra passivos'
      }
    };
  },

  getEvidence(state?: any) {
    const currentState = state || AppState.get();
    return `Evidências do AppState: ${currentState.users?.length || 0} usuários, ${currentState.checklists?.length || 0} checklists cadastrados.`;
  },

  getTimeline(decision: any) {
    return decision.timeline || 'N/A';
  },

  getNextSteps(decision: any) {
    return decision.nextSteps || [];
  },

  getConfidence(decision: any) {
    return decision.confidence || '0%';
  }
};

// ==================================================
// PRIORITY ENGINE
// ==================================================

export const PriorityEngine = {
  getQueue(state?: any) {
    const currentState = state || AppState.get();
    let queue: any[] = [];

    // Process Actions
    if (currentState?.acoes) {
      currentState.acoes.forEach((a: any) => {
        if (a.status === 'Concluída') return;
        const isVencida = ActionEngine.isOverdue(a) || a.status === 'Atrasada' || a.deadlineRelative === 'Atrasado';
        const isP1 = a.prioridade === 'Urgente' || a.prioridade === 'Crítica' || a.priority === 'P1';
        const isP2 = a.prioridade === 'Alta' || a.priority === 'P2';
        const respName = typeof a.responsible === 'object' ? a.responsible.name : (a.responsavel || a.responsible || 'Sistema');
        
        queue.push({
          id: a.id,
          prio: isP1 ? 'P1' : (isVencida ? 'P1' : (isP2 ? 'P2' : 'P3')),
          title: a.titulo || a.title || 'Ação Pendente',
          origem: a.originText || a.category || 'Ações',
          resp: respName,
          prazo: a.prazo || a.deadlineTime || 'S/ Prazo',
          prazoOriginal: a.prazoOriginal || a.prazo || a.deadlineTime,
          status: isVencida ? 'Urgente' : (a.status || 'Pendente'),
          proc: a.nextStep || 'Executar prioridade',
          reasons: a.reasons || (isVencida ? ['Ação com prazo estourado'] : ['Ação preventiva']),
          checklist: a.checklist || [],
          item_origem_id: a.id,
          item_origem_tipo: 'acao'
        });
      });
    }

    // Process Risks
    if (currentState?.riscos) {
      currentState.riscos.forEach((r: any) => {
        if (r.nivel === 'Baixo' || r.level === 'Baixo') return;
        const nivel = r.nivel || r.level || '';
        const isCrit = nivel.toLowerCase() === 'crítico';
        const isHigh = nivel.toLowerCase() === 'alto';
        
        queue.push({
          id: r.id || `risk-${Math.random()}`,
          prio: isCrit ? 'P1' : (isHigh ? 'P2' : 'P3'),
          title: `Mitigar Risco: ${r.atividade || r.title || r.setor || 'Não especificado'}`,
          origem: r.source || 'Riscos',
          resp: r.responsavel || 'SSO',
          prazo: 'Imediato',
          prazoOriginal: 'Imediato',
          status: isCrit ? 'Urgente' : 'Alta',
          proc: 'Plano de Ação',
          reasons: r.reasons || [`Risco sinalizado como ${nivel.toUpperCase()}`],
          checklist: r.checklist || [],
          item_origem_id: r.id,
          item_origem_tipo: 'risco'
        });
      });
    }

    // Process Inspections
    if (currentState?.inspecoes) {
      currentState.inspecoes.forEach((i: any) => {
        if (i.status === 'Atrasada' || i.relativeDate === 'Atrasada') {
          queue.push({
            id: i.id || `insp-${Math.random()}`,
            prio: 'P1',
            title: `Regularizar Inspeção: ${i.nome || i.titulo || i.title || 'Pendente'}`,
            origem: 'Inspeções',
            resp: i.responsavel || i.inspector || 'Supervisor',
            prazo: i.data || i.date || 'Imediato',
            prazoOriginal: i.data || i.date || 'Imediato',
            status: 'Atrasada',
            proc: 'Finalizar',
            reasons: i.reasons || ['Rotina obrigatória pendente'],
            checklist: i.checklist || [],
            item_origem_id: i.id,
            item_origem_tipo: 'inspecao'
          });
        }
      });
    }

    // Sort order:
    // 1. P1
    // 2. Overdue / Atrasada
    // 3. Status Urgente
    // 4. P2, P3
    return queue.sort((a, b) => {
      if (a.prio === 'P1' && b.prio !== 'P1') return -1;
      if (b.prio === 'P1' && a.prio !== 'P1') return 1;
      if (a.status === 'Atrasada' && b.status !== 'Atrasada') return -1;
      if (b.status === 'Atrasada' && a.status !== 'Atrasada') return 1;
      if (a.status === 'Urgente' && b.status !== 'Urgente') return -1;
      if (b.status === 'Urgente' && a.status !== 'Urgente') return 1;
      if (a.prio === 'P2' && b.prio !== 'P2') return -1;
      if (b.prio === 'P2' && a.prio !== 'P2') return 1;
      return 0;
    });
  }
};

// ==================================================
// PRIORITIES EXTENSION FOR DECISION ENGINE
// ==================================================

export const LariContextEngine = {
  getRealtimeContext(state?: any) {
    const currentState = state || AppState.get();
    const today = new Date().toISOString().substring(0, 10);
    const isConcluido = (s: string) => s && s.toLowerCase().includes('conclu');
    const isResolvido = (s: string) => s && (s.toLowerCase().includes('resolvido') || s.toLowerCase().includes('mitigado'));
    
    // Calculate metrics
    const acoes = currentState.acoes || [];
    const inspecoes = currentState.inspecoes || [];
    const riscos = currentState.riscos || [];
    const checklists = currentState.checklists || [];
    const organization = currentState.organization || {};
    const rulePackages = currentState.rulePackages || [];

    // Organization data
    const orgName = organization.name || organization.razaoSocial || 'Não definida';
    const segmento = organization.segmento || 'Não definido';
    const atividadesCriticas = organization.atividadesCriticas || [];

    // Packages and NRs
    const pacotesAtivos = rulePackages.filter((p: any) => p.isActive).map((p: any) => p.name);
    const nrsAplicaveis = Array.from(new Set(riscos.map((r: any) => r.nr || r.nrRelacionada).filter(Boolean)));

    const activeAcoes = acoes.filter((a: any) => !isConcluido(a.status));
    const acoesAtrasadas = activeAcoes.filter((a: any) => a.prazo && a.prazo < today);
    const acoesPrazoHoje = activeAcoes.filter((a: any) => a.prazo && a.prazo.substring(0,10) === today);
    const acoesSemResponsavel = activeAcoes.filter((a: any) => !a.responsavel && !a.responsible);
    const acoesSemEvidencia = activeAcoes.filter((a: any) => a.exigeEvidencia && (!a.evidenciaUrl && !a.evidence));
    
    const activeRiscos = riscos.filter((r: any) => !isResolvido(r.status));
    const criticalRisks = activeRiscos.filter((r: any) => (r.nivel || r.level || '').toLowerCase() === 'crítico' || (r.nivel || r.level || '').toLowerCase() === 'critico');

    const totalMultaEstimada = activeRiscos.reduce((acc: number, r: any) => acc + (r.multaEstimadaMax || r.multaEstimada || 0), 0);
    const totalTrabalhadoresExpostos = activeRiscos.reduce((acc: number, r: any) => acc + (r.trabalhadoresExpostos || 0), 0);

    const activeInspecoes = inspecoes.filter((i: any) => !isConcluido(i.status) && !isConcluido(i.situacao));
    const inspecoesVencidas = activeInspecoes.filter((i: any) => {
        const d = i.data || i.date || i.dataPrevista;
        return d && d < today;
    });

    const activeChecklists = checklists.filter((c: any) => !isConcluido(c.status) && !isConcluido(c.situacao) && c.ativo !== false);
    const checklistsHoje = activeChecklists.filter((c: any) => {
        const d = c.proximaRevisao || c.data || c.dataPrevista;
        return d && d.substring(0,10) === today;
    });

    // Score Operational
    let operationalScore = 100;
    const penalty = criticalRisks.length * 3 + activeAcoes.length * 2 + acoesAtrasadas.length * 3 + activeInspecoes.length * 3;
    operationalScore = Math.max(0, operationalScore - penalty);

    // Setores mais expostos
    const sectors: Record<string, number> = {};
    activeRiscos.forEach((r: any) => {
        const s = r.setor || 'Geral';
        sectors[s] = (sectors[s] || 0) + ((r.nivel || r.level || '').toLowerCase() === 'crítico' ? 3 : 1);
    });
    const sortedSectors = Object.entries(sectors).sort((a,b) => b[1] - a[1]);
    const topSector = sortedSectors.length > 0 ? sortedSectors[0][0] : 'Geral';

    // Conformity
    const epi_records = currentState.epi_records || [];
    const validEpi = epi_records.filter((e: any) => e.status === 'conforme').length;
    const totalEpi = epi_records.length;
    const conformidade = totalEpi > 0 ? Math.round((validEpi / totalEpi) * 100) : 0;

    // Top 5 Recommendations
    const top5Recomendacoes = [
      ...(criticalRisks.length > 0 ? [`Proteger as ${totalTrabalhadoresExpostos} pessoas expostas em ${criticalRisks.length} riscos críticos`] : []),
      ...(acoesAtrasadas.length > 0 ? [`Concluir ${acoesAtrasadas.length} ações atrasadas`] : []),
      ...(acoesSemResponsavel.length > 0 ? [`Designar executor/validador em ${acoesSemResponsavel.length} ações`] : []),
      ...(inspecoesVencidas.length > 0 ? [`Realizar ${inspecoesVencidas.length} inspeções de campo vencidas`] : []),
      ...(totalMultaEstimada > 0 ? [`Evitar autuação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMultaEstimada)}`] : []),
      'Manter treinamentos e ASOs atualizados'
    ].slice(0, 5);

    // Proactive Alerts Gathering
    const alertasProativos: any[] = [];
    
    // 1 - Risco crítico sem validador
    const riscosCriticosSemValidador = criticalRisks.filter((r: any) => !r.validadorCorrecao || r.validadorCorrecao === 'Pendente designação');
    if (riscosCriticosSemValidador.length > 0) {
      alertasProativos.push({
        type: 'risco_sem_validador',
        title: 'Riscos críticos sem validação',
        context: `${riscosCriticosSemValidador.length} risco(s) crítico(s) não possuem validador designado.`,
        humanImpact: 'Pessoas continuam expostas porque ninguém está assegurando (dupla checagem) que a mitigação cumpre os requisitos reais de proteção.',
        operationalImpact: 'Falha de certificação. Multas da NR-28 podem ser aplicadas mesmo após a ação corretiva se ela não for validada por profissional habilitado.',
        recommendedAction: 'Designar um validador técnico imediatamente para revisão.',
        link: '/operacao/riscos',
      });
    }

    // 2 - Ação concluída sem evidência aceitável
    const acoesConcluidasSemEvidencia = acoes.filter((a: any) => isConcluido(a.status) && a.exigeEvidencia && (!a.evidenciaUrl && !a.evidence));
    if (acoesConcluidasSemEvidencia.length > 0) {
      alertasProativos.push({
        type: 'acao_sem_evidencia',
        title: 'Ações declaradas concluídas, mas sem evidência',
        context: `${acoesConcluidasSemEvidencia.length} ação(ões) registrada(s) como concluída(s), mas exigem anexo (ausente).`,
        humanImpact: 'Se a proteção não foi documentada visualmente, não há prova para a gestão de que a vida do trabalhador foi realmente protegida no campo.',
        operationalImpact: 'Gera falsa conformidade no painel executivo e não sustenta defesa em eventual auditoria MTE ou julgamento trabalhista.',
        recommendedAction: 'Anexar evidência fotográfica da barreira instalada e rejeitar status "concluída" até regularização.',
        link: '/operacao/acoes',
      });
    }

    // 3 - Pessoas expostas vinculadas a risco aberto
    if (totalTrabalhadoresExpostos > 0 && criticalRisks.length > 0) {
       alertasProativos.push({
        type: 'exposicao_ativa',
        title: 'Exposição humana não tratada',
        context: `${totalTrabalhadoresExpostos} pessoa(s) mapeada(s) vinculada(s) ativamente a ${criticalRisks.length} risco(s) crítico(s) ainda em aberto.`,
        humanImpact: 'Risco sistêmico iminente. A tolerância de operação nestas frentes significa colocar vidas diretamente em jogo.',
        operationalImpact: 'Violação da política de paralisação/recusa (NR-01) e alto passivo contingencial.',
        recommendedAction: 'Acionar paralisação das atividades associadas imediatamente ou mitigar os riscos na origem.',
        link: '/operacao/riscos',
      });
    }

    // 4 - Checklists/Inspeções atrasadas
    if (inspecoesVencidas.length > 0) {
       alertasProativos.push({
        type: 'inspecao_vencida',
        title: 'Rotina de prevenção corrompida',
        context: `Existem ${inspecoesVencidas.length} inspeção(ões) essenciais já fora do prazo regulamentar no sistema.`,
        humanImpact: 'A ausência da inspeção in loco significa que máquinas e ambientes perigosos estão sendo usados pelos trabalhadores de maneira "cega" e sem ateste técnico.',
        operationalImpact: 'Rompimento da matriz legal de prevenção e não cumprimento flagrante das NRs assumidas como aplicáveis para a operação.',
        recommendedAction: 'Remanejar vistoria urgente das máquinas e bloqueios para a equipe de SSO.',
        link: '/operacao/inspecoes',
      });
    }

    return {
      organizacao: orgName,
      segmento,
      atividadesCriticas,
      pacotesAtivos,
      nrsAplicaveis,
      checklistsAtivos: activeChecklists,
      multaEstimadaAberta: totalMultaEstimada,
      trabalhadoresExpostos: totalTrabalhadoresExpostos,
      acoesSemResponsavel: acoesSemResponsavel.length,
      acoesSemEvidencia: acoesSemEvidencia.length,
      criticalRisks: criticalRisks.length,
      acoesAtrasadas: acoesAtrasadas.length,
      acoesPrazoHoje: acoesPrazoHoje.length,
      inspecoesVencidas: inspecoesVencidas.length,
      inspecoesPendentes: activeInspecoes.length,
      checklistsHoje: checklistsHoje.length,
      operationalScore,
      conformidade,
      topSector,
      top5Recomendacoes,
      criticalRisksData: criticalRisks,
      acoesAtrasadasData: acoesAtrasadas,
      inspecoesVencidasData: inspecoesVencidas,
      checklistsAtivosData: activeChecklists,
      alertasProativos
    };
  },

  getContext() {
    return "Assistente L.A.R.I - Especialista em Saúde e Segunrança e Data Analysis.";
  },

  classifyIntent(message: string) {
    const text = message.toLowerCase();
    
    if (text.includes('nr') && (text.includes('aplicam') || text.includes('empresa') || text.includes('organização'))) {
      return 'Check_Applicable_NRS';
    }
    if (text.includes('checklist') && (text.includes('segmento') || text.includes('empresa') || text.includes('usar'))) {
      return 'Check_Applicable_Checklists';
    }
    if (text.includes('corrigir primeiro') || text.includes('prioriz')) {
      return 'Check_Top_Recommendations';
    }
    if (text.includes('multa') && (text.includes('estimada') || text.includes('aberto') || text.includes('risco'))) {
      return 'Check_Fines';
    }
    if (text.includes('altura') || text.includes('eletricidade') || text.includes('espaço confinado') || text.includes('nr')) {
      return 'Doubt_Normative';
    }
    if (text.includes('hoje') || text.includes('exige')) {
      return 'Check_Today';
    }
    if (text.includes('setor') || text.includes('área') || text.includes('exposição')) {
      return 'Check_Sectors';
    }
    if (text.includes('derrubou') || text.includes('score')) {
      return 'Check_Score';
    }
    if (text.includes('atrasado') || text.includes('atrasada') || text.includes('ação') || text.includes('acoes') || text.includes('vencid')) {
      return 'Check_Actions';
    }
    if (text.includes('inspeção') || text.includes('inspecoes') || text.includes('inspeçao')) {
      return 'Check_Inspections';
    }
    if (text.includes('risco') || text.includes('crítico') || text.includes('critico')) {
      return 'Check_Risks';
    }
    if (text.includes('valor') || text.includes('economia') || text.includes('economizar') || text.includes('financeiro') || text.includes('impacto')) {
      return 'Calculate_Impact';
    }
    if (text.includes('decisão') || text.includes('recomenda') || text.includes('sugere') || text.includes('o que fazer')) {
      return 'Get_Decision';
    }
    if (text.includes('pessoa') || text.includes('trabalhador') || text.includes('expost') || text.includes('equipe') || text.includes('vida')) {
      return 'Check_Exposed_Workers';
    }
    if (text.includes('relatório') || text.includes('resumo') || text.includes('executivo')) {
      return 'Get_Report';
    }
    return 'General';
  },

  respond(message: string, state: any = {}) {
    const currentState = Object.keys(state).length ? state : AppState.get();
    const text = message.toLowerCase();
    const intent = this.classifyIntent(text);
    const ctx = this.getRealtimeContext(currentState);

    // Greeting
    if (text.includes('oi') || text.includes('olá') || text.includes('ola lari') || text === 'oi lari') {
       return `Oi, eu sou a L.A.R.I. Sua Assistente de SST focada na proteção humana. Hoje acompanho a **${ctx.organizacao}** (${ctx.segmento}). Temos ${ctx.trabalhadoresExpostos} trabalhador(es) exposto(s) em ${ctx.criticalRisks} risco(s) crítico(s). O foco hoje deve ser a proteção imediata dessas vidas. Como posso te auxiliar?`;
    }
    
    if (intent === 'Check_Exposed_Workers') {
       if (ctx.trabalhadoresExpostos > 0) {
         return `Atualmente, temos **${ctx.trabalhadoresExpostos} trabalhador(es)** trabalhando em condições de risco emberto (Alto/Crítico). A prioridade deve ser designar executores para a mitigação das ações e validadores de segurança para ir a campo certificar de que esses ${ctx.trabalhadoresExpostos} colaboradores estão fora de perigo.`;
       }
       return `No momento, todas as suas operações estão seguras. Não há registro de exposição ativa de vida de trabalhadores a riscos emberto. A equipe operacional está em segurança.`;
    }

    if (intent === 'Check_Applicable_NRS') {
      if (ctx.nrsAplicaveis.length > 0) {
        return `As NRs aplicáveis mapeadas até o momento, devido aos seus riscos vigentes, são: **${ctx.nrsAplicaveis.join(', ')}**. A organização está no segmento de ${ctx.segmento} com atividades críticas em: ${ctx.atividadesCriticas.length > 0 ? ctx.atividadesCriticas.join(', ') : 'Nenhuma definida'}.`;
      }
      return `Atualmente a organização atua no setor de ${ctx.segmento}, mas como ainda não identificamos riscos específicos abertos com NR, a regra base padrão (NR-01, etc.) se aplica.`;
    }

    if (intent === 'Check_Applicable_Checklists') {
      if (ctx.checklistsAtivos.length > 0) {
        return `Temos ${ctx.checklistsAtivos.length} checklist(s) ativo(s) na base no momento, perfeitamente atrelados às NRs selecionadas para sua operação de ${ctx.segmento}. Ex: ${ctx.checklistsAtivos.map((c: any) => c.nome || c.titulo || 'Checklist Padrão').slice(0, 2).join(', ')}.`;
      }
      return `Atualmente, não vejo checklists prontos ou em uso para o contexto de ${ctx.segmento} em nossa base ativa. No momento, você pode ir em "Configurações" e vincular pacotes para gerar novos checklists automáticos para essa operação.`;
    }

    if (intent === 'Check_Fines') {
      if (ctx.multaEstimadaAberta > 0) {
        const strVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(ctx.multaEstimadaAberta);
        return `Para a empresa **${ctx.organizacao}**, o passivo acumulado por falhas que geraram riscos atinge o valor de **${strVal}** em eventuais autuações estipuladas pelas NRs detectadas. É essencial tratar os riscos para reduzir a zero.`;
      }
      return `No momento, não temos multas estimadas acumuladas por riscos em aberto. Sucesso total na operação!`;
    }

    if (intent === 'Check_Top_Recommendations') {
      const recList = ctx.top5Recomendacoes.map(r => `• ${r}`).join('\n');
      return `Aqui estão os principais pontos operacionais para tratar imediatamente na **${ctx.organizacao}**:\n\n${recList}`;
    }

    if (intent === 'Doubt_Normative') {
      const normMatch = NormativeEngine.detect(message);
      if (normMatch) {
         return `A atividade mencionada está relacionada à ${normMatch.nr} e apresenta risco principal de ${normMatch.riskType.toLowerCase()}. Você vai precisar de: ${normMatch.documents.join(', ')} e uso de EPIs como ${normMatch.ppe.join(', ')}. Sugiro: ${normMatch.recommendedAction}. Posso abrir uma ação ou checklist para isso se quiser.`;
      }
      return "Não consegui identificar a NR exata para essa atividade, mas posso te ajudar a registrar um risco ou procurar no banco de normas. Deseja qualificar o risco?";
    }

    if (intent === 'Check_Today') {
      return `Hoje temos ${ctx.acoesPrazoHoje} ações vencendo e ${ctx.checklistsHoje} checklists previstos para hoje. Além disso, atenção para ${ctx.criticalRisks} risco(s) crítico(s) ainda abertos, que exigem monitoramento contínuo.`;
    }

    if (intent === 'Check_Sectors') {
      return `Atualmente, o setor mais crítico é **${ctx.topSector}**, que concentra a maior quantidade de riscos ou itens de alta severidade reportados no sistema. Recomendo focar as inspeções nesta área.`;
    }

    if (intent === 'Check_Score') {
      return `Nosso Score Operacional atual é de ${ctx.operationalScore}. Os principais fatores que estão penalizando a nota são: ${ctx.criticalRisks} riscos críticos abertos, ${ctx.acoesAtrasadas} ações em atraso e ${ctx.inspecoesVencidas} inspeções vencidas. Resolver esses itens trará nossa nota de volta ao verde.`;
    }

    if (intent === 'Check_Actions') {
      if (ctx.acoesAtrasadas === 0) return "Parabéns, não localizei ações atrasadas na base no momento!";
      const firstAtrasada = ctx.acoesAtrasadasData[0];
      const desc = firstAtrasada ? ` (Ex: ${firstAtrasada.title || firstAtrasada.titulo})` : '';
      return `Localizei ${ctx.acoesAtrasadas} ações atrasadas na base${desc}. Dentre as ativas, temos ${ctx.acoesSemResponsavel} sem responsável atribuído e ${ctx.acoesSemEvidencia} faltando evidência fotográfica.`;
    }

    if (intent === 'Check_Inspections') {
      return `Neste momento, temos ${ctx.inspecoesVencidas} inspeções atrasadas e um total de ${ctx.inspecoesPendentes} inspeções ainda pendentes de conclusão no sistema.`;
    }

    if (intent === 'Check_Risks') {
      if (ctx.criticalRisks === 0) return "Ótima notícia! No momento, nossa base não possui riscos críticos em aberto.";
      const firstRisco = ctx.criticalRisksData[0];
      const descR = firstRisco ? ` - atenção para: ${firstRisco.title || firstRisco.titulo || firstRisco.atividade}` : '';
      return `Temos ${ctx.criticalRisks} risco(s) crítico(s) ativos${descR}. A intervenção imediata nas atividades atreladas a estes riscos é mandatória para evitar paralisações.`;
    }

    if (intent === 'Calculate_Impact') {
      const estimate = EconomicImpactEngine.estimate({ severityLevel: 'crítico', exposedPeople: 3, recurrence: true });
      return `Em termos financeiros, tratar nossos maiores riscos e ações atrasadas previne um custo possível de ${EconomicImpactEngine.formatCurrency(estimate.min)} a ${EconomicImpactEngine.formatCurrency(estimate.max)}.\n\nLembrando que é uma estimativa preventiva. O valor final pode depender de FAP, autuações e outros fatores contextuais. Vale a pena mitigar agora!`;
    }

    if (intent === 'Get_Decision') {
      const decision = DecisionEngine.getMainDecision(currentState);
      return `Baseada nos dados atuais (Score: ${ctx.operationalScore}, Resolutividade EPI: ${ctx.conformidade}%): ${decision.title}.\n\nRecomendo: ${decision.decision}\n\nMotivo: ${decision.reason}`;
    }

    if (intent === 'Get_Report') {
      return `Aqui está o resumo executivo:\n- Organização: ${ctx.organizacao} (${ctx.segmento})\n- Score atual: ${ctx.operationalScore}\n- Conformidade EPI: ${ctx.conformidade}%\n- Riscos Críticos: ${ctx.criticalRisks}\n- Multa Estimada Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(ctx.multaEstimadaAberta)}\n- Ações em Atraso: ${ctx.acoesAtrasadas}\n- Inspeções Pendentes: ${ctx.inspecoesPendentes}\n- Setor de maior atenção: ${ctx.topSector}\n\nIsso tem um peso na nossa exposição a multas e passivos trabalhistas.`;
    }

    return `Entendi o seu ponto. Sou treinada no contexto da ${ctx.organizacao}. Posso listar recomendações, riscos por setor, as ações sem evidência e até mesmo o passivo em aberto. Pode perguntar algo mais específico!`;
  }
};

// Attach to window for global access if in browser environment
if (typeof window !== 'undefined') {
  (window as any).NormativeEngine = NormativeEngine;
  (window as any).RiskEngine = RiskEngine;
  (window as any).InspectionEngine = InspectionEngine;
  (window as any).ActionEngine = ActionEngine;
  (window as any).EconomicImpactEngine = EconomicImpactEngine;
  (window as any).DecisionEngine = DecisionEngine;
  (window as any).LariContextEngine = LariContextEngine;
}
