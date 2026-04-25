"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles, Calendar, Filter, FileText, Send, Paperclip, ChevronRight, AlertTriangle, Activity, ClipboardCheck, ArrowUp, Briefcase } from 'lucide-react';

type Message = {
  id: string;
  sender: 'lari' | 'user';
  text: string | React.ReactNode;
  time: string;
  quickActions?: { label: string; action: () => void; icon?: React.ReactNode }[];
};

export default function ChatPage() {
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'lari',
      text: "Olá, sou a Lari, sua assistente pessoal de Saúde e Segurança do Trabalho.\nEm que posso ajudar?",
      time: '09:15',
      quickActions: [
        { label: 'Quais ações estão atrasadas?', icon: <Activity className="w-4 h-4 text-purple-400" />, action: () => handleSend('Quais ações estão atrasadas?') },
        { label: 'Mostre os riscos críticos agora', icon: <AlertTriangle className="w-4 h-4 text-red-400" />, action: () => handleSend('Mostre os riscos críticos agora') },
        { label: 'Resumo das inspeções pendentes', icon: <ClipboardCheck className="w-4 h-4 text-blue-400" />, action: () => handleSend('Resumo das inspeções pendentes') },
        { label: 'Gerar relatório executivo', icon: <FileText className="w-4 h-4 text-emerald-400" />, action: () => handleSend('Gerar relatório executivo') },
      ]
    }
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <div className="space-y-4">
            <p>Você tem <strong>18 ações atrasadas</strong> no período selecionado.</p>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <Activity className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="font-bold text-white block leading-none">18</span>
                    <span className="text-[10px] text-gray-500 uppercase">Atrasadas</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">12</span>
                    <span className="text-[10px] text-gray-500 uppercase">Críticas</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">4</span>
                    <span className="text-[10px] text-gray-500 uppercase">Altas</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <Briefcase className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">2</span>
                    <span className="text-[10px] text-gray-500 uppercase">Médias</span>
                  </div>
               </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-2">Principais ações atrasadas:</p>
              <ul className="space-y-2">
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-gray-300">Isolar área de risco - Prensa hidráulica PCH-200 (14 dias)</span>
                    <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded">Crítica</span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300">Abrir ação <ChevronRight className="w-3 h-3" /></button>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    <span className="text-gray-300">Substituir EPIs danificados - Setor de Manutenção (9 dias)</span>
                    <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Alta</span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300">Abrir ação <ChevronRight className="w-3 h-3" /></button>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    <span className="text-gray-300">Treinamento NR-33 - Equipe de manutenção (7 dias)</span>
                    <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">Alta</span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300">Abrir ação <ChevronRight className="w-3 h-3" /></button>
                </li>
              </ul>
            </div>
            <button className="text-sm text-purple-400 font-medium hover:text-purple-300 flex items-center gap-1">Ver todas as ações atrasadas <ChevronRight className="w-4 h-4" /></button>
          </div>
        );
      } else if (text === 'Mostre os riscos críticos agora') {
        lariResponse = (
          <div className="space-y-4">
            <p>Há <strong>7 riscos críticos</strong> ativos no período.</p>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="font-bold text-white block leading-none">7</span>
                    <span className="text-[10px] text-gray-500 uppercase">Críticos</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">18</span>
                    <span className="text-[10px] text-gray-500 uppercase">Altos</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <Briefcase className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">24</span>
                    <span className="text-[10px] text-gray-500 uppercase">Médios</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-[#121826] border border-white/5 py-1.5 px-3 rounded-lg">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block leading-none">4</span>
                    <span className="text-[10px] text-gray-500 uppercase">Baixos</span>
                  </div>
               </div>
            </div>
             <div className="flex items-center gap-4">
              <button className="text-sm text-purple-400 font-medium hover:text-purple-300 flex items-center gap-1">Ver riscos críticos <ChevronRight className="w-4 h-4" /></button>
              <button className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded">Ver risco <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        );
      } else if (text === 'Resumo das inspeções pendentes') {
        lariResponse = "Há 53 inspeções pendentes. 23% a mais que o período anterior. Recomendação: alocar mais auditores para a próxima semana.";
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'lari',
        text: lariResponse,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0B0F19] p-4 gap-4">
      <header className="flex items-center justify-between shrink-0 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="font-black text-white text-lg">L</span>
            </div>
            Chat SST
          </h1>
          <p className="text-sm text-gray-400 mt-1">Sua assistente contextual conectada a todo o sistema de SST.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#121826] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-300">
            <Calendar className="w-4 h-4 text-gray-500" />
            01/05/2024 - 31/05/2024
          </div>
          <button className="flex items-center gap-2 bg-[#121826] border border-white/5 hover:bg-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-300 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
            <FileText className="w-4 h-4" />
            Gerar relatório
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#121826] border border-white/5 rounded-2xl overflow-hidden relative">
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {msg.sender === 'lari' && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-xs">L</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-400">
                      {msg.sender === 'lari' ? 'Lari' : 'Você'}
                    </span>
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{msg.sender === 'lari' ? 'IA' : msg.time}</span>
                    {msg.sender === 'lari' && <span className="text-[10px] text-gray-600">{msg.time}</span>}
                  </div>
                  
                  <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-purple-600/10 border border-purple-500/20 text-gray-200 rounded-tr-sm' 
                      : 'bg-white/5 border border-white/5 text-gray-300 rounded-tl-sm'
                  }`}>
                    {typeof msg.text === 'string' ? msg.text.split('\n').map((l, i) => <p key={i}>{l}</p>) : msg.text}
                  </div>

                  {msg.quickActions && (
                    <div className="mt-3 flex flex-wrap gap-2 max-w-[85%]">
                      {msg.quickActions.map((action, i) => (
                        <button 
                          key={i}
                          onClick={action.action}
                          className="flex items-center gap-2 bg-[#1A2234] hover:bg-[#232D42] border border-white/10 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-[#0B0F19]/50 border-t border-white/5 flex flex-col gap-2">
              <div className="relative flex items-end gap-2">
                <button className="p-3 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-colors shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl flex items-center pr-2">
                  <input 
                    type="text" 
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
                    placeholder="Pergunte algo sobre riscos, ações, inspeções, SLAs ou alertas..." 
                    className="w-full bg-transparent pl-4 py-3.5 text-sm text-white focus:outline-none placeholder:text-gray-600"
                  />
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-600 hover:text-gray-400 rounded-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    </button>
                    <button className="p-1.5 text-gray-600 hover:text-gray-400 rounded-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button 
                      onClick={() => handleSend(inputVal)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-500">Lari pode cometer erros. Verifique as informações críticas.</p>
           </div>
        </div>

        {/* Right Sidebar Panel */}
        <div className="w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-none">
          
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Contexto do sistema</h3>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Atualizado agora</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3 mb-3">
              <span className="text-gray-400">Período ativo</span>
              <span className="text-gray-300">01/05/2024 - 31/05/2024</span>
            </div>
            
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Resumo geral</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-medium mb-1"><AlertTriangle className="w-3 h-3" /> Riscos críticos</div>
                 <div className="text-xl font-bold text-white mb-1">7</div>
                 <div className="text-[10px] text-gray-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-red-500" /> <span className="text-red-500">16%</span> vs período anterior</div>
               </div>
               <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-medium mb-1"><Activity className="w-3 h-3" /> Ações atrasadas</div>
                 <div className="text-xl font-bold text-white mb-1">18</div>
                 <div className="text-[10px] text-gray-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-red-500" /> <span className="text-red-500">37%</span> vs período anterior</div>
               </div>
               <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center gap-1.5 text-yellow-500 text-[11px] font-medium mb-1"><ClipboardCheck className="w-3 h-3" /> Inspeções pendentes</div>
                 <div className="text-xl font-bold text-white mb-1">53</div>
                 <div className="text-[10px] text-gray-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-red-500" /> <span className="text-red-500">23%</span> vs período anterior</div>
               </div>
               <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium mb-1"><Briefcase className="w-3 h-3" /> Conformidade geral</div>
                 <div className="text-xl font-bold text-white mb-1">78%</div>
                 <div className="text-[10px] text-gray-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">8 p.p.</span> vs período anterior</div>
               </div>
            </div>

            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Módulos conectados</h4>
            <div className="flex flex-wrap gap-2">
               {['Riscos', 'Inspeções', 'Ações', 'Alertas', 'SLAs', 'Relatórios', 'Configurações'].map((mod, i) => (
                 <span key={i} className="text-[11px] bg-white/5 text-gray-300 border border-white/10 px-2 py-1 rounded flex items-center gap-1">
                   {i === 0 && <AlertTriangle className="w-3 h-3 text-red-400" />}
                   {i === 1 && <ClipboardCheck className="w-3 h-3 text-blue-400" />}
                   {i === 2 && <Activity className="w-3 h-3 text-purple-400" />}
                   {i === 3 && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                   {i === 4 && <AlertTriangle className="w-3 h-3 text-purple-400" />}
                   {i === 5 && <FileText className="w-3 h-3 text-gray-400" />}
                   {mod}
                 </span>
               ))}
            </div>
          </div>

          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Atalhos inteligentes</h3>
            <div className="space-y-4">
               <div className="flex items-start justify-between group cursor-pointer">
                  <div className="flex gap-3">
                     <div className="mt-0.5 bg-white/5 p-1.5 rounded"><Activity className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" /></div>
                     <div>
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Ações críticas atrasadas</p>
                        <p className="text-[11px] text-gray-500">Listar ações críticas fora do prazo.</p>
                     </div>
                  </div>
                  <button className="text-[10px] text-purple-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Abrir ação <ChevronRight className="w-3 h-3" /></button>
               </div>
               <div className="flex items-start justify-between group cursor-pointer">
                  <div className="flex gap-3">
                     <div className="mt-0.5 bg-white/5 p-1.5 rounded"><AlertTriangle className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" /></div>
                     <div>
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Riscos por setor</p>
                        <p className="text-[11px] text-gray-500">Ver riscos agrupados por setor.</p>
                     </div>
                  </div>
                  <button className="text-[10px] text-purple-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ver riscos <ChevronRight className="w-3 h-3" /></button>
               </div>
               <div className="flex items-start justify-between group cursor-pointer">
                  <div className="flex gap-3">
                     <div className="mt-0.5 bg-white/5 p-1.5 rounded"><ClipboardCheck className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" /></div>
                     <div>
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Inspeções pendentes</p>
                        <p className="text-[11px] text-gray-500">Filtrar inspeções não realizadas.</p>
                     </div>
                  </div>
                  <button className="text-[10px] text-purple-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Filtrar inspeções <ChevronRight className="w-3 h-3" /></button>
               </div>
               <div className="flex items-start justify-between group cursor-pointer">
                  <div className="flex gap-3">
                     <div className="mt-0.5 bg-white/5 p-1.5 rounded"><AlertTriangle className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" /></div>
                     <div>
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Alertas ativos</p>
                        <p className="text-[11px] text-gray-500">Mostrar alertas não resolvidos.</p>
                     </div>
                  </div>
                  <button className="text-[10px] text-purple-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ver alertas <ChevronRight className="w-3 h-3" /></button>
               </div>
               <div className="flex items-start justify-between group cursor-pointer">
                  <div className="flex gap-3">
                     <div className="mt-0.5 bg-white/5 p-1.5 rounded"><FileText className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" /></div>
                     <div>
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Relatório executivo</p>
                        <p className="text-[11px] text-gray-500">Gerar resumo executivo do período.</p>
                     </div>
                  </div>
                  <button className="text-[10px] text-purple-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Gerar relatório <ChevronRight className="w-3 h-3" /></button>
               </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
