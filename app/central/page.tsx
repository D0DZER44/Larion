"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  Filter, Calendar, X, Activity, PlayCircle, MoreVertical,
  Clock, CheckSquare, Shield, AlertCircle, ChevronRight, User
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
};

const initialRows: PriorityRowItem[] = [
  { 
    id: '1', prio: 'P1', title: 'Priorizar inspeções críticas em manutenção', origem: 'Inspeções', resp: 'Supervisor + SST', prazo: 'Hoje 14h', prazoOriginal: 'Hoje 14h', status: 'Urgente', proc: 'Abrir inspeções pendentes',
    reasons: ['Aumento de +27% nas inspeções pendentes nas últimas 24h.', 'Risco elevado de falhas em máquinas críticas.'],
    checklist: [
      { label: 'Abrir inspeções pendentes críticas', checked: true },
      { label: 'Verificar ativos de maior risco', checked: false },
      { label: 'Designar responsáveis', checked: false },
      { label: 'Concluir e registrar evidências', checked: false }
    ]
  },
  { 
    id: '2', prio: 'P1', title: 'Tratar ações corretivas vencidas', origem: 'Ações', resp: 'Manutenção', prazo: 'Hoje 16h', prazoOriginal: 'Hoje 16h', status: 'Alta', proc: 'Validar responsáveis',
    reasons: ['Várias ações preventivas com prazo estourado.', 'Maior risco de autuações do MTE.'],
    checklist: [
      { label: 'Levantar todas ações vencidas de manutenção', checked: false },
      { label: 'Reatribuir prazos críticos', checked: false },
    ]
  },
  { 
    id: '3', prio: 'P2', title: 'Reforçar uso e conformidade de EPIs', origem: 'Riscos', resp: 'Segurança', prazo: 'Amanhã 10h', prazoOriginal: 'Amanhã 10h', status: 'Média', proc: 'Ver detalhes',
    reasons: ['Incidentes recentes reportados sem EPI adequado.', 'Necessidade de DDS (Diálogo Diário de Segurança).'],
    checklist: [
      { label: 'Preparar material para o DDS', checked: false },
      { label: 'Revisar estoque de EPIs críticos', checked: false },
    ]
  },
  { 
    id: '4', prio: 'P2', title: 'Revisar alerta de prensa hidráulica', origem: 'Alertas', resp: 'Técnico SST', prazo: 'Amanhã 15h', prazoOriginal: 'Amanhã 15h', status: 'Monitorar', proc: 'Confirmar evidência',
    reasons: ['Alerta automático gerado pelo sistema de IoT.', 'Possível falha do bloco de segurança.'],
    checklist: [
      { label: 'Solicitar parada da máquina', checked: false },
      { label: 'Validar logs do equipamento', checked: false },
    ]
  },
  { 
    id: '5', prio: 'P3', title: 'Atualizar plano de inspeções mensais', origem: 'Inspeções', resp: 'Supervisor + SST', prazo: '22/05 09h', prazoOriginal: '22/05 09h', status: 'Planejado', proc: 'Revisar cronograma',
    reasons: ['Planejamento mensal pendente de aprovação.'],
    checklist: [
      { label: 'Revisar calendário atual', checked: false },
      { label: 'Agendar reunião estratégica', checked: false },
    ]
  },
];

