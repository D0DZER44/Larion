import { CRITICAL_ACTIVITY_RULES } from '@/src/lib/rules/criticalActivityRules';
import { CONTEXT_RULES } from '@/src/lib/rules/contextRules';
import { NR_RULES } from '@/src/lib/rules/nrRules';
import { UNIVERSAL_SST_RULES } from '@/src/lib/rules/universalSSTRules';
import { ok, type EngineResult } from '@/src/types/engineResult';
import type { SSTRule } from '@/src/types/sstRule';
import type { ChecklistFinding } from './checklistEngine';
import type { ApplicabilityProfile } from './applicabilityEngine';

export interface RuleMatch {
  rule: SSTRule;
  matchedBy: 'explicit' | 'keyword' | 'context' | 'activity' | 'nr' | 'universal';
  reasons: string[];
}

export interface SSTRuleEvaluation {
  matchedRules: RuleMatch[];
  blocking: boolean;
  requiredEvidence: boolean;
  suggestedActions: string[];
  requiredDocuments: string[];
}

export interface SSTRuleEngineInput {
  applicability: ApplicabilityProfile;
  checklistFindings?: ChecklistFinding[];
  text?: string;
}

function normalizeText(value?: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function addMatch(
  collection: Map<string, RuleMatch>,
  rule: SSTRule,
  matchedBy: RuleMatch['matchedBy'],
  reason: string
) {
  const existing = collection.get(rule.id);
  if (existing) {
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    if (existing.matchedBy === 'keyword' && matchedBy !== 'keyword') existing.matchedBy = matchedBy;
    return;
  }

  collection.set(rule.id, {
    rule,
    matchedBy,
    reasons: [reason],
  });
}

export function evaluateSSTRules(
  input: SSTRuleEngineInput
): EngineResult<SSTRuleEvaluation> {
  const matches = new Map<string, RuleMatch>();
  const text = normalizeText(input.text);
  const allRules = [...UNIVERSAL_SST_RULES, ...NR_RULES, ...CONTEXT_RULES, ...CRITICAL_ACTIVITY_RULES].filter(
    (rule) => rule.active
  );

  UNIVERSAL_SST_RULES.filter((rule) => rule.active).forEach((rule) => {
    addMatch(matches, rule, 'universal', 'Regra universal sempre considerada pelo motor.');
  });

  input.applicability.nrEntries.forEach((entry) => {
    NR_RULES.filter((rule) => rule.nr === entry.id).forEach((rule) => {
      addMatch(matches, rule, 'nr', `NR aplicavel detectada: ${entry.id}.`);
    });
  });

  input.applicability.contexts.forEach((context) => {
    CONTEXT_RULES.filter((rule) => rule.contextId === context.id).forEach((rule) => {
      addMatch(matches, rule, 'context', `Contexto aplicavel detectado: ${context.name}.`);
    });
  });

  input.applicability.activities.forEach((activity) => {
    CRITICAL_ACTIVITY_RULES.filter((rule) => rule.activityId === activity.id).forEach((rule) => {
      addMatch(matches, rule, 'activity', `Atividade critica aplicavel detectada: ${activity.name}.`);
    });
  });

  (input.checklistFindings ?? []).forEach((finding) => {
    if (finding.ruleId) {
      const rule = allRules.find((candidate) => candidate.id === finding.ruleId);
      if (rule) addMatch(matches, rule, 'explicit', `Resposta critica vinculada a regra ${finding.ruleId}.`);
    }

    if (finding.nr) {
      NR_RULES.filter((rule) => rule.nr === finding.nr).forEach((rule) => {
        addMatch(matches, rule, 'nr', `Resposta critica vinculada a ${finding.nr}.`);
      });
    }
  });

  if (text) {
    allRules.forEach((rule) => {
      if ((rule.keywords ?? []).some((keyword) => text.includes(normalizeText(keyword)))) {
        addMatch(matches, rule, 'keyword', `Texto livre da operacao ativou palavras-chave da regra ${rule.id}.`);
      }
    });
  }

  const matchedRules = Array.from(matches.values());
  const warnings: string[] = [];
  if (matchedRules.length === 0) warnings.push('Nenhuma regra SST foi ativada com os dados recebidos.');

  return ok(
    {
      matchedRules,
      blocking: matchedRules.some((match) => Boolean(match.rule.blocking)),
      requiredEvidence: matchedRules.some((match) => match.rule.requiresEvidence),
      suggestedActions: Array.from(new Set(matchedRules.map((match) => match.rule.suggestedAction))),
      requiredDocuments: Array.from(
        new Set(matchedRules.flatMap((match) => match.rule.requiredDocuments ?? []))
      ),
    },
    warnings
  );
}

export const sstRuleEngine = {
  evaluate: evaluateSSTRules,
};
