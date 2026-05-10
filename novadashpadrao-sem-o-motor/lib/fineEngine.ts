/**
 * NR-28 Fine Estimation Engine
 * Based on Brazilian Regulatory Standard NR-28 (Fiscalização e Penalidades)
 */

export type FineEngineInput = {
  nr: string;
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica' | string;
  numeroEmpregados: number;
  reincidencia?: boolean;
  tipoInfracao?: 'Segurança' | 'Medicina';
  nivelInfracao?: 'I1' | 'I2' | 'I3' | 'I4';
};

export type FineEstimation = {
  minimoEstimado: number;
  maximoEstimado: number;
  faixaLabel: string;
  baseLegal: string;
  disclaimer: string;
};

// Simplified NR-28 Table (Values in BRL - estimated values based on UFIR/Current conversion logic)
// Portes: 1-10, 11-25, 26-50, 51-100, 101-250, 251-500, 501-1000, 1000+
const FINE_TABLE = {
  Segurança: {
    I1: [
      { min: 630, max: 729 },    // 1-10
      { min: 730, max: 830 },    // 11-25
      { min: 831, max: 932 },    // 26-50
      { min: 933, max: 1034 },   // 51-100
      { min: 1035, max: 1136 },  // 101-250
      { min: 1137, max: 1238 },  // 251-500
      { min: 1239, max: 1340 },  // 501-1000
      { min: 1341, max: 1442 },  // 1000+
    ],
    I2: [
      { min: 1129, max: 1318 },
      { min: 1319, max: 1500 },
      { min: 1501, max: 1690 },
      { min: 1691, max: 1870 },
      { min: 1871, max: 2060 },
      { min: 2061, max: 2250 },
      { min: 2251, max: 2440 },
      { min: 2441, max: 2630 },
    ],
    I3: [
      { min: 1691, max: 1999 },
      { min: 2000, max: 2300 },
      { min: 2301, max: 2600 },
      { min: 2601, max: 2900 },
      { min: 2901, max: 3200 },
      { min: 3201, max: 3500 },
      { min: 3501, max: 3800 },
      { min: 3801, max: 4100 },
    ],
    I4: [
      { min: 2252, max: 2792 },
      { min: 2793, max: 3332 },
      { min: 3333, max: 3872 },
      { min: 3873, max: 4412 },
      { min: 4413, max: 4952 },
      { min: 4953, max: 5492 },
      { min: 5493, max: 6032 },
      { min: 6033, max: 6572 },
    ]
  },
  Medicina: {
     I1: [
      { min: 630, max: 729 },
      { min: 730, max: 830 },
      { min: 831, max: 932 },
      { min: 933, max: 1034 },
      { min: 1035, max: 1136 },
      { min: 1137, max: 1238 },
      { min: 1239, max: 1340 },
      { min: 1341, max: 1442 },
    ],
    I2: [
      { min: 1129, max: 1318 },
      { min: 1319, max: 1500 },
      { min: 1501, max: 1690 },
      { min: 1691, max: 1870 },
      { min: 1871, max: 2060 },
      { min: 2061, max: 2250 },
      { min: 2251, max: 2440 },
      { min: 2441, max: 2630 },
    ],
    I3: [
      { min: 1691, max: 1999 },
      { min: 2000, max: 2300 },
      { min: 2301, max: 2600 },
      { min: 2601, max: 2900 },
      { min: 2901, max: 3200 },
      { min: 3201, max: 3500 },
      { min: 3501, max: 3800 },
      { min: 3801, max: 4100 },
    ],
    I4: [
      { min: 2252, max: 2792 },
      { min: 2793, max: 3332 },
      { min: 3333, max: 3872 },
      { min: 3873, max: 4412 },
      { min: 4413, max: 4952 },
      { min: 4953, max: 5492 },
      { min: 5493, max: 6032 },
      { min: 6033, max: 6572 },
    ]
  }
};

const getPorteIndex = (num: number): number => {
  if (num <= 10) return 0;
  if (num <= 25) return 1;
  if (num <= 50) return 2;
  if (num <= 100) return 3;
  if (num <= 250) return 4;
  if (num <= 500) return 5;
  if (num <= 1000) return 6;
  return 7;
};

export const FineEngine = {
  calcularFaixaMulta(input: FineEngineInput): FineEstimation {
    const { nr, criticidade, numeroEmpregados, reincidencia, tipoInfracao = 'Segurança' } = input;

    // Mapping criticidade to level
    let nivel = input.nivelInfracao;
    if (!nivel) {
      const crit = criticidade.toLowerCase();
      if (crit.includes('crític')) nivel = 'I4';
      else if (crit.includes('alt')) nivel = 'I3';
      else if (crit.includes('méd') || crit.includes('med')) nivel = 'I2';
      else nivel = 'I1';
    }

    const porteIdx = getPorteIndex(numeroEmpregados);
    const tableBranch = FINE_TABLE[tipoInfracao] || FINE_TABLE.Segurança;
    const values = tableBranch[nivel!] || tableBranch.I1;
    const range = values[porteIdx];

    let min = range.min;
    let max = range.max;

    // Fator Reincidência
    if (reincidencia) {
      // Typically doubling or applying a factor. NR-28 allows for increases.
      min = min * 2;
      max = max * 2.5; 
    }

    const formatBRL = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return {
      minimoEstimado: Math.round(min),
      maximoEstimado: Math.round(max),
      faixaLabel: `${formatBRL(min)} a ${formatBRL(max)}`,
      baseLegal: "NR-28",
      disclaimer: "Estimativa operacional baseada na UFIR/Portaria vigente. O valor oficial depende de enquadramento fiscal, item normativo específico, porte real e critérios da autoridade fiscalizadora."
    };
  }
};
