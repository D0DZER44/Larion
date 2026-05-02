"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, AlertTriangle, CheckCircle2, Factory, User, ShieldAlert, ClipboardCheck, ListChecks, CalendarClock, DollarSign, ExternalLink, UserPlus, RefreshCw, Circle, BookOpen, FileText, ArrowRight, Eye, Clock, Info } from 'lucide-react';
import Image from 'next/image';
import { ActionItem } from '../types';

interface Props {
  acao: ActionItem;
  onClose: () => void;
  iniciarAcao: (id: string) => void;
  atualizarProgresso: (id: string, novoProgresso: number, comentario?: string) => void;
  concluirAcao: (id: string, observacaoFinal?: string) => void;
  reatribuirAcao?: (id: string, novoResponsavel: string, justificativa: string) => void;
  cancelarAcao?: (id: string, justificativa: string) => void;
  reabrirAcao?: (id: string, justificativa: string) => void;
  forcarFollowUp?: () => void;
}

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

export default function DrawerAcao({ acao, onClose, iniciarAcao, atualizarProgresso, concluirAcao, reatribuirAcao, cancelarAcao, reabrirAcao, forcarFollowUp }: Props) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [progressoLocal, setProgressoLocal] = useState(acao?.progresso || 0);
  const [comentarioLocal, setComentarioLocal] = useState('');

  if (!acao) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
       case 'Vencida': return 'text-red-400 border-red-500/30 bg-red-500/10';
       case 'Em andamento': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
       case 'Concluída': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
       case 'Cancelada': return 'text-gray-400 border-gray-500/30 bg-white/5';
       default: return 'text-orange-400 border-orange-500/30 bg-orange-500/10'; // Pendente
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'Alta': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'Média': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  const rInitials = getInitials(acao.responsavel);
  const avatarColors = [
    'bg-purple-500/20 text-purple-400 border-purple-500/30', 
    'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ];
  const charCode = (acao.responsavel || "").charCodeAt(0) || 0;
  const avatarColor = avatarColors[charCode % avatarColors.length];

  const prazoInfo = getPrazoInfo(acao.prazo);
  const isAndamento = acao.status === 'Em andamento';
  const isConcluida = acao.status === 'Concluída';

  const renderIntegrationButtons = () => {
    if (!acao.riscoId && !acao.inspecaoId) return null;
    return (
      <div className="flex flex-col gap-2 mt-1">
        {acao.riscoId && (
          <button onClick={() => window.location.href='/operacao/riscos'} className="w-full bg-transparent border border-orange-500/20 hover:bg-orange-500/10 text-orange-400 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Abrir risco vinculado
          </button>
        )}
        {acao.inspecaoId && (
          <button onClick={() => window.location.href='/operacao/inspecoes'} className="w-full bg-transparent border border-blue-500/20 hover:bg-blue-500/10 text-blue-400 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Abrir inspeção vinculada
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ width: 0, opacity: 0 }} 
        animate={{ width: 440, opacity: 1 }} 
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full lg:relative lg:h-full bg-[#0c1018] border-l border-white/10 shadow-2xl z-[110] flex flex-col overflow-hidden shrink-0"
      >
        <div className="w-[440px] h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <div>
              <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">Detalhes da ação</h2>
            </div>
            <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors shrink-0 border border-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">
            
            {/* Banner Contextual */}
            {acao.status === 'Vencida' && (
               <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-200">Esta ação está vencida e precisa de prioridade imediata.</p>
               </div>
            )}
            {acao.followUp?.escalado && acao.status !== 'Vencida' && (
               <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-pink-200">Esta ação foi escalonada automaticamente por atraso ou ausência de atualização.</p>
               </div>
            )}
            {acao.followUp?.precisaFollowUp && !acao.followUp?.escalado && acao.status !== 'Vencida' && (
               <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-indigo-200">Esta ação está sem atualização recente. Registre progresso ou impedimento.</p>
               </div>
            )}
            {acao.followUp?.nivel === 'bloqueada' && (
               <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-orange-200">Há um impedimento registrado que pode atrasar a conclusão.</p>
               </div>
            )}

            {/* Title & Badges */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 pr-2">
                   <h1 className="text-[18px] font-medium text-white leading-snug">{acao.titulo}</h1>
                   {(isAndamento || isConcluida) && <div className="text-[12px] text-gray-500">ID: AC-{acao.id || '1011'}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                   {(!isAndamento && !isConcluida) && <span className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center justify-center ${getPriorityColor(acao.prioridade)}`}>{acao.prioridade}</span>}
                   <span className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center justify-center ${getStatusColor(acao.status)}`}>{acao.status}</span>
                </div>
              </div>

              {/* Layout for Pending / Em andamento */}
              {!isConcluida && !isAndamento && (
                <div className="space-y-2">
                   <h3 className="text-[12px] font-medium text-white">Descrição</h3>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     {acao.descricao || 'A linha de vida horizontal instalada na cobertura não está conforme a NR 35. Necessário instalar ponto de ancoragem intermediário e verificar tensão do cabo.'}
                   </p>
                </div>
              )}
            </div>

            {/* Origem normativa e vínculo */}
            {(acao.regraFixa !== undefined || acao.nrRelacionada || (acao as any).nr) && (
               <div className="space-y-2 pb-2">
                  <div className="bg-[#1e1a30]/50 p-4 rounded-xl border border-blue-500/20 space-y-3">
                     <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Origem Normativa e Vínculo</h4>
                     </div>
                     <div className="space-y-1.5 text-[12px] text-gray-300">
                        {(acao.nrRelacionada || (acao as any).nr) && <p><span className="font-bold text-gray-500">NR Relacionada:</span> {acao.nrRelacionada || (acao as any).nr}</p>}
                        {acao.regraTitulo && <p><span className="font-bold text-gray-500">Regra:</span> {acao.regraTitulo}</p>}
                        {acao.regraId && <p><span className="font-bold text-gray-500">Regra ID:</span> {acao.regraId}</p>}
                        
                        {acao.regraFixa === true ? (
                           <p><span className="font-bold text-gray-500">Regra Fixa:</span> Sim</p>
                        ) : acao.regraFixa === false ? (
                           <p><span className="font-bold text-gray-500">Regra Fixa:</span> Não</p>
                        ) : (
                           <p><span className="font-bold text-gray-500">Regra Fixa:</span> Regra normativa não vinculada</p>
                        )}

                        {acao.riscoVinculado && <p><span className="font-bold text-gray-500">Risco vinculado:</span> {acao.riscoVinculado || acao.riscoId}</p>}
                        {acao.inspecaoId && <p><span className="font-bold text-gray-500">Inspeção:</span> {acao.inspecaoId.substring(0,8).toUpperCase()}</p>}
                        {acao.perguntaOrigem && <p><span className="font-bold text-gray-500">Pergunta:</span> {acao.perguntaOrigem}</p>}
                        {acao.respostaOrigem && <p><span className="font-bold text-gray-500">Resposta:</span> {acao.respostaOrigem}</p>}
                        {acao.multaEstimada && <p><span className="font-bold text-gray-500">Multa / Impacto potencial:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acao.multaEstimada)}</p>}
                        {acao.chanceIncidente && <p><span className="font-bold text-gray-500">Chance de incidente:</span> {acao.chanceIncidente}%</p>}
                     </div>
                     {acao.explicacaoNormativa && (
                        <div className="mt-3 pt-3 border-t border-blue-500/20">
                           <p className="text-[12px] text-blue-200/80 leading-relaxed italic border-l-2 border-blue-500/50 pl-3">
                              {acao.explicacaoNormativa}
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Content for Concluída */}
            {isConcluida && (
               <>
                 <div className="grid grid-cols-2 gap-y-4 text-[13px]">
                    <div className="flex items-center gap-2 text-gray-300">
                       <User className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">Responsável</span>
                       <div className="flex items-center gap-1.5 ml-auto text-white">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${avatarColor}`}>
                             {rInitials}
                          </div>
                          {acao.responsavel}
                       </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-start-1">
                       <CalendarClock className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">Concluída em</span>
                       <span className="ml-auto text-white">
                          {acao.concluidoEm ? new Date(acao.concluidoEm).toLocaleDateString('pt-BR') : '05/05/2024'} às 14:32
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <AlertTriangle className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">Risco vinculado</span>
                       <span className="ml-auto text-white truncate max-w-[200px]">{acao.riscoVinculado || 'Esmagamento de membros superiores'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <ClipboardCheck className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-32">Inspeção vinculada</span>
                       <span className="ml-auto text-white">Auditoria Interna - 28/04/</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <BookOpen className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">NR aplicável</span>
                       <span className="ml-auto text-white">NR-12</span>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">O que foi feito / Comentários</h3>
                    <div className="text-[13px] text-gray-400 leading-relaxed pt-1 space-y-2">
                       {acao.comentarios && acao.comentarios.length > 0 ? (
                         acao.comentarios.map((comentario, index) => (
                           <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/5">
                             {comentario}
                           </div>
                         ))
                       ) : (
                         <div className="italic text-gray-500">Nenhum comentário registrado ainda.</div>
                       )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">Evidências e anexos</h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1">
                       <div className="w-24 shrink-0 rounded-lg border border-white/10 overflow-hidden group cursor-pointer relative">
                          <Image src="https://images.unsplash.com/photo-1542124578-8ba9fb1720ce?q=80&w=200&auto=format&fit=crop" width={200} height={64} alt="Foto 1" unoptimized className="w-full h-16 object-cover" referrerPolicy="no-referrer" />
                          <div className="px-2 py-1.5 text-[10px] bg-[#121826] text-gray-300 flex justify-between items-center group-hover:bg-[#1a2333] transition-colors">
                             Foto 1 <Eye className="w-3 h-3 text-gray-500" />
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                       </div>
                       <div className="w-24 shrink-0 rounded-lg border border-white/10 overflow-hidden group cursor-pointer relative">
                          <Image src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=200&auto=format&fit=crop" width={200} height={64} alt="Foto 2" unoptimized className="w-full h-16 object-cover" referrerPolicy="no-referrer" />
                          <div className="px-2 py-1.5 text-[10px] bg-[#121826] text-gray-300 flex justify-between items-center group-hover:bg-[#1a2333] transition-colors">
                             Foto 2 <Eye className="w-3 h-3 text-gray-500" />
                          </div>
                       </div>
                       <div className="w-20 shrink-0 rounded-lg border border-white/10 overflow-hidden group cursor-pointer relative flex flex-col items-center bg-[#1e2536] pt-3">
                          <FileText className="w-6 h-6 text-red-400 mb-2" />
                          <div className="w-full text-center px-2 py-1.5 text-[10px] bg-[#121826] text-gray-300 group-hover:bg-[#1a2333] transition-colors">
                             ART.pdf
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">Antes e depois</h3>
                    <div className="flex items-center gap-3 pt-1">
                       <div className="flex-1 bg-[#121826] border border-white/5 p-3 rounded-lg flex flex-col items-center justify-center gap-1.5">
                          <span className="text-[11px] text-gray-500">Antes</span>
                          <span className="text-[13px] font-medium text-red-500">Risco crítico</span>
                       </div>
                       <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />
                       <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex flex-col items-center justify-center gap-1.5">
                          <span className="text-[11px] text-gray-500">Depois</span>
                          <span className="text-[13px] font-medium text-emerald-400">Risco baixo</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">Impacto desta ação</h3>
                    <div className="space-y-2.5 pt-1">
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <AlertTriangle className="w-3.5 h-3.5" /> Risco mitigado
                          </div>
                          <span className="text-gray-300">Crítico <span className="text-gray-500 mx-1">→</span> <span className="text-emerald-400">Baixo</span></span>
                       </div>
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <CheckCircle2 className="w-3.5 h-3.5" /> Efetividade
                          </div>
                          <span className="text-emerald-400 font-medium">Alta (90%)</span>
                       </div>
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <ShieldAlert className="w-3.5 h-3.5" /> Redução de risco estimada
                          </div>
                          <span className="text-emerald-400 font-medium">-25%</span>
                       </div>
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <DollarSign className="w-3.5 h-3.5" /> Multa evitada
                          </div>
                          <span className="text-yellow-500 font-medium">R$ 18.500,00</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-white font-medium">Progresso da ação</span>
                       <span className="text-emerald-400 font-bold">100%</span>
                    </div>
                    <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden">
                       <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `100%` }}></div>
                    </div>
                 </div>
               </>
            )}

            {/* Progresso da Execução (only for Em andamento) */}
            {isAndamento && (
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-white font-medium">Progresso da execução</span>
                    <span className="text-white font-bold">{Math.max(0, acao.progresso || 0)} %</span>
                 </div>
                 <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${acao.progresso}%` }}></div>
                 </div>
                 <div className="text-[11px] text-gray-500 pt-1">
                    Em andamento desde {acao.iniciadoEm ? new Date(acao.iniciadoEm).toLocaleDateString('pt-BR') : '30/05/2025'}
                 </div>
              </div>
            )}

            {/* Checklist de execução (only for Em andamento) */}
            {isAndamento && (
               <div className="space-y-4">
                  <h3 className="text-[13px] font-medium text-white">Checklist de execução</h3>
                  <div className="space-y-3">
                     <div className="flex items-start justify-between text-[13px] gap-3">
                        <div className="flex items-start gap-2.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <span className="text-gray-300">Identificar EPIs vencidos</span>
                        </div>
                        <span className="text-gray-500 text-[12px]">30/05</span>
                     </div>
                     <div className="flex items-start justify-between text-[13px] gap-3">
                        <div className="flex items-start gap-2.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <span className="text-gray-300">Aprovar aquisição</span>
                        </div>
                        <span className="text-gray-500 text-[12px]">31/05</span>
                     </div>
                     <div className="flex items-start justify-between text-[13px] gap-3">
                        <div className="flex items-start gap-2.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <span className="text-gray-300">Receber novos EPIs</span>
                        </div>
                        <span className="text-gray-500 text-[12px]">01/06</span>
                     </div>
                     <div className="flex items-start justify-between text-[13px] gap-3">
                        <div className="flex items-start gap-2.5">
                           <Circle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 border-2 border-blue-500 rounded-full bg-blue-500/20" />
                           <span className="text-gray-300">Substituir e registrar entrega</span>
                        </div>
                        <span className="text-gray-500 text-[12px]">Em andamento</span>
                     </div>
                     <div className="flex items-start justify-between text-[13px] gap-3">
                        <div className="flex items-start gap-2.5">
                           <Circle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                           <span className="text-gray-500">Treinar equipe sobre uso</span>
                        </div>
                        <span className="text-gray-500 text-[12px]">Pendente</span>
                     </div>
                  </div>
               </div>
            )}

            {/* Próximos passos */}
            {!isConcluida && (
            <div>
               <h3 className="text-[13px] font-medium text-white mb-3">Próximos passos</h3>
               {isAndamento ? (
                  <ul className="list-disc list-inside text-[13px] text-gray-400 space-y-2 marker:text-gray-600">
                     <li>Concluir distribuição dos EPIs para a equipe do turno B</li>
                     <li>Registrar entrega e assinatura dos colaboradores</li>
                  </ul>
               ) : (
                  <ol className="list-decimal list-inside text-[13px] text-gray-400 space-y-2 marker:text-gray-600">
                     <li>Planejar e isolar a área de trabalho</li>
                     <li>Instalar ponto de ancoragem intermediário</li>
                     <li>Verificar tensão e fixação do cabo</li>
                     <li>Registrar evidências e anexar ART</li>
                  </ol>
               )}
            </div>
            )}

            {/* Metadados */}
            {!isConcluida && (
            <div className="space-y-0 text-[13px] border-t border-white/5 pt-4">
               {(!isAndamento) && (
                  <div className="flex items-center py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 w-1/2 text-gray-400">
                        <Factory className="w-4 h-4" />
                        <span>Setor</span>
                     </div>
                     <div className="w-1/2 text-gray-200">{acao.setor || 'Obras / Estruturas'}</div>
                  </div>
               )}
               
               <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-gray-400">
                     <User className="w-4 h-4" />
                     <span>Responsável</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-gray-200 text-[13px]">{acao.responsavel}</span>
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${avatarColor}`}>
                        {rInitials}
                     </div>
                  </div>
               </div>

               {isAndamento && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 text-gray-400">
                        <Factory className="w-4 h-4" />
                        <span>Setor</span>
                     </div>
                     <div className="text-gray-200">{acao.setor || 'Obras / Estruturas'}</div>
                  </div>
               )}

               <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-gray-400">
                     <AlertTriangle className="w-4 h-4" />
                     <span>Risco vinculado</span>
                  </div>
                  <div className="text-gray-200 flex items-center gap-2">
                     {acao.riscoVinculado || '-'}
                     {acao.riscoStatus && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">{acao.riscoStatus}</span>}
                  </div>
               </div>

               {acao.riscoSeveridade && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 text-gray-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Severidade do risco</span>
                     </div>
                     <div className="text-gray-200">{acao.riscoSeveridade}</div>
                  </div>
               )}

               <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-gray-400">
                     <ClipboardCheck className="w-4 h-4" />
                     <span>Origem</span>
                  </div>
                  <div className="text-gray-200">
                     {acao.origem || (acao.inspecaoId ? 'Inspeção' : acao.riscoId ? 'Risco' : 'Manual')}
                     {acao.inspecaoId && ` (Insp. ${acao.inspecaoId.split('-')[1] || acao.inspecaoId})`}
                  </div>
               </div>

               {acao.perguntaOrigem && (
                  <div className="flex items-start py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 w-1/3 text-gray-400 mt-0.5">
                        <ListChecks className="w-4 h-4" />
                        <span>Checklist / Pergunta</span>
                     </div>
                     <div className="w-2/3 text-gray-200 leading-snug">{acao.perguntaOrigem}</div>
                  </div>
               )}

               {acao.respostaOrigem && (
                  <div className="flex items-start py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 w-1/3 text-gray-400 mt-0.5">
                        <ListChecks className="w-4 h-4" />
                        <span>Resposta dada</span>
                     </div>
                     <div className="w-2/3 text-gray-200 leading-snug">{acao.respostaOrigem}</div>
                  </div>
               )}

               {acao.nrRelacionada && acao.nrRelacionada !== 'Não informada' && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 text-gray-400">
                        <span>NR</span>
                     </div>
                     <div className="text-gray-200">{acao.nrRelacionada}</div>
                  </div>
               )}

               {isAndamento && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 text-gray-400">
                        <CalendarClock className="w-4 h-4" />
                        <span>Data de início</span>
                     </div>
                     <div className="text-gray-200">{acao.iniciadoEm ? new Date(acao.iniciadoEm).toLocaleDateString('pt-BR') : '30/05/2025'}</div>
                  </div>
               )}

               {(!isAndamento) && (
                  <div className="flex items-start py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 w-1/2 text-gray-400 mt-0.5">
                        <CalendarClock className="w-4 h-4" />
                        <span>Prazo</span>
                     </div>
                     <div className="w-1/2">
                        <div className="text-gray-200">{acao.prazo}</div>
                        {acao.status === 'Vencida' && <div className="text-[11px] text-red-500 font-medium mt-0.5">Vencida há alguns dias</div>}
                     </div>
                  </div>
               )}

               {isAndamento && (
                  <div className="flex items-start justify-between py-3 border-b border-white/5">
                     <div className="flex items-center gap-2.5 text-gray-400 mt-0.5">
                        <CalendarClock className="w-4 h-4" />
                        <span>Prazo</span>
                     </div>
                     <div className="text-right">
                        <div className="text-gray-200">{acao.prazo}</div>
                        {prazoInfo.label && <div className={`text-[11px] font-medium mt-0.5 ${prazoInfo.diffDays !== null && prazoInfo.diffDays < 0 ? 'text-red-500' : 'text-orange-400'}`}>{prazoInfo.label}</div>}
                     </div>
                  </div>
               )}

               {(!isAndamento) && (
                  <div className="flex items-start py-3">
                     <div className="flex items-center gap-2.5 w-1/2 text-gray-400 mt-0.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Multa / Impacto potencial</span>
                     </div>
                     <div className="w-1/2">
                        <div className="text-gray-200 font-medium tracking-wide">
                           {acao.multaEstimada ? `R$ ${acao.multaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 25.000,00'}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{acao.chanceIncidente ? `Chance: ${acao.chanceIncidente}` : 'Interdição e autuação'}</div>
                     </div>
                  </div>
               )}
            </div>
            )}

            {/* Follow-up automático */}
            {acao.followUp && acao.followUp.ativo && (
               <div className="bg-[#121826] border border-white/5 rounded-[10px] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[13px] text-indigo-400 font-medium border-b border-white/5 pb-2">
                     <Clock className="w-4 h-4" />
                     Follow-up automático
                  </div>
                  
                  <div className="space-y-2 text-[12px]">
                     <div className="flex justify-between items-center text-gray-400">
                        <span>Nível</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                           acao.followUp.nivel === 'urgente' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                           acao.followUp.nivel === 'atenção' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                           acao.followUp.nivel === 'bloqueada' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                           'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>{acao.followUp.nivel.toUpperCase()}</span>
                     </div>
                     <div className="flex justify-between items-center text-gray-400">
                        <span>Requer atualização?</span>
                        <span className={acao.followUp.precisaFollowUp ? 'text-orange-400' : 'text-emerald-400'}>
                           {acao.followUp.precisaFollowUp ? 'Sim' : 'Não'}
                        </span>
                     </div>
                     {acao.followUp.escalado && (
                        <div className="flex justify-between items-center text-gray-400">
                           <span>Escalonada</span>
                           <span className="text-pink-400 font-medium">Sim ({acao.followUp.escaladoPara})</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center text-gray-400 border-t border-white/5 pt-2 mt-2">
                        <span>Mensagem do sistema</span>
                     </div>
                     <div className="bg-black/20 p-2 rounded text-gray-300 italic">
                        &quot;{acao.followUp.ultimaMensagem || 'Nenhuma pendência.'}&quot;
                     </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/5">
                     <button 
                        onClick={() => {
                           setProgressoLocal(acao.progresso || 0);
                           setShowUpdateModal(true);
                        }}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-[11px] font-medium transition-colors"
                     >
                        Registrar atualização
                     </button>
                     <button 
                        onClick={() => {
                           if (forcarFollowUp) forcarFollowUp();
                        }}
                        className="flex-1 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded text-[11px] font-medium transition-colors"
                     >
                        Forçar follow-up
                     </button>
                  </div>
               </div>
            )}

            {/* Impedimentos / Bloqueios (only for Em andamento) */}
            {isAndamento && (
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[13px] text-orange-400 font-medium">
                     <AlertTriangle className="w-4 h-4" />
                     Impedimentos / Bloqueios
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-[8px] p-4 text-[13px] text-orange-200/90 leading-relaxed">
                     Aguardando liberação do pedido de compra pelo setor de Suprimentos.
                  </div>
               </div>
            )}

            {/* Progresso (SLA) para Pendentes */}
            {(!isAndamento && !isConcluida) && (
               <div className="bg-[#121826] p-4 rounded-[10px] border border-white/5">
                  <div className="flex justify-between items-center text-[12px] mb-3">
                     <span className="text-white font-medium">Progresso (SLA)</span>
                     <span className="text-gray-400">{acao.status === 'Pendente' ? 'Aguardando início' : acao.status}</span>
                  </div>
                  <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden mb-2">
                     <div className="bg-purple-500 h-full rounded-full w-0 transition-all duration-1000" style={{ width: `${acao.status === 'Pendente' ? 0 : acao.progresso}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Início esperado: {acao.prazo}</span>
                    <span className="text-gray-500">{acao.status === 'Pendente' ? '0% iniciado' : `${acao.progresso}% concluído`}</span>
                  </div>
               </div>
            )}
            
          </div>

          <div className="p-6 border-t border-white/5 shrink-0 bg-[#0c1018] space-y-2.5">
             {/* Escalonada */}
             {acao.followUp?.escalado && !isConcluida && (
                 <div className="flex flex-col gap-2.5">
                    <button className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">
                      Registrar resposta ao escalonamento
                    </button>
                    <div className="flex items-center gap-2.5">
                       <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-lg font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 text-[13px]">Atualizar progresso</button>
                       <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-lg font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 text-[13px]">Reatribuir</button>
                    </div>
                 </div>
             )}

             {/* Pendente - No Prazo */}
             {acao.status === 'Pendente' && !acao.followUp?.escalado && (
                <div className="flex flex-col gap-2.5">
                   <button onClick={() => { iniciarAcao(acao.id); onClose(); }} className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">
                     <Play className="w-4 h-4 fill-current" /> Iniciar ação
                   </button>
                   <div className="flex items-center gap-2.5">
                      <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Registrar atualização</button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Reatribuir</button>
                   </div>
                   {renderIntegrationButtons()}
                </div>
             )}

             {/* Pendente - Vencida */}
             {acao.status === 'Vencida' && !acao.followUp?.escalado && (
                <div className="flex flex-col gap-2.5">
                   <button onClick={() => { iniciarAcao(acao.id); onClose(); }} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">
                     <Play className="w-4 h-4 fill-current" /> Iniciar com prioridade
                   </button>
                   <div className="flex items-center gap-2.5">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><UserPlus className="w-4 h-4"/> Reatribuir</button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Registrar justificativa</button>
                   </div>
                   {renderIntegrationButtons()}
                </div>
             )}

             {/* Em andamento */}
             {isAndamento && !acao.followUp?.escalado && (
                <div className="flex flex-col gap-2.5">
                   {acao.followUp?.precisaFollowUp ? (
                     <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">
                       Registrar atualização
                     </button>
                   ) : (
                     <div className="flex items-center gap-2.5">
                        <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">Atualizar progresso</button>
                        <button onClick={() => setShowConfirmClose(true)} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-3 rounded-lg font-medium transition-colors border border-emerald-500/20 flex items-center justify-center gap-2 text-[13px]">Concluir</button>
                     </div>
                   )}
                   <div className="flex items-center gap-2.5">
                      {acao.followUp?.precisaFollowUp && (
                         <>
                           <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Atualizar</button>
                           <button onClick={() => setShowConfirmClose(true)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Concluir</button>
                         </>
                      )}
                      {!acao.followUp?.precisaFollowUp && (
                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Registrar bloqueio</button>
                      )}
                   </div>
                   {renderIntegrationButtons()}
                </div>
             )}

             {/* Concluída */}
             {isConcluida && (
                <div className="flex flex-col gap-2.5">
                   {(acao.riscoId || acao.inspecaoId) && (
                      <div className="flex items-center gap-2.5 w-full">
                         {acao.riscoId && <button onClick={() => window.location.href='/operacao/riscos'} className="flex-1 bg-white/5 hover:bg-white/10 text-orange-400 hover:text-orange-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4" /> Ver risco</button>}
                         {acao.inspecaoId && <button onClick={() => window.location.href='/operacao/inspecoes'} className="flex-1 bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" /> Ver inspeção</button>}
                      </div>
                   )}
                   <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Ver evidências</button>
                   <button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white mt-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-[13px]">Fechar painel</button>
                </div>
             )}
          </div>
        </div>
      </motion.div>

      {/* Confirmação de Conclusão */}
      <AnimatePresence>
        {showConfirmClose && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
           >
              <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="bg-[#121826] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5 mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 </div>
                 <h2 className="text-lg font-medium text-white text-center mb-2">Confirmar conclusão da ação</h2>
                 <p className="text-[13px] text-gray-400 text-center mb-6">Tem certeza que esta ação foi concluída?</p>
                 
                 <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-[13px]">
                       <span className="text-gray-400">Ação:</span>
                       <span className="text-white font-medium text-right max-w-[200px] truncate">{acao.titulo}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                       <span className="text-gray-400">Responsável:</span>
                       <span className="text-white">{acao.responsavel}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                       <span className="text-gray-400">Risco:</span>
                       <span className="text-white">{acao.riscoVinculado || '-'}</span>
                    </div>
                 </div>

                 <div className="mb-6">
                     <label className="text-[13px] text-gray-400 block mb-2">
                        Considerações finais (Opcional)
                     </label>
                     <textarea
                        value={comentarioLocal}
                        onChange={e => setComentarioLocal(e.target.value)}
                        className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                        placeholder="Deixe um comentário sobre a conclusão..."
                     />
                 </div>

                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowConfirmClose(false)}
                       className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                          concluirAcao(acao.id, comentarioLocal);
                          setShowConfirmClose(false);
                          setComentarioLocal('');
                          onClose();
                       }}
                       className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                    >
                       Sim, concluir ação
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Atualizar Progresso */}
      <AnimatePresence>
        {showUpdateModal && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
           >
              <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="bg-[#121826] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                 <h2 className="text-lg font-medium text-white mb-4">Atualizar Progresso</h2>
                 
                 <div className="space-y-4">
                    <div>
                        <label className="text-[13px] text-gray-400 block mb-2">
                           Progresso ({progressoLocal}%)
                        </label>
                        <input 
                           type="range" 
                           min="0" 
                           max="100" 
                           value={progressoLocal} 
                           onChange={e => setProgressoLocal(Number(e.target.value))}
                           className="w-full accent-purple-500"
                        />
                    </div>
                    <div>
                        <label className="text-[13px] text-gray-400 block mb-2">
                           Comentário / Observação (Opcional)
                        </label>
                        <textarea
                           value={comentarioLocal}
                           onChange={e => setComentarioLocal(e.target.value)}
                           className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-purple-500 min-h-[80px]"
                           placeholder="O que foi feito..."
                        />
                    </div>
                 </div>

                 <div className="flex gap-3 mt-6">
                    <button 
                       onClick={() => setShowUpdateModal(false)}
                       className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                          atualizarProgresso(acao.id, progressoLocal, comentarioLocal);
                          setShowUpdateModal(false);
                          setComentarioLocal('');
                       }}
                       className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                    >
                       Salvar
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
