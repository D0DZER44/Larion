/**
 * actionsAdapter
 * --------------
 * Adapter de Ações: liga UI ao motor de ações + helpers de validação/evidência.
 *
 * IMPORTANTE: a UI atual (`app/operacao/acoes/page.tsx`, `app/acoes/hooks.ts`)
 * continua importando direto do store. Este adapter existe pra novo código
 * (CLIs, telas futuras, integrações) — não força ninguém a migrar agora.
 */

import { useAppStore } from '../store';
import { bucketsAcoes, acaoVencida, acaoDeRisco } from '../motor/actionTemplateEngine';
import {
  actionRequiresEvidence,
  contarEvidencias,
  acoesConcluidasSemEvidencia,
} from '../motor/evidenceEngine';
import { estaVencido, horasRestantes } from '../motor/slaEngine';

export {
  useAppStore,
  bucketsAcoes,
  acaoVencida,
  acaoDeRisco,
  actionRequiresEvidence,
  contarEvidencias,
  acoesConcluidasSemEvidencia,
  estaVencido,
  horasRestantes,
};

/**
 * @returns {Array<object>}
 */
export function listarAcoes() {
  if (typeof window === 'undefined') return [];
  return useAppStore.getState().acoes || [];
}

/**
 * @param {string} id
 */
export function obterAcao(id) {
  if (typeof window === 'undefined' || !id) return null;
  return (useAppStore.getState().acoes || []).find(a => a.id === id) || null;
}

/**
 * @param {object} acao
 */
export function criarAcao(acao) {
  if (typeof window === 'undefined') return;
  useAppStore.getState().addAcao(acao);
}

/**
 * @param {string} id
 * @param {Partial<object>} patch
 */
export function atualizarAcao(id, patch) {
  if (typeof window === 'undefined' || !id) return;
  useAppStore.getState().updateAcao(id, patch);
}

/**
 * @param {string} id
 */
export function removerAcao(id) {
  if (typeof window === 'undefined' || !id) return;
  useAppStore.getState().deleteAcao(id);
}

/**
 * Conjunto de ações atrasadas (`status: Vencida` OU prazo passado).
 * @returns {Array<object>}
 */
export function acoesAtrasadas() {
  return listarAcoes().filter(a => a?.status === 'Vencida' || estaVencido(a));
}

/**
 * @returns {{ pendentes: number, emAndamento: number, concluidas: number, atrasadas: number, semEvidencia: number }}
 */
export function resumoAcoes() {
  const acoes = listarAcoes();
  const pendentes = acoes.filter(a => a?.status === 'Pendente' || a?.status === 'Em aberto').length;
  const emAndamento = acoes.filter(a => a?.status === 'Em andamento').length;
  const concluidas = acoes.filter(a => a?.status === 'Concluída' || a?.status === 'Concluído').length;
  const atrasadas = acoesAtrasadas().length;
  const semEvidencia = acoesConcluidasSemEvidencia(acoes).length;
  return { pendentes, emAndamento, concluidas, atrasadas, semEvidencia };
}
