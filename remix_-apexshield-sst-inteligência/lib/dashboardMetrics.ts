import { format, eachDayOfInterval, subDays, isWithinInterval, parseISO } from 'date-fns';

export function calculateDashboardMetrics(storeState: any, periodStart: Date, periodEnd: Date) {
  const { accidents, incidents, epi_records, work_hours } = storeState;

  const validHours = (work_hours || []).filter((h: any) => h.total_hours > 0);
  const totalHours = validHours.reduce((acc: number, curr: any) => acc + curr.total_hours, 0);

  // Period ranges
  const previousPeriodStart = subDays(periodStart, 30);
  const previousPeriodEnd = subDays(periodEnd, 30);

  // Filter Data
  const acidentesPeriod = (accidents || []).filter((a: any) => a.with_leave && isWithinInterval(parseISO(a.date), { start: periodStart, end: periodEnd }));
  const acidentesPrev = (accidents || []).filter((a: any) => a.with_leave && isWithinInterval(parseISO(a.date), { start: previousPeriodStart, end: previousPeriodEnd }));

  const diasPerdidosPeriod = (accidents || []).filter((a: any) => isWithinInterval(parseISO(a.date), { start: periodStart, end: periodEnd })).reduce((acc: number, curr: any) => acc + (curr.lost_days || 0), 0);
  const diasPerdidosPrev = (accidents || []).filter((a: any) => isWithinInterval(parseISO(a.date), { start: previousPeriodStart, end: previousPeriodEnd })).reduce((acc: number, curr: any) => acc + (curr.lost_days || 0), 0);

  const nearMissesPeriod = (incidents || []).filter((i: any) => i.type === 'near_miss' && isWithinInterval(parseISO(i.date), { start: periodStart, end: periodEnd })).length;
  const nearMissesPrev = (incidents || []).filter((i: any) => i.type === 'near_miss' && isWithinInterval(parseISO(i.date), { start: previousPeriodStart, end: previousPeriodEnd })).length;

  const epiRecordsPeriod = (epi_records || []).filter((e: any) => isWithinInterval(parseISO(e.date), { start: periodStart, end: periodEnd }));
  const epiRecordsPrev = (epi_records || []).filter((e: any) => isWithinInterval(parseISO(e.date), { start: previousPeriodStart, end: previousPeriodEnd }));

  const epiConformesPeriod = epiRecordsPeriod.filter((e: any) => e.status === 'conforme').length;
  const epiTotalPeriod = epiRecordsPeriod.length;
  const epiPercentPeriod = epiTotalPeriod > 0 ? (epiConformesPeriod / epiTotalPeriod) * 100 : 0;

  const epiConformesPrev = epiRecordsPrev.filter((e: any) => e.status === 'conforme').length;
  const epiTotalPrev = epiRecordsPrev.length;
  const epiPercentPrev = epiTotalPrev > 0 ? (epiConformesPrev / epiTotalPrev) * 100 : 0;

  // Single Values
  const tfaValue = totalHours > 0 ? (acidentesPeriod.length * 1000000) / totalHours : null;
  const tfaPrev = totalHours > 0 ? (acidentesPrev.length * 1000000) / totalHours : null; 
  
  const tgValue = totalHours > 0 ? (diasPerdidosPeriod * 1000000) / totalHours : null;
  const tgPrev = totalHours > 0 ? (diasPerdidosPrev * 1000000) / totalHours : null;

  // Daily Series
  const daysInPeriod = eachDayOfInterval({ start: periodStart, end: periodEnd });
  
  const seriesTFA = [];
  const seriesTG = [];
  const seriesNearMiss = [];
  const seriesEPI = [];

  let cumAcidentes = 0;
  let cumDiasPerdidos = 0;
  let cumNearMiss = 0;
  let cumEpiConformes = 0;
  let cumEpiTotal = 0;
  let cumHours = 0;

  for (const day of daysInPeriod) {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    const todayAcidentes = acidentesPeriod.filter((a: any) => format(parseISO(a.date), 'yyyy-MM-dd') === dayStr);
    const todayDiasPerdidos = (accidents || []).filter((a: any) => format(parseISO(a.date), 'yyyy-MM-dd') === dayStr).reduce((sum: number, curr: any) => sum + (curr.lost_days || 0), 0);
    const todayNearMiss = (incidents || []).filter((i: any) => i.type === 'near_miss' && format(parseISO(i.date), 'yyyy-MM-dd') === dayStr).length;
    
    cumAcidentes += todayAcidentes.length;
    cumDiasPerdidos += todayDiasPerdidos;
    cumNearMiss += todayNearMiss;

    const todayEpis = epiRecordsPeriod.filter((e: any) => format(parseISO(e.date), 'yyyy-MM-dd') === dayStr);
    cumEpiTotal += todayEpis.length;
    cumEpiConformes += todayEpis.filter((e: any) => e.status === 'conforme').length;

    let dailyHours = 0;
    validHours.forEach((wh: any) => {
       const start = parseISO(wh.period_start);
       const end = parseISO(wh.period_end);
       if (isWithinInterval(day, { start, end })) {
          const days = eachDayOfInterval({ start, end }).length;
          dailyHours += wh.total_hours / days;
       }
    });
    cumHours += dailyHours;

    if (cumHours > 0) {
      seriesTFA.push({ date: dayStr, value: Number(((cumAcidentes * 1000000) / cumHours).toFixed(2)) });
      seriesTG.push({ date: dayStr, value: Number(((cumDiasPerdidos * 1000000) / cumHours).toFixed(2)) });
    } else {
      seriesTFA.push({ date: dayStr, value: 0 });
      seriesTG.push({ date: dayStr, value: 0 });
    }
    
    seriesNearMiss.push({ date: dayStr, value: cumNearMiss });
    seriesEPI.push({ date: dayStr, value: cumEpiTotal > 0 ? Number(((cumEpiConformes / cumEpiTotal) * 100).toFixed(1)) : 0 });
  }

  const calcTrend = (current: number | null, prev: number | null) => {
    if (current === null || prev === null || isNaN(current) || isNaN(prev)) return null;
    if (prev === 0) return { val: 'sem comparação anterior', dir: 'stable', color: 'text-gray-400' };
    const pct = ((current - prev) / prev) * 100;
    const dir = pct < 0 ? 'down' : (pct > 0 ? 'up' : 'stable');
    return { val: `${Math.abs(pct).toFixed(1).replace('.', ',')}%`, dir, color: pct < 0 ? 'text-emerald-500' : 'text-red-500', raw: pct };
  };

  const tfaTrend = calcTrend(tfaValue, tfaPrev);
  const tgTrend = calcTrend(tgValue, tgPrev);
  const nearMissTrend = calcTrend(nearMissesPeriod, nearMissesPrev);
  const epiTrend = calcTrend(epiPercentPeriod, epiPercentPrev);

  if (epiTrend && epiTrend.dir !== 'stable') {
     epiTrend.color = (epiTrend.raw || 0) > 0 ? 'text-emerald-500' : 'text-red-500';
  }

  return {
    tfa: {
      value: tfaValue !== null ? tfaValue.toFixed(2).replace('.', ',') : 'Dados insuficientes',
      trend: tfaTrend ? tfaTrend.val : '',
      trendDir: tfaTrend ? tfaTrend.dir : '',
      trendColor: tfaTrend ? tfaTrend.color : '',
      series: seriesTFA.length > 0 ? seriesTFA : null
    },
    tg: {
      value: tgValue !== null ? tgValue.toFixed(2).replace('.', ',') : 'Dados insuficientes',
      trend: tgTrend ? tgTrend.val : '',
      trendDir: tgTrend ? tgTrend.dir : '',
      trendColor: tgTrend ? tgTrend.color : '',
      series: seriesTG.length > 0 ? seriesTG : null
    },
    nearMiss: {
      value: nearMissesPeriod.toString(),
      trend: nearMissTrend ? nearMissTrend.val : '',
      trendDir: nearMissTrend ? nearMissTrend.dir : '',
      trendColor: nearMissTrend ? nearMissTrend.color : '',
      series: seriesNearMiss.length > 0 ? seriesNearMiss : null
    },
    epi: {
      value: epiTotalPeriod > 0 ? `${epiPercentPeriod.toFixed(1).replace('.', ',')}%` : 'Sem dados',
      trend: epiTrend ? epiTrend.val : '',
      trendDir: epiTrend ? epiTrend.dir : '',
      trendColor: epiTrend ? epiTrend.color : '',
      series: seriesEPI.length > 0 ? seriesEPI : null
    }
  };
}
