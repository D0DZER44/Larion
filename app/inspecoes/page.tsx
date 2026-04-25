"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, ClipboardCheck, Edit2, Trash2, X, Clock, CheckCircle2, Leaf, Settings as SettingsIcon, AlertTriangle, FileText, Zap, ChevronRight, MoreVertical, Copy, PowerOff, Download, Box, Shield } from 'lucide-react';

type Info = {
  id: string;
  title: string;
  location: string;
  responsible: string;
  status: 'Agendada' | 'Em Andamento' | 'Concluída';
  date: string;
  category: 'Segurança' | 'Equipamentos' | 'EPI' | 'Meio Ambiente' | 'Elétrica' | 'Logística' | 'Ergonomia';
  items: number;
  version: string;
};

const initialInspecoes: Info[] = [
  { id: '1', title: 'Checklist de Segurança Geral', location: 'Geral', responsible: 'Rafael Oliveira', status: 'Em Andamento', date: '2024-05-20', category: 'Segurança', items: 42, version: '2.3' },
  { id: '2', title: 'Checklist de Máquinas e Equipamentos', location: 'Setor de Produção', responsible: 'Carlos Lima', status: 'Em Andamento', date: '2024-05-18', category: 'Equipamentos', items: 35, version: '1.2' },
  { id: '3', title: 'Checklist de EPI', location: 'Almoxarifado', responsible: 'Rafael Oliveira', status: 'Em Andamento', date: '2024-05-15', category: 'EPI', items: 28, version: '4.0' },
  { id: '4', title: 'Checklist de Ambiente', location: 'Todo o Site', responsible: 'Ana Silva', status: 'Em Andamento', date: '2024-04-20', category: 'Meio Ambiente', items: 23, version: '1.1' },
];

