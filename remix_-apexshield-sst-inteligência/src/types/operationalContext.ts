export type OperationalContextId = string;

export type OperationalContextKind =
  | 'fabrica'
  | 'oficina'
  | 'almoxarifado'
  | 'patio'
  | 'cabine'
  | 'subestacao'
  | 'galpao'
  | 'escritorio'
  | 'campo aberto'
  | 'altura'
  | 'subterraneo'
  | 'espaco confinado'
  | 'outro';

export interface OperationalContext {
  id: OperationalContextId;
  name: string;
  kind: OperationalContextKind;
  sectorId?: string;
  keywords?: string[];
  hazardClasses?: string[];
  applicableNrs?: string[];
  requiredDocuments?: string[];
  active?: boolean;
}

export type OperationalContextRef = Pick<OperationalContext, 'id' | 'name' | 'kind'>;
