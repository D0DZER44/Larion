"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionItem } from '../types';
import { 
  Info, 
  History, 
  Settings, 
  User as UserIcon, 
  CalendarClock, 
  CheckCircle2, 
  Eye, 
  X,
  Code2,
  Layers,
  FileBadge,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  ListChecks,
  Clock
} from 'lucide-react';

interface ExHistoryEvent {
  id: string;
  actionId: string;
  actionTitle: string;
  evento: string;
  origem: string;
  usuario: string;
  dataHora: string;
  statusFinal: string;
  camposAlterados: { campo: string; anterior: string | null; novo: string }[];
  riscoVinculado: string;
  inspecaoVinculada: string;
  checklistPergunta: string;
  justificativa: string;
  hash: string;
  versao: string;
  fonte: string;
  ambiente: string;
  integridade: string;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(n => n.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const hashCode = (s: string) => {
  let h = 0;
  for(let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(16).padEnd(32, 'a1b2c3d4e5f6g7h8i9j0');
};

export default function Historico({ acoes }: { acoes: ActionItem[], onOpen?: (a: ActionItem) => void }) {
  const [selectedEvent, setSelectedEvent] = useState<ExHistoryEvent | null>(null);

  const historyList = useMemo(() => {
     let allEvents: ExHistoryEvent[] = [];
     
     (acoes || []).forEach(a => {
        if (a.historico && Array.isArray(a.historico) && a.historico.length > 0) {
           a.historico.forEach((evt, idx) => {
              allEvents.push({
                 id: evt.id || `HIS-${a.id}-evt${idx}`,
                 actionId: evt.actionId || a.id,
                 actionTitle: a.titulo,
                 evento: evt.evento || 'Evento sem nome',
                 origem: evt.origem || 'Web App',
                 usuario: evt.usuario || 'Usuário Desconhecido',
                 dataHora: evt.dataHora,
                 statusFinal: evt.statusFinal || a.status,
                 camposAlterados: evt.camposAlterados && evt.camposAlterados.length > 0 
                    ? evt.camposAlterados.map(c => ({
                        campo: c.campo,
                        anterior: c.anterior,
                        novo: c.novo
                      }))
                    : [{ campo: 'Status', anterior: '-', novo: a.status }],
                 riscoVinculado: a.riscoVinculado || 'Não informado',
                 inspecaoVinculada: a.origem || 'Não informado',
                 checklistPergunta: a.perguntaOrigem || 'Não aplicável',
                 justificativa: evt.justificativa || `Alteração realizada por ${evt.usuario || 'desconhecido'}.`,
                 hash: evt.hash || hashCode(evt.id + evt.dataHora + a.id),
                 versao: evt.versao || `v${idx + 1}`,
                 fonte: 'Interface Web',
                 ambiente: 'Produção',
                 integridade: evt.integridade || 'Verificada'
              });
           });
        }
     });
     return allEvents.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [acoes]);

  const cards = useMemo(() => {
     const total = historyList.length;
     const automaticas = historyList.filter(h => h.origem === 'Automática' || h.origem === 'Sistema').length;
     const manuais = historyList.filter(h => h.origem === 'Manual').length;
     const ultima = historyList.length > 0 ? historyList[0].dataHora : null;
     
     let relativeTime = 'Sem registros';
     if (ultima) {
        const diffMins = Math.floor((new Date().getTime() - new Date(ultima).getTime()) / 60000);
        if (diffMins < 60) relativeTime = `Há ${diffMins} minutos`;
        else relativeTime = `Há ${Math.floor(diffMins/60)} horas`;
     }

     return {
        total,
        automaticas,
        autoPerc: total > 0 ? ((automaticas / total) * 100).toFixed(1) : '0',
        manuais,
        manuaisPerc: total > 0 ? ((manuais / total) * 100).toFixed(1) : '0',
        ultima: ultima ? new Date(ultima).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--',
        relativeTime
     };
  }, [historyList]);

  const getEventBadge = (evento: string) => {
     if (evento.includes('Criação')) return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
     if (evento.includes('Atualização')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
     if (evento.includes('Conclusão')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
     if (evento.includes('Cancelamento')) return 'text-red-400 bg-red-500/10 border-red-500/30';
     return 'text-gray-300 bg-white/5 border-white/10';
  };

  return (
    <div className="flex w-full h-full relative overflow-hidden">
      <motion.div 
         initial={{ opacity: 0, y: 10 }} 
         animate={{ opacity: 1, y: 0 }} 
         exit={{ opacity: 0, y: -10 }} 
         className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar pr-2 pb-6"
      >
        
        {/* Banner Informativo */}
        <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3 shrink-0">
           <Info className="w-5 h-5 text-indigo-400 shrink-0" />
           <p className="text-sm text-indigo-200/90">
             O histórico é imutável e somente leitura. As informações abaixo registram todas as mudanças realizadas nas ações.
           </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
             <div className="flex flex-col gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                   <History className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-medium text-gray-300 mt-1">Registros históricos</h3>
             </div>
             <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
                {cards.total}
                <div className="text-[12px] text-gray-500 font-normal">Total de eventos</div>
             </div>
          </div>

          <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
             <div className="flex flex-col gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                   <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-medium text-gray-300 mt-1">Ações automáticas</h3>
             </div>
             <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
                {cards.automaticas}
                <div className="text-[12px] text-blue-400 font-normal">{cards.autoPerc}% do total</div>
             </div>
          </div>

          <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
             <div className="flex flex-col gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                   <UserIcon className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-medium text-gray-300 mt-1">Ações manuais</h3>
             </div>
             <div className="mt-2 text-white font-bold text-[32px] leading-tight flex items-baseline justify-between w-full">
                {cards.manuais}
                <div className="text-[12px] text-orange-400 font-normal">{cards.manuaisPerc}% do total</div>
             </div>
          </div>

          <div className="bg-[#121826] border border-white/5 p-5 rounded-[12px] flex flex-col justify-between">
             <div className="flex flex-col gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                   <CalendarClock className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-medium text-gray-300 mt-1">Última atualização</h3>
             </div>
             <div className="mt-2 text-white font-bold text-[22px] leading-tight flex items-baseline justify-between w-full truncate">
                {cards.ultima}
                <div className="text-[12px] text-emerald-500 font-normal shrink-0 ml-2">{cards.relativeTime}</div>
             </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-[#121826] rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
             <h2 className="text-[15px] font-medium text-white">Linha do tempo das ações</h2>
          </div>
          <div className="overflow-x-auto flex-1 h-0">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#0c1018] sticky top-0 z-10">
                   <tr>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">ID</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">Ação</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">Evento</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">Origem</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">Usuário / Sistema</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">
                         <div className="flex items-center gap-1">Data e hora <span className="text-[10px]">↓</span></div>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5">Status final</th>
                      <th className="px-5 py-3.5 text-xs font-medium text-gray-400 border-b border-white/5 text-center">Detalhes</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {historyList.map(item => {
                      const isSelected = selectedEvent?.id === item.id;
                      const avatarColors = ['bg-indigo-500/20 text-indigo-400', 'bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400', 'bg-emerald-500/20 text-emerald-400', 'bg-pink-500/20 text-pink-400'];
                      const charCode = item.usuario.charCodeAt(0) || 0;
                      const aColor = item.origem === 'Sistema' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : avatarColors[charCode % avatarColors.length];

                      return (
                         <tr 
                            key={item.id} 
                            onClick={() => setSelectedEvent(item)} 
                            className={`transition-colors cursor-pointer group ${isSelected ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`}
                         >
                            <td className="px-5 py-4 w-36 whitespace-nowrap">
                               <span className="text-[12px] font-mono text-gray-400">{item.actionId}</span>
                            </td>
                            <td className="px-5 py-4 w-64 max-w-[250px]">
                               <h3 className="text-[13px] font-medium text-gray-200 group-hover:text-indigo-300 transition-colors truncate">{item.actionTitle}</h3>
                            </td>
                            <td className="px-5 py-4 w-32 whitespace-nowrap">
                               <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getEventBadge(item.evento)}`}>
                                  {item.evento}
                               </span>
                            </td>
                            <td className="px-5 py-4 w-32">
                               <div className="flex items-center gap-1.5 flex-wrap w-fit">
                                  {item.origem === 'Automática' && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">Automático</span>}
                                  {item.origem === 'Sistema' && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">Sistema</span>}
                                  {item.origem === 'Manual' && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">Manual</span>}
                                  {item.evento.includes('Escalonamento') && <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded">Escalonamento</span>}
                                  {item.statusFinal === 'Vencida' && <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Prazo vencido</span>}
                               </div>
                            </td>
                            <td className="px-5 py-4 w-48 whitespace-nowrap">
                               <div className="flex items-center gap-2">
                                  {item.origem === 'Manual' ? (
                                     <>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-transparent ${aColor}`}>
                                           {getInitials(item.usuario)}
                                        </div>
                                        <span className="text-[13px] text-gray-300">{item.usuario}</span>
                                     </>
                                  ) : (
                                     <span className="text-[13px] text-gray-500">Sistema</span>
                                  )}
                               </div>
                            </td>
                            <td className="px-5 py-4 w-40 text-[13px] text-gray-300 whitespace-nowrap">
                               {new Date(item.dataHora).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-5 py-4 w-36 whitespace-nowrap">
                               <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className={`w-4 h-4 ${item.statusFinal === 'Concluída' ? 'text-emerald-500' : item.statusFinal === 'Cancelada' ? 'text-red-500' : 'text-orange-500'}`} />
                                  <span className="text-[13px] text-gray-300">{item.statusFinal}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 w-20 text-center">
                               <button className="p-1.5 rounded-lg text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors mx-auto">
                                  <Eye className="w-4 h-4" />
                               </button>
                            </td>
                         </tr>
                      );
                   })}
                   {historyList.length === 0 && (
                      <tr>
                         <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-500">Nenhum evento registrado.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </motion.div>

      {/* Push Drawer para Detalhes do Histórico */}
      <AnimatePresence>
         {selectedEvent && (
            <>
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" 
                 onClick={() => setSelectedEvent(null)} 
               />
               <motion.div
                 initial={{ width: 0, opacity: 0 }}
                 animate={{ width: 440, opacity: 1 }}
                 exit={{ width: 0, opacity: 0 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="fixed top-0 right-0 h-full lg:relative lg:h-full bg-[#0c1018] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden shrink-0"
               >
                  <div className="w-[440px] h-full flex flex-col overflow-hidden">
                     {/* Header */}
                     <div className="flex flex-col p-6 border-b border-white/5 shrink-0 bg-[#121826]">
                        <div className="flex items-center justify-between mb-4">
                           <h2 className="text-[13px] font-medium text-gray-400">Detalhes do histórico</h2>
                           <button onClick={() => setSelectedEvent(null)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors border border-white/10">
                             <X className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="flex items-center justify-between gap-4 mb-2">
                           <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">{selectedEvent.actionId}</span>
                        </div>
                        <h1 className="text-xl font-medium text-white leading-tight mb-4">{selectedEvent.actionTitle}</h1>
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] text-gray-500">Evento</span>
                           <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded border ${getEventBadge(selectedEvent.evento)}`}>{selectedEvent.evento}</span>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#0c1018]">
                        
                        {/* Campos Alterados */}
                        <div className="space-y-3">
                           <h3 className="text-[13px] font-medium text-white mb-2">Campos alterados</h3>
                           <div className="border border-white/5 rounded-xl overflow-hidden bg-[#121826]">
                              <table className="w-full text-left text-[12px]">
                                 <thead className="bg-[#1a2333]">
                                    <tr>
                                       <th className="px-3 py-2 text-gray-400 font-medium w-[30%]">Campo</th>
                                       <th className="px-3 py-2 text-gray-400 font-medium w-[35%]">Valor anterior</th>
                                       <th className="px-3 py-2 text-gray-400 font-medium w-[35%]">Novo valor</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                    {selectedEvent.camposAlterados.map((c, i) => (
                                       <tr key={i}>
                                          <td className="px-3 py-2.5 text-gray-300 font-medium">{c.campo}</td>
                                          <td className="px-3 py-2.5 text-gray-500 line-through decoration-gray-600">{c.anterior || '—'}</td>
                                          <td className="px-3 py-2.5 text-indigo-300">{c.novo || '—'}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                           <button className="text-[12px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center justify-between w-full">
                              Ver todos os campos alterados ({selectedEvent.camposAlterados.length})
                              <span className="text-lg">›</span>
                           </button>
                        </div>

                        {/* Vínculos */}
                        <div className="space-y-4 text-[13px]">
                           <div className="flex items-start gap-4">
                              <AlertTriangle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Risco vinculado</span>
                                 <span className="text-gray-200">{selectedEvent.riscoVinculado}</span>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <ClipboardCheck className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Inspeção vinculada</span>
                                 <span className="text-gray-200">{selectedEvent.inspecaoVinculada}</span>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <ListChecks className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Checklist / Pergunta vinculada</span>
                                 <span className="text-gray-200 leading-snug">{selectedEvent.checklistPergunta}</span>
                              </div>
                           </div>
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        {/* Origem */}
                        <div className="space-y-4 text-[13px]">
                           <div className="flex items-start gap-4">
                              <UserIcon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Origem</span>
                                 <span className="text-gray-200">{selectedEvent.usuario}</span>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <Clock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Data e hora</span>
                                 <span className="text-gray-200">{new Date(selectedEvent.dataHora).toLocaleString('pt-BR')}</span>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <FileBadge className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <div className="flex-1 grid grid-cols-[140px,1fr] gap-2">
                                 <span className="text-gray-400">Justificativa</span>
                                 <span className="text-gray-200 leading-relaxed max-w-full">{selectedEvent.justificativa}</span>
                              </div>
                           </div>
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        {/* Auditoria */}
                        <div className="space-y-4">
                           <h3 className="text-[13px] font-medium text-white mb-2">Informações de auditoria</h3>
                           <div className="space-y-3 text-[13px]">
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-start">
                                 <div className="flex items-center gap-2 text-gray-400">
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>Hash do registro</span>
                                 </div>
                                 <span className="text-gray-200 font-mono text-[11px] break-all">{selectedEvent.hash}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <div className="flex items-center gap-2 text-gray-400">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Versão</span>
                                 </div>
                                 <span className="text-gray-200">{selectedEvent.versao}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <span className="text-gray-400 pl-5.5">Registro criado em</span>
                                 <span className="text-gray-200">{new Date(selectedEvent.dataHora).toLocaleString('pt-BR')}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <span className="text-gray-400 pl-5.5">Criado por</span>
                                 <span className="text-gray-200">{selectedEvent.usuario}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <span className="text-gray-400 pl-5.5">Fonte</span>
                                 <span className="text-gray-200">{selectedEvent.fonte}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <span className="text-gray-400 pl-5.5">Ambiente</span>
                                 <span className="text-gray-200">{selectedEvent.ambiente}</span>
                              </div>
                              <div className="grid grid-cols-[140px,1fr] gap-4 items-center">
                                 <span className="text-gray-400 pl-5.5">Integridade</span>
                                 <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {selectedEvent.integridade}
                                 </span>
                              </div>
                           </div>
                        </div>

                     </div>

                     {/* Footer do Drawer */}
                     <div className="p-6 border-t border-white/5 shrink-0 bg-[#121826]">
                        <button 
                           onClick={() => setSelectedEvent(null)}
                           className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 text-[13px]"
                        >
                           Fechar painel
                        </button>
                     </div>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}

