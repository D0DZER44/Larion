"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { getTodasRegrasAtivas, fixedNrRules, compareRegras } from '@/lib/normativeRules';
import { getTodosChecklistsAtivos } from '@/lib/normativeChecklists';
import { getNRsAplicaveis } from '@/lib/nrMatrix';
import AcaoRecomendadaCard from '@/components/AcaoRecomendadaCard';
import { 
  Settings, Building2, Users, CheckSquare, ShieldAlert, Clock, Bell, User, 
  ChevronRight, ShieldCheck, FileText, AlertTriangle, 
  Plus, Search, Edit2, Trash2, GripVertical, CheckCircle2, Monitor, Phone, 
  Mail, MapPin, Lock, Activity, Shield, X, Package, Info, Ban, Filter, Camera
} from 'lucide-react';

const TABS = [
  { id: 'geral', label: 'Geral', icon: <Settings className="w-4 h-4" /> },
  { id: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'regras', label: 'Regras de Risco', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'slas', label: 'Prazos e SLAs', icon: <Clock className="w-4 h-4" /> },
  { id: 'alertas', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
  { id: 'indicadores', label: 'Indicadores SST', icon: <Activity className="w-4 h-4" /> },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const { alertas = [], rulePackages = [] } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const activePackageNames = rulePackages.filter(p => p.isActive).map(p => p.name);
  const activeAlertsCount = alertas.filter(a => 
    a.status === 'Ativo' && 
    (!a.package || a.package === 'Base SST' || activePackageNames.includes(a.package))
  ).length;

  if (!mounted) return null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-white font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Background elements for depth */}
        <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden relative z-10">
          
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Configurações</h1>
              <p className="text-sm text-gray-400 mt-1">Gerencie as principais configurações e regras do sistema.</p>
            </div>
            <div>
               <button 
                onClick={() => setActiveTab('alertas')}
                className="relative p-2 bg-[#121826] hover:bg-white/5 text-gray-300 rounded-lg transition-colors border border-white/10"
               >
                  <Bell className="w-5 h-5" />
                  {activeAlertsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 border border-[#121826]"></span>
                  )}
               </button>
            </div>
          </header>

          <div className="flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full overflow-x-auto custom-scrollbar gap-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'alertas' && activeAlertsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded-full font-bold">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="h-full flex flex-col"
               >
                 {activeTab === 'geral' && <TabGeral />}
                 {activeTab === 'checklists' && <TabChecklists />}
                 {activeTab === 'regras' && <TabRegras />}
                 {activeTab === 'slas' && <TabSlas />}
                 {activeTab === 'alertas' && <TabAlertas />}
                 {activeTab === 'indicadores' && <TabIndicadores />}
               </motion.div>
             </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}

// ==========================================
// TABS COMPONENTS
// ==========================================

