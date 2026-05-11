/**
 * activityEngine
 * --------------
 * Motor de atividades — converte texto livre / atividade selecionada em
 * NR aplicável + sugestão de checklist e EPI.
 *
 * É um wrapper conveniente sobre `NormativeEngine.detect` e
 * `nrPorAtividade` (rules/activityTemplates).
 */

import { NormativeEngine } from '../engines';
import { ATIVIDADES_OPCOES, ATIVIDADE_PARA_NR, nrPorAtividade } from '../rules/activityTemplates';

export { ATIVIDADES_OPCOES, ATIVIDADE_PARA_NR, nrPorAtividade };

/**
 * Resolve a NR de uma atividade selecionada (lista canônica) OU detecta
 * via texto livre via NormativeEngine.
 *
 * @param {string} atividadeOuTexto
 * @returns {{ nr: string | null, fonte: 'lista' | 'detectado' | 'desconhecido' }}
 */
export function resolverNrDaAtividade(atividadeOuTexto) {
  if (!atividadeOuTexto) return { nr: null, fonte: 'desconhecido' };
  const direta = nrPorAtividade(atividadeOuTexto);
  if (direta) return { nr: direta, fonte: 'lista' };

  const detect = NormativeEngine.detect(atividadeOuTexto);
  if (detect?.nr) return { nr: detect.nr, fonte: 'detectado' };

  return { nr: null, fonte: 'desconhecido' };
}

/**
 * Filtra a lista de atividades reconhecidas baseado em texto digitado.
 * Util pra autocomplete na UI.
 *
 * @param {string} termo
 * @returns {string[]}
 */
export function buscarAtividades(termo) {
  const q = String(termo || '').toLowerCase().trim();
  if (!q) return [...ATIVIDADES_OPCOES];
  return ATIVIDADES_OPCOES.filter(a => a.toLowerCase().includes(q));
}
