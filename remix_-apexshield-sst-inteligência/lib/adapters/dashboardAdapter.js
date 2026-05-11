/**
 * dashboardAdapter
 * ----------------
 * Adapter de Dashboard: agrega métricas do estado para alimentar o
 * `FlowDashboard` (componentes/dashboard/FlowDashboard.tsx) e a central.
 *
 * Hoje o `FlowDashboard.tsx` consome `useAppStore` direto. Este adapter
 * existe pra dar um ponto canônico de derivação — futuras telas / CLIs /
 * relatórios usam daqui em vez de duplicar o cálculo.
 */

import { useAppStore } from '../store';
import { calculateDashboardMetrics } from '../dashboardMetrics';
import { LariContextEngine, EconomicImpactEngine } from '../engines';
import { setorMaisCritico, rankingSetores } from '../motor/sectorEngine';
import { acoesConcluidasSemEvidencia } from '../motor/evidenceEngine';

export {
  useAppStore,
  calculateDashboardMetrics,
  LariContextEngine,
  EconomicImpactEngine,
  setorMaisCritico,
  rankingSetores,
};

/**
 * Snapshot pronto pra cards do dashboard.
 * Faz a leitura do store **uma vez** e devolve um objeto simples.
 *
 * @returns {{
 *   scoreOperacional: number,
 *   conformidade: number,
 *   criticalRisks: number,
 *   acoesAtrasadas: number,
 *   inspecoesPendentes: number,
 *   trabalhadoresExpostos: number,
 *   multaEvitada: number,
 *   multaEstimadaAberta: number,
 *   setorMaisCritico: string,
 *   top5Recomendacoes: string[],
 *   acoesSemEvidencia: number
 * }}
 */
export function snapshotDashboard() {
  if (typeof window === 'undefined') {
    return {
      scoreOperacional: 100,
      conformidade: 0,
      criticalRisks: 0,
      acoesAtrasadas: 0,
      inspecoesPendentes: 0,
      trabalhadoresExpostos: 0,
      multaEvitada: 0,
      multaEstimadaAberta: 0,
      setorMaisCritico: 'Geral',
      top5Recomendacoes: [],
      acoesSemEvidencia: 0,
    };
  }
  const ctx = LariContextEngine.getRealtimeContext(useAppStore.getState());
  const acoesSemEvid = acoesConcluidasSemEvidencia(useAppStore.getState().acoes || []).length;
  return {
    scoreOperacional: ctx.operationalScore,
    conformidade: ctx.conformidade,
    criticalRisks: ctx.criticalRisks,
    acoesAtrasadas: ctx.acoesAtrasadas,
    inspecoesPendentes: ctx.inspecoesPendentes,
    trabalhadoresExpostos: ctx.trabalhadoresExpostos,
    multaEvitada: 0, // calculado em motor/page.tsx, não exposto pelo LariContext.
    multaEstimadaAberta: ctx.multaEstimadaAberta,
    setorMaisCritico: ctx.topSector,
    top5Recomendacoes: ctx.top5Recomendacoes || [],
    acoesSemEvidencia: acoesSemEvid,
  };
}

/**
 * Agrega multa evitada (riscos mitigados) e multa estimada em aberto.
 * @returns {{ evitada: number, estimadaAberta: number }}
 */
export function multas() {
  if (typeof window === 'undefined') return { evitada: 0, estimadaAberta: 0 };
  const riscos = useAppStore.getState().riscos || [];
  let evitada = 0, estimadaAberta = 0;
  for (const r of riscos) {
    const valor = Number(r?.multaEstimada) || 0;
    if (r?.status === 'Mitigado' || r?.status === 'Resolvido') evitada += valor;
    else estimadaAberta += valor;
  }
  return { evitada, estimadaAberta };
}
