import { NormativeEngine } from './engines';
import { FineEngine } from './fineEngine';

export type NivelRisco = 'Crítico' | 'Alto' | 'Médio' | 'Baixo';

export type RiskInstance = {
  id: string;
  titulo?: string;
  atividade: string;
  setor: string;
  nr: string;
  nrRelacionada?: string;
  regraId?: string;
  regraTitulo?: string;
  regraFixa?: boolean;
  
  tipoDeRisco: string;
  gravidade: string;
  severidade?: string;
  probabilidade: string;

  hasEpiEpc: boolean;
  hasTreinamento: boolean;
  hasProcedimento: boolean;
  
  nivel: NivelRisco;
  prioridade: string;
  problemaPrincipal?: string;
  acaoRecomendada?: string;
  acaoVinculada?: string;
  prazo?: string;
  responsavel?: string;
  status?: string;
  origem?: string;
  justificativa?: string;
  dataLancamento?: string;
  checklistOrigem?: string;
  perguntaOrigem?: string;
  respostaOrigem?: string;
  explicacaoNormativa?: string;
  evidencias?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  multaEstimada?: number;
  faixaMulta?: string;
  chanceIncidente?: number;
  impactoOperacional?: string;
  impactoScore?: number;
  nivelConformidade?: string;
  justificativaMulta?: string;
  justificativaIncidente?: string;
  fatoresDeCalculo?: string[];
  recorrenciaHistorica?: number;

  inspection_id?: string;
  inspection_name?: string;
  inspection_date?: string;
  non_compliant_item?: string;
  checklist_item_id?: string;
  checklistId?: string;
  pacote?: string;
  riscoId?: string;
  inspecaoId?: string;
  perguntaId?: string;
  item_origem_id?: string;
  item_origem_tipo?: string;

  // PESSOA NO CENTRO
  trabalhadoresExpostos?: number;
  perfilExposto?: string; // e.g. "Equipe de Manutenção", "Operador de Empilhadeira"
  impactoHumano?: string; // Descrição do dano à pessoa
  executorCorrecao?: string; // Quem coloca a mão na massa
  validadorCorrecao?: string; // Quem atesta que ficou seguro

  // RASTREABILIDADE TOTAL E VALIDAÇÃO (Destino final)
  evidenciasVinculadas?: { id: string; url: string; tipo: string; contexto: string }[];
  decisaoFinal?: {
    validador: string;
    data: string;
    resultado: 'Risco Mitigado' | 'Risco Aceito' | 'Risco Transferido' | 'Necessita Nova Avaliação';
    baseadoEm: string; // Ex: "Ação #act-123 concluída" ou "Evidências Fotográficas"
    assinatura?: string;
  };
};

export function gerarExplicacaoNormativa(nrRelacionada: string | undefined, respostaOrigem: string | undefined, checklistName: string | undefined): string {
  if (!nrRelacionada) return "Este risco foi gerado a partir de uma não conformidade no checklist.";
  const nr = nrRelacionada.toUpperCase();
  if (nr === 'NR-35') {
    return "Este risco foi gerado com base na NR-35 porque a resposta do checklist indicou ausência de proteção ou controle em atividade de trabalho em altura.";
  } else if (nr === 'NR-12') {
    return "Este risco foi classificado com base na NR-12 porque foi identificada máquina com zona de risco acessível sem proteção adequada.";
  } else if (nr === 'NR-06') {
    return "Este risco foi gerado com base na NR-06 porque foi identificada ausência ou uso inadequado de EPI obrigatório.";
  } else if (nr === 'NR-10') {
    return "Este risco foi gerado com base na NR-10 porque foi identificada atividade elétrica sem controle adequado de energia ou sinalização.";
  } else if (nr === 'NR-33') {
    return "Este risco foi gerado com base na NR-33 porque houve não conformidade em entrada, monitoramento ou resgate em espaço confinado.";
  } else if (nr === 'NR-01') {
    return "Este risco foi gerado com base na NR-01 porque a resposta do checklist evidenciou falhas na identificação, avaliação ou controle de perigos.";
  } else if (nr === 'NR-11') {
    return "Este risco foi gerado com base na NR-11 porque houve falha em procedimento, capacitação ou controle na movimentação de materiais.";
  } else if (nr === 'NR-18') {
    return "Este risco foi gerado com base na NR-18 devido a não conformidades em proteções coletivas, andaimes ou organização de canteiro de obras.";
  } else if (nr === 'NR-20') {
    return "Este risco foi gerado com base na NR-20 por armazenamento inadequado de inflamáveis, fontes de ignição ou falta de procedimentos.";
  } else if (nr === 'NR-23') {
    return "Este risco foi gerado com base na NR-23 devido a obstruções ou ausência de rotas de fuga, alarmes e extintores de emergência.";
  } else if (nr === 'NR-26') {
    return "Este risco foi gerado com base na NR-26 devido à falta de FISPQ, rotulagem ou sinalização inadequada de controle de produtos químicos.";
  } else if (nr === 'NR-17') {
    return "Este risco foi gerado com base na NR-17 por inadequação no posto de trabalho, esforço físico ou postura ergonômica inadequada.";
  }
  return `Este risco foi gerado com base na ${nr} porque a resposta do checklist indicou não conformidade na inspeção.`;
}

