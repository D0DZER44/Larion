/**
 * nrPackages
 * ----------
 * Mapeamento de NR → Pacote (Base SST / Indústria / Construção Civil /
 * Saúde-Hospitalar) usado pelo motor para decidir aplicabilidade.
 *
 * Fachada sobre `lib/store.ts`. Pacotes ativos seguem no Zustand
 * (`useAppStore().rulePackages`); o mapa NR→Pacote vive no store por
 * decisão histórica e é re-exportado aqui sem mudar a fonte.
 */

export { nrToPackage, getPackageFromNr } from '../store';

/**
 * Lista de nomes canônicos dos pacotes do produto. Útil pra UI e validação.
 * Reflete os pacotes criados no store em `rulePackages` (sementes do V1).
 * @type {ReadonlyArray<'Base SST' | 'Construção Civil' | 'Indústria' | 'Saúde/Hospitalar'>}
 */
export const PACOTES_DISPONIVEIS = Object.freeze([
  'Base SST',
  'Construção Civil',
  'Indústria',
  'Saúde/Hospitalar',
]);

/**
 * Pacote sempre ativo — não pode ser desativado pelo cliente (regra R9).
 * @type {string}
 */
export const PACOTE_BASE = 'Base SST';
