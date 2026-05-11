"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, AlertTriangle, CheckCircle2, Factory, User, ShieldAlert, ClipboardCheck, ListChecks, CalendarClock, DollarSign, ExternalLink, UserPlus, RefreshCw, Circle, BookOpen, FileText, ArrowRight, Eye, Clock, Info, ShieldCheck, Bot } from 'lucide-react';
import Image from 'next/image';
import { ActionItem } from '../types';
import { actionRequiresEvidence, validateActionCompletion } from '@/lib/action-rules';

interface Props {
  acao: ActionItem;
  onClose: () => void;
  iniciarAcao: (id: string) => void;
  atualizarProgresso: (id: string, novoProgresso: number, comentario?: string) => void;
  concluirAcao: (id: string, observacaoFinal?: string, validacaoPayload?: any, evidenciaPayloads?: any[]) => void;
  enviarParaValidacao?: (id: string, observacao?: string, evidenciaPayloads?: any[]) => void;
  rejeitarValidacao?: (id: string, motivo: string) => void;
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
  
  if (diffDays < 0) return { diffDays, label: `Vencida hÃ¡ ${Math.abs(diffDays)} dias` };
  if (diffDays === 0) return { diffDays, label: 'Vence hoje' };
  return { diffDays, label: `${diffDays} dias restantes` };
}

