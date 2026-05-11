/**
 * actionTemplates
 * ---------------
 * Templates de ação corretiva. Hoje as ações são geradas em runtime pelo motor
 * a partir de:
 *   - `fixedNrRule.acaoRecomendada`  (texto da regra fixa NR)
 *   - `riskRule.acaoSugerida`        (template do segmento)
 *   - `checklistQuestion.acaoSugerida` (override do item de checklist)
 *
 * Este arquivo expõe:
 *   - Helpers de validação/normalização de ação (já existem em
 *     `lib/action-rules.ts`).
 *   - Defaults de fallback usados quando o item não traz `acaoSugerida`.
 */

export {
  normalizeActionDraft,
  validateActionDraft,
  validateActionCompletion,
  actionRequiresEvidence,
} from '../action-rules';

/**
 * Texto-padrão para quando nenhuma regra sugere ação concreta.
 * Mantém o sufixo com a pergunta original pra preservar rastreabilidade.
 * @param {string} pergunta
 * @returns {string}
 */
export function acaoFallback(pergunta) {
  const limpa = (pergunta || '').replace(/\?$/, '').trim();
  return limpa
    ? `Regularizar conformidade: ${limpa}`
    : 'Corrigir desvio identificado';
}

/**
 * Defaults de prioridade derivados da criticidade. Espelha a tabela usada
 * em `AutomationEngine.processInspection`.
 * @param {string} criticidade
 * @returns {'Crítica' | 'Alta' | 'Média' | 'Baixa'}
 */
export function prioridadeDeCriticidade(criticidade) {
  const c = String(criticidade || '').toLowerCase();
  if (c.startsWith('crít') || c.startsWith('crit')) return 'Crítica';
  if (c.startsWith('alt')) return 'Alta';
  if (c.startsWith('méd') || c.startsWith('med')) return 'Média';
  return 'Baixa';
}
