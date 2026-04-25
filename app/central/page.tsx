"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Filter, Bell, Sparkles, ArrowRight, TrendingUp, Target, ShieldCheck, Clock, AlertTriangle, ClipboardCheck, Activity, BrainCircuit, ArrowDown, ChevronRight, Check } from 'lucide-react';

// Tiny animated sparkline component
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

  return (
    <svg width="100%" height="100%" viewBox={`0 -5 ${width} ${height + 10}`} preserveAspectRatio="none" className="overflow-visible">
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function CentralPage() {
  const todayStr = "20/05/2025 - 20/05/2025";
  
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-6 gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Central de Inteligência</h1>
          <p className="text-sm text-gray-400 mt-1">Decisões orientadas por riscos, inspeções e ações em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#121826] border border-white/5 hover:bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-300 transition-colors">
            <Calendar className="w-4 h-4 text-gray-500" />
            {todayStr}
            <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
          </button>
          <button className="flex items-center gap-2 bg-[#121826] border border-white/5 hover:bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-300 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button className="relative bg-[#121826] border border-white/5 hover:bg-white/5 p-2 rounded-lg text-gray-300 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-[#0B0F19]">3</span>
          </button>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
            Gerar briefing
          </button>
        </div>
      </header>

      {/* Main Analysis Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#121826] border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row gap-8 relative overflow-hidden shrink-0"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
        
        {/* Radar Animation Left */}
        <div className="relative w-48 h-48 shrink-0 flex items-center justify-center mx-auto lg:mx-0">
           {/* Radar rings */}
           {[1, 2, 3].map((ring) => (
             <motion.div
                key={ring}
                className="absolute text-purple-600/20 border border-purple-600/20 rounded-full"
                style={{ width: `${ring * 33}%`, height: `${ring * 33}%` }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: ring * 0.4,
                  ease: "easeInOut"
                }}
             />
           ))}
           {/* Connecting Line (Crosshair) */}
           <div className="absolute w-full h-[1px] bg-purple-600/20 rotate-45" />
           <div className="absolute w-full h-[1px] bg-purple-600/20 -rotate-45" />
           
           {/* Scanning line */}
           <motion.div 
              className="absolute w-1/2 h-[1px] bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500 origin-left left-1/2 top-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           />

           {/* Center pulse with check */}
           <div className="relative z-10 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)]">
             <Check className="w-6 h-6 text-white" />
           </div>
        </div>

        {/* Content */}
        <div className="lg:w-[340px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
           <div className="flex items-center gap-2 mb-3">
             <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Recomendado</span>
           </div>
           <h2 className="text-2xl font-bold text-white mb-3">Decisão recomendada agora</h2>
           <p className="text-gray-400 text-sm leading-relaxed mb-6">
             Priorize inspeções críticas em manutenção e trate ações vencidas para reduzir riscos operacionais imediatos.
           </p>
           <div>
             <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2">
               Ver plano de ação <ArrowRight className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* 3 Metrics Right */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 items-start pt-2">
           <div>
             <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
               <TrendingUp className="w-5 h-5 text-blue-400" />
             </div>
             <h4 className="text-sm font-bold text-white mb-2">O que mudou</h4>
             <p className="text-[13px] text-gray-400 leading-relaxed">+27% em inspeções pendentes nas últimas 24h.</p>
           </div>
           <div>
             <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
               <Target className="w-5 h-5 text-purple-400" />
             </div>
             <h4 className="text-sm font-bold text-white mb-2">Impacto provável</h4>
             <p className="text-[13px] text-gray-400 leading-relaxed">Maior probabilidade de falhas e incidentes operacionais.</p>
           </div>
           <div>
             <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
               <ShieldCheck className="w-5 h-5 text-emerald-400" />
             </div>
             <h4 className="text-sm font-bold text-white mb-2">Confiança</h4>
             <p className="text-[13px] text-gray-400 leading-relaxed mb-3">Confiança alta na recomendação</p>
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-emerald-400">94%</span>
               <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
               </div>
             </div>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Timeline */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
           className="bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col"
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 text-white font-medium">
               <Clock className="w-4 h-4 text-purple-400" />
               Linha do tempo operacional
             </div>
             <button className="text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded hover:text-white transition-colors">
               Ver tudo
             </button>
           </div>
           <div className="flex-1 relative">
              <div className="absolute left-[62px] top-2 bottom-4 w-[1px] bg-white/10" />
              <div className="space-y-6 relative">
                 {/* Items */}
                 {[
                   { time: '09:42', title: 'Risco crítico identificado', desc: 'Esmagamento em prensa hidráulica', dot: 'bg-red-500', color: 'text-red-400', icon: <AlertTriangle className="w-3 h-3 text-red-500"/> },
                   { time: '09:15', title: 'Inspeção vencida', desc: 'Máquina Prensa 03 – vencida há 2 dias', dot: 'bg-orange-500', color: 'text-orange-400', icon: null },
                   { time: '08:47', title: 'Ação vencida', desc: 'Protetor de grade danificado – vencida desde 18/05', dot: 'bg-yellow-500', color: 'text-yellow-400', icon: null },
                   { time: '08:22', title: 'Alerta acionado', desc: 'EPIs fora do padrão – Setor de Manutenção', dot: 'bg-red-400', color: 'text-red-400', icon: <AlertTriangle className="w-3 h-3 text-red-500"/> },
                   { time: '07:31', title: 'SLA em risco', desc: 'Tratamento de risco crítico com prazo crítico', dot: 'bg-purple-500', color: 'text-purple-400', icon: null },
                 ].map((item, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                     key={i} className="flex gap-4 relative"
                   >
                      <div className="w-[42px] pt-1 text-right shrink-0">
                         <span className="text-xs text-gray-500">{item.time}</span>
                      </div>
                      <div className="relative pt-2 w-4 flex justify-center shrink-0">
                         <motion.div 
                           animate={i === 0 ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                           transition={i === 0 ? { repeat: Infinity, duration: 2 } : {}}
                           className={`w-2.5 h-2.5 rounded-full ${item.dot} ring-4 ring-[#121826] bg-clip-padding`} 
                         />
                      </div>
                      <div className="flex-1 pb-2">
                         <div className="flex items-center gap-1.5 mb-1.5">
                           {item.icon}
                           <span className={`text-sm font-medium ${item.color}`}>{item.title}</span>
                         </div>
                         <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
         </motion.div>

         {/* Cause and effect */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden"
         >
           <div className="w-full flex items-center justify-between mb-8 z-10">
             <div className="flex items-center gap-2 text-white font-medium">
               <BrainCircuit className="w-4 h-4 text-blue-400" />
               Causa e efeito
             </div>
           </div>
           
           {/* Flow diagram */}
           <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="flex gap-4 w-full justify-center">
                <motion.div 
                  initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                  className="bg-black/30 border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-lg"
                >
                  <ClipboardCheck className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-medium text-gray-300">Inspeções<br/>pendentes</span>
                </motion.div>
                <motion.div 
                  initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                  className="bg-black/30 border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-lg"
                >
                  <Activity className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-medium text-gray-300">Ações<br/>vencidas</span>
                </motion.div>
              </div>
              
              {/* Animated arrows going down to center */}
              <div className="relative w-full h-8 flex justify-center text-center">
                 <svg className="absolute w-[60%] h-12 -top-2" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M 10 0 C 10 50, 40 50, 50 100" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                    <path d="M 90 0 C 90 50, 60 50, 50 100" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                    <circle cx="50" cy="100" r="3" fill="#a855f7" />
                 </svg>
                 <style dangerouslySetInnerHTML={{__html:`@keyframes dash { to { stroke-dashoffset: -100; } }`}} />
              </div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative"
              >
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <span className="text-xs font-medium text-red-400">Riscos críticos<br/>elevados</span>
                
                {/* Ping effect */}
                <span className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 rounded-full" />
              </motion.div>

              <div className="relative h-6 flex items-center justify-center">
                 <ArrowDown className="w-4 h-4 text-purple-500 animate-bounce" />
              </div>

              <motion.div 
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}
                className="bg-black/30 border border-white/10 p-4 rounded-xl flex items-center gap-3"
              >
                <ShieldCheck className="w-6 h-6 text-gray-400" />
                <span className="text-xs font-medium text-gray-300">Maior probabilidade<br/>de incidentes</span>
              </motion.div>
           </div>
         </motion.div>

         {/* Próximas ações */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col"
         >
            <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 text-white font-medium">
               <Activity className="w-4 h-4 text-purple-400" />
               Próximas ações
             </div>
             <button className="text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded hover:text-white transition-colors">
               Ver todas
             </button>
           </div>
           
           <div className="flex-1 flex flex-col gap-3">
              <div className="bg-black/20 border-l-[3px] border-l-red-500 border border-white/5 p-4 rounded-lg flex flex-col gap-3 group hover:bg-white/5 transition-colors">
                 <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">Priorizar inspeções críticas em manutenção</h4>
                      <p className="text-xs text-gray-500 mt-1">Falhas de verificação aumentam probabilidade de incidentes.</p>
                    </div>
                    <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alta</span>
                 </div>
                 <button className="w-full flex items-center justify-between bg-[#121826] border border-white/5 p-2 rounded text-xs text-gray-300 hover:text-white transition-colors">
                    Abrir inspeções <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

              <div className="bg-black/20 border-l-[3px] border-l-orange-500 border border-white/5 p-4 rounded-lg flex flex-col gap-3 group hover:bg-white/5 transition-colors">
                 <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">Tratar ações corretivas vencidas</h4>
                      <p className="text-xs text-gray-500 mt-1">Ações vencidas em máquinas e EPIs elevam riscos operacionais.</p>
                    </div>
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alta</span>
                 </div>
                 <button className="w-full flex items-center justify-between bg-[#121826] border border-white/5 p-2 rounded text-xs text-gray-300 hover:text-white transition-colors">
                    Abrir ações <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

              <div className="bg-black/20 border-l-[3px] border-l-yellow-500 border border-white/5 p-4 rounded-lg flex flex-col gap-3 group hover:bg-white/5 transition-colors">
                 <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">Reforçar uso e conformidade de EPIs</h4>
                      <p className="text-xs text-gray-500 mt-1">Alertas de EPI fora do padrão em setores críticos.</p>
                    </div>
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Média</span>
                 </div>
                 <button className="w-full flex items-center justify-between bg-[#121826] border border-white/5 p-2 rounded text-xs text-gray-300 hover:text-white transition-colors">
                    Ver detalhes <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>
         </motion.div>
      </div>

      {/* Sparkline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          {[
            { title: "Riscos críticos", val: "14", stat: "Ativos", color: "#f43f5e", bg: "bg-red-500/10 border-red-500/20", icon: <AlertTriangle className="w-6 h-6 text-red-500" />, data: [12, 11, 14, 13, 15, 14, 16, 14] },
            { title: "Inspeções pendentes", val: "37", stat: "+18% vs ontem", statCol: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: <ClipboardCheck className="w-6 h-6 text-purple-400" />, color: "#a855f7", data: [20, 24, 23, 28, 30, 32, 29, 37] },
            { title: "Ações vencidas", val: "28", stat: "+12% vs ontem", statCol: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: <Activity className="w-6 h-6 text-orange-400" />, color: "#f97316", data: [28, 25, 24, 25, 27, 26, 25, 28] },
            { title: "Alertas ativos", val: "6", stat: "Estáveis", statCol: "text-gray-500", bg: "bg-yellow-500/10 border-yellow-500/20", icon: <Bell className="w-6 h-6 text-yellow-400" />, color: "#eab308", data: [5, 6, 7, 6, 5, 6, 6, 6] },
          ].map((card, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.1) }}
               className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col justify-between"
             >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${card.bg}`}>
                     {card.icon}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</h4>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-bold text-white">{card.val}</span>
                       <span className={`text-xs ${card.statCol || 'text-gray-500'}`}>{card.stat}</span>
                    </div>
                  </div>
                </div>
                <div className="h-10 w-full relative -mx-2 opacity-80">
                   <Sparkline data={card.data} color={card.color} />
                </div>
             </motion.div>
          ))}
      </div>
    </div>
  );
}
