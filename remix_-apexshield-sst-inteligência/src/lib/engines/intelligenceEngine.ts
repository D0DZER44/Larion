import { ok, type EngineResult } from '@/src/types/engineResult';
import type { OperationalItem } from '@/src/types/operationalItem';

export interface IntelligenceInsight {
  title: string;
  description: string;
}

export interface IntelligenceSummary {
  totalItems: number;
  openItems: number;
  blockedItems: number;
  evidenceGapItems: number;
  byPriority: Record<string, number>;
  byContext: Array<{ id: string; count: number }>;
  byActivity: Array<{ id: string; count: number }>;
  byNr: Array<{ id: string; count: number }>;
  insights: IntelligenceInsight[];
}

function groupCount(values: string[]): Array<{ id: string; count: number }> {
  const grouped = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => right.count - left.count);
}

export function generateOperationalInsights(
  items: OperationalItem[]
): EngineResult<IntelligenceSummary> {
  const openItems = items.filter((item) => item.status !== 'completed' && item.status !== 'cancelled');
  const blockedItems = openItems.filter((item) => item.blocking);
  const evidenceGapItems = openItems.filter(
    (item) => item.evidencePlan.required && item.evidenceIds.length < item.evidencePlan.minimumCount
  );

  const byPriority = openItems.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.priority] = (accumulator[item.priority] ?? 0) + 1;
    return accumulator;
  }, {});

  const byContext = groupCount(openItems.map((item) => item.contextId).filter(Boolean) as string[]);
  const byActivity = groupCount(openItems.map((item) => item.activityId).filter(Boolean) as string[]);
  const byNr = groupCount(openItems.flatMap((item) => item.nrIds));

  const insights: IntelligenceInsight[] = [];

  if (blockedItems.length > 0) {
    insights.push({
      title: 'Itens bloqueantes ativos',
      description: `${blockedItems.length} item(ns) bloqueiam a operacao e devem ser tratados antes da continuidade.`,
    });
  }

  if (evidenceGapItems.length > 0) {
    insights.push({
      title: 'Gargalo de evidencia',
      description: `${evidenceGapItems.length} item(ns) abertos ainda nao possuem evidencia suficiente para encerramento.`,
    });
  }

  if ((byContext[0]?.count ?? 0) >= 3) {
    insights.push({
      title: 'Concentracao por contexto',
      description: `O contexto ${byContext[0].id} concentra ${byContext[0].count} itens abertos e merece revisao sistemica.`,
    });
  }

  if ((byNr[0]?.count ?? 0) >= 3) {
    insights.push({
      title: 'Pressao normativa recorrente',
      description: `A ${byNr[0].id} aparece em ${byNr[0].count} itens abertos e indica foco regulatorio recorrente.`,
    });
  }

  const warnings =
    items.length === 0
      ? ['Nenhum item operacional foi fornecido para leitura de inteligencia.']
      : [];

  return ok(
    {
      totalItems: items.length,
      openItems: openItems.length,
      blockedItems: blockedItems.length,
      evidenceGapItems: evidenceGapItems.length,
      byPriority,
      byContext,
      byActivity,
      byNr,
      insights,
    },
    warnings
  );
}

export const intelligenceEngine = {
  generate: generateOperationalInsights,
};
