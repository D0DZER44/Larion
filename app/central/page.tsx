"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NormativeEngine, RiskEngine, EconomicImpactEngine, DecisionEngine, PriorityEngine, ActionEngine } from '@/lib/engines';
import { useAppStore } from '@/lib/store';
import { 
  Bell, FileText, CheckCircle2, AlertTriangle, ArrowRight,

  Filter, Calendar, X, Activity, PlayCircle, MoreVertical,
  Clock, CheckSquare, Shield, AlertCircle, User
} from 'lucide-react';

type PriorityRowItem = {
  id: string;
  prio: string;
  title: string;
  origem: string;
  resp: string;
  prazo: string;
  prazoOriginal: string;
  status: string;
  proc: string;
  reasons: string[];
  checklist: { label: string; checked: boolean }[];
  item_origem_id?: string;
  item_origem_tipo?: string;
};

// Sparkline component 
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
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        points={areaPoints}
        fill={`url(#${gradientId})`}
      />
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.circle
        initial={{ opacity: 0, r: 0 }}
        animate={{ opacity: 1, r: 3 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        cx={width}
        cy={endY}
        fill="#ffffff"
        stroke={color}
        strokeWidth="2"
      />
      <motion.circle
        initial={{ opacity: 0, r: 0 }}
        animate={{ opacity: 0.3, r: 8 }}
        transition={{ delay: 1.2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        cx={width}
        cy={endY}
        fill={color}
      />
    </svg>
  );
};

// Share2 icon
function Share2Icon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  )
}

