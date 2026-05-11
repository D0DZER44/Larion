import { CRITICAL_ACTIVITIES } from '@/src/lib/catalogs/criticalActivities';
import { NR_CATALOG, type NRCatalogEntry } from '@/src/lib/catalogs/nrCatalog';
import { OPERATIONAL_CONTEXTS } from '@/src/lib/catalogs/operationalContexts';
import { ok, type EngineResult } from '@/src/types/engineResult';
import type { FieldInput } from '@/src/types/fieldInput';
import type { Inspection } from '@/src/types/inspection';
import type { CriticalActivity } from '@/src/types/criticalActivity';
import type { OperationalContext } from '@/src/types/operationalContext';

export interface ApplicabilityEngineInput {
  fieldInput?: FieldInput;
  inspection?: Inspection;
  text?: string;
  activePackages?: string[];
}

export interface ApplicabilityProfile {
  contexts: OperationalContext[];
  activities: CriticalActivity[];
  nrEntries: NRCatalogEntry[];
  matchedKeywords: string[];
  requiredDocuments: string[];
}

function normalizeText(value?: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveApplicability(
  input: ApplicabilityEngineInput
): EngineResult<ApplicabilityProfile> {
  const activePackages = input.activePackages ?? Array.from(new Set(NR_CATALOG.map((entry) => entry.package)));
  const baseText = normalizeText(
    input.text ??
      input.fieldInput?.description ??
      input.fieldInput?.title ??
      input.fieldInput?.text ??
      input.inspection?.notes
  );

  const contextIds = new Set<string>();
  const activityIds = new Set<string>();
  const nrIds = new Set<string>(input.inspection?.nrIds ?? []);
  const matchedKeywords = new Set<string>();

  if (input.fieldInput?.operationalContextId) contextIds.add(input.fieldInput.operationalContextId);
  if (input.fieldInput?.contextId) contextIds.add(input.fieldInput.contextId);
  if (input.fieldInput?.criticalActivityId) activityIds.add(input.fieldInput.criticalActivityId);
  if (input.fieldInput?.activityId) activityIds.add(input.fieldInput.activityId);
  if (input.inspection?.operationalContextId) contextIds.add(input.inspection.operationalContextId);
  if (input.inspection?.contextId) contextIds.add(input.inspection.contextId);
  if (input.inspection?.criticalActivityId) activityIds.add(input.inspection.criticalActivityId);

  OPERATIONAL_CONTEXTS.forEach((context) => {
    if ((context.keywords ?? []).some((keyword) => baseText.includes(normalizeText(keyword)))) {
      contextIds.add(context.id);
      (context.keywords ?? [])
        .filter((keyword) => baseText.includes(normalizeText(keyword)))
        .forEach((keyword) => matchedKeywords.add(keyword));
    }
  });

  CRITICAL_ACTIVITIES.forEach((activity) => {
    if (activity.keywords.some((keyword) => baseText.includes(normalizeText(keyword)))) {
      activityIds.add(activity.id);
      activity.keywords
        .filter((keyword) => baseText.includes(normalizeText(keyword)))
        .forEach((keyword) => matchedKeywords.add(keyword));
    }
  });

  const contexts = OPERATIONAL_CONTEXTS.filter((context) => contextIds.has(context.id));
  const activities = CRITICAL_ACTIVITIES.filter((activity) => activityIds.has(activity.id));

  contexts.forEach((context) => (context.applicableNrs ?? []).forEach((nrId) => nrIds.add(nrId)));
  activities.forEach((activity) => activity.relatedNrs.forEach((nrId) => nrIds.add(nrId)));

  const nrEntries = NR_CATALOG.filter((entry) => {
    if (!nrIds.has(entry.id)) return false;
    return entry.package === 'Base SST' || activePackages.includes(entry.package);
  });

  const requiredDocuments = Array.from(
    new Set([
      ...contexts.flatMap((context) => context.requiredDocuments ?? []),
      ...activities.flatMap((activity) => activity.requiredDocuments ?? []),
    ])
  );

  const warnings: string[] = [];
  if (contexts.length === 0) warnings.push('Nenhum contexto operacional aplicavel foi encontrado.');
  if (activities.length === 0) warnings.push('Nenhuma atividade critica aplicavel foi encontrada.');
  if (nrEntries.length === 0) warnings.push('Nenhuma NR aplicavel foi encontrada com os pacotes ativos informados.');

  return ok(
    {
      contexts,
      activities,
      nrEntries,
      matchedKeywords: Array.from(matchedKeywords),
      requiredDocuments,
    },
    warnings
  );
}

export const applicabilityEngine = {
  resolve: resolveApplicability,
};
