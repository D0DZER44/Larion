import { SECTORS } from "./activityTemplates.js";

export const NR_SEGMENTS = [
  {
    id: "Base SST",
    nome: "Base SST",
    descricao: "Fundacao obrigatoria de conformidade para qualquer operacao.",
    packageId: "Base SST",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-17", "NR-23", "NR-26"],
    atividadesCriticas: ["brigada-e-inspecao-de-extintores", "avaliacao-ergonomica", "atividade-administrativa"],
    sectorIds: ["incendio-emergencia", "ergonomia", "administrativo", "limpeza"],
    aliases: ["base-sst"],
    ativo: true,
  },
  {
    id: "Construcao Civil",
    nome: "Construcao Civil",
    descricao: "Operacoes de obra, altura, escavacao e eletrica de canteiro.",
    packageId: "Construcao Civil",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-10", "NR-11", "NR-18", "NR-23", "NR-26", "NR-33", "NR-35"],
    atividadesCriticas: ["trabalho-em-canteiro", "escavacao", "trabalho-em-altura", "instalacao-eletrica"],
    sectorIds: ["obra", "altura", "eletrica", "solda", "espaco-confinado"],
    aliases: ["construcao-civil"],
    ativo: true,
  },
  {
    id: "Industria",
    nome: "Industria",
    descricao: "Maquinas, manutencao, energia, quimicos e producao industrial.",
    packageId: "Industria",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-10", "NR-12", "NR-17", "NR-20", "NR-23", "NR-26", "NR-33", "NR-35"],
    atividadesCriticas: ["manutencao-eletrica", "operacao-de-maquinas", "manuseio-de-quimicos", "entrada-em-espaco-confinado"],
    sectorIds: ["eletrica", "manutencao", "producao", "solda", "maquinas", "quimicos", "espaco-confinado"],
    aliases: ["industria"],
    ativo: true,
  },
  {
    id: "Saude/Hospitalar",
    nome: "Saude/Hospitalar",
    descricao: "Servicos de saude, higienizacao assistencial e controle biologico.",
    packageId: "Saude/Hospitalar",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-07", "NR-17", "NR-23", "NR-26", "NR-32", "NR-33"],
    atividadesCriticas: ["assistencia-hospitalar", "higienizacao-hospitalar"],
    sectorIds: ["saude-hospitalar", "limpeza", "ergonomia", "espaco-confinado"],
    aliases: ["saude", "saude-hospitalar"],
    ativo: true,
  },
  {
    id: "Logistica",
    nome: "Logistica",
    descricao: "Movimentacao, armazenagem, carga e descarga.",
    packageId: "Logistica",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-11", "NR-17", "NR-20", "NR-23", "NR-26", "NR-35"],
    atividadesCriticas: ["movimentacao-com-empilhadeira", "carga-e-descarga"],
    sectorIds: ["almoxarifado", "logistica-movimentacao", "altura"],
    aliases: ["logistica"],
    ativo: true,
  },
  {
    id: "Portuario",
    nome: "Portuario",
    descricao: "Operacoes portuarias, cais, carga pesada e energia embarcada.",
    packageId: "Portuario",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-10", "NR-11", "NR-20", "NR-23", "NR-26", "NR-29", "NR-33", "NR-35"],
    atividadesCriticas: ["operacao-portuaria", "manutencao-eletrica", "carga-e-descarga"],
    sectorIds: ["eletrica", "almoxarifado", "logistica-movimentacao", "espaco-confinado", "altura", "quimicos"],
    aliases: ["portuario"],
    ativo: true,
  },
  {
    id: "Escritorio/Administrativo",
    nome: "Escritorio/Administrativo",
    descricao: "Postos administrativos, ergonomia e prontidao basica de emergencia.",
    packageId: "Escritorio/Administrativo",
    nrsRecomendadas: ["NR-01", "NR-17", "NR-23", "NR-26"],
    atividadesCriticas: ["atividade-administrativa", "avaliacao-ergonomica"],
    sectorIds: ["administrativo", "ergonomia", "incendio-emergencia"],
    aliases: ["escritorio", "administrativo", "escritorio-administrativo"],
    ativo: true,
  },
];

export const NR_SEGMENTS_BY_ID = NR_SEGMENTS.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

function matchesSegment(segment, value) {
  if (!value) return false;
  const normalized = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const segmentId = String(segment.id)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const segmentName = String(segment.nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    segmentId === normalized ||
    segmentName === normalized ||
    (Array.isArray(segment.aliases) &&
      segment.aliases.some(
        (alias) =>
          String(alias)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase() === normalized,
      ))
  );
}

export function findSegmentById(id) {
  return NR_SEGMENTS.find((item) => matchesSegment(item, id));
}

export function listActiveSegments() {
  return NR_SEGMENTS.filter((item) => item.ativo !== false);
}

export function listSegmentsForNR(code) {
  return NR_SEGMENTS.filter((item) => item.nrsRecomendadas.includes(code));
}

export function listSegmentsByPackage(packageId) {
  return NR_SEGMENTS.filter((item) => matchesSegment({ ...item, id: item.packageId, nome: item.packageId }, packageId));
}

export function getSectorsByPackage(packageId) {
  const sectorIds = new Set(
    listSegmentsByPackage(packageId).flatMap((segment) => segment.sectorIds || []),
  );
  return SECTORS.filter((sector) => sectorIds.has(sector.id));
}
