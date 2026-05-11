/**
 * activityTemplates
 * -----------------
 * Catálogo de atividades reconhecidas pelo motor + palavras-chave de
 * detecção semântica (NR por texto livre).
 *
 * Hoje os dados vivem em dois lugares no projeto:
 *   1) Lista textual de atividades críticas → `app/operacao/riscos/page.tsx`
 *      (variável `ATIVIDADES_OPCOES`, definida na UI).
 *   2) Regras de detecção (`NormativeEngine.rules` em `lib/engines.ts`)
 *      que mapeiam palavras-chave → NR.
 *
 * Este arquivo NÃO importa de UI (`app/...`). Replica a lista canônica
 * pra ficar disponível fora do componente — caminho seguro pra UI migrar
 * pra cá no futuro.
 */

/**
 * Atividades reconhecidas como críticas pelo produto.
 * Espelha o vocabulário usado em `/operacao/riscos`.
 * @type {ReadonlyArray<string>}
 */
export const ATIVIDADES_OPCOES = Object.freeze([
  'Trabalho em altura',
  'Manutenção elétrica',
  'Operação de máquinas',
  'Espaço confinado',
  'Trabalho a quente',
  'Movimentação de cargas',
  'Outras atividades',
]);

/**
 * Mapeamento atividade → NR principal sugerida.
 * @type {Readonly<Record<string, string>>}
 */
export const ATIVIDADE_PARA_NR = Object.freeze({
  'Trabalho em altura': 'NR-35',
  'Manutenção elétrica': 'NR-10',
  'Operação de máquinas': 'NR-12',
  'Espaço confinado': 'NR-33',
  'Trabalho a quente': 'NR-34',
  'Movimentação de cargas': 'NR-11',
});

/**
 * Retorna a NR sugerida pra uma atividade conhecida, ou null.
 * @param {string} atividade
 * @returns {string | null}
 */
export function nrPorAtividade(atividade) {
  if (!atividade) return null;
  return ATIVIDADE_PARA_NR[atividade] || null;
}
