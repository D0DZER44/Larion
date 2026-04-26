"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ArrowUp, Calendar, ChevronRight, Clock, FileText, Lock, MessageSquare, Send, ShieldCheck, Zap } from 'lucide-react';
import { LariContextEngine, NormativeEngine, RiskEngine, DecisionEngine } from '@/lib/engines';

type ActionItem = {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: React.ReactNode;
};

type MessageContent = {
  text: string;
  component?: React.ReactNode;
};

type Message = {
  id: string;
  sender: 'user' | 'bot';
  content: MessageContent;
  actions?: ActionItem[];
};

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  function handleSend(text: string) {
    if (!text.trim() || isTypingRef.current) return;
    
    isTypingRef.current = true;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: { text: text.trim() }
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    getBotResponse(text.trim());
  }

  const welcomeMessage = (
    <div className="flex flex-col items-center w-full pb-8 pt-8">
      <div className="flex flex-col items-center mb-8">
         <div className="relative mb-4">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
            <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-gradient-to-b from-[#1E1B4B] to-[#121826] flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
               <span className="text-3xl font-bold text-white">L</span>
               <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-[#121826] rounded-full"></div>
            </div>
         </div>
         <h2 className="text-xl font-bold text-white mb-1">L.A.R.I</h2>
         <p className="text-sm text-gray-400">Copiloto SST</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mb-8 text-center text-gray-300 text-[15px] leading-relaxed mx-auto">
         <p>Olá, sou a L.A.R.I — Copiloto SST, sua assistente inteligente de Saúde e Segurança.</p>
         <p className="mt-1">Posso te ajudar rapidamente com riscos, inspeções, ações e relatórios.</p>
      </div>

      <div className="w-full max-w-3xl pt-4 mx-auto">
         <div className="flex items-center gap-2 text-purple-400 mb-4 px-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">O que você pode fazer aqui</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
               { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, title: 'Consultar riscos críticos', desc: 'Veja os principais riscos e seu status atual.', msg: 'Consultar riscos críticos' },
               { icon: <ShieldCheck className="w-4 h-4 text-blue-400" />, title: 'Abrir inspeções pendentes', desc: 'Acompanhe inspeções não realizadas ou em aberto.', msg: 'Abrir inspeções pendentes' },
               { icon: <Clock className="w-4 h-4 text-orange-400" />, title: 'Cobrar ações atrasadas', desc: 'Identifique ações vencidas e ganhe agilidade.', msg: 'Cobrar ações atrasadas' },
            ].map((card, idx) => (
               <div 
                 key={idx} 
                 onClick={() => handleSend(card.msg)}
                 className="bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-colors group flex flex-col justify-between h-[130px]"
               >
                  <div className="flex items-center gap-2 mb-2">
                     {card.icon}
                     <h4 className="text-[14px] font-bold text-gray-200">{card.title}</h4>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                     <p className="text-[12px] text-gray-500 leading-relaxed flex-1">{card.desc}</p>
                     <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );

  const getBotResponse = (text: string) => {
    setTimeout(() => {
      setIsTyping(false);
      isTypingRef.current = false;
      
      const intent = LariContextEngine.classifyIntent(text);
      const engineText = LariContextEngine.respond(text, {}); // Pass state if needed
      
      let component: React.ReactNode = undefined;
      let actions: ActionItem[] = [];

      if (intent === 'Check_Risks') {
        component = (
          <div className="mt-4 bg-[#1e1b1d] border border-red-500/20 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-bold text-red-400">Risco Crítico Identificado</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Há 2 horas</span>
            </div>
            <div className="pointer-events-none">
              <p className="font-bold text-white text-[15px] mb-1">Esmagamento em Prensa Hidráulica</p>
              <p className="text-sm text-gray-400">Ativo: Prensa 03 • Responsável: João Silva</p>
            </div>
            <div className="pt-3 mt-1 border-t border-red-500/20 flex items-center justify-between">
              <span className="text-xs text-red-400/80 font-medium bg-red-500/10 px-2 py-1 rounded inline-block">Prazo Recomendado: Imediato</span>
            </div>
          </div>
        );
        actions = [
          { label: 'Bloquear Máquina (LOTO)', primary: true, onClick: () => alert('Bloqueio solicitado!') },
          { label: 'Notificar João', onClick: () => alert('Notificado!') },
        ];
      } else if (intent === 'Check_Actions') {
        component = (
          <div className="mt-4 bg-[#221e1a] border border-orange-500/20 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                 <Clock className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">Ação Vencida há 3 dias</span>
              </div>
            </div>
            <div className="pointer-events-none">
              <p className="font-bold text-white text-[15px] mb-1">Troca de mangote exaustor</p>
              <p className="text-sm text-gray-400">Local: Solda 02 • Responsável: Marcos Antônio</p>
            </div>
          </div>
        );
        actions = [
          { label: 'Cobrar Responsável', primary: true, onClick: () => alert('Cobrança enviada!') },
          { label: 'Reagendar', onClick: () => alert('Reagendado!') }
        ];
      } else if (intent === 'Get_Report') {
        component = (
          <div className="mt-4 bg-[#121826] border border-purple-500/30 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <div className="flex items-center gap-2 pointer-events-none">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-[15px] font-bold text-white">Resumo Executivo (Este Mês)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pointer-events-none">
              <div className="bg-[#0b0f19] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Inspeções</span>
                <span className="text-sm font-bold text-white">142</span>
              </div>
              <div className="bg-[#0b0f19] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Ações Fechadas</span>
                <span className="text-sm font-bold text-emerald-400">89%</span>
              </div>
            </div>
          </div>
        );
        actions = [
          { label: 'Baixar PDF', primary: true, onClick: () => alert('Baixando relatorio...') }
        ];
      } else if (intent === 'Get_Decision') {
        const decision = DecisionEngine.getMainDecision({});
        component = (
           <div className="mt-4 bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3">
             <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" /> Decisão: {decision.title}
             </h4>
             <div className="text-[12px] text-gray-300">
                <span className="block mb-1"><strong>Status:</strong> {decision.decision}</span>
                <span className="block mb-1"><strong>Impacto:</strong> <span className={decision.operationalImpact === 'Alto' ? 'text-red-400' : 'text-blue-400'}>{decision.operationalImpact}</span></span>
                <span className="block mb-1"><strong>Efeito Estimado:</strong> {decision.causeAndEffect.effect}</span>
             </div>
           </div>
        );
      } else if (intent === 'Doubt_Normative') {
        const normMatch = NormativeEngine.detect(text);
        if (normMatch) {
          const riskLevelData = RiskEngine.generateRiskFromActivity(text);
          component = (
             <div className="mt-4 bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3">
               <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" /> Detecção Normativa: {normMatch.nr}
               </h4>
               <div className="text-[12px] text-gray-300">
                  <span className="block mb-1"><strong>Risco Específico:</strong> {normMatch.riskType}</span>
                  <span className="block mb-1"><strong>Severidade:</strong> <span className={normMatch.severity === 'crítica' ? 'text-red-400' : 'text-orange-400'}>{normMatch.severity.toUpperCase()}</span></span>
                  {riskLevelData && <span className="block mb-1"><strong>Nível de Risco:</strong> <span className={RiskEngine.getRiskColor(riskLevelData.level)} style={{padding: '0.1rem 0.3rem', borderRadius: '4px'}}>{riskLevelData.level.toUpperCase()}</span></span>}
                  <span className="block mb-1"><strong>Documentos:</strong> {normMatch.documents.join(', ')}</span>
                  <span className="block mb-1"><strong>EPI:</strong> {normMatch.ppe.join(', ')}</span>
               </div>
             </div>
          );
          actions = [
            { label: 'Gerar Ação', primary: true, onClick: () => alert('Ação gerada!') },
            { label: 'Ver NR na íntegra', onClick: () => alert('Abrindo norma...') }
          ];
        }
      }

      if (actions.length === 0) {
        actions = [
          { label: 'Ver Riscos', onClick: () => handleSend('riscos') },
          { label: 'Ver Inspeções', onClick: () => handleSend('inspeções') },
          { label: 'Decisão sugerida', onClick: () => handleSend('o que fazer?') }
        ];
      }

      const responseMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        content: { text: engineText, component },
        actions
      };

      setMessages(prev => [...prev, responseMessage]);
    }, 1500);
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-white font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                L
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">L.A.R.I — Copiloto SST</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Assistente operacional conectada a riscos, inspeções ações e alertas.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button className="flex items-center shrink-0 gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors border border-white/10">
                <Calendar className="w-4 h-4 text-gray-500" /> <span className="hidden sm:inline">01/05/2024 – 31/05/2024</span><span className="sm:hidden">Maio 2024</span> <ChevronRight className="w-4 h-4 text-gray-600 rotate-90" />
              </button>
              <button onClick={() => setMessages([])} className="flex items-center shrink-0 gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors border border-white/10">
                <MessageSquare className="w-4 h-4 text-gray-500" /> Nova conversa
              </button>
              <button 
                onClick={() => {
                  /* Lógica de gerar relatório atualizada */
                  alert("Gerando relatório com base no contexto atual...");
                }}
                className="flex items-center shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Gerar relatório</span><span className="sm:hidden">Relatório</span>
              </button>
            </div>
          </header>

          <div className="flex-1 flex gap-6 overflow-hidden mt-2">
            
            <div className="flex-[2.5] bg-[#121826] border border-white/5 rounded-2xl flex flex-col shadow-lg overflow-hidden relative">
               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.length === 0 && welcomeMessage}
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        {msg.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-2 ml-1">
                             <div className="w-6 h-6 rounded-full bg-purple-600 border border-purple-500 flex items-center justify-center text-[10px] font-bold text-white">L</div>
                             <span className="text-xs font-bold text-gray-400">L.A.R.I</span>
                          </div>
                        )}
                        
                        <div className={`
                          ${msg.sender === 'user' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] ml-12' : 'max-w-[90%]'}
                          px-5 py-3.5 rounded-2xl
                          ${msg.sender === 'bot' ? 'bg-white/5 border border-white/10 text-gray-200' : ''}
                        `}>
                          {msg.content.text && <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{msg.content.text}</p>}
                          {msg.content.component}
                        </div>

                        {msg.actions && msg.actions.length > 0 && (
                          <div className={`mt-3 flex flex-wrap gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start max-w-[90%]'}`}>
                             {msg.actions.map((act, i) => (
                               <button 
                                  key={i}
                                  onClick={act.onClick}
                                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                                    act.primary 
                                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30' 
                                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                                  }`}
                               >
                                  {act.icon}
                                  {act.label}
                               </button>
                             ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div 
                        key="typing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-start"
                      >
                         <div className="flex items-center gap-2 mb-2 ml-1">
                             <div className="w-6 h-6 rounded-full bg-purple-600 border border-purple-500 flex items-center justify-center text-[10px] font-bold text-white">L</div>
                             <span className="text-xs font-bold text-gray-400">L.A.R.I está digitando...</span>
                          </div>
                          <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                          </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </AnimatePresence>
               </div>

               <div className="p-5 md:p-6 shrink-0 bg-transparent relative z-10 border-t border-white/5">
                  <div className="flex items-center gap-3">
                     <button className="w-[52px] h-[52px] rounded-xl border border-white/10 bg-[#0b0f19] flex items-center justify-center text-purple-400 hover:bg-white/5 transition-colors shrink-0">
                        <Activity className="w-5 h-5" />
                     </button>
                     <div className="flex-1 relative">
                        <input 
                           type="text" 
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && inputValue.trim()) {
                                 handleSend(inputValue);
                              }
                           }}
                           placeholder="Pergunte sobre riscos, inspeções, ações ou alertas..."
                           className="w-full bg-[#121826] border border-white/10 rounded-xl pl-5 pr-12 h-[52px] text-[15px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                        />
                     </div>
                     <button 
                        onClick={() => handleSend(inputValue)}
                        className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center transition-all shrink-0 ${
                           inputValue.trim() 
                              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-purple-500/50' 
                              : 'bg-[#121826] text-gray-400 border border-white/10'
                        }`}
                     >
                        <Send className="w-5 h-5 ml-0.5" />
                     </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                     <Lock className="w-3 h-3" /> As respostas da L.A.R.I são baseadas nos dados do sistema e podem não refletir todas as particularidades.
                  </div>
               </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 w-full max-w-[340px] shrink-0 hidden lg:flex">
               <div className="bg-[#121826] border border-white/5 rounded-2xl flex flex-col pt-2 shadow-lg">
                  <div className="flex items-center justify-between p-5 border-b border-white/5 mx-1">
                     <div className="flex items-center gap-2 text-gray-300">
                        <Activity className="w-[18px] h-[18px] text-purple-400" />
                        <h3 className="text-[14px] font-bold text-white">Contexto do sistema</h3>
                     </div>
                     <div className="flex items-center gap-1.5 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-[10px] text-gray-500 font-medium">Atualizado agora</span>
                     </div>
                  </div>

                  <div className="flex flex-col py-2">
                     {[
                        { title: 'Riscos críticos', subtitle: 'vs período anterior', val: '7', stat: '16%', up: true, icon: <AlertTriangle className="w-4 h-4 text-red-500" />, iconBg: 'bg-[#1e1b1d] border-red-500/20' },
                        { title: 'Inspeções pendentes', subtitle: 'vs período anterior', val: '53', stat: '23%', up: true, icon: <ShieldCheck className="w-4 h-4 text-blue-400" />, iconBg: 'bg-[#1a1e28] border-blue-500/20' },
                        { title: 'Ações atrasadas', subtitle: 'vs período anterior', val: '18', stat: '37%', up: true, icon: <Clock className="w-4 h-4 text-orange-400" />, iconBg: 'bg-[#221e1a] border-orange-500/20' },
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-4 px-6 hover:bg-white/5 transition-colors cursor-pointer relative group">
                           {i !== 2 && <div className="absolute bottom-0 left-6 right-6 h-px bg-white/5"></div>}
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                 {item.icon}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[13px] font-bold text-white leading-tight mb-0.5 group-hover:text-purple-400 transition-colors">{item.title}</span>
                                 <span className="text-[11px] text-gray-500">{item.subtitle}</span>
                              </div>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[22px] font-bold text-white leading-tight mb-1">{item.val}</span>
                              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${item.up ? 'text-red-400' : 'text-emerald-400'}`}>
                                 <ArrowUp className="w-3 h-3" /> {item.stat}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg">
                  <div className="flex items-center gap-2 p-5 border-b border-white/5 mx-1">
                     <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] text-purple-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m13 2-2 2.5h3L11 22l2-2.5h-3L13 2z"/>
                     </svg>
                     <h3 className="text-[14px] font-bold text-white">Acesso rápido</h3>
                  </div>
                  
                  <div className="flex flex-col px-3 py-3">
                     {[
                        { title: 'Riscos', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
                        { title: 'Inspeções', icon: <ShieldCheck className="w-4 h-4 text-blue-400" /> },
                        { title: 'Ações', icon: <Clock className="w-4 h-4 text-orange-400" /> },
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 px-4 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                           <div className="flex items-center gap-3">
                              {item.icon}
                              <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors">{item.title}</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                     ))}
                  </div>
                  
                  <div className="p-4 px-6 border-t border-white/5">
                     <button className="text-[13px] font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors">
                        Ver todos os módulos <ChevronRight className="w-3.5 h-3.5" />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
