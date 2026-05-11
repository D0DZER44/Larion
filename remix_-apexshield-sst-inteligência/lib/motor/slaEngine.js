/**
 * slaEngine
 * ---------
 * Motor de SLA (prazo legal por criticidade).
 *
 * Centraliza a tabela e os helpers de cálculo de prazo. Hoje a regra está
 * espalhada em:
 *   - `engineConfig.slas` (store, default global do tenant)
 *   - `calcularPrazo` (lib/risk-calculations.ts)
 *   - `defaultPrazoPorCriticidade` (lib/normativeChecklists.ts)
 *
 * Este arquivo NÃO altera nada — apenas oferece API estável e cobre
 * conversões hora ↔ data.
 */

import { calcularPrazo } from '../risk-calculations';
import { useAppStore } from '../store';

export { calcularPrazo };

/**
 * SLA padrão por criticidade, em horas.
 * Espelha a tabela usada em `defaultPrazoPorCriticidade` e nos defaults do
 * `engineConfig.slas` (criticoHoras=24, altoHoras=72, medioDias=15, baixoDias=30).
 * @type {Readonly<{ Crítica: number, Alta: number, Média: number, Baixa: number }>}
 */
export const SLA_PADRAO_HORAS = Object.freeze({
  'Crítica': 24,
  'Crítico': 24,
  'Alta': 72,
  'Alto': 72,
  'Média': 168,    // 7 dias
  'Médio': 168,
  'Baixa': 720,    // 30 dias
  'Baixo': 720,
});

/**
 * Retorna o prazo em horas conforme criticidade.
 * Aceita variações de grafia ("Crítico"/"Crítica", "Médio"/"Média").
 *
 * @param {string} criticidade
 * @returns {number} horas
 */
export function prazoPorCriticidade(criticidade) {
  if (!criticidade) return SLA_PADRAO_HORAS['Médio'];
  if (Object.prototype.hasOwnProperty.call(SLA_PADRAO_HORAS, criticidade)) {
    return SLA_PADRAO_HORAS[criticidade];
  }
  const c = String(criticidade).toLowerCase();
  if (c.startsWith('crít') || c.startsWith('crit')) return 24;
  if (c.startsWith('alt')) return 72;
  if (c.startsWith('méd') || c.startsWith('med')) return 168;
  return 720;
}

/**
 * Lê o `engineConfig.slas` configurado pela organização (no store)
 * e devolve em formato unificado (horas).
 * Volta `null` se rodado fora do navegador.
 *
 * @returns {{ Crítica: number, Alta: number, Média: number, Baixa: number } | null}
 */
export function slasDaOrganizacao() {
  if (typeof window === 'undefined') return null;
  const cfg = useAppStore.getState().engineConfig?.slas;
  if (!cfg) return null;
  return {
    'Crítica': Number(cfg.criticoHoras) || 24,
    'Alta':    Number(cfg.altoHoras) || 72,
    'Média':   (Number(cfg.medioDias) || 7) * 24,
    'Baixa':   (Number(cfg.baixoDias) || 30) * 24,
  };
}

/**
 * Calcula a data de vencimento (ISO) a partir de uma data-base e prazo em horas.
 *
 * @param {Date | string | number} dataBase
 * @param {number} prazoHoras
 * @returns {string} ISO datetime
 */
export function dataVencimento(dataBase, prazoHoras) {
  const base = dataBase ? new Date(dataBase) : new Date();
  const horas = Math.max(0, Number(prazoHoras) || 0);
  base.setHours(base.getHours() + horas);
  return base.toISOString();
}

/**
 * Verifica se um item (risco ou ação) está vencido com base em `prazo` (ISO).
 *
 * @param {{ prazo?: string | Date, status?: string }} item
 * @returns {boolean}
 */
export function estaVencido(item) {
  if (!item || !item.prazo) return false;
  if (item.status === 'Concluída' || item.status === 'Mitigado' || item.status === 'Resolvido') {
    return false;
  }
  const limite = new Date(item.prazo).getTime();
  if (Number.isNaN(limite)) return false;
  return Date.now() > limite;
}

/**
 * Tempo restante (em horas, pode ser negativo) até o vencimento.
 * @param {{ prazo?: string | Date }} item
 * @returns {number}
 */
export function horasRestantes(item) {
  if (!item?.prazo) return Infinity;
  const limite = new Date(item.prazo).getTime();
  if (Number.isNaN(limite)) return Infinity;
  return (limite - Date.now()) / (1000 * 60 * 60);
}
