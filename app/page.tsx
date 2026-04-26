"use client";

import React, { useMemo, useState } from 'react';
import { 
  Bell, Download, Calendar, Activity, AlertTriangle, 
  FileText, Clock, Settings, Search, CheckCircle2, 
  ChevronRight, TrendingUp, TrendingDown, Info, ShieldAlert,
  ArrowRight, Shield, BookOpen, Wrench, Users, MessageSquare,
  ShieldCheck, HardHat, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import Image from 'next/image';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAppStore } from '@/lib/store';
import { DecisionEngine, PriorityEngine } from '@/lib/engines';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { calculateDashboardMetrics } from '@/lib/dashboardMetrics';

// --- MOCK COMPONENTS FOR DASHBOARD ---

const StatCard = ({ title, value, trend, trendDir, trendColor, subtext, icon: Icon, data, lineColor = '#c084fc', badge }: any) => {
  const gradientId = `gradient-${title.replace(/\s+/g, '')}`;
  return (
  <div className="glass-panel p-4 flex flex-col justify-between border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer rounded-xl group relative overflow-hidden">
    <div className="flex justify-between items-start mb-2 relative z-10">
      <h3 className="text-gray-400 text-xs font-medium tracking-wider flex items-center gap-1.5 group-hover:text-gray-300 transition-colors">
        {title} <Info className="w-3.5 h-3.5 text-gray-500" />
        {badge && <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-white/10 text-white border border-white/20">{badge}</span>}
      </h3>
      <div className="p-1.5 bg-white/5 rounded-md">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
    </div>
    
    <div className="relative z-10">
      <div className={`font-bold text-white mb-2 ${value && value.toString().includes('insuficientes') ? 'text-sm text-gray-400 mt-2 font-medium' : 'text-3xl'}`}>{value}</div>
      <div className="flex items-center justify-between">
        {trend && (
           <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
             {trendDir === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
             <span>{trend}</span>
           </div>
        )}
      </div>
      <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>
    </div>
    
    {data && (
       <div className="mt-4 pt-4 border-t border-white/5 h-20 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.4}/>
                <stop offset="100%" stopColor={lineColor} stopOpacity={0}/>
              </linearGradient>
              <filter id={`shadow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={lineColor} floodOpacity="0.3"/>
              </filter>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={lineColor} 
              strokeWidth={3} 
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: '#121826', stroke: lineColor, strokeWidth: 2 }}
              dot={{ r: 0 }}
              style={{ filter: `url(#shadow-${gradientId})` }}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
)};

const RiskDonut = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90">
      {/* Background */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {/* Gauge (68% fill) */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="351" strokeDashoffset="112.32" className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" strokeLinecap="round" />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
      <span className="text-3xl font-bold text-white leading-none">68</span>
      <span className="text-[10px] text-orange-500 font-bold tracking-wider mt-1 uppercase">Alto</span>
    </div>
  </div>
);

export default function Dashboard() {
  const storeState = useAppStore();
  
  const currentDecision = useMemo(() => DecisionEngine.getMainDecision(storeState), [storeState]);
  const queue = useMemo(() => PriorityEngine.getQueue(storeState), [storeState]);
  
  const [periodStart, setPeriodStart] = useState<Date>(startOfMonth(new Date()));
  const [periodEnd, setPeriodEnd] = useState<Date>(endOfMonth(new Date()));

  const metrics = useMemo(() => calculateDashboardMetrics(storeState, periodStart, periodEnd), [storeState, periodStart, periodEnd]);
  
  const topActions = queue.slice(0, 3);
  const totalDataPoints = (storeState.acoes?.length || 0) + (storeState.riscos?.length || 0) + (storeState.inspecoes?.length || 0) + (storeState.alertas?.length || 0);

  const validHours = (storeState.work_hours || []).filter(h => h.total_hours > 0);
  const totalHours = validHours.reduce((acc, curr) => acc + curr.total_hours, 0);

  let modeBadge = "";
  if (totalHours > 0) {
     if(validHours.some(w => w.calculation_mode === 'Estimado')) {
       modeBadge = "Estimado";
     } else {
       modeBadge = "Informado";
     }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b0f19] shrink-0 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            Bom dia, Rafael! <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Aqui está o panorama da segurança hoje.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center shrink-0 bg-[#121826] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span className="hidden sm:inline">01/05/2024 - 31/05/2024</span>
            <span className="sm:hidden">Maio 2024</span>
            <ChevronRight className="w-4 h-4 ml-3 text-gray-500 rotate-90" />
          </div>
          
          <button className="relative shrink-0 p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0b0f19]"></span>
          </button>
          
          <button className="flex items-center shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Split Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden w-full">
        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none w-full">
          <div className="space-y-4">
              {/* SST Brain Core Section */}
              <div className="xl:col-span-12 glass-panel p-6 rounded-xl bg-gradient-to-br from-[#121826] to-[#1e1a30] border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl opacity-40"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl relative">
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">SST Inteligência Central</h2>
                      <p className="text-sm text-gray-400">Análise contínua, cruzamento de dados e recomendações automáticas.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Confiança: {currentDecision.confidence}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">Baseado em {totalDataPoints} pontos de dados</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                  {/* Left Column: Analysis & Reasoning */}
                  <div className="lg:col-span-5 space-y-6">
                    {totalDataPoints === 0 ? (
                      <div className="bg-[#121826]/80 p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center h-full">
                        <Info className="w-8 h-8 text-gray-500 mb-4" />
                        <h3 className="text-sm font-bold text-gray-300 mb-2">Dados Insuficientes</h3>
                        <p className="text-[13px] text-gray-500 max-w-sm">O sistema não possui registros ativos de riscos, inspeções ou ações para realizar uma análise confiável e recomendar intervenções.</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" /> Cruzamento de Dados
                          </h3>
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5 shadow-inner">
                            <p className="text-[14px] text-gray-200 leading-relaxed font-medium">
                              {currentDecision.reason}
                            </p>
                            {currentDecision.causeAndEffect?.causes?.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-gray-400">
                                <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
                                {currentDecision.causeAndEffect.causes.map((c: string, idx: number) => (
                                  <span key={idx} className="bg-white/5 px-2 py-1 rounded truncate max-w-[200px]">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#121826]/80 p-4 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">O Que Mudou</h4>
                            <p className="text-sm text-white font-medium">{currentDecision.evidences?.[0] || 'Sem ocorrências recentes'}</p>
                          </div>
                          <div className="bg-[#121826]/80 p-4 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Impacto Provável</h4>
                            <p className={`text-sm font-bold ${currentDecision.operationalImpact === 'Crítico' ? 'text-red-400' : currentDecision.operationalImpact === 'Alto' ? 'text-orange-400' : 'text-emerald-400'}`}>
                              Risco {currentDecision.operationalImpact}
                            </p>
                          </div>
                        </div>

                        <div className={`bg-gradient-to-r ${currentDecision.operationalImpact === 'Crítico' || currentDecision.operationalImpact === 'Alto' ? 'from-red-500/10 border-red-500' : 'from-emerald-500/10 border-emerald-500'} p-5 rounded-xl border-l-2 to-transparent`}>
                          <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${currentDecision.operationalImpact === 'Crítico' || currentDecision.operationalImpact === 'Alto' ? 'text-red-400' : 'text-emerald-400'}`}>Decisão Recomendada</h3>
                          <p className="text-base text-white font-bold leading-tight mb-2">
                            {currentDecision.decision}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-2">
                            Ações automáticas criadas e priorizadas.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Priority Queue */}
                  <div className="lg:col-span-7 flex flex-col">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" /> Fila de Prioridade Ativa
                    </h3>
                    
                    <div className="flex-1 bg-[#0b0f19]/80 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#121826]/50">
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[28%]">Ação Sugerida / Origem</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Responsável / Prazo</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Próxima Etapa</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Execução</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topActions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-400 text-sm">Fila limpa. Sem itens pendentes no momento.</td>
                              </tr>
                            ) : topActions.map((item: any, i: number) => (
                              <tr key={item.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="p-3">
                                  <span className="font-bold text-sm text-white block mb-0.5 group-hover:text-purple-400 transition-colors truncate max-w-[200px]" title={item.title}>{item.title}</span>
                                  <span className="text-[10px] text-gray-500 uppercase">Origem: {item.origem}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-xs text-gray-300 font-medium block truncate max-w-[150px]" title={item.resp}>{item.resp}</span>
                                  <span className={`text-[10px] font-bold ${item.prio === 'P1' || item.status === 'Urgente' || item.status === 'Atrasada' ? 'text-red-400' : 'text-orange-400'}`}>Prazo: {item.prazo}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-[11px] text-gray-400 font-medium leading-snug w-[150px] inline-block truncate" title={item.proc}>{item.proc}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-flex items-center text-[9px] font-bold px-2 py-1 rounded border uppercase ${
                                    item.status === 'Em andamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                    item.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                    (item.status === 'Urgente' || item.status === 'Atrasada') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                  }`}>{item.status}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <a href="/central" className="text-[10px] px-2.5 py-1.5 rounded bg-[#121826] border border-white/10 hover:border-purple-500/50 hover:text-white transition-colors">Abrir</a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-auto p-3 border-t border-white/5 bg-[#121826]/30 text-center">
                        <a href="/central" className="text-[11px] text-purple-400 hover:text-purple-300 font-bold transition-colors uppercase tracking-wider">Ver Fila Completa ({queue.length} itens)</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* 4 Mini Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard 
                title="TFA" 
                value={metrics.tfa.value} 
                trend={metrics.tfa.trend}  
                trendDir={metrics.tfa.trendDir} 
                trendColor={metrics.tfa.trendColor} 
                subtext="vs. período anterior" 
                icon={Users} 
                lineColor="#c084fc"
                badge={modeBadge}
                data={metrics.tfa.series}
              />
              <StatCard 
                title="TG" 
                value={metrics.tg.value} 
                trend={metrics.tg.trend}  
                trendDir={metrics.tg.trendDir} 
                trendColor={metrics.tg.trendColor} 
                subtext="vs. período anterior" 
                icon={TrendingUpIcon} 
                lineColor="#ef4444"
                badge={modeBadge}
                data={metrics.tg.series}
              />
              <StatCard 
                title="Near Miss" 
                value={metrics.nearMiss.value} 
                trend={metrics.nearMiss.trend} 
                trendDir={metrics.nearMiss.trendDir} 
                trendColor={metrics.nearMiss.trendColor} 
                subtext="vs. período anterior" 
                icon={ShieldCheck} 
                lineColor="#c084fc"
                data={metrics.nearMiss.series}
              />
              <StatCard 
                title="EPIs Conformes" 
                value={metrics.epi.value} 
                trend={metrics.epi.trend} 
                trendDir={metrics.epi.trendDir} 
                trendColor={metrics.epi.trendColor} 
                subtext="vs. período anterior" 
                icon={HardHat} 
                lineColor="#c084fc"
                data={metrics.epi.series}
              />
            </div>

            {/* Lower Main Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Riscos Críticos List */}
              <div className="glass-panel rounded-xl flex flex-col h-[380px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                      RISCOS CRÍTICOS (5)
                    </h3>
                    <a href="/riscos" className="text-[11px] text-purple-400 hover:text-purple-300">Ver todos</a>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-none flex flex-col space-y-1">
                  {[
                    { title: "Máquina sem proteção", subtitle: "NR-12 • 3 pessoas expostas", level: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", isCheck: false },
                    { title: "Trabalho em altura sem proteção", subtitle: "NR-35 • 5 pessoas expostas", level: "ALTO", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", isCheck: false },
                    { title: "EPIs vencidos", subtitle: "NR-06 • 12 colaboradores", level: "MÉDIO", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", isCheck: false },
                    { title: "Extintor vencido", subtitle: "NR-23 • Setor Almoxarifado", level: "MÉDIO", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", isCheck: false },
                    { title: "Ventilação inadequada", subtitle: "NR-15 • Setor Solda", level: "BAIXO", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", isCheck: true },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col py-2 px-3 border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 rounded-lg transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="mt-0.5 shrink-0">
                              {item.isCheck ? (
                                <div className={`p-1.5 rounded-full border ${item.bg} ${item.border} ${item.color}`}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className={`p-1.5 rounded-full border ${item.bg} ${item.border} ${item.color}`}>
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">{item.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.color} ${item.bg} ${item.border} border`}>
                            {item.level}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex-1 flex items-end">
                    <div className="w-full text-center pb-2">
                       <span className="text-[10px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer transition-colors">+2 riscos em monitoramento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colaboradores em Risco List */}
              <div className="glass-panel rounded-xl flex flex-col h-[380px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                      COLABORADORES EM POSSÍVEIS RISCOS
                    </h3>
                    <a href="/configuracoes" className="text-[11px] text-purple-400 hover:text-purple-300">Ver todas</a>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-none flex flex-col space-y-1">
                  {[
                    { name: "João Silva", sector: "Setor Solda", percent: 82, level: "ALTO", color: "text-red-500", bgCol: "bg-red-500/10", border: "border-red-500/20" },
                    { name: "Carlos Lima", sector: "Manutenção", percent: 65, level: "ALTO", color: "text-orange-500", bgCol: "bg-orange-500/10", border: "border-orange-500/20" },
                    { name: "Maria Santos", sector: "Produção", percent: 43, level: "MÉDIO", color: "text-yellow-500", bgCol: "bg-yellow-500/10", border: "border-yellow-500/20" },
                    { name: "Pedro Costa", sector: "Almoxarifado", percent: 28, level: "BAIXO", color: "text-emerald-500", bgCol: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { name: "Ana Paula", sector: "Adm. / Escritório", percent: 18, level: "BAIXO", color: "text-emerald-500", bgCol: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 rounded-lg transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <Image src={`https://picsum.photos/seed/${item.name}/32/32`} width={32} height={32} alt={item.name} className="rounded-full bg-gray-800 border-2 border-white/10" />
                        <div>
                          <p className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">{item.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.sector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32 h-2 bg-[#121826] rounded-full overflow-hidden">
                          <div className={`h-full bg-purple-600 rounded-full`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                        <span className="text-[12px] font-medium text-gray-300 w-8 text-right">{item.percent}%</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.color} ${item.bgCol} ${item.border} border w-14 text-center`}>
                          {item.level}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Lists */}
        <div className="w-full xl:w-[360px] shrink-0 xl:border-l border-t xl:border-t-0 border-white/5 bg-[#121826]/30 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none xl:h-full">
          
          {/* Alertas Críticos */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">ALERTAS CRÍTICOS</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todos</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[
                  { title: "ASO - João Silva", desc: "Vence em 3 dias", type: "CRÍTICO", color: "text-red-500", bgDot: "bg-red-500", icon: Users },
                  { title: "Treinamento NR-35", desc: "Vence em 5 dias", type: "ALTO", color: "text-orange-500", bgDot: "bg-orange-500", icon: BookOpen },
                  { title: "CA - Equipamento", desc: "Vence em 7 dias", type: "ALTO", color: "text-orange-500", bgDot: "bg-orange-500", icon: ShieldAlert },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col group cursor-pointer relative">
                      <div className="absolute -left-2 top-1.5 w-[3px] h-0 bg-purple-500 rounded-r-full transition-all group-hover:h-5"></div>
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{item.title}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${item.color}`}>{item.type}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 ml-5.5">{item.desc}</p>
                  </div>
                ))}
              </div>
          </div>

          {/* Ações Prioritárias */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">AÇÕES PRIORITÁRIAS</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todas</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[
                  { title: "Regularizar EPIs vencidos", desc: "João Silva", type: "CRÍTICO", color: "text-red-500", date: "24/05", icon: ShieldAlert },
                  { title: "Treinamento NR-35", desc: "Maria Santos", type: "ALTA", color: "text-orange-500", date: "27/05", icon: BookOpen },
                  { title: "Inspeção em máquinas - NR-12", desc: "Carlos Lima", type: "ALTA", color: "text-orange-500", date: "29/05", icon: Wrench },
                  { title: "Manutenção preventiva", desc: "Ana Paula", type: "MÉDIA", color: "text-yellow-500", date: "31/05", icon: Settings },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-white/5 p-1 rounded">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors leading-tight mb-1">{item.title}</p>
                          <p className="text-[11px] text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-current ${item.color} bg-white/5`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] text-gray-600">{item.date}</span>
                      </div>
                  </div>
                ))}
              </div>
          </div>

          {/* Atividade Recente */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">ATIVIDADE RECENTE</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todas</a>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { title: "Inspeção realizada", desc: "Setor Produção", time: "08:45", icon: CheckCircle2, color: "text-emerald-500" },
                  { title: "Treinamento concluído", desc: "NR-06 - Uso de EPIs", time: "07:30", icon: CheckCircle2, color: "text-emerald-500" },
                  { title: "Near miss registrado", desc: "Queda de objeto", time: "Ontem", icon: AlertTriangle, color: "text-orange-500" },
                  { title: "Ação concluída", desc: "Regularização de EPIs", time: "Ontem", icon: CheckCircle2, color: "text-emerald-500" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                      <div className="flex items-start gap-3 w-full">
                        <div className="mt-0.5 opacity-80">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[11px] text-gray-500 truncate">{item.desc}</p>
                            <span className="text-[10px] text-gray-600 whitespace-nowrap ml-2">{item.time}</span>
                          </div>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:bg-purple-500 hover:scale-105 transition-all text-white border border-purple-400/30 z-50">
        <MessageSquare className="w-6 h-6" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0b0f19] rounded-full"></span>
      </button>
    </div>
  );
}