export function calcularPrioridade(nr: string, severidade: string, atividade: string, respostaChecklist?: string): string {
  let prioridade = severidade;
  const lowerAtividade = atividade?.toLowerCase() || '';
  const lowerSeveridade = severidade?.toLowerCase() || '';

  if (lowerSeveridade === 'crítica' || lowerSeveridade === 'critica' || lowerSeveridade === 'fatal') prioridade = 'Crítica';
  else if (lowerSeveridade === 'alta' || lowerSeveridade === 'grave') prioridade = 'Alta';
  else if (lowerSeveridade === 'média' || lowerSeveridade === 'media' || lowerSeveridade === 'moderada') prioridade = 'Média';
  else if (lowerSeveridade === 'baixa') prioridade = 'Baixa';

  const nrNum = nr?.toUpperCase()?.replace('NR-', '');

  if (nrNum === '35' || lowerAtividade.includes('altura')) {
    if (prioridade !== 'Crítica') prioridade = 'Alta';
    if (respostaChecklist && respostaChecklist.toLowerCase().includes('exposição direta')) prioridade = 'Crítica';
  } else if (nrNum === '10' || lowerAtividade.includes('elétrica') || lowerAtividade.includes('eletrica')) {
    if (prioridade !== 'Crítica') prioridade = 'Alta';
    if (respostaChecklist && respostaChecklist.toLowerCase().includes('choque')) prioridade = 'Crítica';
  } else if (nrNum === '33' || lowerAtividade.includes('confinado')) {
    prioridade = 'Crítica';
  } else if (nrNum === '12' || lowerAtividade.includes('máquina') || lowerAtividade.includes('maquina')) {
    if (prioridade !== 'Crítica') prioridade = 'Alta';
  } else if (nrNum === '06' || lowerAtividade.includes('epi')) {
    if (['altura', 'elétrica', 'eletrica', 'confinado', 'máquina', 'maquina', 'químico', 'quimico'].some(k => lowerAtividade.includes(k))) {
       if (prioridade !== 'Crítica') prioridade = 'Alta';
    }
  } else if (nrNum === '26' || lowerAtividade.includes('químico') || lowerAtividade.includes('quimico')) {
    if (['baixa'].includes(prioridade.toLowerCase())) prioridade = 'Média';
    if (respostaChecklist && respostaChecklist.toLowerCase().includes('exposição direta')) prioridade = 'Crítica';
  } else if (nrNum === '17' || lowerAtividade.includes('ergonom')) {
    prioridade = 'Média';
  }

  return prioridade;
}

export function calcularPrazo(prioridade: string, severidade: string): string {
  const p = prioridade.toLowerCase();
  if (p === 'crítica' || p === 'critica' || p === 'p1') {
    return 'Imediato (até 24h)';
  } else if (p === 'alta' || p === 'p2') {
    return 'Até 3 dias';
  } else if (p === 'média' || p === 'media' || p === 'p3') {
    return 'Até 7 dias';
  } else {
    return 'Até 30 dias';
  }
}

export function calcularMultaEstimada(risco: Partial<RiskInstance>) {
  let estimado = 0;
  let faixa = '';
  
  const p = (risco.prioridade || risco.severidade || risco.nivel || 'Baixa').toLowerCase();
  
  if (p.includes('crític') || p === 'p1') {
    estimado = 50000;
    faixa = 'R$ 20.000 a R$ 100.000';
  } else if (p.includes('alt') || p === 'p2') {
    estimado = 12000;
    faixa = 'R$ 5.000 a R$ 25.000';
  } else if (p.includes('médi') || p.includes('medi') || p === 'p3') {
    estimado = 4000;
    faixa = 'R$ 1.000 a R$ 8.000';
  } else {
    estimado = 800;
    faixa = 'R$ 300 a R$ 2.000';
  }

  const nrNum = risco.nr?.toUpperCase()?.replace('NR-', '');
  if (['10', '12', '33', '35'].includes(nrNum || '')) estimado *= 1.30;
  if (!risco.hasEpiEpc) estimado *= 1.15;
  if (risco.status?.toLowerCase() === 'vencido') estimado *= 1.25;
  if (!risco.acaoVinculada) estimado *= 1.10;
  
  if (risco.recorrenciaHistorica) estimado *= (1 + Math.min(0.5, risco.recorrenciaHistorica * 0.1));
  
  return { multaEstimada: Math.round(estimado), faixaMulta: faixa };
}

