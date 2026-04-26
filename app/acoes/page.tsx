"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NormativeEngine, EconomicImpactEngine } from '@/lib/engines';
import { Plus, Search, CheckCircle2, Activity, Edit2, Trash2, X, Clock, Play, MoreVertical, Download, AlertTriangle, Shield, Headphones, Settings, MapPin, FileText, Check, ChevronRight, ChevronLeft, PowerOff, BellRing, UserMinus, Sparkles, User, UserX, AlertCircle, PlayCircle, Flame } from 'lucide-react';


type ActionItem = {
  id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  priorityIcon: 'alert' | 'clock' | 'play' | 'activity';
  status: 'Atrasada' | 'Vence hoje' | 'Em andamento' | 'Pendente' | 'Monitorando' | 'Concluída';
  deadlineTime: string;
  deadlineRelative: string;
  deadlineColor: 'red' | 'yellow' | 'blue' | 'gray';
  originText: string;
  originIcon: 'shield-blue' | 'shield-yellow' | 'shield-purple' | 'triangle-green' | 'fire-red';
  responsible: { name: string; role: string; avatar: string };
  nextStep: string;
  category: string;
  reasons: string[];
  checklist: { label: string; checked: boolean }[];
};

const initialActions: ActionItem[] = [
  { 
    id: '1', 
    title: 'Instalar proteção fixa na máquina', 
    originText: 'Inspeção de Máquinas', 
    originIcon: 'shield-blue',
    category: 'Máquinas', 
    responsible: { name: 'Carlos Mendes', role: 'Manutenção', avatar: 'https://i.pravatar.cc/150?u=carlos' }, 
    priority: 'P1', 
    priorityIcon: 'alert',
    status: 'Atrasada', 
    deadlineTime: 'Hoje 14h',
    deadlineRelative: 'Atrasado',
    deadlineColor: 'red',
    nextStep: 'Validar instalação e evidência',
    description: 'Instalar proteção fixa na máquina prensa hidráulica localizada no setor de produção para evitar acesso à área de risco.',
    reasons: [
      'Máquina sem proteção fixa instalada.',
      'Risco de contato com partes móveis.',
      'Ação vencida hoje.'
    ],
    checklist: [
      { label: 'Verificar proteção instalada conforme padrão', checked: false },
      { label: 'Validar bloqueio e sinalização de segurança', checked: false },
      { label: 'Registrar foto da proteção instalada', checked: false },
      { label: 'Confirmar responsável e assinatura', checked: false },
    ]
  },
  { 
    id: '2', 
    title: 'Sinalizar área de empilhadeiras', 
    originText: 'Inspeção de Segurança', 
    originIcon: 'shield-yellow',
    category: 'Segurança', 
    responsible: { name: 'Juliana Costa', role: 'SSO', avatar: 'https://i.pravatar.cc/150?u=juliana' }, 
    priority: 'P1', 
    priorityIcon: 'alert',
    status: 'Vence hoje', 
    deadlineTime: 'Hoje 16h',
    deadlineRelative: 'Vence hoje',
    deadlineColor: 'yellow',
    nextStep: 'Isolar área e anexar foto',
    description: 'Colocar faixas de segurança refletivas no entorno do corredor B.',
    reasons: [
      'Risco alto de atropelamento.',
      'Sinalização antiga está muito gasta.',
      'Área de alta circulação de pedestres.'
    ],
    checklist: [
      { label: 'Comprar fita demarcação', checked: true },
      { label: 'Aplicar fita no piso', checked: false },
      { label: 'Instalar placas de aviso', checked: false },
    ]
  },
  { 
    id: '3', 
    title: 'Treinar equipe em NR-12', 
    originText: 'Risco #R-1023',
    originIcon: 'triangle-green',
    category: 'Treinamento', 
    responsible: { name: 'Beatriz Lima', role: 'Recursos Humanos', avatar: 'https://i.pravatar.cc/150?u=beatriz' }, 
    priority: 'P1', 
    priorityIcon: 'play',
    status: 'Em andamento', 
    deadlineTime: 'Amanhã 10h',
    deadlineRelative: 'Em 22h',
    deadlineColor: 'blue',
    nextStep: 'Agendar turma e confirmar presença',
    description: 'Realizar treinamento teórico e prático de NR-12 com os operadores.',
    reasons: [
      'Nova máquina adquirida sem treinamento',
      'Exigência legal vigente'
    ],
    checklist: [
      { label: 'Contratar instrutor', checked: true },
      { label: 'Reservar sala de treinamento', checked: false },
      { label: 'Convocar 15 operadores', checked: false },
    ]
  },
  { 
    id: '4', 
    title: 'Substituir EPI danificado', 
    originText: 'Inspeção de EPI', 
    originIcon: 'shield-purple',
    category: 'EPI', 
    responsible: { name: 'Rafael Oliveira', role: 'SSO', avatar: 'https://i.pravatar.cc/150?u=rafael' }, 
    priority: 'P2', 
    priorityIcon: 'clock',
    status: 'Pendente', 
    deadlineTime: 'Amanhã 15h',
    deadlineRelative: 'Em 1 dia',
    deadlineColor: 'gray',
    nextStep: 'Entregar novo kit e registrar',
    description: 'Substituir protetores auriculares e óculos de proteção.',
    reasons: [
      'EPI do funcionário sem condições de uso',
      'Alto ruído no local'
    ],
    checklist: [
      { label: 'Solicitar EPI no almoxarifado', checked: true },
      { label: 'Entregar para funcionário', checked: false },
      { label: 'Assinar ficha de EPI', checked: false },
    ]
  },
  { 
    id: '5', 
    title: 'Revisar isolamento da área quente', 
    originText: 'Trabalho a quente', 
    originIcon: 'fire-red',
    category: 'Manutenção', 
    responsible: { name: 'Marcos Silva', role: 'Manutenção', avatar: 'https://i.pravatar.cc/150?u=marcos' }, 
    priority: 'P2', 
    priorityIcon: 'activity',
    status: 'Monitorando', 
    deadlineTime: '48h',
    deadlineRelative: 'Em 2 dias',
    deadlineColor: 'gray',
    nextStep: 'Revisar barreiras e liberar área',
    description: 'Revisar isolamento devido a serviço temporário de soldagem.',
    reasons: [
      'Serviço requer isolamento especial',
      'Área com material inflamável próximo'
    ],
    checklist: [
      { label: 'Montar tapumes ignífugos', checked: true },
      { label: 'Validar extintor próximo', checked: true },
      { label: 'Inspecionar após 2h do término', checked: false },
    ]
  },
];

