/**
 * Declarative NR catalog for the JS normative engine.
 * The package field represents the primary package owner, while relatedPackages
 * expresses where the NR is inherited or commonly applied.
 */

export const NR_CATALOG = [
  {
    codigo: "NR-01",
    nome: "Disposicoes Gerais e GRO",
    pacote: "Base SST",
    relatedPackages: [
      "Base SST",
      "Construcao Civil",
      "Industria",
      "Saude/Hospitalar",
      "Logistica",
      "Portuario",
      "Escritorio/Administrativo",
    ],
    ativa: true,
  },
  {
    codigo: "NR-06",
    nome: "Equipamento de Protecao Individual",
    pacote: "Base SST",
    relatedPackages: [
      "Base SST",
      "Construcao Civil",
      "Industria",
      "Saude/Hospitalar",
      "Logistica",
      "Portuario",
      "Escritorio/Administrativo",
    ],
    ativa: true,
  },
  {
    codigo: "NR-07",
    nome: "PCMSO",
    pacote: "Saude/Hospitalar",
    relatedPackages: ["Saude/Hospitalar", "Base SST"],
    ativa: true,
  },
  {
    codigo: "NR-10",
    nome: "Seguranca em Instalacoes e Servicos em Eletricidade",
    pacote: "Industria",
    relatedPackages: ["Industria", "Construcao Civil", "Portuario"],
    ativa: true,
  },
  {
    codigo: "NR-11",
    nome: "Transporte, Movimentacao, Armazenagem e Manuseio de Materiais",
    pacote: "Logistica",
    relatedPackages: ["Logistica", "Construcao Civil", "Portuario", "Industria"],
    ativa: true,
  },
  {
    codigo: "NR-12",
    nome: "Seguranca no Trabalho em Maquinas e Equipamentos",
    pacote: "Industria",
    relatedPackages: ["Industria", "Construcao Civil", "Portuario"],
    ativa: true,
  },
  {
    codigo: "NR-17",
    nome: "Ergonomia",
    pacote: "Base SST",
    relatedPackages: [
      "Base SST",
      "Escritorio/Administrativo",
      "Logistica",
      "Industria",
      "Saude/Hospitalar",
    ],
    ativa: true,
  },
  {
    codigo: "NR-18",
    nome: "Condicoes de Seguranca e Saude na Industria da Construcao",
    pacote: "Construcao Civil",
    relatedPackages: ["Construcao Civil"],
    ativa: true,
  },
  {
    codigo: "NR-20",
    nome: "Seguranca e Saude no Trabalho com Inflamaveis e Combustiveis",
    pacote: "Industria",
    relatedPackages: ["Industria", "Portuario", "Logistica"],
    ativa: true,
  },
  {
    codigo: "NR-23",
    nome: "Protecao Contra Incendios",
    pacote: "Base SST",
    relatedPackages: [
      "Base SST",
      "Construcao Civil",
      "Industria",
      "Saude/Hospitalar",
      "Logistica",
      "Portuario",
      "Escritorio/Administrativo",
    ],
    ativa: true,
  },
  {
    codigo: "NR-26",
    nome: "Sinalizacao de Seguranca",
    pacote: "Base SST",
    relatedPackages: [
      "Base SST",
      "Construcao Civil",
      "Industria",
      "Saude/Hospitalar",
      "Logistica",
      "Portuario",
      "Escritorio/Administrativo",
    ],
    ativa: true,
  },
  {
    codigo: "NR-29",
    nome: "Seguranca e Saude no Trabalho Portuario",
    pacote: "Portuario",
    relatedPackages: ["Portuario"],
    ativa: true,
  },
  {
    codigo: "NR-32",
    nome: "Seguranca e Saude no Trabalho em Servicos de Saude",
    pacote: "Saude/Hospitalar",
    relatedPackages: ["Saude/Hospitalar"],
    ativa: true,
  },
  {
    codigo: "NR-33",
    nome: "Seguranca e Saude nos Trabalhos em Espacos Confinados",
    pacote: "Industria",
    relatedPackages: ["Industria", "Construcao Civil", "Portuario", "Saude/Hospitalar"],
    ativa: true,
  },
  {
    codigo: "NR-35",
    nome: "Trabalho em Altura",
    pacote: "Construcao Civil",
    relatedPackages: ["Construcao Civil", "Industria", "Portuario", "Logistica"],
    ativa: true,
  },
];

export const NR_CATALOG_BY_CODE = NR_CATALOG.reduce((accumulator, item) => {
  accumulator[item.codigo] = item;
  return accumulator;
}, {});

export function listActiveNRs() {
  return NR_CATALOG.filter((item) => item.ativa);
}

export function findNRByCode(code) {
  return NR_CATALOG_BY_CODE[code];
}

