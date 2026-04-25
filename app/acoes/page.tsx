"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, CheckCircle2, Activity, Edit2, Trash2, X, Clock, Play, MoreVertical, Download, AlertTriangle, Shield, Headphones, Settings, MapPin, FileText, Check, ChevronRight, PowerOff } from 'lucide-react';

type ActionItem = {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Atrasada';
  deadline: string;
  origin: string;
  responsible: { name: string; role: string; avatar: string };
  progress: number;
  category: string;
};

const initialActions: ActionItem[] = [
  { id: '1', title: 'Instalar proteção fixa na máquina', origin: 'Inspeção de Máquinas #INS-2024-0050', category: 'Máquinas', responsible: { name: 'Carlos Mendes', role: 'Manutenção', avatar: 'https://i.pravatar.cc/150?u=carlos' }, priority: 'Alta', status: 'Atrasada', deadline: '2024-05-25', progress: 0, description: 'Instalar proteção fixa na máquina prensa hidráulica localizada no setor de produção para evitar acesso à área de risco.' },
  { id: '2', title: 'Sinalizar área de empilhadeiras', origin: 'Inspeção de Segurança #INS-2024-0048', category: 'Segurança', responsible: { name: 'Juliana Costa', role: 'SSO', avatar: 'https://i.pravatar.cc/150?u=juliana' }, priority: 'Média', status: 'Em andamento', deadline: '2024-05-28', progress: 40, description: 'Colocar faixas de segurança refletivas no entorno do corredor B.' },
  { id: '3', title: 'Treinar equipe em NR-12', origin: 'Risco #R-1023 - Risco Alto', category: 'Treinamento', responsible: { name: 'Beatriz Lima', role: 'Recursos Humanos', avatar: 'https://i.pravatar.cc/150?u=beatriz' }, priority: 'Alta', status: 'Em andamento', deadline: '2024-05-30', progress: 60, description: 'Realizar treinamento teórico e prático de NR-12 com os operadores.' },
  { id: '4', title: 'Substituir EPI danificado', origin: 'Inspeção de EPI #INS-2024-0046', category: 'EPI', responsible: { name: 'Rafael Oliveira', role: 'SSO', avatar: 'https://i.pravatar.cc/150?u=rafael' }, priority: 'Média', status: 'Pendente', deadline: '2024-06-01', progress: 0, description: 'Substituir protetores auriculares e óculos de proteção.' },
];