export default function AcoesPage() {
  const [items, setItems] = useState<ActionItem[]>(initialActions);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal for New Action
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Drawer for Edit/View Details
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [activeTab, setActiveTab] = useState('Resumo');

  const [formData, setFormData] = useState<Partial<ActionItem>>({
    title: '', description: '', priority: 'P2', status: 'Pendente', deadlineTime: ''
  });

  const normativeDetection = NormativeEngine.detect(`${formData.title} ${formData.description}`);

  const handleOpenDetails = (item: ActionItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', description: '', priority: 'P2', status: 'Pendente', deadlineTime: '' });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    setItems(prev => [{ 
      ...formData, 
      id: Math.random().toString(),
      originText: 'Ação Avulsa',
      originIcon: 'shield-blue',
      responsible: { name: 'Não atribuído', role: '', avatar: 'https://i.pravatar.cc/150?u=unassigned' },
      category: 'Geral',
      priorityIcon: 'clock',
      deadlineRelative: 'Em breve',
      deadlineColor: 'gray',
      nextStep: 'Definir',
      reasons: [],
      checklist: []
    } as ActionItem, ...prev]);
    setIsModalOpen(false);
  };

  const handleConcluir = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'Concluída' } as ActionItem : item));
    if (editingItem?.id === id) {
      setEditingItem(prev => prev ? { ...prev, status: 'Concluída' } as ActionItem : null);
    }
  };

  const handleCobrar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Notificação de cobrança enviada ao responsável!');
  };

  const handleExecutar = () => {
    if (!editingItem) return;
    const updated = { ...editingItem, status: 'Em andamento' } as ActionItem;
    setEditingItem(updated);
    setItems(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleToggleChecklist = (idx: number) => {
    if (!editingItem) return;
    const newChecklist = [...(editingItem.checklist || [])];
    newChecklist[idx] = { ...newChecklist[idx], checked: !newChecklist[idx].checked };
    const updatedItem = { ...editingItem, checklist: newChecklist };
    setEditingItem(updatedItem);
    setItems(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.filter(r => r.id !== id));
    if (editingItem?.id === id) setIsDrawerOpen(false);
  };

  const filtered = items.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'P1': return 'text-red-500';
      case 'P2': return 'text-orange-500';
      case 'P3': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'alert': return <AlertTriangle className={className} />;
      case 'clock': return <Clock className={className} />;
      case 'play': return <Play className={className} />;
      case 'activity': return <Activity className={className} />;
      default: return <Activity className={className} />;
    }
  };

  const getOriginIconComponent = (icon: string) => {
    switch(icon) {
       case 'shield-blue': return <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-blue-400" /></div>;
       case 'shield-yellow': return <div className="w-6 h-6 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-yellow-400" /></div>;
       case 'shield-purple': return <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-purple-400" /></div>;
       case 'triangle-green': return <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-emerald-400" /></div>;
       case 'fire-red': return <div className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center"><Flame className="w-3.5 h-3.5 text-red-500" /></div>;
       default: return <div className="w-6 h-6 rounded-md bg-gray-500/10 border border-gray-500/20 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-gray-400" /></div>;
    }
  }

  const getStatusStyle = (status: string) => {
      switch (status) {
         case 'Pendente': return 'text-gray-400 border-gray-500/30 bg-transparent';
         case 'Em andamento': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
         case 'Concluída': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
         case 'Atrasada': return 'text-red-400 border-red-500/30 bg-red-500/10';
         case 'Vence hoje': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
         case 'Monitorando': return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
         default: return 'text-gray-400 border-gray-500/30 bg-transparent';
      }
  };

  const getDeadlineColorClass = (colorName: string) => {
      switch(colorName) {
         case 'red': return 'text-red-500';
         case 'yellow': return 'text-yellow-500';
         case 'blue': return 'text-blue-400';
         default: return 'text-gray-500';
      }
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <motion.div 
        layout 
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
      >
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Ações prioritárias</h1>
          <p className="text-sm text-gray-400 mt-1">Execute, acompanhe e destrave ações corretivas e preventivas com prioridade clara.</p>
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
         <div className="bg-[#121826] border border-red-500/30 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4">
               <BellRing className="w-5 h-5 text-red-500" />
               <h3 className="text-sm font-medium text-gray-300">Ação imediata</h3>
            </div>
            <div className="flex flex-col">
               <div className="text-3xl font-bold text-white mb-1">6</div>
               <p className="text-xs text-gray-500 font-medium">urgentes hoje</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
               <Clock className="w-5 h-5 text-yellow-500" />
               <h3 className="text-sm font-medium text-gray-300">Vencem hoje</h3>
            </div>
            <div className="flex flex-col">
               <div className="text-3xl font-bold text-white mb-1">4</div>
               <p className="text-xs text-gray-500 font-medium">vencendo hoje</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               <h3 className="text-sm font-medium text-gray-300">Em atraso</h3>
            </div>
            <div className="flex flex-col">
               <div className="text-3xl font-bold text-white mb-1">6</div>
               <p className="text-xs text-gray-500 font-medium">atrasadas</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
               <UserX className="w-5 h-5 text-purple-400" />
               <h3 className="text-sm font-medium text-gray-300">Aguardando responsável</h3>
            </div>
            <div className="flex flex-col">
               <div className="text-3xl font-bold text-white mb-1">3</div>
               <p className="text-xs text-gray-500 font-medium">sem responsável</p>
            </div>
         </div>
         <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-4">
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <h3 className="text-sm font-medium text-gray-300">Concluídas esta semana</h3>
            </div>
            <div className="flex flex-col">
               <div className="text-3xl font-bold text-white mb-1">16</div>
               <p className="text-xs text-gray-500 font-medium">concluídas</p>
            </div>
         </div>
      </div>

      {/* Recomendação Operacional */}
      <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex items-center justify-between gap-4 mb-6 shrink-0 group cursor-pointer hover:bg-white/5 transition-colors">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
               <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
               <h3 className="text-sm font-bold text-purple-300 mb-1 leading-none">Recomendação operacional</h3>
               <p className="text-sm text-gray-300">Priorize proteção de máquina, empilhadeiras e treinamento NR-12. Há 6 ações urgentes e 4 vencendo hoje.</p>
            </div>
         </div>
         <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
      </div>

      {/* Fila de execução Header */}
      <h2 className="text-lg font-bold text-white mb-4 shrink-0">Fila de execução</h2>

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
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Prioridade</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Ação</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Origem</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Responsável</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Prazo</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Próxima etapa</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[220px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => {
                  return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center gap-1.5 bg-white/5 w-fit px-2.5 py-1 rounded border border-white/10">
                        <span className={`text-[11px] font-bold ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                        <span className={`${getPriorityColor(item.priority)}`}>{getPriorityIcon(item.priorityIcon, "w-3 h-3")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                        <h3 className="text-[13px] font-semibold text-white cursor-pointer hover:underline" onClick={() => handleOpenDetails(item)}>{item.title}</h3>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getOriginIconComponent(item.originIcon)}
                        <div>
                           <p className="text-xs text-gray-300">{item.originText}</p>
                           <p className="text-[10px] text-gray-500">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                       <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.responsible.avatar} alt="Avatar" className="w-6 h-6 rounded-full bg-gray-800" />
                          <div>
                             <p className="text-[13px] text-gray-300 leading-tight">{item.responsible.name}</p>
                             <p className="text-[10px] text-gray-500">{item.responsible.role}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-5 py-4">
                       <div className="flex flex-col">
                          <span className="text-[13px] text-gray-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> {item.deadlineTime}</span>
                          <span className={`text-[11px] font-medium mt-0.5 ${getDeadlineColorClass(item.deadlineColor)}`}>{item.deadlineRelative}</span>
                       </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-[11px] px-2.5 py-1 rounded border ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                       <span className="text-xs text-gray-400 block max-w-[150px] truncate" title={item.nextStep}>{item.nextStep}</span>
                    </td>
                    <td className="px-5 py-4">
                       <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenDetails(item); }} className="px-3 py-1.5 text-xs font-medium text-white bg-[#121826] hover:bg-white/10 rounded transition-colors border border-white/10 focus:outline-none">
                             Abrir
                          </button>
                          <button onClick={(e) => handleCobrar(item.id, e)} className="px-3 py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded transition-colors border border-orange-500/30 focus:outline-none">
                             Cobrar
                          </button>
                          <button onClick={(e) => handleConcluir(item.id, e)} className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors border border-emerald-500/30 focus:outline-none">
                             Concluir
                          </button>
                       </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 bg-[#121826]">
                 <span>Exibindo 1 a 5 de 48 ações</span>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <button className="px-2 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                       <button className="px-2.5 py-1 rounded bg-purple-600 text-white font-medium">1</button>
                       <button className="px-2.5 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors">2</button>
                       <button className="px-2.5 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors">3</button>
                       <span className="px-1 text-gray-600">...</span>
                       <button className="px-2.5 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors">10</button>
                       <button className="px-2 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                       <span>Itens por página:</span>
                       <select className="bg-[#0b0f19] border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500">
                          <option>5</option>
                          <option>10</option>
                          <option>20</option>
                       </select>
                    </div>
                 </div>
              </div>
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
                        <option value="P1">P1 - Alta</option>
                        <option value="P2">P2 - Média</option>
                        <option value="P3">P3 - Baixa</option>
                     </select>
                  </div>
                  <div className="col-span-1">
                     <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Prazo (Ex: Hoje 14h)</label>
                     <input 
                        type="text" 
                        value={formData.deadlineTime} 
                        onChange={e => setFormData({...formData, deadlineTime: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                     />
                  </div>
                </div>

                {normativeDetection && (
                   <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3 mt-4">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Contexto: {normativeDetection.nr}
                      </h4>
                      <p className="text-xs text-gray-300">
                        <strong>Severidade Estimada:</strong> <span className={normativeDetection.severity === 'crítica' ? 'text-red-400' : 'text-orange-400'}>{normativeDetection.severity.toUpperCase()}</span>
                      </p>
                      <p className="text-xs text-gray-300">
                        <strong>Recomendação:</strong> {normativeDetection.recommendedAction}
                      </p>
                      <button 
                         onClick={() => setFormData({...formData, description: `${formData.description}\n\nRecomendação: ${normativeDetection.recommendedAction}`, priority: 'P1'})}
                         className="w-full py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-600/30 mt-2"
                       >
                        Aplicar Recomendação na Ação
                      </button>
                   </div>
                )}
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
            initial={{ width: 0, opacity: 0, x: 50 }} 
            animate={{ width: 420, opacity: 1, x: 0 }} 
            exit={{ width: 0, opacity: 0, x: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full bg-[#121826] border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col overflow-hidden"
          >
             <div className="w-[420px] h-full flex flex-col pt-safe-top overflow-y-auto">
               
               <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Ação Imediata —</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="px-6 mb-6 shrink-0">
                  <h2 className="text-xl font-bold text-white leading-tight">{editingItem.title}</h2>
               </div>

               <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
                  {/* Por que agir agora Box */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1c2333] to-[#121826] border border-white/10">
                     <div className="flex items-center gap-2 mb-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-sm font-bold">Por que agir agora</h4>
                     </div>
                     <ul className="space-y-2.5">
                        {editingItem.reasons && editingItem.reasons.length > 0 ? (
                           editingItem.reasons.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[13px] text-gray-300">
                                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                 <span className="leading-snug">{reason}</span>
                              </li>
                           ))
                        ) : (
                           <li className="text-[13px] text-gray-400">Nenhum motivo específico registrado.</li>
                        )}
                     </ul>
                  </div>

                  {/* Checklist Imediato */}
                  <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
                     <div className="flex items-center gap-2 mb-4 text-purple-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <h4 className="text-sm font-bold">Checklist imediato</h4>
                     </div>
                     <div className="space-y-3">
                        {editingItem.checklist && editingItem.checklist.length > 0 ? (
                           editingItem.checklist.map((item, idx) => (
                              <label key={idx} className="flex items-start gap-3 cursor-pointer group hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                                 <input type="checkbox" checked={item.checked} onChange={() => handleToggleChecklist(idx)} className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-transparent checked:bg-purple-500 checked:border-purple-500 focus:ring-offset-0 focus:ring-0" />
                                 <span className="text-[13px] text-gray-300 group-hover:text-white leading-snug">{item.label}</span>
                              </label>
                           ))
                        ) : (
                           <span className="text-[13px] text-gray-400">Nenhum item de checklist definido.</span>
                        )}
                     </div>
                  </div>

                  {/* Responsavel / Prazo Row */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-xl border border-white/5 bg-[#0b0f19]">
                        <div className="flex items-center gap-2 mb-3">
                           <User className="w-4 h-4 text-gray-500" />
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Responsável</h4>
                        </div>
                        <div className="flex gap-3 items-center">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={editingItem.responsible.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-800" />
                           <div>
                              <p className="text-sm font-semibold text-white leading-tight">{editingItem.responsible.name}</p>
                              <p className="text-[11px] text-gray-500">{editingItem.responsible.role}</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-4 rounded-xl border border-white/5 bg-[#0b0f19]">
                        <div className="flex items-center gap-2 mb-3">
                           <Clock className="w-4 h-4 text-gray-500" />
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prazo</h4>
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">{editingItem.deadlineTime}</p>
                           <p className={`text-[11px] font-medium mt-0.5 ${getDeadlineColorClass(editingItem.deadlineColor)}`}>{editingItem.deadlineRelative}</p>
                        </div>
                     </div>
                  </div>

                  {/* Próxima etapa */}
                  <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                     <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Activity className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Próxima etapa</h4>
                     </div>
                     <p className="text-[13px] text-gray-200">{editingItem.nextStep}</p>
                  </div>

                  {/* Impacto Financeiro (P1/P2) */}
                  {(editingItem.priority === 'P1' || editingItem.priority === 'P2') && (() => {
                    const estimate = EconomicImpactEngine.estimate({ 
                      severityLevel: editingItem.priority === 'P1' ? 'crítico' : 'alto', 
                      exposedPeople: 1, 
                      recurrence: false 
                    });
                    return (
                      <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5">
                         <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                           Economia Estimada (Ação Preventiva)
                         </h4>
                         <div className="text-red-400 font-bold text-sm mb-1">
                           {EconomicImpactEngine.formatCurrency(estimate.min)} a {EconomicImpactEngine.formatCurrency(estimate.max)}
                         </div>
                         <div className="text-[9px] text-gray-500 italic mt-2">
                           Estimativa preventiva. O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento.
                         </div>
                      </div>
                    );
                  })()}

               </div>

               {/* Action Buttons */}
               <div className="p-6 border-t border-white/5 bg-[#0B0F19] flex flex-col gap-3 shrink-0">
                  <button onClick={handleExecutar} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-3.5 rounded-xl text-sm font-bold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50">
                     <PlayCircle className="w-5 h-5 flex-shrink-0" /> Executar agora
                  </button>
                  <button onClick={() => handleDelete(editingItem.id)} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 p-3.5 rounded-xl text-sm font-medium transition-colors">
                     <Trash2 className="w-4 h-4 flex-shrink-0" /> Excluir Ação
                  </button>
                  <button onClick={() => setIsDrawerOpen(false)} className="w-full flex items-center justify-center gap-2 bg-[#121826] hover:bg-white/10 text-gray-300 border border-white/10 p-3.5 rounded-xl text-sm font-medium transition-colors">
                     Fechar
                  </button>
               </div>
             </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
