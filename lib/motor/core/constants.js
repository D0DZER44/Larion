/**
 * Shared constants for the JavaScript operational engine.
 */

export const SEVERITY_LEVELS = ["Baixa", "Média", "Alta", "Crítica"];
export const PRIORITY_LEVELS = ["Baixa", "Média", "Alta", "Crítica"];
export const INSPECTION_STATUSES = ["Agendada", "Em andamento", "Concluída", "Atrasada"];
export const NON_CONFORMITY_STATUSES = ["Aberta", "Em análise", "Tratada", "Encerrada"];
export const RISK_STATUSES = ["Aberto", "Em análise", "Mitigado", "Resolvido"];
export const ACTION_STATUSES = ["Pendente", "Em andamento", "Concluída", "Vencida", "Reaberta"];
export const PGR_STATUSES = ["Identificado", "Em controle", "Sob ação", "Mitigado", "Encerrado"];

export const DEFAULT_SLA_DAYS = {
  "Baixa": 15,
  "Média": 7,
  "Alta": 3,
  "Crítica": 1,
};

export const SEVERITY_WEIGHTS = {
  "Baixa": 1,
  "Média": 2,
  "Alta": 3,
  "Crítica": 4,
};

export const FINE_BANDS = {
  "Baixa": { min: 1000, max: 5000, estimated: 2500 },
  "Média": { min: 5000, max: 15000, estimated: 8000 },
  "Alta": { min: 15000, max: 40000, estimated: 25000 },
  "Crítica": { min: 40000, max: 120000, estimated: 75000 },
};

export const ROOT_CAUSE_CATEGORIES = [
  "Falha de treinamento",
  "Falha de procedimento",
  "Falha de supervisão",
  "Falha de equipamento",
  "Falha de manutenção",
  "Falta de EPI",
  "Falta de sinalização",
  "Pressa operacional",
  "Condição ambiental",
  "Falha de planejamento",
];

export const DEFAULT_SETTINGS = {
  activePackages: ["Base SST"],
  activeSegments: [],
  activeNRs: [],
  slaRules: { ...DEFAULT_SLA_DAYS },
  evidenceRequiredFor: ["Alta", "Crítica"],
};

export const FLOW_STAGES = [
  "Inspeção",
  "Checklist",
  "Resposta não conforme",
  "Não conformidade",
  "Risco",
  "Ação corretiva",
  "Evidência",
  "Dashboard",
  "Central de Inteligência",
  "Relatório",
  "PGR Vivo",
  "Auditoria",
];