function TabGeral() {
  const { engineConfig, updateEngineConfig } = useAppStore();

  return (
    <div className="space-y-6 flex-1">
      {/* Banner */}
      <AcaoRecomendadaCard />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
            { title: "Configurações críticas", val: "3", desc: "requerem atenção", icon: <AlertTriangle className="text-red-400" />, border: "border-red-500/20", bg: "bg-red-500/5", color: "text-red-400" },
            { title: "Integrações ativas", val: "6", desc: "serviços conectados", icon: <CheckCircle2 className="text-emerald-400" />, border: "border-emerald-500/20", bg: "bg-emerald-500/5", color: "text-emerald-400" },
            { title: "Alertas ativos", val: "12", desc: "notificações habilitadas", icon: <Bell className="text-blue-400" />, border: "border-blue-500/20", bg: "bg-blue-500/5", color: "text-blue-400" },
         ].map((card, i) => (
            <div key={i} className={`bg-[#121826] border overflow-hidden p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors relative ${card.border}`}>
               <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.bg} ${card.border}`}>
                     {card.icon}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{card.val}</span>
                        <span className="text-xs text-gray-400">{card.desc}</span>
                     </div>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
            </div>
         ))}
      </div>

      {/* Masonry-like Grid for Settings Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
         
         {/* Block 2 */}
         <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
               <Settings className="w-5 h-5 text-purple-400" />
               <h3 className="text-[15px] font-bold text-white">Configurações do Sistema</h3>
            </div>
            <div className="space-y-5 mb-6">
               {[
                  { t: 'Exigir justificativa (atrasos)', d: 'Obriga input no motivo.' },
                  { t: 'Bloquear edição pós-fechamento', d: 'Impede alteração em inspeções.' },
                  { t: 'Habilitar anexos (fotos)', d: 'Permite arquivos em evidências.' },
               ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                     <div>
                        <p className="text-[13px] font-bold text-gray-200">{item.t}</p>
                        <p className="text-[11px] text-gray-500">{item.d}</p>
                     </div>
                     <div className="w-9 h-5 bg-purple-600 rounded-full relative cursor-pointer flex items-center px-0.5">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-4"></div>
                     </div>
                  </div>
               ))}
            </div>
            <button className="text-[13px] font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/20 w-full transition-colors">
               Gerenciar sistema
            </button>
         </div>

         {/* Block 3 */}
         <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
             <div className="flex items-center gap-3 mb-6">
               <Activity className="w-5 h-5 text-emerald-400" />
               <h3 className="text-[15px] font-bold text-white">Impacto Econômico</h3>
            </div>
            
            <div className="space-y-4 mb-6">
               <div className="flex justify-between items-center gap-4">
                  <div>
                     <p className="text-[13px] font-bold text-gray-200">Habilitar cálculo</p>
                     <p className="text-[11px] text-gray-500">Mostrar nas áreas de risco.</p>
                  </div>
                  <div 
                     onClick={() => updateEngineConfig({ economia: { ...engineConfig.economia, enabled: !engineConfig.economia.enabled }})}
                     className={`w-9 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${engineConfig.economia.enabled ? 'bg-emerald-600' : 'bg-white/10'}`}
                  >
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${engineConfig.economia.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Custo Hora Parada (R$)</label>
                  <input 
                     type="number" 
                     value={engineConfig.economia.custoHoraParada}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, custoHoraParada: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nº de Empregados (Total)</label>
                  <input 
                     type="number" 
                     value={engineConfig.economia.numEmpregados}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, numEmpregados: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fator Reincidência (Auto)</label>
                  <input 
                     type="number" 
                     step="0.1"
                     value={engineConfig.economia.fatorReincidencia}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, fatorReincidencia: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                  />
               </div>

            </div>
         </div>

      </div>
    </div>
  )
}

function TabChecklists() {
   const { checklists, addChecklist, updateChecklist, deleteChecklist, rulePackages, organization } = useAppStore();
   const [search, setSearch] = useState('');
   const [filterPacote, setFilterPacote] = useState('Todos');
   const [filterSegmento, setFilterSegmento] = useState('Todos');
   const [filterStatus, setFilterStatus] = useState('Todos');

   const allChecklists = getTodosChecklistsAtivos(checklists);
   
   // Filtering logic
   const filteredChecklists = allChecklists.filter(checklist => {
      const nrsAplicaveis = getNRsAplicaveis({
         segmentoOrganizacao: organization.segmento,
         atividadesCriticas: organization.atividadesCriticas,
         pacotesAtivos: rulePackages.filter(p => p.isActive).map(p => p.name)
      });
      const nrsAplicaveisIds = nrsAplicaveis.map(nr => nr.id);
      
      const isBaseSST = checklist.pacote === "Base SST";
      const isAplicavelPelaNR = checklist.nr && nrsAplicaveisIds.includes(checklist.nr);
      
      // Regra: Base SST sempre aparece. Outros dependem de pacotes ativos e NRs aplicáveis.
      const matchPacoteEEAplicabilidade = isBaseSST || isAplicavelPelaNR;

      const matchSearch = checklist.titulo.toLowerCase().includes(search.toLowerCase()) || 
                          (checklist.atividade || '').toLowerCase().includes(search.toLowerCase()) ||
                          (checklist.nrRelacionada || '').toLowerCase().includes(search.toLowerCase()) ||
                          (checklist.nr || '').toLowerCase().includes(search.toLowerCase());

      const matchFiltroPacote = filterPacote === 'Todos' || checklist.pacote === filterPacote;
      const matchFiltroSegmento = filterSegmento === 'Todos' || (checklist.segmentos && checklist.segmentos.includes(filterSegmento));
      const matchStatus = filterStatus === 'Todos' || (checklist.status === filterStatus || (filterStatus === 'Ativo' && checklist.ativo));

      return matchSearch && matchPacoteEEAplicabilidade && matchFiltroPacote && matchFiltroSegmento && matchStatus;
   });

   const [selectedId, setSelectedId] = useState(filteredChecklists[0]?.id || allChecklists[0]?.id);
   const activeChecklist = allChecklists.find(c => c.id === selectedId) || filteredChecklists[0] || allChecklists[0];

   // Options for filters
   const pacotes = ['Todos', ...Array.from(new Set(allChecklists.map(c => c.pacote).filter(Boolean)))];
   const segmentos = ['Todos', ...Array.from(new Set(allChecklists.flatMap(c => c.segmentos || []).filter(Boolean)))];

   const handleAdd = () => {
      addChecklist({ 
         titulo: 'Novo Modelo', 
         category: 'Segurança Geral', 
         status: 'Rascunho', 
         sections: [],
         pacote: 'Base SST',
         segmentos: ['Geral'],
         atividades: ['Outro'],
         nr: 'NR-01',
         ativo: true
      });
   };

   return (
      <div className="flex flex-col xl:flex-row gap-6 w-full items-start h-[750px] overflow-hidden">
         
         {/* Left: Templates & Filters */}
         <div className="w-full xl:w-[320px] bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col h-full shrink-0 overflow-hidden">
            <div className="shrink-0 space-y-4 mb-4">
               <div>
                  <h3 className="text-sm font-bold text-white mb-1">Modelos de Checklist</h3>
                  <p className="text-[11px] text-gray-500">Gerencie a estrutura base das inspeções.</p>
               </div>
               
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input 
                     type="text" 
                     placeholder="Buscar modelo..." 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full bg-[#0b0f19] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500" 
                  />
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Pacote</label>
                     <select 
                        value={filterPacote}
                        onChange={(e) => setFilterPacote(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 outline-none"
                     >
                        {pacotes.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Segmento</label>
                     <select 
                        value={filterSegmento}
                        onChange={(e) => setFilterSegmento(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 outline-none"
                     >
                        {segmentos.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Status</label>
                     <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 outline-none"
                     >
                        <option value="Todos">Todos</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Rascunho">Rascunho</option>
                        <option value="Inativo">Inativo</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Atividade/NR</label>
                     <div className="flex items-center gap-1 bg-[#0b0f19] border border-white/10 rounded-lg px-2 py-0.5">
                        <Filter className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] text-gray-500 italic">Use Buscar</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {filteredChecklists.length > 0 ? filteredChecklists.map((c) => {
                  const isActive = c.id === selectedId;
                  let colorClass = 'text-gray-500 bg-gray-500/10 border-gray-500/20';
                  if(c.status === 'Ativo') colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  if(c.status === 'Rascunho') colorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/20';

                  return (
                     <div 
                        key={c.id} 
                        onClick={() => setSelectedId(c.id)} 
                        className={`group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${isActive ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                     >
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${colorClass}`}>{c.status}</span>
                           <span className="text-[9px] text-gray-500 font-bold uppercase">{c.nrRelacionada || '-'}</span>
                        </div>
                        <p className={`text-[13px] font-bold mb-1 relative z-10 ${isActive ? 'text-white' : 'text-gray-300'}`}>{c.titulo}</p>
                        <div className="flex items-center gap-2 relative z-10">
                           <span className="text-[10px] text-gray-500">{c.pacote}</span>
                           <span className="w-1 h-1 rounded-full bg-white/10"></span>
                           <span className="text-[10px] text-gray-500">{c.atividade}</span>
                        </div>
                        
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
                     </div>
                  );
               }) : (
                  <div className="py-10 text-center">
                     <p className="text-xs text-gray-500">Nenhum checklist encontrado com estes filtros.</p>
                  </div>
               )}
            </div>
            
            <button onClick={handleAdd} className="mt-4 shrink-0 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
               <Plus className="w-4 h-4" /> Novo modelo
            </button>
         </div>

         {/* Middle: Builder */}
         {activeChecklist ? (
            <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
               <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0b0f19]">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-base font-bold text-white mb-0.5">Editor de Checklist</h2>
                        <p className="text-xs text-gray-500">Configuração de campos e metadados para o motor ApexShield</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     {!activeChecklist.regraFixa && (
                        <button onClick={() => deleteChecklist(activeChecklist.id)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors bg-white/5 rounded-xl border border-white/10">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                     <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Salvar alterações
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#0A0D14]">
                  
                  <div className="max-w-4xl mx-auto space-y-6">
                     {/* Metadata Panel */}
                     <div className="bg-[#121826] border border-white/5 p-6 rounded-2xl space-y-6">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                           <Info className="w-4 h-4" />
                           <h4 className="text-xs font-bold uppercase tracking-widest">Informações e Metadados</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nome do checklist</label>
                              <input 
                                 type="text" 
                                 value={activeChecklist.titulo} 
                                 onChange={(e) => updateChecklist(activeChecklist.id, { titulo: e.target.value })}
                                 disabled={activeChecklist.regraFixa}
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50" 
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pacote de Regras</label>
                              <select 
                                 value={activeChecklist.pacote || ''}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { pacote: e.target.value })}
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none pointer-events-auto"
                              >
                                 <option value="Base SST">Base SST</option>
                                 <option value="Construção Civil">Construção Civil</option>
                                 <option value="Indústria">Indústria</option>
                                 <option value="Saúde/Hospitalar">Saúde/Hospitalar</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</label>
                              <select 
                                 value={activeChecklist.status}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { status: e.target.value as any })}
                                 disabled={activeChecklist.regraFixa}
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none disabled:opacity-50"
                              >
                                 <option value="Ativo">Ativo</option>
                                 <option value="Rascunho">Rascunho</option>
                                 <option value="Inativo">Inativo</option>
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Segmento</label>
                              <select 
                                 value={activeChecklist.segmento || ''}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { segmento: e.target.value })}
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                              >
                                 <option value="Geral">Geral</option>
                                 <option value="Construção">Construção</option>
                                 <option value="Indústria">Indústria</option>
                                 <option value="Saúde">Saúde</option>
                                 <option value="Logística">Logística</option>
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Atividade Principal</label>
                              <input 
                                 type="text" 
                                 value={activeChecklist.atividade || ''}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { atividade: e.target.value })}
                                 placeholder="Ex: Trabalho em altura"
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" 
                              />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">NR Relacionada</label>
                              <input 
                                 type="text" 
                                 value={activeChecklist.nrRelacionada || ''}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { nrRelacionada: e.target.value })}
                                 placeholder="Ex: NR-35"
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" 
                              />
                           </div>

                           <div className="space-y-1.5 text-indigo-400">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ativo</label>
                              <select 
                                 value={activeChecklist.ativo ? 'true' : 'false'}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { ativo: e.target.value === 'true' })}
                                 className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none font-bold"
                              >
                                 <option value="true">Ativo</option>
                                 <option value="false">Inativo</option>
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="bg-[#121826] border border-white/5 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                           <Shield className="w-4 h-4" />
                           <h4 className="text-xs font-bold uppercase tracking-widest">Regras de Segmento e Atividade</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                               <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Segmentos (separados por vírgula)</label>
                               <input 
                                  type="text" 
                                  value={(activeChecklist.segmentos || []).join(', ')} 
                                  onChange={(e) => updateChecklist(activeChecklist.id, { segmentos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" 
                               />
                           </div>
                           <div className="space-y-1.5">
                               <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Atividades (separadas por vírgula)</label>
                               <input 
                                  type="text" 
                                  value={(activeChecklist.atividades || []).join(', ')} 
                                  onChange={(e) => updateChecklist(activeChecklist.id, { atividades: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" 
                               />
                           </div>
                        </div>
                     </div>

                     {/* Sections */}
                     <div className="space-y-4 pb-20">
                        {activeChecklist.sections.map((section: any, sIndex: number) => (
                           <div key={section.id} className="bg-white/5 border border-white/10 p-1 rounded-2xl relative group/section">
                              <div className="bg-[#121826] rounded-xl overflow-hidden border border-white/5">
                                 <div className="p-4 bg-[#0b0f19] border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                       <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />
                                       <input 
                                          type="text" 
                                          value={section.title} 
                                          disabled={activeChecklist.regraFixa}
                                          onChange={(e) => {
                                             const newSections = [...activeChecklist.sections];
                                             newSections[sIndex].title = e.target.value;
                                             updateChecklist(activeChecklist.id, { sections: newSections });
                                          }}
                                          className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-purple-500 text-sm font-bold text-white focus:outline-none w-full max-w-[350px] transition-colors disabled:opacity-50" 
                                       />
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{section.questions.length} Questões</span>
                                       {!activeChecklist.regraFixa && (
                                          <button 
                                             onClick={() => {
                                                const newSections = activeChecklist.sections.filter((_: any, idx: number) => idx !== sIndex);
                                                updateChecklist(activeChecklist.id, { sections: newSections });
                                             }}
                                             className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                          ><Trash2 className="w-3.5 h-3.5" /></button>
                                       )}
                                    </div>
                                 </div>
                                 <div className="px-4 py-2 space-y-1">
                                    {section.questions.map((item: any, qIndex: number) => (
                                       <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 group">
                                          <GripVertical className="w-3.5 h-3.5 text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          <input 
                                             type="text"
                                             value={item.text}
                                             disabled={activeChecklist.regraFixa || item.regraFixa}
                                             onChange={(e) => {
                                                const newSections = [...activeChecklist.sections];
                                                newSections[sIndex].questions[qIndex].text = e.target.value;
                                                updateChecklist(activeChecklist.id, { sections: newSections });
                                             }}
                                             className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-purple-500 text-[13px] text-gray-300 focus:outline-none flex-1 transition-colors disabled:opacity-50"
                                          />
                                          <div className="flex items-center gap-3 shrink-0">
                                             <select 
                                                value={item.type}
                                                disabled={activeChecklist.regraFixa || item.regraFixa}
                                                onChange={(e) => {
                                                   const newSections = [...activeChecklist.sections];
                                                   newSections[sIndex].questions[qIndex].type = e.target.value;
                                                   updateChecklist(activeChecklist.id, { sections: newSections });
                                                }}
                                                className="bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded px-2 py-1.5 text-[10px] font-bold outline-none appearance-none cursor-pointer disabled:opacity-50"
                                             >
                                                <option value="Aprovação (Sim/Não)">Aprovação (Sim/Não)</option>
                                                <option value="Sim / Não / Parcialmente">Sim / Não / Parcialmente</option>
                                                <option value="Múltipla Escolha">Múltipla Escolha</option>
                                                <option value="Texto Longo">Texto Longo</option>
                                                <option value="Anexo/Foto">Anexo/Foto</option>
                                             </select>
                                             
                                             <select
                                                value={item.riskMap}
                                                disabled={activeChecklist.regraFixa || item.regraFixa}
                                                onChange={(e) => {
                                                   const newSections = [...activeChecklist.sections];
                                                   newSections[sIndex].questions[qIndex].riskMap = e.target.value;
                                                   updateChecklist(activeChecklist.id, { sections: newSections });
                                                }}
                                                className={`w-24 px-2 py-1.5 text-[10px] font-bold rounded border bg-[#0b0f19] outline-none cursor-pointer disabled:opacity-50 ${item.riskMap === 'Crítico' || item.riskMap === 'Crítica' ? 'text-red-500 border-red-500/30' : item.riskMap === 'Alta' || item.riskMap === 'Médio' ? 'text-orange-500 border-orange-500/30' : item.riskMap === 'Leve' ? 'text-emerald-500 border-emerald-500/30' : 'text-gray-500 border-gray-500/30'}`}
                                             >
                                                <option value="Nenhum">Sem risco</option>
                                                <option value="Leve">Baixo</option>
                                                <option value="Médio">Médio</option>
                                                <option value="Alta">Alto</option>
                                                <option value="Crítico">Crítico</option>
                                             </select>

                                             {!activeChecklist.regraFixa && !item.regraFixa && (
                                                <button 
                                                   onClick={() => {
                                                      const newSections = [...activeChecklist.sections];
                                                      newSections[sIndex].questions = newSections[sIndex].questions.filter((_: any, idx: number) => idx !== qIndex);
                                                      updateChecklist(activeChecklist.id, { sections: newSections });
                                                   }}
                                                   className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                   <X className="w-4 h-4" />
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                    ))}
                                    <button 
                                       onClick={() => {
                                          const newSections = [...activeChecklist.sections];
                                          newSections[sIndex].questions.push({ id: Date.now().toString(), text: 'Nova pergunta', type: 'Aprovação (Sim/Não)', riskMap: 'Nenhum' });
                                          updateChecklist(activeChecklist.id, { sections: newSections });
                                       }}
                                       className="w-full py-3 text-xs text-purple-400 font-bold hover:bg-purple-500/10 rounded-xl transition-all flex items-center justify-center gap-2 mt-3 border border-dashed border-purple-500/30"
                                    >
                                       <Plus className="w-4 h-4" /> Adicionar Pergunta
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}

                        <button 
                           onClick={() => {
                              const newSections = [...activeChecklist.sections, { id: Date.now().toString(), title: 'Nova Seção', questions: [] }];
                              updateChecklist(activeChecklist.id, { sections: newSections });
                           }}
                           className="w-full py-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 text-gray-500 hover:text-purple-400 transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs group"
                        >
                           <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                           Nova Seção
                        </button>
                     </div>
                  </div>

               </div>
            </div>
         ) : (
            <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-10 h-full">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <CheckSquare className="w-10 h-10 text-gray-600" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Selecione um checklist</h3>
               <p className="text-gray-500 max-w-sm">Escolha um modelo na lista lateral para visualizar ou editar sua estrutura e perguntas.</p>
            </div>
         )}

      </div>
   )
}

