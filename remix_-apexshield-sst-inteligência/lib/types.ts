export type NivelRisco = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica' | 'P1' | 'P2' | 'P3' | 'P4' | 'Urgente';
export type StatusRisco = 'Aberto' | 'Em mitigação' | 'Mitigado' | 'Resolvido' | 'Vencido' | 'Identificado';
export type StatusAcao = 'Pendente' | 'Em aberto' | 'Em andamento' | 'Iniciada' | 'Concluída' | 'Concluído' | 'Fechada' | 'Cancelada' | 'Vencida' | 'Em atraso' | 'Atrasada';
export type StatusInspecao = 'Agendada' | 'Programada' | 'Em andamento' | 'Iniciada' | 'Realizada' | 'Concluída' | 'Reprovada' | 'Atrasada' | 'Cancelada' | 'Anulada' | 'Pendente';
export type Pacote = 'Base SST' | 'Construção Civil' | 'Indústria' | 'Saúde/Hospitalar';

export interface Risco {
  id: string;
  titulo: string;
  descricao?: string;
  setor: string;
  nr: string;
  nivel: NivelRisco;
  criticidade?: NivelRisco;
  origem?: string;
  severidade?: string;
  probabilidade?: string;
  status: StatusRisco;
  prioridade: Prioridade;
  prazo?: string;
  responsavel?: string;
  acaoVinculada?: string;
  evidencias?: string;
  multaEstimada?: number;
  chanceIncidente?: number;
  pacote: Pacote;
  criadoEm: string;
  atualizadoEm?: string;
  atividade?: string;
  sector_id?: string;
  package?: Pacote;
}

export interface Acao {
  id: string;
  titulo: string;
  descricao?: string;
  oQue?: string;
  porQue?: string;
  onde?: string;
  quem?: string;
  quando?: string;
  como?: string;
  quantoCusta?: number;
  setor?: string;
  status: StatusAcao;
  prioridade: Prioridade;
  prazo?: string;
  responsavel?: string;
  riscoId?: string;
  inspecaoId?: string;
  progresso?: number;
  pacote: Pacote;
  criadoEm: string;
  atualizadoEm?: string;
  valorEstimado?: number;
  exigeEvidencia?: boolean;
}

export interface Inspecao {
  id: string;
  titulo: string;
  setor: string;
  data: string;
  inspector?: string;
  status: StatusInspecao;
  score?: number;
  checklistId?: string;
  items?: any[];
  observacoes?: string;
  pacote: Pacote;
  criadoEm: string;
  atualizadoEm?: string;
}

export type Alerta = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'Ativo' | 'Lido' | 'Arquivado';
  severity: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  origin: 'Risco' | 'Ação' | 'Inspeção' | 'Checklist' | 'Sistema';
  originId?: string;
  package?: string;
  nr?: string;
  createdAt: string;
  link?: string;
};

export type LogEntry = {
  id: string;
  empresa_id: string;
  user_id: string;
  event_type: string;
  description: string;
  origin_type?: string;
  origin_id?: string;
  created_at: string;
  metadata?: any;
};

export type User = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  avatar: string;
};

export type Sector = {
  id: string;
  name: string;
};

export type Organization = {
  segmento: string;
  atividadesCriticas: string[];
  porte: string;
  tipoOperacao: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  emailCorporativo: string;
  endereco: string;
  seed_demo?: boolean;
  name?: string;
  segment?: string;
};

export type RulePackage = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  segment: string;
  ruleCount: number;
  isLocked?: boolean;
};

export type RiskRule = {
  id: string;
  titulo: string;
  pacote: string;
  segmentos: string[];
  atividades: string[];
  nrRelacionada: string;
  itemNormativoOpcional?: string;
  gatilhosTexto?: string[];
  criticidade: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  condicao: string;
  acaoSugerida: string;
  prazoPadraoHoras: number;
  exigeEvidencia: boolean;
  geraMultaEstimativa?: boolean;
  faixaMultaPadrao?: string;
  ativo: boolean;
};

// Cada pergunta do checklist é também uma regra de risco. Quando a resposta é
// "Não" / "Parcialmente" o motor usa estes 8 campos para gerar risco + ação:
//   pergunta, NR, pacote, criticidade, ação sugerida, exige evidência?, gera risco?, prazo padrão.
// Os campos marcados como obrigatórios pelo motor são preenchidos por
// `enrichChecklistQuestion` quando o template ainda não os trouxer.
export type ChecklistQuestion = {
  id: string;
  text: string;
  type: string;
  riskMap?: string;

  // Campos do motor de risco
  nrRelacionada?: string;            // NR vinculada (herdada do checklist se ausente)
  pacote?: string;                   // pacote da regra (Base SST, Indústria, ...)
  criticidade?: 'Baixo' | 'Médio' | 'Média' | 'Alto' | 'Alta' | 'Crítico' | 'Crítica';
  acaoSugerida?: string;             // ação sugerida quando a resposta é Não/Parcialmente
  exigeEvidencia?: boolean;          // se true, a ação precisa de foto/anexo
  geraRisco?: boolean;               // dispara risco automático ao responder Não
  geraAcao?: boolean;                // dispara ação automática (default: igual a geraRisco)
  prazoPadraoHoras?: number;         // prazo da ação corretiva
  bloqueante?: boolean;              // paralisa a operação até regularizar
  impactaScore?: boolean;
  tipoRisco?: string;                // tipo do risco (Segurança, Saúde, Ergonômico...)
  regraId?: string;                  // id da regra fixa NR vinculada
  regraFixa?: boolean;
  editavel?: boolean;
  removivel?: boolean;
  // Permitir extensões sem precisar editar este tipo a cada novo campo
  [key: string]: any;
};

export type ChecklistSection = {
  id: string;
  title: string;
  questions: ChecklistQuestion[];
};

export type ChecklistTemplate = {
  id: string;
  titulo: string;
  category: string;
  status: 'Ativo' | 'Rascunho' | 'Inativo' | 'Revisar';
  proximaRevisao?: string;
  sections: ChecklistSection[];
  pacote: string;
  segmentos: string[];
  atividades: string[];
  nr: string;
  criticidadePadrao?: 'Baixo' | 'Médio' | 'Alta' | 'Crítica';
  geraRiscoSeNaoConforme?: boolean;
  ativo: boolean;
  regraFixa?: boolean;
  segmento?: string;
  atividade?: string;
  nrRelacionada?: string;
};
