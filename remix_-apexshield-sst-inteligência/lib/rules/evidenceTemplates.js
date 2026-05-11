/**
 * evidenceTemplates
 * -----------------
 * Regras de evidência exigida (R6, R11 das Regras de Negócio).
 *
 * Hoje a decisão "exige evidência?" vem de:
 *   1) Item de checklist (`item.exigeEvidencia` explícito).
 *   2) Default por criticidade (Crítica/Alta → true).
 *   3) Helper `actionRequiresEvidence(acao)` em runtime.
 *
 * Este arquivo expõe os helpers existentes + a tabela de defaults pra
 * código novo importar sem precisar duplicar regra.
 */

export { actionRequiresEvidence } from '../action-rules';

/**
 * Tabela de defaults por criticidade.
 * @type {Readonly<Record<string, boolean>>}
 */
export const EXIGE_EVIDENCIA_POR_CRITICIDADE = Object.freeze({
  'Crítica': true,
  'Crítico': true,
  'Alta': true,
  'Alto': true,
  'Média': false,
  'Médio': false,
  'Baixa': false,
  'Baixo': false,
});

/**
 * @param {string} criticidade
 * @returns {boolean}
 */
export function exigeEvidenciaPadrao(criticidade) {
  if (!criticidade) return false;
  if (Object.prototype.hasOwnProperty.call(EXIGE_EVIDENCIA_POR_CRITICIDADE, criticidade)) {
    return EXIGE_EVIDENCIA_POR_CRITICIDADE[criticidade];
  }
  const c = String(criticidade).toLowerCase();
  return c.startsWith('crít') || c.startsWith('crit') || c.startsWith('alt');
}

/**
 * Tipos aceitos como evidência (V1: aceita string/URL livremente;
 * V2: foto/PDF/vídeo/hash-SHA256).
 * @type {ReadonlyArray<'foto' | 'pdf' | 'video' | 'texto'>}
 */
export const TIPOS_EVIDENCIA_ACEITOS = Object.freeze([
  'foto',
  'pdf',
  'video',
  'texto',
]);
