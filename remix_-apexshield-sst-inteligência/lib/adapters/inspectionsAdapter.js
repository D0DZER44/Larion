/**
 * inspectionsAdapter
 * ------------------
 * Conecta o visual atual (pages/components que falam com o Zustand) ao motor
 * organizado em `/lib/motor`. Nada quebra: adapters só re-exportam o que já
 * existe e oferecem helpers semânticos.
 *
 * Para usar fora do React (scripts/CLIs), passe o `state` explicitamente
 * em vez de chamar o hook.
 */

import { useAppStore } from '../store';
import { processarInspecao } from '../motor/actionTemplateEngine';
import { getTodosChecklistsAtivos, enrichChecklist } from '../normativeChecklists';

export { useAppStore, processarInspecao, getTodosChecklistsAtivos, enrichChecklist };

/**
 * Lê inspeções do store atual.
 * @returns {Array<object>}
 */
export function listarInspecoes() {
  if (typeof window === 'undefined') return [];
  return useAppStore.getState().inspecoes || [];
}

/**
 * Cria inspeção no store. Dispara o motor (processAutoActions) através do
 * próprio `addInspecao` do store.
 * @param {object} inspecao
 */
export function criarInspecao(inspecao) {
  if (typeof window === 'undefined') return;
  useAppStore.getState().addInspecao(inspecao);
}

/**
 * Atualiza inspeção e re-executa motor caso o checklist tenha sido
 * concluído (a chamada explícita pra `processarInspecao` é idempotente).
 *
 * @param {string} id
 * @param {Partial<object>} patch
 */
export function atualizarInspecao(id, patch) {
  if (typeof window === 'undefined') return;
  useAppStore.getState().updateInspecao(id, patch);
}

/**
 * @param {string} id
 */
export function removerInspecao(id) {
  if (typeof window === 'undefined') return;
  useAppStore.getState().deleteInspecao(id);
}

/**
 * Helper conveniente: processa uma inspeção pelo id e devolve quantos
 * itens NC existiam no momento. Útil pra UI dar feedback "X riscos
 * gerados após salvar".
 *
 * @param {string} inspectionId
 * @returns {{ ncs: number, riscosGerados: number, acoesGeradas: number }}
 */
export function processarEResumir(inspectionId) {
  if (typeof window === 'undefined') {
    return { ncs: 0, riscosGerados: 0, acoesGeradas: 0 };
  }
  const state = useAppStore.getState();
  const insp = (state.inspecoes || []).find(i => i.id === inspectionId);
  const ncs = (insp?.items || []).filter(it => it?.status === 'Não' || it?.status === 'Parcialmente').length;
  processarInspecao(inspectionId);
  const after = useAppStore.getState();
  const riscosGerados = (after.riscos || []).filter(r => r.inspection_id === inspectionId).length;
  const acoesGeradas = (after.acoes || []).filter(a => a.inspection_id === inspectionId || a.inspecaoId === inspectionId).length;
  return { ncs, riscosGerados, acoesGeradas };
}
