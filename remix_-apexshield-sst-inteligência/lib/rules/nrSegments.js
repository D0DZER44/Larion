/**
 * nrSegments
 * ----------
 * Matriz NR × Segmento × Atividade. Determina quais NRs são aplicáveis
 * à organização baseado em segmento, atividades críticas e pacotes ativos.
 *
 * Fachada sobre `lib/nrMatrix.ts`.
 */

export {
  NR_MATRIX,
  NR_MATRIX_ORDENADA,
  getNrIdNumber,
  compareNRs,
  getNRsAplicaveis,
} from '../nrMatrix';