export function calcularChanceIncidente(risco: Partial<RiskInstance>): number {
  let chance = 15;
  const p = (risco.prioridade || risco.severidade || risco.nivel || 'Baixa').toLowerCase();
  
  if (p.includes('crític') || p === 'p1') chance = 80;
  else if (p.includes('alt') || p === 'p2') chance = 60;
  else if (p.includes('médi') || p.includes('medi') || p === 'p3') chance = 35;

  const lowerAtividade = risco.atividade?.toLowerCase() || '';
  if (lowerAtividade.includes('altura')) chance += 10;
  if (lowerAtividade.includes('elétrica') || lowerAtividade.includes('eletrica')) chance += 10;
  if (lowerAtividade.includes('confinado')) chance += 15;
  if (lowerAtividade.includes('máquina') || lowerAtividade.includes('maquina')) chance += 8;
  if (lowerAtividade.includes('químico') || lowerAtividade.includes('quimico')) chance += 8;
  
  if (!risco.hasEpiEpc) chance += 10; 
  if (risco.status?.toLowerCase() === 'vencido') chance += 10;
  if (!risco.responsavel) chance += 5;
  if (!risco.acaoVinculada) chance += 5;
  if (risco.recorrenciaHistorica) chance += Math.min(20, risco.recorrenciaHistorica * 5);

  return Math.min(100, Math.max(0, chance));
}

export function calcularImpactoOperacional(risco: Partial<RiskInstance>, chance: number, multa: number): string {
  const p = (risco.prioridade || risco.severidade || risco.nivel || 'Baixo').toLowerCase();
  if (p.includes('crític') || chance > 75 || multa > 30000 || (risco.status === 'Vencido' && !risco.acaoVinculada)) {
    return 'Crítico';
  } else if (p.includes('alt') || (chance >= 50 && chance <= 75) || (multa >= 10000 && multa <= 30000)) {
    return 'Alto';
  } else if (p.includes('médi') || p.includes('medi') || (chance >= 25 && chance <= 49) || (multa >= 2000 && multa <= 10000)) {
    return 'Médio';
  } else {
    return 'Baixo';
  }
}

export function calcularNivelConformidade(risco: Partial<RiskInstance>): string {
  const isResolvido = risco.status?.toLowerCase() === 'resolvido' || risco.status?.toLowerCase() === 'mitigado';
  const hasAcao = !!risco.acaoVinculada;
  const p = (risco.prioridade || risco.severidade || risco.nivel || 'Baixo').toLowerCase();

  if (isResolvido && hasAcao) return 'Conforme';
  
  if (p.includes('crític') || risco.status === 'Vencido' || (!risco.hasEpiEpc) || (!risco.responsavel) || (!hasAcao)) {
    if (p.includes('crític')) return 'Não conforme crítico';
    return 'Não conforme';
  }
  
  if (p.includes('alt') && !hasAcao) return 'Não conforme';
  
  if (hasAcao && risco.status !== 'Vencido') return 'Atenção';
  
  return 'Não conforme';
}

