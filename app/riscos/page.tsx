"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, AlertTriangle, X, ChevronRight,
  TrendingDown, TrendingUp, Users, Clock, Shield,
  Activity, BarChart2, ShieldAlert, CheckCircle2,
  Trash2, Edit2
} from 'lucide-react';

type RiskData = {
  id: string;
  name: string;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  maiorRisco: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  total: number;
};

const initialDataAtividade: RiskData[] = [
  { id: '1', name: 'Trabalho em altura', criticos: 6, altos: 9, medios: 4, baixos: 1, maiorRisco: 'Crítico', total: 20 },
  { id: '2', name: 'Manutenção elétrica', criticos: 5, altos: 7, medios: 6, baixos: 2, maiorRisco: 'Crítico', total: 20 },
  { id: '3', name: 'Operação de máquinas', criticos: 3, altos: 6, medios: 5, baixos: 2, maiorRisco: 'Alto', total: 16 },
  { id: '4', name: 'Movimentação de cargas', criticos: 2, altos: 4, medios: 3, baixos: 1, maiorRisco: 'Alto', total: 10 },
  { id: '5', name: 'Trabalho a quente', criticos: 1, altos: 2, medios: 2, baixos: 0, maiorRisco: 'Alto', total: 5 },
  { id: '6', name: 'Limpeza e higienização', criticos: 0, altos: 2, medios: 3, baixos: 4, maiorRisco: 'Médio', total: 9 },
];

