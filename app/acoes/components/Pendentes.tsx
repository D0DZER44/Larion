"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ActionItem } from '../types';
import { ClipboardList, AlertTriangle, CalendarDays, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  'Crítica': 'text-red-500 border-red-500/30',
  'Alta': 'text-orange-500 border-orange-500/30',
  'Média': 'text-yellow-500 border-yellow-500/30',
  'Baixa': 'text-emerald-500 border-emerald-500/30',
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(n => n.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function getPrazoClass(prazoStr: string, status: string) {
  if (!prazoStr) return 'text-gray-300';
  const parts = prazoStr.includes('/') ? prazoStr.split('/') : prazoStr.split('-');
  const dateStr = parts.length === 3 && parts[0].length === 2 ? `${parts[2]}-${parts[1]}-${parts[0]}` : prazoStr;
  const d = new Date(dateStr);
  const now = new Date();
  if (isNaN(d.getTime())) return 'text-gray-300';

  d.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (status === 'Vencida' || diffDays < 0) return 'text-red-500 font-medium';
  if (diffDays === 0) return 'text-orange-400 font-medium';
  return 'text-gray-300';
}

function getPrazoInfo(prazoStr: string) {
  if (!prazoStr) return { diffDays: null };
  const parts = prazoStr.includes('/') ? prazoStr.split('/') : prazoStr.split('-');
  const dateStr = parts.length === 3 && parts[0].length === 2 ? `${parts[2]}-${parts[1]}-${parts[0]}` : prazoStr;
  const d = new Date(dateStr);
  const now = new Date();
  if (isNaN(d.getTime())) return { diffDays: null };
  d.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  const diffTime = d.getTime() - now.getTime();
  return { diffDays: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
}

import { getPendentes } from '../hooks';

export default function Pendentes({ acoes, onOpen }: { acoes: ActionItem[], onOpen: (a: ActionItem) => void }) {
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const [filterPrazo, setFilterPrazo] = useState<string>('Todos');

  const { pendentesList, stats } = useMemo(() => {
     let filtered = getPendentes(acoes);
     
     // Calculate stats based on the subset of just pendentes/vencidas
     const pendentesTotais = filtered.length;
     const criticasPendentes = filtered.filter(a => a.prioridade === 'Crítica').length;
     
     let vencemHojeCount = 0;
     let estaSemanaCount = 0;

     filtered.forEach(a => {
        const { diffDays } = getPrazoInfo(a.prazo);
        if (diffDays === 0) vencemHojeCount++;
        if (diffDays !== null && diffDays >= 0 && diffDays <= 7) estaSemanaCount++;
     });

     // Apply UI filters
     if (filterPriority !== 'Todos') {
        if (filterPriority === 'Exige atenção') {
           filtered = filtered.filter(a => a.status === 'Vencida' || a.followUp?.precisaFollowUp || a.followUp?.escalado || a.followUp?.nivel === 'bloqueada' || ((a.prioridade === 'Crítica' || a.prioridade === 'Alta') && getPrazoInfo(a.prazo).diffDays === 0));
        } else {
           filtered = filtered.filter(a => a.prioridade === filterPriority);
        }
     }
     if (filterPrazo === 'Hoje') {
        filtered = filtered.filter(a => getPrazoInfo(a.prazo).diffDays === 0);
     } else if (filterPrazo === 'Esta semana') {
        filtered = filtered.filter(a => {
           const d = getPrazoInfo(a.prazo).diffDays;
           return d !== null && d >= 0 && d <= 7;
        });
     }

     const sorted = filtered.sort((a,b) => {
        if (a.status === 'Vencida' && b.status !== 'Vencida') return -1;
        if (a.status !== 'Vencida' && b.status === 'Vencida') return 1;
        
        const prioMap: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        const pA = prioMap[a.prioridade] || 0;
        const pB = prioMap[b.prioridade] || 0;
        if (pA !== pB) return pB - pA;
        
        const dA = getPrazoInfo(a.prazo).diffDays ?? Infinity;
        const dB = getPrazoInfo(b.prazo).diffDays ?? Infinity;
        return dA - dB;
     });

     return { 
        pendentesList: sorted, 
        stats: { pendentesTotais, criticasPendentes, vencemHojeCount, estaSemanaCount } 
     };
  }, [acoes, filterPriority, filterPrazo]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      
      {/* 1. Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                 <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-300">Pendentes totais</h3>
           </div>
           <div className="text-[32px] leading-tight font-bold text-white mt-1">{stats.pendentesTotais}</div>
        </div>

        <div className="bg-[#1e1318] border border-red-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-300">Críticas pendentes</h3>
           </div>
           <div className="text-[32px] leading-tight font-bold text-white mt-1">{stats.criticasPendentes}</div>
        </div>

        <div className="bg-[#1a1512] border border-orange-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                 <CalendarClock className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-300">Vencem hoje</h3>
           </div>
           <div className="text-[32px] leading-tight font-bold text-white mt-1">{stats.vencemHojeCount}</div>
        </div>

        <div className="bg-[#121826] border border-blue-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <CalendarDays className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-300">Esta semana</h3>
           </div>
           <div className="text-[32px] leading-tight font-bold text-white mt-1">{stats.estaSemanaCount}</div>
        </div>
      </div>

      {/* 2. Filtros */}
      <div className="flex flex-wrap items-center gap-6 bg-[#121826] border border-white/5 p-4 rounded-[12px]">
         <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-gray-400">Prioridade:</span>
            <div className="flex gap-2">
               {['Todos', 'Crítica', 'Alta', 'Média', 'Baixa', 'Exige atenção'].map(p => (
                  <button 
                     key={p} 
                     onClick={() => setFilterPriority(p)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPriority === p ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                     {p}
                  </button>
               ))}
            </div>
         </div>
         <div className="w-px h-6 bg-white/10 hidden md:block"></div>
         <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-gray-400">Prazo:</span>
            <div className="flex gap-2">
               {['Todos', 'Hoje', 'Esta semana'].map(p => (
                  <button 
                     key={p} 
                     onClick={() => setFilterPrazo(p)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPrazo === p ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                     {p}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* 3. Tabela Principal */}
      <div className="bg-[#121826] rounded-[12px] border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
           <h2 className="text-[15px] font-medium text-white">Fila de ações pendentes</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
           <thead className="bg-[#0c1018]">
              <tr>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prioridade</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Ação</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Risco vinculado</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Setor</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Responsável</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prazo</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {pendentesList.map(acao => {
                 const rInitials = getInitials(acao.responsavel);
                 const avatarColors = [
                    'bg-purple-500/20 text-purple-400', 'bg-blue-500/20 text-blue-400', 
                    'bg-emerald-500/20 text-emerald-400', 'bg-orange-500/20 text-orange-400',
                    'bg-indigo-500/20 text-indigo-400', 'bg-pink-500/20 text-pink-400'
                 ];
                 const charCode = (acao.responsavel || "").charCodeAt(0) || 0;
                 const avatarColor = avatarColors[charCode % avatarColors.length];

                 return (
                    <tr key={acao.id} onClick={() => onOpen(acao)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                       <td className="px-5 py-4 w-28">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border bg-transparent ${PRIORITY_COLORS[acao.prioridade] || PRIORITY_COLORS['Baixa']}`}>
                             {acao.prioridade}
                          </span>
                       </td>
                       <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                             <h3 className="text-[13px] text-gray-300 group-hover:text-white transition-colors">{acao.titulo}</h3>
                             <div className="flex items-center gap-2 flex-wrap">
                               {acao.followUp?.precisaFollowUp && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Precisa follow-up</span>}
                               {acao.followUp?.nivel === 'atenção' && <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Vence hoje</span>}
                               {acao.status === 'Vencida' && <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Vencida</span>}
                               {acao.followUp?.escalado && <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded">Escalonada</span>}
                               {(!acao.responsavel || acao.responsavel === 'Não definido' || acao.responsavel.toLowerCase().includes('não informad')) && <span className="text-[9px] bg-gray-500/10 text-gray-400 border border-gray-500/20 px-1.5 py-0.5 rounded">Sem responsável</span>}
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-48">
                          <span className="text-[13px] text-gray-300 truncate max-w-[150px] inline-block">{acao.riscoVinculado || '-'}</span>
                       </td>
                       <td className="px-5 py-4 w-36">
                          <span className="text-[13px] text-gray-300 truncate max-w-[120px] inline-block">{acao.setor || '-'}</span>
                       </td>
                       <td className="px-5 py-4 w-44">
                          <div className="flex items-center gap-2.5">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor}`}>
                                {rInitials}
                             </div>
                             <span className="text-[13px] text-gray-300 truncate max-w-[120px]">{acao.responsavel}</span>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <span className={`text-[13px] ${getPrazoClass(acao.prazo, acao.status)}`}>{acao.prazo}</span>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center justify-center w-fit ${
                             acao.status === 'Vencida' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                             'text-orange-400 border-orange-500/30 bg-orange-500/10'
                          }`}>
                             {acao.status}
                          </span>
                       </td>
                    </tr>
                 );
              })}
              {pendentesList.length === 0 && (
                 <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">Nenhuma ação encontrada com os filtros selecionados.</td>
                 </tr>
              )}
           </tbody>
        </table>
        </div>
        
        {/* Footer Pagination */}
        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between text-sm w-full bg-[#121826]">
           <span className="text-gray-500">Mostrando 1 a {pendentesList.length > 10 ? 10 : pendentesList.length} de {pendentesList.length} ações</span>
           <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:bg-white/5 transition-colors" disabled>
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-medium">
                 1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:bg-white/5 transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
