import type { Checklist } from '@/src/types/checklist';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import { apexOpsFlowService } from '@/src/services/apexOpsFlowService';

function nowIso(): string {
  return new Date('2026-05-11T10:00:00.000Z').toISOString();
}

export function runApexOpsFlowDemo() {
  const manualFieldInput: FieldInput = {
    id: 'demo-field-001',
    title: 'Rota de fuga obstruida no setor producao',
    description: 'Paletes e caixas impedem a passagem da rota de fuga principal.',
    origin: 'manual',
    sector: 'Producao',
    operationalContextId: 'facilities',
    criticalActivityId: 'incendio',
    attachments: [],
    photos: [],
    createdBy: 'tecnico.sst',
    createdAt: nowIso(),
  };

  const case1 = apexOpsFlowService.processManualEntry(manualFieldInput);

  const checklist: Checklist = {
    id: 'demo-checklist-001',
    title: 'Checklist de protecao de maquinas',
    package: 'Industria',
    nr: 'NR-12',
    activities: ['operacao-maquinas'],
    defaultSeverity: 'critica',
    active: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Protecao e seguranca',
        questions: [
          {
            id: 'q-1',
            text: 'Maquina possui protecao?',
            answerType: 'yes-no',
            nr: 'NR-12',
            severity: 'critica',
            suggestedAction: 'Bloquear a maquina ate recompor a protecao e validar a condicao segura.',
            requiresEvidence: true,
            generatesItem: true,
            defaultDeadlineHours: 0,
            ruleId: 'nr12-protecao-ausente',
            contextId: 'linha-producao',
            activityId: 'operacao-maquinas',
            criticalStatuses: ['no'],
            blocking: true,
          },
        ],
      },
    ],
  };

  const inspection: Inspection = {
    id: 'demo-inspection-001',
    title: 'Inspecao de maquina critica na linha de producao',
    checklistId: checklist.id,
    sector: 'Producao',
    operationalContextId: 'industria',
    criticalActivityId: 'maquinas',
    responsible: 'inspetor.sst',
    scheduledFor: nowIso(),
    status: 'completed',
    answers: [
      {
        questionId: 'q-1',
        question: 'Maquina possui protecao?',
        answer: 'Nao',
        nr: 'NR-12',
        ruleId: 'nr12-protecao-ausente',
        evidenceRequired: true,
      },
    ],
    createdAt: nowIso(),
    createdBy: 'inspetor.sst',
    updatedAt: nowIso(),
  };

  const case2 = apexOpsFlowService.processInspectionChecklist({
    inspection,
    checklist,
  });

  const criticalDraftWithoutResponsible = {
    ...(case2.success ? case2.data.snapshot.operationalItemDraft : case1.data.snapshot.operationalItemDraft),
    priority: 'critica' as const,
    status: 'triaged' as const,
    responsible: undefined,
    dueAt: nowIso(),
  };

  const case3 = apexOpsFlowService.releaseFromTriage(criticalDraftWithoutResponsible);

  const completionTarget = case2.success
    ? case2.data.snapshot.operationalItem
    : case1.data.snapshot.operationalItem;
  const case4 = apexOpsFlowService.validateCompletion(completionTarget, []);

  return {
    executedAt: nowIso(),
    case1,
    case2,
    case3,
    case4,
  };
}

export const apexOpsFlowEngineDemo = {
  run: runApexOpsFlowDemo,
};