export default function CentralPage() {
  const storeState = useAppStore();
  const queue = useMemo(() => PriorityEngine.getQueue(storeState), [storeState]);
  const currentDecision = useMemo(() => DecisionEngine.getMainDecision(storeState), [storeState]);
  
  const getTrend = (items: any[], activeCondition: (item: any) => boolean) => {
    const hasDates = items.some(i => i.createdAt || i.created_at || i.dataCriacao);
    const currentCount = items.filter(activeCondition).length;

    if (!hasDates || items.length === 0) {
      return { val: currentCount, stat: "sem histórico suficiente", data: [] };
    }

    const today = new Date();
    const trendData: number[] = [];
    let yesterdayCount = 0;

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const targetTime = targetDate.getTime();

      const countForDay = items.filter(item => {
        if (!activeCondition(item)) return false;
        const cDateStr = item.createdAt || item.created_at || item.dataCriacao;
        if (!cDateStr) return true; // Include if no date
        const cTime = new Date(cDateStr).getTime();
        return cTime <= targetTime;
      }).length;

      trendData.push(countForDay);
      if (i === 1) yesterdayCount = countForDay;
    }

    const diff = currentCount - yesterdayCount;
    const pct = yesterdayCount === 0 ? (diff > 0 ? 100 : 0) : Math.round((diff / yesterdayCount) * 100);
    const sign = diff > 0 ? '+' : '';
    const stat = `${sign}${pct}% vs ontem`;

    return { val: currentCount, stat, data: trendData };
  };

  const kpis = useMemo(() => {
    // 1. Riscos Críticos
    const riscos = storeState.riscos || [];
    const riscosTrend = getTrend(riscos, (r) => {
      const nivel = r.nivel || r.level || '';
      return nivel.toLowerCase() === 'crítico' && r.status !== 'Mitigado' && r.status !== 'Resolvido';
    });

    // 2. Inspeções Vencidas
    const inspecoes = storeState.inspecoes || [];
    const inspTrend = getTrend(inspecoes, (i) => i.status === 'Atrasada' || i.relativeDate === 'Atrasada');

    // 3. Ações Vencidas
    const acoes = storeState.acoes || [];
    const acoesTrend = getTrend(acoes, (a) => ActionEngine.isOverdue(a));

    // 4. Alertas Ativos
    const alertas = storeState.alertas || [];
    const alertasTrend = getTrend(alertas, (a) => a.status === 'Ativo' || a.status === 'Aberto');

    return [
      { title: "Riscos Críticos", val: riscosTrend.val.toString(), stat: riscosTrend.stat, statCol: "text-red-400", bg: "border-red-500/20", icon: <AlertTriangle className="w-4 h-4 text-red-500" />, color: "#ef4444", data: riscosTrend.data },
      { title: "Inspeções Vencidas", val: inspTrend.val.toString(), stat: inspTrend.stat, statCol: "text-purple-400", bg: "border-purple-500/20 border-b-2 border-b-purple-500", icon: <FileText className="w-4 h-4 text-purple-400" />, color: "#a855f7", data: inspTrend.data },
      { title: "Ações Vencidas", val: acoesTrend.val.toString(), stat: acoesTrend.stat, statCol: "text-orange-400", bg: "border-orange-400/20", icon: <Activity className="w-4 h-4 text-orange-400" />, color: "#f97316", data: acoesTrend.data },
      { title: "Alertas Ativos", val: alertasTrend.val.toString(), stat: alertasTrend.stat, statCol: "text-emerald-400", bg: "border-yellow-400/20", icon: <Bell className="w-4 h-4 text-yellow-400" />, color: "#eab308", data: alertasTrend.data },
    ];
  }, [storeState]);
  
  const topActions = queue.slice(0, 3);

  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PriorityRowItem | null>(null);
  
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  
  const getRowStatus = (row: PriorityRowItem) => localStatuses[row.id] || row.status;

  const rows = queue.map(r => ({ ...r, status: getRowStatus(r) }));

  const handleOpenDetails = (item: PriorityRowItem) => {
    setSelectedItem({ ...item, status: getRowStatus(item) });
    setIsDrawerOpen(true);
  };

  const handleConcluir = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalStatuses(prev => ({ ...prev, [id]: 'Concluído' }));
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status: 'Concluído' } : null);
    }
    // Em um app real, chamaria useAppStore updateAction/updateRisk
  };

  const handleCobrar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Notificação de cobrança enviada ao responsável!');
  };

  const handleExecutar = () => {
    if (!selectedItem) return;
    setLocalStatuses(prev => ({ ...prev, [selectedItem.id]: 'Em andamento' }));
    setSelectedItem(prev => prev ? { ...prev, status: 'Em andamento' } : null);
  };

  const handleToggleChecklist = (idx: number) => {
    if (!selectedItem) return;
    const newChecklist = [...selectedItem.checklist];
    newChecklist[idx] = { ...newChecklist[idx], checked: !newChecklist[idx].checked };
    setSelectedItem({ ...selectedItem, checklist: newChecklist });
  };

  const todayStr = "20/05/2025 - 20/05/2025";
  const normativeDetection = selectedItem ? NormativeEngine.detect(`${selectedItem.title} ${selectedItem.reasons.join(' ')}`) : null;
  const riskDetection = normativeDetection ? RiskEngine.generateRiskFromActivity(`${selectedItem?.title} ${selectedItem?.reasons.join(' ')}`) : null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-white font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Central de Inteligência</h1>
              <p className="text-sm text-gray-400 mt-1">Decisões operacionais em tempo real para proteger pessoas e ativos.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                <Calendar className="w-4 h-4 text-gray-500" /> {todayStr}
              </button>
              <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                <Filter className="w-4 h-4" /> Filtros
              </button>
              <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <button 
                onClick={() => alert(`BRIEFING EXECUTIVO:\n\nSituação: ${currentDecision.title}\nDecisão: ${currentDecision.decision}\nImpacto: ${currentDecision.operationalImpact}\nPróximos Passos: ${currentDecision.nextSteps.join(', ')}`)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <FileText className="w-4 h-4" /> Gerar briefing
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6">
            
            {/* Top Recommended Action Banner */}
            <div className={`border rounded-2xl p-6 flex flex-col lg:flex-row items-stretch gap-6 relative overflow-hidden group shrink-0 ${
              currentDecision.title === 'Intervenção Crítica Necessária' 
                ? 'bg-gradient-to-r from-[#1e1b1d] to-[#121826] border-red-500/30' 
                : 'bg-gradient-to-r from-emerald-900/20 to-[#121826] border-emerald-500/30'
            }`}>
              <div className={`absolute inset-0 mix-blend-overlay ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'bg-red-500/5' : 'bg-emerald-500/5'}`}></div>
              
              <div className="flex-1 relative z-10 flex flex-col justify-center lg:border-r border-white/10 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0">
                <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'text-red-400' : 'text-emerald-400'}`}>
                  Decisão Recomendada Agora
                </h3>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2">{currentDecision.decision}</h2>
                <button 
                  onClick={() => setIsActionPlanModalOpen(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors w-fit ${
                    currentDecision.title === 'Intervenção Crítica Necessária' || currentDecision.operationalImpact === 'Crítico' || currentDecision.operationalImpact === 'Alto'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  Ver plano sugerido <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 relative z-10 flex flex-col justify-center px-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`w-4 h-4 ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'text-red-400' : 'text-emerald-400'}`} />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Motivo Principal</h3>
                </div>
                <p className="text-sm text-gray-300 font-medium leading-snug">{currentDecision.reason}</p>
              </div>

              <div className="w-[1px] bg-white/10 shrink-0 hidden lg:block mx-2"></div>

              <div className="flex-1 relative z-10 flex flex-col justify-center px-4">
                 <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Impacto Provável</h3>
                </div>
                <div className={`text-lg font-bold mb-2 leading-tight ${currentDecision.operationalImpact === 'Alto' ? 'text-red-400' : 'text-emerald-400'}`}>
                  Risco {currentDecision.operationalImpact} de passivo ou falhas operacionais
                </div>
              </div>

              <div className="w-[1px] bg-white/10 shrink-0 hidden lg:block mx-2"></div>

              <div className="flex-1 relative z-10 flex flex-col justify-center pl-4">
                 <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confiança</h3>
                </div>
                <div className="text-4xl font-bold text-emerald-400 mb-4 tracking-tight">{currentDecision.confidence}</div>
                <div className="h-[6px] w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: currentDecision.confidence }}></div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
               {kpis.map((card, i) => (
                  <div key={i} className={`bg-[#121826] border overflow-hidden p-5 rounded-xl flex flex-col relative group ${card.bg}`}>
                     <div className="flex items-center justify-between mb-4 z-10">
                        <div className="flex items-center gap-2">
                           {card.icon}
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</h3>
                        </div>
                     </div>
                     <div className="text-3xl font-bold text-white mb-1 z-10">{card.val}</div>
                     <div className={`text-xs font-medium z-10 ${card.statCol}`}>{card.stat}</div>
                     <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                        <Sparkline data={card.data} color={card.color} />
                     </div>
                  </div>
               ))}
            </div>

            {/* Middle Section: Timeline, Causa e Efeito, Proximas acoes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
               
               {/* Linha do tempo operacional */}
               <div className="lg:col-span-3 bg-[#121826] border border-white/5 rounded-xl p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                     <Clock className="w-4 h-4 text-gray-400" />
                     <h3 className="text-sm font-bold text-white">Linha do tempo e Evidências</h3>
                  </div>
                  <div className="flex-1 space-y-5 relative before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-white/5">
                     {currentDecision.evidences?.map((evidence: string, i: number) => (
                        <div key={i} className="relative pl-6 hover:bg-white/5 -ml-2 -mr-2 p-2 rounded-lg transition-colors cursor-pointer group">
                           <div className={`absolute left-[11px] top-[14px] w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`}></div>
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <p className={`text-[13px] font-bold mb-0.5 ${i === 0 ? 'text-red-400' : 'text-yellow-500'}`}>Evidência Registrada</p>
                                 <p className="text-[11px] text-gray-400 leading-snug">{evidence}</p>
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0 font-medium">{currentDecision.timeline}</span>
                           </div>
                        </div>
                     ))}
                  </div>
                  <button className="w-full mt-4 py-3 border-t border-white/5 text-[11px] font-medium text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
                     Ver toda a linha do tempo
                  </button>
               </div>

               {/* Causa e efeito diagram */}
               <div className="lg:col-span-4 bg-[#121826] border border-white/5 rounded-xl p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                     <Share2Icon className="w-4 h-4 text-gray-400" />
                     <h3 className="text-sm font-bold text-white">Causa e efeito</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-4 py-8">
                     
                     <div className="flex gap-4 mb-4 w-full justify-center">
                        {currentDecision.causeAndEffect?.causes?.map((cause: string, i: number) => (
                          <div key={i} className="px-3 py-3 bg-[#0b0f19] border border-white/5 rounded-xl text-center flex-1 max-w-[150px] shadow-lg flex flex-col items-center justify-center">
                             <div className="flex items-center justify-center gap-1.5 mb-1 text-gray-300">
                                <Activity className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-[11px] font-medium leading-tight line-clamp-2">{cause}</span>
                             </div>
                          </div>
                        ))}
                     </div>

                     <div className="relative w-full flex justify-center mb-6">
                        <svg width="100%" height="32" className="absolute top-[-20px] pointer-events-none">
                           <path d="M 120 0 Q 160 16 160 32 M 200 0 Q 160 16 160 32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                           <style dangerouslySetInnerHTML={{__html:`@keyframes dash { to { stroke-dashoffset: -100; } }`}} />
                        </svg>
                        <div className={`px-4 py-2.5 ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} border rounded-lg text-center flex items-center gap-2.5 z-10 w-full max-w-[220px] justify-center mt-2 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden`}>
                           <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'from-red-500/10' : 'from-emerald-500/10'} to-transparent`}></div>
                           <AlertTriangle className={`w-4 h-4 ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'text-red-500' : 'text-emerald-500'} relative z-10`} />
                           <span className={`text-xs font-bold ${currentDecision.title === 'Intervenção Crítica Necessária' ? 'text-red-400' : 'text-emerald-400'} relative z-10`}>{currentDecision.causeAndEffect?.effect || 'Operação Estável'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Próximas ações list */}
               <div className="lg:col-span-5 bg-[#121826] border border-white/5 rounded-xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Próximas ações</h3>
                     </div>
                     <a href="/acoes" className="text-[11px] font-medium text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        Abrir ações
                     </a>
                  </div>
                  <div className="flex-1 space-y-3">
                     {topActions.length === 0 ? (
                        <div className="p-4 bg-[#0b0f19] border border-white/5 rounded-xl flex items-center justify-center text-sm text-gray-400">
                           Nenhuma ação crítica no momento.
                        </div>
                     ) : topActions.map((action: PriorityRowItem) => (
                        <div key={action.id} className="p-4 bg-[#0b0f19] border border-white/5 rounded-xl flex items-center justify-between gap-4 hover:border-white/10 transition-colors cursor-pointer group" onClick={() => handleOpenDetails(action)}>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-bold text-white mb-1 truncate group-hover:text-purple-400 transition-colors" title={action.title}>{action.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                 <span>{action.origem}</span>
                                 <span>•</span>
                                 <span className="truncate">{action.resp}</span>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${
                                 action.prio === 'P1' || action.status === 'Urgente' || action.status === 'Atrasada' 
                                 ? 'text-red-400 border-red-500/30 bg-red-500/10' 
                                 : 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                              }`}>
                                 <AlertTriangle className="w-3 h-3" /> {action.prio}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); handleOpenDetails(action); }} className="text-[11px] font-medium text-gray-300 hover:text-white px-3 py-1 rounded bg-[#121826] border border-white/10 hover:bg-white/5 transition-colors">
                                 Abrir
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Fila de Prioridade Table */}
            <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col mt-6 shrink-0">
               <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Fila de prioridade</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                     <thead className="bg-[#0b0f19] border-b border-white/5">
                        <tr>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prio</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ação sugerida</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Origem</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prazo</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Próxima etapa</th>
                           <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">
                               Nenhuma prioridade registrada.
                            </td>
                          </tr>
                        )}
                        {rows.map((row) => {
                           const getStatusColor = (s: string) => {
                              switch (s) {
                                  case 'Urgente': return 'text-red-400 bg-red-500/10 border-red-500/20';
                                  case 'Alta': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
                                  case 'Média': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                                  case 'Monitorar': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                                  case 'Planejado': return 'text-gray-300 bg-white/5 border-white/10';
                                  case 'Concluído': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                                  case 'Em andamento': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                                  default: return 'text-gray-400 bg-white/5 border-white/10';
                              }
                           }
                           const getPrazoColor = (prio: string, s: string) => {
                              if (s === 'Concluído') return 'text-emerald-500';
                              if (prio === 'P1') return 'text-red-500';
                              if (prio === 'P2') return 'text-orange-500';
                              return 'text-blue-400';
                           }
                           return (
                           <tr key={row.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(row)}>
                              <td className="px-5 py-4 text-center">
                                 <span className={`text-[11px] font-bold px-2 py-1 rounded border flex items-center justify-center w-fit mx-auto gap-1 ${
                                    row.prio === 'P1' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                                    row.prio === 'P2' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                                    'text-blue-500 border-blue-500/30 bg-blue-500/10'
                                 }`}>
                                    {row.prio}
                                 </span>
                              </td>
                              <td className="px-5 py-4">
                                 <h3 className="text-[13px] font-semibold text-white group-hover:underline">{row.title}</h3>
                              </td>
                              <td className="px-5 py-4 text-[12px] text-gray-300">{row.origem}</td>
                              <td className="px-5 py-4 text-[12px] text-gray-300">{row.resp}</td>
                              <td className={`px-5 py-4 text-[12px] font-bold flex items-center gap-1.5 ${getPrazoColor(row.prio, row.status)}`}>
                                 <Clock className="w-3 h-3 text-gray-500" /> {row.status === 'Concluído' ? 'Concluído' : row.prazo}
                              </td>
                              <td className="px-5 py-4 text-center">
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${getStatusColor(row.status)}`}>
                                    {row.status}
                                 </span>
                              </td>
                              <td className="px-5 py-4 text-[12px] text-gray-300 truncate max-w-[150px]">{row.proc}</td>
                              <td className="px-5 py-4 w-[240px]">
                                 <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleOpenDetails(row)} className="px-3 py-1.5 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors border border-purple-500/50 focus:outline-none">
                                       Abrir
                                    </button>
                                    <button onClick={(e) => handleCobrar(e)} className="px-3 py-1.5 text-[11px] font-medium text-gray-300 bg-[#121826] hover:bg-white/10 hover:text-white rounded transition-colors border border-white/10 focus:outline-none">
                                       Cobrar
                                    </button>
                                    <button onClick={(e) => handleConcluir(row.id, e)} className="px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors border border-emerald-500/30 focus:outline-none">
                                       Concluir
                                    </button>
                                    <button className="p-1.5 text-gray-500 hover:text-white rounded transition-colors ml-1">
                                       <MoreVertical className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )})}
                     </tbody>
                  </table>
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* Recommended Action Drawer */}
      {/* Action Plan Modal */}
      <AnimatePresence>
        {isActionPlanModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#121826] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative"
            >
              <button 
                onClick={() => setIsActionPlanModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 text-2xl font-bold"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-bold text-white mb-2">Plano de Ação Automático</h2>
              <p className="text-sm text-gray-400 mb-6">Etapas recomendadas com base na inteligência central e estado atual do sistema.</p>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
                {currentDecision.nextSteps.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm text-gray-200 mt-1">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setIsActionPlanModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20 w-full sm:w-auto text-sm"
                >
                  Entendi e vou executar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDrawerOpen && selectedItem && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: 50 }} 
            animate={{ width: 420, opacity: 1, x: 0 }} 
            exit={{ width: 0, opacity: 0, x: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full bg-[#121826] border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col overflow-hidden"
          >
             <div className="w-[420px] h-full flex flex-col pt-safe-top overflow-y-auto">
               
               <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                  <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Recomendação Principal</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="px-6 mb-6 shrink-0">
                  <div className="flex items-start gap-3">
                     <div className={`mt-1 w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        selectedItem.prio === 'P1' ? 'bg-red-500/10 border-red-500/30' : 
                        selectedItem.prio === 'P2' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/30'
                     }`}>
                        <CheckCircle2 className={`w-5 h-5 ${
                           selectedItem.prio === 'P1' ? 'text-red-400' : 
                           selectedItem.prio === 'P2' ? 'text-orange-400' : 'text-blue-400'
                        }`} />
                     </div>
                     <h2 className="text-lg font-bold text-white leading-tight">{selectedItem.title}</h2>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
                  
                  {/* Por que agir agoraBox */}
                  <div>
                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Por que agir agora</h4>
                     <ul className="space-y-2 border-l-2 border-purple-500 pl-3">
                        {selectedItem.reasons.map((reason, idx) => (
                           <li key={idx} className="text-[13px] text-gray-300 leading-relaxed">
                              {reason}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {normativeDetection && (
                     <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3 mt-4">
                        <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                           <Shield className="w-3.5 h-3.5" /> Referência: {normativeDetection.nr}
                        </h4>
                        <div className="text-[12px] text-gray-300">
                           <span className="block mb-1"><strong>Risco Específico:</strong> {normativeDetection.riskType}</span>
                           <span className="block mb-1"><strong>Severidade:</strong> <span className={normativeDetection.severity === 'crítica' ? 'text-red-400' : 'text-orange-400'}>{normativeDetection.severity.toUpperCase()}</span></span>
                           {riskDetection && <span className="block mb-1"><strong>Nível de Risco:</strong> <span className={RiskEngine.getRiskColor(riskDetection.level)} style={{padding: '0.1rem 0.3rem', borderRadius: '4px'}}>{riskDetection.level.toUpperCase()}</span></span>}
                           <span className="block leading-snug"><strong>Recomendação Técnica:</strong> {normativeDetection.recommendedAction}</span>
                        </div>
                        {normativeDetection.ppe.length > 0 && (
                          <div className="mt-2 text-[11px] text-gray-400">
                            <strong>EPIs / Controle Sugeridos:</strong> {normativeDetection.ppe.join(', ')}
                          </div>
                        )}
                        {normativeDetection.documents && normativeDetection.documents.length > 0 && (
                          <div className="mt-1 text-[11px] text-gray-400">
                            <strong>Documentos Recomendados:</strong> {normativeDetection.documents.join(', ')}
                          </div>
                        )}
                        {(normativeDetection.severity === 'crítica' || normativeDetection.severity === 'alta') && (() => {
                          const estimate = EconomicImpactEngine.estimate({ 
                            severityLevel: normativeDetection.severity, 
                            exposedPeople: 2, 
                            recurrence: false 
                          });
                          return (
                            <div className="mt-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                 Economia Estimada (Ação Preventiva)
                               </h4>
                               <div className="text-red-400 font-bold text-xs mb-1">
                                 {EconomicImpactEngine.formatCurrency(estimate.min)} a {EconomicImpactEngine.formatCurrency(estimate.max)}
                               </div>
                               <div className="text-[9px] text-gray-500 italic">
                                 Estimativa preventiva. O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento.
                               </div>
                            </div>
                          );
                        })()}
                     </div>
                  )}

                  {/* Responsavel */}
                  <div>
                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Responsável</h4>
                     <div className="flex gap-3 items-center p-3 rounded-xl border border-white/5 bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center border border-white/10">
                           <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                           <p className="text-sm font-semibold text-white leading-tight">{selectedItem.resp}</p>
                           <p className="text-[11px] text-gray-500">{selectedItem.origem}</p>
                        </div>
                     </div>
                  </div>

                  {/* Prazo */}
                  <div>
                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Prazo Sugerido</h4>
                     <div className="flex gap-4 items-center p-4 rounded-xl border border-white/5 bg-[#0b0f19]">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                           <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-white">{selectedItem.prazoOriginal}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                 selectedItem.prio === 'P1' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                                 selectedItem.prio === 'P2' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                                 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                              }`}>{selectedItem.status}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Checklist Imediato */}
                  <div>
                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Checklist Imediato</h4>
                     <div className="space-y-2">
                        {selectedItem.checklist.map((item, idx) => (
                           <label key={idx} className="flex items-start gap-3 cursor-pointer group hover:bg-white/5 p-2.5 rounded-xl transition-colors border border-transparent hover:border-white/5 bg-white/5">
                              <div className="mt-0.5 relative shrink-0">
                                 <input type="checkbox" checked={item.checked} onChange={() => handleToggleChecklist(idx)} className="peer w-4 h-4 rounded border-gray-600 bg-transparent checked:bg-purple-500 checked:border-purple-500 focus:ring-offset-0 focus:ring-0 appearance-none transition-all cursor-pointer" />
                                 <CheckSquare className="absolute inset-0 w-4 h-4 pointer-events-none text-purple-500 opacity-0 peer-checked:opacity-100 peer-checked:text-white" />
                                 <div className="absolute inset-0 w-4 h-4 border border-gray-600 rounded peer-checked:border-purple-500 peer-checked:bg-purple-500 -z-10 bg-[#121826]"></div>
                              </div>
                              <span className="text-[13px] text-gray-300 group-hover:text-white leading-snug font-medium pt-0.5">{item.label}</span>
                           </label>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="p-6 border-t border-white/5 bg-[#0B0F19] flex flex-col gap-3 shrink-0">
                  <button onClick={handleExecutar} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-3.5 rounded-xl text-sm font-bold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50">
                     <PlayCircle className="w-5 h-5 flex-shrink-0" /> Executar agora
                  </button>
                  <button onClick={(e) => handleConcluir(selectedItem.id, e)} className="w-full flex items-center justify-center gap-2 bg-[#121826] hover:bg-white/10 text-emerald-400 border border-emerald-500/30 p-3.5 rounded-xl text-sm font-medium transition-colors">
                     <CheckCircle2 className="w-4 h-4" /> Marcar como concluído
                  </button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
