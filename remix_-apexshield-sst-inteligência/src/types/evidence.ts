export type EvidenceId = string;

export type EvidenceType =
  | 'foto'
  | 'arquivo'
  | 'observacao'
  | 'assinatura'
  | 'registro'
  | 'checklist';

export type LegacyEvidenceKind =
  | 'photo'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'text'
  | 'url'
  | 'document';

export type EvidenceKind = EvidenceType | LegacyEvidenceKind;

export type EvidenceValidationStatus = 'pendente' | 'aprovada' | 'rejeitada';

export type EvidenceHistoryAction =
  | 'criada'
  | 'validacao_pendente'
  | 'aprovada'
  | 'rejeitada'
  | 'remocao_bloqueada'
  | 'vinculada_ao_item';

export interface EvidenceHistoryEntry {
  action: EvidenceHistoryAction;
  createdAt: string;
  createdBy?: string;
  note?: string;
  previousValidationStatus?: EvidenceValidationStatus;
  nextValidationStatus?: EvidenceValidationStatus;
}

export interface Evidence {
  id: EvidenceId;
  itemId: string;
  type: EvidenceType;
  description: string;
  url?: string;
  createdBy: string;
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
  validationStatus: EvidenceValidationStatus;
  history: EvidenceHistoryEntry[];
  kind?: EvidenceKind;
  text?: string;
  caption?: string;
  hash?: string;
  geolocation?: { lat: number; lng: number };
  uploadedBy?: string;
  uploadedAt?: string;
  inspectionId?: string;
  questionId?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export type EvidenceDraft = Omit<
  Evidence,
  'id' | 'createdAt' | 'history' | 'validationStatus' | 'validatedBy' | 'validatedAt'
> & {
  id?: string;
  createdAt?: string;
  history?: EvidenceHistoryEntry[];
  validationStatus?: EvidenceValidationStatus;
  validatedBy?: string;
  validatedAt?: string;
};
