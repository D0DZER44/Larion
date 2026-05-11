import type { OperationalContextCatalogId } from '@/src/lib/catalogs/nrCatalog';
import type { OperationalSSTRule } from './nrRules';
import { NR_RULES } from './nrRules';
import { UNIVERSAL_SST_RULES } from './universalSSTRules';

const CONTEXT_RULE_IDS = new Set<string>([
  'nr10-bloqueio-ausente',
  'nr10-trabalhador-nao-autorizado',
  'nr12-protecao-ausente',
  'nr12-parada-inoperante',
  'nr12-manutencao-sem-bloqueio',
  'nr18-area-sem-isolamento',
  'nr18-andaime-irregular',
  'nr18-escavacao-sem-controle',
  'nr23-extintor-inacessivel',
  'nr23-rota-obstruida',
  'nr33-entrada-sem-permissao',
  'nr33-monitoramento-ausente',
  'nr33-resgate-ausente',
  'nr35-protecao-queda-ausente',
  'nr35-planejamento-ausente',
]);

function expandByContext(rule: OperationalSSTRule): OperationalSSTRule[] {
  return rule.contextIds.map((contextId) => ({
    ...rule,
    contextId,
  }));
}

function uniqueByIdAndContext(rules: OperationalSSTRule[]) {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    const key = `${rule.id}:${rule.contextId ?? 'sem-contexto'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const CONTEXT_RULES: OperationalSSTRule[] = uniqueByIdAndContext(
  [...UNIVERSAL_SST_RULES, ...NR_RULES]
    .filter((rule) => rule.contextIds.length > 0)
    .filter((rule) => rule.scope === 'universal' || CONTEXT_RULE_IDS.has(rule.id))
    .flatMap(expandByContext)
);

export function getRulesByContext(contextId: OperationalContextCatalogId): OperationalSSTRule[] {
  return CONTEXT_RULES.filter((rule) => rule.contextId === contextId);
}
