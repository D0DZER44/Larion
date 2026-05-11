import {
  getExpectedEvidenceByRisk,
  getRecommendedActionsByRisk,
  getRiskById,
  SECTOR_RISK_TEMPLATES,
} from "./sectorRiskTemplates.js";

/**
 * Activity templates grouped by sector, with inherited Base SST logic kept
 * separate from segment-specific package ownership.
 */

export const ACTIVITY_TEMPLATES = [
  {
    id: "manutencao-eletrica",
    nome: "manutencao eletrica",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["eletricidade"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["choque-eletrico", "arco-eletrico", "queimadura", "energizacao-acidental", "falta-de-bloqueio", "falta-de-epi", "ferramenta-inadequada"],
    checklistPadrao: ["bloqueio aplicado", "identificacao do circuito", "isolamento da area", "sinalizacao visivel", "capacitação valida", "EPI eletrico disponivel", "ferramenta isolada e adequada", "risco de contato eliminado", "emergencia conhecida pela equipe"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "instalacao-eletrica",
    nome: "instalacao eletrica",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["choque-eletrico", "contato-com-parte-energizada", "falta-de-sinalizacao", "falta-de-epi"],
    checklistPadrao: ["projeto ou ordem validada", "sinalizacao da area", "isolamento fisico", "ferramenta adequada", "EPI em uso", "plano de emergencia conhecido"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "inspecao-de-paineis",
    nome: "inspecao de paineis",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["choque-eletrico", "arco-eletrico", "contato-com-parte-energizada", "falta-de-sinalizacao"],
    checklistPadrao: ["painel identificado", "acesso controlado", "barreira ou tampa integra", "ausencia de improviso", "registro de inspecao atualizado"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "troca-de-disjuntores",
    nome: "troca de disjuntores",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["choque-eletrico", "energizacao-acidental", "falta-de-bloqueio", "ferramenta-inadequada"],
    checklistPadrao: ["desenergizacao confirmada", "bloqueio e etiquetagem aplicados", "ferramenta isolada", "componente correto validado", "registro da troca realizado"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "bloqueio-e-etiquetagem",
    nome: "bloqueio e etiquetagem",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["uso-de-epi"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["falta-de-bloqueio", "energizacao-acidental", "falta-de-sinalizacao"],
    checklistPadrao: ["fonte identificada", "bloqueio aplicado", "etiqueta instalada", "ausencia de tensao testada", "liberacao registrada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "servico-proximo-a-rede-energizada",
    nome: "servico proximo a rede energizada",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-10", "NR-23", "NR-26"],
    riskIds: ["contato-com-parte-energizada", "arco-eletrico", "falta-de-epi", "falta-de-sinalizacao"],
    checklistPadrao: ["distancia de seguranca validada", "isolamento adicional aplicado", "equipe capacitada", "resgate previsto", "comunicacao da atividade realizada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "uso-de-ferramenta-eletrica",
    nome: "uso de ferramenta eletrica",
    setorId: "eletrica",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-10"],
    riskIds: ["choque-eletrico", "ferramenta-inadequada", "queimadura"],
    checklistPadrao: ["ferramenta inspecionada", "cabo e plug integros", "disjuntor diferencial disponivel", "EPI em uso"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "manutencao-mecanica",
    nome: "manutencao mecanica",
    setorId: "manutencao",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-12", "NR-26"],
    riskIds: ["prensamento", "falta-de-bloqueio", "ferramenta-inadequada"],
    checklistPadrao: ["energia isolada", "ferramenta adequada", "pecas travadas", "sinalizacao instalada"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "lubrificacao-industrial",
    nome: "lubrificacao industrial",
    setorId: "manutencao",
    packageIds: ["Industria"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-12"],
    riskIds: ["prensamento", "escorregamento", "falta-de-epi"],
    checklistPadrao: ["maquina bloqueada", "ponto de acesso protegido", "residuo coletado", "area limpa"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "72h",
  },
  {
    id: "setup-de-producao",
    nome: "setup de producao",
    setorId: "producao",
    packageIds: ["Industria"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-12", "NR-17"],
    riskIds: ["prensamento", "ergonomia-inadequada", "falta-de-epi"],
    checklistPadrao: ["ajustes seguros", "protecao ativa", "postura adequada", "treinamento valido"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "48h",
  },
  {
    id: "abastecimento-de-linha",
    nome: "abastecimento de linha",
    setorId: "producao",
    packageIds: ["Industria"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-11", "NR-17"],
    riskIds: ["carga-mal-ancorada", "ergonomia-inadequada", "colisao-empilhadeira"],
    checklistPadrao: ["rota livre", "carga estavel", "meio de transporte adequado", "postura operacional observada"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "72h",
  },
  {
    id: "recebimento-de-materiais",
    nome: "recebimento de materiais",
    setorId: "almoxarifado",
    packageIds: ["Logistica", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-11", "NR-17", "NR-26"],
    riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "escorregamento"],
    checklistPadrao: ["rota sinalizada", "area organizada", "carga identificada", "inspecao visual da descarga"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "72h",
  },
  {
    id: "movimentacao-com-empilhadeira",
    nome: "movimentacao com empilhadeira",
    setorId: "logistica-movimentacao",
    packageIds: ["Logistica", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["movimentacao-de-carga"],
    relatedNrs: ["NR-01", "NR-06", "NR-11", "NR-26"],
    riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "falta-de-sinalizacao"],
    checklistPadrao: ["operador habilitado", "rota segregada", "capacidade respeitada", "alarme funcional"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "trabalho-em-canteiro",
    nome: "trabalho em canteiro",
    setorId: "obra",
    packageIds: ["Construcao Civil"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["construcao-civil"],
    relatedNrs: ["NR-01", "NR-06", "NR-18", "NR-23", "NR-26"],
    riskIds: ["queda-de-altura", "soterramento", "falta-de-sinalizacao"],
    checklistPadrao: ["protecao coletiva instalada", "rotas desobstruidas", "area isolada", "equipe orientada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "escavacao",
    nome: "escavacao",
    setorId: "obra",
    packageIds: ["Construcao Civil"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-18", "NR-33", "NR-26"],
    riskIds: ["soterramento", "falta-de-sinalizacao"],
    checklistPadrao: ["talude protegido", "rede subterranea avaliada", "acesso seguro", "area sinalizada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "higienizacao-hospitalar",
    nome: "higienizacao hospitalar",
    setorId: "saude-hospitalar",
    packageIds: ["Saude/Hospitalar"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-17", "NR-32"],
    riskIds: ["contaminacao-biologica", "perfurocortante", "escorregamento"],
    checklistPadrao: ["barreira biologica aplicada", "coleta segregada", "EPI de higiene disponivel", "quimico identificado"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "soldagem",
    nome: "soldagem",
    setorId: "solda",
    packageIds: ["Industria", "Construcao Civil", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-18", "NR-23"],
    riskIds: ["queimadura", "fumos-metalicos", "incendio"],
    checklistPadrao: ["cortina de solda instalada", "extintor acessivel", "ventilacao adequada", "EPI facial e corporal em uso"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "operacao-de-maquinas",
    nome: "operacao de maquinas",
    setorId: "maquinas",
    packageIds: ["Industria"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["maquina-sem-protecao"],
    relatedNrs: ["NR-01", "NR-06", "NR-12", "NR-17"],
    riskIds: ["prensamento", "falta-de-bloqueio", "falta-de-epi"],
    checklistPadrao: ["protecao instalada", "chave de emergencia funcional", "treinamento valido", "rotina de inspecao registrada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "entrada-em-espaco-confinado",
    nome: "entrada em espaco confinado",
    setorId: "espaco-confinado",
    packageIds: ["Industria", "Construcao Civil", "Portuario", "Saude/Hospitalar"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["espaco-confinado"],
    relatedNrs: ["NR-01", "NR-06", "NR-23", "NR-26", "NR-33"],
    riskIds: ["espaco-confinado-sem-pet", "exposicao-quimica", "incendio"],
    checklistPadrao: ["PET emitida", "atmosfera testada", "vigia designado", "resgate previsto", "area isolada"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "trabalho-em-altura",
    nome: "trabalho em altura",
    setorId: "altura",
    packageIds: ["Construcao Civil", "Industria", "Portuario", "Logistica"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["trabalho-em-altura"],
    relatedNrs: ["NR-01", "NR-06", "NR-18", "NR-35"],
    riskIds: ["queda-de-altura", "falta-de-epi", "falta-de-sinalizacao"],
    checklistPadrao: ["analise de risco aprovada", "ancoragem validada", "linha de vida instalada", "EPI de altura em uso", "plano de resgate conhecido"],
    severidadeSugerida: "Critica",
    prioridadeSugerida: "P1",
    prazoSugerido: "Imediato",
  },
  {
    id: "manuseio-de-quimicos",
    nome: "manuseio de quimicos",
    setorId: "quimicos",
    packageIds: ["Industria", "Saude/Hospitalar", "Logistica", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    aliases: ["inflamaveis"],
    relatedNrs: ["NR-01", "NR-06", "NR-20", "NR-23", "NR-26"],
    riskIds: ["exposicao-quimica", "incendio", "explosao"],
    checklistPadrao: ["FISPQ disponivel", "embalagem identificada", "ventilacao adequada", "EPI quimico em uso", "kit de emergencia disponivel"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "brigada-e-inspecao-de-extintores",
    nome: "brigada e inspecao de extintores",
    setorId: "incendio-emergencia",
    packageIds: ["Base SST", "Industria", "Construcao Civil", "Saude/Hospitalar", "Logistica", "Portuario", "Escritorio/Administrativo"],
    inheritedPackageIds: [],
    aliases: ["emergencia-incendio", "sinalizacao"],
    relatedNrs: ["NR-01", "NR-06", "NR-23", "NR-26"],
    riskIds: ["incendio", "explosao", "falta-de-sinalizacao"],
    checklistPadrao: ["extintor inspecionado", "rota sinalizada", "brigada definida", "acesso desobstruido", "alarme funcional"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "avaliacao-ergonomica",
    nome: "avaliacao ergonomica",
    setorId: "ergonomia",
    packageIds: ["Base SST", "Escritorio/Administrativo", "Logistica", "Industria", "Saude/Hospitalar"],
    inheritedPackageIds: [],
    aliases: ["ergonomia"],
    relatedNrs: ["NR-01", "NR-17"],
    riskIds: ["ergonomia-inadequada"],
    checklistPadrao: ["posto ajustado", "pausas definidas", "levantamento de carga avaliado", "cadeira e apoio adequados"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "7 dias",
  },
  {
    id: "atividade-administrativa",
    nome: "atividade administrativa",
    setorId: "administrativo",
    packageIds: ["Base SST", "Escritorio/Administrativo"],
    inheritedPackageIds: [],
    relatedNrs: ["NR-01", "NR-17", "NR-23", "NR-26"],
    riskIds: ["ergonomia-inadequada", "escorregamento"],
    checklistPadrao: ["posto organizado", "rota de fuga conhecida", "cabeamento seguro", "pausa operacional prevista"],
    severidadeSugerida: "Media",
    prioridadeSugerida: "P3",
    prazoSugerido: "7 dias",
  },
  {
    id: "carga-e-descarga",
    nome: "carga e descarga",
    setorId: "logistica-movimentacao",
    packageIds: ["Logistica", "Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-11", "NR-17", "NR-26"],
    riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "falta-de-sinalizacao"],
    checklistPadrao: ["doca organizada", "calco instalado", "carga travada", "rota segregada", "operador habilitado"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "assistencia-hospitalar",
    nome: "assistencia hospitalar",
    setorId: "saude-hospitalar",
    packageIds: ["Saude/Hospitalar"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-07", "NR-17", "NR-32"],
    riskIds: ["contaminacao-biologica", "perfurocortante", "ergonomia-inadequada"],
    checklistPadrao: ["higienizacao das maos", "barreira biologica", "descarte adequado", "posto ergonomico ajustado"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
  {
    id: "operacao-portuaria",
    nome: "operacao portuaria",
    setorId: "logistica-movimentacao",
    packageIds: ["Portuario"],
    inheritedPackageIds: ["Base SST"],
    relatedNrs: ["NR-01", "NR-06", "NR-11", "NR-23", "NR-26", "NR-29"],
    riskIds: ["colisao-empilhadeira", "carga-mal-ancorada", "incendio"],
    checklistPadrao: ["acesso controlado", "operador habilitado", "sinalizacao de cais", "comunicacao por radio validada"],
    severidadeSugerida: "Alta",
    prioridadeSugerida: "P2",
    prazoSugerido: "24h",
  },
];

export const ACTIVITY_TEMPLATES_BY_ID = ACTIVITY_TEMPLATES.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export const SECTORS = SECTOR_RISK_TEMPLATES.map((sector) => ({
  id: sector.id,
  nome: sector.nome,
  packageIds: sector.packageIds,
}));

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getActivitiesBySector(sectorId) {
  const normalized = normalizeValue(sectorId);
  return ACTIVITY_TEMPLATES.filter((item) => normalizeValue(item.setorId) === normalized);
}

export function getActivityById(activityId) {
  const normalized = normalizeValue(activityId);
  return ACTIVITY_TEMPLATES.find((item) => {
    if (normalizeValue(item.id) === normalized) return true;
    if (normalizeValue(item.nome) === normalized) return true;
    return Array.isArray(item.aliases)
      ? item.aliases.some((alias) => normalizeValue(alias) === normalized)
      : false;
  });
}

export function getRisksByActivity(activityId) {
  const activity = getActivityById(activityId);
  if (!activity) return [];
  return activity.riskIds.map((riskId) => getRiskById(riskId)).filter(Boolean);
}

export function getChecklistByActivity(activityId) {
  const activity = getActivityById(activityId);
  if (!activity) return [];
  return activity.checklistPadrao.map((label, index) => ({
    id: `${activity.id}-check-${String(index + 1).padStart(2, "0")}`,
    label,
  }));
}

export function getRecommendedActionsForActivity(activityId) {
  return Array.from(
    new Set(
      getRisksByActivity(activityId).flatMap((risk) => getRecommendedActionsByRisk(risk.id)),
    ),
  );
}

export function getExpectedEvidenceForActivity(activityId) {
  return Array.from(
    new Set(
      getRisksByActivity(activityId).flatMap((risk) => getExpectedEvidenceByRisk(risk.id)),
    ),
  );
}