export default function InspecoesPage() {
  const [items, setItems] = useState<Info[]>(initialInspecoes);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // For new items
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // For viewing/editing details
  const [editingItem, setEditingItem] = useState<Info | null>(null);

  const [formData, setFormData] = useState<Partial<Info>>({
    title: '', location: '', responsible: '', status: 'Agendada', date: new Date().toISOString().split('T')[0], category: 'Segurança', items: 0, version: '1.0'
  });

  const handleOpenDetails = (item: Info) => {
    setEditingItem(item);
    setFormData(item);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', location: '', responsible: '', status: 'Agendada', date: new Date().toISOString().split('T')[0], category: 'Segurança', items: 0, version: '1.0' });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
     setItems(prev => [{ ...formData, id: Math.random().toString() } as Info, ...prev]);
     setIsModalOpen(false);
  };

  const handleSaveDrawer = () => {
    if (editingItem) {
      setItems(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...formData } as Info : r));
    }
    // We don't close the drawer immediately, let the user see the changes saved
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.filter(r => r.id !== id));
    setIsDrawerOpen(false);
  };

  const filtered = items.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase()));

  const getCategoryIcon = (category: string) => {
    switch (category) {
       case 'Segurança': return <Shield className="w-5 h-5 text-purple-400" />;
       case 'Equipamentos': return <SettingsIcon className="w-5 h-5 text-orange-400" />;
       case 'EPI': return <ClipboardCheck className="w-5 h-5 text-yellow-400" />;
       case 'Meio Ambiente': return <Leaf className="w-5 h-5 text-emerald-400" />;
       case 'Elétrica': return <Zap className="w-5 h-5 text-yellow-500" />;
       case 'Logística': return <Box className="w-5 h-5 text-blue-400" />;
       default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
       case 'Segurança': return 'bg-purple-500/10 border-purple-500/20';
       case 'Equipamentos': return 'bg-orange-500/10 border-orange-500/20';
       case 'EPI': return 'bg-yellow-500/10 border-yellow-500/20';
       case 'Meio Ambiente': return 'bg-emerald-500/10 border-emerald-500/20';
       case 'Elétrica': return 'bg-yellow-500/10 border-yellow-500/20';
       case 'Logística': return 'bg-blue-500/10 border-blue-500/20';
       default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };


  return (
    <div className="flex w-full h-full overflow-hidden">
      <motion.div 
        layout 
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
      >
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Checklists</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os modelos de checklists utilizados nas inspeções.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
            <Download className="w-4 h-4" />
            Importar checklist
          </button>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
            <Plus className="w-4 h-4" />
            Novo checklist
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
               <ClipboardCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Checklists Ativos</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">32</div>
               <p className="text-xs text-gray-500">Em uso nas inspeções</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
               <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Por Revisão</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">6</div>
               <p className="text-xs text-gray-500">Aguardando revisão</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Inativos</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">4</div>
               <p className="text-xs text-gray-500">Descontinuados</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Itens Totais</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">482</div>
               <p className="text-xs text-gray-500">Em todos os checklists</p>
            </div>
         </div>
      </div>

      <div className="flex gap-4 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar checklist..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121826] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <select className="bg-[#121826] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-colors appearance-none min-w-[150px]">
           <option value="">Categoria: Todas</option>
        </select>
        <select className="bg-[#121826] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-colors appearance-none min-w-[150px]">
           <option value="">Status: Todos</option>
        </select>
        <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 border border-white/5 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#121826] border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#121826] z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Checklist</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Itens</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Última Revisão</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenDetails(item)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${getCategoryColor(item.category)}`}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                           <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
                           <p className="text-xs text-gray-500">Inspeção geral de segurança do trabalho</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-400">{item.items}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md tracking-wider ${
                        item.status === 'Concluída' || item.status === 'Em Andamento' ? 'text-emerald-400' : 
                        'text-gray-400'
                      }`}>
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="p-1.5 text-gray-500 hover:text-white rounded transition-colors" onClick={(e) => { e.stopPropagation(); /* open popover */ }}>
                          <MoreVertical className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      </div>
    </div>
  </motion.div>

      {/* Pop-out/Modal for NEW CHECKLIST */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#121826] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Novo Checklist</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Título do Checklist</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Descrição</label>
                   <textarea
                     className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                     placeholder="Breve descrição do objetivo deste checklist..."
                   ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Categoria</label>
                    <select 
                       value={formData.category}
                       onChange={e => setFormData({...formData, category: e.target.value as any})}
                       className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                       <option value="Segurança">Segurança</option>
                       <option value="Equipamentos">Equipamentos</option>
                       <option value="EPI">EPI</option>
                       <option value="Meio Ambiente">Meio Ambiente</option>
                       <option value="Elétrica">Elétrica</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Início de Validade</label>
                     <input type="date" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveModal} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg">
                  Criar e adic. itens
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Side Drawer para Edição/Visualização */}
      <AnimatePresence>
        {isDrawerOpen && editingItem && (
          <motion.div 
            initial={{ width: 0, borderLeftWidth: 0, opacity: 0 }} 
            animate={{ width: 448, borderLeftWidth: 1, opacity: 1 }} 
            exit={{ width: 0, borderLeftWidth: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full bg-[#121826] border-white/10 shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            <div className="w-[448px] h-full flex flex-col pt-safe-top overflow-y-auto">
              <div className="flex-1 overflow-y-auto">
                 <div className="p-6">
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalhes do Checklist</h3>
                       <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                     <div className="flex gap-4 items-start mb-8">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 ${getCategoryColor(editingItem.category)}`}>
                          {getCategoryIcon(editingItem.category)}
                        </div>
                        <div>
                           <h2 className="text-lg font-bold text-white mb-1 leading-tight">{editingItem.title}</h2>
                           <p className="text-sm text-gray-400 leading-snug">Inspeção geral de segurança do trabalho</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Categoria</span>
                           <span className="text-sm text-white font-medium">{editingItem.category}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Itens</span>
                           <span className="text-sm text-white font-medium">{editingItem.items}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Última revisão</span>
                           <span className="text-sm text-white font-medium">{new Date(editingItem.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Status</span>
                           <span className="text-sm text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Ativo
                           </span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Criado por</span>
                           <span className="text-sm text-white font-medium">{editingItem.responsible}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Versão</span>
                           <span className="text-sm text-white font-medium">{editingItem.version}</span>
                        </div>
                     </div>

                     <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-xs font-bold text-white uppercase tracking-wider">Itens do Checklist</h3>
                        </div>
                        <div className="flex items-center justify-between text-xs text-purple-400 mb-2">
                           <span>{editingItem.items} itens no total</span>
                           <span>32 respondidos (76%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full mb-6 overflow-hidden flex">
                           <div className="h-full bg-emerald-500/80" style={{ width: '62%' }}></div>
                           <div className="h-full bg-orange-500/80" style={{ width: '14%' }}></div>
                           <div className="h-full bg-red-500/80" style={{ width: '0%' }}></div>
                           <div className="h-full bg-gray-500/50" style={{ width: '24%' }}></div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-sm font-medium text-white w-8">26</span>
                              <span className="flex-1 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Conforme</span>
                              <span className="text-sm text-gray-400">62%</span>
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-sm font-medium text-white w-8">6</span>
                              <span className="flex-1 text-sm text-orange-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Não conforme</span>
                              <span className="text-sm text-gray-400">14%</span>
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-sm font-medium text-white w-8">0</span>
                              <span className="flex-1 text-sm text-red-400 flex items-center gap-2"><X className="w-4 h-4"/> Não se aplica</span>
                              <span className="text-sm text-gray-400">0%</span>
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-sm font-medium text-white w-8">10</span>
                              <span className="flex-1 text-sm text-gray-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500 ml-1 mr-1"></div> Pendente</span>
                              <span className="text-sm text-gray-400">24%</span>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Ações Rápidas</h3>
                        <div className="space-y-2">
                           <button className="w-full flex items-center gap-3 p-3 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
                              <Search className="w-4 h-4" /> Visualizar checklist
                           </button>
                           <button className="w-full flex items-center gap-3 p-3 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
                              <Edit2 className="w-4 h-4" /> Editar checklist
                           </button>
                           <button className="w-full flex items-center gap-3 p-3 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
                              <Copy className="w-4 h-4" /> Duplicar checklist
                           </button>
                           <button className="w-full flex items-center gap-3 p-3 text-sm text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10 mt-4">
                              <PowerOff className="w-4 h-4" /> Desativar checklist
                           </button>
                        </div>
                     </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

