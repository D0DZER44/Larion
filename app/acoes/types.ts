export type AcaoStatus = 'Pendente' | 'Em andamento' | 'Vencida' | 'Concluída' | 'Cancelada';

export type AcaoPrioridade = 'Crítica' | 'Alta' | 'Média' | 'Baixa';

export type ActionHistoricoEvent = {
  id: string;
  actionId: string;
  evento: string;
  origem: string;
  usuario: string;
  dataHora: string;
  statusFinal: string;
  camposAlterados: { campo: string; anterior: string; novo: string }[];
  justificativa?: string;
  hash: string;
  versao: string;
  integridade: string;
};

export type ActionFollowUp = {
  ativo: boolean;
  nivel: "normal" | "atenção" | "urgente" | "bloqueada";
  ultimoFollowUpEm: string | null;
  proximoFollowUpEm: string | null;
  tentativas: number;
  ultimaMensagem: string;
  precisaFollowUp: boolean;
  escalado: boolean;
  escaladoPara: string | null;
  escaladoEm: string | null;
};

export type ActionItem = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: AcaoPrioridade;
  status: AcaoStatus;
  setor: string;
  responsavel: string;
  prazo: string; // YYYY-MM-DD ou DD/MM/YYYY
  progresso: number;
  origem: string;
  riscoId?: string;
  riscoVinculado?: string;
  riscoStatus?: string;
  riscoSeveridade?: string;
  inspecaoId?: string;
  checklistId?: string;
  perguntaOrigem?: string;
  respostaOrigem?: string;
  nrRelacionada?: string;
  regraId?: string;
  regraTitulo?: string;
  regraFixa?: boolean;
  explicacaoNormativa?: string;
  multaEstimada?: number;
  chanceIncidente?: string | number;
  criadoEm: string;
  atualizadoEm: string;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  canceladoEm?: string | null;
  comentarios?: string[];
  evidencia: any[];
  historico: ActionHistoricoEvent[];
  followUp?: ActionFollowUp;
};
