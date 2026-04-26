// lib/engines.ts

import { useAppStore } from './store';

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
      id: `act-${Date.now()}`,
      titulo: `Mitigar Risco: ${risk.titulo}`,
      riscoId: risk.id,
      prioridade: risk.nivel === 'Crítico' ? 'Urgente' : 'Alta',
      status: 'Em aberto',
      progresso: 0
    };
  },

  createFromInspection(inspection: any) {
    return {
      id: `act-insp-${Date.now()}`,
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
  getMainDecision(state: any) {
    const overdueCount = state?.acoes?.filter((a: any) => ActionEngine.isOverdue(a)).length || 18;
    const criticalRisksCount = state?.riscos?.filter((r: any) => r.nivel === 'Crítico').length || 7;
    const pendingInspections = state?.inspecoes?.filter((i: any) => i.status === 'Atrasada' || i.status === 'Pendente').length || 12;

    if (overdueCount > 0 && criticalRisksCount > 0) {
      return {
        title: 'Intervenção Crítica Necessária',
        decision: 'Priorizar o fechamento das ações atrasadas ligadas a riscos críticos nas próximas 24 horas.',
        reason: 'Acúmulo de atrasos em ambientes de alta criticidade aumenta exponencialmente a probabilidade de autuação e acidentes.',
        operationalImpact: 'Alto',
        confidence: '95%',
        evidences: [`${overdueCount} ações atrasadas`, `${criticalRisksCount} riscos críticos não mitigados`, `${pendingInspections} inspeções pendentes na área produtiva`],
        timeline: 'Imediato (0-24h)',
        nextSteps: [
          'Verificar prioridades no painel de Ações', 
          'Acionar responsáveis diretos via sistema',
          'Executar bloqueio LOTO em máquinas com risco iminente'
        ],
        causeAndEffect: {
          causes: ['Acúmulo de inspeções pendentes', 'Falta de tratativa nas ações'],
          effect: 'Riscos Críticos Elevados e Passivo Trabalhista',
        }
      };
    }

    return {
      title: 'Status Estável Pleno',
      decision: 'Nenhuma decisão crítica agora. Sistema em monitoramento preventivo.',
      reason: 'As principais métricas de compliance e relatórios estão dentro do tolerável e não há backlog severo registrado nas últimas 48h.',
      operationalImpact: 'Baixo',
      confidence: '92%',
      evidences: ['Ausência de riscos críticos descontrolados', 'Ações operacionais dentro do prazo estipulado'],
      timeline: 'Longo Prazo',
      nextSteps: ['Continuar monitoramento preventivo', 'Validar evidências de EPC periodicamente'],
      causeAndEffect: {
        causes: ['Manutenção preventiva em dia', 'Uso adequado de EPI'],
        effect: 'Operação Segura e em Conformidade',
      }
    };
  },

  getEvidence(state: any) {
    return "Evidências extraídas do cérebro de dados (AppState).";
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
// LARI CONTEXT ENGINE
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
      const decision = DecisionEngine.getMainDecision(state);
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
