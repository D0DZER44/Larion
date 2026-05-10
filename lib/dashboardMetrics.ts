// @ts-nocheck

import { differenceInCalendarDays, eachDayOfInterval, format, subDays } from "date-fns";
import { mapStoreStateToMotorDataset } from "./motor/bridge";
import { calculateDashboardMetrics as calculateMotorDashboardMetrics } from "./motor/engine/metricsEngine.js";

function normalizeDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function getTimestamp(item) {
  return new Date(item.created_at || item.criadoEm || item.data || item.proximaInspecao || item.updated_at || Date.now()).getTime();
}

function filterByPeriod(items = [], start, end) {
  const startTs = start.getTime();
  const endTs = end.getTime();
  return items.filter((item) => {
    const ts = getTimestamp(item);
    return ts >= startTs && ts <= endTs;
  });
}

function buildSeries(items = [], start, end, resolver) {
  return eachDayOfInterval({ start, end }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    value: resolver(day, items),
  }));
}

function calcTrend(currentValue, previousValue, lowerIsBetter = false) {
  if (!previousValue) {
    return { value: "0%", dir: "stable", color: "text-gray-400" };
  }
  const raw = ((currentValue - previousValue) / previousValue) * 100;
  const dir = raw === 0 ? "stable" : raw > 0 ? "up" : "down";
  const positive = lowerIsBetter ? raw < 0 : raw > 0;
  return {
    value: `${Math.abs(raw).toFixed(1).replace(".", ",")}%`,
    dir,
    color: positive ? "text-emerald-500" : raw === 0 ? "text-gray-400" : "text-red-500",
  };
}

function buildPeriodMetrics(storeState, periodStart, periodEnd) {
  const filteredState = {
    ...storeState,
    riscos: filterByPeriod(storeState.riscos || [], periodStart, periodEnd),
    acoes: filterByPeriod(storeState.acoes || [], periodStart, periodEnd),
    inspecoes: filterByPeriod(storeState.inspecoes || [], periodStart, periodEnd),
  };

  const dataset = mapStoreStateToMotorDataset(filteredState);
  const metrics = calculateMotorDashboardMetrics(dataset, { referenceDate: periodEnd.getTime() });
  const epiRecords = filterByPeriod(storeState.epi_records || [], periodStart, periodEnd);
  const epiConformes = epiRecords.filter((item) => item.status === "conforme").length;
  const epiPercent = epiRecords.length > 0 ? (epiConformes / epiRecords.length) * 100 : metrics.nrCompliance.reduce((sum, item) => sum + item.compliance, 0) / (metrics.nrCompliance.length || 1);

  return {
    metrics,
    epiPercent,
    inspectionsCompleted: metrics.completedInspections,
    openRisks: metrics.openRisks,
    recurring: metrics.recurrenceIndicators?.recurring || 0,
  };
}

export function calculateDashboardMetrics(storeState, periodStart, periodEnd) {
  const start = normalizeDate(periodStart);
  const end = normalizeDate(periodEnd);
  const current = buildPeriodMetrics(storeState, start, end);
  const intervalDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const previousEnd = subDays(start, 1);
  const previousStart = subDays(previousEnd, intervalDays - 1);
  const previous = buildPeriodMetrics(storeState, previousStart, previousEnd);

  const riskSeries = buildSeries(storeState.riscos || [], start, end, (day, items) =>
    items.filter((item) => format(new Date(getTimestamp(item)), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length,
  );
  const inspectionSeries = buildSeries(storeState.inspecoes || [], start, end, (day, items) =>
    items.filter((item) => format(new Date(getTimestamp(item)), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length,
  );
  const recurrenceSeries = buildSeries(storeState.riscos || [], start, end, (day, items) =>
    items.filter((item) => format(new Date(getTimestamp(item)), "yyyy-MM-dd") === format(day, "yyyy-MM-dd") && String(item.recorrenciaHistorica || item.recorrencia || 0) !== "0").length,
  );
  const epiSeries = buildSeries(storeState.epi_records || [], start, end, (day, items) => {
    const dayItems = items.filter((item) => format(new Date(getTimestamp(item)), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
    if (dayItems.length === 0) return 0;
    return Number(((dayItems.filter((item) => item.status === "conforme").length / dayItems.length) * 100).toFixed(1));
  });

  const tfaTrend = calcTrend(current.inspectionsCompleted, previous.inspectionsCompleted, false);
  const tgTrend = calcTrend(current.openRisks, previous.openRisks, true);
  const nearMissTrend = calcTrend(current.recurring, previous.recurring, true);
  const epiTrend = calcTrend(current.epiPercent, previous.epiPercent, false);

  return {
    tfa: {
      value: String(current.inspectionsCompleted),
      trend: tfaTrend.value,
      trendDir: tfaTrend.dir,
      trendColor: tfaTrend.color,
      series: inspectionSeries,
    },
    tg: {
      value: String(current.openRisks),
      trend: tgTrend.value,
      trendDir: tgTrend.dir,
      trendColor: tgTrend.color,
      series: riskSeries,
    },
    nearMiss: {
      value: String(current.recurring),
      trend: nearMissTrend.value,
      trendDir: nearMissTrend.dir,
      trendColor: nearMissTrend.color,
      series: recurrenceSeries,
    },
    epi: {
      value: `${current.epiPercent.toFixed(1).replace(".", ",")}%`,
      trend: epiTrend.value,
      trendDir: epiTrend.dir,
      trendColor: epiTrend.color,
      series: epiSeries,
    },
  };
}
