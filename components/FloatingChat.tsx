"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sparkles, Send, X, AlertTriangle, Activity, FileText, Clock, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LariContextEngine, NormativeEngine, RiskEngine, DecisionEngine } from '@/lib/engines';

type Message = {
  id: string;
  sender: 'lari' | 'user';
  text: string | React.ReactNode;
  time: string;
  quickActions?: { label: string; action: () => void; icon?: React.ReactNode }[];
};

export default function FloatingChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const storeState = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setTimeout(() => {
      const ctx = LariContextEngine.getRealtimeContext(storeState);
      
      let initialText = "Olá, sou a L.A.R.I — Copiloto SST, em que posso ajudar?";
      let proativeComponent: React.ReactNode = null;
      let qActions = [
        { label: 'Quais ações estão atrasadas?', icon: <Activity className="w-3 h-3 text-purple-400" />, action: () => handleSend('Quais ações estão atrasadas?') },
        { label: 'Mostre os riscos críticos agora', icon: <AlertTriangle className="w-3 h-3 text-red-400" />, action: () => handleSend('Mostre os riscos críticos agora') },
      ];

      if (ctx.alertasProativos && ctx.alertasProativos.length > 0) {
        initialText = `Olá, L.A.R.I aqui. Analisei a operação agora e encontrei **${ctx.alertasProativos.length} alerta(s) proativo(s)** que requerem sua atenção.`;
        
        proativeComponent = (
          <div className="mt-3 flex flex-col gap-3">
            {ctx.alertasProativos.slice(0, 2).map((alerta: any, i: number) => (
               <div key={i} className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4 text-orange-400" />
                   <span className="text-[12px] font-bold text-orange-400">{alerta.title}</span>
                 </div>
                 <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{alerta.context}</p>
                 <div className="pt-2 mt-1 border-t border-orange-500/10">
                   <p className="text-[10px] text-gray-400 mb-0.5"><strong className="text-gray-300">Impacto Humano:</strong> {alerta.humanImpact}</p>
                   <p className="text-[10px] text-gray-400"><strong className="text-gray-300">Recomendação:</strong> {alerta.recommendedAction}</p>
                 </div>
               </div>
            ))}
          </div>
        );

        qActions = [
          { label: 'Verificar alertas principais', icon: <AlertTriangle className="w-3 h-3 text-red-400" />, action: () => handleSend('o que devo priorizar?') },
          ...qActions
        ].slice(0, 3);
      }

      setMessages([
        {
          id: '1',
          sender: 'lari',
          text: (
            <>
              {initialText}
              {proativeComponent}
            </>
          ),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          quickActions: qActions
        }
      ]);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Hide on /chat route
  if (pathname === '/chat') {
    return null;
  }

  const handleSend = (text: string) => {
    if (!text.trim() || isTypingRef.current) return;
    isTypingRef.current = true;

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text, time }]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      isTypingRef.current = false;
      
      const intent = LariContextEngine.classifyIntent(text);
      let engineText = LariContextEngine.respond(text, storeState);
      
      let component: React.ReactNode = undefined;
      let quickActions: { label: string; action: () => void; icon?: React.ReactNode }[] = [];

      if (intent === 'Check_Risks') {
        const criticalRisks = (storeState.riscos || []).filter((r: any) => r.nivel?.toLowerCase() === 'crítico' || r.level?.toLowerCase() === 'crítico');
        
        if (criticalRisks.length > 0) {
          const firstRisk = criticalRisks[0];
          component = (
            <div className="mt-4 bg-[#1e1b1d] border border-red-500/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-[13px] font-bold text-red-400">{criticalRisks.length} Risco{criticalRisks.length > 1 ? 's' : ''} Crítico{criticalRisks.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="pointer-events-none">
                <p className="font-bold text-white text-sm mb-1">{firstRisk.atividade || firstRisk.title || firstRisk.setor}</p>
                <p className="text-[11px] text-gray-400">Ativo • {firstRisk.responsavel || 'SST'}</p>
              </div>
            </div>
          );
          quickActions = [
            { label: 'Bloquear (LOTO)', action: () => alert('Bloqueio solicitado!') },
          ];
        } else {
           engineText = "Nenhum risco crítico identificado no momento ativo no sistema.";
        }
        
      } else if (intent === 'Check_Actions') {
         const atrasadas = (storeState.acoes || []).filter((a: any) => a.status === 'Atrasada' || a.status === 'Urgente');
        
         if (atrasadas.length > 0) {
           const firstAcao = atrasadas[0];
           component = (
             <div className="mt-4 bg-[#221e1a] border border-orange-500/20 rounded-xl p-4 flex flex-col gap-3">
               <div className="flex items-center justify-between pointer-events-none">
                 <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                   <span className="text-[13px] font-bold text-orange-400">{atrasadas.length} Ações Atrasadas</span>
                 </div>
               </div>
               <div className="pointer-events-none">
                 <p className="font-bold text-white text-sm mb-1">{firstAcao.titulo || firstAcao.title}</p>
                 <p className="text-[11px] text-gray-400">Resp: {firstAcao.responsavel || firstAcao.owner}</p>
               </div>
             </div>
           );
           quickActions = [
             { label: 'Cobrar Responsável', action: () => alert('Cobrança enviada!') },
           ];
         } else {
            engineText = "Não constam ações atrasadas na base! Ótimo trabalho.";
         }
        
      } else if (intent === 'Get_Report') {
        const atrasadas = (storeState.acoes || []).filter((a: any) => a.status === 'Atrasada' || a.status === 'Urgente');
        component = (
          <div className="mt-4 bg-[#121826] border border-purple-500/30 rounded-xl p-4 flex flex-col gap-4 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <div className="flex items-center gap-2 pointer-events-none">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-[13px] font-bold text-white">Resumo Atualógico</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pointer-events-none">
              <div className="bg-[#0b0f19] border border-white/5 p-2 rounded-lg flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium">Ações Pendentes</span>
                <span className="text-sm font-bold text-white">{atrasadas.length}</span>
              </div>
              <div className="bg-[#0b0f19] border border-white/5 p-2 rounded-lg flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium">Inspeções</span>
                <span className="text-sm font-bold text-emerald-400">{storeState.inspecoes?.length || 0}</span>
              </div>
            </div>
          </div>
        );
        quickActions = [
          { label: 'Baixar PDF', action: () => alert('Baixando relatorio...') }
        ];
      } else if (intent === 'Get_Decision') {
        const decision = DecisionEngine.getMainDecision(storeState);
        component = (
           <div className="mt-4 bg-purple-900/10 border border-purple-500/30 p-3 rounded-xl space-y-2">
             <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
               <ShieldCheck className="w-3 h-3" /> {decision.title}
             </h4>
             <div className="text-[11px] text-gray-300">
                <span className="block mb-1"><strong>Status:</strong> {decision.decision}</span>
             </div>
           </div>
        );
      } else if (intent === 'Doubt_Normative') {
        const normMatch = NormativeEngine.detect(text);
        if (normMatch) {
          const riskLevelData = RiskEngine.generateRiskFromActivity(text);
          component = (
             <div className="mt-4 bg-purple-900/10 border border-purple-500/30 p-3 rounded-xl space-y-2">
               <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                 <ShieldCheck className="w-3 h-3" /> NR: {normMatch.nr}
               </h4>
               <div className="text-[11px] text-gray-300">
                  <span className="block mb-1"><strong>Risco:</strong> {normMatch.riskType}</span>
                  {riskLevelData && <span className="block mb-1"><strong>Nível:</strong> {riskLevelData.level.toUpperCase()}</span>}
               </div>
             </div>
          );
        }
      }

      if (quickActions.length === 0) {
        quickActions = [
          { label: 'Ações atrasadas?', action: () => handleSend('ações atrasadas?') },
          { label: 'Riscos Críticos', action: () => handleSend('riscos cíticos') }
        ];
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'lari',
        text: (
           <>
             {typeof engineText === 'string' ? engineText : JSON.stringify(engineText)}
             {component}
           </>
        ),
        quickActions,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  if (pathname === '/') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[360px] h-[500px] max-h-[80vh] flex flex-col glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121826]/80 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#121826] rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">L.A.R.I — Copiloto SST</h3>
                  <p className="text-[10px] text-gray-400">Inteligência Artificial</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none flex flex-col bg-[#0b0f19]/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-[#121826] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                    {msg.sender === 'lari' && (
                      <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-medium text-purple-400">LARI</span>
                      </div>
                    )}
                    
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                    
                    <div className={`text-[10px] opacity-50 mt-1.5 text-right`}>
                      {msg.time}
                    </div>

                    {msg.sender === 'lari' && msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.quickActions.map((action, i) => (
                          <button 
                            key={i}
                            onClick={action.action}
                            className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-left transition-colors flex items-center gap-2"
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#121826] border border-white/5 rounded-2xl p-3 rounded-tl-sm flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                    <span className="text-[12px] text-gray-400">L.A.R.I está processando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-[#121826]/80 shrink-0">
              <div className="flex items-center gap-2 bg-[#0b0f19] rounded-xl border border-white/10 p-1.5 pr-2 focus-within:border-purple-500/50 transition-colors">
                <input 
                  type="text" 
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(inputVal)}
                  placeholder="Pergunte à L.A.R.I..." 
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-3 py-2"
                />
                <button 
                  onClick={() => handleSend(inputVal)}
                  disabled={!inputVal.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all text-white border border-purple-400/30 z-50 ${isOpen ? 'bg-[#121826] border-white/10 scale-90' : 'bg-purple-600 hover:bg-purple-500 hover:scale-105'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0b0f19] rounded-full"></span>
          </>
        )}
      </button>
    </div>
  );
}

