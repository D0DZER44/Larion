import { fixedNrRules } from '@/lib/normativeRules';
import type { SSTRule } from '@/src/types/sstRule';
import type {
  CriticalActivityCatalogId,
  OperationalContextCatalogId,
} from '@/src/lib/catalogs/nrCatalog';

export type OperationalRulePriority = 'baixa' | 'media' | 'alta' | 'critica';
export type OperationalRuleConfidence = 'high' | 'medium' | 'low';
export type OperationalEvidenceType = 'photo' | 'pdf' | 'video' | 'audio' | 'text' | 'document';
export type SuggestedOperationalItemType =
  | 'operational_item'
  | 'nonconformity'
  | 'critical_deviation'
  | 'inspection_followup'
  | 'regulatory_gap';

export interface OperationalSSTRule extends SSTRule {
  contextIds: OperationalContextCatalogId[];
  criticalActivityIds: CriticalActivityCatalogId[];
  checkQuestion: string;
  expectedAnswer: string;
  criticalAnswer: string;
  prioritySuggestion: OperationalRulePriority;
  evidenceTypes: OperationalEvidenceType[];
  suggestedDueHours: number;
  suggestedOperationalItemType: SuggestedOperationalItemType;
  riskTitle: string;
  source: string;
  sourceUpdatedAt: string;
  confidence: OperationalRuleConfidence;
}

type LegacyFixedRule = {
  id?: string;
  nr?: string;
  titulo?: string;
  descricao?: string;
};

const RULES_SOURCE_UPDATED_AT = '2026-05-11';
const LEGACY_RULES = fixedNrRules as LegacyFixedRule[];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildSource(nr: string, title: string): string {
  const normalizedTitle = normalizeText(title);
  const legacy = LEGACY_RULES.find((rule) => {
    if (rule.nr !== nr) return false;
    const legacyText = normalizeText(`${rule.titulo ?? ''} ${rule.descricao ?? ''}`);
    return normalizedTitle
      .split(/\s+/)
      .filter((token) => token.length > 3)
      .some((token) => legacyText.includes(token));
  });

  if (legacy?.id) {
    return `Curadoria operacional ApexOps SST baseada na ${nr} do MTE e reaproveitamento da regra legada ${legacy.id}.`;
  }

  return `Curadoria operacional ApexOps SST baseada na ${nr} do MTE.`;
}

function dedupeOperationalRules(rules: OperationalSSTRule[]) {
  const seen = new Set<string>();
  const deduped: OperationalSSTRule[] = [];
  let duplicatesRemoved = 0;

  rules.forEach((rule) => {
    if (seen.has(rule.id)) {
      duplicatesRemoved += 1;
      return;
    }

    seen.add(rule.id);
    deduped.push(rule);
  });

  return {
    deduped,
    duplicatesRemoved,
  };
}

function createNrRule(input: {
  id: string;
  title: string;
  nr: string;
  contextIds: OperationalContextCatalogId[];
  criticalActivityIds: CriticalActivityCatalogId[];
  checkQuestion: string;
  expectedAnswer: string;
  criticalAnswer: string;
  severity: SSTRule['severity'];
  prioritySuggestion: OperationalRulePriority;
  requiresEvidence: boolean;
  evidenceTypes: OperationalEvidenceType[];
  suggestedDueHours: number;
  suggestedOperationalItemType: SuggestedOperationalItemType;
  riskTitle: string;
  suggestedAction: string;
  confidence: OperationalRuleConfidence;
}) {
  return {
    id: input.id,
    scope: 'nr' as const,
    title: input.title,
    description: input.riskTitle,
    nr: input.nr,
    contextId: input.contextIds[0],
    activityId: input.criticalActivityIds[0],
    package:
      input.nr === 'NR-18' || input.nr === 'NR-35'
        ? 'Construcao Civil'
        : input.nr === 'NR-17' || input.nr === 'NR-23' || input.nr === 'NR-06'
          ? 'Base SST'
          : 'Industria',
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
        normalizeText(`${input.title} ${input.riskTitle} ${input.checkQuestion}`)
          .split(/[^a-z0-9]+/i)
          .filter((token) => token.length > 2)
      )
    ),
    requiredDocuments: [],
    fixed: true,
    editable: false,
    removable: false,
    active: true,
    legalReference: input.nr,
    contextIds: input.contextIds,
    criticalActivityIds: input.criticalActivityIds,
    checkQuestion: input.checkQuestion,
    expectedAnswer: input.expectedAnswer,
    criticalAnswer: input.criticalAnswer,
    prioritySuggestion: input.prioritySuggestion,
    evidenceTypes: input.evidenceTypes,
    suggestedDueHours: input.suggestedDueHours,
    suggestedOperationalItemType: input.suggestedOperationalItemType,
    riskTitle: input.riskTitle,
    source: buildSource(input.nr, input.title),
    sourceUpdatedAt: RULES_SOURCE_UPDATED_AT,
    confidence: input.confidence,
  } satisfies OperationalSSTRule;
}

