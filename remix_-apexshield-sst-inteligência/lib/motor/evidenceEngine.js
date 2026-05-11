/**
 * evidenceEngine
 * --------------
 * Motor de evidências: decide quando uma ação exige anexo, lista evidências
 * vinculadas e detecta ações concluídas sem prova documental (R6, R29).
 *
 * Encapsula `actionRequiresEvidence` (lib/action-rules.ts) e os helpers de
 * `rules/evidenceTemplates`.
 */

import { actionRequiresEvidence } from '../action-rules';
import {
  exigeEvidenciaPadrao,
  EXIGE_EVIDENCIA_POR_CRITICIDADE,
  TIPOS_EVIDENCIA_ACEITOS,
} from '../rules/evidenceTemplates';

export {
  actionRequiresEvidence,
  exigeEvidenciaPadrao,
  EXIGE_EVIDENCIA_POR_CRITICIDADE,
  TIPOS_EVIDENCIA_ACEITOS,
};

/**
 * Conta evidências válidas em uma ação. Aceita string, array de strings ou
 * array de objetos `{ url }`.
 *
 * @param {{ evidencia?: string | string[] | Array<{ url?: string }>, evidenciaUrl?: string }} acao
 * @returns {number}
 */
export function contarEvidencias(acao) {
  if (!acao) return 0;
  let total = 0;
  if (acao.evidenciaUrl) total += 1;
  const evid = acao.evidencia;
  if (typeof evid === 'string' && evid.length > 0) total += 1;
  else if (Array.isArray(evid)) total += evid.filter(e => !!e).length;
  return total;
}

/**
 * Lista IDs de ações que **deveriam** ter evidência mas estão concluídas sem.
 * Regra usada pela CLI `validar-evidencias.js` (proposta no /docs/CLIS.md).
 *
 * @param {Array<object>} acoes
 * @returns {Array<{ id: string, titulo: string }>}
 */
export function acoesConcluidasSemEvidencia(acoes) {
  if (!Array.isArray(acoes)) return [];
  return acoes
    .filter(a => {
      if (!a) return false;
      const concluida = (a.status === 'Concluída' || a.status === 'Concluído');
      if (!concluida) return false;
      if (!actionRequiresEvidence(a)) return false;
      return contarEvidencias(a) === 0;
    })
    .map(a => ({ id: a.id, titulo: a.titulo || a.title || '(sem título)' }));
}

/**
 * @param {object} item Item de checklist enriquecido
 * @returns {boolean}
 */
export function itemDeChecklistExigeEvidencia(item) {
  if (!item) return false;
  if (item.exigeEvidencia !== undefined) return !!item.exigeEvidencia;
  return exigeEvidenciaPadrao(item.criticidade);
}
