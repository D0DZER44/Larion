"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { getTodasRegrasAtivas, fixedNrRules } from '@/lib/normativeRules';
import { getTodosChecklistsAtivos } from '@/lib/normativeChecklists';
import AcaoRecomendadaCard from '@/components/AcaoRecomendadaCard';
import { 
  Settings, Building2, Users, CheckSquare, ShieldAlert, Clock, Bell, User, 
  ChevronRight, ShieldCheck, FileText, AlertTriangle, 
  Plus, Search, Edit2, Trash2, GripVertical, CheckCircle2, Monitor, Phone, 
  Mail, MapPin, Lock, Activity, Shield, X
} from 'lucide-react';

const TABS = [
  { id: 'geral', label: 'Geral', icon: <Settings className="w-4 h-4" /> },
  { id: 'empresa', label: 'Empresa', icon: <Building2 className="w-4 h-4" /> },
  { id: 'usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
  { id: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'regras', label: 'Regras de Risco', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'slas', label: 'Prazos e SLAs', icon: <Clock className="w-4 h-4" /> },
  { id: 'alertas', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
  { id: 'indicadores', label: 'Indicadores SST', icon: <Activity className="w-4 h-4" /> },
  { id: 'perfil', label: 'Perfil', icon: <User className="w-4 h-4" /> },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('geral');

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-[var(--text-primary)] font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Background elements for depth */}
        <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden relative z-10">
          
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Configurações</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">Gerencie as principais configurações e regras do sistema.</p>
            </div>
            <div>
               <button className="relative p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-active-group)] text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border)]">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
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
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[var(--shadow-glow)]' 
                    : 'bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-active-group)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
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
                 {activeTab === 'empresa' && <TabEmpresa />}
                 {activeTab === 'usuarios' && <TabUsuarios />}
                 {activeTab === 'checklists' && <TabChecklists />}
                 {activeTab === 'regras' && <TabRegras />}
                 {activeTab === 'slas' && <TabSlas />}
                 {activeTab === 'alertas' && <TabAlertas />}
                 {activeTab === 'indicadores' && <TabIndicadores />}
                 {activeTab === 'perfil' && <TabPerfil />}
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
            <div key={i} className={`bg-[var(--bg-secondary)] border overflow-hidden p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-[var(--bg-active-group)] transition-colors relative ${card.border}`}>
               <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.bg} ${card.border}`}>
                     {card.icon}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{card.title}</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">{card.val}</span>
                        <span className="text-xs text-[var(--text-muted)]">{card.desc}</span>
                     </div>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>
         ))}
      </div>

      {/* Masonry-like Grid for Settings Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
         
         {/* Block 1 */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
               <Building2 className="w-5 h-5 text-purple-400" />
               <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Informações da Empresa</h3>
            </div>
            <h4 className="font-bold text-[var(--text-primary)] mb-4 text-lg">Larion Indústria Ltda.</h4>
            <div className="space-y-4 mb-6">
               <div className="grid grid-cols-2">
                  <span className="text-[13px] text-[var(--text-muted)] flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> Segmento</span>
                  <span className="text-[13px] text-[var(--text-primary)]">Indústria</span>
               </div>
               <div className="grid grid-cols-2">
                  <span className="text-[13px] text-[var(--text-muted)] flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> CNPJ</span>
                  <span className="text-[13px] text-[var(--text-primary)]">12.345.678/0001-90</span>
               </div>
               <div className="grid grid-cols-2">
                  <span className="text-[13px] text-[var(--text-muted)] flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> Telefone</span>
                  <span className="text-[13px] text-[var(--text-primary)]">(11) 3456-7890</span>
               </div>
               <div className="grid grid-cols-2">
                  <span className="text-[13px] text-[var(--text-muted)] flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> E-mail</span>
                  <span className="text-[13px] text-[var(--text-primary)]">contato@larion.com.br</span>
               </div>
            </div>
            <button className="text-[13px] font-medium text-[var(--text-primary)] bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] px-4 py-2 rounded-lg border border-[var(--border)] w-full flex items-center justify-center gap-2 transition-colors">
               <Edit2 className="w-4 h-4" /> Editar informações
            </button>
         </div>

         {/* Block 2 */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
               <Settings className="w-5 h-5 text-purple-400" />
               <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Configurações do Sistema</h3>
            </div>
            <div className="space-y-5 mb-6">
               {[
                  { t: 'Exigir justificativa (atrasos)', d: 'Obriga input no motivo.' },
                  { t: 'Bloquear edição pós-fechamento', d: 'Impede alteração em inspeções.' },
                  { t: 'Habilitar anexos (fotos)', d: 'Permite arquivos em evidências.' },
               ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                     <div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">{item.t}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{item.d}</p>
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
         <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
             <div className="flex items-center gap-3 mb-6">
               <Activity className="w-5 h-5 text-emerald-400" />
               <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Impacto Econômico</h3>
            </div>
            
            <div className="space-y-4 mb-6">
               <div className="flex justify-between items-center gap-4">
                  <div>
                     <p className="text-[13px] font-bold text-[var(--text-primary)]">Habilitar cálculo</p>
                     <p className="text-[11px] text-[var(--text-muted)]">Mostrar nas áreas de risco.</p>
                  </div>
                  <div 
                     onClick={() => updateEngineConfig({ economia: { ...engineConfig.economia, enabled: !engineConfig.economia.enabled }})}
                     className={`w-9 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${engineConfig.economia.enabled ? 'bg-emerald-600' : 'bg-[var(--bg-active-group)]'}`}
                  >
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${engineConfig.economia.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Custo Hora Parada (R$)</label>
                  <input 
                     type="number" 
                     value={engineConfig.economia.custoHoraParada}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, custoHoraParada: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nº de Empregados (Total)</label>
                  <input 
                     type="number" 
                     value={engineConfig.economia.numEmpregados}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, numEmpregados: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Fator Reincidência (Auto)</label>
                  <input 
                     type="number" 
                     step="0.1"
                     value={engineConfig.economia.fatorReincidencia}
                     onChange={(e) => updateEngineConfig({ economia: { ...engineConfig.economia, fatorReincidencia: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" 
                  />
               </div>

            </div>
         </div>

      </div>
    </div>
  )
}

function TabEmpresa() {
   const { sectors, addSector, updateSector, deleteSector } = useAppStore();

   const handleAddSector = () => {
      addSector({ name: 'Novo Setor' });
   };

   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         
         <div className="flex-1 space-y-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
               <div className="mb-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Dados Essenciais</h3>
                  <p className="text-sm text-[var(--text-muted)]">Informações principais que aparecem em laudos e cabeçalhos.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Razão Social</label>
                     <input type="text" defaultValue="Larion Indústria Ltda." className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">CNPJ</label>
                     <input type="text" defaultValue="12.345.678/0001-90" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Telefone</label>
                     <input type="text" defaultValue="(11) 3456-7890" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">E-mail Corporativo</label>
                     <input type="email" defaultValue="contato@larion.com.br" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Endereço Completo</label>
                     <input type="text" defaultValue="Rua das Indústrias, 123, Galpão A - São Paulo/SP" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                  <button className="bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                     Salvar dados
                  </button>
               </div>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
               <div className="mb-6 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-[var(--text-primary)]">Prefêrencias Locais</h3>
                     <p className="text-sm text-[var(--text-muted)]">Padrões regionais da planta.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Fuso Horário</label>
                     <select className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 appearance-none">
                        <option>Brasília (UTC-3)</option>
                        <option>Manaus (UTC-4)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Idioma</label>
                     <select className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 appearance-none">
                        <option>Português (BR)</option>
                        <option>English</option>
                        <option>Español</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-full lg:w-[450px] space-y-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
               <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-4">Logo da Empresa</h3>
               <div className="border border-dashed border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-active-group)] hover:border-purple-500/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <Building2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <button className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-active-group)] px-4 py-2 rounded-lg border border-[var(--border)] mb-2">Alterar logo</button>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">PNG ou JPG. Máx 2MB.<br/>Recomendado: 512x512</p>
               </div>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 flex flex-col h-[400px]">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Setores</h3>
                  <button onClick={handleAddSector} className="text-[11px] font-bold text-purple-400 uppercase tracking-wider hover:text-purple-300 transition-colors flex items-center gap-1">
                     <Plus className="w-3.5 h-3.5" /> Setor
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {sectors.map((setor) => (
                     <div key={setor.id} className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl group hover:border-[var(--border)] transition-colors cursor-move">
                        <GripVertical className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-muted)]" />
                        <input 
                           value={setor.name} 
                           onChange={(e) => updateSector(setor.id, e.target.value)}
                           className="bg-transparent border-none text-[13px] font-medium text-[var(--text-primary)] flex-1 focus:outline-none focus:border-b border-purple-500" 
                        />
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => deleteSector(setor.id)} className="text-red-500/70 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

      </div>
   )
}

function TabUsuarios() {
   const { users, addUser, updateUser, deleteUser } = useAppStore();
   const [search, setSearch] = useState('');
   
   const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

   const handleAdd = () => {
      addUser({ name: 'Novo Usuário', role: 'Cargo', email: 'email@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150' });
   };

   return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden">
         <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
               <input 
                  type="text" 
                  placeholder="Buscar usuários..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" 
               />
            </div>
            <button onClick={handleAdd} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> Novo usuário
            </button>
         </div>

         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                  <tr>
                     <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Usuário</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cargo</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">E-mail</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border)]">
                  {filteredUsers.map((u) => (
                     <tr key={u.id} className="hover:bg-[var(--bg-active-group)] transition-colors group">
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`} alt={u.name} className="w-8 h-8 rounded-full bg-gray-800" />
                              <input 
                                 className="bg-transparent border-none text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-b-2 focus:border-purple-500"
                                 value={u.name}
                                 onChange={(e) => updateUser(u.id, { name: e.target.value })}
                              />
                           </div>
                        </td>
                        <td className="px-5 py-4">
                           <input 
                              className="bg-transparent border-none text-[13px] text-[var(--text-muted)] focus:outline-none focus:border-b-2 focus:border-purple-500"
                              value={u.role}
                              onChange={(e) => updateUser(u.id, { role: e.target.value })}
                           />
                        </td>
                        <td className="px-5 py-4">
                           <input 
                              className="bg-transparent border-none text-[13px] text-[var(--text-muted)] focus:outline-none focus:border-b-2 focus:border-purple-500"
                              value={u.email}
                              onChange={(e) => updateUser(u.id, { email: e.target.value })}
                           />
                        </td>
                        <td className="px-5 py-4">
                           <button 
                              onClick={() => updateUser(u.id, { status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' })}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              u.status === 'Ativo' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[var(--text-muted)] bg-[var(--bg-active-group)] border-[var(--border)]'
                           }`}>{u.status}</button>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <button onClick={() => deleteUser(u.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   )
}

function TabChecklists() {
   const { checklists, addChecklist, updateChecklist, deleteChecklist } = useAppStore();
   const [search, setSearch] = useState('');

   const allChecklists = getTodosChecklistsAtivos(checklists);
   const [selectedId, setSelectedId] = useState(allChecklists[0]?.id);

   const filteredChecklists = allChecklists.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
   const activeChecklist = allChecklists.find(c => c.id === selectedId) || allChecklists[0];

   const handleAdd = () => {
      addChecklist({ name: 'Novo Modelo', category: 'Segurança Geral', status: 'Rascunho', sections: [] });
   };

   return (
      <div className="flex flex-col xl:flex-row gap-6 w-full items-start h-[600px]">
         
         {/* Left: Templates */}
         <div className="w-full xl:w-[280px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 flex flex-col h-full shrink-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Modelos de Checklist</h3>
            <div className="relative mb-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
               <input 
                  type="text" 
                  placeholder="Buscar modelo..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500" 
               />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {filteredChecklists.map((c) => {
                  const isActive = c.id === selectedId;
                  let color = 'bg-gray-500';
                  if(c.status === 'Ativo') color = 'bg-emerald-500';
                  if(c.status === 'Rascunho') color = 'bg-orange-500';

                  return (
                     <div key={c.id} onClick={() => setSelectedId(c.id)} className={`p-3 rounded-xl border transition-colors cursor-pointer ${isActive ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[var(--bg-active-group)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className={`w-2 h-2 rounded-full mt-1 ${color}`}></span>
                           <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{c.status}</span>
                        </div>
                        <p className={`text-[13px] font-bold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{c.name}</p>
                     </div>
                  );
               })}
            </div>
            <button onClick={handleAdd} className="mt-4 w-full bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[var(--border)]">
               <Plus className="w-3.5 h-3.5" /> Novo modelo
            </button>
         </div>

         {/* Middle: Builder */}
         {activeChecklist ? (
            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl flex flex-col h-full overflow-hidden shadow-lg">
               <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-primary)]">
                  <div>
                     <h2 className="text-lg font-bold text-[var(--text-primary)] mb-0.5">Construtor de Checklist</h2>
                     <p className="text-xs text-[var(--text-muted)]">Edite perguntas e regras (Modelo: {activeChecklist.name})</p>
                  </div>
                  <div className="flex items-center gap-2">
                     {!activeChecklist.regraFixa && (
                        <button onClick={() => deleteChecklist(activeChecklist.id)} className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Excluir</button>
                     )}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#0A0D14]">
                  
                  <div className="max-w-3xl mx-auto space-y-6">
                     {/* Basic Info */}
                     <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-5 rounded-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nome do checklist</label>
                              <input 
                                 type="text" 
                                 value={activeChecklist.name} 
                                 onChange={(e) => updateChecklist(activeChecklist.id, { name: e.target.value })}
                                 disabled={activeChecklist.regraFixa}
                                 className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 disabled:opacity-50" 
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</label>
                              <select 
                                 value={activeChecklist.status}
                                 onChange={(e) => updateChecklist(activeChecklist.id, { status: e.target.value as any })}
                                 disabled={activeChecklist.regraFixa}
                                 className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 appearance-none disabled:opacity-50"
                              >
                                 <option value="Ativo">Ativo</option>
                                 <option value="Rascunho">Rascunho</option>
                                 <option value="Inativo">Inativo</option>
                              </select>
                           </div>
                        </div>
                     </div>

                     {/* Sections */}
                     <div className="space-y-4">
                        {activeChecklist.sections.map((section: any, sIndex: number) => (
                           <div key={section.id} className="bg-[#1e1b4b]/20 border border-purple-500/20 p-1 rounded-2xl relative group/section">
                              <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
                                 <div className="p-3 bg-[var(--bg-primary)] border-b border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                       <GripVertical className="w-4 h-4 text-[var(--text-secondary)] cursor-move" />
                                       <input 
                                          type="text" 
                                          value={section.title} 
                                          disabled={activeChecklist.regraFixa}
                                          onChange={(e) => {
                                             const newSections = [...activeChecklist.sections];
                                             newSections[sIndex].title = e.target.value;
                                             updateChecklist(activeChecklist.id, { sections: newSections });
                                          }}
                                          className="bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-purple-500 text-sm font-bold text-[var(--text-primary)] focus:outline-none w-full max-w-[250px] transition-colors disabled:opacity-50" 
                                       />
                                    </div>
                                    <div className="flex items-center gap-2">
                                       {!activeChecklist.regraFixa && (
                                          <button 
                                             onClick={() => {
                                                const newSections = activeChecklist.sections.filter((_: any, idx: number) => idx !== sIndex);
                                                updateChecklist(activeChecklist.id, { sections: newSections });
                                             }}
                                             className="text-[11px] px-2 py-1 text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover/section:opacity-100"
                                          >Excluir</button>
                                       )}
                                       <span className="text-[11px] text-[var(--text-muted)] font-medium">{section.questions.length} perguntas</span>
                                    </div>
                                 </div>
                                 <div className="px-4 py-2 space-y-1">
                                    {section.questions.map((item: any, qIndex: number) => (
                                       <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0 group">
                                          <GripVertical className="w-3.5 h-3.5 text-[var(--text-secondary)] cursor-move opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          <input 
                                             type="text"
                                             value={item.text}
                                             disabled={activeChecklist.regraFixa || item.regraFixa}
                                             onChange={(e) => {
                                                const newSections = [...activeChecklist.sections];
                                                newSections[sIndex].questions[qIndex].text = e.target.value;
                                                updateChecklist(activeChecklist.id, { sections: newSections });
                                             }}
                                             className="bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-purple-500 text-[13px] text-[var(--text-secondary)] focus:outline-none flex-1 transition-colors disabled:opacity-50"
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
                                                className="bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded px-2 py-1 text-[10px] font-medium outline-none appearance-none cursor-pointer disabled:opacity-50"
                                             >
                                                <option value="Aprovação (Sim/Não)">Aprovação (Sim/Não)</option>
                                                <option value="Sim / Não / Parcialmente">Sim / Não / Parcialmente</option>
                                                <option value="Múltipla Escolha">Múltipla Escolha</option>
                                                <option value="Texto Longo">Texto Longo</option>
                                                <option value="Data/Hora">Data/Hora</option>
                                                <option value="Anexo/Foto">Anexo/Foto</option>
                                             </select>
                                             {item.nrRelacionada && (
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-active-group)] px-2 py-1 rounded">
                                                   {item.nrRelacionada}
                                                </span>
                                             )}
                                             <select
                                                value={item.riskMap}
                                                disabled={activeChecklist.regraFixa || item.regraFixa}
                                                onChange={(e) => {
                                                   const newSections = [...activeChecklist.sections];
                                                   newSections[sIndex].questions[qIndex].riskMap = e.target.value;
                                                   updateChecklist(activeChecklist.id, { sections: newSections });
                                                }}
                                                className={`w-24 px-1 py-1 text-[10px] font-medium rounded border bg-[var(--bg-primary)] outline-none cursor-pointer disabled:opacity-50 ${item.riskMap === 'Crítico' || item.riskMap === 'Crítica' ? 'text-red-500 border-red-500/30' : item.riskMap === 'Alta' || item.riskMap === 'Médio' ? 'text-orange-500 border-orange-500/30' : item.riskMap === 'Leve' ? 'text-emerald-500 border-emerald-500/30' : 'text-[var(--text-muted)] border-gray-500/30'}`}
                                             >
                                                <option value="Nenhum">Sem risco</option>
                                                <option value="Leve">Risco Leve</option>
                                                <option value="Médio">Risco Médio</option>
                                                <option value="Alta">Risco Alto</option>
                                                <option value="Crítico">Risco Crítico</option>
                                                <option value="Crítica">Risco Crític.</option>
                                             </select>
                                             {!activeChecklist.regraFixa && !item.regraFixa && (
                                                <button 
                                                   onClick={() => {
                                                      const newSections = [...activeChecklist.sections];
                                                      newSections[sIndex].questions = newSections[sIndex].questions.filter((_: any, idx: number) => idx !== qIndex);
                                                      updateChecklist(activeChecklist.id, { sections: newSections });
                                                   }}
                                                   className="text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                   <X className="w-3.5 h-3.5" />
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
                                       className="w-full py-2.5 text-xs text-purple-400 font-bold hover:bg-purple-500/5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 border border-transparent hover:border-purple-500/10"
                                    >
                                       <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta
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
                           className="w-full py-4 rounded-xl border border-dashed border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5 text-[var(--text-muted)] hover:text-purple-400 transition-colors flex items-center justify-center gap-2 font-bold text-xs"
                        >
                           <Plus className="w-4 h-4" /> Nova Seção
                        </button>
                     </div>
                  </div>

               </div>
            </div>
         ) : null}

      </div>
   )
}

function TabRegras() {
   const [subTab, setSubTab] = useState<'fixas' | 'personalizadas'>('fixas');

   return (
      <div className="flex flex-col h-[700px]">
         <div className="flex items-center gap-4 border-b border-[var(--border)] mb-4 shrink-0">
            <button onClick={() => setSubTab('fixas')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${subTab === 'fixas' ? 'border-purple-500 text-purple-400' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>Regras fixas NR</button>
            <button onClick={() => setSubTab('personalizadas')} className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${subTab === 'personalizadas' ? 'border-purple-500 text-purple-400' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>Regras personalizadas</button>
         </div>

         {subTab === 'fixas' ? <SubTabRegrasFixas /> : <SubTabRegrasPersonalizadas />}
      </div>
   );
}

function SubTabRegrasFixas() {
   const rules = fixedNrRules;
   const [selectedRule, setSelectedRule] = useState<any>(null);

   return (
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden relative">
         <div className="p-5 border-b border-[var(--border)] shrink-0 flex items-center justify-between bg-[var(--bg-primary)]">
            <div>
               <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Regras fixas NR</h3>
               <p className="text-xs text-[var(--text-muted)] mt-1.5">Base normativa imutável que compõe o motor inteligente ApexShield.</p>
            </div>
            <div className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[11px] font-bold border border-purple-500/20">
               Regras do Gerenciamento de Risco
            </div>
         </div>
         <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase">
                  <tr>
                     <th className="px-5 py-3 font-medium">NR</th>
                     <th className="px-5 py-3 font-medium w-64 max-w-xs">Regra</th>
                     <th className="px-5 py-3 font-medium">Severidade</th>
                     <th className="px-5 py-3 font-medium text-center">Gera Risco / Ação</th>
                     <th className="px-5 py-3 font-medium">Status / Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                  {rules.map((rule) => (
                     <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 font-bold text-indigo-400">{rule.nr}</td>
                        <td className="px-5 py-3 w-64 max-w-xs truncate" title={rule.titulo}>{rule.titulo}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rule.severidadeBase === 'Crítica' || rule.severidadeBase === 'Crítico' ? 'bg-red-500/10 text-red-500 border-red-500/20' : rule.severidadeBase === 'Alta' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>{rule.severidadeBase}</span></td>
                        <td className="px-5 py-3 text-center">
                           <div className="flex items-center justify-center gap-2 text-xs">
                              <span className={rule.geraRisco ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>Risco</span>
                              <span className="text-[var(--text-secondary)]">•</span>
                              <span className={rule.geraAcao ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>Ação</span>
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[var(--bg-primary)] z-10" onClick={() => setSelectedRule(null)} />
                  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute top-0 right-0 bottom-0 w-[500px] max-w-[90%] bg-[var(--bg-secondary)] border-l border-[var(--border)] z-20 shadow-2xl flex flex-col">
                     <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-primary)]">
                        <div>
                           <div className="flex items-center gap-2 mb-1.5">
                              <h2 className="text-lg font-black text-[var(--text-primary)]">{selectedRule.nr}</h2>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">Regra Fixa</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-gray-500/10 text-[var(--text-muted)] border-[var(--border)]">Não Editável</span>
                           </div>
                           <p className="text-sm text-[var(--text-secondary)]">{selectedRule.titulo}</p>
                        </div>
                        <button onClick={() => setSelectedRule(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-active-group)] transition-colors"><X className="w-5 h-5"/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        
                        {/* Base normativa */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400 pb-2 border-b border-[var(--border)]">
                              <ShieldCheck className="w-4 h-4" /> Base Normativa
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Perigo</span>
                                 <p className="text-xs text-[var(--text-secondary)]">{selectedRule.perigo || 'N/A'}</p>
                              </div>
                              <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Tipo de Risco</span>
                                 <p className="text-xs text-[var(--text-secondary)]">{selectedRule.tipoRisco || 'N/A'}</p>
                              </div>
                           </div>
                           <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)]">
                              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Impacto legal</span>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{selectedRule.descricao}</p>
                           </div>
                        </div>

                        {/* Gatilho */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-orange-400 pb-2 border-b border-[var(--border)]">
                              <AlertTriangle className="w-4 h-4" /> Gatilho
                           </h4>
                           <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)] space-y-2">
                              {selectedRule.perguntasChecklist?.map((pq: string, i: number) => (
                                 <div key={i} className="flex gap-2">
                                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">Ao responder &apos;Não&apos; ou &apos;Parcialmente&apos; para: &quot;{pq}&quot;</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Efeitos Automáticos */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-blue-400 pb-2 border-b border-[var(--border)]">
                              <Activity className="w-4 h-4" /> Efeitos Automáticos
                           </h4>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-xs text-[var(--text-muted)]">Gera Risco</span>
                                 <span className={selectedRule.geraRisco ? 'text-emerald-400 text-xs font-bold' : 'text-[var(--text-muted)] text-xs font-medium'}>{selectedRule.geraRisco ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-xs text-[var(--text-muted)]">Gera Ação</span>
                                 <span className={selectedRule.geraAcao ? 'text-emerald-400 text-xs font-bold' : 'text-[var(--text-muted)] text-xs font-medium'}>{selectedRule.geraAcao ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-xs text-[var(--text-muted)]">Impacta Score</span>
                                 <span className={selectedRule.impactaScore ? 'text-emerald-400 text-xs font-bold' : 'text-[var(--text-muted)] text-xs font-medium'}>{selectedRule.impactaScore ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-xs text-[var(--text-muted)]">Bloqueante</span>
                                 <span className={selectedRule.bloqueante ? 'text-red-400 text-xs font-bold' : 'text-[var(--text-muted)] text-xs font-medium'}>{selectedRule.bloqueante ? 'Sim' : 'Não'}</span>
                              </div>
                           </div>
                        </div>

                        {/* Cálculos */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 pb-2 border-b border-[var(--border)]">
                              <CheckCircle2 className="w-4 h-4" /> Cálculos Predefinidos
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Severidade</span>
                                 <p className="text-xs text-[var(--text-primary)] font-medium">{selectedRule.severidadeBase}</p>
                              </div>
                              <div className="bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Prazo SLA</span>
                                 <p className="text-xs text-[var(--text-primary)] font-medium">{selectedRule.prazoBase} dias</p>
                              </div>
                              <div className="bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Multa estimada</span>
                                 <p className="text-xs text-[var(--text-primary)] font-medium">R$ {selectedRule.multaBaseEstimativa?.toLocaleString('pt-BR') || '0'}</p>
                              </div>
                              <div className="bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                                 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Chance Inicial</span>
                                 <p className="text-xs text-[var(--text-primary)] font-medium">{selectedRule.chanceIncidenteBase}%</p>
                              </div>
                           </div>
                        </div>

                        {/* Proteção */}
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-6 font-mono text-xs">
                           <div className="flex items-start gap-2 mb-2">
                              <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <span className="text-red-400 font-bold">Proteção do Sistema Aplicada</span>
                           </div>
                           <div className="ml-6 space-y-1 text-[var(--text-muted)]">
                              <p>&gt; editavel: <span className="text-orange-300">false</span></p>
                              <p>&gt; removivel: <span className="text-orange-300">false</span></p>
                              <p>&gt; fonte: <span className="text-[var(--text-primary)]">{selectedRule.fonte}</span></p>
                           </div>
                        </div>

                     </div>
                     <div className="p-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg-primary)] flex justify-end">
                        <button onClick={() => setSelectedRule(null)} className="px-5 py-2.5 bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] transition-colors">Fechar Painel</button>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </div>
   );
}

function SubTabRegrasPersonalizadas() {
   const { rules, addRule, updateRule, deleteRule } = useAppStore();
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
         <div className="w-full xl:w-[280px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 flex flex-col h-full shrink-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Regras Personalizadas</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {rules.map((r: any) => {
                  const isActive = r.id === selectedId;
                  const severity = r.severity || r.severidadeBase;
                  const isActiveRule = r.isActive !== undefined ? r.isActive : true;
                  return (
                     <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-3 rounded-xl border transition-colors cursor-pointer ${isActive ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[var(--bg-active-group)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className={`w-2 h-2 rounded-full mt-1 ${isActiveRule ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                           <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{severity}</span>
                        </div>
                        <p className={`text-[13px] font-bold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{r.name}</p>
                     </div>
                  );
               })}
            </div>
            <button onClick={handleAdd} className="mt-4 w-full bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[var(--border)]">
               <Plus className="w-3.5 h-3.5" /> Nova regra personal.
            </button>
         </div>

         {/* Left Side: Rule Builder */}
         {activeRule ? (
         <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl flex flex-col h-full shadow-lg">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-primary)]">
               <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-0.5">{(activeRule as any).regraFixa ? 'Visualizador de Regra Fixa' : 'Construtor de Regra (Risco Automático)'}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{(activeRule as any).regraFixa ? 'Esta regra é normativa e não pode ser alterada.' : 'Transforme respostas em ações proativas no sistema.'}</p>
               </div>
               <div className="flex items-center gap-2">
                  {!(activeRule as any).regraFixa && <button onClick={() => deleteRule(activeRule.id)} className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Excluir</button>}
                  {!(activeRule as any).regraFixa && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-4 py-2 rounded-lg text-[13px] font-bold transition-colors" onClick={() => updateRule(activeRule.id, { isActive: !activeRule.isActive })}>
                       {activeRule.isActive ? 'Desativar Regra' : 'Ativar Regra'}
                    </button>
                  )}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{(activeRule as any).regraFixa ? 'Título da Regra' : 'Nome da Regra'}</label>
                  <input type="text" value={activeRule.name || (activeRule as any).titulo} onChange={e => !(activeRule as any).regraFixa && updateRule(activeRule.id, { name: e.target.value })} disabled={(activeRule as any).regraFixa} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 disabled:opacity-50" />
               </div>

               {(activeRule as any).regraFixa && (
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Descrição</label>
                    <textarea value={(activeRule as any).descricao} disabled className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-50" rows={2}></textarea>
                 </div>
               )}

               {/* Fluxo */}
               {!(activeRule as any).regraFixa ? (
                 <div className="relative pt-4 pb-8 pl-6 border-l-2 border-[var(--border)] ml-4 space-y-8">
                  
                  {/* Step 1 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-[var(--text-primary)] shadow-[0_0_10px_rgba(124,58,237,0.5)]">1</div>
                     <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-400" /> Evento Gatilho
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <input className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none" value={activeRule.checklistOrigin} onChange={(e) => updateRule(activeRule.id, { checklistOrigin: e.target.value })} />
                        <input className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none" value={activeRule.question} onChange={(e) => updateRule(activeRule.id, { question: e.target.value })} />
                     </div>
                     <div className="mt-3 flex items-center gap-3">
                        <span className="text-[13px] text-[var(--text-muted)]">Quando a resposta for exata a:</span>
                        <input className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none max-w-[120px]" value={activeRule.condition} onChange={(e) => updateRule(activeRule.id, { condition: e.target.value })} />
                     </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-red-500 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-[var(--text-primary)] shadow-[0_0_10px_rgba(239,68,68,0.5)]">2</div>
                     <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Risco Gerado
                     </h4>
                     <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-4 rounded-xl flex gap-6">
                        <div className="space-y-1">
                           <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Severidade</label>
                           <select value={activeRule.severity} onChange={e => updateRule(activeRule.id, { severity: e.target.value as any })} className="bg-transparent text-[var(--text-primary)] font-bold text-[13px] border-none focus:outline-none cursor-pointer text-red-400">
                              <option>Crítico</option>
                              <option>Alto</option>
                              <option>Médio</option>
                              <option>Baixo</option>
                           </select>
                        </div>
                        <div className="w-px bg-[var(--bg-active-group)]"></div>
                        <div className="space-y-1 flex-1">
                           <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Justificativa automática</label>
                           <input type="text" value={activeRule.justification} onChange={e => updateRule(activeRule.id, { justification: e.target.value })} className="w-full bg-transparent border-none text-[13px] text-[var(--text-secondary)] focus:outline-none" />
                        </div>
                     </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                     <div className="absolute w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center -left-[30px] top-1 text-[10px] font-bold text-[var(--text-primary)] shadow-[0_0_10px_rgba(249,115,22,0.5)]">3</div>
                     <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400" /> Ação Corretiva
                     </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold">Ação Padrão</label>
                           <input type="text" value={activeRule.autoAction} onChange={e => updateRule(activeRule.id, { autoAction: e.target.value })} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold">Atribuir para</label>
                           <input type="text" value={activeRule.assignTo} onChange={e => updateRule(activeRule.id, { assignTo: e.target.value })} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none" />
                        </div>
                     </div>
                  </div>

               </div>
               ) : (
                 <div className="flex flex-col gap-4 text-sm text-[var(--text-muted)]">
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
         <div className="w-full xl:w-[320px] shrink-0 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
             {/* decorative gradient */}
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
            
            <Monitor className="w-10 h-10 text-white/20 mb-4" />
            <h3 className="text-center font-bold text-[var(--text-primary)] text-[15px] mb-2 leading-tight">Como isso<br/>funciona na prática?</h3>
            <p className="text-center text-xs text-[var(--text-muted)] mb-6 px-4">Se um inspetor acionar esta regra no sistema, o motor instantaneamente criará:</p>
            
            <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3 relative z-10">
               <div className="flex items-center gap-2">
                  <span className="bg-red-500/10 text-red-500 px-1.5 py-0.5 text-[10px] font-bold rounded uppercase">{activeRule?.severity || (activeRule as any)?.severidadeBase || 'Médio'}</span>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Risco Registrado</p>
               </div>
               <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <p className="text-[11px] text-[var(--text-muted)]">Prazo Acionado: <strong className="text-[var(--text-primary)]">{activeRule?.deadline || `${(activeRule as any)?.prazoBase || 0} dias`}</strong></p>
               </div>
               <div className="flex items-center gap-2 ml-1">
                  <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <p className="text-[11px] text-[var(--text-muted)]">{activeRule?.assignTo || 'Colaborador responsável'} é notificado.</p>
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
         <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="mb-6">
               <h3 className="text-lg font-bold text-[var(--text-primary)]">Configuração de SLAs</h3>
               <p className="text-sm text-[var(--text-muted)]">Prazos de resolução e regras de escalonamento com base na severidade.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Risco Crítico (em Horas)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.criticoHoras} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, criticoHoras: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-red-500/30 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-400 uppercase tracking-wider">Risco Alto (em Horas)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.altoHoras} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, altoHoras: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-orange-500/30 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Risco Médio (em Dias)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.medioDias} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, medioDias: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-yellow-500" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Risco Baixo (em Dias)</label>
                  <input 
                     type="number" 
                     value={engineConfig.slas.baixoDias} 
                     onChange={(e) => updateEngineConfig({ slas: { ...engineConfig.slas, baixoDias: Number(e.target.value) }})}
                     className="w-full bg-[var(--bg-primary)] border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500" 
                  />
               </div>
            </div>
         </div>
      </div>
   )
}

function TabAlertas() {
   const { engineConfig, updateEngineConfig } = useAppStore();

   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="mb-6">
               <h3 className="text-lg font-bold text-[var(--text-primary)]">Central de Notificações</h3>
               <p className="text-sm text-[var(--text-muted)]">Gerencie a cadência e comportamento dos alertas gerados.</p>
            </div>
            
            <div className="space-y-5">
               <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl">
                  <div>
                     <p className="text-sm font-bold text-[var(--text-primary)]">Notificar Atrasos Imediatos</p>
                     <p className="text-xs text-[var(--text-muted)] mt-1">Disparar notificação assim que um SLA estourar.</p>
                  </div>
                  <div 
                     onClick={() => updateEngineConfig({ alertas: { ...engineConfig.alertas, notificarAtraso: !engineConfig.alertas.notificarAtraso }})}
                     className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${engineConfig.alertas.notificarAtraso ? 'bg-purple-600' : 'bg-[var(--bg-active-group)]'}`}
                  >
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${engineConfig.alertas.notificarAtraso ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Frequência do Resumo</label>
                  <select 
                     value={engineConfig.alertas.frequencia}
                     onChange={(e) => updateEngineConfig({ alertas: { ...engineConfig.alertas, frequencia: e.target.value as any }})}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 appearance-none"
                  >
                     <option value="Imediata">Imediata</option>
                     <option value="Diária">Diária</option>
                     <option value="Semanal">Semanal</option>
                  </select>
               </div>
            </div>
         </div>
      </div>
   )
}

function TabPerfil() {
   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         <div className="flex-1 space-y-6">
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
               <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Meu Perfil Corporativo</h3>
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" className="w-24 h-24 rounded-2xl object-cover bg-gray-800 shadow-xl" />
                     <button className="text-[11px] font-medium text-[var(--text-primary)] bg-[var(--bg-active-group)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-active-group)] transition-colors">
                        Alterar foto
                     </button>
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nome Completo</label>
                        <input type="text" defaultValue="Rafael Oliveira" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cargo / Setor</label>
                        <input type="text" readOnly defaultValue="Engenheiro de Segurança" className="w-full bg-transparent border-b border-[var(--border)] px-1 py-2.5 text-sm text-[var(--text-muted)] focus:outline-none select-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">E-mail de Login</label>
                        <input type="email" readOnly defaultValue="rafael@larion.com" className="w-full bg-transparent border-b border-[var(--border)] px-1 py-2.5 text-sm text-[var(--text-muted)] focus:outline-none select-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Telefone (Opcional)</label>
                        <input type="text" defaultValue="(11) 98765-4321" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500" />
                     </div>
                  </div>
               </div>
               <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
                  <button className="bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border border-[var(--border)]">
                     Salvar perfil
                  </button>
               </div>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-emerald-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Segurança da Conta</h3>
               </div>
               <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl">
                     <div>
                        <p className="text-[14px] font-bold text-[var(--text-primary)]">Senha de Acesso</p>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">Última alteração: há 45 dias.</p>
                     </div>
                     <button className="text-[12px] font-medium text-[var(--text-primary)] px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-active-group)] transition-colors flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5"/> Alterar
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl group relative overflow-hidden">
                     <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500"></div>
                     <div className="pl-3">
                        <div className="flex items-center gap-2">
                           <p className="text-[14px] font-bold text-[var(--text-primary)]">Autenticação 2FA</p>
                           <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Ativa</span>
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">Proteção por app autenticador ligada.</p>
                     </div>
                     <button className="text-[12px] font-medium text-[var(--text-muted)] px-4 py-2 hover:bg-[var(--bg-active-group)] rounded-lg transition-colors">
                        Gerenciar
                     </button>
                  </div>
               </div>
            </div>

         </div>

         <div className="w-full lg:w-[400px] h-fit bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-6">Preferências de Notificação</h3>
            <div className="space-y-5">
               {[
                  { t: 'Alertas Críticos', d: 'Riscos, não conformidades graves.', on: true },
                  { t: 'Ações Atrasadas', d: 'Lembretes de ações sob minha tutela.', on: true },
                  { t: 'Inspeções Pendentes', d: 'Quando serei auditor ou responsável.', on: false },
                  { t: 'Resumos Semanais', d: 'Insights por e-mail toda segunda-feira.', on: true },
               ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                     <div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">{item.t}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{item.d}</p>
                     </div>
                     <div className={`w-9 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${item.on ? 'bg-purple-600' : 'bg-[var(--bg-active-group)]'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.on ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
               ))}
            </div>
            <div className="mt-6 pt-5 border-t border-[var(--border)]">
                <button className="text-[12px] font-bold text-purple-400 uppercase tracking-wide hover:text-purple-300 w-full text-center transition-colors">
                  Gerenciar canais (E-mail/Apps)
               </button>
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
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden max-h-full">
         <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
               <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Horas Trabalhadas (HET)</h2>
               <p className="text-sm text-[var(--text-muted)]">Cadastre o tempo de exposição para cálculo correto de TFA e TG.</p>
            </div>
            <button 
               onClick={handleAdd} 
               className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
               <Plus className="w-4 h-4" /> Novo registro
            </button>
         </div>

         <div className="overflow-x-auto w-full flex-1">
            {work_hours.length === 0 ? (
               <div className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
                  <Activity className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
                  <h3 className="text-lg font-bold text-[var(--text-secondary)]">Nenhum registro de horas</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">Os cálculos de TFA e TG apresentarão aviso de &quot;dados insuficientes&quot; até que as horas sejam lançadas.</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                     <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Período</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Setor/Unidade</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Modo</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total de Horas</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Lançado em</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                     {work_hours.map((w) => {
                        const sectorName = sectors.find(s => s.id === w.sector_id)?.name || w.sector_id;
                        return (
                           <tr key={w.id} className="hover:bg-[var(--bg-active-group)] transition-colors group">
                              <td className="px-5 py-4">
                                 <span className="text-[13px] font-bold text-[var(--text-primary)] block">{w.period_start} a {w.period_end}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[13px] text-[var(--text-secondary)]">{sectorName}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    w.calculation_mode === 'Estimado' 
                                       ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                                       : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                 }`}>{w.calculation_mode}</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[14px] font-bold text-[var(--text-primary)]">{Number(w.total_hours).toLocaleString('pt-BR')}h</span>
                              </td>
                              <td className="px-5 py-4">
                                 <span className="text-[12px] text-[var(--text-muted)]">{new Date(w.created_at).toLocaleDateString('pt-BR')}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleEdit(w)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deleteWorkHours(w.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                     className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-full overflow-y-auto custom-scrollbar shadow-2xl relative"
                  >
                     <div className="p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--bg-secondary)] z-10">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{editingItem ? 'Editar Lançamento' : 'Novo Lançamento de Horas'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2">
                           <X className="w-5 h-5"/>
                        </button>
                     </div>

                     <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Período Incial</label>
                              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 max-h-[46px]" style={{ colorScheme: 'dark' }} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Período Final</label>
                              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 max-h-[46px]" style={{ colorScheme: 'dark' }}/>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Setor / Unidade</label>
                           <select value={sectorId} onChange={e => setSectorId(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 appearance-none">
                              <option value="">Selecione...</option>
                              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </div>

                        <div className="space-y-2 border-t border-[var(--border)] pt-6">
                           <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Modo de Cálculo</label>
                           <div className="flex gap-4">
                              <button 
                                 onClick={() => setCalculationMode('Manual')}
                                 className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${calculationMode === 'Manual' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                              >
                                 <FileText className="w-4 h-4"/> Valor Informado
                              </button>
                              <button 
                                 onClick={() => setCalculationMode('Estimado')}
                                 className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${calculationMode === 'Estimado' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                              >
                                 <Activity className="w-4 h-4"/> Estimado / CCT
                              </button>
                           </div>
                        </div>

                        {calculationMode === 'Manual' ? (
                           <div className="bg-[var(--bg-primary)]/50 p-5 rounded-xl border border-[var(--border)] space-y-4 shadow-inner">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider items-center flex gap-2"> <FileText className="w-4 h-4 text-emerald-400"/> Total de Horas Trabalhadas</label>
                                 <div className="relative">
                                    <input type="number" step="1" value={totalHoursManual} onChange={e => setTotalHoursManual(Number(e.target.value))} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">horas totais</span>
                                 </div>
                                 <p className="text-[11px] text-[var(--text-muted)] mt-2">Informe diretamente o total global do período (Extraia do sistema de ponto/RH).</p>
                              </div>
                           </div>
                        ) : (
                           <div className="bg-[var(--bg-primary)]/50 p-5 rounded-xl border border-[var(--border)] space-y-5 shadow-inner">
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-[var(--text-muted)] transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Total Colaboradores</label>
                                    <input type="number" value={employeeCount} onChange={e => setEmployeeCount(Number(e.target.value))} className="w-full bg-transparent border-b border-[var(--border)] focus:border-blue-500 text-[16px] font-bold text-[var(--text-primary)] py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-[var(--text-muted)] transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Horas/Dia (Média)</label>
                                    <input type="number" value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="w-full bg-transparent border-b border-[var(--border)] focus:border-blue-500 text-[16px] font-bold text-[var(--text-primary)] py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-blue-400 text-[var(--text-muted)] transition-colors">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">Dias Trabalhados</label>
                                    <input type="number" value={workDays} onChange={e => setWorkDays(Number(e.target.value))} className="w-full bg-transparent border-b border-[var(--border)] focus:border-blue-500 text-[16px] font-bold text-[var(--text-primary)] py-1 outline-none transition-colors" />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5 focus-within:text-green-400 text-[var(--text-muted)] transition-colors border-l-2 border-emerald-500/50 pl-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">+ Horas Extras Totais</label>
                                    <input type="number" value={overtimeHours} onChange={e => setOvertimeHours(Number(e.target.value))} className="w-full bg-transparent border-b border-[var(--border)] focus:border-green-500 text-[16px] font-bold text-[var(--text-primary)] py-1 outline-none transition-colors" />
                                 </div>
                                 <div className="space-y-1.5 focus-within:text-red-400 text-[var(--text-muted)] transition-colors border-l-2 border-red-500/50 pl-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wider block">- Ausência (Absenteísmo)</label>
                                    <input type="number" value={absenceHours} onChange={e => setAbsenceHours(Number(e.target.value))} className="w-full bg-transparent border-b border-[var(--border)] focus:border-red-500 text-[16px] font-bold text-[var(--text-primary)] py-1 outline-none transition-colors" />
                                 </div>
                              </div>
                              <div className="pt-4 mt-2 border-t border-[var(--border)] flex items-center justify-between">
                                 <span className="text-sm font-bold text-[var(--text-muted)]">Total HET Calculado:</span>
                                 <span className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    {((employeeCount * hoursPerDay * workDays) + overtimeHours - absenceHours).toLocaleString('pt-BR')}h
                                 </span>
                              </div>
                           </div>
                        )}
                        
                     </div>

                     <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-primary)] rounded-b-2xl flex justify-end gap-3 sticky bottom-0 z-10 w-full">
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-purple-500/20">
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
