/**
 * riskTemplateEngine
 * ------------------
 * Motor que **transforma um draft de risco em risco completo** aplicando
 * regras manuais e templates de segmento.
 *
 * Núcleo: `applyManualRules` (já existe em `lib/risk-calculations.ts`).
 * Suplemento: `RiskEngine` (de `lib/engines.ts`) com cálculo de score.
 */

import { RiskEngine } from '../engines';
import {
  applyManualRules,
  calcularPrioridade,
  calcularPrazo,
  calcularMultaEstimada,
  calcularChanceIncidente,
  calcularImpactoOperacional,
  calcularNivelConformidade,
  formatCurrency,
  getNrMetrics,
} from '../risk-calculations';

export {
  RiskEngine,
  applyManualRules,
  calcularPrioridade,
  calcularPrazo,
  calcularMultaEstimada,
  calcularChanceIncidente,
  calcularImpactoOperacional,
  calcularNivelConformidade,
  formatCurrency,
  getNrMetrics,
};

/**
 * Atalho semântico — transforma payload mínimo em risco completo.
 * Equivalente a `applyManualRules`, com nome mais legível pra novo código.
 *
 * @param {Partial<object>} draft
 * @returns {object}
 */
export function gerarRiscoCompleto(draft) {
  return applyManualRules(draft || {});
}

/**
 * Calcula nível de risco (Baixo/Médio/Alto/Crítico) a partir de inputs
 * compostos. Fachada sobre `RiskEngine.calculateRisk` + `RiskEngine.getRiskLevel`.
 *
 * @param {{
 *   severity: string,
 *   exposedPeople: number,
 *   overdueInspections: number,
 *   overdueActions: number,
 *   nonConformities: number,
 *   recurrence: boolean,
 *   criticalActivity: boolean
 * }} input
 * @returns {{ score: number, nivel: string }}
 */
export function calcularNivel(input) {
  const score = RiskEngine.calculateRisk(input);
  const nivel = RiskEngine.getRiskLevel(score);
  return { score, nivel };
}
