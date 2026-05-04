"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ActionItem } from '../types';
import { CheckCircle2, CalendarCheck, ShieldCheck, DollarSign, FileText, ChevronLeft, ChevronRight, Eye, Package } from 'lucide-react';
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

function parseDateStr(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(NaN);
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  const ds = parts.length === 3 && parts[0].length === 2 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  return new Date(ds);
}

function checkIsOnTime(concluidaStr: string, prazoStr: string) {
  const c = parseDateStr(concluidaStr);
  const p = parseDateStr(prazoStr);
  if (isNaN(c.getTime()) || isNaN(p.getTime())) return true;
  c.setHours(0,0,0,0);
  p.setHours(0,0,0,0);
  return c.getTime() <= p.getTime();
}

import { getConcluidas } from '../hooks';

export default function Concluidas({ acoes, onOpen }: { acoes: ActionItem[], onOpen: (a: ActionItem) => void }) {
  const [filterPeriod, setFilterPeriod] = useState<string>('30 dias');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('Todos');
  const rulePackages = useAppStore(state => state.rulePackages);
  const activePackageNames = useMemo(() => rulePackages.filter(p => p.isActive).map(p => p.name), [rulePackages]);

  const { list, stats } = useMemo(() => {
     let concluidasList = getConcluidas(acoes);
     
     const totais = concluidasList.length;
     let noPrazoCount = 0;
     let criticasMitigadas = 0;
     let comAtrasoCount = 0;

     concluidasList.forEach(a => {
        const onTime = checkIsOnTime(a.concluidoEm || a.atualizadoEm || '', a.prazo);
        if (onTime) {
           noPrazoCount++;
        } else {
           comAtrasoCount++;
        }
        if (a.prioridade === 'Crítica' || a.prioridade === 'Alta') {
           criticasMitigadas++;
        }
     });

     const noPrazoPerc = totais > 0 ? Math.round((noPrazoCount / totais) * 100) : 0;
     const criticasPerc = totais > 0 ? Math.round((criticasMitigadas / totais) * 100) : 0;
     const multaEvitada = 142850; // Mocked as instructed
     const evidenciaAnexadaCount = Math.floor(totais * 0.85); // Mocked for the chart

     if (filterPeriod === 'Hoje') {
        const today = new Date();
        today.setHours(0,0,0,0);
        concluidasList = concluidasList.filter(a => parseDateStr(a.concluidoEm || a.atualizadoEm || '').getTime() >= today.getTime());
     } else if (filterPeriod === '7 dias') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        concluidasList = concluidasList.filter(a => parseDateStr(a.concluidoEm || a.atualizadoEm || '').getTime() >= d.getTime());
     } else if (filterPeriod === '30 dias') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        concluidasList = concluidasList.filter(a => parseDateStr(a.concluidoEm || a.atualizadoEm || '').getTime() >= d.getTime());
     }

     const sorted = concluidasList.sort((a,b) => {
        const cA = parseDateStr(a.concluidoEm || a.atualizadoEm || '').getTime() || 0;
        const cB = parseDateStr(b.concluidoEm || b.atualizadoEm || '').getTime() || 0;
        if (cB !== cA) return cB - cA;
        
        const prioMap: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        const pA = prioMap[a.prioridade] || 0;
        const pB = prioMap[b.prioridade] || 0;
        return pB - pA;
     });

     return {
        list: sorted,
        stats: { totais, noPrazoCount, noPrazoPerc, criticasMitigadas, criticasPerc, multaEvitada, comAtrasoCount, evidenciaAnexadaCount }
     };
  }, [acoes, filterPeriod]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      
      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Concluídas</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              {stats.totais}
              <div className="text-[12px] text-gray-500 font-normal">Total de ações</div>
           </div>
        </div>

        <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                 <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">No prazo</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              {stats.noPrazoCount}
              <div className="text-[12px] text-blue-400 font-normal">{stats.noPrazoPerc}% das concluídas</div>
           </div>
        </div>

        <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Mitigaram risco crítico</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
              {stats.criticasMitigadas}
              <div className="text-[12px] text-purple-400 font-normal">{stats.criticasPerc}% das concluídas</div>
           </div>
        </div>

        <div className="bg-[#1a1c18] border border-emerald-500/20 p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center">
                 <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-medium text-gray-300">Multa evitada</h3>
           </div>
           <div className="mt-2 text-white font-bold text-[28px] leading-tight flex items-baseline justify-between w-full">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.multaEvitada)}
              <div className="text-[12px] text-yellow-500/70 font-normal shrink-0 ml-2">Estimativa</div>
           </div>
        </div>
      </div>

      {/* Gráfico Resultados */}
      <div className="bg-[#121826] rounded-[12px] border border-white/5 p-5">
         <h3 className="text-[15px] font-medium text-gray-200 mb-6">Resultados</h3>
         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-32 text-[13px] text-gray-400 shrink-0">No prazo</div>
               <div className="flex-1 -mr-2">
                  <div className="h-4 bg-[#1e2536] rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(1, (stats.noPrazoCount / (stats.totais || 1)) * 100)}%` }}></div>
                  </div>
               </div>
               <div className="w-12 text-right text-[13px] font-medium text-white shrink-0">{stats.noPrazoCount}</div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-32 text-[13px] text-gray-400 shrink-0">Com atraso</div>
               <div className="flex-1 -mr-2">
                  <div className="h-4 bg-[#1e2536] rounded-full overflow-hidden">
                     <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.max(1, (stats.comAtrasoCount / (stats.totais || 1)) * 100)}%` }}></div>
                  </div>
               </div>
               <div className="w-12 text-right text-[13px] font-medium text-white shrink-0">{stats.comAtrasoCount}</div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-32 text-[13px] text-gray-400 shrink-0">Críticas mitigadas</div>
               <div className="flex-1 -mr-2">
                  <div className="h-4 bg-[#1e2536] rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.max(1, (stats.criticasMitigadas / (stats.totais || 1)) * 100)}%` }}></div>
                  </div>
               </div>
               <div className="w-12 text-right text-[13px] font-medium text-white shrink-0">{stats.criticasMitigadas}</div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-32 text-[13px] text-gray-400 shrink-0">Evidência anexada</div>
               <div className="flex-1 -mr-2">
                  <div className="h-4 bg-[#1e2536] rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(1, (stats.evidenciaAnexadaCount / (stats.totais || 1)) * 100)}%` }}></div>
                  </div>
               </div>
               <div className="w-12 text-right text-[13px] font-medium text-white shrink-0">{stats.evidenciaAnexadaCount}</div>
            </div>
         </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#121826] rounded-[12px] border border-white/5 overflow-hidden">
         <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-gray-200">Ações concluídas</h2>
            <div className="flex items-center gap-2">
               {['Hoje', '7 dias', '30 dias', 'Todos'].map(p => (
                  <button 
                     key={p} 
                     onClick={() => setFilterPeriod(p)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterPeriod === p ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300'}`}
                  >
                     {p}
                  </button>
               ))}
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead className="bg-[#0c1018]">
                  <tr>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prioridade</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Ação</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Responsável</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">
                        <div className="flex items-center gap-1">Concluída em <span className="text-[10px]">↓</span></div>
                     </th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Prazo original</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Resultado</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Evidência</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400">Origem</th>
                     <th className="px-5 py-3.5 text-xs font-medium text-gray-400 text-center">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5 text-[13px]">
                  {list.map(acao => {
                     const pColors = PRIORITY_COLORS[acao.prioridade] || PRIORITY_COLORS['Baixa'];
                     const prioCircle = pColors.split(' ')[0].replace('text-', 'bg-');
                     const rInitials = getInitials(acao.responsavel);
                     const avatarColors = [
                        'bg-purple-500/20 text-purple-400', 'bg-blue-500/20 text-blue-400', 
                        'bg-emerald-500/20 text-emerald-400', 'bg-orange-500/20 text-orange-400',
                        'bg-indigo-500/20 text-indigo-400', 'bg-pink-500/20 text-pink-400'
                     ];
                     const charCode = (acao.responsavel || "").charCodeAt(0) || 0;
                     const avatarColor = avatarColors[charCode % avatarColors.length];
                     
                     const cDate = parseDateStr(acao.concluidoEm || acao.atualizadoEm || '');
                     const formattedConclusao = isNaN(cDate.getTime()) ? '--' : cDate.toLocaleDateString('pt-BR');
                     
                     const onTime = checkIsOnTime(acao.concluidoEm || acao.atualizadoEm || '', acao.prazo);
                     const isCritico = acao.prioridade === 'Crítica' || acao.prioridade === 'Alta';

                     let resultText = 'Concluída';
                     let resultClass = 'text-emerald-400';
                     if (!onTime) {
                        resultText = 'Concluída com atraso';
                        resultClass = 'text-orange-400';
                     } else if (isCritico) {
                        resultText = 'Mitigou risco crítico';
                        resultClass = 'text-emerald-500';
                     } else {
                        resultText = 'Concluída no prazo';
                        resultClass = 'text-emerald-400';
                     }

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
                                   {onTime && !isCritico && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">No prazo</span>}
                                   {!onTime && <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Com atraso</span>}
                                   {isCritico && onTime && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">Risco mitigado</span>}
                                   <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">Evidência anexada</span>
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
                                 <span className="text-gray-300">{acao.responsavel}</span>
                              </div>
                           </td>
                           <td className="px-5 py-4 w-32 text-gray-300">
                              {formattedConclusao}
                           </td>
                           <td className="px-5 py-4 w-32 text-gray-400">
                              {acao.prazo}
                           </td>
                           <td className="px-5 py-4 w-44">
                              <span className={`text-[12px] font-medium ${resultClass}`}>{resultText}</span>
                           </td>
                           <td className="px-5 py-4 w-24">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 group-hover:bg-white/10 transition-colors">
                                 <FileText className="w-4 h-4" />
                              </div>
                           </td>
                           <td className="px-5 py-4 w-32 text-gray-300">
                              {acao.origem || 'Inspeção'}
                           </td>
                           <td className="px-5 py-4 w-24 text-center">
                              <button className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-[12px] font-medium flex items-center gap-2 mx-auto hover:bg-white/10 hover:text-white transition-colors">
                                 <Eye className="w-3.5 h-3.5" />
                                 Ver
                              </button>
                           </td>
                        </tr>
                     );
                  })}
                  {list.length === 0 && (
                     <tr>
                        <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500">Nenhuma ação encontrada com os filtros selecionados.</td>
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

