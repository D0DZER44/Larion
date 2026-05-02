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
    responsavel: ''
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

    onCreate({ ...formData, status: status as any, prioridade: formData.prioridade as any });
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
        className="bg-[#121826] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
           <h2 className="text-lg font-bold text-white">Nova Ação Correta</h2>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
           <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Título da Ação</label>
              <input type="text" required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
           </div>
           <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Descrição</label>
              <textarea required rows={3} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" />
           </div>
           <div className="grid grid-cols-2 gap-4">
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
                 <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prazo</label>
                 <input type="date" required value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" style={{colorScheme: 'dark'}} />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Setor</label>
                 <input type="text" value={formData.setor} onChange={e => setFormData({...formData, setor: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Responsável</label>
                 <input type="text" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
           </div>
           <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">Criar Ação</button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
