"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ArrowUp, Clock, FileText, ShieldCheck } from 'lucide-react';
import { ChatPanel } from '@/components/lari/ChatPanel';
import { useAppStore } from '@/lib/store';

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
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
              <button 
                onClick={() => {
                  store.addLog({
                    empresa_id: '1',
                    user_id: 'Sistema',
                    event_type: 'relatorio_gerado',
                    description: `Relatório gerado a partir do chat (Lari)`,
                    origin_type: 'chat',
                    origin_id: 'chat-lari'
                  });
                  alert("Gerando relatório com base no contexto atual...");
                }}
                className="flex items-center shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Gerar relatório</span><span className="sm:hidden">Relatório</span>
              </button>
            </div>
          </header>

          <div className="flex-1 flex gap-6 overflow-hidden mt-2">
            
            <div className="flex-[2.5] flex flex-col overflow-hidden relative">
               <ChatPanel />
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
