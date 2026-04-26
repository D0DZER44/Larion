"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sparkles, Send, X, AlertTriangle, Activity, ClipboardCheck, Briefcase, FileText, ChevronRight } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'lari',
      text: "Olá, sou a L.A.R.I — Copiloto SST, em que posso ajudar?",
      time: '09:15',
      quickActions: [
        { label: 'Quais ações estão atrasadas?', icon: <Activity className="w-3 h-3 text-purple-400" />, action: () => handleSend('Quais ações estão atrasadas?') },
        { label: 'Mostre os riscos críticos agora', icon: <AlertTriangle className="w-3 h-3 text-red-400" />, action: () => handleSend('Mostre os riscos críticos agora') },
      ]
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Hide on /chat route
  if (pathname === '/chat') {
    return null;
  }

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text, time }]);
    setInputVal('');

    // Mock responses
    setTimeout(() => {
      let lariResponse: React.ReactNode = "Desculpe, ainda estou aprendendo, mas posso te ajudar a navegar no sistema.";
      
      if (text === 'Quais ações estão atrasadas?') {
        lariResponse = (
          <div className="space-y-3">
            <p>Você tem <strong>18 ações atrasadas</strong>.</p>
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <Activity className="w-3 h-3 text-red-500" />
                  <div>
                    <span className="font-bold text-white text-xs block leading-none">18 Atrasadas</span>
                  </div>
               </div>
            </div>
            <button className="text-xs text-purple-400 font-medium hover:text-purple-300 flex items-center gap-1">Ver todas as ações <ChevronRight className="w-3 h-3" /></button>
          </div>
        );
      } else if (text === 'Mostre os riscos críticos agora') {
        lariResponse = (
          <div className="space-y-3">
            <p>Há <strong>7 riscos críticos</strong> ativos no período.</p>
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <div>
                    <span className="font-bold text-white text-xs block leading-none">7 Críticos</span>
                  </div>
               </div>
            </div>
          </div>
        );
      }
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'lari',
        text: lariResponse,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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

                    {msg.quickActions && msg.quickActions.length > 0 && (
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