export function applyManualRules(payload: Partial<RiskInstance>): RiskInstance {
  const prioridade = calcularPrioridade(payload.nr || '', payload.severidade || 'Média', payload.atividade || '', payload.respostaOrigem);
  const nivel = ((prioridade === 'Crítica' || prioridade === 'P1') ? 'Crítico' : 
                (prioridade === 'Alta' || prioridade === 'P2') ? 'Alto' : 
                (prioridade === 'Média' || prioridade === 'P3') ? 'Médio' : 'Baixo') as NivelRisco;
  const prazo = calcularPrazo(prioridade, payload.severidade || '');
  
  const tempRisco = { ...payload, prioridade, nivel };
  
  // Use FineEngine for estimated range
  const nrName = payload.nr || 'NR-01';
  const fineEstimate = FineEngine.calcularFaixaMulta({
    nr: nrName,
    criticidade: nivel,
    numeroEmpregados: 50, // Default for manual application
    tipoInfracao: nrName.includes('NR-07') || nrName.includes('NR-09') || nrName.includes('NR-32') ? 'Medicina' : 'Segurança'
  });

  const { multaEstimada, faixaMulta } = calcularMultaEstimada(tempRisco);
  const chanceIncidente = calcularChanceIncidente(tempRisco);
  const impactoOperacional = calcularImpactoOperacional(tempRisco, chanceIncidente, multaEstimada);
  const nivelConformidade = calcularNivelConformidade(tempRisco);

  return {
    ...payload,
    id: payload.id || crypto.randomUUID(),
    titulo: payload.titulo || 'Risco não especificado',
    atividade: payload.atividade || 'Não especificada',
    setor: payload.setor || 'Não especificado',
    nr: payload.nr || 'Não definida',
    severidade: payload.severidade || 'Média',
    prioridade,
    nivel,
    prazo,
    status: payload.status || 'Aberto',
    origem: payload.origem || 'Manual',
    tipoDeRisco: payload.tipoDeRisco || 'Não especificado',
    gravidade: payload.severidade || 'Média',
    probabilidade: payload.probabilidade || 'Baixa',
    hasEpiEpc: payload.hasEpiEpc ?? true,
    hasTreinamento: payload.hasTreinamento ?? true,
    hasProcedimento: payload.hasProcedimento ?? true,
    dataLancamento: payload.dataLancamento || new Date().toISOString().split('T')[0],
    criadoEm: payload.criadoEm || new Date().toISOString(),
    multaEstimada,
    faixaMulta,
    multaEstimativaMin: fineEstimate.minimoEstimado,
    multaEstimativaMax: fineEstimate.maximoEstimado,
    faixaMultaLabel: fineEstimate.faixaLabel,
    baseMulta: fineEstimate.baseLegal,
    disclaimerMulta: fineEstimate.disclaimer,
    chanceIncidente,
    impactoOperacional,
    nivelConformidade,
    justificativaMulta: "Cálculo baseado em análise da NR, prioridade do risco, histórico e itens de segurança (EPIs/EPCs) no ambiente. " + fineEstimate.disclaimer,
    justificativaIncidente: "Estimativa baseada em tipo de atividade, severidade, falta de proteção individual/coletiva e histórico de resolução.",
    fatoresDeCalculo: ["Criticidade da NR", "Falta de EPI/EPC", "Severidade " + (payload.severidade || 'Média'), "Porte estimado (50 emp.)"]
  } as RiskInstance;
}

export function getNrMetrics({ inspections, risks, actions }: { inspections: any[], risks: any[], actions: any[] }) {
  const metrics: Record<string, {
    nr: string;
    totalNaoConformidades: number;
    totalRiscos: number;
    totalAcoes: number;
    riscosCriticos: number;
    multaEstimada: number;
    chanceMediaIncidente: number;
    scoreImpactado: number;
    acoesPendentes: number;
    acoesConcluidas: number;
    _chanceSum: number;
  }> = {};

  const getMetric = (nrName: string) => {
    if (!metrics[nrName]) {
      metrics[nrName] = {
        nr: nrName,
        totalNaoConformidades: 0,
        totalRiscos: 0,
        totalAcoes: 0,
        riscosCriticos: 0,
        multaEstimada: 0,
        chanceMediaIncidente: 0,
        scoreImpactado: 0,
        acoesPendentes: 0,
        acoesConcluidas: 0,
        _chanceSum: 0
      };
    }
    return metrics[nrName];
  };

  // Process risks
  risks.forEach((r: any) => {
    const nrName = r.nrRelacionada || r.nr;
    if (!nrName) return;
    const m = getMetric(nrName);
    m.totalRiscos += 1;
    if ((r.nivel || r.prioridade || '').toLowerCase().includes('crític') || r.severidade === 'Crítica') {
      m.riscosCriticos += 1;
    }
    m.multaEstimada += (r.multaEstimada || 0);
    const chance = r.chanceIncidente || 0;
    m._chanceSum += chance;
    m.chanceMediaIncidente = Math.round(m._chanceSum / m.totalRiscos);
    
    if (r.impactoScore) {
       m.scoreImpactado += r.impactoScore;
    } else if (r.regraFixa) {
       // fallback estimate impact
       m.scoreImpactado += (r.severidade === 'Crítica' ? 10 : r.severidade === 'Alta' ? 5 : 2);
    }
  });

  // Process actions
  actions.forEach((a: any) => {
    const nrName = a.nrRelacionada || (a.riscoVinculado ? risks.find((r: any) => r.id === a.riscoId)?.nrRelacionada || risks.find((r: any) => r.id === a.riscoId)?.nr : undefined);
    if (!nrName) return;
    const m = getMetric(nrName);
    m.totalAcoes += 1;
    if (a.status === 'Concluída') {
      m.acoesConcluidas += 1;
    } else {
      m.acoesPendentes += 1;
    }
  });

  // Process Inspections (to count exact non conformities related to NRs)
  inspections.forEach((insp: any) => {
     (insp.items || []).forEach((item: any) => {
        if ((item.status === 'Não' || item.status === 'Parcialmente') && (item.nrRelacionada || item.regraFixa)) {
           const nrName = item.nrRelacionada;
           if (nrName) {
              const m = getMetric(nrName);
              m.totalNaoConformidades += 1;
           }
        }
     });
  });

  return Object.values(metrics);
}

export function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value}`;
}
