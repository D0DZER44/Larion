import { fail, ok, type EngineResult } from '@/src/types/engineResult';
import type {
  WorkflowConfig,
  WorkflowCustomFieldDefinition,
  WorkflowFilterKey,
  WorkflowStatusDefinition,
} from '@/src/types/workflowConfig';
import type { OperationalItemPriority, OperationalItemStatus } from '@/src/types/operationalItem';
import type { SSTRuleSeverity } from '@/src/types/sstRule';

const OFFICIAL_STATUSES: WorkflowStatusDefinition[] = [
  { key: 'draft', label: 'Rascunho', description: 'Item ainda em elaboracao.', fixed: true, visible: true, order: 1 },
  { key: 'triaged', label: 'Em triagem', description: 'Item em analise na inbox operacional.', fixed: true, visible: true, order: 2 },
  { key: 'a_fazer', label: 'A fazer', description: 'Item liberado para Operacao.', fixed: true, visible: true, order: 3 },
  { key: 'ready', label: 'Pronto', description: 'Item preparado para inicio operacional.', fixed: true, visible: true, order: 4 },
  { key: 'inProgress', label: 'Em execucao', description: 'Tratamento em andamento.', fixed: true, visible: true, order: 5 },
  { key: 'awaitingEvidence', label: 'Aguardando evidencia', description: 'Esperando comprovacao obrigatoria.', fixed: true, visible: true, order: 6 },
  { key: 'em_validacao', label: 'Em validacao', description: 'Evidencia recebida e aguardando validacao.', fixed: true, visible: true, order: 7 },
  { key: 'vencido', label: 'Vencido', description: 'Prazo expirou antes da resolucao.', fixed: true, visible: true, order: 8 },
  { key: 'completed', label: 'Concluido', description: 'Tratamento concluido.', fixed: true, visible: true, order: 9 },
  { key: 'cancelled', label: 'Cancelado', description: 'Item encerrado com justificativa.', fixed: true, visible: true, order: 10 },
];

const ALLOWED_FILTERS: WorkflowFilterKey[] = [
  'status',
  'priority',
  'severity',
  'responsible',
  'sector',
  'operationalContext',
  'criticalActivity',
  'nr',
  'overdue',
  'unassigned',
  'awaitingEvidence',
  'origin',
];

const ALLOWED_PRIORITIES: OperationalItemPriority[] = ['baixa', 'media', 'alta', 'critica'];
const ALLOWED_SEVERITIES: SSTRuleSeverity[] = ['baixa', 'media', 'alta', 'critica'];

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function validateCustomField(field: WorkflowCustomFieldDefinition): string[] {
  const errors: string[] = [];
  if (!field.id.trim()) errors.push('Campo configuravel precisa de id.');
  if (!field.label.trim()) errors.push(`Campo ${field.id || '(sem id)'} precisa de label.`);
  if (field.type === 'select' && (!field.options || field.options.length === 0)) {
    errors.push(`Campo ${field.id} do tipo select precisa de opcoes.`);
  }
  return errors;
}

export function createDefaultWorkflowConfig(): WorkflowConfig {
  return {
    statuses: OFFICIAL_STATUSES,
    allowedFilters: ALLOWED_FILTERS,
    customFields: [],
    filterPresets: [
      { id: 'criticos', label: 'Criticos', filterKeys: ['priority', 'severity'], active: true },
      { id: 'sem-responsavel', label: 'Sem responsavel', filterKeys: ['unassigned'], active: true },
      { id: 'aguardando-evidencia', label: 'Aguardando evidencia', filterKeys: ['awaitingEvidence'], active: true },
      { id: 'vencidos', label: 'Vencidos', filterKeys: ['overdue'], active: true },
    ],
    allowedPriorities: ALLOWED_PRIORITIES,
    allowedSeverities: ALLOWED_SEVERITIES,
    alerts: {
      criticalWithoutResponsible: true,
      overdueItem: true,
      missingEvidenceOnCompletion: true,
      reopenedRequiresJustification: true,
    },
    safeAutomationsOnly: true,
  };
}

export function validateWorkflowConfig(config: WorkflowConfig): EngineResult<WorkflowConfig> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const officialStatusKeys = new Set<OperationalItemStatus>(OFFICIAL_STATUSES.map((status) => status.key));
  const configuredStatusKeys = new Set<OperationalItemStatus>(config.statuses.map((status) => status.key));

  OFFICIAL_STATUSES.forEach((status) => {
    if (!configuredStatusKeys.has(status.key)) {
      errors.push(`Status oficial ausente na configuracao: ${status.key}.`);
    }
  });

  config.statuses.forEach((status) => {
    if (!officialStatusKeys.has(status.key)) {
      errors.push(`Status nao suportado pelo dominio SST: ${status.key}.`);
    }
  });

  if (config.customFields.length > 8) {
    errors.push('Flexibilidade controlada permite no maximo 8 campos configuraveis.');
  }

  dedupeById(config.customFields).forEach((field) => {
    validateCustomField(field).forEach((error) => errors.push(error));
  });

  config.allowedFilters.forEach((filterKey) => {
    if (!ALLOWED_FILTERS.includes(filterKey)) {
      errors.push(`Filtro nao permitido pelo dominio SST: ${filterKey}.`);
    }
  });

  if (!config.safeAutomationsOnly) {
    errors.push('A configuracao deve manter safeAutomationsOnly como true.');
  }

  if (config.customFields.length > 4) {
    warnings.push('Quantidade de campos configuraveis acima de 4 aumenta a complexidade operacional.');
  }

  if (errors.length > 0) return fail(errors, config, warnings);
  return ok(config, warnings);
}

export const workflowConfigEngine = {
  createDefault: createDefaultWorkflowConfig,
  validate: validateWorkflowConfig,
  officialStatuses: OFFICIAL_STATUSES,
  allowedFilters: ALLOWED_FILTERS,
};
