import {
  getOperationalItemsFromLegacyState,
  type LegacyRuntimeState,
} from './store';

export function runLegacyStoreOperationalItemDemo() {
  const legacyState: LegacyRuntimeState = {
    riscos: [
      {
        id: 'legacy-risk-1',
        titulo: 'Risco de protecao ausente em maquina',
        descricao: 'Prensa sem protecao fixa instalada.',
        setor: 'Producao',
        atividade: 'maquinas',
        nr: 'NR-12',
        nivel: 'Crítica',
        status: 'Aberto',
        prioridade: 'Alta',
        prazo: '2026-05-15',
        responsavel: 'Supervisor da linha',
        criadoEm: '2026-05-10T08:00:00.000Z',
        pacote: 'Indústria',
      } as any,
    ],
    acoes: [
      {
        id: 'legacy-action-1',
        titulo: 'Adequar protecao da prensa',
        descricao: 'Instalar protecao e validar parada de emergencia.',
        setor: 'Producao',
        status: 'Vencida',
        prioridade: 'Crítica',
        prazo: '2026-05-09',
        responsavel: 'Manutencao mecanica',
        origem: undefined,
        exigeEvidencia: true,
        criadoEm: '2026-05-08T08:30:00.000Z',
        pacote: 'Indústria',
      } as any,
    ],
    inspecoes: [
      {
        id: 'legacy-inspection-1',
        titulo: 'Inspecao de maquinas da linha 1',
        setor: 'Producao',
        atividade: 'maquinas',
        status: 'Em andamento',
        data: '2026-05-10',
        criadoEm: '2026-05-10T07:00:00.000Z',
        items: [
          {
            id: 'q1',
            question: 'Maquina possui protecao?',
            answer: 'Não',
            nr: 'NR-12',
            evidenceRequired: true,
          },
        ],
      } as any,
    ],
  };

  const result = getOperationalItemsFromLegacyState(legacyState);
  const riskItem = result.items.find((item) => item.sourceLinks[0]?.id === 'legacy-risk-1');
  const actionItem = result.items.find((item) => item.sourceLinks[0]?.id === 'legacy-action-1');

  return {
    result,
    checks: {
      riskConvertedToOperationalItem: Boolean(riskItem),
      actionConvertedToOperationalItem: Boolean(actionItem),
      missingOriginWarningApplied: result.warnings.some((warning) => warning.includes('Origem ausente')),
      legacyStatusMappedCorrectly:
        riskItem?.status === 'triaged' &&
        actionItem?.status === 'vencido',
    },
  };
}