export default function AcoesPage() {
  const [items, setItems] = useState<ActionItem[]>(initialActions);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal for New Action
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Drawer for Edit/View Details
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [activeTab, setActiveTab] = useState('Resumo');

  const [formData, setFormData] = useState<Partial<ActionItem>>({
    title: '', description: '', priority: 'Média', status: 'Pendente', deadline: new Date().toISOString().split('T')[0]
  });

  const handleOpenDetails = (item: ActionItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDrawerOpen(true);
    setActiveTab('Resumo');
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', description: '', priority: 'Média', status: 'Pendente', deadline: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    // Creating NEW action
    setItems(prev => [{ 
      ...formData, 
      id: Math.random().toString(),
      origin: 'Ação Avulsa',
      responsible: { name: 'Não atribuído', role: '', avatar: 'https://i.pravatar.cc/150?u=unassigned' },
      progress: 0,
      category: 'Geral'
    } as ActionItem, ...prev]);
    setIsModalOpen(false);
  };

  const handleSaveDrawer = () => {
     // Save edit
     if (editingItem) {
        setItems(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...formData } as ActionItem : r));
     }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.filter(r => r.id !== id));
    if (editingItem?.id === id) setIsDrawerOpen(false);
  };

  const filtered = items.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'Alta': return 'text-red-500';
      case 'Média': return 'text-orange-500';
      case 'Baixa': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: string, status: string) => {
     if (status === 'Concluída') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
     switch (category) {
        case 'Máquinas': return <AlertTriangle className="w-5 h-5 text-red-500" />;
        case 'Segurança': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'EPI': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'Treinamento': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        case 'Auditoria': return <Headphones className="w-5 h-5 text-blue-500" />;
        case 'Riscos': return <MapPin className="w-5 h-5 text-emerald-400" />;
        default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
     }
  };
  
  const getCategoryBgColor = (category: string, status: string) => {
      if (status === 'Concluída') return 'bg-emerald-500/10 border-emerald-500/20';
      switch (category) {
        case 'Máquinas': return 'bg-red-500/10 border-red-500/20';
        case 'Segurança': return 'bg-yellow-500/10 border-yellow-500/20';
        case 'EPI': return 'bg-yellow-500/10 border-yellow-500/20';
        case 'Treinamento': return 'bg-emerald-500/10 border-emerald-500/20';
        case 'Auditoria': return 'bg-blue-500/10 border-blue-500/20';
        case 'Riscos': return 'bg-emerald-500/10 border-emerald-500/20';
        default: return 'bg-gray-500/10 border-gray-500/20';
     }
  }

  const getStatusStyle = (status: string) => {
      switch (status) {
         case 'Pendente': return 'text-orange-400';
         case 'Em andamento': return 'text-blue-400';
         case 'Concluída': return 'text-emerald-400';
         case 'Atrasada': return 'text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md';
         default: return 'text-gray-400';
      }
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      <motion.div 
        layout 
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
      >
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Ações</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie todas as ações corretivas e preventivas do sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
            <Download className="w-4 h-4" />
            Exportar relatório
          </button>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
            <Plus className="w-4 h-4" />
            Nova ação
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 shrink-0">
         <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
               <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total de Ações</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">48</div>
               <p className="text-[10px] text-gray-500">Todas as ações cadastradas</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
               <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pendentes</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">18</div>
               <p className="text-[10px] text-gray-500">37,5% do total</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
               <Play className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Em Andamento</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">12</div>
               <p className="text-[10px] text-gray-500">25% do total</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Concluídas</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">16</div>
               <p className="text-[10px] text-gray-500">33,3% do total</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Atrasadas</h3>
               <div className="text-2xl font-bold text-white leading-none mb-1">6</div>
               <p className="text-[10px] text-gray-500">12,5% do total</p>
            </div>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-4 mb-4 shrink-0 bg-[#121826] p-2 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar ações..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-9 pr-4 py-2 text-sm text-white focus:outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="w-px bg-white/5 my-1"></div>
        <select className="bg-transparent text-sm text-gray-300 focus:outline-none appearance-none px-3 cursor-pointer">
           <option value="">Status: Todos</option>
        </select>
        <select className="bg-transparent text-sm text-gray-300 focus:outline-none appearance-none px-3 cursor-pointer">
           <option value="">Prioridade: Todos</option>
        </select>
        <select className="bg-transparent text-sm text-gray-300 focus:outline-none appearance-none px-3 cursor-pointer hidden md:block">
           <option value="">Origem: Todos</option>
        </select>
        <select className="bg-transparent text-sm text-gray-300 focus:outline-none appearance-none px-3 cursor-pointer hidden md:block">
           <option value="">Responsável: Todos</option>
        </select>
        <div className="ml-auto">
           <button className="flex items-center gap-2 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 border border-white/5">
             <Settings className="w-4 h-4" />
             Filtros
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#121826] rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#121826] z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Ação</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Origem</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">Prioridade</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Responsável</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Prazo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Progresso</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => {
                  const isOverdue = new Date(item.deadline) < new Date() && item.status !== 'Concluída';
                  return (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenDetails(item)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${getCategoryBgColor(item.category, item.status)}`}>
                          {getCategoryIcon(item.category, item.status)}
                        </div>
                        <div>
                           <h3 className="text-sm font-semibold text-white mb-0.5">{item.title}</h3>
                           <p className="text-[11px] text-gray-500">{item.origin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{item.category}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-medium tracking-wide ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex items-center gap-2">
                          <img src={item.responsible.avatar} alt="Avatar" className="w-6 h-6 rounded-full bg-gray-800" />
                          <div>
                             <p className="text-sm text-gray-300 leading-tight">{item.responsible.name}</p>
                             <p className="text-[10px] text-gray-500">{item.responsible.role}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-4 relative">
                       <div className="flex flex-col">
                          <span className="text-sm text-gray-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> {new Date(item.deadline).toLocaleDateString('pt-BR')}</span>
                          {isOverdue && <span className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" /> Vence hoje</span>}
                       </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-medium tracking-wide ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-gray-400">{item.progress}%</span>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full ${item.status === 'Concluída' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${item.progress}%` }}></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                       <button className="p-1.5 text-gray-500 hover:text-white rounded transition-colors" onClick={(e) => { e.stopPropagation(); handleOpenDetails(item); }}>
                          <MoreVertical className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
      </div>
    </div>
  </motion.div>

      {/* Modal for NEW ACTION */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                <h2 className="text-lg font-bold text-white">Nova Ação</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Título da Ação</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">O que deve ser feito?</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prioridade</label>
                    <select 
                      value={formData.priority} 
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prazo Limite</label>
                    <input 
                      type="date" 
                      value={formData.deadline} 
                      onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveModal} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg">
                  Criar Ação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Drawer for EDIT/VIEW ACTION */}
      <AnimatePresence>
        {isDrawerOpen && editingItem && (
          <motion.div 
            initial={{ width: 0, borderLeftWidth: 0, opacity: 0 }} 
            animate={{ width: 480, borderLeftWidth: 1, opacity: 1 }} 
            exit={{ width: 0, borderLeftWidth: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full bg-[#121826] border-white/10 shadow-2xl z-40 flex flex-col overflow-hidden"
          >
             <div className="w-[480px] h-full flex flex-col">
               {/* Header Info */}
               <div className="p-6 border-b border-white/5 shrink-0 bg-[#0B0F19]/50">
                   <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Detalhes da Ação</h3>
                      <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                   </div>
                   <div className="flex gap-4 items-start mb-4">
                      <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${getCategoryBgColor(editingItem.category, editingItem.status)}`}>
                        {getCategoryIcon(editingItem.category, editingItem.status)}
                      </div>
                      <div>
                         <h2 className="text-xl font-bold text-white leading-tight mb-2">{editingItem.title}</h2>
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border rounded-md inline-block ${
                            editingItem.status === 'Atrasada' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            editingItem.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            editingItem.status === 'Em andamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-orange-500/10 text-orange-400 border-orange-500/20'
                         }`}>
                            {editingItem.status}
                         </span>
                      </div>
                   </div>

                   {/* Tabs */}
                   <div className="flex border-b border-white/10 mt-6">
                      {['Resumo', 'Histórico', 'Anexos', 'Comentários'].map(tab => (
                         <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                               activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                         >
                            {tab}
                         </button>
                      ))}
                   </div>
               </div>

               {/* Scrolling Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {activeTab === 'Resumo' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                         <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">{editingItem.description}</p>
                         </div>
                         <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Origem</h4>
                            <p className="text-sm text-purple-400 hover:underline cursor-pointer">{editingItem.origin}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Risco Associado</h4>
                            <p className="text-sm text-gray-300">Risco de esmagamento por partes móveis</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                            <div>
                               <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Prioridade</h4>
                               <p className={`text-sm font-medium flex items-center gap-1.5 ${getPriorityColor(editingItem.priority)}`}>
                                 <span className={`w-2 h-2 rounded-full ${editingItem.priority === 'Alta' ? 'bg-red-500' : editingItem.priority === 'Média' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                 {editingItem.priority}
                               </p>
                            </div>
                            <div>
                               <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Prazo</h4>
                               <p className="text-sm text-white flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-gray-400" />
                                 {new Date(editingItem.deadline).toLocaleDateString('pt-BR')}
                                 {new Date(editingItem.deadline) < new Date() && editingItem.status !== 'Concluída' && (
                                    <span className="text-[10px] text-red-500 uppercase font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vence hoje</span>
                                 )}
                               </p>
                            </div>
                         </div>

                         <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Responsável</h4>
                            <div className="flex items-center gap-3">
                               <img src={editingItem.responsible.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-gray-800" />
                               <div>
                                  <p className="text-sm font-medium text-white">{editingItem.responsible.name}</p>
                                  <p className="text-xs text-gray-500">{editingItem.responsible.role}</p>
                               </div>
                            </div>
                         </div>

                         <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</h4>
                            <div className="flex items-center justify-between mb-2">
                               <p className="text-sm text-white flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                 Progresso
                               </p>
                               <span className="text-sm font-medium text-gray-300">{editingItem.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-purple-500" style={{ width: `${editingItem.progress}%` }}></div>
                            </div>
                         </div>
                      </motion.div>
                   )}
                   {activeTab !== 'Resumo' && (
                       <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                          <p className="text-sm">Conteúdo da aba {activeTab} em construção.</p>
                       </div>
                   )}
               </div>

               {/* Action Buttons */}
               <div className="p-6 border-t border-white/5 bg-[#0B0F19]/50 flex flex-col gap-3 shrink-0">
                  <button className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
                     <Edit2 className="w-4 h-4" /> Editar ação
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 border border-white/10 p-3 rounded-lg text-sm font-medium transition-colors">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Marcar como concluída
                  </button>
                  <button onClick={() => handleDelete(editingItem.id)} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 p-3 rounded-lg text-sm font-medium transition-colors mt-2">
                     <Trash2 className="w-4 h-4" /> Cancelar ação
                  </button>
               </div>
             </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
