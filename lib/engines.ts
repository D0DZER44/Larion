// lib/engines.ts

import { useAppStore, AppState } from './store';

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
    let bestMatch: any = null;
    let maxMatches = 0;
    let matchedKeywords: string[] = [];

    this.rules.forEach(rule => {
      const matches = rule.keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        if (matches.length > maxMatches) {
          maxMatches = matches.length;
          bestMatch = rule;
          matchedKeywords = matches;
        }
      }
    });

    if (bestMatch) {
      return {
        ...bestMatch,
        confidence: maxMatches > 1 ? 'alta' : 'média',
        matchedKeywords
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
  getContext() {
    return "Assistente L.A.R.I - Especialista em Saúde e Segunrança e Data Analysis.";
  },

  classifyIntent(message: string) {
    const text = message.toLowerCase();
    if (text.includes('altura') || text.includes('eletricidade') || text.includes('espaço confinado') || text.includes('nr')) {
      return 'Doubt_Normative';
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
    if (text.includes('valor') || text.includes('multa') || text.includes('economia') || text.includes('economizar') || text.includes('financeiro') || text.includes('impacto')) {
      return 'Calculate_Impact';
    }
    if (text.includes('decisão') || text.includes('recomenda') || text.includes('sugere') || text.includes('o que fazer')) {
      return 'Get_Decision';
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
    
    // Greeting
    if (text.includes('oi') || text.includes('olá') || text.includes('ola lari') || text === 'oi lari') {
       return "Oi, eu sou a L.A.R.I. Sua Assistente Operacional de Saúde e Segurança do Trabalho. Eu te ajudo a entender riscos, ações, inspeções e relatórios de forma prática. Em que posso te ajudar hoje?";
    }

    if (intent === 'Doubt_Normative') {
      const normMatch = NormativeEngine.detect(message);
      if (normMatch) {
         return `A atividade mencionada está relacionada à ${normMatch.nr} e apresenta risco principal de ${normMatch.riskType.toLowerCase()}. Você vai precisar de: ${normMatch.documents.join(', ')} e uso de EPIs como ${normMatch.ppe.join(', ')}. Sugiro: ${normMatch.recommendedAction}. Posso abrir uma ação ou checklist para isso se quiser.`;
      }
      return "Não consegui identificar a NR exata para essa atividade, mas posso te ajudar a registrar um risco ou procurar no banco de normas. Deseja qualificar o risco?";
    }

    if (intent === 'Check_Actions') {
      return "Localizei 18 ações atrasadas na base. A mais crítica no momento é a troca do mangote de exaustão na Solda 02, que precisa ser tratada imediatamente para conter o risco associado.";
    }

    if (intent === 'Check_Inspections') {
      return "Neste momento, temos 12 inspeções atrasadas e cerca de 53 programadas. O foco deve estar nas inspeções de Trabalho em Altura que estão vencidas desde a semana passada na área de Manutenção.";
    }

    if (intent === 'Check_Risks') {
      return "Temos 7 riscos críticos ativos e 24 riscos altos. A atenção imediata deve ir para a 'Prensa Hidráulica 03' (Esmagamento), onde a exposição afeta 2 funcionários e está sem PCMSO liberado.";
    }

    if (intent === 'Calculate_Impact') {
      const estimate = EconomicImpactEngine.estimate({ severityLevel: 'crítico', exposedPeople: 3, recurrence: true });
      return `Em termos financeiros, tratar nossos maiores riscos previne um custo possível de ${EconomicImpactEngine.formatCurrency(estimate.min)} a ${EconomicImpactEngine.formatCurrency(estimate.max)}.\n\nLembrando que é uma estimativa preventiva. O valor final pode depender de FAP, autuações e outros fatores contextuais. Vale a pena mitigar agora!`;
    }

    if (intent === 'Get_Decision') {
      const decision = DecisionEngine.getMainDecision(currentState);
      return `Baseada nos dados atuais: ${decision.title}.\n\nRecomendo: ${decision.decision}\n\nMotivo: ${decision.reason}`;
    }

    if (intent === 'Get_Report') {
      return "Vou compilar seu relatório mensal agora. Detectei que fechamos 89% das ações este mês, porém nosso volume de inspeções vencidas subiu 16%. Isso aumenta a nossa exposição ao risco crítico.";
    }

    return "Compreendo. Posso te ajudar com os dados locais ou a analisar o impacto atrelado a essa atividade. O que prefere?";
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