// Sparkline component 
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
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
  const [rows, setRows] = useState<PriorityRowItem[]>(initialRows);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PriorityRowItem | null>(null);

  const handleOpenDetails = (item: PriorityRowItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleConcluir = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRows(prev => prev.map(item => item.id === id ? { ...item, status: 'Concluído' } : item));
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status: 'Concluído' } : null);
    }
  };

  const handleCobrar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Notificação de cobrança enviada ao responsável!');
  };

  const handleExecutar = () => {
    if (!selectedItem) return;
    const updated = { ...selectedItem, status: 'Em andamento' };
    setSelectedItem(updated);
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleToggleChecklist = (idx: number) => {
    if (!selectedItem) return;
    const newChecklist = [...selectedItem.checklist];
    newChecklist[idx] = { ...newChecklist[idx], checked: !newChecklist[idx].checked };
    const updatedItem = { ...selectedItem, checklist: newChecklist };
    setSelectedItem(updatedItem);
    setRows(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
  };

  const todayStr = "20/05/2025 - 20/05/2025";

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
              <button className="relative p-2 bg-[#121826] hover:bg-white/5 text-gray-300 rounded-lg transition-colors border border-white/10">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
                <FileText className="w-4 h-4" /> Gerar briefing
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6">
            
            {/* Top Recommended Action Banner */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#121826] border border-purple-500/30 rounded-2xl p-6 flex flex-col lg:flex-row items-stretch gap-6 relative overflow-hidden group shrink-0">
              <div className="absolute inset-0 bg-purple-500/5 mix-blend-overlay"></div>
              
              <div className="flex-1 relative z-10 flex flex-col justify-center lg:border-r border-white/10 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Decisão Recomendada Agora</h3>
                <h2 className="text-3xl font-bold text-white mb-6">Priorizar inspeções críticas na manutenção</h2>
                <button 
                  onClick={() => handleOpenDetails(rows[0])}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors w-fit shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                >
                  Ver plano de ação <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 relative z-10 flex flex-col justify-center px-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Motivo</h3>
                </div>
                <div className="text-4xl font-bold text-purple-400 mb-1">+27%</div>
                <p className="text-xs text-gray-400 font-medium leading-snug">em inspeções pendentes<br/>nas últimas 24h</p>
              </div>

              <div className="w-[1px] bg-white/10 shrink-0 hidden lg:block mx-2"></div>

              <div className="flex-1 relative z-10 flex flex-col justify-center px-4">
                 <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Impacto Provável</h3>
                </div>
                <div className="text-xl font-bold text-white mb-2 leading-tight">Maior probabilidade<br/>de falhas e incidentes</div>
              </div>

              <div className="w-[1px] bg-white/10 shrink-0 hidden lg:block mx-2"></div>

              <div className="flex-1 relative z-10 flex flex-col justify-center pl-4">
                 <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confiança</h3>
                </div>
                <div className="text-4xl font-bold text-emerald-400 mb-4 tracking-tight">94%</div>
                <div className="h-[6px] w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
               {[
                 { title: "Riscos Críticos", val: "14", stat: "+12% vs ontem", statCol: "text-red-400", bg: "border-red-500/20", icon: <AlertTriangle className="w-4 h-4 text-red-500" />, color: "#ef4444", data: [12, 11, 14, 13, 15, 14, 16, 14] },
                 { title: "Inspeções Vencidas", val: "37", stat: "+18% vs ontem", statCol: "text-purple-400", bg: "border-purple-500/20 border-b-2 border-b-purple-500", icon: <FileText className="w-4 h-4 text-purple-400" />, color: "#a855f7", data: [20, 24, 23, 28, 30, 32, 29, 37] },
                 { title: "Ações Vencidas", val: "28", stat: "+12% vs ontem", statCol: "text-orange-400", bg: "border-orange-400/20", icon: <Activity className="w-4 h-4 text-orange-400" />, color: "#f97316", data: [28, 25, 24, 25, 27, 26, 25, 28] },
                 { title: "Alertas Ativos", val: "6", stat: "-14% vs ontem", statCol: "text-emerald-400", bg: "border-yellow-400/20", icon: <Bell className="w-4 h-4 text-yellow-400" />, color: "#eab308", data: [8, 9, 7, 8, 6, 8, 7, 6] },
               ].map((card, i) => (
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
                     <h3 className="text-sm font-bold text-white">Linha do tempo operacional</h3>
                  </div>
                  <div className="flex-1 space-y-5 relative before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-white/5">
                     {[
                        { time: '09:42', title: 'Risco crítico identificado', desc: 'Esmagamento em prensa hidráulica', dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]', color: 'text-red-400' },
                        { time: '09:15', title: 'Inspeção vencida', desc: 'Máquina Prensa 03 - vencida há 2 dias', dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]', color: 'text-yellow-500' },
                        { time: '08:47', title: 'Ação vencida', desc: 'Protetor de grade danificado - vencida desde 18/05', dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]', color: 'text-yellow-500' },
                        { time: '07:31', title: 'SLA em risco', desc: 'Tratamento de risco crítico com prazo crítico', dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]', color: 'text-purple-400' },
                     ].map((item, i) => (
                        <div key={i} className="relative pl-6 hover:bg-white/5 -ml-2 -mr-2 p-2 rounded-lg transition-colors cursor-pointer group">
                           <div className={`absolute left-[11px] top-[14px] w-2 h-2 rounded-full ${item.dot}`}></div>
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <p className={`text-[13px] font-bold mb-0.5 ${item.color}`}>{item.title}</p>
                                 <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0 font-medium">{item.time}</span>
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
                        <div className="px-3 py-3 bg-[#0b0f19] border border-white/5 rounded-xl text-center flex-1 max-w-[150px] shadow-lg">
                           <div className="flex items-center justify-center gap-1.5 mb-1 text-gray-300">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-[11px] font-medium leading-tight">Inspeções pendentes</span>
                           </div>
                           <div className="text-xl font-bold text-white">37</div>
                        </div>
                        <div className="px-3 py-3 bg-[#0b0f19] border border-white/5 rounded-xl text-center flex-1 max-w-[150px] shadow-lg">
                           <div className="flex items-center justify-center gap-1.5 mb-1 text-gray-300">
                              <Activity className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-[11px] font-medium leading-tight">Ações vencidas</span>
                           </div>
                           <div className="text-xl font-bold text-white">28</div>
                        </div>
                     </div>

                     <div className="relative w-full flex justify-center mb-6">
                        <svg width="100%" height="32" className="absolute top-[-20px] pointer-events-none">
                           <path d="M 120 0 Q 160 16 160 32 M 200 0 Q 160 16 160 32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                           <style dangerouslySetInnerHTML={{__html:`@keyframes dash { to { stroke-dashoffset: -100; } }`}} />
                        </svg>
                        <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-center flex items-center gap-2.5 z-10 w-full max-w-[220px] justify-center mt-2 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden">
                           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-500/10 to-transparent"></div>
                           <AlertTriangle className="w-4 h-4 text-red-500 relative z-10" />
                           <span className="text-xs font-bold text-red-400 relative z-10">Riscos críticos elevados</span>
                        </div>
                     </div>

                     <div className="flex justify-center mt-2">
                        <svg width="2" height="24" className="text-white/10">
                           <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
                           <polygon points="1,24 5,16 -3,16" fill="currentColor" />
                        </svg>
                     </div>

                     <div className="mt-1 px-5 py-3 bg-[#0b0f19] border border-white/5 rounded-xl text-center flex items-center gap-2.5 w-full max-w-[220px] justify-center shadow-lg">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-[12px] font-semibold text-gray-200">Maior probabilidade<br/>de incidentes</span>
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
                     <button className="text-[11px] font-medium text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        Ver todas
                     </button>
                  </div>
                  <div className="flex-1 space-y-3">
                     {[
                        { title: 'Priorizar inspeções críticas em manutenção', desc: 'Falhas de verificação aumentam probabilidade de incidentes.', prio: 'Alta', prioColor: 'text-red-400 border-red-500/30 bg-red-500/10' },
                        { title: 'Tratar ações corretivas vencidas', desc: 'Ações vencidas em máquinas e EPIs elevam riscos operacionais.', prio: 'Alta', prioColor: 'text-red-400 border-red-500/30 bg-red-500/10' },
                        { title: 'Reforçar uso e conformidade de EPIs', desc: 'Alertas de EPI fora do padrão em setores críticos.', prio: 'Média', prioColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10' }
                     ].map((a, i) => (
                        <div key={i} className="p-4 bg-[#0b0f19] border border-white/5 rounded-xl flex items-center justify-between gap-4 hover:border-white/10 transition-colors cursor-pointer group" onClick={() => handleOpenDetails(rows[i])}>
                           <div className="flex-1">
                              <h4 className="text-[13px] font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{a.title}</h4>
                              <p className="text-[11px] text-gray-400 line-clamp-1">{a.desc}</p>
                           </div>
                           <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${a.prioColor}`}>
                                 <AlertTriangle className="w-3 h-3" /> {a.prio}
                              </span>
                              <button className="text-[11px] font-medium text-gray-300 hover:text-white px-3 py-1 rounded bg-[#121826] border border-white/10 hover:bg-white/5 transition-colors">
                                 Abrir ação
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
                                    <button onClick={(e) => handleCobrar(row.id, e)} className="px-3 py-1.5 text-[11px] font-medium text-gray-300 bg-[#121826] hover:bg-white/10 hover:text-white rounded transition-colors border border-white/10 focus:outline-none">
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
