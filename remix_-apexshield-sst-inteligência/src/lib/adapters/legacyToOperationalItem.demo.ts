import { buildLegacyCompatibilityReport } from './legacyCompatibilityReport';
import {
  legacyActionToOperationalItem,
  legacyInspectionToFieldInput,
  legacyRiskToOperationalItem,
} from './legacyToOperationalItem';

export function runLegacyToOperationalItemDemo() {
  const legacyRisk = {
    id: 'risk-001',
    titulo: 'Risco de queda em plataforma sem guarda-corpo',
    descricao: 'Plataforma elevada com protecao lateral incompleta.',
    setor: 'Manutencao',
    atividade: 'altura',
    nr: 'NR-35',
    nivel: 'Crítica',
    prioridade: 'Alta',
    status: 'Aberto',
    prazo: '14/05/2026',
    responsavel: 'Supervisor de manutencao',
    criadoEm: '2026-05-10T08:00:00.000Z',
  };

  const legacyAction = {
    id: 'action-001',
    titulo: 'Instalar guarda-corpo e liberar frente de trabalho',
    descricao: 'Executar isolamento, instalar guarda-corpo e registrar liberacao.',
    setor: 'Manutencao',
    origem: 'Inspeção',
    prioridade: 'Crítica',
    status: 'Em andamento',
    prazo: '2026-05-12',
    responsavel: 'Lider de manutencao',
    exigeEvidencia: true,
    evidencia: [
      {
        id: 'action-001-ev-1',
        tipo: 'Foto',
        descricao: 'Antes da adequacao',
        url: 'https://example.com/evidencias/antes.jpg',
        dataUpload: '2026-05-10T09:00:00.000Z',
        enviadoPor: 'tecnico.sst',
      },
    ],
    riscoId: 'risk-001',
    inspecaoId: 'inspection-001',
    nrRelacionada: 'NR-35',
    regraId: 'nr35_protecao_queda_ausente',
    criadoEm: '2026-05-10T08:30:00.000Z',
  };

  const legacyInspection = {
    id: 'inspection-001',
    titulo: 'Inspecao de rota e meios de acesso',
    setor: 'Facilities',
    atividade: 'incendio',
    status: 'Em andamento',
    checklistId: 'chk-rotas-01',
    observacoes: 'Rota principal parcialmente bloqueada.',
    items: [
      {
        id: 'q-1',
        question: 'Rota de fuga esta desobstruida?',
        answer: 'Não',
        nr: 'NR-23',
        regraId: 'nr23_rota_fuga_obstruida',
        evidenceRequired: true,
      },
      {
        id: 'q-2',
        question: 'Sinalizacao de emergencia esta visivel?',
        answer: 'Sim',
      },
    ],
    data: '2026-05-10',
    inspector: 'tecnico.sst',
    criadoEm: '2026-05-10T07:50:00.000Z',
  };

  return {
    riskResult: legacyRiskToOperationalItem(legacyRisk),
    actionResult: legacyActionToOperationalItem(legacyAction),
    inspectionResult: legacyInspectionToFieldInput(legacyInspection),
    report: buildLegacyCompatibilityReport({
      risks: [legacyRisk],
      actions: [legacyAction],
      inspections: [legacyInspection],
    }),
  };
}
