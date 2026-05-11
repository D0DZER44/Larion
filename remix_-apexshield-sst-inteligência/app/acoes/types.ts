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

export type ActionEvidencia = {
  id: string;
  url: string;
  tipo: 'Foto' | 'Documento' | 'Assinatura';
  descricao: string;
  dataUpload: string;
  enviadoPor: string;
  acaoId: string;
  riscoId?: string;
  inspecaoId?: string;
  contexto?: string; // ex: 'Antes', 'Depois'
};

export type ActionValidacao = {
  validador: string;
  data: string;
  decisao: 'Aprovado' | 'Recusado' | 'Requer Nova Evidencia';
  baseadoEm: string;
  comentarios?: string;
};

export type ActionItem = {
  id: string;
  titulo: string;
  descricao: string;
  oQue?: string;
  porQue?: string;
  onde?: string;
  quem?: string;
  quando?: string;
  como?: string;
  quantoCusta?: number;
  prioridade: AcaoPrioridade;
  status: AcaoStatus;
  faseExecucao?: 'Em Execução' | 'Aguardando Evidência' | 'Aguardando Validação' | 'Rejeitada' | 'Validada';
  setor: string;
  responsavel: string;
  prazo: string; // YYYY-MM-DD ou DD/MM/YYYY
  progresso: number;
  origem: string; // ex: "Inspeção", "Manual", "Checklist"

  // RASTREABILIDADE TOTAL (Origem)
  riscoId?: string;
  riscoVinculado?: string;
  riscoStatus?: string;
  riscoSeveridade?: string;
  inspecaoId?: string;
  checklistId?: string;
  checklist_item_id?: string;
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
  
  // EVIDENCIA E VALIDAÇÃO (Destino final do rastreio)
  exigeEvidencia?: boolean;
  evidencia: ActionEvidencia[];
  validacao?: ActionValidacao;

  historico: ActionHistoricoEvent[];
  followUp?: ActionFollowUp;

  // PESSOA NO CENTRO
  trabalhadoresExpostos?: number;
  perfilExposto?: string;
  impactoHumano?: string;
  executor?: string;      // Quem vai executar a ação fisicamente
  validador?: string;     // Quem assina embaixo da segurança da execução
};
