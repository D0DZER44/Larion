"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { getTodasRegrasAtivas } from '@/lib/normativeRules';
import {
  Bell, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  Filter, Calendar, X, Activity, MoreVertical, Search,
  Clock, CheckSquare, Shield, AlertCircle, Download,
  ListChecks, Settings, Target, Zap, ShieldAlert, BadgeInfo,
  TrendingUp, BarChart2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value}`;
}

const SPARK_COLORS = {
  purple: '#a855f7',
  red: '#ef4444',
  emerald: '#10b981',
  orange: '#f97316',
  blue: '#3b82f6',
  yellow: '#eab308'
};

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `gradient-${color.replace('#', '')}`;
  const endY = height - ((data[data.length - 1] - min) / range) * height;

  return (
    <svg width="100%" height="100%" viewBox={`0 -5 ${width} ${height + 15}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={endY} fill="var(--text-primary)" stroke={color} strokeWidth="2" r="3" />
    </svg>
  );
};

const PIE_COLORS = {
  Crítico: '#ef4444',
  Alto: '#f97316',
  Médio: '#eab308',
  Baixo: '#10b981'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-3 rounded-lg shadow-xl shrink-0 whitespace-nowrap z-[100]">
        <p className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-[12px]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[var(--text-secondary)]">{entry.name === 'Total' ? 'Valor' : entry.name}:</span>
            <span className="font-bold text-[var(--text-primary)] whitespace-nowrap">
              {entry.name === 'Total' && entry.value > 1000 ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const getRiskSeverityLevel = (r: any) => {
  const n = r.nivel || r.level || r.severity || '';
  if (n.toUpperCase() === 'CRÍTICO' || n.toUpperCase() === 'CRITICA') return 'Crítico';
  if (n.toUpperCase() === 'ALTO' || n.toUpperCase() === 'ALTA') return 'Alto';
  if (n.toUpperCase() === 'MÉDIO' || n.toUpperCase() === 'MEDIA') return 'Médio';
  return 'Baixo';
};

const getMultaEstimada = (r: any) => {
  if (r.multaEstimada) return Number(r.multaEstimada);
  const n = getRiskSeverityLevel(r);
  return n === 'Crítico' ? 120000 : n === 'Alto' ? 65000 : n === 'Médio' ? 25000 : 5000;
};

const getChanceIncidente = (r: any) => {
  if (r.chanceIncidente) return Number(r.chanceIncidente);
  const n = getRiskSeverityLevel(r);
  return n === 'Crítico' ? 85 : n === 'Alto' ? 60 : n === 'Médio' ? 35 : 15;
};

export default function CentralPage() {
  const storeState = useAppStore();
  const { riscos = [], inspecoes = [], acoes = [], checklists = [], rules: customRules = [] } = storeState;
  
  const rules = useMemo(() => getTodasRegrasAtivas(customRules), [customRules]);

  const [selectedDrawerItem, setSelectedDrawerItem] = useState<any>(null);

  const isActiveRisk = (r: any) => r.status && r.status !== 'Resolvido' && r.status !== 'Mitigado';
  const openRisks = useMemo(() => riscos.filter(isActiveRisk), [riscos]);

  const riscoCriticoAberto = useMemo(() => openRisks.filter(r => getRiskSeverityLevel(r) === 'Crítico'), [openRisks]);
  const actionOpen = useMemo(() => acoes.filter((a:any) => a.status !== 'Concluída' && a.status !== 'Cancelada'), [acoes]);
  
  const multaEmAberto = useMemo(() => openRisks.reduce((acc, r) => acc + getMultaEstimada(r), 0), [openRisks]);
  const avgChance = useMemo(() => openRisks.length > 0 ? openRisks.reduce((acc, r) => acc + getChanceIncidente(r), 0) / openRisks.length : 0, [openRisks]);

  // Metric Computations Let's structure the 12 KPI cards data
  const KPIs = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const inspAgendadas = inspecoes.filter((i:any) => i.status === 'Agendada');
    const inspEmAndamento = inspecoes.filter((i:any) => i.status === 'Em andamento' || i.status === 'Iniciada');
    const inspAtrasadas = inspecoes.filter((i:any) => i.status === 'Atrasada' || (i.dueDate && new Date(i.dueDate) < today && i.status !== 'Concluída'));
    const inspConcluidas = inspecoes.filter((i:any) => i.status === 'Concluída' || i.status === 'Realizada' || i.status === 'Finalizada');

    let totalNCs = 0;
    inspecoes.forEach((i:any) => {
      if (i.answers) {
        totalNCs += i.answers.filter((a:any) => a.isConform === false).length;
      }
      if (i.nonConformities) totalNCs += Number(i.nonConformities);
    });

    const vI = inspecoes.length > 0 ? (inspConcluidas.length / inspecoes.length) * 100 : 0;
    const vA = acoes.length > 0 ? (acoes.filter((a:any) => a.status === 'Concluída').length / acoes.length) * 100 : 0;
    const vR = riscos.length > 0 ? (riscos.filter((r:any) => !isActiveRisk(r)).length / riscos.length) * 100 : 0;
    const scoreConformidade = Math.round((vI * 30 + vA * 25 + vR * 15) / 70) || 100;

    const mockTrend = [5, 7, 6, 8, 10, 9, 12, 10, 15, 14, 18];

    return [
      { id: 'c1', label: 'Inspeções agendadas', val: inspAgendadas.length, sub: 'Hoje ou futuro', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', navTo: '/operacao/inspecoes?filter=agendadas', navLabel: 'Ver em Inspeções →' },
      { id: 'c2', label: 'Inspeções em andamento', val: inspEmAndamento.length, sub: 'Execução ativa', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', navTo: '/operacao/inspecoes', navLabel: 'Continuar inspeções →' },
      { id: 'c3', label: 'Inspeções atrasadas', val: inspAtrasadas.length, sub: 'Pendentes de execução', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', navTo: '/operacao/inspecoes?filter=atrasadas', navLabel: 'Ver atrasadas →' },
      { id: 'c4', label: 'Inspeções realizadas', val: inspConcluidas.length, sub: 'Registros finalizados', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', navTo: '/operacao/inspecoes?filter=concluidas', navLabel: 'Ver realizadas →' },
      
      { id: 'c5', label: 'Riscos críticos', val: riscoCriticoAberto.length, sub: 'Exigem ação imediata', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', navTo: '/operacao/riscos?filter=critico', navLabel: 'Abrir em Riscos →', trend: mockTrend, sparkColor: SPARK_COLORS.red },
      { id: 'c6', label: 'Ações pendentes', val: actionOpen.length, sub: 'Planos abertos', icon: ListChecks, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', navTo: '/operacao/acoes?filter=pendentes', navLabel: 'Abrir em Ações →' },
      { id: 'c7', label: 'Não conformidades', val: totalNCs, sub: 'Detectadas em campo', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', navTo: '/operacao/inspecoes', navLabel: 'Ver origem →' },
      { id: 'c8', label: 'Score de conformidade', val: `${scoreConformidade}%`, sub: 'Geral', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', navTo: '/dashboard', navLabel: 'Ver detalhes →' },
      
      { id: 'c9', label: 'Total de riscos', val: openRisks.length, sub: '+4 no último mês', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', navTo: '/operacao/riscos', navLabel: 'Ver todos →', trend: mockTrend, sparkColor: SPARK_COLORS.purple },
      { id: 'c10', label: 'Multa estimada em aberto', val: formatCurrency(multaEmAberto), sub: 'Potencial de multas', icon: BadgeInfo, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', navTo: '/operacao/riscos', navLabel: 'Ver riscos →', trend: mockTrend, sparkColor: SPARK_COLORS.yellow },
      { id: 'c11', label: 'Chance média de incidente', val: `${Math.round(avgChance)}%`, sub: 'Risco moderado', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', navTo: '/operacao/riscos', navLabel: 'Matriz de riscos →' },
      { id: 'c12', label: 'Regras do motor', val: rules.length || 8, sub: 'Automações ativas', icon: Settings, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-active-group)]', border: 'border-[var(--border)]', navTo: '/configuracoes', navLabel: 'Gerenciar no Motor →' },
    ];
  }, [riscos, inspecoes, acoes, rules, openRisks, riscoCriticoAberto, multaEmAberto, avgChance, actionOpen]);

  // Main 4 Top Cards (from Figma design)
  const topCards = [
    KPIs.find(k => k.id === 'c9'), // Total de riscos
    KPIs.find(k => k.id === 'c5'), // Críticos em aberto
    KPIs.find(k => k.id === 'c10'), // Multa estimada
    KPIs.find(k => k.id === 'c11'), // Chance média
  ];

  // Other 8 KPIs for the grid
  const gridKPIs = KPIs.filter(k => !topCards.map(tc => tc?.id).includes(k.id));

  // Charts Computations
  const riskLevelsCount = {
    Crítico: 0,
    Alto: 0,
    Médio: 0,
    Baixo: 0
  };
  openRisks.forEach(r => {
    const levelKey = getRiskSeverityLevel(r) as keyof typeof riskLevelsCount;
    if (riskLevelsCount[levelKey] !== undefined) {
      riskLevelsCount[levelKey]++;
    }
  });
  const riskPieData = Object.entries(riskLevelsCount).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  const riskBySectorMap: Record<string, number> = {};
  openRisks.forEach(r => {
    const s = r.setor || r.sector_id || 'Indefinido';
    riskBySectorMap[s] = (riskBySectorMap[s] || 0) + 1;
  });
  let riskBarData = Object.entries(riskBySectorMap).map(([name, count]) => ({ name, Total: count })).sort((a,b) => b.Total - a.Total).slice(0, 7);
  if (riskBarData.length === 0) {
    riskBarData = [
      { name: 'Produção', Total: 43 }, { name: 'Manutenção', Total: 26 },
      { name: 'Logística', Total: 24 }, { name: 'Administrativo', Total: 18 },
      { name: 'Facilites', Total: 10 }, { name: 'RH', Total: 7 }
    ];
  }

  const multaByNRMap: Record<string, number> = {};
  openRisks.forEach(r => {
    const nr = r.nr || 'NR-Geral';
    multaByNRMap[nr] = (multaByNRMap[nr] || 0) + getMultaEstimada(r);
  });
  let nrBarData = Object.entries(multaByNRMap).map(([name, total]) => ({ name, Total: total })).sort((a,b) => b.Total - a.Total).slice(0, 6);
  if (nrBarData.length === 0) {
    nrBarData = [
      { name: 'NR-12', Total: 412000 }, { name: 'NR-35', Total: 268000 },
      { name: 'NR-10', Total: 198000 }, { name: 'NR-17', Total: 142000 },
      { name: 'NR-06', Total: 96000 }, { name: 'Outras', Total:132000 }
    ];
  }

  const topRisksByChance = [...openRisks]
    .sort((a,b) => getChanceIncidente(b) - getChanceIncidente(a))
    .slice(0, 5);
  
  const topFallbackRisks = [
    { titulo: 'Trabalho em altura', setor: 'Produção', level: 'Crítico', nr: 'NR-35', chance: 72 },
    { titulo: 'Atividade elétrica', setor: 'Manutenção', level: 'Crítico', nr: 'NR-10', chance: 61 },
    { titulo: 'Espaço confinado', setor: 'Manutenção', level: 'Crítico', nr: 'NR-33', chance: 58 },
    { titulo: 'Máquinas sem proteção', setor: 'Produção', level: 'Alto', nr: 'NR-12', chance: 55 },
    { titulo: 'Queda de materiais', setor: 'Logística', level: 'Alto', nr: 'NR-11', chance: 48 },
  ];

  const renderTopRisksChance = topRisksByChance.length > 0 ? topRisksByChance.map(r => ({
    name: r.titulo || r.atividade || (r.id ? r.id.substring(0, 8) : 'Risco'),
    chance: getChanceIncidente(r)
  })) : topFallbackRisks.map(r => ({ name: r.titulo, chance: r.chance }));

  // Lists and Tables logic
  const listRiscos = topRisksByChance.length > 0 ? openRisks.filter(r => getRiskSeverityLevel(r) === 'Crítico').slice(0,5) : topFallbackRisks.map((fr, idx) => ({ ...fr, id: String(idx) }));
  
  const latestInspections = [...inspecoes].sort((a:any,b:any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden flex flex-col">
      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full p-4 md:p-6 lg:p-8 shrink-0">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-900/40 border border-purple-500/30 rounded-xl flex items-center justify-center shrink-0 shadow-[var(--shadow-glow)]">
              <BarChart2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Central de Inteligência</h1>
              <p className="text-[13px] text-[var(--text-muted)] mt-0.5 font-medium tracking-wide">Painel consolidado de inteligência operacional de SST.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-active-group)] text-[var(--text-secondary)] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[var(--border)]">
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button className="flex items-center gap-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-active-group)] text-[var(--text-secondary)] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[var(--border)]">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-[var(--shadow-glow)] border border-purple-500/50">
              + Registrar Risco
            </button>
          </div>
        </header>

          <div className="flex flex-col gap-6 shrink-0">
            
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0">
              {topCards.map((card, i) => {
                if (!card) return null;
                return (
                  <div key={card.id} className="bg-[#0e1322] border border-[var(--border)] p-5 lg:p-6 rounded-xl flex flex-col relative group overflow-hidden shadow-lg shadow-black/20 hover:border-[var(--border)] transition-all">
                    {/* Background Glow */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30`} style={{ backgroundColor: card.sparkColor }}></div>
                    
                    <div className="flex items-start justify-between relative z-10 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${card.bg} ${card.border}`}>
                          <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <h3 className="text-[13px] font-medium text-[var(--text-secondary)]">{card.label}</h3>
                      </div>
                    </div>
                    
                    <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight relative z-10 mb-2">
                      {card.val}
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[12px] font-medium text-[var(--text-muted)]">{card.sub}</span>
                      {card.id === 'c9' && <div className="w-4 h-4 text-emerald-400 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </div>}
                    </div>

                    {card.trend && (
                      <div className="absolute bottom-4 right-4 left-4 h-12 opacity-40 pointer-events-none z-0">
                         <Sparkline data={card.trend} color={card.sparkColor || '#ffffff'} />
                      </div>
                    )}
                    {card.id === 'c11' && (
                      <div className="absolute bottom-6 left-6 right-6 h-[5px] bg-[var(--bg-active-group)] rounded-full overflow-hidden z-10">
                         <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" style={{ width: card.val }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              {/* Pie Chart */}
              <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Distribuição por nível</h3>
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
                  <div className="w-[180px] h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {riskPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-sans mt-1">
                      <span className="text-3xl font-bold text-[var(--text-primary)] leading-none">{openRisks.length || 128}</span>
                      <span className="text-[12px] text-[var(--text-muted)] font-medium mt-1">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 font-sans">
                    {riskPieData.length > 0 ? riskPieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] opacity-90" style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555', color: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] }}></div>
                        <span className="text-[13px] text-[var(--text-secondary)] w-16">{entry.name}</span>
                        <span className="text-[13px] font-bold text-[var(--text-primary)]">{entry.value} <span className="font-normal text-[var(--text-muted)]">({Math.round((entry.value/openRisks.length)*100)}%)</span></span>
                      </div>
                    )) : (
                      <div className="text-xs text-[var(--text-muted)]">Sem dados suficientes</div>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-[11px] text-[var(--text-muted)] font-sans">Última atualização: hoje 08:30</span>
                </div>
              </div>

              {/* Bar Chart Sectors */}
              <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Riscos por setor</h3>
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskBarData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                      <Bar dataKey="Total" fill="#7c3aed" radius={[2, 2, 0, 0]} barSize={32}>
                        {riskBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#colorBarChart)`} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="colorBarChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#6d28d9" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center border-t border-[var(--border)] pt-4">
                  <span className="text-[12px] text-[var(--text-muted)] font-sans tracking-wide">Total de riscos</span>
                </div>
              </div>

              {/* Bar Chart NR */}
              <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Multa estimada por NR</h3>
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={nrBarData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={55} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                      <Bar dataKey="Total" fill="#eab308" radius={[0, 2, 2, 0]} barSize={16}>
                          {nrBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#ca8a04'} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center border-t border-[var(--border)] pt-4">
                  <span className="text-[12px] text-[var(--text-muted)] font-sans tracking-wide">Valor estimado (R$)</span>
                </div>
              </div>
            </div>

            {/* Middle row: Insights ======================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 mt-2">
               
               {/* Insights List */}
               <div className="bg-[#0e1322] border border-purple-500/20 rounded-xl p-6 flex flex-col shadow-[0_0_30px_rgba(124,58,237,0.03)] font-sans relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Insights operacionais</h3>
                  </div>
                  <div className="flex-1 space-y-5 relative z-10">
                     <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                           <p className="text-[13px] font-medium text-[var(--text-primary)]">{riscoCriticoAberto.length || 8} riscos críticos em aberto exigem ação imediata.</p>
                           <p className="text-[12px] text-[var(--text-muted)] mt-1">Impacto potencial alto em SST e conformidade.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                           <p className="text-[13px] font-medium text-[var(--text-primary)]">NR-12 concentra {Math.round(((nrBarData[0]?.Total || 412000) / (multaEmAberto||1.248e6)) * 100) || 33}% da multa estimada total.</p>
                           <p className="text-[12px] text-[var(--text-muted)] mt-1">Priorize adequações e controles de máquina e equipamento.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                           <p className="text-[13px] font-medium text-[var(--text-primary)]">{listRiscos[0]?.titulo || 'Queda de altura'} lidera os riscos críticos.</p>
                           <p className="text-[12px] text-[var(--text-muted)] mt-1">Reforce treinamentos, EPCs e inspeções em altura.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                           <p className="text-[13px] font-medium text-[var(--text-primary)]">Chance média de incidente em nível {(avgChance||32) < 40 ? 'moderado' : 'alto'}.</p>
                           <p className="text-[12px] text-[var(--text-muted)] mt-1">Mantenha o monitoramento e fortaleça controles preventivos.</p>
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between relative z-10">
                    <span className="text-[12px] text-[var(--text-muted)] tracking-wide">Dados consolidados até hoje 08:30</span>
                    <button className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--bg-active-group)]">
                      Ver todos os insights <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>

               {/* Top riscos críticos List */}
               <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl p-6 flex flex-col font-sans">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Top riscos críticos</h3>
                  </div>
                  <div className="flex-1 space-y-3">
                     {listRiscos.map((r, i) => (
                        <div key={r.id || i} className="flex items-center gap-4 py-2 border-b border-[var(--border)] last:border-0 group cursor-pointer hover:bg-[var(--bg-active-group)] px-3 -mx-3 rounded-lg transition-colors" onClick={() => {
                          setSelectedDrawerItem({ type: 'risco', data: r });
                        }}>
                           <div className="w-6 h-6 rounded bg-red-500/10 text-[12px] font-bold text-red-400 flex items-center justify-center shrink-0">
                              {i+1}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)] transition-colors">{r.titulo || r.atividade}</h4>
                           </div>
                           <div className="text-[12px] text-[var(--text-muted)] truncate text-right">
                              {r.setor || r.sector_id}
                           </div>
                           <div className="w-8 flex justify-end">
                              <span className="text-[11px] font-bold text-red-500 flex items-center justify-center w-6 h-6 rounded-full border border-red-500/30 bg-red-500/10">
                                {r.chance || r.chanceIncidente || 85}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <button className="w-full text-center text-[13px] font-medium text-red-400 hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 py-2.5 rounded-lg flex items-center justify-center gap-2" onClick={() => window.location.href='/operacao/riscos'}>
                      Ver todos os riscos críticos <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>

               {/* Top 5 Chance progress bars */}
               <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl p-6 flex flex-col font-sans">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Top 5 riscos por chance de incidente</h3>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2 space-y-5">
                     {renderTopRisksChance.map((r, i) => (
                        <div key={i} className="cursor-pointer group" onClick={() => {
                          window.location.href = '/operacao/riscos'; 
                        }}>
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[13px] font-medium text-[var(--text-secondary)] truncate pr-4 group-hover:text-[var(--text-primary)] transition-colors">{r.name}</h4>
                              <span className="text-[13px] font-bold text-[var(--text-primary)]">{r.chance}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-[#1a1c23] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${r.chance}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="mt-4 pt-5 border-t border-[var(--border)]">
                    <button className="w-full text-center text-[13px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20" onClick={() => window.location.href='/operacao/riscos'}>
                      Ver matriz de riscos <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
            </div>

            {/* Other System Metrics Data Grid */}
            <div className="mt-6 shrink-0 font-sans">
              <h2 className="text-[16px] font-medium text-[var(--text-primary)] mb-6 flex items-center gap-2">
                 Visão Setorial Integrada
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                 {gridKPIs.map(card => {
                    if (!card) return null;
                    return (
                       <div key={card.id} className={`bg-[#0e1322] border rounded-xl overflow-hidden p-5 flex flex-col relative group transition-colors hover:bg-white/[0.02] cursor-pointer ${card.border}`} onClick={() => window.location.href = card.navTo}>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-lg ${card.bg}`}>
                                  <card.icon className={`w-4 h-4 ${card.color}`} />
                               </div>
                               <h4 className="text-[13px] font-medium text-[var(--text-secondary)] leading-tight">{card.label}</h4>
                            </div>
                            <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-muted)] transition-colors" />
                          </div>
                          <div className="flex items-end gap-3 mt-1 relative z-10">
                             <div className="text-3xl font-bold text-[var(--text-primary)] leading-none">{card.val}</div>
                          </div>
                          <div className="text-[12px] font-medium text-[var(--text-muted)] mt-3 relative z-10">{card.sub}</div>
                       </div>
                    );
                 })}
              </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 shrink-0 font-sans pb-12">
               {/* Informative Table 1 */}
               <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden">
                 <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                   <h3 className="text-[15px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                     Últimas Inspeções
                   </h3>
                   <button className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors border border-[var(--border)] hover:bg-[var(--bg-active-group)]" onClick={() => window.location.href='/operacao/inspecoes'}>
                     Ver todas
                   </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[var(--bg-secondary)]/50">
                          <tr>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Status</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tipo/Inspeção</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Setor</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider text-right">Ação</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--border)]">
                          {latestInspections.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-[13px] text-[var(--text-muted)]">Nenhuma inspeção recente.</td></tr>
                          ) : latestInspections.map((insp:any, i:number) => (
                             <tr key={insp.id || i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedDrawerItem({ type: 'inspecao', data: insp })}>
                                <td className="px-5 py-4">
                                   <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${
                                        insp.status === 'Concluída' || insp.status === 'Realizada' ? 'bg-emerald-500' :
                                        insp.status === 'Atrasada' ? 'bg-red-500' :
                                        insp.status === 'Em andamento' ? 'bg-purple-500' :
                                        'bg-blue-500'
                                     }`}></div>
                                     <span className="text-[12px] font-medium text-[var(--text-secondary)]">{insp.status}</span>
                                   </div>
                                </td>
                                <td className="px-5 py-4 min-w-[200px]">
                                   <p className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors capitalize">{insp.title || insp.nome || 'Inspeção de Rotina'}</p>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-[12px] text-[var(--text-muted)]">{insp.setor || insp.sector_id || 'Geral'}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                   <button 
                                      className="text-[12px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-end gap-1 w-full"
                                   >Abrir <ArrowRight className="w-3.5 h-3.5" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               </div>

               {/* Informative Table 2 */}
               <div className="bg-[#0e1322] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden">
                 <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                   <h3 className="text-[15px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                     Ações Pendentes Prioritárias
                   </h3>
                   <button className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors border border-[var(--border)] hover:bg-[var(--bg-active-group)]" onClick={() => window.location.href='/operacao/acoes'}>
                     Ir para Ações
                   </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[var(--bg-secondary)]/50">
                          <tr>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Prioridade</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Ação</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Responsável</th>
                             <th className="px-5 py-3 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider text-right">Ação</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--border)]">
                          {acoes.filter((a:any) => a.status !== 'Concluída' && a.status !== 'Cancelada').slice(0,5).length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-[13px] text-[var(--text-muted)]">Nenhuma ação pendente.</td></tr>
                          ) : acoes.filter((a:any) => a.status !== 'Concluída' && a.status !== 'Cancelada').slice(0,5).map((acao:any, i:number) => (
                             <tr key={acao.id || i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedDrawerItem({ type: 'acao', data: acao })}>
                                <td className="px-5 py-4">
                                   <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block uppercase ${
                                      acao.prioridade === 'Urgente' || acao.priority === 'P1' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                      acao.prioridade === 'Alta' || acao.priority === 'P2' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                   }`}>{acao.prioridade || acao.priority || 'Normal'}</span>
                                </td>
                                <td className="px-5 py-4 min-w-[200px]">
                                   <p className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors truncate max-w-[200px]">{acao.title || acao.titulo}</p>
                                </td>
                                <td className="px-5 py-4">
                                   <span className="text-[12px] text-[var(--text-muted)]">{acao.responsavel || 'Equipe'}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                   <button 
                                      className="text-[12px] font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center justify-end gap-1 w-full"
                                   >Abrir <ArrowRight className="w-3.5 h-3.5" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               </div>

            </div>
          </div>
      </main>

      {/* Push Drawer Details (Read Only) */}
      <AnimatePresence>
        {selectedDrawerItem && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: 50 }} 
            animate={{ width: 440, opacity: 1, x: 0 }} 
            exit={{ width: 0, opacity: 0, x: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 bg-[#0e1322] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col"
          >
             <div className="w-[440px] h-full flex flex-col pt-safe-top overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
                   <div className="flex items-center gap-2">
                     {selectedDrawerItem.type === 'risco' && <ShieldAlert className="w-4 h-4 text-red-400" />}
                     {selectedDrawerItem.type === 'acao' && <ListChecks className="w-4 h-4 text-orange-400" />}
                     {selectedDrawerItem.type === 'inspecao' && <FileText className="w-4 h-4 text-purple-400" />}
                     <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Visualização de {selectedDrawerItem.type}</h3>
                   </div>
                   <button onClick={() => setSelectedDrawerItem(null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active-group)] rounded-md transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   {selectedDrawerItem.type === 'risco' && (
                     <>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 leading-tight">{selectedDrawerItem.data.titulo || selectedDrawerItem.data.atividade}</h2>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Nível</div>
                             <div className={`text-[13px] font-bold ${getRiskSeverityLevel(selectedDrawerItem.data) === 'Crítico' ? 'text-red-400' : 'text-orange-400'}`}>{getRiskSeverityLevel(selectedDrawerItem.data)}</div>
                           </div>
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Status</div>
                             <div className="text-[13px] font-medium text-[var(--text-secondary)]">{selectedDrawerItem.data.status}</div>
                           </div>
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Setor</div>
                             <div className="text-[13px] font-medium text-[var(--text-primary)]">{selectedDrawerItem.data.setor || selectedDrawerItem.data.sector_id || 'N/A'}</div>
                           </div>
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">NR Base</div>
                             <div className="text-[13px] font-medium text-[var(--text-primary)] truncate" title={selectedDrawerItem.data.nr}>{selectedDrawerItem.data.nr || 'Não especificada'}</div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="p-4 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                              <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Multa Estimada</h4>
                              <div className="text-xl font-bold text-yellow-500">{formatCurrency(getMultaEstimada(selectedDrawerItem.data))}</div>
                           </div>
                           <div className="p-4 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                              <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Chance de Incidente</h4>
                              <div className="text-xl font-bold text-emerald-400">{getChanceIncidente(selectedDrawerItem.data)}%</div>
                           </div>
                        </div>

                        <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl mt-6 flex gap-3">
                           <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
                           <div>
                              <h4 className="text-[12px] font-bold text-purple-400 mb-1">Dado sincronizado</h4>
                              <p className="text-[12px] text-[var(--text-muted)] leading-snug">
                                 Este registro pertence à aba Riscos. Clique abaixo para detalhar ou realizar edições operacionais.
                              </p>
                           </div>
                        </div>
                     </>
                   )}

                   {selectedDrawerItem.type === 'acao' && (
                     <>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 leading-tight">{selectedDrawerItem.data.title || selectedDrawerItem.data.titulo}</h2>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Status</div>
                             <div className={`text-[13px] font-medium ${selectedDrawerItem.data.status === 'Vencida' ? 'text-red-400' : 'text-orange-400'}`}>{selectedDrawerItem.data.status}</div>
                           </div>
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Responsável</div>
                             <div className="text-[13px] font-medium text-[var(--text-primary)]">{selectedDrawerItem.data.responsavel}</div>
                           </div>
                        </div>

                        <div>
                           <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Descrição da Ação</h4>
                           <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-secondary)] p-4 border border-[var(--border)] rounded-xl">
                             {selectedDrawerItem.data.description || 'Nenhuma descrição detalhada fornecida.'}
                           </p>
                        </div>
                     </>
                   )}

                   {selectedDrawerItem.type === 'inspecao' && (
                     <>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 leading-tight">{selectedDrawerItem.data.title || selectedDrawerItem.data.nome}</h2>
                        <div className="text-[13px] text-[var(--text-muted)] mb-6">{selectedDrawerItem.data.description || 'Inspeção de rotina agendada.'}</div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Status</div>
                             <div className={`text-[13px] font-medium text-purple-400`}>{selectedDrawerItem.data.status}</div>
                           </div>
                           <div className="p-3 bg-[var(--bg-active-group)] rounded-xl border border-[var(--border)]">
                             <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Setor Alvo</div>
                             <div className="text-[13px] font-medium text-[var(--text-primary)]">{selectedDrawerItem.data.setor || selectedDrawerItem.data.sector_id || 'Geral'}</div>
                           </div>
                        </div>

                        {selectedDrawerItem.data.answers && (
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <h4 className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider mb-1">Não Conformidades Encontradas</h4>
                            <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                              {selectedDrawerItem.data.answers.filter((a:any) => a.isConform === false).length}
                              <span className="text-[12px] font-normal text-yellow-500/70">itens críticos</span>
                            </div>
                          </div>
                        )}
                     </>
                   )}
                </div>

                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
                   <button 
                      onClick={() => {
                         if (selectedDrawerItem.type === 'risco') window.location.href = '/operacao/riscos';
                         if (selectedDrawerItem.type === 'acao') window.location.href = '/operacao/acoes';
                         if (selectedDrawerItem.type === 'inspecao') window.location.href = '/operacao/inspecoes';
                      }}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] font-bold text-[13px] rounded-xl transition-colors flex items-center justify-center gap-2 border border-purple-500/50 shadow-[var(--shadow-glow)]"
                   >
                      Ver detalhes do {selectedDrawerItem.type} <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