export default function DrawerAcao({ acao, onClose, iniciarAcao, atualizarProgresso, concluirAcao, enviarParaValidacao, rejeitarValidacao, reatribuirAcao, cancelarAcao, reabrirAcao, forcarFollowUp }: Props) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [progressoLocal, setProgressoLocal] = useState(acao?.progresso || 0);
  const [comentarioLocal, setComentarioLocal] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [validationBasis, setValidationBasis] = useState('');

  if (!acao) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
       case 'Vencida': return 'text-red-400 border-red-500/30 bg-red-500/10';
       case 'Em andamento': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
       case 'ConcluÃ­da': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
       case 'Cancelada': return 'text-gray-400 border-gray-500/30 bg-white/5';
       default: return 'text-orange-400 border-orange-500/30 bg-orange-500/10'; // Pendente
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CrÃ­tica': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'Alta': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'MÃ©dia': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
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
  const isConcluida = acao.status === 'ConcluÃ­da';

  const renderIntegrationButtons = () => {
    if (!acao.riscoId && !acao.inspecaoId) return null;
    return (
      <div className="flex flex-col gap-2 mt-1">
        {acao.riscoId && (
          <button onClick={() => window.location.href='/riscos'} className="w-full bg-transparent border border-orange-500/20 hover:bg-orange-500/10 text-orange-400 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Abrir risco vinculado
          </button>
        )}
        {acao.inspecaoId && (
          <button onClick={() => window.location.href='/inspecoes'} className="w-full bg-transparent border border-blue-500/20 hover:bg-blue-500/10 text-blue-400 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Abrir inspeÃ§Ã£o vinculada
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
              <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">Detalhes da aÃ§Ã£o</h2>
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
                  <p className="text-[12px] text-red-200">Esta aÃ§Ã£o estÃ¡ vencida e precisa de prioridade imediata.</p>
               </div>
            )}
            {acao.followUp?.escalado && acao.status !== 'Vencida' && (
               <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-pink-200">Esta aÃ§Ã£o foi escalonada automaticamente por atraso ou ausÃªncia de atualizaÃ§Ã£o.</p>
               </div>
            )}
            {acao.followUp?.precisaFollowUp && !acao.followUp?.escalado && acao.status !== 'Vencida' && (
               <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-indigo-200">Esta aÃ§Ã£o estÃ¡ sem atualizaÃ§Ã£o recente. Registre progresso ou impedimento.</p>
               </div>
            )}
            {acao.followUp?.nivel === 'bloqueada' && (
               <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-orange-200">HÃ¡ um impedimento registrado que pode atrasar a conclusÃ£o.</p>
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
                   <h3 className="text-[12px] font-medium text-white">DescriÃ§Ã£o</h3>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     {acao.descricao || 'A linha de vida horizontal instalada na cobertura nÃ£o estÃ¡ conforme a NR 35. NecessÃ¡rio instalar ponto de ancoragem intermediÃ¡rio e verificar tensÃ£o do cabo.'}
                   </p>
                </div>
              )}
            </div>

            {/* RASTREABILIDADE TOTAL - LINHAGEM DA AÃ‡ÃƒO */}
            <div className="mt-8 pt-2 border-t border-white/5 space-y-4">
               <h3 className="text-sm font-bold text-blue-400 mb-6 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Rastreabilidade e VÃ­nculos
               </h3>

               <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-6">
                  {/* Passo 1: InspeÃ§Ã£o/Origem */}
                  <div className="relative">
                     <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-emerald-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     </div>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Origem / FundamentaÃ§Ã£o Legal</p>
                     <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
                        {acao.inspecaoId ? (
                           <>
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2 text-emerald-400 font-medium text-[13px]">
                                    <ShieldCheck className="w-4 h-4" /> InspeÃ§Ã£o de Rota
                                 </div>
                                 <button onClick={() => window.location.href='/inspecoes'} className="text-[11px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-white transition-colors flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> Ver InspeÃ§Ã£o
                                 </button>
                              </div>
                              <p className="text-[13px] text-gray-200">
                                 <span className="text-gray-400">ID InspeÃ§Ã£o:</span> {acao.inspecaoId.substring(0,8).toUpperCase()}
                              </p>
                           </>
                        ) : (
                           <div className="flex items-center gap-2 text-blue-400 font-medium text-[13px]">
                              <Bot className="w-4 h-4" /> CriaÃ§Ã£o Direta / Motor de Risco
                           </div>
                        )}
                        
                        {(acao.nrRelacionada || (acao as any).nr) && (
                           <div className="pt-2 border-t border-white/5 mt-2">
                              <p className="text-[13px] text-gray-200">
                                 <span className="text-gray-400">Norma:</span> {acao.nrRelacionada || (acao as any).nr}
                              </p>
                              {acao.explicacaoNormativa && (
                                 <p className="text-[12px] text-gray-400 italic mt-1 leading-relaxed border-l-2 border-white/20 pl-2">
                                    &quot;{acao.explicacaoNormativa}&quot;
                                 </p>
                              )}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Passo 2: Risco Associado */}
                  <div className="relative">
                     <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-orange-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                     </div>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">CenÃ¡rio de Risco (Problema)</p>
                     <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2 text-orange-400 font-medium text-[13px]">
                              <AlertTriangle className="w-4 h-4" /> Risco Vinculado
                           </div>
                           {acao.riscoId && (
                              <button onClick={() => window.location.href='/operacao/riscos'} className="text-[11px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-white transition-colors flex items-center gap-1">
                                 <ExternalLink className="w-3 h-3" /> Ver Risco
                              </button>
                           )}
                        </div>
                        <p className="text-[13px] text-gray-200 leading-relaxed">
                           {acao.riscoVinculado || '-'}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                           <div>
                              <p className="text-[11px] text-gray-500">Perfil Exposto</p>
                              <p className="text-[12px] font-medium text-gray-200">{acao.perfilExposto || '-'} ({acao.trabalhadoresExpostos || 0} p.)</p>
                           </div>
                           <div>
                              <p className="text-[11px] text-gray-500">Dano FÃ­sico Potencial</p>
                              <p className="text-[12px] font-medium text-red-400 leading-tight">{acao.impactoHumano || 'Dano Ã  integridade fÃ­sica'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Passo 3: AtuaÃ§Ã£o de Pessoas */}
                  <div className="relative">
                     <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                     </div>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">CenÃ¡rio de AtuaÃ§Ã£o (SoluÃ§Ã£o)</p>
                     <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <p className="text-[11px] text-gray-500 mb-1">AÃ§Ã£o designada a (Executor)</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                    {acao.executor?.charAt(0) || 'E'}
                                 </div>
                                 <span className="text-[13px] text-gray-300 truncate">{acao.executor || 'A definir'}</span>
                              </div>
                           </div>
                           <div>
                              <p className="text-[11px] text-gray-500 mb-1">ResponsÃ¡vel pela ValidaÃ§Ã£o</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold text-[10px]">
                                    {acao.validador?.charAt(0) || 'V'}
                                 </div>
                                 <span className="text-[13px] text-gray-300 truncate">{acao.validador || 'SST'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Content for ConcluÃ­da */}
            {isConcluida && (
               <>
                 <div className="grid grid-cols-2 gap-y-4 text-[13px]">
                    <div className="flex items-center gap-2 text-gray-300">
                       <User className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">ResponsÃ¡vel</span>
                       <div className="flex items-center gap-1.5 ml-auto text-white">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${avatarColor}`}>
                             {rInitials}
                          </div>
                          {acao.responsavel}
                       </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-start-1">
                       <CalendarClock className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">ConcluÃ­da em</span>
                       <span className="ml-auto text-white">
                          {acao.concluidoEm ? new Date(acao.concluidoEm).toLocaleDateString('pt-BR') : '05/05/2024'} Ã s 14:32
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <AlertTriangle className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">Risco vinculado</span>
                       <span className="ml-auto text-white truncate max-w-[200px]">{acao.riscoVinculado || 'Esmagamento de membros superiores'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <ClipboardCheck className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-32">InspeÃ§Ã£o vinculada</span>
                       <span className="ml-auto text-white">Auditoria Interna - 28/04/</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                       <BookOpen className="w-4 h-4 text-gray-500" />
                       <span className="text-gray-400 w-24">NR aplicÃ¡vel</span>
                       <span className="ml-auto text-white">NR-12</span>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">O que foi feito / ComentÃ¡rios</h3>
                    <div className="text-[13px] text-gray-400 leading-relaxed pt-1 space-y-2">
                       {acao.comentarios && acao.comentarios.length > 0 ? (
                         acao.comentarios.map((comentario, index) => (
                           <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/5">
                             {comentario}
                           </div>
                         ))
                       ) : (
                         <div className="italic text-gray-500">Nenhum comentÃ¡rio registrado ainda.</div>
                       )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">EvidÃªncias e anexos</h3>
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
                          <span className="text-[13px] font-medium text-red-500">Risco crÃ­tico</span>
                       </div>
                       <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />
                       <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex flex-col items-center justify-center gap-1.5">
                          <span className="text-[11px] text-gray-500">Depois</span>
                          <span className="text-[13px] font-medium text-emerald-400">Risco baixo</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-[13px] font-medium text-white border-b border-white/5 pb-2">Impacto desta aÃ§Ã£o</h3>
                    <div className="space-y-2.5 pt-1">
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <AlertTriangle className="w-3.5 h-3.5" /> Risco mitigado
                          </div>
                          <span className="text-gray-300">CrÃ­tico <span className="text-gray-500 mx-1">â†’</span> <span className="text-emerald-400">Baixo</span></span>
                       </div>
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <CheckCircle2 className="w-3.5 h-3.5" /> Efetividade
                          </div>
                          <span className="text-emerald-400 font-medium">Alta (90%)</span>
                       </div>
                       <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center gap-2 text-gray-400">
                             <ShieldAlert className="w-3.5 h-3.5" /> ReduÃ§Ã£o de risco estimada
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
                       <span className="text-white font-medium">Progresso da aÃ§Ã£o</span>
                       <span className="text-emerald-400 font-bold">100%</span>
                    </div>
                    <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden">
                       <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `100%` }}></div>
                    </div>
                 </div>
               </>
            )}

            {/* Progresso da ExecuÃ§Ã£o (only for Em andamento) */}
            {isAndamento && (
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-white font-medium">Progresso da execuÃ§Ã£o</span>
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

            {/* Checklist de execuÃ§Ã£o (only for Em andamento) */}
            {isAndamento && (
               <div className="space-y-4">
                  <h3 className="text-[13px] font-medium text-white">Checklist de execuÃ§Ã£o</h3>
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
                           <span className="text-gray-300">Aprovar aquisiÃ§Ã£o</span>
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

            {/* PrÃ³ximos passos */}
            {!isConcluida && (
            <div>
               <h3 className="text-[13px] font-medium text-white mb-3">PrÃ³ximos passos</h3>
               {isAndamento ? (
                  <ul className="list-disc list-inside text-[13px] text-gray-400 space-y-2 marker:text-gray-600">
                     <li>Concluir distribuiÃ§Ã£o dos EPIs para a equipe do turno B</li>
                     <li>Registrar entrega e assinatura dos colaboradores</li>
                  </ul>
               ) : (
                  <ol className="list-decimal list-inside text-[13px] text-gray-400 space-y-2 marker:text-gray-600">
                     <li>Planejar e isolar a Ã¡rea de trabalho</li>
                     <li>Instalar ponto de ancoragem intermediÃ¡rio</li>
                     <li>Verificar tensÃ£o e fixaÃ§Ã£o do cabo</li>
                     <li>Registrar evidÃªncias e anexar ART</li>
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
                     <span>ResponsÃ¡vel</span>
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
                     {acao.origem || (acao.inspecaoId ? 'InspeÃ§Ã£o' : acao.riscoId ? 'Risco' : 'Manual')}
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

               {acao.nrRelacionada && (
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
                        <span>Data de inÃ­cio</span>
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
                        {acao.status === 'Vencida' && <div className="text-[11px] text-red-500 font-medium mt-0.5">Vencida hÃ¡ alguns dias</div>}
                     </div>
                  </div>
               )}

               {acao.validacao && (
                  <div className="flex items-start py-3 border-b border-emerald-500/20 bg-emerald-500/5 px-3 rounded-lg mt-3">
                     <div className="flex gap-2.5 w-1/3 text-emerald-400 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium text-[13px]">ValidaÃ§Ã£o</span>
                     </div>
                     <div className="w-2/3 space-y-1 text-[13px]">
                        <p><span className="text-gray-400">Validador:</span> <span className="font-medium text-emerald-300">{acao.validacao.validador}</span></p>
                        <p><span className="text-gray-400">Base documentada:</span> <span className="text-gray-200">{acao.validacao.baseadoEm}</span></p>
                        <p><span className="text-gray-400">Data:</span> <span className="text-gray-200">{new Date(acao.validacao.data).toLocaleString('pt-BR')}</span></p>
                        {acao.validacao.comentarios && <p className="italic text-gray-400 mt-1">&quot;{acao.validacao.comentarios}&quot;</p>}
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
                        <div className="text-[11px] text-gray-500 mt-0.5">{acao.chanceIncidente ? `Chance: ${acao.chanceIncidente}` : 'InterdiÃ§Ã£o e autuaÃ§Ã£o'}</div>
                     </div>
                  </div>
               )}
            </div>
            )}

            {/* Follow-up automÃ¡tico */}
            {acao.followUp && acao.followUp.ativo && (
               <div className="bg-[#121826] border border-white/5 rounded-[10px] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[13px] text-indigo-400 font-medium border-b border-white/5 pb-2">
                     <Clock className="w-4 h-4" />
                     Follow-up automÃ¡tico
                  </div>
                  
                  <div className="space-y-2 text-[12px]">
                     <div className="flex justify-between items-center text-gray-400">
                        <span>NÃ­vel</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                           acao.followUp.nivel === 'urgente' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                           acao.followUp.nivel === 'atenÃ§Ã£o' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                           acao.followUp.nivel === 'bloqueada' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                           'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>{acao.followUp.nivel.toUpperCase()}</span>
                     </div>
                     <div className="flex justify-between items-center text-gray-400">
                        <span>Requer atualizaÃ§Ã£o?</span>
                        <span className={acao.followUp.precisaFollowUp ? 'text-orange-400' : 'text-emerald-400'}>
                           {acao.followUp.precisaFollowUp ? 'Sim' : 'NÃ£o'}
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
                        &quot;{acao.followUp.ultimaMensagem || 'Nenhuma pendÃªncia.'}&quot;
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
                        Registrar atualizaÃ§Ã£o
                     </button>
                     <button 
                        onClick={() => {
                           if (forcarFollowUp) forcarFollowUp();
                        }}
                        className="flex-1 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded text-[11px] font-medium transition-colors"
                     >
                        ForÃ§ar follow-up
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
                     Aguardando liberaÃ§Ã£o do pedido de compra pelo setor de Suprimentos.
                  </div>
               </div>
            )}

            {/* Progresso (SLA) para Pendentes */}
            {(!isAndamento && !isConcluida) && (
               <div className="bg-[#121826] p-4 rounded-[10px] border border-white/5">
                  <div className="flex justify-between items-center text-[12px] mb-3">
                     <span className="text-white font-medium">Progresso (SLA)</span>
                     <span className="text-gray-400">{acao.status === 'Pendente' ? 'Aguardando inÃ­cio' : acao.status}</span>
                  </div>
                  <div className="w-full bg-[#1e2536] rounded-full h-[6px] overflow-hidden mb-2">
                     <div className="bg-purple-500 h-full rounded-full w-0 transition-all duration-1000" style={{ width: `${acao.status === 'Pendente' ? 0 : acao.progresso}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">InÃ­cio esperado: {acao.prazo}</span>
                    <span className="text-gray-500">{acao.status === 'Pendente' ? '0% iniciado' : `${acao.progresso}% concluÃ­do`}</span>
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
                     <Play className="w-4 h-4 fill-current" /> Iniciar aÃ§Ã£o
                   </button>
                   <div className="flex items-center gap-2.5">
                      <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Registrar atualizaÃ§Ã£o</button>
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
                   {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' ? (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-3 relative overflow-hidden">
                        {(acao.executor && acao.validador && acao.executor === acao.validador) && (
                           <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-400 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg border-b border-l border-yellow-500/30">
                              Conflito: Executor = Validador
                           </div>
                        )}
                        <div className="flex items-center gap-2 mb-2 text-emerald-400 mt-2">
                           <CheckCircle2 className="w-4 h-4" />
                           <h4 className="text-[13px] font-bold">AÃ§Ã£o em ValidaÃ§Ã£o</h4>
                        </div>
                        <p className="text-[12px] text-gray-400">A evidÃªncia foi enviada. O validador ({acao.validador || 'SST'}) precisa aprovar antes do fechamento definitivo.</p>
                        
                        {(acao.executor && acao.validador && acao.executor === acao.validador) && (
                           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-[11px] text-yellow-500/90 leading-tight">
                              <AlertTriangle className="w-3 h-3 inline mb-0.5 mr-1" />
                              <strong>Alerta de Compliance:</strong> O sistema detectou que a mesma pessoa que executou tenta validar. Isso reduz a confiabilidade da aÃ§Ã£o.
                           </div>
                        )}

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-500/20">
                           <button onClick={() => { rejeitarValidacao && rejeitarValidacao(acao.id, "EvidÃªncia insuficiente"); onClose(); }} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded text-[12px] font-medium transition-colors border border-white/10">Rejeitar</button>
                           <button onClick={() => setShowConfirmClose(true)} className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 py-2 rounded font-medium transition-colors border border-emerald-500/30 text-[12px]">Validar Agora</button>
                        </div>
                     </div>
                   ) : (
                     <>
                        {acao.followUp?.precisaFollowUp ? (
                          <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">
                            Registrar atualizaÃ§Ã£o
                          </button>
                        ) : (
                          <div className="flex items-center gap-2.5">
                             <button onClick={() => { setProgressoLocal(acao.progresso || 0); setShowUpdateModal(true); }} className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[13px]">Atualizar progresso</button>
                             {['CrÃ­tica', 'Alta', 'MÃ©dia'].includes(acao.prioridade) ? (
                                <button onClick={() => setShowConfirmClose(true)} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-3 rounded-lg font-medium transition-colors border border-emerald-500/20 flex items-center justify-center gap-2 text-[13px]">Enviar EvidÃªncia</button>
                             ) : (
                                <button onClick={() => setShowConfirmClose(true)} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-3 rounded-lg font-medium transition-colors border border-emerald-500/20 flex items-center justify-center gap-2 text-[13px]">Concluir</button>
                             )}
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 mt-2">
                           <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><UserPlus className="w-4 h-4"/> Colaborar</button>
                           <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10">Registrar bloqueio</button>
                        </div>
                     </>
                   )}
                   {renderIntegrationButtons()}
                </div>
             )}

             {/* ConcluÃ­da */}
             {isConcluida && (
                <div className="flex flex-col gap-2.5">
                   {(acao.riscoId || acao.inspecaoId) && (
                      <div className="flex items-center gap-2.5 w-full">
                         {acao.riscoId && <button onClick={() => window.location.href='/riscos'} className="flex-1 bg-white/5 hover:bg-white/10 text-orange-400 hover:text-orange-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4" /> Ver risco</button>}
                         {acao.inspecaoId && <button onClick={() => window.location.href='/inspecoes'} className="flex-1 bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" /> Ver inspeÃ§Ã£o</button>}
                      </div>
                   )}
                   <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-lg text-[13px] font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Ver evidÃªncias</button>
                   <button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white mt-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-[13px]">Fechar painel</button>
                </div>
             )}
          </div>
        </div>
      </motion.div>

      {/* ConfirmaÃ§Ã£o de ConclusÃ£o / Envio para ValidaÃ§Ã£o */}
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
                 <h2 className="text-lg font-medium text-white text-center mb-2">
                    {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' ? 'Validar e Concluir AÃ§Ã£o' : 
                     ['CrÃ­tica', 'Alta', 'MÃ©dia'].includes(acao.prioridade) ? 'Enviar para ValidaÃ§Ã£o' : 
                     'Concluir AÃ§Ã£o'}
                 </h2>
                 <p className="text-[13px] text-gray-400 text-center mb-6">
                    {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' ? 'Assine e forneÃ§a a base da validaÃ§Ã£o de seguranÃ§a.' : 
                     ['CrÃ­tica', 'Alta', 'MÃ©dia'].includes(acao.prioridade) ? 'FaÃ§a o upload das evidÃªncias da resoluÃ§Ã£o para revisÃ£o.' : 
                     'Tem certeza que deseja concluir esta aÃ§Ã£o?'}
                 </p>
                 
                 {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                       <div className="flex justify-between text-[13px]">
                          <span className="text-gray-400">AÃ§Ã£o:</span>
                          <span className="text-white font-medium text-right max-w-[200px] truncate">{acao.titulo}</span>
                       </div>
                       <div className="flex justify-between text-[13px]">
                          <span className="text-gray-400">Risco mitigado:</span>
                          <span className="text-white text-right max-w-[200px] truncate">{acao.riscoVinculado || '-'}</span>
                       </div>
                       <div className="flex justify-between text-[13px]">
                          <span className="text-gray-400">Validador Oficial:</span>
                          <span className="text-emerald-400 font-bold">{acao.validador || 'UsuÃ¡rio Atual'}</span>
                       </div>
                    </div>
                 )}

                 {acao.faseExecucao !== 'Aguardando ValidaÃ§Ã£o' && (
                    <div className="mb-4 space-y-3">
                        <div>
                           <label className="text-[13px] text-gray-400 block mb-2 font-medium">
                              Evidencia da execucao {actionRequiresEvidence(acao) && <span className="text-red-400">*</span>}
                           </label>
                           <textarea
                              value={evidenceDescription}
                              onChange={e => { setEvidenceDescription(e.target.value); setConfirmError(''); }}
                              className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-emerald-500 min-h-[72px]"
                              placeholder="Ex: Foto da protecao instalada, teste funcional aprovado e liberacao assinada"
                           />
                        </div>
                        <div>
                           <label className="text-[13px] text-gray-400 block mb-2 font-medium">
                              Referencia / link do arquivo
                           </label>
                           <input
                              type="text"
                              value={evidenceReference}
                              onChange={e => { setEvidenceReference(e.target.value); setConfirmError(''); }}
                              className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-emerald-500"
                              placeholder="Ex: pasta compartilhada, codigo do relatorio ou URL interna"
                           />
                        </div>
                    </div>
                 )}

                 {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' && (
                    <div className="mb-4">
                        <label className="text-[13px] text-gray-400 block mb-2 font-medium">
                           O que comprova que o risco foi de fato eliminado/mitigado? <span className="text-red-400">*</span>
                        </label>
                        <input
                           type="text"
                           value={validationBasis}
                           onChange={e => { setValidationBasis(e.target.value); setConfirmError(''); }}
                           className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-emerald-500"
                           placeholder="Ex: Foto da protecao instalada e ART assinada"
                        />
                    </div>
                 )}

                 <div className="mb-6">
                     <label className="text-[13px] text-gray-400 block mb-2">
                        ConsideraÃ§Ãµes finais (Opcional)
                     </label>
                     <textarea
                        value={comentarioLocal}
                        onChange={e => setComentarioLocal(e.target.value)}
                        className="w-full bg-[#0c1018] border border-white/10 rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-emerald-500 min-h-[60px]"
                        placeholder={acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' ? "Justificativa da validaÃ§Ã£o..." : "Diga o que foi feito..."}
                     />
                 </div>

                 {confirmError && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
                       {confirmError}
                    </div>
                 )}

                 <div className="flex gap-3">
                    <button 
                       onClick={() => { setShowConfirmClose(false); setConfirmError(''); }}
                       className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                          const evidencePayloads = (() => {
                            if (!evidenceDescription.trim() && !evidenceReference.trim()) return [];
                            return [{
                              id: crypto.randomUUID(),
                              acaoId: acao.id,
                              riscoId: acao.riscoId,
                              inspecaoId: acao.inspecaoId,
                              tipo: evidenceReference.trim() ? 'Documento' : 'Foto',
                              descricao: evidenceDescription.trim() || `Evidencia registrada para a acao ${acao.titulo}`,
                              url: evidenceReference.trim() || `manual://evidencia/${acao.id}/${Date.now()}`,
                              referencia: evidenceReference.trim(),
                              enviadoPor: acao.responsavel || acao.validador || 'Responsavel da acao',
                              dataUpload: new Date().toISOString(),
                              contexto: 'Conclusao'
                            }];
                          })();

                          const completionErrors = validateActionCompletion(acao, evidencePayloads);
                          if (completionErrors.length > 0) {
                             setConfirmError(completionErrors[0]);
                             return;
                          }

                          try {
                            if (acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o') {
                               if (!validationBasis.trim()) {
                                  setConfirmError('Informe a base da validacao antes de concluir.');
                                  return;
                               }

                               concluirAcao(acao.id, comentarioLocal, {
                                  validador: acao.validador || 'UsuÃ¡rio Atual',
                                  decisao: 'Aprovado',
                                  baseadoEm: validationBasis.trim(),
                                  comentarios: comentarioLocal
                               }, evidencePayloads);
                            } else if (['CrÃ­tica', 'Alta', 'MÃ©dia'].includes(acao.prioridade)) {
                               enviarParaValidacao && enviarParaValidacao(acao.id, comentarioLocal, evidencePayloads);
                            } else {
                               concluirAcao(acao.id, comentarioLocal, undefined, evidencePayloads);
                            }
                          } catch (error) {
                            setConfirmError(error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.');
                            return;
                          }

                          setShowConfirmClose(false);
                          setComentarioLocal('');
                          setConfirmError('');
                          setEvidenceDescription('');
                          setEvidenceReference('');
                          setValidationBasis('');
                          onClose();
                       }}
                       className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-[13px] font-bold transition-colors"
                    >
                       {acao.faseExecucao === 'Aguardando ValidaÃ§Ã£o' ? 'Validar a AÃ§Ã£o' : 
                        ['CrÃ­tica', 'Alta', 'MÃ©dia'].includes(acao.prioridade) ? 'Enviar EvidÃªncia' : 
                        'Concluir a AÃ§Ã£o'}
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
                           ComentÃ¡rio / ObservaÃ§Ã£o (Opcional)
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


