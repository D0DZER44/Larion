/**
 * Sector and risk templates used by the package-driven SST motor.
 */

export const STANDARD_RISK_LIBRARY = [
  {
    id: "choque-eletrico",
    nome: "choque eletrico",
    nrs: ["NR-01", "NR-06", "NR-10"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "bloquear fonte de energia",
      "interromper atividade se houver exposicao ativa",
      "revalidar procedimento eletrico antes da retomada",
    ],
    evidenciasEsperadas: [
      "foto do bloqueio",
      "foto do painel ou quadro",
      "registro da autorizacao",
    ],
  },
  {
    id: "arco-eletrico",
    nome: "arco eletrico",
    nrs: ["NR-06", "NR-10"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "isolar area de intervencao",
      "validar vestimenta e protecao contra arco",
      "revisar procedimento de energizacao e desenergizacao",
    ],
    evidenciasEsperadas: [
      "foto dos EPIs",
      "foto da isolacao da area",
      "registro da permissao de trabalho",
    ],
  },
  {
    id: "queimadura",
    nome: "queimadura",
    nrs: ["NR-06", "NR-10", "NR-20"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "substituir ferramenta inadequada",
      "reforcar barreiras e protecoes",
      "revalidar procedimento de seguranca",
    ],
    evidenciasEsperadas: [
      "foto da ferramenta regularizada",
      "foto dos EPIs",
    ],
  },
  {
    id: "incendio",
    nome: "incendio",
    nrs: ["NR-01", "NR-10", "NR-20", "NR-23", "NR-26"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "interromper atividade se houver risco iminente",
      "isolar area",
      "sinalizar e revisar plano de emergencia",
    ],
    evidenciasEsperadas: [
      "foto da sinalizacao",
      "foto da area isolada",
      "registro da autorizacao",
    ],
  },
  {
    id: "energizacao-acidental",
    nome: "energizacao acidental",
    nrs: ["NR-10", "NR-23", "NR-26"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "reaplicar bloqueio e etiquetagem",
      "sinalizar o ponto de energia",
      "confirmar ausencia de tensao antes da retomada",
    ],
    evidenciasEsperadas: [
      "foto do bloqueio",
      "foto da sinalizacao",
      "foto do painel ou quadro",
    ],
  },
  {
    id: "contato-com-parte-energizada",
    nome: "contato com parte energizada",
    nrs: ["NR-06", "NR-10"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "isolar condutores expostos",
      "suspender a atividade ate adequacao",
      "validar distancias de seguranca",
    ],
    evidenciasEsperadas: [
      "foto da isolacao",
      "foto dos EPIs",
    ],
  },
  {
    id: "falta-de-bloqueio",
    nome: "falta de bloqueio",
    nrs: ["NR-10", "NR-12"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "bloquear fonte",
      "etiquetar ponto de energia",
      "registrar liberacao segura",
    ],
    evidenciasEsperadas: [
      "foto do bloqueio",
      "registro da autorizacao",
    ],
  },
  {
    id: "falta-de-sinalizacao",
    nome: "falta de sinalizacao",
    nrs: ["NR-23", "NR-26"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "sinalizar a area",
      "instalar identificacao de risco",
    ],
    evidenciasEsperadas: [
      "foto da sinalizacao",
    ],
  },
  {
    id: "falta-de-epi",
    nome: "falta de EPI",
    nrs: ["NR-06"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "fornecer e substituir EPI",
      "registrar entrega e orientacao",
    ],
    evidenciasEsperadas: [
      "foto dos EPIs",
      "registro da autorizacao",
    ],
  },
  {
    id: "ferramenta-inadequada",
    nome: "ferramenta inadequada",
    nrs: ["NR-10", "NR-12"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "48h",
    acoesRecomendadas: [
      "substituir ferramenta",
      "retirar ferramenta nao conforme de uso",
    ],
    evidenciasEsperadas: [
      "foto da ferramenta regularizada",
    ],
  },
  {
    id: "queda-de-altura",
    nome: "queda de altura",
    nrs: ["NR-06", "NR-18", "NR-35"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "interromper atividade se critico",
      "instalar linha de vida ou ancoragem adequada",
      "reforcar inspecao de altura",
    ],
    evidenciasEsperadas: [
      "foto da ancoragem",
      "foto dos EPIs",
    ],
  },
  {
    id: "soterramento",
    nome: "soterramento",
    nrs: ["NR-18", "NR-33"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "escorar talude",
      "isolar area de obra",
    ],
    evidenciasEsperadas: [
      "foto da escoracao",
      "foto da sinalizacao",
    ],
  },
  {
    id: "prensamento",
    nome: "prensamento",
    nrs: ["NR-12"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "interditar maquina",
      "regularizar protecoes moveis e fixas",
    ],
    evidenciasEsperadas: [
      "foto da protecao instalada",
      "foto da maquina regularizada",
    ],
  },
  {
    id: "colisao-empilhadeira",
    nome: "colisao com empilhadeira",
    nrs: ["NR-11", "NR-26"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "segregar fluxo de pedestres",
      "sinalizar rotas internas",
    ],
    evidenciasEsperadas: [
      "foto da sinalizacao",
      "foto da rota segregada",
    ],
  },
  {
    id: "carga-mal-ancorada",
    nome: "carga mal ancorada",
    nrs: ["NR-11"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "reancorar carga",
      "inspecionar acessorios de amarracao",
    ],
    evidenciasEsperadas: [
      "foto da carga regularizada",
    ],
  },
  {
    id: "exposicao-quimica",
    nome: "exposicao quimica",
    nrs: ["NR-06", "NR-20"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "revisar FISPQ e procedimento",
      "substituir ou reforcar EPI",
    ],
    evidenciasEsperadas: [
      "foto dos EPIs",
      "registro da autorizacao",
    ],
  },
  {
    id: "fumos-metalicos",
    nome: "fumos metalicos",
    nrs: ["NR-06", "NR-17"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "48h",
    acoesRecomendadas: [
      "adequar exaustao local",
      "reforcar protecao respiratoria",
    ],
    evidenciasEsperadas: [
      "foto da exaustao",
      "foto dos EPIs",
    ],
  },
  {
    id: "espaco-confinado-sem-pet",
    nome: "espaco confinado sem PET",
    nrs: ["NR-33"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "interromper atividade se critico",
      "emitir PET antes do ingresso",
    ],
    evidenciasEsperadas: [
      "registro da autorizacao",
      "foto da sinalizacao",
    ],
  },
  {
    id: "ergonomia-inadequada",
    nome: "ergonomia inadequada",
    nrs: ["NR-17"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "7 dias",
    acoesRecomendadas: [
      "ajustar posto de trabalho",
      "reorganizar rotina e pausas",
    ],
    evidenciasEsperadas: [
      "foto do posto ajustado",
    ],
  },
  {
    id: "contaminacao-biologica",
    nome: "contaminacao biologica",
    nrs: ["NR-06", "NR-32"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "isolar material contaminado",
      "reforcar barreira biologica e descarte",
    ],
    evidenciasEsperadas: [
      "foto do descarte correto",
      "foto dos EPIs",
    ],
  },
  {
    id: "perfurocortante",
    nome: "perfurocortante",
    nrs: ["NR-06", "NR-32"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
    acoesRecomendadas: [
      "adequar descarte em coletor rigido",
      "substituir dispositivo inseguro",
    ],
    evidenciasEsperadas: [
      "foto do coletor",
      "foto da adequacao do posto",
    ],
  },
  {
    id: "escorregamento",
    nome: "escorregamento",
    nrs: ["NR-01", "NR-17", "NR-26"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "72h",
    acoesRecomendadas: [
      "sinalizar piso molhado",
      "regularizar limpeza e organizacao",
    ],
    evidenciasEsperadas: [
      "foto da sinalizacao",
      "foto da area limpa",
    ],
  },
  {
    id: "explosao",
    nome: "explosao",
    nrs: ["NR-20", "NR-23"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
    acoesRecomendadas: [
      "interromper atividade se critico",
      "eliminar fonte de ignicao",
      "isolar area e acionar emergencia",
    ],
    evidenciasEsperadas: [
      "foto da area isolada",
      "registro da autorizacao",
    ],
  },
];

export const SECTOR_RISK_TEMPLATES = [
  { id: "eletrica", nome: "Eletrica", packageIds: ["Industria", "Construcao Civil", "Portuario"], riskIds: ["choque-eletrico", "arco-eletrico", "queimadura", "incendio", "energizacao-acidental", "contato-com-parte-energizada", "falta-de-bloqueio", "falta-de-sinalizacao", "falta-de-epi", "ferramenta-inadequada"] },
  { id: "manutencao", nome: "Manutencao", packageIds: ["Industria", "Construcao Civil", "Portuario"], riskIds: ["prensamento", "ferramenta-inadequada", "falta-de-bloqueio", "choque-eletrico"] },
  { id: "producao", nome: "Producao", packageIds: ["Industria"], riskIds: ["prensamento", "ergonomia-inadequada", "falta-de-epi"] },
  { id: "almoxarifado", nome: "Almoxarifado", packageIds: ["Logistica", "Portuario"], riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "escorregamento"] },
  { id: "obra", nome: "Obra", packageIds: ["Construcao Civil"], riskIds: ["queda-de-altura", "soterramento", "falta-de-sinalizacao"] },
  { id: "limpeza", nome: "Limpeza", packageIds: ["Base SST", "Saude/Hospitalar"], riskIds: ["escorregamento", "exposicao-quimica", "contaminacao-biologica"] },
  { id: "solda", nome: "Solda", packageIds: ["Industria", "Construcao Civil", "Portuario"], riskIds: ["queimadura", "fumos-metalicos", "incendio"] },
  { id: "maquinas", nome: "Maquinas", packageIds: ["Industria"], riskIds: ["prensamento", "falta-de-bloqueio", "falta-de-epi"] },
  { id: "espaco-confinado", nome: "Espaco confinado", packageIds: ["Industria", "Construcao Civil", "Portuario", "Saude/Hospitalar"], riskIds: ["espaco-confinado-sem-pet", "incendio", "exposicao-quimica"] },
  { id: "altura", nome: "Altura", packageIds: ["Construcao Civil", "Industria", "Portuario", "Logistica"], riskIds: ["queda-de-altura", "falta-de-epi", "falta-de-sinalizacao"] },
  { id: "quimicos", nome: "Quimicos", packageIds: ["Industria", "Saude/Hospitalar", "Logistica", "Portuario"], riskIds: ["exposicao-quimica", "incendio", "explosao"] },
  { id: "incendio-emergencia", nome: "Incendio/Emergencia", packageIds: ["Base SST", "Industria", "Construcao Civil", "Saude/Hospitalar", "Logistica", "Portuario", "Escritorio/Administrativo"], riskIds: ["incendio", "explosao", "falta-de-sinalizacao"] },
  { id: "ergonomia", nome: "Ergonomia", packageIds: ["Base SST", "Escritorio/Administrativo", "Logistica", "Industria", "Saude/Hospitalar"], riskIds: ["ergonomia-inadequada"] },
  { id: "administrativo", nome: "Administrativo", packageIds: ["Base SST", "Escritorio/Administrativo"], riskIds: ["ergonomia-inadequada", "escorregamento"] },
  { id: "logistica-movimentacao", nome: "Logistica/Movimentacao", packageIds: ["Logistica", "Portuario"], riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "falta-de-sinalizacao"] },
  { id: "saude-hospitalar", nome: "Saude/Hospitalar", packageIds: ["Saude/Hospitalar"], riskIds: ["contaminacao-biologica", "perfurocortante", "escorregamento"] },
];

export const RISK_LIBRARY_BY_ID = STANDARD_RISK_LIBRARY.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export const SECTOR_RISK_TEMPLATES_BY_ID = SECTOR_RISK_TEMPLATES.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export function listRiskTemplates() {
  return [...STANDARD_RISK_LIBRARY];
}

export function getRiskById(riskId) {
  return RISK_LIBRARY_BY_ID[riskId];
}

export function getRiskTemplatesBySector(sectorId) {
  const sector = SECTOR_RISK_TEMPLATES_BY_ID[sectorId];
  if (!sector) return [];
  return sector.riskIds.map((riskId) => getRiskById(riskId)).filter(Boolean);
}

export function getRecommendedActionsByRisk(riskId) {
  return getRiskById(riskId)?.acoesRecomendadas || [];
}

export function getExpectedEvidenceByRisk(riskId) {
  return getRiskById(riskId)?.evidenciasEsperadas || [];
}

