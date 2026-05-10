'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Activity } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { askLari, LariMessage } from '@/lib/lari/client';
import ReactMarkdown from 'react-markdown';

export function ChatPanel({ isFloating = false }: { isFloating?: boolean }) {
  const store = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<LariMessage[]>([]);
  const [isOnline, setIsOnline] = useState(true); // default true, updates on fail
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: LariMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const criticalRisks = store.riscos.filter(r => r.nivel === 'Crítico').length;
    const acoesAtrasadas = store.acoes.filter(a => a.status === 'Atrasada' || a.status === 'Vencida').length;
    
    const contextArgs = {
      summary: `Apex ops status: ${criticalRisks} riscos críticos, ${acoesAtrasadas} ações em atraso.`,
      criticalRisks,
      acoesAtrasadas,
      inspecoesPendentes: 0,
      operationalScore: 100,
      topSector: 'Nenhum',
      conformidade: 100,
      checklistsHoje: 0
    };

    const lariResponse = await askLari(text.trim(), contextArgs);
    
    if (lariResponse.isOffline) {
      setIsOnline(false);
    } else {
      setIsOnline(true);
    }

    setMessages(prev => [...prev, lariResponse]);
    setIsTyping(false);
  };

  return (
    <div className={`flex flex-col h-full bg-[#121826] border border-white/5 shadow-lg relative ${isFloating ? 'rounded-2xl' : 'rounded-2xl'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0b0f19]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            L
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">L.A.R.I</h3>
            <p className="text-[10px] text-gray-400">Assistente Inteligente</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10 flex flex-col items-center">
            <Zap className="w-8 h-8 text-purple-500/50 mb-3" />
            <p>Olá! Eu sou a L.A.R.I.</p>
            <p className="text-[12px] opacity-70 mt-1">Pergunte sobre seus riscos, inspeções ou indicadores.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
            {msg.role === 'lari' && (
              <div className="text-[10px] font-bold text-gray-500 mb-1 ml-1 flex items-center gap-1">L.A.R.I</div>
            )}
            <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white ml-8 shadow-lg' : 'bg-white/5 border border-white/10 text-gray-200 mr-8'} text-[13px] sm:text-[14px]`}>
               {msg.role === 'lari' ? (
                 <div className="markdown-body">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
               ) : (
                 <p className="whitespace-pre-wrap">{msg.text}</p>
               )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start gap-1">
             <div className="text-[10px] font-bold text-gray-500 ml-1">L.A.R.I digitando...</div>
             <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-[#0b0f19]">
        <div className="flex items-center gap-2 relative">
          <input 
             type="text" 
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend(inputValue);
             }}
             placeholder={isOnline ? "Digite sua mensagem..." : "Estou offline, mas pode falar..."}
             className="w-full bg-[#121826] border border-white/10 rounded-xl pl-4 pr-12 h-12 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          <button 
             onClick={() => handleSend(inputValue)}
             className={`absolute right-1 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                inputValue.trim() 
                   ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' 
                   : 'bg-transparent text-gray-500 hover:bg-white/5'
             }`}
          >
             <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
