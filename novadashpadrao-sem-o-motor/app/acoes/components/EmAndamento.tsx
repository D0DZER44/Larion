"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ActionItem } from '../types';
import { Play, AlertTriangle, Clock, Activity, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const PRIORITY_COLORS: Record<string, string> = {
  'Crítica': 'text-red-500 border-red-500/30 bg-red-500/10',
  'Alta': 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  'Média': 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  'Baixa': 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(n => n.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function getPrazoInfo(prazoStr: string) {
  if (!prazoStr || typeof prazoStr !== 'string') return { diffDays: null, label: '' };
  const parts = prazoStr.includes('/') ? prazoStr.split('/') : prazoStr.split('-');
  const dateStr = parts.length === 3 && parts[0].length === 2 ? `${parts[2]}-${parts[1]}-${parts[0]}` : prazoStr;
  const d = new Date(dateStr);
  const now = new Date();
  if (isNaN(d.getTime())) return { diffDays: null, label: '' };
  d.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { diffDays, label: `Vencida há ${Math.abs(diffDays)} dias` };
  if (diffDays === 0) return { diffDays, label: 'Vence hoje' };
  return { diffDays, label: `${diffDays} dias restantes` };
}

import { getEmAndamento } from '../hooks';

export default function EmAndamento({ acoes, onOpen }: { acoes: ActionItem[], onOpen: (a: ActionItem) => void }) {
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const [filterSetor, setFilterSetor] = useState<string>('Todos');
  const rulePackages = useAppStore(state => state.rulePackages);
  const activePackageNames = useMemo(() => rulePackages.filter(p => p.isActive).map(p => p.name), [rulePackages]);

  const { list, stats } = useMemo(() => {
     let emAndamentoList = getEmAndamento(acoes);
     
     const totais = emAndamentoList.length;
     const criticas = emAndamentoList.filter(a => a.prioridade === 'Crítica').length;
     const responsaveisAtivos = new Set(emAndamentoList.map(a => a.responsavel)).size;
     
     let somaProgresso = 0;
     let somaDiasRestantes = 0;
     let qtdPrazos = 0;

     emAndamentoList.forEach(a => {
        somaProgresso += (a.progresso || 0);
        const { diffDays } = getPrazoInfo(a.prazo);
        if (diffDays !== null) {
           somaDiasRestantes += diffDays;
           qtdPrazos++;
        }
     });

     const progressoMedio = totais > 0 ? Math.round(somaProgresso / totais) : 0;
     const prazoMedio = qtdPrazos > 0 ? (somaDiasRestantes / qtdPrazos).toFixed(1) : 0;
     const percentualCriticas = totais > 0 ? Math.round((criticas / totais) * 100) : 0;

     if (filterPriority !== 'Todos') {
        if (filterPriority === 'Exige atenção') {
           emAndamentoList = emAndamentoList.filter(a => a.status === 'Vencida' || a.followUp?.precisaFollowUp || a.followUp?.escalado || a.followUp?.nivel === 'bloqueada' || ((a.prioridade === 'Crítica' || a.prioridade === 'Alta') && getPrazoInfo(a.prazo).diffDays === 0));
        } else {
           emAndamentoList = emAndamentoList.filter(a => a.prioridade === filterPriority);
        }
     }
     if (filterSetor !== 'Todos') {
        emAndamentoList = emAndamentoList.filter(a => a.setor === filterSetor);
     }

     const sorted = emAndamentoList.sort((a,b) => {
        const prioMap: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        const pA = prioMap[a.prioridade] || 0;
        const pB = prioMap[b.prioridade] || 0;
        if (pA !== pB) return pB - pA;
        
        const dA = getPrazoInfo(a.prazo).diffDays ?? Infinity;
        const dB = getPrazoInfo(b.prazo).diffDays ?? Infinity;
        if (dA !== dB) return dA - dB;
        
        return (a.progresso || 0) - (b.progresso || 0);
     });

     return {
        list: sorted,
        stats: { totais, criticas, responsaveisAtivos, progressoMedio, prazoMedio, percentualCriticas }
     };
  }, [acoes, filterPriority, filterSetor]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      
      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                 <Play className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Em andamento</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              {stats.totais}
              <div className="text-[12px] text-blue-400 font-normal">{stats.responsaveisAtivos} responsáveis ativos</div>
           </div>
        </div>

        <div className="bg-[#1a1315] border border-red-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Críticas em execução</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              {stats.criticas}
              <div className="text-[12px] text-red-500 font-normal">{stats.percentualCriticas}% do total em andamento</div>
           </div>
        </div>

        <div className="bg-[#1a1713] border border-orange-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center">
                 <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Prazo médio restante</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              <div className="flex items-baseline gap-1">{stats.prazoMedio} <span className="text-[16px] font-normal text-gray-400">dias</span></div>
              <div className="text-[12px] text-emerald-400 font-normal">-0,4 dia vs semana passada</div>
           </div>
        </div>

        <div className="bg-[#131a16] border border-emerald-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center relative">
                 <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Progresso médio</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              <div className="flex items-baseline gap-1">{stats.progressoMedio}<span className="text-[20px] font-medium text-gray-400">%</span></div>
              <div className="text-[12px] text-emerald-400 font-normal">↑ 8 p.p. vs semana passada</div>
           </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-6 bg-[#121826] border border-white/5 p-4 rounded-[12px]">
         <div className="flex items-center gap-2">
            {['Todos', 'Crítico', 'Alta', 'Média', 'Baixa', 'Exige atenção'].map(p => {
               const isActive = filterPriority === p;
               return (
                  <button 
                     key={p} 
                     onClick={() => setFilterPriority(p)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isActive ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300'
                     }`}
                  >
                     {p !== 'Todos' && (
                        <div className={`w-2 h-2 rounded-full ${p === 'Crítico' ? 'bg-red-500' : p === 'Alta' ? 'bg-orange-500' : p === 'Média' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                     )}
                     {p}
                  </button>
               )
            })}
         </div>
         <div className="w-px h-6 bg-white/10 hidden md:block"></div>
         <div className="flex items-center gap-2">
            <button key="TodosSetor" onClick={() => setFilterSetor('Todos')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterSetor === 'Todos' ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300'}`}>
               Todos
            </button>
            {['Obras', 'Manutenção', 'Produção', 'Logística'].map(s => (
               <button 
                  key={s} 
                  onClick={() => setFilterSetor(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterSetor === s ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300'}`}
               >
                  {s}
               </button>
            ))}
         </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#121826] rounded-[12px] border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
           <h2 className="text-[15px] font-medium text-gray-200">Ações em andamento</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
           <thead className="bg-[#0c1018]">
              <tr>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prioridade</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Ação</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Executor da Correção</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Setor</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Progresso</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prazo</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5 text-[13px]">
              {list.map(acao => {
                 const pColors = PRIORITY_COLORS[acao.prioridade] || PRIORITY_COLORS['Baixa'];
                 const prioCircle = pColors.split(' ')[0].replace('text-', 'bg-');
                 const targetName = acao.executor || acao.validador || acao.responsavel; const rInitials = getInitials(targetName);
                 const avatarColors = [
                    'bg-purple-500/20 text-purple-400', 'bg-blue-500/20 text-blue-400', 
                    'bg-emerald-500/20 text-emerald-400', 'bg-orange-500/20 text-orange-400',
                    'bg-indigo-500/20 text-indigo-400', 'bg-pink-500/20 text-pink-400'
                 ];
                 const charCode = (acao.responsavel || "").charCodeAt(0) || 0;
                 const avatarColor = avatarColors[charCode % avatarColors.length];
                 const { label: prazoLabel, diffDays } = getPrazoInfo(acao.prazo);
                 const isLate = diffDays !== null && diffDays < 0;
                 const isWarning = diffDays !== null && diffDays >= 0 && diffDays <= 3;
                 
                 return (
                    <tr key={acao.id} onClick={() => onOpen(acao)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                       <td className="px-5 py-4 w-32">
                          <div className={`flex items-center gap-2 w-fit px-2 py-0.5 rounded border text-[11px] font-medium ${pColors}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${prioCircle}`}></div>
                             {acao.prioridade}
                          </div>
                       </td>
                       <td className="px-5 py-4 w-64">
                          <div className="flex flex-col gap-1.5">
                             <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">{acao.titulo}</h3>
                             <div className="flex items-center gap-2 flex-wrap">
                               {acao.faseExecucao === 'Aguardando Validação' && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Aguardando Validador</span>}
                               {acao.followUp?.precisaFollowUp && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Requer atualização</span>}
                               {acao.followUp?.nivel === 'bloqueada' && <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Com bloqueio</span>}
                               {acao.followUp?.escalado && <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded">Escalonada</span>}
                               {isWarning && <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Prazo crítico</span>}
                               {(acao as any).pacote && (acao as any).pacote !== 'Base SST' && !activePackageNames.includes((acao as any).pacote) && (
                                 <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                   <Package className="w-2.5 h-2.5" />
                                   {(acao as any).pacote} (Inativo)
                                 </span>
                               )}
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-44">
                          <div className="flex items-center gap-2.5">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor}`}>
                                {rInitials}
                             </div>
                             <span className="text-gray-300">{targetName}</span>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <span className="text-gray-300">{acao.setor}</span>
                       </td>
                       <td className="px-5 py-4 w-44">
                          <div className="flex items-center gap-3">
                             <span className="text-white font-medium w-8">{Math.max(0, acao.progresso || 0)}%</span>
                             <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${acao.progresso}%` }}></div>
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-40">
                          <div className="text-gray-200">{acao.prazo}</div>
                          <div className={`text-[11px] font-medium mt-0.5 ${isLate ? 'text-red-500' : isWarning ? 'text-orange-400' : 'text-gray-500'}`}>
                             {prazoLabel}
                          </div>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <div className="px-2 py-1 rounded border text-[11px] font-medium flex items-center justify-center w-fit text-blue-400 border-blue-500/30 bg-blue-500/10">
                             {acao.status}
                          </div>
                       </td>
                    </tr>
                 );
              })}
              {list.length === 0 && (
                 <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">Nenhuma ação encontrada com os filtros selecionados.</td>
                 </tr>
              )}
           </tbody>
        </table>
        </div>
        
        {/* Footer Pagination */}
        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between text-sm w-full bg-[#121826]">
           <span className="text-gray-500">Mostrando 1 a {list.length > 10 ? 10 : list.length} de {list.length} ações</span>
           <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-white/10 text-gray-500 hover:bg-white/5 transition-colors" disabled>
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-indigo-600/20 text-indigo-400 font-medium">
                 1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-white/10 text-gray-500 hover:bg-white/5 transition-colors" disabled>
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
