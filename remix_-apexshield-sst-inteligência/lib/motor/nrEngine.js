/**
 * nrEngine
 * --------
 * Motor de detecção e aplicação de NRs.
 *
 * Encapsula `NormativeEngine` (de `lib/engines.ts`) e adiciona helpers
 * de busca por NR. Mesmo objeto, mesmas funções — nenhum comportamento
 * é alterado, só damos um ponto de entrada estável em `lib/motor/`.
 */

import { NormativeEngine } from '../engines';

export { NormativeEngine };

/**
 * Detecta NR a partir de texto livre (atividade descrita pelo usuário).
 * Sobrecarga conveniente sobre `NormativeEngine.detect`.
 *
 * @param {string} textoAtividade
 * @returns {object | null} Regra encontrada (com keywords matched) ou null.
 */
export function detectarNr(textoAtividade) {
  return NormativeEngine.detect(textoAtividade);
}

/**
 * Busca regra do NormativeEngine pelo código NR.
 * @param {string} nr
 * @returns {object | null}
 */
export function regraDaNr(nr) {
  return NormativeEngine.findByNR(nr);
}

/**
 * Gera sugestões textuais (mensagem, ação, EPI) a partir de uma descrição
 * de atividade.
 * @param {string} textoAtividade
 * @returns {{ message: string, action: string, ppe: string[] } | null}
 */
export function sugestoesParaAtividade(textoAtividade) {
  return NormativeEngine.getSuggestions(textoAtividade);
}
