/**
 * LEGACY MOTOR BARREL
 * Este barrel permanece para compatibilidade com o modelo antigo
 * `Inspecao -> Risco -> Acao`.
 * Novas estruturas de motor devem nascer em `src/`.
 *
 * @lib/motor
 * ----------
 * Barrel do motor. Reúne todos os engines em um único ponto de import
 * para código novo:
 *
 *   import { detectarNr, processarInspecao, prazoPorCriticidade } from '@/lib/motor';
 *
 * Nada aqui é instanciado — só re-export. Os imports antigos
 * (`@/lib/engines`, `@/lib/normativeRules`, ...) continuam funcionando.
 */

// nrEngine
export {
  NormativeEngine,
  detectarNr,
  regraDaNr,
  sugestoesParaAtividade,
} from './nrEngine';

// sectorEngine
export {
  pontuarSetores,
  setorMaisCritico,
  rankingSetores,
  expostosPorSetor,
} from './sectorEngine';

// activityEngine
export {
  ATIVIDADES_OPCOES,
  ATIVIDADE_PARA_NR,
  nrPorAtividade,
  resolverNrDaAtividade,
  buscarAtividades,
} from './activityEngine';

// riskTemplateEngine
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
  gerarRiscoCompleto,
  calcularNivel,
} from './riskTemplateEngine';

// actionTemplateEngine
export {
  ActionEngine,
  AutomationEngine,
  processarInspecao,
  acaoDeRisco,
  acaoDeInspecao,
  bucketsAcoes,
  acaoVencida,
  acaoFallback,
  prioridadeDeCriticidade,
} from './actionTemplateEngine';

// slaEngine
export {
  SLA_PADRAO_HORAS,
  prazoPorCriticidade,
  slasDaOrganizacao,
  dataVencimento,
  estaVencido,
  horasRestantes,
} from './slaEngine';

// evidenceEngine
export {
  actionRequiresEvidence,
  exigeEvidenciaPadrao,
  EXIGE_EVIDENCIA_POR_CRITICIDADE,
  TIPOS_EVIDENCIA_ACEITOS,
  contarEvidencias,
  acoesConcluidasSemEvidencia,
  itemDeChecklistExigeEvidencia,
} from './evidenceEngine';

// pgrEngine
export {
  pgrPrecisaAtualizar,
  snapshotPGR,
  alertaPgrDesatualizado,
} from './pgrEngine';
