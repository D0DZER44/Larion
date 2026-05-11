/**
 * actionTemplateEngine
 * --------------------
 * Motor de geração de ação corretiva.
 *
 * Encapsula `ActionEngine` + `AutomationEngine` (de `lib/engines.ts`) e expõe
 * helpers de conversão criticidade → prioridade/prazo a partir de
 * `rules/actionTemplates`.
 */

import { ActionEngine, AutomationEngine } from '../engines';
import { acaoFallback, prioridadeDeCriticidade } from '../rules/actionTemplates';

export {
  ActionEngine,
  AutomationEngine,
  acaoFallback,
  prioridadeDeCriticidade,
};

/**
 * Dispara o processamento automático de uma inspeção: lê itens NC,
 * gera/atualiza riscos e ações idempotentes.
 * Atalho sobre `AutomationEngine.processInspection`.
 *
 * @param {string} inspectionId
 */
export function processarInspecao(inspectionId) {
  return AutomationEngine.processInspection(inspectionId);
}

/**
 * Cria payload de ação a partir de um risco. Usa `ActionEngine.createFromRisk`.
 *
 * @param {object} risco
 * @returns {object}
 */
export function acaoDeRisco(risco) {
  return ActionEngine.createFromRisk(risco);
}

/**
 * Cria payload de ação a partir de uma inspeção (não-conformidade genérica).
 * Usa `ActionEngine.createFromInspection`.
 *
 * @param {object} inspecao
 * @returns {object}
 */
export function acaoDeInspecao(inspecao) {
  return ActionEngine.createFromInspection(inspecao);
}

/**
 * Buckets de ações por estado, usado pra UI Kanban.
 * Atalho sobre `ActionEngine.getBuckets`.
 *
 * @param {Array<object>} acoes
 */
export function bucketsAcoes(acoes) {
  return ActionEngine.getBuckets(acoes || []);
}

/**
 * @param {object} acao
 * @returns {boolean}
 */
export function acaoVencida(acao) {
  return ActionEngine.isOverdue(acao);
}
