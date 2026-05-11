/**
 * reportsAdapter
 * --------------
 * Adapter de Relatórios: prepara payload pra `FlowReportsPage` e (V2) export
 * PDF/Excel.
 *
 * Hoje `FlowReportsPage.tsx` consome o store direto. Este adapter expõe um
 * "snapshot de relatório" derivado do dashboard + filtros — pronto pra usar
 * em CLIs e em futura rota `/api/v1/relatorios`.
 */

import { useAppStore } from '../store';
import { snapshotDashboard, multas } from './dashboardAdapter';

export { useAppStore, snapshotDashboard, multas };

/**
 * Gera um payload de relatório executivo para um período.
 *
 * @param {{ inicio?: string, fim?: string }} [filtro]
 * @returns {{
 *   periodoInicio: string,
 *   periodoFim: string,
 *   scoreOperacional: number,
 *   riscosCriticosAbertos: number,
 *   acoesAtrasadas: number,
 *   inspecoesPendentes: number,
 *   multaEvitada: number,
 *   multaEstimadaAberta: number,
 *   setorMaisCritico: string,
 *   top5Recomendacoes: string[],
 *   geradoEm: string
 * }}
 */
export function relatorioExecutivo(filtro) {
  const inicio = filtro?.inicio || '';
  const fim = filtro?.fim || '';
  const snap = snapshotDashboard();
  const m = multas();
  return {
    periodoInicio: inicio,
    periodoFim: fim,
    scoreOperacional: snap.scoreOperacional,
    riscosCriticosAbertos: snap.criticalRisks,
    acoesAtrasadas: snap.acoesAtrasadas,
    inspecoesPendentes: snap.inspecoesPendentes,
    multaEvitada: m.evitada,
    multaEstimadaAberta: m.estimadaAberta,
    setorMaisCritico: snap.setorMaisCritico,
    top5Recomendacoes: snap.top5Recomendacoes,
    geradoEm: new Date().toISOString(),
  };
}

/**
 * Lista mínima de eventos (logs) para um relatório de auditoria.
 *
 * @param {{ limite?: number }} [opts]
 * @returns {Array<{ id: string, descricao: string, criadoEm: string }>}
 */
export function timelineAuditoria(opts) {
  if (typeof window === 'undefined') return [];
  const logs = useAppStore.getState().logs || [];
  const limite = Math.max(1, Number(opts?.limite) || 50);
  return [...logs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limite)
    .map(l => ({
      id: l.id,
      descricao: l.description,
      criadoEm: l.created_at,
    }));
}
