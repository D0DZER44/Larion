import { ChecklistTemplate } from './store';

export const INITIAL_CHECKLISTS: ChecklistTemplate[] = [
  // --- BASE SST ---
  {
    id: 'chk-nr-06-base',
    titulo: 'NR-06 — Uso e controle de EPI',
    category: 'EPI',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral'],
    nr: 'NR-06',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Verificação de EPI',
        questions: [
          { id: 'q1', text: 'O trabalhador utiliza o EPI obrigatório para a função?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'O EPI possui CA (Certificado de Aprovação) válido?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q3', text: 'O EPI está em bom estado de conservação?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q4', text: 'Existe registro de entrega assinado pelo trabalhador?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-17-base',
    titulo: 'NR-17 — Ergonomia básica',
    category: 'Ergonomia',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral', 'Administrativo'],
    nr: 'NR-17',
    criticidadePadrao: 'Média',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Posto de Trabalho',
        questions: [
          { id: 'q1', text: 'A altura do monitor está adequada ao nível dos olhos?', type: 'Sim / Não / Parcialmente', riskMap: 'Baixo' },
          { id: 'q2', text: 'A cadeira permite ajuste de altura e encosto?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q3', text: 'Existe suporte para os pés se necessário?', type: 'Sim / Não / Parcialmente', riskMap: 'Baixo' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-23-base',
    titulo: 'NR-23 — Proteção contra incêndio',
    category: 'Segurança',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral'],
    nr: 'NR-23',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Equipamentos de Combate',
        questions: [
          { id: 'q1', text: 'Os extintores estão dentro do prazo de validade?', type: 'Sim / Não / Parcialmente', riskMap: 'Critica' },
          { id: 'q2', text: 'O acesso aos extintores está desobstruído?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q3', text: 'A sinalização de emergência está visível?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-24-base',
    titulo: 'NR-24 — Condições sanitárias e conforto',
    category: 'Saúde e Conforto',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral'],
    nr: 'NR-24',
    criticidadePadrao: 'Média',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Instalações',
        questions: [
          { id: 'q1', text: 'Os sanitários estão em condições adequadas de higiene?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q2', text: 'Existe local adequado para refeições?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-26-base',
    titulo: 'NR-26 — Sinalização de segurança',
    category: 'Sinalização',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral'],
    nr: 'NR-26',
    criticidadePadrao: 'Baixa',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Sinalização Visual',
        questions: [
          { id: 'q1', text: 'As cores de segurança estão sendo utilizadas corretamente?', type: 'Sim / Não / Parcialmente', riskMap: 'Baixo' },
          { id: 'q2', text: 'Produtos químicos estão rotulados conforme GHS?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-01-base',
    titulo: 'NR-01 — Gerenciamento de riscos ocupacionais',
    category: 'Gestão',
    status: 'Ativo',
    pacote: 'Base SST',
    segmentos: ['Todos'],
    atividades: ['Geral'],
    nr: 'NR-01',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Gestão de Riscos',
        questions: [
          { id: 'q1', text: 'O PGR está atualizado e disponível?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'Os riscos identificados possuem plano de ação?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },

  // --- CONSTRUÇÃO CIVIL ---
  {
    id: 'chk-nr-18-const',
    titulo: 'NR-18 — Condições de segurança em obra',
    category: 'Construção Civil',
    status: 'Ativo',
    pacote: 'Construção Civil',
    segmentos: ['Construção Civil'],
    atividades: ['Obras', 'Canteiro'],
    nr: 'NR-18',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Canteiro de Obras',
        questions: [
          { id: 'q1', text: 'Existe proteção coletiva contra quedas em periferias?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'As áreas de circulação estão desobstruídas?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-35-const',
    titulo: 'NR-35 — Trabalho em altura',
    category: 'Atividade Crítica',
    status: 'Ativo',
    pacote: 'Construção Civil',
    segmentos: ['Todos'],
    atividades: ['Trabalho em altura'],
    nr: 'NR-35',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Segurança em Altura',
        questions: [
          { id: 'q1', text: 'O trabalhador possui treinamento para NR-35?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'O sistema de ancoragem foi inspecionado?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q3', text: 'O talabarte está conectado a ponto seguro?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-33-const',
    titulo: 'NR-33 — Espaço confinado',
    category: 'Atividade Crítica',
    status: 'Ativo',
    pacote: 'Construção Civil',
    segmentos: ['Todos'],
    atividades: ['Espaço Confinado'],
    nr: 'NR-33',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Entrada em Espaço Confinado',
        questions: [
          { id: 'q1', text: 'A PET (Permissão de Entrada e Trabalho) foi emitida?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'A atmosfera foi testada antes da entrada?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-10-const',
    titulo: 'NR-10 — Instalações elétricas temporárias',
    category: 'Elétrica',
    status: 'Ativo',
    pacote: 'Construção Civil',
    segmentos: ['Construção Civil'],
    atividades: ['Eletricidade'],
    nr: 'NR-10',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Painéis e Cabos',
        questions: [
          { id: 'q1', text: 'Os quadros elétricos estão trancados e sinalizados?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'Os cabos estão protegidos contra danos mecânicos?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-12-const',
    titulo: 'NR-12 — Máquinas/equipamentos de obra',
    category: 'Máquinas',
    status: 'Ativo',
    pacote: 'Construção Civil',
    segmentos: ['Construção Civil'],
    atividades: ['Operação de Máquinas'],
    nr: 'NR-12',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Equipamentos de Obra',
        questions: [
          { id: 'q1', text: 'A betoneira possui proteção nas partes móveis?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'A serra circular possui coifa e cutelo?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },

  // --- INDÚSTRIA ---
  {
    id: 'chk-nr-12-ind',
    titulo: 'NR-12 — Máquinas e proteções',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria'],
    atividades: ['Operação de Máquinas'],
    nr: 'NR-12',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Proteção de Máquinas',
        questions: [
          { id: 'q1', text: 'As proteções fixas e móveis com intertravamento estão funcionais?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'O botão de emergência é de fácil acesso?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-10-ind',
    titulo: 'NR-10 — Eletricidade e bloqueio',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria'],
    atividades: ['Manutenção', 'Eletricidade'],
    nr: 'NR-10',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Bloqueio e Etiquetagem (LOTO)',
        questions: [
          { id: 'q1', text: 'Foi realizado o bloqueio de energia antes da intervenção?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'O cartão de identificação está preenchido corretamente?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-11-ind',
    titulo: 'NR-11 — Movimentação de materiais',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria', 'Logística'],
    atividades: ['Logística', 'Movimentação de Carga'],
    nr: 'NR-11',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Equipamentos de Movimentação',
        questions: [
          { id: 'q1', text: 'A empilhadeira possui alarme de ré e giroflex?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q2', text: 'Cintas e correntes de içamento foram inspecionadas?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-13-ind',
    titulo: 'NR-13 — Caldeiras/vasos de pressão',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria'],
    atividades: ['Caldeiras', 'Vasos de Pressão'],
    nr: 'NR-13',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Integridade de Vasos',
        questions: [
          { id: 'q1', text: 'A válvula de segurança está calibrada?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'O manômetro está operando na faixa correta?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-15-ind',
    titulo: 'NR-15 — Agentes insalubres',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria'],
    atividades: ['Geral'],
    nr: 'NR-15',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Higiene Ocupacional',
        questions: [
          { id: 'q1', text: 'Os limites de ruído estão sendo respeitados?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q2', text: 'A ventilação no local é adequada para os contaminantes?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-20-ind',
    titulo: 'NR-20 — Inflamáveis e combustíveis',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria', 'Química'],
    atividades: ['Inflamáveis'],
    nr: 'NR-20',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Tanques e Armazenamento',
        questions: [
          { id: 'q1', text: 'Os tanques possuem bacia de contenção?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'O aterramento elétrico foi verificado?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-26-ind',
    titulo: 'NR-26 — Produtos químicos e sinalização',
    category: 'Indústria',
    status: 'Ativo',
    pacote: 'Indústria',
    segmentos: ['Indústria'],
    atividades: ['Geral'],
    nr: 'NR-26',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Identificação Química',
        questions: [
          { id: 'q1', text: 'As embalagens possuem rótulo conforme padrão internacional?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'As FISPQ estão acessíveis aos trabalhadores?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' }
        ]
      }
    ]
  },

  // --- SAÚDE/HOSPITALAR ---
  {
    id: 'chk-nr-32-saude',
    titulo: 'NR-32 — Risco biológico e serviços de saúde',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-32',
    criticidadePadrao: 'Crítica',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Risco Biológico',
        questions: [
          { id: 'q1', text: 'Existe plano de proteção contra riscos biológicos?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' },
          { id: 'q2', text: 'Os perfurocortantes possuem dispositivo de segurança?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-06-saude',
    titulo: 'NR-06 — EPIs específicos saúde',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-06',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Proteção Individual',
        questions: [
          { id: 'q1', text: 'As luvas utilizadas são adequadas ao procedimento?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'O descarte de EPIs contaminados segue o protocolo?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-15-saude',
    titulo: 'NR-15 — Agentes biológicos/químicos',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-15',
    criticidadePadrao: 'Alta',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Exposição Ocupacional',
        questions: [
          { id: 'q1', text: 'Há monitoramento de agentes químicos esterilizantes?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' },
          { id: 'q2', text: 'O esquema vacinal dos trabalhadores está atualizado?', type: 'Sim / Não / Parcialmente', riskMap: 'Crítica' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-17-saude',
    titulo: 'NR-17 — Ergonomia assistencial',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-17',
    criticidadePadrao: 'Média',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Ergonomia em Saúde',
        questions: [
          { id: 'q1', text: 'Existem dispositivos auxiliares para transporte de pacientes?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q2', text: 'O posto de enfermagem possui ergonomia adequada?', type: 'Sim / Não / Parcialmente', riskMap: 'Baixa' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-24-saude',
    titulo: 'NR-24 — Condições de conforto saúde',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-24',
    criticidadePadrao: 'Média',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Conforto Higiênico',
        questions: [
          { id: 'q1', text: 'Os vestiários são separados por gênero e higienizados?', type: 'Sim / Não / Parcialmente', riskMap: 'Baixo' },
          { id: 'q2', text: 'A água para consumo humano é potável e acessível?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' }
        ]
      }
    ]
  },
  {
    id: 'chk-nr-26-saude',
    titulo: 'NR-26 — Sinalização e identificação saúde',
    category: 'Saúde',
    status: 'Ativo',
    pacote: 'Saúde/Hospitalar',
    segmentos: ['Saúde', 'Hospitalar'],
    atividades: ['Atendimento em Saúde'],
    nr: 'NR-26',
    criticidadePadrao: 'Média',
    ativo: true,
    sections: [
      {
        id: 'sec-1',
        title: 'Sinalização em Saúde',
        questions: [
          { id: 'q1', text: 'Existe identificação clara de áreas de risco biológico?', type: 'Sim / Não / Parcialmente', riskMap: 'Média' },
          { id: 'q2', text: 'Os recipientes de resíduos estão identificados por tipo?', type: 'Sim / Não / Parcialmente', riskMap: 'Alta' }
        ]
      }
    ]
  }
];
