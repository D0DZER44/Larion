/**
 * Declarative NR catalog used by the JS normative engine.
 */

export const NR_CATALOG = [
  { codigo: "NR-01", nome: "Disposições Gerais e GRO", pacote: "Base SST", ativa: true },
  { codigo: "NR-06", nome: "Equipamento de Proteção Individual", pacote: "Base SST", ativa: true },
  { codigo: "NR-07", nome: "PCMSO", pacote: "Saúde", ativa: true },
  { codigo: "NR-10", nome: "Segurança em Eletricidade", pacote: "Indústria", ativa: true },
  { codigo: "NR-11", nome: "Movimentação e Armazenagem", pacote: "Logística", ativa: true },
  { codigo: "NR-12", nome: "Máquinas e Equipamentos", pacote: "Indústria", ativa: true },
  { codigo: "NR-17", nome: "Ergonomia", pacote: "Base SST", ativa: true },
  { codigo: "NR-18", nome: "Construção Civil", pacote: "Construção Civil", ativa: true },
  { codigo: "NR-20", nome: "Inflamáveis e Combustíveis", pacote: "Indústria", ativa: true },
  { codigo: "NR-23", nome: "Proteção Contra Incêndios", pacote: "Base SST", ativa: true },
  { codigo: "NR-26", nome: "Sinalização de Segurança", pacote: "Base SST", ativa: true },
  { codigo: "NR-33", nome: "Espaços Confinados", pacote: "Indústria", ativa: true },
  { codigo: "NR-35", nome: "Trabalho em Altura", pacote: "Construção Civil", ativa: true },
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
