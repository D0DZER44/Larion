export const NR_SEGMENTS = [
  {
    id: "Base SST",
    nome: "Base SST",
    nrsRecomendadas: ["NR-01", "NR-06", "NR-17", "NR-23", "NR-26"],
    atividadesCriticas: ["uso-de-epi", "ergonomia", "emergencia-incendio", "sinalizacao"],
  },
  {
    id: "Construção Civil",
    nome: "Construção Civil",
    nrsRecomendadas: ["NR-18", "NR-35", "NR-06", "NR-11"],
    atividadesCriticas: ["trabalho-em-altura", "construcao-civil", "movimentacao-de-carga"],
  },
  {
    id: "Indústria",
    nome: "Indústria",
    nrsRecomendadas: ["NR-10", "NR-12", "NR-20", "NR-33", "NR-06"],
    atividadesCriticas: ["eletricidade", "maquina-sem-protecao", "inflamaveis", "espaco-confinado"],
  },
  {
    id: "Logística",
    nome: "Logística",
    nrsRecomendadas: ["NR-11", "NR-17", "NR-06"],
    atividadesCriticas: ["movimentacao-de-carga", "ergonomia"],
  },
  {
    id: "Escritório/Administrativo",
    nome: "Escritório / Administrativo",
    nrsRecomendadas: ["NR-17", "NR-23", "NR-26"],
    atividadesCriticas: ["ergonomia", "emergencia-incendio"],
  },
];

export const NR_SEGMENTS_BY_ID = NR_SEGMENTS.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export function findSegmentById(id) {
  return NR_SEGMENTS_BY_ID[id];
}

export function listActiveSegments() {
  return [...NR_SEGMENTS];
}

export function listSegmentsForNR(code) {
  return NR_SEGMENTS.filter((item) => item.nrsRecomendadas.includes(code));
}
