"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ActionItem } from '../types';
import { motion } from 'motion/react';

export default function ModalNovaAcao({ onClose, onCreate }: { onClose: () => void, onCreate: (acao: any) => void }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'Média',
    prazo: '',
    setor: '',
    responsavel: '', // Will be mapped to `validador` eventually
    executor: '',
    trabalhadoresExpostos: 0,
    perfilExposto: '',
    impactoHumano: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) return;
    
    // Status depends on plazo vs now
    const now = new Date();
    let status = 'Pendente';
    if (formData.prazo) {
       const prazoData = new Date(formData.prazo);
       prazoData.setHours(23, 59, 59, 999);
       if (now > prazoData) status = 'Vencida';
    }

    onCreate({ 
      ...formData, 
      status: status as any, 
      prioridade: formData.prioridade as any,
      validador: formData.responsavel // map responsavel to validador for people-centric
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#121826] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
           <h2 className="text-lg font-bold text-white">Nova Ação Centrada em Pessoas</h2>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
           <form id="action-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Seção 1: Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">1. O QUE DEVE SER FEITO?</h3>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Título da Ação</label>
                   <input type="text" required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Ex: Isolar área e instalar guarda-corpo definitivo" />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Descrição Detalhada</label>
                   <textarea required rows={2} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" placeholder="Detalhes técnicos da execução..." />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prioridade</label>
                      <select value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none">
                         <option value="Crítica">Crítica</option>
                         <option value="Alta">Alta</option>
                         <option value="Média">Média</option>
                         <option value="Baixa">Baixa</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Setor / Local</label>
                      <input type="text" value={formData.setor} onChange={e => setFormData({...formData, setor: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Ex: Área 04" />
                   </div>
                   <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prazo Máximo</label>
                      <input type="date" required value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" style={{colorScheme: 'dark'}} />
                   </div>
                </div>
              </div>

              {/* Seção 2: Foco em Pessoas */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-white/5 pb-2">2. QUEM ESTAMOS PROTEGENDO?</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Qtd. Trabalhadores Expostos</label>
                      <input type="number" min="0" value={formData.trabalhadoresExpostos} onChange={e => setFormData({...formData, trabalhadoresExpostos: parseInt(e.target.value) || 0})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Perfil Expôsto (Função/Cargo)</label>
                      <input type="text" value={formData.perfilExposto} onChange={e => setFormData({...formData, perfilExposto: e.target.value})} placeholder="Ex: Operadores de Empilhadeira" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Dano Evitado (Impacto Humano Estimado)</label>
                   <input type="text" value={formData.impactoHumano} onChange={e => setFormData({...formData, impactoHumano: e.target.value})} placeholder="Ex: Risco de amputação por esmagamento" className="w-full bg-black/20 border border-white/10 text-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>

              {/* Seção 3: Responsabilidades Pessoais */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2">3. QUEM EXECUTA E QUEM VALIDA?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider gap-2 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Executor da Correção
                      </label>
                      <input type="text" value={formData.executor} onChange={e => setFormData({...formData, executor: e.target.value})} placeholder="Iniciais/Nome do responsável pela obra/ação" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                      <p className="text-[10px] text-gray-500 mt-2 leading-tight">A pessoa física ou terceiro que irá executar o reparo ou implementação no chão de fábrica.</p>
                   </div>
                   <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Validador de Segurança
                      </label>
                      <input type="text" required value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} placeholder="Iniciais/Nome de quem assina a baixa" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                      <p className="text-[10px] text-gray-500 mt-2 leading-tight">O responsável por ir ao local confirmar se a intervenção garantiu a integridade humana.</p>
                   </div>
                </div>
              </div>
           </form>
        </div>

        <div className="p-5 border-t border-white/5 shrink-0 bg-[#0b0f19] flex justify-end gap-3 rounded-b-2xl">
           <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancelar</button>
           <button type="submit" form="action-form" className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">Registrar Ação</button>
        </div>
      </motion.div>
    </div>
  );
}