function TabRegras() {
   const [subTab, setSubTab] = useState<'fixas' | 'personalizadas' | 'pacotes' | 'base'>('pacotes');

   return (
      <div className="flex flex-col h-[700px]">
         <div className="flex items-center gap-4 border-b border-white/5 mb-4 shrink-0 overflow-x-auto custom-scrollbar">
            <button onClick={() => setSubTab('pacotes')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap ${subTab === 'pacotes' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Pacotes de Regras</button>
            <button onClick={() => setSubTab('base')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap ${subTab === 'base' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Base de Regras</button>
            <button onClick={() => setSubTab('fixas')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap ${subTab === 'fixas' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Regras fixas NR</button>
            <button onClick={() => setSubTab('personalizadas')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap ${subTab === 'personalizadas' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Regras personalizadas</button>
         </div>

         {subTab === 'pacotes' && <SubTabPacotesRegras />}
         {subTab === 'base' && <SubTabBaseRegras />}
         {subTab === 'fixas' && <SubTabRegrasFixas />}
         {subTab === 'personalizadas' && <SubTabRegrasPersonalizadas />}
      </div>
   );
}

function SubTabPacotesRegras() {
   const { rulePackages, updateRulePackage } = useAppStore();

   return (
      <div className="flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
         <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-2xl">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-purple-400" />
               </div>
               <div>
                  <h3 className="text-sm font-bold text-white mb-1">Estrutura de Pacotes de Regras</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                     Ative pacotes específicos por segmento para expandir a inteligência do motor ApexShield. 
                     O pacote <span className="text-purple-400 font-bold">Base SST</span> é o alicerce normativo e permanece sempre ativo.
                  </p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rulePackages.map((pkg) => (
               <div key={pkg.id} className={`group bg-[#121826] border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden ${pkg.isActive ? 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.05)]' : 'border-white/5 hover:border-white/10'}`}>
                  {/* Status Indicator */}
                  <div className="absolute top-0 right-0 p-3">
                     <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-white/5'}`}>
                        {pkg.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {pkg.isActive ? 'ATIVO' : 'INATIVO'}
                     </span>
                  </div>

                  <div className="flex flex-col h-full">
                     <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                           <h4 className="text-lg font-bold text-white tracking-tight">{pkg.name}</h4>
                           <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg border border-white/10 font-bold uppercase tracking-wider">{pkg.segment}</span>
                        </div>
                        <p className="text-[13px] text-gray-400 leading-relaxed h-[40px] overflow-hidden">{pkg.description}</p>
                     </div>

                     <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Regras</span>
                              <span className="text-sm font-bold text-white">{pkg.ruleCount} ativas</span>
                           </div>
                           <div className="w-px h-8 bg-white/5"></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Impacto</span>
                              <span className="text-sm font-bold text-indigo-400">Total</span>
                           </div>
                        </div>

                        {pkg.isLocked ? (
                           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-gray-500">
                              <Lock className="w-3.5 h-3.5" /> Obrigatório
                           </div>
                        ) : (
                           <button 
                              onClick={() => updateRulePackage(pkg.id, { isActive: !pkg.isActive })}
                              className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                                 pkg.isActive 
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                                    : 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)] hover:bg-purple-500'
                              }`}
                           >
                              {pkg.isActive ? 'Desativar' : 'Ativar Pacote'}
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Glass highlight effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
               </div>
            ))}
         </div>
      </div>
   );
}

function SubTabBaseRegras() {
   const { riskRules, updateRiskRule } = useAppStore();
   const [filterPacote, setFilterPacote] = useState('Todos');
   const [filterCriticidade, setFilterCriticidade] = useState('Todos');
   const [filterAtividade, setFilterAtividade] = useState('Todos');
   const [filterStatus, setFilterStatus] = useState('Todos');
   const [searchTerm, setSearchTerm] = useState('');

   const filteredRules = riskRules.filter(rule => {
      const matchPacote = filterPacote === 'Todos' || rule.pacote === filterPacote;
      const matchCriticidade = filterCriticidade === 'Todos' || rule.criticidade === filterCriticidade;
      const matchAtividade = filterAtividade === 'Todos' || rule.atividades.includes(filterAtividade);
      const matchStatus = filterStatus === 'Todos' || (filterStatus === 'Ativo' ? rule.ativo : !rule.ativo);
      const matchSearch = rule.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.nrRelacionada.toLowerCase().includes(searchTerm.toLowerCase());
      return matchPacote && matchCriticidade && matchAtividade && matchStatus && matchSearch;
   }).sort((a, b) => {
      // Ordena NRs em ordem numérica e regras dentro da mesma NR em ordem alfabética por título.
      const numA = parseInt((a.nrRelacionada || '').replace(/\D/g, ''), 10) || 9999;
      const numB = parseInt((b.nrRelacionada || '').replace(/\D/g, ''), 10) || 9999;
      if (numA !== numB) return numA - numB;
      return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' });
   });

   const pacotes = ['Todos', ...Array.from(new Set(riskRules.map(r => r.pacote))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
   const criticidades = ['Todos', 'Baixo', 'Médio', 'Alta', 'Crítico'];
   const atividades = ['Todos', ...Array.from(new Set(riskRules.flatMap(r => r.atividades))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];

   return (
      <div className="flex flex-col gap-4 h-full overflow-hidden">
         <div className="flex items-center gap-4 flex-wrap bg-[#121826] p-4 rounded-xl border border-white/5">
            <div className="flex-1 min-w-[200px] relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
               <input 
                  type="text" 
                  placeholder="Buscar por título ou NR..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
               />
            </div>
            
            <select 
               value={filterPacote} 
               onChange={(e) => setFilterPacote(e.target.value)}
               className="bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            >
               {pacotes.map(p => <option key={p} value={p}>Pacote: {p}</option>)}
            </select>

            <select 
               value={filterAtividade} 
               onChange={(e) => setFilterAtividade(e.target.value)}
               className="bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            >
               {atividades.map(a => <option key={a} value={a}>Atividade: {a}</option>)}
            </select>

            <select 
               value={filterCriticidade} 
               onChange={(e) => setFilterCriticidade(e.target.value)}
               className="bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            >
               {criticidades.map(c => <option key={c} value={c}>Crit.: {c}</option>)}
            </select>

            <select 
               value={filterStatus} 
               onChange={(e) => setFilterStatus(e.target.value)}
               className="bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            >
               <option value="Todos">Todos Status</option>
               <option value="Ativo">Ativo</option>
               <option value="Inativo">Inativo</option>
            </select>
         </div>

         <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-2xl bg-[#121826]/50">
            <table className="w-full text-left text-sm border-collapse">
               <thead className="sticky top-0 bg-[#0b0f19] z-10 text-[11px] uppercase font-bold text-gray-500 border-b border-white/5">
                  <tr>
                     <th className="px-6 py-4">Regra</th>
                     <th className="px-6 py-4">Pacote</th>
                     <th className="px-6 py-4">NR</th>
                     <th className="px-6 py-4">Criticidade</th>
                     <th className="px-6 py-4 text-center">Evidência</th>
                     <th className="px-6 py-4 text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredRules.map(rule => (
                     <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group text-[13px]">
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-white group-hover:text-purple-400 transition-colors">{rule.titulo}</span>
                              <span className="text-[11px] text-gray-500 line-clamp-1 italic">{rule.condicao}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-gray-400 font-medium">{rule.pacote}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-indigo-400 font-bold">{rule.nrRelacionada}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rule.criticidade === 'Crítico' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              rule.criticidade === 'Alta' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              rule.criticidade === 'Médio' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                           }`}>
                              {rule.criticidade}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {rule.exigeEvidencia ? (
                              <div className="flex items-center justify-center text-purple-400 gap-1">
                                 <Camera className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold">Sim</span>
                              </div>
                           ) : (
                              <span className="text-gray-600 text-[10px]">-</span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center">
                              <button 
                                 onClick={() => updateRiskRule(rule.id, { ativo: !rule.ativo })}
                                 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                    rule.ativo 
                                       ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                       : 'bg-gray-500/10 text-gray-500 border border-white/5 hover:bg-white/5'
                                 }`}
                              >
                                 {rule.ativo ? <CheckCircle2 className="w-3" /> : <Ban className="w-3" />}
                                 {rule.ativo ? 'ATIVO' : 'INATIVO'}
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredRules.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                           Nenhuma regra encontrada com os filtros selecionados.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
         
         <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between text-xs text-gray-400 italic">
            <div className="flex items-center gap-2">
               <Info className="w-4 h-4 text-purple-400" />
               <span>Estas regras definem o comportamento do motor de risco. A ativação/desativação afeta futuras inspeções.</span>
            </div>
            <div className="flex items-center gap-4">
               <span>Total de regras: <strong>{riskRules.length}</strong></span>
               <span>Filtradas: <strong>{filteredRules.length}</strong></span>
            </div>
         </div>
      </div>
   );
}

function SubTabRegrasFixas() {
   // NRs em ordem numérica (NR-01, NR-06, NR-07...) e regras dentro de cada NR em ordem alfabética por título
   const rules = React.useMemo(() => [...fixedNrRules].sort(compareRegras), []);
   const [selectedRule, setSelectedRule] = useState<any>(null);

   return (
      <div className="flex-1 flex flex-col h-full bg-[#121826] border border-white/5 rounded-2xl overflow-hidden relative">
         <div className="p-5 border-b border-white/5 shrink-0 flex items-center justify-between bg-[#0b0f19]">
            <div>
               <h3 className="text-[15px] font-bold text-white">Regras fixas NR</h3>
               <p className="text-xs text-gray-400 mt-1.5">Base normativa imutável que compõe o motor inteligente ApexShield.</p>
            </div>
            <div className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[11px] font-bold border border-purple-500/20">
               Regras do Gerenciamento de Risco
            </div>
         </div>
         <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-[#0b0f19] border-b border-white/5 text-xs text-gray-400 uppercase">
                  <tr>
                     <th className="px-5 py-3 font-medium">NR</th>
                     <th className="px-5 py-3 font-medium w-64 max-w-xs">Regra</th>
                     <th className="px-5 py-3 font-medium">Severidade</th>
                     <th className="px-5 py-3 font-medium text-center">Gera Risco / Ação</th>
                     <th className="px-5 py-3 font-medium">Status / Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5 text-gray-300">
                  {rules.map((rule) => (
                     <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 font-bold text-indigo-400">{rule.nr}</td>
                        <td className="px-5 py-3 w-64 max-w-xs truncate" title={rule.titulo}>{rule.titulo}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rule.severidadeBase === 'Crítica' || rule.severidadeBase === 'Crítico' ? 'bg-red-500/10 text-red-500 border-red-500/20' : rule.severidadeBase === 'Alta' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>{rule.severidadeBase}</span></td>
                        <td className="px-5 py-3 text-center">
                           <div className="flex items-center justify-center gap-2 text-xs">
                              <span className={rule.geraRisco ? 'text-emerald-400' : 'text-gray-500'}>Risco</span>
                              <span className="text-gray-600">•</span>
                              <span className={rule.geraAcao ? 'text-emerald-400' : 'text-gray-500'}>Ação</span>
                           </div>
                        </td>
                        <td className="px-5 py-3 flex items-center gap-3">
                           <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">Ativa</span>
                           <button onClick={() => setSelectedRule(rule)} className="text-purple-400 hover:text-purple-300 text-xs font-bold underline transition-colors">Visualizar</button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Drawer for specific rule */}
         <AnimatePresence>
            {selectedRule && (
               <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 z-10" onClick={() => setSelectedRule(null)} />
                  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute top-0 right-0 bottom-0 w-[500px] max-w-[90%] bg-[#121826] border-l border-white/10 z-20 shadow-2xl flex flex-col">
                     <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0b0f19]">
                        <div>
                           <div className="flex items-center gap-2 mb-1.5">
                              <h2 className="text-lg font-black text-white">{selectedRule.nr}</h2>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">Regra Fixa</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-gray-500/10 text-gray-400 border-white/10">Não Editável</span>
                           </div>
                           <p className="text-sm text-gray-300">{selectedRule.titulo}</p>
                        </div>
                        <button onClick={() => setSelectedRule(null)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5"/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        
                        {/* Base normativa */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400 pb-2 border-b border-white/5">
                              <ShieldCheck className="w-4 h-4" /> Base Normativa
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Perigo</span>
                                 <p className="text-xs text-gray-300">{selectedRule.perigo || 'N/A'}</p>
                              </div>
                              <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tipo de Risco</span>
                                 <p className="text-xs text-gray-300">{selectedRule.tipoRisco || 'N/A'}</p>
                              </div>
                           </div>
                           <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Impacto legal</span>
                              <p className="text-xs text-gray-400 leading-relaxed">{selectedRule.descricao}</p>
                           </div>
                        </div>

                        {/* Gatilho */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-orange-400 pb-2 border-b border-white/5">
                              <AlertTriangle className="w-4 h-4" /> Gatilho
                           </h4>
                           <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5 space-y-2">
                              {selectedRule.perguntasChecklist?.map((pq: string, i: number) => (
                                 <div key={i} className="flex gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-gray-300 leading-relaxed font-medium">Ao responder &apos;Não&apos; ou &apos;Parcialmente&apos; para: &quot;{pq}&quot;</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Efeitos Automáticos */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-blue-400 pb-2 border-b border-white/5">
                              <Activity className="w-4 h-4" /> Efeitos Automáticos
                           </h4>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-xs text-gray-400">Gera Risco</span>
                                 <span className={selectedRule.geraRisco ? 'text-emerald-400 text-xs font-bold' : 'text-gray-500 text-xs font-medium'}>{selectedRule.geraRisco ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-xs text-gray-400">Gera Ação</span>
                                 <span className={selectedRule.geraAcao ? 'text-emerald-400 text-xs font-bold' : 'text-gray-500 text-xs font-medium'}>{selectedRule.geraAcao ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-xs text-gray-400">Impacta Score</span>
                                 <span className={selectedRule.impactaScore ? 'text-emerald-400 text-xs font-bold' : 'text-gray-500 text-xs font-medium'}>{selectedRule.impactaScore ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-xs text-gray-400">Bloqueante</span>
                                 <span className={selectedRule.bloqueante ? 'text-red-400 text-xs font-bold' : 'text-gray-500 text-xs font-medium'}>{selectedRule.bloqueante ? 'Sim' : 'Não'}</span>
                              </div>
                           </div>
                        </div>

                        {/* Cálculos */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 pb-2 border-b border-white/5">
                              <CheckCircle2 className="w-4 h-4" /> Cálculos Predefinidos
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Severidade</span>
                                 <p className="text-xs text-white font-medium">{selectedRule.severidadeBase}</p>
                              </div>
                              <div className="bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Prazo SLA</span>
                                 <p className="text-xs text-white font-medium">{selectedRule.prazoBase} dias</p>
                              </div>
                              <div className="bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Multa estimada</span>
                                 <p className="text-xs text-white font-medium">R$ {selectedRule.multaBaseEstimativa?.toLocaleString('pt-BR') || '0'}</p>
                              </div>
                              <div className="bg-[#0b0f19] p-3 rounded border border-white/5">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Chance Inicial</span>
                                 <p className="text-xs text-white font-medium">{selectedRule.chanceIncidenteBase}%</p>
                              </div>
                           </div>
                        </div>

                        {/* Proteção */}
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-6 font-mono text-xs">
                           <div className="flex items-start gap-2 mb-2">
                              <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <span className="text-red-400 font-bold">Proteção do Sistema Aplicada</span>
                           </div>
                           <div className="ml-6 space-y-1 text-gray-400">
                              <p>&gt; editavel: <span className="text-orange-300">false</span></p>
                              <p>&gt; removivel: <span className="text-orange-300">false</span></p>
                              <p>&gt; fonte: <span className="text-white">{selectedRule.fonte}</span></p>
                           </div>
                        </div>

                     </div>
                     <div className="p-4 border-t border-white/5 shrink-0 bg-[#0b0f19] flex justify-end">
                        <button onClick={() => setSelectedRule(null)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors">Fechar Painel</button>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </div>
   );
}

function SubTabRegrasPersonalizadas() {
   const { rules: rawRules, addRule, updateRule, deleteRule } = useAppStore();

   // Ordena por NR (numérica) e nome (alfabética) para alinhar com regras fixas
   const rules = React.useMemo(() => [...rawRules].sort((a: any, b: any) => {
      const numA = parseInt(((a.nr || a.nrRelacionada || a.checklistOrigin || '').toString()).replace(/\D/g, ''), 10) || 9999;
      const numB = parseInt(((b.nr || b.nrRelacionada || b.checklistOrigin || '').toString()).replace(/\D/g, ''), 10) || 9999;
      if (numA !== numB) return numA - numB;
      return ((a.name || a.titulo || '') as string).localeCompare(((b.name || b.titulo || '') as string), 'pt-BR', { sensitivity: 'base' });
   }), [rawRules]);

   const [selectedId, setSelectedId] = useState(rules[0]?.id);

   const activeRule = rules.find((r: any) => r.id === selectedId) || rules[0];

   const handleAdd = () => {
      addRule({
         name: 'Nova Regra Automática',
         checklistOrigin: 'Máquinas e Equip.',
         question: 'Nova pergunta?',
         condition: 'NÃO',
         severity: 'Médio',
         autoAction: 'Corrigir falha',
         assignTo: 'Equipe de Manutenção',
         deadline: '3 dias úteis',
         justification: '...',
         isActive: true
      } as any);
   };

   return (
      <div className="flex flex-col w-full h-[600px] gap-6 xl:flex-row">
         {/* Left Side: Rule List */}
         <div className="w-full xl:w-[280px] bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col h-full shrink-0">
            <h3 className="text-sm font-bold text-white mb-4">Regras Personalizadas</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {rules.map((r: any) => {
                  const isActive = r.id === selectedId;
                  const severity = r.severity || r.severidadeBase;
                  const isActiveRule = r.isActive !== undefined ? r.isActive : true;
                  return (
                     <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-3 rounded-xl border transition-colors cursor-pointer ${isActive ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className={`w-2 h-2 rounded-full mt-1 ${isActiveRule ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                           <span className="text-[10px] text-gray-500 uppercase font-bold">{severity}</span>
                        </div>
                        <p className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{r.name}</p>
                     </div>
                  );
               })}
            </div>
            <button onClick={handleAdd} className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-white/10">
               <Plus className="w-3.5 h-3.5" /> Nova regra personal.
            </button>
         </div>

         {/* Left Side: Rule Builder */}
         {activeRule ? (
         <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl flex flex-col h-full shadow-lg">
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0b0f19]">
               <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">{(activeRule as any).regraFixa ? 'Visualizador de Regra Fixa' : 'Construtor de Regra (Risco Automático)'}</h2>
                  <p className="text-xs text-gray-500">{(activeRule as any).regraFixa ? 'Esta regra é normativa e não pode ser alterada.' : 'Transforme respostas em ações proativas no sistema.'}</p>
               </div>
               <div className="flex items-center gap-2">
                  {!(activeRule as any).regraFixa && <button onClick={() => deleteRule(activeRule.id)} className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Excluir</button>}
                  {!(activeRule as any).regraFixa && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors" onClick={() => updateRule(activeRule.id, { isActive: !activeRule.isActive })}>
                       {activeRule.isActive ? 'Desativar Regra' : 'Ativar Regra'}
                    </button>
                  )}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{(activeRule as any).regraFixa ? 'Título da Regra' : 'Nome da Regra'}</label>
                  <input type="text" value={activeRule.name || (activeRule as any).titulo} onChange={e => !(activeRule as any).regraFixa && updateRule(activeRule.id, { name: e.target.value })} disabled={(activeRule as any).regraFixa} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50" />
               </div>

               {(activeRule as any).regraFixa && (
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Descrição</label>
                    <textarea value={(activeRule as any).descricao} disabled className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none disabled:opacity-50" rows={2}></textarea>
                 </div>
               )}

               {/* Fluxo */}
               {!(activeRule as any).regraFixa ? (
                 <div className="relative pt-4 pb-8 pl-6 border-l-2 border-white/10 ml-4 space-y-8">
                  
                  {/* Step 1 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]">1</div>
                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-400" /> Evento Gatilho
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <input className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none" value={activeRule.checklistOrigin || ''} onChange={(e) => updateRule(activeRule.id, { checklistOrigin: e.target.value })} />
                        <input className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none" value={activeRule.question || ''} onChange={(e) => updateRule(activeRule.id, { question: e.target.value })} />
                     </div>
                     <div className="mt-3 flex items-center gap-3">
                        <span className="text-[13px] text-gray-400">Quando a resposta for exata a:</span>
                        <input className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none max-w-[120px]" value={activeRule.condition || ''} onChange={(e) => updateRule(activeRule.id, { condition: e.target.value })} />
                     </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-red-500 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">2</div>
                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Risco Gerado
                     </h4>
                     <div className="bg-[#0b0f19] border border-white/5 p-4 rounded-xl flex gap-6">
                        <div className="space-y-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold">Severidade</label>
                           <select value={activeRule.severity} onChange={e => updateRule(activeRule.id, { severity: e.target.value as any })} className="bg-transparent text-white font-bold text-[13px] border-none focus:outline-none cursor-pointer text-red-400">
                              <option>Crítico</option>
                              <option>Alto</option>
                              <option>Médio</option>
                              <option>Baixo</option>
                           </select>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="space-y-1 flex-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold">Justificativa automática</label>
                           <input type="text" value={activeRule.justification || ''} onChange={e => updateRule(activeRule.id, { justification: e.target.value })} className="w-full bg-transparent border-none text-[13px] text-gray-300 focus:outline-none" />
                        </div>
                     </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]">3</div>
                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400" /> Ação Corretiva
                     </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] text-gray-400 uppercase font-bold">Ação Padrão</label>
                           <input type="text" value={activeRule.autoAction || ''} onChange={e => updateRule(activeRule.id, { autoAction: e.target.value })} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] text-gray-400 uppercase font-bold">Atribuir para</label>
                           <input type="text" value={activeRule.assignTo || ''} onChange={e => updateRule(activeRule.id, { assignTo: e.target.value })} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none" />
                        </div>
                     </div>
                  </div>

               </div>
               ) : (
                 <div className="flex flex-col gap-4 text-sm text-gray-400">
                    <p><strong>Ação Recomendada:</strong> {(activeRule as any).acaoRecomendada}</p>
                    <p><strong>Severidade Padrão:</strong> {(activeRule as any).severidadeBase}</p>
                    <p><strong>Prazo Base:</strong> {(activeRule as any).prazoBase} dias</p>
                    <p><strong>Impacta Indicadores:</strong> {(activeRule as any).impactaScore ? 'Sim' : 'Não'}</p>
                 </div>
               )}
            </div>
         </div>
         ) : null}

         {/* Right Side: Simulation Summary */}
         <div className="w-full xl:w-[320px] shrink-0 bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
             {/* decorative gradient */}
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
            
            <Monitor className="w-10 h-10 text-white/20 mb-4" />
            <h3 className="text-center font-bold text-white text-[15px] mb-2 leading-tight">Como isso<br/>funciona na prática?</h3>
            <p className="text-center text-xs text-gray-400 mb-6 px-4">Se um inspetor acionar esta regra no sistema, o motor instantaneamente criará:</p>
            
            <div className="w-full bg-[#0b0f19] border border-white/5 rounded-xl p-4 space-y-3 relative z-10">
               <div className="flex items-center gap-2">
                  <span className="bg-red-500/10 text-red-500 px-1.5 py-0.5 text-[10px] font-bold rounded uppercase">{activeRule?.severity || (activeRule as any)?.severidadeBase || 'Médio'}</span>
                  <p className="text-xs font-bold text-white">Risco Registrado</p>
               </div>
               <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  <p className="text-[11px] text-gray-400">Prazo Acionado: <strong className="text-white">{activeRule?.deadline || `${(activeRule as any)?.prazoBase || 0} dias`}</strong></p>
               </div>
               <div className="flex items-center gap-2 ml-1">
                  <User className="w-3.5 h-3.5 text-gray-600" />
                  <p className="text-[11px] text-gray-400">{activeRule?.assignTo || 'Colaborador responsável'} é notificado.</p>
               </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-bold w-full justify-center">
               <CheckCircle2 className="w-4 h-4" /> Lógica validada sem conflitos
            </div>
         </div>
      </div>
   )
}

function TabSlas() {
   const { engineConfig, updateEngineConfig } = useAppStore();

   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl p-6">
            <div className="mb-6">
               <h3 className="text-lg font-bold text-white">Configuração de SLAs</h3>
               <p className="text-sm text-gray-400">Prazos de resolução e regras de escalonamento com base na severidade.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Risco Crítico (em Horas)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.criticoHoras} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, criticoHoras: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-red-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-400 uppercase tracking-wider">Risco Alto (em Horas)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.altoHoras} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, altoHoras: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-orange-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Risco Médio (em Dias)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.medioDias} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, medioDias: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Risco Baixo (em Dias)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.baixoDias} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, baixoDias: Number(e.target.value) }})}
                     className="w-full bg-[#0b0f19] border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500" 
                  />
               </div>
            </div>
         </div>
      </div>
   )
}

function TabAlertas() {
   const { engineConfig, updateEngineConfig, alertas = [], updateAlerta, deleteAlerta, rulePackages = [] } = useAppStore();
   
   const [filterPackage, setFilterPackage] = useState('');
   const [filterSeverity, setFilterSeverity] = useState('');
   const [filterStatus, setFilterStatus] = useState('');
   const [filterOrigin, setFilterOrigin] = useState('');
   const [filterNr, setFilterNr] = useState('');

   const activePackageNames = rulePackages.filter(p => p.isActive).map(p => p.name);
   
   const isPackageVisible = (pkg?: string) => {
      if (!pkg) return true;
      if (pkg === 'Base SST') return true;
      return activePackageNames.includes(pkg);
   };

   const filteredAlertas = alertas.filter(alerta => {
      if (!isPackageVisible(alerta.package)) return false;
      if (filterPackage && alerta.package !== filterPackage) return false;
      if (filterSeverity && alerta.severity !== filterSeverity) return false;
      if (filterStatus && alerta.status !== filterStatus) return false;
      if (filterOrigin && alerta.origin !== filterOrigin) return false;
      if (filterNr && !alerta.nr?.toUpperCase().includes(filterNr.toUpperCase())) return false;
      return true;
   });

   return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start h-full">
         <div className="xl:col-span-1 space-y-6 shrink-0">
            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <div className="mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <Bell className="w-5 h-5 text-purple-400" />
                     Central de Notificações
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Gerencie a cadência e comportamento dos alertas.</p>
               </div>
               
               <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[#0b0f19] border border-white/5 rounded-xl">
                     <div>
                        <p className="text-sm font-bold text-white">Notificar Atrasos Imediatos</p>
                        <p className="text-xs text-gray-400 mt-1">Disparar notificação assim que um SLA estourar.</p>
                     </div>
                     <div 
                        onClick={() => updateEngineConfig({ alertas: { ...engineConfig.alertas, notificarAtraso: !engineConfig.alertas.notificarAtraso }})}
                        className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${engineConfig.alertas.notificarAtraso ? 'bg-purple-600' : 'bg-white/10'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${engineConfig.alertas.notificarAtraso ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Frequência do Resumo</label>
                     <select 
                        value={engineConfig.alertas.frequencia}
                        onChange={(e) => updateEngineConfig({ alertas: { ...engineConfig.alertas, frequencia: e.target.value as any }})}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                     >
                        <option value="Imediata">Imediata</option>
                        <option value="Diária">Diária</option>
                        <option value="Semanal">Semanal</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <div className="mb-6 flex items-center justify-between">
                  <div>
                     <h3 className="text-lg font-bold text-white">Filtros de Visualização</h3>
                     <p className="text-sm text-gray-400 mt-1">Refine a lista de alertas ativos.</p>
                  </div>
                  <button 
                     onClick={() => {
                        setFilterPackage(''); setFilterSeverity(''); setFilterStatus(''); setFilterOrigin(''); setFilterNr('');
                     }}
                     className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
                  >
                     Limpar
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                        <Package className="w-3 h-3" /> Pacote
                     </label>
                     <select 
                        value={filterPackage}
                        onChange={(e) => setFilterPackage(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                     >
                        <option value="">Todos os Pacotes</option>
                        {rulePackages.map(pkg => (
                           <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                           <AlertTriangle className="w-3 h-3" /> Criticidade
                        </label>
                        <select 
                           value={filterSeverity}
                           onChange={(e) => setFilterSeverity(e.target.value)}
                           className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                        >
                           <option value="">Todas</option>
                           <option value="Crítico">Crítico</option>
                           <option value="Alto">Alto</option>
                           <option value="Médio">Médio</option>
                           <option value="Baixo">Baixo</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                           <Info className="w-3 h-3" /> Status
                        </label>
                        <select 
                           value={filterStatus}
                           onChange={(e) => setFilterStatus(e.target.value)}
                           className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                        >
                           <option value="">Todos</option>
                           <option value="Ativo">Ativo</option>
                           <option value="Lido">Lido</option>
                           <option value="Arquivado">Arquivado</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                        <Monitor className="w-3 h-3" /> Origem
                     </label>
                     <select 
                        value={filterOrigin}
                        onChange={(e) => setFilterOrigin(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                     >
                        <option value="">Todas as Origens</option>
                        <option value="Risco">Risco</option>
                        <option value="Ação">Ação</option>
                        <option value="Inspeção">Inspeção</option>
                        <option value="Checklist">Checklist</option>
                        <option value="Sistema">Sistema</option>
                     </select>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                        <FileText className="w-3 h-3" /> Filtrar por NR
                     </label>
                     <input 
                        type="text"
                        placeholder="Ex: NR-35"
                        value={filterNr}
                        onChange={(e) => setFilterNr(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                     />
                  </div>
               </div>
            </div>
         </div>

         <div className="xl:col-span-2 bg-[#121826] border border-white/5 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
               <h3 className="font-bold text-white">Lista de Alertas ({filteredAlertas.length})</h3>
               <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                     {filteredAlertas.filter(a => a.status === 'Ativo').length} Pendentes
                  </span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
               {filteredAlertas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500">
                     <Bell className="w-12 h-12 mb-4 opacity-20" />
                     <p className="text-sm font-medium">Nenhum alerta encontrado para os filtros aplicados.</p>
                     <p className="text-xs mt-1">Experimente remover alguns filtros ou ativar pacotes de regras.</p>
                  </div>
               ) : (
                  <div className="divide-y divide-white/5">
                     {filteredAlertas.map(alerta => (
                        <div key={alerta.id} className={`p-4 hover:bg-white/5 transition-all flex items-start gap-4 ${alerta.status === 'Ativo' ? 'bg-purple-500/5' : ''}`}>
                           <div className={`p-2 rounded-lg shrink-0 ${
                              alerta.severity === 'Crítico' ? 'bg-red-500/20 text-red-400' :
                              alerta.severity === 'Alto' ? 'bg-orange-500/20 text-orange-400' :
                              alerta.severity === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                           }`}>
                              {alerta.severity === 'Crítico' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                 <h4 className="text-sm font-bold text-white truncate pr-4">{alerta.title}</h4>
                                 <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(alerta.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed mb-3">{alerta.description}</p>
                              <div className="flex items-center gap-3">
                                 {alerta.package && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                       <Package className="w-3 h-3" /> {alerta.package}
                                    </span>
                                 )}
                                 {alerta.nr && (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                       {alerta.nr}
                                    </span>
                                 )}
                                 <span className="text-[10px] text-gray-500 italic">via {alerta.origin}</span>
                              </div>
                           </div>
                           <div className="flex flex-col gap-2 shrink-0 self-center">
                              {alerta.status === 'Ativo' ? (
                                 <button 
                                    onClick={() => updateAlerta(alerta.id, { status: 'Lido' })}
                                    className="p-1.5 bg-[#0b0f19] border border-white/10 rounded hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                                    title="Marcar como lido"
                                 >
                                    <CheckCircle2 className="w-4 h-4" />
                                 </button>
                              ) : (
                                 <button 
                                    onClick={() => updateAlerta(alerta.id, { status: 'Ativo' })}
                                    className="p-1.5 bg-[#0b0f19] border border-white/10 rounded hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/30 transition-all opacity-40 hover:opacity-100"
                                    title="Marcar como pendente"
                                 >
                                    <Clock className="w-4 h-4" />
                                 </button>
                              )}
                              <button 
                                 onClick={() => deleteAlerta(alerta.id)}
                                 className="p-1.5 bg-[#0b0f19] border border-white/10 rounded hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all opacity-40 hover:opacity-100"
                                 title="Excluir alerta"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   )
}

function TabIndicadores() {
   const { work_hours = [], addWorkHours, updateWorkHours, deleteWorkHours, sectors } = useAppStore();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingItem, setEditingItem] = useState<any>(null);

   // Form
   const [periodStart, setPeriodStart] = useState('');
   const [periodEnd, setPeriodEnd] = useState('');
   const [sectorId, setSectorId] = useState('');
   const [calculationMode, setCalculationMode] = useState<'Manual'|'Estimado'>('Manual');
   
   // Estimado fields
   const [employeeCount, setEmployeeCount] = useState(0);
   const [hoursPerDay, setHoursPerDay] = useState(8);
   const [workDays, setWorkDays] = useState(22);
   const [overtimeHours, setOvertimeHours] = useState(0);
   const [absenceHours, setAbsenceHours] = useState(0);
   
   // Manual fields
   const [totalHoursManual, setTotalHoursManual] = useState(0);

   const handleAdd = () => {
      setEditingItem(null);
      setPeriodStart('');
      setPeriodEnd('');
      setSectorId('');
      setCalculationMode('Manual');
      setTotalHoursManual(0);
      setEmployeeCount(0);
      setHoursPerDay(8);
      setWorkDays(22);
      setOvertimeHours(0);
      setAbsenceHours(0);
      setIsModalOpen(true);
   };

   const handleEdit = (item: any) => {
      setEditingItem(item);
      setPeriodStart(item.period_start);
      setPeriodEnd(item.period_end);
      setSectorId(item.sector_id);
      setCalculationMode(item.calculation_mode);
      setEmployeeCount(item.employee_count || 0);
      setHoursPerDay(item.hours_per_day || 8);
      setWorkDays(item.work_days || 22);
      setOvertimeHours(item.overtime_hours || 0);
      setAbsenceHours(item.absence_hours || 0);
      setTotalHoursManual(item.total_hours || 0);
      setIsModalOpen(true);
   };

   const handleSave = () => {
      if(!periodStart || !periodEnd || !sectorId) return alert('Preencha período e setor.');
      
      let total_hours = 0;
      if(calculationMode === 'Manual') {
         total_hours = Number(totalHoursManual);
      } else {
         total_hours = (employeeCount * hoursPerDay * workDays) + overtimeHours - absenceHours;
      }

      const data = {
         period_start: periodStart,
         period_end: periodEnd,
         sector_id: sectorId,
         calculation_mode: calculationMode,
         employee_count: employeeCount,
         hours_per_day: hoursPerDay,
         work_days: workDays,
         overtime_hours: overtimeHours,
         absence_hours: absenceHours,
         total_hours: total_hours > 0 ? total_hours : 0,
         updated_at: new Date().toISOString(),
         created_at: editingItem ? editingItem.created_at : new Date().toISOString(),
      };

      if (editingItem) {
         updateWorkHours(editingItem.id, data);
      } else {
         addWorkHours(data);
      }
      setIsModalOpen(false);
   };

   return (
      <div className="bg-[#121826] border border-white/5 rounded-2xl flex flex-col overflow-hidden max-h-full">
         <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
               <h2 className="text-xl font-bold text-white mb-1">Horas Trabalhadas (HET)</h2>
               <p className="text-sm text-gray-400">Cadastre o tempo de exposição para cálculo correto de TFA e TG.</p>
            </div>
            <button 
               onClick={handleAdd} 
               className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
               <Plus className="w-4 h-4" /> Novo registro
            </button>
         </div>

         <div className="overflow-x-auto w-full flex-1">
            {work_hours.length === 0 ? (
               <div className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
                  <Activity className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-300">Nenhum registro de horas</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">Os cálculos de TFA e TG apresentarão aviso de &quot;dados insuficientes&quot; até que as horas sejam lançadas.</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[#0b0f19] border-b border-white/5">
                     <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Período</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Setor/Unidade</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Modo</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total de Horas</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lançado em</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {work_hours.map((w) => {
                        const sectorName = sectors.find(s => s.id === w.sector_id)?.name || w.sector_id;
                        return (
                           <tr key={w.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-5 py-4">
                                 <span className="text-[13px] font-bold text-gray-200 block">{w.period_start} a {w.period_end}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[13px] text-gray-300">{sectorName}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    w.calculation_mode === 'Estimado' 
                                       ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                                       : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                 }`}>{w.calculation_mode}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[14px] font-bold text-white">{Number(w.total_hours).toLocaleString('pt-BR')}h</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[12px] text-gray-500">{new Date(w.created_at).toLocaleDateString('pt-BR')}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleEdit(w)} className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deleteWorkHours(w.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            )}
         </div>

         {/* Modal */}
         <AnimatePresence>
            {isModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-[#121826] border border-white/10 rounded-2xl w-full max-w-2xl max-h-full overflow-y-auto custom-scrollbar shadow-2xl relative"
                  >
                     <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#121826] z-10">
                        <h3 className="text-xl font-bold text-white">{editingItem ? 'Editar Lançamento' : 'Novo Lançamento de Horas'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2">
                           <X className="w-5 h-5"/>
                        </button>
                     </div>

                     <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Período Incial</label>
                              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-purple-500 max-h-[46px]" style={{ colorScheme: 'dark' }} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Período Final</label>
                              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-purple-500 max-h-[46px]" style={{ colorScheme: 'dark' }}/>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Setor / Unidade</label>
                           <select value={sectorId} onChange={e => setSectorId(e.target.value)} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-purple-500 appearance-none">
                              <option value="">Selecione...</option>
                              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-6">
                           <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Modo de Cálculo</label>
                           <div className="flex gap-4">
                              <button 
                                 onClick={() => setCalculationMode('Manual')}
                                 className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${calculationMode === 'Manual' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-[#0b0f19] border-white/5 text-gray-400 hover:text-white'}`}
                              >
                                 <FileText className="w-4 h-4"/> Valor Informado
                              </button>
                              <button 
                                 onClick={() => setCalculationMode('Estimado')}
                                 className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${calculationMode === 'Estimado' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0b0f19] border-white/5 text-gray-400 hover:text-white'}`}
                              >
                                 <Activity className="w-4 h-4"/> Estimado / CCT
                              </button>
                           </div>
                        </div>

                        {calculationMode === 'Manual' ? (
                           <div className="bg-[#0b0f19]/50 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider items-center flex gap-2"> <FileText className="w-4 h-4 text-emerald-400"/> Total de Horas Trabalhadas</label>
                                 <div className="relative">
                                    <input type="number" step="1" value={totalHoursManual} onChange={e => setTotalHoursManual(Number(e.target.value))} className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">horas totais</span>
                                 </div>
                                 <p className="text-[11px] text-gray-500 mt-2">Informe diretamente o total global do período (Extraia do sistema de ponto/RH).</p>
                              </div>
                           </div>
                        ) : (
                           <div className="bg-[#0b0f19]/50 p-5 rounded-xl border border-white/5 space-y-5 shadow-inner">
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-gray-400 transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Total Colaboradores</label>
                                    <input type="number" value={employeeCount} onChange={e => setEmployeeCount(Number(e.target.value))} className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 text-[16px] font-bold text-white py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-gray-400 transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Horas/Dia (Média)</label>
                                    <input type="number" value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 text-[16px] font-bold text-white py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-gray-400 transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Dias Trabalhados</label>
                                    <input type="number" value={workDays} onChange={e => setWorkDays(Number(e.target.value))} className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 text-[16px] font-bold text-white py-1 outline-none transition-colors" />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5 focus-within:text-green-400 text-gray-400 transition-colors border-l-2 border-emerald-500/50 pl-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">+ Horas Extras Totais</label>
                                    <input type="number" value={overtimeHours} onChange={e => setOvertimeHours(Number(e.target.value))} className="w-full bg-transparent border-b border-white/10 focus:border-green-500 text-[16px] font-bold text-white py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-red-400 text-gray-400 transition-colors border-l-2 border-red-500/50 pl-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">- Ausência (Absenteísmo)</label>
                                    <input type="number" value={absenceHours} onChange={e => setAbsenceHours(Number(e.target.value))} className="w-full bg-transparent border-b border-white/10 focus:border-red-500 text-[16px] font-bold text-white py-1 outline-none transition-colors" />
                                 </div>
                              </div>
                              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                                 <span className="text-sm font-bold text-gray-400">Total HET Calculado:</span>
                                 <span className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    {((employeeCount * hoursPerDay * workDays) + overtimeHours - absenceHours).toLocaleString('pt-BR')}h
                                 </span>
                              </div>
                           </div>
                        )}
                        
                     </div>

                     <div className="p-6 border-t border-white/5 bg-[#0b0f19] rounded-b-2xl flex justify-end gap-3 sticky bottom-0 z-10 w-full">
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-purple-500/20">
                           Salvar HET
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}
