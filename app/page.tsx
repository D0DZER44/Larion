"use client";

import React, { useMemo, useState } from 'react';
import { 
  Bell, Download, Calendar, Activity, AlertTriangle, 
  FileText, Clock, 
  ChevronRight, TrendingUp, TrendingDown, Info, ShieldAlert,
  ArrowRight, BookOpen, Users, MessageSquare,
  ShieldCheck, HardHat, TrendingUp as TrendingUpIcon,
  CheckCircle, Zap, Bot
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAppStore } from '@/lib/store';
import { DecisionEngine, PriorityEngine } from '@/lib/engines';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { calculateDashboardMetrics } from '@/lib/dashboardMetrics';

// --- MOCK COMPONENTS FOR DASHBOARD ---

const StatCard = ({ title, value, trend, trendDir, trendColor, subtext, icon: Icon, data, lineColor = '#c084fc', badge }: any) => {
  const gradientId = `gradient-${title.replace(/\s+/g, '')}`;
  return (
  <div className="glass-panel p-4 flex flex-col justify-between border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer rounded-xl group relative overflow-hidden">
    <div className="flex justify-between items-start mb-2 relative z-10">
      <h3 className="text-gray-400 text-xs font-medium tracking-wider flex items-center gap-1.5 hover:text-purple-400 transition-colors">
        {title} <Info className="w-3.5 h-3.5 text-gray-500 hover:text-purple-400 transition-colors" />
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

export default function Dashboard() {
  const storeState = useAppStore();
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  const currentDecision = useMemo(() => DecisionEngine.getMainDecision(storeState), [storeState]);
  const queue = useMemo(() => PriorityEngine.getQueue(storeState), [storeState]);
  
  const periodStart = startOfMonth(new Date());
  const periodEnd = endOfMonth(new Date());

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

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Ações vencidas = ações com prazo menor que hoje e status diferente de concluída.
  const acoesAtrasadas = (storeState.acoes || []).filter((a: any) => {
    if (a.status === 'Concluído' || a.status === 'Fechada') return false;
    return a.prazo && a.prazo < todayStr;
  });

  // Ações para hoje = ações com prazo igual a hoje e status diferente de concluída.
  const acoesHoje = (storeState.acoes || []).filter((a: any) => {
    if (a.status === 'Concluído' || a.status === 'Fechada') return false;
    return a.prazo === todayStr;
  });

  // Inspeções pendentes = inspeções com status pendente/agendada.
  const inspecoesPendentes = (storeState.inspecoes || []).filter((i: any) => i.status === 'Pendente' || i.status === 'Agendada');

  // Risco crítico aberto = riscos com severidade crítica/alta e status aberto.
  const riscosCriticosData = (storeState.riscos || []).filter((r: any) => {
    const isCritOrHigh = r.nivel === 'Crítico' || r.level === 'Crítico' || r.nivel === 'Alto' || r.level === 'Alto';
    const isOpen = r.status === 'Aberto' || r.status === 'Pendente' || r.status === 'Identificado'; // some variations depending on how status was saved
    return isCritOrHigh && isOpen;
  });
  
  const proximasInspecoes = [...inspecoesPendentes].sort((a: any, b: any) => (a.data || '').localeCompare(b.data || '')).slice(0, 3);
  
  // Inspeções que geram ação: Listar inspeções reais e mostrar: inspeção origem, setor, risco gerado, ação gerada, responsável, status
  const acoesGeradasInspect = (storeState.acoes || []).filter((a: any) => a.item_origem_tipo === 'inspecao' || a.source_type === 'inspecao' || a.origem?.toLowerCase().includes('inspe')).slice(0, 5);
  
  const valor_hora_estimado = 85; 
  const custo_estimado_por_pendencia = 500;
  
  const pendencias_evitadas = (storeState.acoes || []).filter((a: any) => a.status === 'Concluído' || a.status === 'Fechada').length;
  const horas_economizadas = pendencias_evitadas * 2.5; // Example simple formula
  const impacto_financeiro = (horas_economizadas * valor_hora_estimado) + (pendencias_evitadas * custo_estimado_por_pendencia);

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
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden w-full bg-[#0a0a0a]">
        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none w-full">
          <div className="space-y-6">

            {/* Topo: Agenda do dia */}
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" /> Agenda do dia
              </h2>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="bg-[#121826] p-6 rounded-2xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col justify-between group transition-all h-full cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-bold text-gray-400 hover:text-purple-400 transition-colors uppercase tracking-wider">Ações Vencidas</span>
                    <Clock className="w-5 h-5 text-red-500 hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-4xl font-bold text-red-500 tracking-tight">{acoesAtrasadas.length}</span>
                </div>
                <div className="bg-[#121826] p-6 rounded-2xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col justify-between group transition-all h-full cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-bold text-gray-400 hover:text-purple-400 transition-colors uppercase tracking-wider">Ações para Hoje</span>
                    <Activity className="w-5 h-5 text-blue-400 hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-4xl font-bold text-white tracking-tight">{acoesHoje.length}</span>
                </div>
                <div className="bg-[#121826] p-6 rounded-2xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col justify-between group transition-all h-full cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-bold text-gray-400 hover:text-purple-400 transition-colors uppercase tracking-wider">Insp. Pendentes</span>
                    <ShieldCheck className="w-5 h-5 text-orange-500 hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-4xl font-bold text-white tracking-tight">{inspecoesPendentes.length}</span>
                </div>
                <div className="bg-[#121826] p-6 rounded-2xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col justify-between group transition-all h-full cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-bold text-gray-400 hover:text-purple-400 transition-colors uppercase tracking-wider">Risco Crítico Abre</span>
                    <AlertTriangle className="w-5 h-5 text-red-500 hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-4xl font-bold text-red-500 tracking-tight">{riscosCriticosData.length}</span>
                </div>
              </div>
            </div>

              {/* SST Brain Core Section */}
              <div className="xl:col-span-12 glass-panel p-6 rounded-xl bg-gradient-to-br from-[#121826] to-[#0a0a0a] border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all relative overflow-hidden group cursor-default">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-10 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl opacity-40"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl relative">
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white hover:text-purple-400 transition-colors tracking-tight">SST Inteligência</h2>
                      <p className="text-sm text-gray-400">Análise contínua, cruzamento de dados e recomendações automáticas.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Confiança: {currentDecision.confidence}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">Baseado em {totalDataPoints} pontos de dados</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] xl:grid-cols-[1fr_1.2fr] gap-8 relative z-10">
                  {/* Left Column: Analysis & Reasoning */}
                  <div className="flex flex-col gap-5">
                    {totalDataPoints === 0 ? (
                      <div className="bg-[#121415]/80 p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center h-full">
                        <Info className="w-8 h-8 text-gray-500 mb-4" />
                        <h3 className="text-sm font-bold text-gray-300 mb-2">Dados Insuficientes</h3>
                        <p className="text-[13px] text-gray-500 max-w-sm">O sistema não possui registros ativos de riscos, inspeções ou ações para realizar uma análise confiável e recomendar intervenções.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ArrowRight className="w-3.5 h-3.5" /> Cruzamento de Dados
                          </h3>
                          <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex-1 flex flex-col justify-center hover:border-purple-500/50 group overflow-hidden relative transition-all cursor-default">
                            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-[13px] text-gray-300 group-hover:text-gray-200 transition-colors leading-relaxed relative z-10">
                              {currentDecision.reason}
                            </p>
                            {currentDecision.causeAndEffect?.causes?.length > 0 && (
                              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-gray-400 relative z-10">
                                <TrendingUp className="w-4 h-4 text-purple-500 shrink-0" />
                                {currentDecision.causeAndEffect.causes.map((c: string, idx: number) => (
                                  <span key={idx} className="bg-white/5 px-2 py-1.5 rounded truncate max-w-[200px] border border-white/5 hover:border-purple-500/30 hover:text-purple-300 transition-colors text-[11px] font-medium">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 shrink-0">
                          <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent hover:border-purple-500/50 flex flex-col justify-center group overflow-hidden relative transition-all cursor-default">
                            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-[10px] font-bold text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-wider mb-1.5 relative z-10">Setor Mais Crítico</h4>
                            <p className="text-[15px] text-white font-bold truncate relative z-10">{currentDecision.evidences?.[0] || 'Geral'}</p>
                          </div>
                          <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent hover:border-purple-500/50 flex flex-col justify-center group overflow-hidden relative transition-all cursor-default">
                            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-[10px] font-bold text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-wider mb-1.5 relative z-10">Risco Operacional</h4>
                            <p className={`text-[15px] font-bold uppercase tracking-wide relative z-10 ${currentDecision.operationalImpact === 'Crítico' ? 'text-red-500' : currentDecision.operationalImpact === 'Alto' ? 'text-orange-500' : 'text-purple-500'}`}>
                              {currentDecision.operationalImpact}
                            </p>
                          </div>
                        </div>

                        <div className={`shrink-0 bg-gradient-to-r ${currentDecision.operationalImpact === 'Crítico' || currentDecision.operationalImpact === 'Alto' ? 'from-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5' : 'from-purple-500/10 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5'} p-5 rounded-xl border-l-4 border-y border-r border-y-transparent border-r-transparent to-[#0b0f19] transition-all group cursor-default relative overflow-hidden`}>
                          <h3 className={`relative z-10 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${currentDecision.operationalImpact === 'Crítico' || currentDecision.operationalImpact === 'Alto' ? 'text-red-400 hover:text-red-300' : 'text-purple-400 hover:text-purple-300'} transition-colors`}>Ação Recomendada</h3>

                          <p className="relative z-10 text-[15px] text-white font-bold leading-tight mb-2">
                             {currentDecision.decision}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Priority Queue */}
                  <div className="flex flex-col">
                    <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Zap className="w-3.5 h-3.5" /> O Que Fazer Agora
                    </h3>
                    
                    <div className="flex-1 bg-[#0b0f19] border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between">
                      <div className="overflow-x-auto p-0 m-0">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[28%]">Ação Pendente</th>
                              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsável</th>
                              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prazo</th>
                              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topActions.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">Fila limpa. Sem itens pendentes no momento.</td>
                              </tr>
                            ) : topActions.map((item: any, i: number) => (
                              <tr key={item.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                  <span className="font-bold text-xs text-gray-200 block mb-0.5 hover:text-purple-400 transition-colors truncate max-w-[200px]" title={item.title}>{item.title}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-xs text-gray-400 font-medium block truncate max-w-[150px]" title={item.resp}>{item.resp}</span>
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-bold ${item.prio === 'P1' || item.status === 'Urgente' || item.status === 'Atrasada' ? 'text-red-500' : 'text-orange-500'}`}>{item.prazo}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center justify-center text-[9px] font-bold px-2 py-0.5 rounded border uppercase min-w-[70px] ${
                                    item.status === 'Em andamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                    item.status === 'Concluído' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                    (item.status === 'Urgente' || item.status === 'Atrasada') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                    'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                  }`}>{item.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-auto p-4 border-t border-white/5 bg-[#121826] text-center hover:bg-white/[0.02] transition-colors">
                        <a href="/acoes" className="text-[11px] text-purple-400 hover:text-purple-300 font-bold transition-colors uppercase tracking-widest block w-full">Resolver fila ({queue.length} pendentes)</a>
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
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
              {/* Inspeções que geram ação */}
              <div className="glass-panel rounded-xl flex flex-col h-[380px] lg:h-auto border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all bg-[#121826] group cursor-default">
                <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10">
                    <h3 className="text-white hover:text-purple-400 transition-colors font-bold flex items-center text-xs uppercase tracking-wider">
                      Inspeções Que Geram Ação
                    </h3>
                    <a href="/acoes" className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">Ver todas</a>
                </div>
                <div className="flex-1 overflow-y-auto p-0 scrollbar-none flex flex-col relative w-full overflow-hidden">
                  {acoesGeradasInspect.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500 absolute inset-0">
                      <CheckCircle className="w-8 h-8 mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma ação recente via inspeção.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider bg-[#0b0f19]">
                          <th className="p-4 font-bold">Inspeção Origem</th>
                          <th className="p-4 font-bold">Ação Gerada</th>
                          <th className="p-4 font-bold">Resp.</th>
                          <th className="p-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acoesGeradasInspect.map((a: any, i: number) => (
                           <tr key={a.id ? `generated-${a.id}-${i}` : `generated-idx-${i}`} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-default">
                              <td className="p-4 overflow-hidden text-ellipsis">
                                 <span className="text-xs font-bold text-gray-300 block truncate" style={{maxWidth: '120px'}}>{a.origem || 'Inspeção NR'}</span>
                                 <span className="text-[10px] text-gray-500">{a.setor || 'Geral'}</span>
                              </td>
                              <td className="p-4 overflow-hidden text-ellipsis">
                                 <span className="text-xs text-white block truncate hover:text-purple-400 transition-colors font-bold" style={{maxWidth: '150px'}}>{a.titulo || a.title}</span>
                                 <span className="text-[10px] text-red-500 font-medium truncate block" style={{maxWidth: '150px'}}>{a.category || a.prioridade || 'Risco não especificado'}</span>
                              </td>
                              <td className="p-4 text-xs text-gray-400 truncate max-w-[100px]">{a.responsavel || a.owner}</td>
                              <td className="p-4">
                                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${a.status === 'Concluído' || a.status === 'Fechada' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' : 'text-orange-400 border-orange-500/20 bg-orange-500/10'}`}>{a.status}</span>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Painel de Impacto and Relatorio */}
              <div className="bg-[#121826] bg-gradient-to-b from-[#121826] to-[#0d121c] rounded-xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all p-6 flex flex-col h-[380px] lg:h-full group cursor-default">
                 <div className="flex items-center gap-3 mb-6">
                    <TrendingUpIcon className="w-5 h-5 text-purple-400 hover:text-purple-300 transition-colors" />
                    <h3 className="text-sm font-bold text-white hover:text-purple-400 transition-colors uppercase tracking-wider">Painel de Impacto</h3>
                 </div>

                 <div className="flex flex-col gap-5 flex-1 justify-between">
                    <div className="grid grid-cols-2 gap-5">
                       <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent hover:border-purple-500/50 flex flex-col justify-center group overflow-hidden relative transition-all cursor-default">
                          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest font-bold block mb-2 relative z-10">Tempo Econ.</span>
                          <span className="text-2xl font-bold text-white relative z-10">{horas_economizadas}h</span>
                       </div>
                       <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent hover:border-purple-500/50 flex flex-col justify-center group overflow-hidden relative transition-all cursor-default">
                          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest font-bold block mb-2 relative z-10">Ações Fechadas</span>
                          <span className="text-2xl font-bold text-white relative z-10">{pendencias_evitadas}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_0.9fr] gap-5 flex-1 min-h-0">
                        {/* Impacto financeiro estimado */}
                        <div className="bg-[#0b0f19] p-5 rounded-xl border border-transparent hover:border-purple-500/50 flex flex-col justify-between group overflow-hidden relative min-h-[140px] transition-all cursor-default">
                           <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-6 h-6 rounded-full border border-purple-500 flex items-center justify-center shrink-0">
                                    <TrendingUpIcon className="w-3 h-3 text-purple-500" />
                                 </div>
                                 <span className="text-[11px] font-bold text-gray-400 hover:text-purple-400 transition-colors uppercase tracking-wider">Impacto financeiro estimado</span>
                              </div>
                              <div className="flex items-baseline gap-1 mt-2">
                                 <span className="text-[28px] font-bold text-white leading-none">R$ {impacto_financeiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                 <span className="text-xs text-gray-500 font-medium">/mês</span>
                              </div>
                           </div>
                           <span className="text-[10px] text-gray-500 leading-relaxed relative z-10 mt-3 pt-3 border-t border-white/5">
                              Economia com redução de retrabalho, tempo operacional e falhas.
                           </span>
                        </div>

                        {/* Gerar relatorio */}
                        <a href="/relatorios" className="bg-[#0b0f19] p-5 border border-transparent hover:border-purple-500/50 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all cursor-pointer min-h-[140px]">
                           <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                           <div className="flex items-start gap-4 relative z-10">
                              <div className="w-10 h-10 rounded-lg bg-[#121826] border border-white/5 flex items-center justify-center text-gray-400 hover:text-purple-400 group-hover:border-purple-500/30 transition-all shrink-0">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <h4 className="text-[13px] font-bold text-white mb-1 hover:text-purple-400 transition-colors">Gerar relatório em PDF</h4>
                                 <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Relatório completo das ações concluídas - {storeState.riscos?.filter((r: any) => r.status === 'Mitigado' || r.status === 'Resolvido' || r.status === 'Fechado')?.length || 0} riscos tratados
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-end justify-between mt-4">
                              <div className="flex items-end gap-2">
                                <span className="text-[28px] font-bold text-white leading-none">
                                   {storeState.acoes?.filter((a: any) => a.status !== 'Concluído' && a.status !== 'Fechada')?.length || 0}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-loose mb-1">
                                   Pendências
                                </span>
                              </div>
                           </div>
                        </a>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Right Sidebar Button */}
        <button 
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
          className="hidden xl:flex absolute top-1/2 -mt-6 right-0 z-20 items-center justify-center w-6 h-12 bg-[#121415] border border-white/10 rounded-l-md hover:bg-white/5 text-gray-400 transition-colors"
          style={{ right: isRightSidebarOpen ? '320px' : '0px', transform: 'none', borderRight: 'none' }}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isRightSidebarOpen ? '' : 'rotate-180'}`} />
        </button>

        {/* Right Sidebar Lists */}
        <div 
          className={`shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 bg-[#0b0f19] overflow-y-auto space-y-5 scrollbar-none transition-all duration-300 ease-in-out ${isRightSidebarOpen ? 'w-full xl:w-[320px] p-4 sm:p-5 opacity-100' : 'w-0 p-0 opacity-0 border-transparent pointer-events-none'}`}
        >
          
          {/* Assistente L.A.R.I - Header Minimalista */}
          <div className="bg-[#121826] rounded-xl border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">L.A.R.I</h3>
                <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Assistente IA</p>
              </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-white/5 relative z-10">
              <p className="text-xs text-gray-300 leading-relaxed italic">
                {(acoesAtrasadas.length === 0 && inspecoesPendentes.length === 0) ? (
                  <span>
                     &quot;Excelente trabalho! Não temos <span className="text-white font-bold">ações em atraso</span> nem <span className="text-white font-bold">inspeções pendentes</span> para hoje. Nossa operação está em dia com a segurança.&quot;
                  </span>
                ) : (
                  <span>
                     &quot;Bom dia! Hoje temos {acoesAtrasadas.length > 0 && <><span className="text-white font-bold">{acoesAtrasadas.length} ações em atraso</span> </>} {acoesAtrasadas.length > 0 && inspecoesPendentes.length > 0 && "e "} {inspecoesPendentes.length > 0 && <><span className="text-white font-bold">{inspecoesPendentes.length} inspeções pendentes</span></>}. Sugiro focar {currentDecision.evidences?.[0] ? 'no ' + currentDecision.evidences[0] : 'no gerenciamento das atividades ativas'}.&quot;
                  </span>
                )}
              </p>
            </div>
            <button className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Abrir Chat
            </button>
          </div>

          {/* Top 3 Riscos Críticos Sidebar */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col bg-[#121826] border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group cursor-default">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-gray-300 hover:text-purple-400 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 hover:text-purple-400 transition-colors" /> Riscos Abertos
                  </h3>
                  <a href="/riscos" className="text-[10px] text-purple-400 hover:text-purple-300">Ver todos</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {riscosCriticosData.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">Nenhum risco crítico aberto.</p>
                ) : riscosCriticosData.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex flex-col group cursor-pointer relative">
                      <div className="absolute -left-2 top-1.5 w-[3px] h-0 bg-red-500 rounded-r-full transition-all group-hover:h-5"></div>
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <p className="text-xs font-bold text-gray-200 hover:text-purple-400 transition-colors truncate">{item.title}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20`}>{item.nivel || item.level || 'Crítico'}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{item.setor || item.sector || 'Geral'}</p>
                  </div>
                ))}
              </div>
          </div>

          {/* Próximas Inspeções Vencendo */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col bg-[#121826] border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group cursor-default">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-gray-300 hover:text-purple-400 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-500 hover:text-purple-400 transition-colors" /> Próximas Inspeções
                  </h3>
                  <a href="/inspecoes" className="text-[10px] text-purple-400 hover:text-purple-300">Ver todas</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {proximasInspecoes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">Nenhuma inspeção próxima.</p>
                ) : proximasInspecoes.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start group cursor-pointer border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-black/40 p-1.5 rounded-lg border border-white/5">
                          <BookOpen className={`w-3.5 h-3.5 ${item.status === 'Atrasada' ? 'text-red-500' : 'text-orange-500'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-200 hover:text-purple-400 transition-colors line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.assigned_to || 'Equipe SST'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 block">{item.data}</span>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-purple-500 hover:scale-105 transition-all text-white border border-purple-400/30 z-50">
        <MessageSquare className="w-6 h-6" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0b0f19] rounded-full"></span>
      </button>
    </div>
  );
}
