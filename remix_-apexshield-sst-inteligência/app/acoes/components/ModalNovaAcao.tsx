"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { normalizeActionDraft, validateActionDraft } from '@/lib/action-rules';

export default function ModalNovaAcao({ onClose, onCreate }: { onClose: () => void, onCreate: (acao: any) => void }) {
  const [formData, setFormData] = useState({
    oQue: '',
    porQue: '',
    prioridade: 'P3',
    quando: '',
    onde: '',
    quem: '',
    como: '',
    quantoCusta: '',
    executor: '',
    trabalhadoresExpostos: 0,
    perfilExposto: '',
    impactoHumano: ''
  });
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const draft = normalizeActionDraft({
      titulo: formData.oQue,
      descricao: formData.como,
      oQue: formData.oQue,
      porQue: formData.porQue,
      onde: formData.onde,
      quem: formData.quem,
      quando: formData.quando,
      como: formData.como,
      quantoCusta: formData.quantoCusta,
      prioridade: formData.prioridade,
      setor: formData.onde,
      responsavel: formData.quem,
      prazo: formData.quando,
      executor: formData.executor,
      trabalhadoresExpostos: formData.trabalhadoresExpostos,
      perfilExposto: formData.perfilExposto,
      impactoHumano: formData.impactoHumano,
      validador: formData.quem
    });

    const validationErrors = validateActionDraft(draft);
    if (validationErrors.length > 0) {
      setFormError(validationErrors[0]);
      return;
    }
    
    const now = new Date();
    let status = 'Pendente';
    if (formData.quando) {
       const prazoData = new Date(formData.quando);
       prazoData.setHours(23, 59, 59, 999);
       if (now > prazoData) status = 'Vencida';
    }

    try {
      onCreate({ 
        ...draft, 
        status: status as any, 
        prioridade: formData.prioridade as any,
        validador: formData.quem
      });
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel registrar a acao.');
    }
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
           <h2 className="text-lg font-bold text-white">Nova Acao com 5W2H</h2>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
           <form id="action-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">1. O que fazer</h3>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">O que</label>
                   <input type="text" required value={formData.oQue} onChange={e => { setFormData({ ...formData, oQue: e.target.value }); setFormError(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Ex: Instalar protecao fisica na maquina" />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Por que</label>
                   <textarea required rows={2} value={formData.porQue} onChange={e => { setFormData({ ...formData, porQue: e.target.value }); setFormError(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" placeholder="Ex: Reduzir risco de contato com partes moveis" />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Como</label>
                   <textarea required rows={3} value={formData.como} onChange={e => { setFormData({ ...formData, como: e.target.value }); setFormError(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" placeholder="Ex: Instalar a protecao, testar o funcionamento e validar liberacao segura" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prioridade</label>
                      <select value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none">
                         <option value="P1">Critica</option>
                         <option value="P2">Alta</option>
                         <option value="P3">Media</option>
                         <option value="P4">Baixa</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Onde</label>
                      <input type="text" value={formData.onde} onChange={e => { setFormData({ ...formData, onde: e.target.value }); setFormError(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Ex: Producao - Linha 1" />
                   </div>
                   <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Quando</label>
                      <input type="text" required value={formData.quando} onChange={e => { setFormData({ ...formData, quando: e.target.value }); setFormError(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Ex: ate 24h ou 2026-05-08" />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-white/5 pb-2">2. Quem e impacto</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Qtd. Trabalhadores Expostos</label>
                      <input type="number" min="0" value={formData.trabalhadoresExpostos} onChange={e => setFormData({ ...formData, trabalhadoresExpostos: parseInt(e.target.value, 10) || 0 })} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Perfil Exposto</label>
                      <input type="text" value={formData.perfilExposto} onChange={e => setFormData({ ...formData, perfilExposto: e.target.value })} placeholder="Ex: Operadores de Empilhadeira" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Impacto Humano</label>
                   <input type="text" value={formData.impactoHumano} onChange={e => setFormData({ ...formData, impactoHumano: e.target.value })} placeholder="Ex: Risco de amputacao por esmagamento" className="w-full bg-black/20 border border-white/10 text-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2">3. Responsabilidade e custo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider gap-2 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Executor da Correcao
                      </label>
                      <input type="text" value={formData.executor} onChange={e => setFormData({ ...formData, executor: e.target.value })} placeholder="Nome de quem executa no local" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                      <p className="text-[10px] text-gray-500 mt-2 leading-tight">Pessoa ou terceiro que fara a execucao fisica da acao.</p>
                   </div>
                   <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Quem responde
                      </label>
                      <input type="text" required value={formData.quem} onChange={e => { setFormData({ ...formData, quem: e.target.value }); setFormError(''); }} placeholder="Nome de quem responde pela entrega" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                      <p className="text-[10px] text-gray-500 mt-2 leading-tight">Responsavel por garantir prazo, entrega e validacao da acao.</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Quanto custa</label>
                      <input type="number" min="0" step="0.01" value={formData.quantoCusta} onChange={e => setFormData({ ...formData, quantoCusta: e.target.value })} placeholder="Opcional" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                   </div>
                   <div className="flex items-end">
                      <div className="w-full rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] text-red-200 leading-relaxed">
                        Acao critica nao pode ser concluida sem evidencia.
                      </div>
                   </div>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {formError}
                </div>
              )}
           </form>
        </div>

        <div className="p-5 border-t border-white/5 shrink-0 bg-[#0b0f19] flex justify-end gap-3 rounded-b-2xl">
           <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancelar</button>
           <button type="submit" form="action-form" className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">Registrar Acao</button>
        </div>
      </motion.div>
    </div>
  );
}
