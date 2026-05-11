/**
 * nrCatalog
 * ---------
 * Catálogo das 90 regras fixas NR do motor ApexShield.
 *
 * Esta é uma fachada `.js` sobre `lib/normativeRules.ts` — preserva os imports
 * antigos (`@/lib/normativeRules`) e abre um endpoint estável em `lib/rules/`
 * pra novo código sem mover o arquivo original.
 *
 * Nada de runtime é alterado. Mesmos objetos, mesmas funções.
 */

export {
  fixedNrRules,
  normalizarRegra,
  getNrNumber,
  compareRegras,
  getTodasRegrasAtivas,
  isFixedRule,
  canEditRule,
  canRemoveRule,
} from '../normativeRules';
