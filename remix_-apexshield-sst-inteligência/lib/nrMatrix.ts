export type NRTipo = 'geral' | 'setorial' | 'atividadeCritica';
export type NRPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface NRMetadata {
  id: string;
  nome: string;
  descricaoCurta: string;
  pacote: string;
  segmentosAplicaveis: string[];
  atividadesRelacionadas: string[];
  tipo: NRTipo;
  ativa: boolean;
  prioridadePadrao: NRPrioridade;
  geraChecklist: boolean;
  geraRisco: boolean;
  geraMultaEstimativa: boolean;
}

export const NR_MATRIX: NRMetadata[] = [
  // --- Base SST ---
  {
    id: "NR-01",
    nome: "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    descricaoCurta: "Estabelece as disposições gerais, o campo de aplicação, os termos e as definições comuns às NRs.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-03",
    nome: "Embargo e Interdição",
    descricaoCurta: "Diretrizes para caracterização de grave e iminente risco.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-04",
    nome: "SESMT",
    descricaoCurta: "Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: false,
    geraMultaEstimativa: true
  },
  {
    id: "NR-05",
    nome: "CIPA",
    descricaoCurta: "Comissão Interna de Prevenção de Acidentes e de Assédio.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: false,
    geraMultaEstimativa: true
  },
  {
    id: "NR-06",
    nome: "EPI",
    descricaoCurta: "Equipamentos de Proteção Individual.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-07",
    nome: "PCMSO",
    descricaoCurta: "Programa de Controle Médico de Saúde Ocupacional.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-09",
    nome: "Avaliação e Controle das Exposições Ocupacionais",
    descricaoCurta: "Critérios para avaliação das exposições ocupacionais a agentes físicos, químicos e biológicos.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-17",
    nome: "Ergonomia",
    descricaoCurta: "Visa a estabelecer as diretrizes e os requisitos que permitam a adaptação das condições de trabalho.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral", "Administrativo"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Média",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-23",
    nome: "Proteção Contra Incêndios",
    descricaoCurta: "Medidas de proteção contra incêndio nos locais de trabalho.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-24",
    nome: "Condições Sanitárias e de Conforto",
    descricaoCurta: "Condições sanitárias e de conforto nos locais de trabalho.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Média",
    geraChecklist: true,
    geraRisco: false,
    geraMultaEstimativa: true
  },
  {
    id: "NR-26",
    nome: "Sinalização de Segurança",
    descricaoCurta: "Normas de sinalização de segurança nos locais de trabalho.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Baixa",
    geraChecklist: true,
    geraRisco: false,
    geraMultaEstimativa: true
  },
  {
    id: "NR-28",
    nome: "Fiscalização e Penalidades",
    descricaoCurta: "Critérios para fiscalização e aplicação de penalidades.",
    pacote: "Base SST",
    segmentosAplicaveis: ["Todos"],
    atividadesRelacionadas: ["Geral"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Média",
    geraChecklist: false,
    geraRisco: false,
    geraMultaEstimativa: false
  },

  // --- Construção Civil ---
  {
    id: "NR-18",
    nome: "Segurança e Saúde no Trabalho na Construção",
    descricaoCurta: "Diretrizes de ordem administrativa, de planejamento e de organização na construção civil.",
    pacote: "Construção Civil",
    segmentosAplicaveis: ["Construção Civil"],
    atividadesRelacionadas: ["Obras", "Reformas", "Canteiro"],
    tipo: "setorial",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },

  // --- Indústria (e compartilhadas) ---
  {
    id: "NR-10",
    nome: "Segurança em Instalações e Serviços em Eletricidade",
    descricaoCurta: "Requisitos mínimos para a implementação de medidas de controle e sistemas preventivos.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Construção Civil", "Energia", "Manutenção"],
    atividadesRelacionadas: ["Eletricidade", "Manutenção Elétrica"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-11",
    nome: "Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
    descricaoCurta: "Normas de segurança para operação de elevadores, guindastes, transportadores e empilhadeiras.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Logística", "Portuário"],
    atividadesRelacionadas: ["Logística", "Movimentação de Carga"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-12",
    nome: "Segurança no Trabalho em Máquinas e Equipamentos",
    descricaoCurta: "Referências técnicas, princípios fundamentais e medidas de proteção para máquinas.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Construção Civil", "Metalurgia"],
    atividadesRelacionadas: ["Operação de Máquinas", "Manutenção Industrial"],
    tipo: "setorial",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-13",
    nome: "Caldeiras, Vasos de Pressão e Tubulações",
    descricaoCurta: "Requisitos mínimos para gestão da integridade estrutural de caldeiras e vasos de pressão.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Química", "Petroquímica"],
    atividadesRelacionadas: ["Caldeiras", "Vasos de Pressão"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-15",
    nome: "Atividades e Operações Insalubres",
    descricaoCurta: "Define os limites de tolerância para agentes agressivos.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Saúde", "Metalurgia"],
    atividadesRelacionadas: ["Exposição a Agentes Nocivos"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-16",
    nome: "Atividades e Operações Perigosas",
    descricaoCurta: "Regulamenta as atividades e operações consideradas perigosas para fins de adicional.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Logística", "Energia"],
    atividadesRelacionadas: ["Periculosidade"],
    tipo: "geral",
    ativa: true,
    prioridadePadrao: "Alta",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-20",
    nome: "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
    descricaoCurta: "Requisitos mínimos para a gestão da segurança e saúde no trabalho com inflamáveis.",
    pacote: "Indústria",
    segmentosAplicaveis: ["Indústria", "Postos de Combustível", "Química"],
    atividadesRelacionadas: ["Inflamáveis", "Abastecimento"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-33",
    nome: "Segurança e Saúde no Trabalho em Espaços Confinados",
    descricaoCurta: "Requisitos mínimos para identificação de espaços confinados e reconhecimento, avaliação, monitoramento.",
    pacote: "Construção Civil",
    segmentosAplicaveis: ["Construção Civil", "Indústria", "Saneamento"],
    atividadesRelacionadas: ["Espaço Confinado", "Manutenção de Tanques"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },
  {
    id: "NR-35",
    nome: "Trabalho em Altura",
    descricaoCurta: "Requisitos mínimos e as medidas de proteção para o trabalho em altura.",
    pacote: "Construção Civil",
    segmentosAplicaveis: ["Construção Civil", "Indústria", "Energia", "Portuário"],
    atividadesRelacionadas: ["Trabalho em altura", "Andaimaria"],
    tipo: "atividadeCritica",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  },

  // --- Saúde/Hospitalar ---
  {
    id: "NR-32",
    nome: "Segurança e Saúde no Trabalho em Estabelecimentos de Saúde",
    descricaoCurta: "Diretrizes básicas para a implementação de medidas de proteção à segurança e à saúde dos trabalhadores dos serviços de saúde.",
    pacote: "Saúde",
    segmentosAplicaveis: ["Saúde", "Hospitalar", "Clínicas"],
    atividadesRelacionadas: ["Biossegurança", "Atendimento em Saúde"],
    tipo: "setorial",
    ativa: true,
    prioridadePadrao: "Crítica",
    geraChecklist: true,
    geraRisco: true,
    geraMultaEstimativa: true
  }
];

interface GetNRsParams {
  segmentoOrganizacao?: string;
  atividadesCriticas?: string[];
  pacotesAtivos: string[];
}

// Helper: extrai número da NR (NR-01 -> 1) para ordenação numérica.
export function getNrIdNumber(id?: string): number {
  if (!id) return 9999;
  const m = String(id).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 9999;
}

// Comparador padrão: NR (numérica) e nome (alfabético, pt-BR).
export function compareNRs(a: NRMetadata, b: NRMetadata): number {
  const numA = getNrIdNumber(a.id);
  const numB = getNrIdNumber(b.id);
  if (numA !== numB) return numA - numB;
  return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
}

// View ordenada da matriz, útil quando o display precisa de ordem fixa.
export const NR_MATRIX_ORDENADA: NRMetadata[] = [...NR_MATRIX].sort(compareNRs);

export function getNRsAplicaveis({
  segmentoOrganizacao,
  atividadesCriticas = [],
  pacotesAtivos
}: GetNRsParams): NRMetadata[] {
  // 1. Sempre inclui Base SST
  const nrsBase = NR_MATRIX.filter(nr => nr.pacote === 'Base SST');

  // 2. NRs dos pacotes ativos
  const nrsPacotes = NR_MATRIX.filter(nr => pacotesAtivos.includes(nr.pacote));

  // 3. NRs compatíveis com o segmento
  const nrsSegmento = segmentoOrganizacao
    ? NR_MATRIX.filter(nr => nr.segmentosAplicaveis.includes(segmentoOrganizacao))
    : [];

  // 4. NRs compatíveis com atividades críticas (pelo menos uma atividade relacionada batendo)
  const nrsAtividades = NR_MATRIX.filter(nr =>
    nr.atividadesRelacionadas.some(rel => atividadesCriticas.includes(rel))
  );

  // Unificar e remover duplicatas pelo ID
  const allNrs = [...nrsBase, ...nrsPacotes, ...nrsSegmento, ...nrsAtividades];
  const uniqueNrs = Array.from(new Map(allNrs.map(nr => [nr.id, nr])).values());

  // Ordena resultado em ordem numérica de NR e alfabética por nome
  return uniqueNrs.sort(compareNRs);
}
