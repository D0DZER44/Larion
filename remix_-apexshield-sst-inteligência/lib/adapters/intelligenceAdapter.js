/**
 * intelligenceAdapter
 * -------------------
 * Adapter da L.A.R.I (inteligência conversacional + decisões executivas).
 *
 * Une dois pontos:
 *   1) `LariContextEngine` (lib/engines.ts) — agrega o estado em contexto
 *      legível para a IA e responde por intent.
 *   2) Cliente HTTP `askLari` (lib/lari/client.ts) — chama `/api/lari`
 *      com fallback offline.
 */

import { useAppStore } from '../store';
import { LariContextEngine, DecisionEngine } from '../engines';
import { askLari } from '../lari/client';

export { useAppStore, LariContextEngine, DecisionEngine, askLari };

/**
 * Contexto pronto pra enviar ao backend de IA.
 * @returns {object}
 */
export function contextoAtual() {
  if (typeof window === 'undefined') return {};
  return LariContextEngine.getRealtimeContext(useAppStore.getState());
}

/**
 * Classifica a intenção da mensagem do usuário.
 * @param {string} mensagem
 * @returns {string}
 */
export function classificarIntencao(mensagem) {
  return LariContextEngine.classifyIntent(String(mensagem || ''));
}

/**
 * Responde rapidamente sem rede (usando só regras locais).
 * Útil pra prévia/auto-complete.
 *
 * @param {string} mensagem
 * @returns {string}
 */
export function responderLocal(mensagem) {
  if (typeof window === 'undefined') return '';
  return LariContextEngine.respond(String(mensagem || ''), useAppStore.getState());
}

/**
 * Pergunta com fallback HTTP. Garante que o `context` enviado é o estado
 * vivo, não algum snapshot pré-criado.
 *
 * @param {string} mensagem
 * @returns {Promise<{ text: string, isOffline?: boolean }>}
 */
export function perguntar(mensagem) {
  const ctx = contextoAtual();
  return askLari(String(mensagem || ''), {
    summary: ctx.organizacao || '',
    criticalRisks: ctx.criticalRisks || 0,
    acoesAtrasadas: ctx.acoesAtrasadas || 0,
    inspecoesPendentes: ctx.inspecoesPendentes || 0,
    operationalScore: ctx.operationalScore || 0,
    topSector: ctx.topSector || 'Geral',
    conformidade: ctx.conformidade || 0,
    checklistsHoje: ctx.checklistsHoje || 0,
    ...ctx,
  });
}

/**
 * Decisão executiva sintética para o painel `/central`.
 * @returns {object}
 */
export function decisaoAtual() {
  if (typeof window === 'undefined') return null;
  return DecisionEngine.getMainDecision(useAppStore.getState());
}
