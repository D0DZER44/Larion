import { legacyInspectionToFieldInput } from '@/src/lib/adapters/legacyToOperationalItem';
import { ok, type EngineResult } from '@/src/types/engineResult';

type LegacyInspectionLike = Record<string, any>;

export interface InspectionExecutionRiskPreview {
  id: string;
  text: string;
  nrRef: string;
  severidade: string;
  prioridade: string;
  prazo: string;
  multa: number;
  chance: number;
  impactoScore: number;
  acaoSugerida: string;
  alerta: string | null;
}

export interface InspectionExecutionSummary {
  progress: number;
  answeredItems: number;
  totalItems: number;
  conformity: number;
  criticalAnswersCount: number;
  suggestedInputsCount: number;
  fieldInputId?: string;
  sourceId: string;
  criticalAnswers: Array<{
    questionId: string;
    question: string;
    answer: string;
    nr?: string;
    evidenceRequired: boolean;
  }>;
  triageWarnings: string[];
  riskPreviews: InspectionExecutionRiskPreview[];
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getSuggestedAction(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes('cinto')) return 'Treinar colaborador no uso correto do cinto paraquedista e talabarte duplo.';
  if (normalized.includes('linha de vida')) return 'Interromper atividade até que a linha de vida seja inspecionada e certificada.';
  if (normalized.includes('isolada') || normalized.includes('sinalizada')) return 'Instalar barreiras físicas e sinalização de advertência.';
  if (normalized.includes('permissao') || normalized.includes('pt')) return 'Paralisar frentes até emissão e assinatura da Permissão de Trabalho.';
  if (normalized.includes('ancoragem')) return 'Avaliar integridade estrutural do ponto de ancoragem.';
  if (normalized.includes('ferramentas')) return 'Implementar alças de segurança em ferramentas manuais.';
  if (normalized.includes('maquina') || normalized.includes('protecao')) return 'Regularizar proteção de máquina e validar condição segura.';
  return 'Realizar correção imediata do desvio identificado e registrar evidência final.';
}

function mapSeverity(rawSeverity?: string) {
  const normalized = normalizeText(rawSeverity);
  if (normalized.includes('crit')) return { label: 'Crítica', priority: 'Crítica', chance: 85, score: -15, dueDays: 1 };
  if (normalized.includes('alta')) return { label: 'Alta', priority: 'Alta', chance: 65, score: -10, dueDays: 3 };
  if (normalized.includes('media') || normalized.includes('média')) return { label: 'Média', priority: 'Média', chance: 40, score: -5, dueDays: 7 };
  return { label: 'Baixa', priority: 'Baixa', chance: 20, score: -2, dueDays: 15 };
}

function toLegacyInspection(inspection: LegacyInspectionLike, items: LegacyInspectionLike[]) {
  return {
    id: inspection.id,
    titulo: inspection.titulo || inspection.title || inspection.tipoInspecao || inspection.checklist || 'Inspecao',
    setor: inspection.setor || inspection.ondeUsar,
    atividade: inspection.atividade || inspection.tipoInspecao || inspection.checklist,
    status: inspection.status || inspection.situacao,
    checklistId: inspection.checklistId || inspection.checklist,
    observacoes: inspection.observacoes,
    nr: inspection.nr || inspection.nrRelacionada,
    data: inspection.data,
    inspector: inspection.inspector || inspection.responsavel,
    criadoEm: inspection.criadoEm || inspection.createdAt || new Date().toISOString(),
    items: items.map((item) => ({
      id: item.id,
      question: item.text || item.question || item.pergunta,
      answer: item.status || item.answer,
      nr: item.nr || inspection.nr,
      ruleId: item.ruleId || item.regraId,
      evidenceRequired: item.evidenceRequired ?? item.exigeEvidencia ?? item.riskMap === 'Crítica',
      attachments: item.attachments || [],
    })),
  };
}

export function analyzeInspectionExecution(input: {
  inspection: LegacyInspectionLike;
  items: LegacyInspectionLike[];
}): EngineResult<InspectionExecutionSummary> {
  const totalItems = input.items.length;
  const answeredItems = input.items.filter((item) => item.status !== 'Pendente').length;
  const conformAnswers = input.items.filter((item) => item.status === 'Sim' || item.status === 'N/A').length;
  const conformity = answeredItems > 0 ? conformAnswers / answeredItems : 0;
  const criticalItems = input.items.filter((item) => item.status === 'Não' || item.status === 'Parcialmente');

  const adapted = legacyInspectionToFieldInput(toLegacyInspection(input.inspection, input.items));
  const riskPreviews = criticalItems.map((item, index) => {
    const severity = mapSeverity(item.riskMap || item.criticidade || 'Média');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + severity.dueDays);

    return {
      id: item.id || `critical-${index + 1}`,
      text: item.text || item.question || 'Nao conformidade identificada',
      nrRef: item.nr || input.inspection.nr || 'NR nao vinculada',
      severidade: severity.label,
      prioridade: severity.priority,
      prazo: dueDate.toISOString().split('T')[0],
      multa: Number(item.multaEstimada || 0),
      chance: severity.chance,
      impactoScore: severity.score,
      acaoSugerida: getSuggestedAction(item.text || item.question || ''),
      alerta:
        severity.label === 'Crítica'
          ? 'Alerta Crítico: risco grave detectado. Encaminhar para Triagem com prioridade máxima.'
          : null,
    };
  });

  return ok({
    progress: totalItems > 0 ? answeredItems / totalItems : 0,
    answeredItems,
    totalItems,
    conformity,
    criticalAnswersCount: criticalItems.length,
    suggestedInputsCount: adapted.data.criticalAnswers.length,
    fieldInputId: adapted.data.fieldInput.id,
    sourceId: input.inspection.id,
    criticalAnswers: adapted.data.criticalAnswers.map((answer) => ({
      questionId: answer.questionId,
      question: answer.question,
      answer: answer.answer,
      nr: answer.nr,
      evidenceRequired: answer.evidenceRequired,
    })),
    triageWarnings: adapted.warnings,
    riskPreviews,
  });
}

export function prepareInspectionForTriage(input: {
  inspection: LegacyInspectionLike;
  items: LegacyInspectionLike[];
}) {
  return legacyInspectionToFieldInput(toLegacyInspection(input.inspection, input.items));
}

export const inspectionInputEngine = {
  analyzeExecution: analyzeInspectionExecution,
  prepareForTriage: prepareInspectionForTriage,
};
