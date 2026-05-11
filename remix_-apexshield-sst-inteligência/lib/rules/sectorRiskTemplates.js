/**
 * sectorRiskTemplates
 * -------------------
 * Templates de risco por **setor / pacote**. O motor cruza estas regras com
 * as atividades críticas da organização e os pacotes ativos para decidir o
 * que vira risco automático.
 *
 * Fachada sobre `lib/riskRules.ts` (`INITIAL_RISK_RULES`).
 */

export { INITIAL_RISK_RULES } from '../riskRules';

/**
 * Helper utilitário — devolve apenas templates de um pacote específico.
 * Útil pra inspecionar o catálogo sem ler o array inteiro.
 *
 * @param {ReadonlyArray<{pacote: string, ativo: boolean}>} rules
 * @param {string} pacote
 * @returns {Array<object>}
 */
export function filtrarTemplatesPorPacote(rules, pacote) {
  if (!Array.isArray(rules)) return [];
  return rules.filter(r => r && r.pacote === pacote);
}

/**
 * Helper utilitário — devolve apenas templates relacionados a uma atividade.
 *
 * @param {ReadonlyArray<{atividades?: string[], ativo: boolean}>} rules
 * @param {string} atividade
 * @returns {Array<object>}
 */
export function filtrarTemplatesPorAtividade(rules, atividade) {
  if (!Array.isArray(rules) || !atividade) return [];
  return rules.filter(r => Array.isArray(r?.atividades) && r.atividades.includes(atividade));
}
