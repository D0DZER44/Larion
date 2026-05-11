/**
 * risksAdapter
 * ------------
 * Adapter de Riscos: ponte entre o store e o motor de templates de risco.
 */

import { useAppStore } from '../store';
import { applyManualRules, gerarRiscoCompleto } from '../motor/riskTemplateEngine';
import { calcularNivel } from '../motor/riskTemplateEngine';

export { useAppStore, applyManualRules, gerarRiscoCompleto, calcularNivel };

/**
 * @returns {Array<object>}
 */
export function listarRiscos() {
  if (typeof window === 'undefined') return [];
  return useAppStore.getState().riscos || [];
}

/**
 * @param {string} id
 * @returns {object | null}
 */
export function obterRisco(id) {
  if (typeof window === 'undefined' || !id) return null;
  return (useAppStore.getState().riscos || []).find(r => r.id === id) || null;
}

/**
 * Cria risco já passando pelas regras manuais (`applyManualRules`).
 * Garante que o objeto persistido tenha campos derivados (prioridade, prazo,
 * nível, multa estimada, etc.).
 *
 * @param {Partial<object>} draft
 */
export function criarRisco(draft) {
  if (typeof window === 'undefined') return;
  const completo = gerarRiscoCompleto(draft || {});
  useAppStore.getState().addRisco(completo);
}

/**
 * Atualiza risco. Não re-aplica `applyManualRules` automaticamente — quem
 * chama decide se quer recalcular (passe o resultado de `gerarRiscoCompleto`
 * em `patch`).
 *
 * @param {string} id
 * @param {Partial<object>} patch
 */
export function atualizarRisco(id, patch) {
  if (typeof window === 'undefined' || !id) return;
  useAppStore.getState().updateRisco(id, patch);
}

/**
 * @param {string} id
 */
export function removerRisco(id) {
  if (typeof window === 'undefined' || !id) return;
  useAppStore.getState().deleteRisco(id);
}

/**
 * Filtros prontos para a UI.
 * @returns {{
 *   abertos: Array<object>,
 *   criticos: Array<object>,
 *   altos: Array<object>,
 *   mitigados: Array<object>,
 *   vencidos: Array<object>
 * }}
 */
export function riscosPorEstado() {
  const lista = listarRiscos();
  const abertos = lista.filter(r => r.status !== 'Mitigado' && r.status !== 'Resolvido');
  const nivelLower = r => String(r?.nivel || r?.level || '').toLowerCase();
  return {
    abertos,
    criticos: abertos.filter(r => nivelLower(r) === 'crítico' || nivelLower(r) === 'critico'),
    altos: abertos.filter(r => nivelLower(r) === 'alto'),
    mitigados: lista.filter(r => r.status === 'Mitigado' || r.status === 'Resolvido'),
    vencidos: lista.filter(r => r.status === 'Vencido'),
  };
}