const RAW_NR_RULES: OperationalSSTRule[] = [
  createNrRule({
    id: 'nr06-epi-ausente',
    title: 'EPI ausente',
    nr: 'NR-06',
    contextIds: ['base_sst', 'industria', 'construcao', 'manutencao', 'logistica', 'facilities', 'porto', 'rural', 'saude'],
    criticalActivityIds: ['altura', 'eletricidade', 'maquinas', 'espaco_confinado', 'movimentacao_cargas', 'produtos_quimicos'],
    checkQuestion: 'O trabalhador possui e utiliza o EPI obrigatorio para a atividade?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 8,
    suggestedOperationalItemType: 'nonconformity',
    riskTitle: 'Exposicao operacional sem protecao individual adequada',
    suggestedAction: 'Disponibilizar o EPI correto, registrar entrega e validar uso antes da continuidade da atividade.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr06-epi-inadequado',
    title: 'EPI danificado ou inadequado',
    nr: 'NR-06',
    contextIds: ['base_sst', 'industria', 'construcao', 'manutencao', 'logistica', 'facilities', 'porto', 'rural', 'saude'],
    criticalActivityIds: ['altura', 'eletricidade', 'maquinas', 'espaco_confinado', 'movimentacao_cargas', 'produtos_quimicos'],
    checkQuestion: 'O EPI esta em condicoes de uso e adequado ao risco da atividade?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 24,
    suggestedOperationalItemType: 'nonconformity',
    riskTitle: 'Protecao individual inadequada para o risco presente',
    suggestedAction: 'Substituir o EPI inadequado ou danificado e registrar validacao em campo.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr10-bloqueio-ausente',
    title: 'Bloqueio eletrico ausente',
    nr: 'NR-10',
    contextIds: ['manutencao', 'industria', 'facilities', 'construcao', 'porto'],
    criticalActivityIds: ['eletricidade'],
    checkQuestion: 'Existe bloqueio e identificacao da energia antes da intervencao eletrica?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'document'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Intervencao eletrica sem controle de energia perigosa',
    suggestedAction: 'Paralisar a atividade, aplicar bloqueio eletrico e validar liberacao segura antes da retomada.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr10-trabalhador-nao-autorizado',
    title: 'Trabalhador nao autorizado para atividade eletrica',
    nr: 'NR-10',
    contextIds: ['manutencao', 'industria', 'facilities', 'construcao', 'porto'],
    criticalActivityIds: ['eletricidade'],
    checkQuestion: 'Somente trabalhador autorizado e habilitado executa a atividade eletrica?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['document', 'photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Execucao eletrica por trabalhador sem autorizacao valida',
    suggestedAction: 'Suspender a atividade e designar profissional autorizado com documentacao valida.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr12-protecao-ausente',
    title: 'Protecao de maquina ausente',
    nr: 'NR-12',
    contextIds: ['industria', 'manutencao', 'construcao', 'rural'],
    criticalActivityIds: ['maquinas'],
    checkQuestion: 'As protecoes da maquina estao instaladas e eficazes?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Operacao de maquina sem barreira de protecao adequada',
    suggestedAction: 'Bloquear o uso da maquina ate recomposicao e validacao da protecao.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr12-parada-inoperante',
    title: 'Parada de emergencia inoperante',
    nr: 'NR-12',
    contextIds: ['industria', 'manutencao', 'construcao', 'rural'],
    criticalActivityIds: ['maquinas'],
    checkQuestion: 'A parada de emergencia esta funcional e acessivel?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'video'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Maquina sem mecanismo efetivo de parada de emergencia',
    suggestedAction: 'Retirar o equipamento de operacao e corrigir a parada de emergencia antes da liberacao.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr12-manutencao-sem-bloqueio',
    title: 'Manutencao de maquina sem bloqueio',
    nr: 'NR-12',
    contextIds: ['industria', 'manutencao', 'construcao', 'rural'],
    criticalActivityIds: ['maquinas', 'eletricidade'],
    checkQuestion: 'A manutencao e executada com bloqueio de energia e impedimento de partida?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'document'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Intervencao em maquina sem bloqueio de energia',
    suggestedAction: 'Suspender a manutencao e aplicar bloqueio formal de todas as energias envolvidas.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr17-posto-inadequado',
    title: 'Posto de trabalho ergonomicamente inadequado',
    nr: 'NR-17',
    contextIds: ['base_sst', 'industria', 'logistica', 'facilities', 'saude'],
    criticalActivityIds: ['ergonomia'],
    checkQuestion: 'O posto de trabalho esta ajustado para reduzir sobrecarga postural e esforco desnecessario?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'media',
    prioritySuggestion: 'media',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 168,
    suggestedOperationalItemType: 'regulatory_gap',
    riskTitle: 'Posto de trabalho com inadequacao ergonomica relevante',
    suggestedAction: 'Adequar posto, altura, alcance e organizacao do trabalho e registrar a melhoria implementada.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr17-repetitividade-sem-controle',
    title: 'Atividade repetitiva sem controle',
    nr: 'NR-17',
    contextIds: ['base_sst', 'industria', 'logistica', 'facilities', 'saude'],
    criticalActivityIds: ['ergonomia'],
    checkQuestion: 'Existem pausas, alternancia ou controles para atividade repetitiva?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'media',
    prioritySuggestion: 'media',
    requiresEvidence: false,
    evidenceTypes: ['document'],
    suggestedDueHours: 168,
    suggestedOperationalItemType: 'regulatory_gap',
    riskTitle: 'Atividade repetitiva sem mecanismo de controle ergonomico',
    suggestedAction: 'Revisar ritmo, pausas e desenho da atividade com controle ergonomico minimo.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr18-area-sem-isolamento',
    title: 'Area de obra sem isolamento ou sinalizacao',
    nr: 'NR-18',
    contextIds: ['construcao', 'facilities', 'manutencao'],
    criticalActivityIds: ['altura', 'movimentacao_cargas', 'incendio'],
    checkQuestion: 'A frente de obra esta isolada e sinalizada para trabalhadores e terceiros?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 8,
    suggestedOperationalItemType: 'nonconformity',
    riskTitle: 'Frente de obra exposta sem controle visivel de isolamento',
    suggestedAction: 'Implantar isolamento e sinalizacao visivel antes de manter a frente aberta.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr18-andaime-irregular',
    title: 'Andaime ou plataforma irregular',
    nr: 'NR-18',
    contextIds: ['construcao', 'facilities', 'manutencao'],
    criticalActivityIds: ['altura'],
    checkQuestion: 'Andaime ou plataforma esta montado, inspecionado e liberado para uso seguro?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'document'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Uso de andaime ou plataforma sem condicao segura comprovada',
    suggestedAction: 'Interditar o acesso e corrigir a estrutura antes da liberacao operacional.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr18-escavacao-sem-controle',
    title: 'Escavacao sem controle',
    nr: 'NR-18',
    contextIds: ['construcao', 'facilities', 'manutencao'],
    criticalActivityIds: ['movimentacao_cargas'],
    checkQuestion: 'A escavacao possui escoramento, acesso, isolamento e controle dos riscos associados?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo', 'document'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Escavacao aberta sem controle minimo de estabilidade e acesso',
    suggestedAction: 'Paralisar a frente, isolar a escavacao e regularizar os controles antes da retomada.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr23-extintor-inacessivel',
    title: 'Extintor ou recurso de combate inacessivel',
    nr: 'NR-23',
    contextIds: ['base_sst', 'industria', 'construcao', 'logistica', 'facilities', 'porto', 'saude', 'rural', 'manutencao'],
    criticalActivityIds: ['incendio'],
    checkQuestion: 'Os recursos de combate a incendio estao acessiveis, identificados e desobstruidos?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 24,
    suggestedOperationalItemType: 'nonconformity',
    riskTitle: 'Recurso de combate a incendio indisponivel no momento de necessidade',
    suggestedAction: 'Desobstruir, sinalizar e validar o acesso imediato ao recurso de combate.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr23-rota-obstruida',
    title: 'Rota de fuga obstruida',
    nr: 'NR-23',
    contextIds: ['base_sst', 'industria', 'construcao', 'logistica', 'facilities', 'porto', 'saude', 'rural', 'manutencao'],
    criticalActivityIds: ['incendio'],
    checkQuestion: 'As rotas de fuga e saidas de emergencia estao livres e utilizaveis?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Evacuacao comprometida por obstrucao de rota de fuga',
    suggestedAction: 'Liberar imediatamente a rota e impedir nova obstrucao com controle visivel.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr33-entrada-sem-permissao',
    title: 'Entrada sem permissao',
    nr: 'NR-33',
    contextIds: ['industria', 'manutencao', 'construcao', 'facilities'],
    criticalActivityIds: ['espaco_confinado'],
    checkQuestion: 'Existe permissao formal de entrada para o espaco confinado?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['document', 'photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Entrada em espaco confinado sem permissao valida',
    suggestedAction: 'Bloquear a entrada, emitir a permissao correta e revisar as liberacoes obrigatorias.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr33-monitoramento-ausente',
    title: 'Ausencia de monitoramento atmosferico',
    nr: 'NR-33',
    contextIds: ['industria', 'manutencao', 'construcao', 'facilities'],
    criticalActivityIds: ['espaco_confinado'],
    checkQuestion: 'O espaco confinado esta com monitoramento atmosferico realizado e valido?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['document', 'photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Espaco confinado sem monitoramento atmosferico confiavel',
    suggestedAction: 'Paralisar a atividade e executar monitoramento atmosferico antes de qualquer entrada.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr33-resgate-ausente',
    title: 'Ausencia de plano de resgate',
    nr: 'NR-33',
    contextIds: ['industria', 'manutencao', 'construcao', 'facilities'],
    criticalActivityIds: ['espaco_confinado'],
    checkQuestion: 'Existe plano de resgate definido e recursos disponiveis para o espaco confinado?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['document', 'photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Espaco confinado sem prontidao de resgate',
    suggestedAction: 'Suspender a entrada e estruturar plano e recursos de resgate antes da liberacao.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr35-protecao-queda-ausente',
    title: 'Protecao contra queda ausente',
    nr: 'NR-35',
    contextIds: ['construcao', 'facilities', 'manutencao', 'industria', 'porto'],
    criticalActivityIds: ['altura'],
    checkQuestion: 'As protecoes coletivas e individuais contra queda estao implementadas e validas?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'critica',
    prioritySuggestion: 'critica',
    requiresEvidence: true,
    evidenceTypes: ['photo'],
    suggestedDueHours: 0,
    suggestedOperationalItemType: 'critical_deviation',
    riskTitle: 'Trabalho em altura sem protecao eficaz contra queda',
    suggestedAction: 'Paralisar a atividade e implantar imediatamente as protecoes contra queda.',
    confidence: 'high',
  }),
  createNrRule({
    id: 'nr35-planejamento-ausente',
    title: 'Planejamento de trabalho em altura ausente',
    nr: 'NR-35',
    contextIds: ['construcao', 'facilities', 'manutencao', 'industria', 'porto'],
    criticalActivityIds: ['altura'],
    checkQuestion: 'O trabalho em altura possui planejamento, analise de risco e permissao quando aplicavel?',
    expectedAnswer: 'sim',
    criticalAnswer: 'nao',
    severity: 'alta',
    prioritySuggestion: 'alta',
    requiresEvidence: true,
    evidenceTypes: ['document'],
    suggestedDueHours: 8,
    suggestedOperationalItemType: 'inspection_followup',
    riskTitle: 'Trabalho em altura iniciado sem planejamento operacional minimo',
    suggestedAction: 'Planejar a atividade, emitir documentacao e validar liberacao antes do inicio.',
    confidence: 'high',
  }),
];

const dedupeResult = dedupeOperationalRules(RAW_NR_RULES);

export const NR_RULES: OperationalSSTRule[] = dedupeResult.deduped;
export const NR_RULES_COUNT = NR_RULES.length;
export const NR_RULES_DUPLICATES_REMOVED = dedupeResult.duplicatesRemoved;

export function getRulesByNr(nr: string): OperationalSSTRule[] {
  return NR_RULES.filter((rule) => rule.nr === nr);
}
