import { DEFAULT_SLA_DAYS, FINE_BANDS, SEVERITY_WEIGHTS } from "../core/constants.js";
import { addDaysToIso, diffInDays, isOverdue, toIsoDate } from "../core/dateUtils.js";

function resolveSeverityScore(input = {}) {
  if (typeof input === "number") return input;
  const base = Number(input.score || 0);
  const evidencePenalty = input.hasEvidence === false ? 10 : 0;
  const recurrencePenalty = Number(input.recurrence || 0) * 8;
  const regulatoryPenalty = input.regulatoryCritical === true ? 20 : 0;
  return base + evidencePenalty + recurrencePenalty + regulatoryPenalty;
}

export function calculateSeverity(input = {}) {
  if (typeof input === "string" && SEVERITY_WEIGHTS[input]) return input;
  if (input && SEVERITY_WEIGHTS[input.severidade]) return input.severidade;
  const score = resolveSeverityScore(input);
  if (score >= 80) return "Crítica";
  if (score >= 55) return "Alta";
  if (score >= 30) return "Média";
  return "Baixa";
}

export function calculatePriority(input = {}) {
  const severity = calculateSeverity(input);
  const recurrence = Number(input.recurrence || input.recorrencia || 0);
  if (severity === "Alta" && recurrence >= 3) return "Crítica";
  if (severity === "Média" && recurrence >= 4) return "Alta";
  return severity;
}

export function calculateDueDate(input = {}, referenceDate = Date.now(), slaRules = DEFAULT_SLA_DAYS) {
  const priority = calculatePriority(input);
  const days = slaRules[priority] ?? DEFAULT_SLA_DAYS[priority] ?? 15;
  return addDaysToIso(referenceDate, days);
}

export function calculateSLAStatus(action = {}, referenceDate = Date.now()) {
  const dueDate = action.prazo || calculateDueDate(action, referenceDate);
  const completed = action.status === "Concluída";
  const overdue = !completed && isOverdue(dueDate, referenceDate);
  return {
    dueDate,
    overdue,
    status: completed ? "concluida" : overdue ? "vencida" : "no-prazo",
    daysUntilDue: diffInDays(referenceDate, dueDate),
  };
}

export function calculateOperationalCriticality(input = {}) {
  const severityWeight = SEVERITY_WEIGHTS[calculateSeverity(input)] || 1;
  const recurrence = Number(input.recurrence || input.recorrencia || 0);
  const overdue = input.overdue || input.status === "Vencida" ? 1 : 0;
  return Math.min(100, severityWeight * 20 + recurrence * 10 + overdue * 20);
}

export function getFineBand(severity) {
  return FINE_BANDS[severity] || FINE_BANDS["Baixa"];
}

export function getTodayIso(referenceDate = Date.now()) {
  return toIsoDate(referenceDate);
}
