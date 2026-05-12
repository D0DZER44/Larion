import type { EngineResult } from '../../types/engineResult';
import { ok } from '../../types/engineResult';
import type { OperationalItem } from '../../types/operationalItem';
import type {
  LegacyActionLike,
  LegacyInspectionConversionData,
  LegacyInspectionLike,
  LegacyOperationalItemConversionData,
  LegacyRiskLike,
} from './legacyToOperationalItem';
import {
  legacyActionToOperationalItem,
  legacyInspectionToFieldInput,
  legacyRiskToOperationalItem,
} from './legacyToOperationalItem';

export interface LegacyCompatibilityReportInput {
  risks?: LegacyRiskLike[];
  actions?: LegacyActionLike[];
  inspections?: LegacyInspectionLike[];
}

export interface LegacyCompatibilityReportData {
  convertedItems: OperationalItem[];
  inspectionInputs: LegacyInspectionConversionData[];
  counts: {
    risks: number;
    actions: number;
    inspections: number;
    convertedOperationalItems: number;
    convertedFieldInputs: number;
    duplicates: number;
  };
  duplicateSourceKeys: string[];
  warningsByMessage: Record<string, number>;
  errorMessages: string[];
}

function aggregateWarnings(messages: string[]): Record<string, number> {
  return messages.reduce<Record<string, number>>((accumulator, message) => {
    accumulator[message] = (accumulator[message] || 0) + 1;
    return accumulator;
  }, {});
}

function extractConvertedItem(result: EngineResult<LegacyOperationalItemConversionData>): OperationalItem {
  return result.data.item;
}

export function buildLegacyCompatibilityReport(
  input: LegacyCompatibilityReportInput
): EngineResult<LegacyCompatibilityReportData> {
  const riskResults = (input.risks || []).map(legacyRiskToOperationalItem);
  const actionResults = (input.actions || []).map(legacyActionToOperationalItem);
  const inspectionResults = (input.inspections || []).map(legacyInspectionToFieldInput);

  const convertedItems = [
    ...riskResults.map(extractConvertedItem),
    ...actionResults.map(extractConvertedItem),
  ];

  const duplicateIndex = new Map<string, number>();
  for (const item of convertedItems) {
    const sourceLink = item.sourceLinks[0];
    const key = `${sourceLink?.type || 'unknown'}:${sourceLink?.id || item.id}`;
    duplicateIndex.set(key, (duplicateIndex.get(key) || 0) + 1);
  }

  for (const inspection of inspectionResults) {
    const sourceId = String(inspection.data.fieldInput.metadata?.sourceId || inspection.data.fieldInput.id);
    const key = `inspection:${sourceId}`;
    duplicateIndex.set(key, (duplicateIndex.get(key) || 0) + 1);
  }

  const duplicateSourceKeys = Array.from(duplicateIndex.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  const warnings = [
    ...riskResults.flatMap((result) => result.warnings),
    ...actionResults.flatMap((result) => result.warnings),
    ...inspectionResults.flatMap((result) => result.warnings),
  ];

  const errors = [
    ...riskResults.flatMap((result) => result.errors),
    ...actionResults.flatMap((result) => result.errors),
    ...inspectionResults.flatMap((result) => result.errors),
  ];

  return ok({
    convertedItems,
    inspectionInputs: inspectionResults.map((result) => result.data),
    counts: {
      risks: input.risks?.length || 0,
      actions: input.actions?.length || 0,
      inspections: input.inspections?.length || 0,
      convertedOperationalItems: convertedItems.length,
      convertedFieldInputs: inspectionResults.length,
      duplicates: duplicateSourceKeys.length,
    },
    duplicateSourceKeys,
    warningsByMessage: aggregateWarnings(warnings),
    errorMessages: errors,
  });
}
