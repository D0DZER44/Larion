import type { OperationalSSTRule } from './nrRules';

const RULES_SOURCE_UPDATED_AT = '2026-05-11';

function createUniversalRule(input: {
  id: string;
  title: string;
  checkQuestion: string;
  expectedAnswer: string;
  criticalAnswer: string;
  severity: OperationalSSTRule['severity'];
  prioritySuggestion: OperationalSSTRule['prioritySuggestion'];
  requiresEvidence: boolean;
  evidenceTypes: OperationalSSTRule['evidenceTypes'];
  suggestedDueHours: number;
  suggestedOperationalItemType: OperationalSSTRule['suggestedOperationalItemType'];
  riskTitle: string;
  suggestedAction: string;
  confidence: OperationalSSTRule['confidence'];
}) {
  return {
    id: input.id,
    scope: 'universal' as const,
    title: input.title,
    description: input.riskTitle,
    nr: 'NR-01',
    contextId: 'base_sst',
    activityId: undefined,
    package: 'Base SST',
    severity: input.severity,
    condition: input.checkQuestion,
    suggestedAction: input.suggestedAction,
    defaultDeadlineHours: input.suggestedDueHours,
    requiresEvidence: input.requiresEvidence,
    blocking: input.severity === 'critica',
    generatesItem: true,
    impactsScore: true,
    keywords: Array.from(
      new Set(
        `${input.title} ${input.riskTitle} ${input.checkQuestion}`
          .toLowerCase()
          .split(/[^a-z0-9]+/i)
          .filter((token) => token.length > 2)
      )
    ),
    requiredDocuments: [],
    fixed: true,
    editable: false,
    removable: false,
    active: true,
    legalReference: 'Base operacional ApexOps SST',
    contextIds: ['base_sst'],
    criticalActivityIds: [],
    checkQuestion: input.checkQuestion,
    expectedAnswer: input.expectedAnswer,
    criticalAnswer: input.criticalAnswer,
    prioritySuggestion: input.prioritySuggestion,
    evidenceTypes: input.evidenceTypes,
    suggestedDueHours: input.suggestedDueHours,
    suggestedOperationalItemType: input.suggestedOperationalItemType,
    riskTitle: input.riskTitle,
    source: 'Curadoria operacional ApexOps SST baseada em disciplina operacional minima e rastreabilidade do motor.',
    sourceUpdatedAt: RULES_SOURCE_UPDATED_AT,
    confidence: input.confidence,
  } satisfies OperationalSSTRule;
}

export const UNIVERSAL_SST_RULES: OperationalSSTRule[] = [
  createUniversalRule({
    id: 'base-item-sem-responsavel',
    title: 'Item sem responsavel',
    checkQuestion: 'O item operacional possui responsavel claramente definido?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: false,
    evidenceTypes: [],
    suggestedDueHours: 24,
    suggestedOperationalItemType: 'operational_item',
    riskTitle: 'Tratamento sem ownership operacional definido',
    suggestedAction: 'Definir responsavel antes de mover o item para execucao.',
    confidence: 'high',
  }),
  createUniversalRule({
    id: 'base-item-vencido',
    title: 'Item vencido',
    checkQuestion: 'O item ainda esta dentro do prazo operacional acordado?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: false,
    evidenceTypes: [],
    suggestedDueHours: 4,
    suggestedOperationalItemType: 'operational_item',
    riskTitle: 'Tratamento operacional vencido sem resolucao',
    suggestedAction: 'Repriorizar, escalar ownership e definir nova acao operacional imediata.',
    confidence: 'high',
  }),
  createUniversalRule({
    id: 'base-item-critico-sem-prazo',
    title: 'Item critico sem prazo',
    checkQuestion: 'O item critico possui prazo operacional definido?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: false,
    evidenceTypes: [],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Desvio critico sem compromisso temporal de tratamento',
    suggestedAction: 'Definir prazo imediato e responsavel antes de manter o item aberto em operacao.',
    confidence: 'high',
  }),
  createUniversalRule({
    id: 'base-item-critico-sem-evidencia',
    title: 'Item critico sem evidencia quando exigida',
    checkQuestion: 'Existe evidencia valida anexada quando o item critico exige comprovacao?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'pdf', 'document'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Item critico sem defesa documental suficiente',
    suggestedAction: 'Bloquear conclusao e anexar evidencia valida antes do encerramento.',
    confidence: 'high',
  }),
];