export default function RiscosPage() {
  const [activeTab, setActiveTab] = useState<'Atividade' | 'Setor' | 'Críticos'>('Atividade');
  const [data, setData] = useState<RiskData[]>(initialDataAtividade);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiskData | null>(null);
  const [formData, setFormData] = useState<Partial<RiskData>>({
    name: '', criticos: 0, altos: 0, medios: 0, baixos: 0, total: 0, maiorRisco: 'Médio'
  });

  const getMaiorRiscoColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Alto': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const handleOpenEdit = (item: RiskData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingItem(item);
    setFormData(item);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', criticos: 0, altos: 0, medios: 0, baixos: 0, total: 0, maiorRisco: 'Baixo' });
    setIsDrawerOpen(true);
  };

  const calculateTotalAndMaiorRisco = (fd: Partial<RiskData>) => {
    const total = (Number(fd.criticos) || 0) + (Number(fd.altos) || 0) + (Number(fd.medios) || 0) + (Number(fd.baixos) || 0);
    let maiorRisco: RiskData['maiorRisco'] = 'Baixo';
    if (Number(fd.criticos) > 0) maiorRisco = 'Crítico';
    else if (Number(fd.altos) > 0) maiorRisco = 'Alto';
    else if (Number(fd.medios) > 0) maiorRisco = 'Médio';
    return { total, maiorRisco };
  };

  const handleSave = () => {
    const { total, maiorRisco } = calculateTotalAndMaiorRisco(formData);
    const itemToSave = { ...formData, total, maiorRisco } as RiskData;

    if (editingItem) {
      setData(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...itemToSave } : r));
    } else {
      setData(prev => [{ ...itemToSave, id: Math.random().toString() }, ...prev]);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setData(prev => prev.filter(r => r.id !== id));
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      <motion.div 
        layout 
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
      >
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          <header className="flex flex-col md:flex-row items-center gap-6 mb-6 shrink-0">
        <div className="bg-[#121826] p-1.5 rounded-xl border border-white/10 flex items-center gap-1">
          {['Atividade', 'Setor', 'Críticos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab === 'Críticos' ? '' : 'Por '}{tab}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500 font-medium hidden md:block">
          Alterne a visão para analisar os riscos do jeito que faz mais sentido.
        </div>
        
        <div className="flex-1"></div>
        
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Riscos</h3>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">101</div>
          <div className="text-xs text-purple-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            12% vs periodo anterior
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Críticos</h3>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">18</div>
          <div className="text-xs text-red-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            3 novos neste periodo
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Em Tratamento</h3>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Activity className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">53</div>
          <div className="text-xs text-orange-400 flex items-center gap-1">
            52% do total
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 p-5 rounded-xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pessoas Expostas</h3>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">245</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            Em riscos identificados
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden pb-10">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-lg h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Visão: Por {activeTab}</h2>
              <p className="text-xs text-gray-400">Ranking das atividades com maior concentração de riscos.</p>
            </div>
            <button className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
              <BarChart2 className="w-4 h-4" />
              Ver análise completa
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#121826] z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Atividade</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Críticos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Altos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Médios</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Baixos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Maior Risco</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap">Total de Riscos</th>
                  <th className="px-6 py-4 border-b border-white/5"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenEdit(item)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-purple-400 opacity-80 shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-200">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${item.criticos > 0 ? 'text-red-400' : 'text-gray-600'}`}>{item.criticos}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${item.altos > 0 ? 'text-orange-400' : 'text-gray-600'}`}>{item.altos}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${item.medios > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{item.medios}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${item.baixos > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>{item.baixos}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getMaiorRiscoColor(item.maiorRisco)}`}>
                        {item.maiorRisco}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-white">{item.total}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5">
             <button className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors">
               Ver todas as atividades <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Right Sidebar Columns */}
        <div className="w-full md:w-80 flex flex-col gap-6 overflow-y-auto pr-2 shrink-0 h-full !pb-20">
          {/* Alertas */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 shrink-0">
            <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2 mb-4">
              ALERTAS
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md">3</span>
            </h3>
            
            <div className="space-y-5">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 leading-snug mb-1">7 riscos críticos exigem ação imediata</p>
                  <p className="text-xs text-red-400 font-medium">3 estão vencidos</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                 <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                 </div>
                <div>
                  <p className="text-sm text-gray-300 leading-snug mb-1">9 ações estão atrasadas</p>
                  <p className="text-xs text-gray-500 font-medium">Destas, 4 são críticas</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                 <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                  <Users className="w-3.5 h-3.5 text-yellow-500" />
                 </div>
                <div>
                  <p className="text-sm text-gray-300 leading-snug mb-1">245 pessoas expostas a riscos críticos</p>
                  <p className="text-xs text-gray-500 font-medium">Priorize a mitigação</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              INSIGHTS
            </h3>
            
            <div className="space-y-5">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                   <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <p className="text-sm text-gray-300 leading-snug pt-0.5">Trabalho em altura concentra 33% dos riscos críticos</p>
              </div>
              <div className="flex gap-3 items-start">
                 <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                   <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                 </div>
                <p className="text-sm text-gray-300 leading-snug pt-0.5">Manutenção elétrica apresenta aumento de 15% nos riscos altos</p>
              </div>
              <div className="flex gap-3 items-start">
                 <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                 </div>
                <p className="text-sm text-gray-300 leading-snug pt-0.5">2 setores apresentaram redução de riscos no período</p>
              </div>
            </div>
          </div>

          {/* Recomendação */}
          <div className="bg-gradient-to-br from-purple-900/30 to-[#121826] border border-purple-500/30 rounded-2xl p-5 shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              AÇÃO RECOMENDADA
            </h3>
            <div className="flex gap-3 items-start mb-5">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-100 leading-snug">Priorize os riscos críticos vencidos e as ações em atraso.</p>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.4)]">
              Ver riscos críticos
            </button>
          </div>
        </div>
      </div>
     </div>
    </motion.div>

      {/* Right Side Drawer CRUD */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div 
            initial={{ width: 0, borderLeftWidth: 0, opacity: 0 }} 
            animate={{ width: 448, borderLeftWidth: 1, opacity: 1 }} 
            exit={{ width: 0, borderLeftWidth: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full bg-[#121826] border-white/10 shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            <div className="w-[448px] h-full flex flex-col pt-safe-top overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
                <h2 className="text-lg font-bold text-white">
                  {editingItem ? `Editar Registro` : `Novo Registro`}
                </h2>
                <div className="flex items-center gap-2">
                  {editingItem && (
                    <button 
                      onClick={(e) => handleDelete(editingItem.id, e)} 
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    Nome / Título da Atividade
                  </label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Trabalho em Altura"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-white/5">
                    Distribuição de Riscos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Críticos
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.criticos === 0 ? '' : formData.criticos} 
                        onChange={e => setFormData({...formData, criticos: parseInt(e.target.value) || 0})}
                        className="w-full bg-red-500/5 border border-red-500/20 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-orange-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Altos
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.altos === 0 ? '' : formData.altos} 
                        onChange={e => setFormData({...formData, altos: parseInt(e.target.value) || 0})}
                        className="w-full bg-orange-500/5 border border-orange-500/20 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-yellow-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Médios
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.medios === 0 ? '' : formData.medios} 
                        onChange={e => setFormData({...formData, medios: parseInt(e.target.value) || 0})}
                        className="w-full bg-yellow-500/5 border border-yellow-500/20 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Baixos
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.baixos === 0 ? '' : formData.baixos} 
                        onChange={e => setFormData({...formData, baixos: parseInt(e.target.value) || 0})}
                        className="w-full bg-emerald-500/5 border border-emerald-500/20 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 p-5 rounded-xl flex items-center justify-between">
                   <div>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Calculado</p>
                     <p className="text-3xl font-bold text-white">
                       {(Number(formData.criticos) || 0) + (Number(formData.altos) || 0) + (Number(formData.medios) || 0) + (Number(formData.baixos) || 0)}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Maior Nível</p>
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${
                       getMaiorRiscoColor(
                        Number(formData.criticos) > 0 ? 'Crítico' :
                        Number(formData.altos) > 0 ? 'Alto' :
                        Number(formData.medios) > 0 ? 'Médio' : 'Baixo'
                       )
                     }`}>
                       {Number(formData.criticos) > 0 ? 'Crítico' :
                        Number(formData.altos) > 0 ? 'Alto' :
                        Number(formData.medios) > 0 ? 'Médio' : 'Baixo'}
                     </span>
                   </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20 flex gap-4">
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="flex-1 px-4 py-3.5 rounded-xl text-sm font-bold text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
