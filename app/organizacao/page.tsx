"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { 
  Building2, Users, User, Shield, Lock, CreditCard, 
  Layers, Settings, Share2, MapPin, Phone, Mail, 
  Edit2, Trash2, Plus, GripVertical, Search, Bell,
  CheckCircle2, ChevronRight, Activity, Map
} from 'lucide-react';
import Image from 'next/image';

const TABS = [
  { id: 'visao', label: 'Visão Geral', icon: <Activity className="w-4 h-4" /> },
  { id: 'empresa', label: 'Dados da Empresa', icon: <Building2 className="w-4 h-4" /> },
  { id: 'usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
  { id: 'setores', label: 'Setores', icon: <Map className="w-4 h-4" /> },
  { id: 'permissoes', label: 'Permissões', icon: <Lock className="w-4 h-4" /> },
  { id: 'plano', label: 'Plano', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'integracoes', label: 'Integrações', icon: <Share2 className="w-4 h-4" /> },
  { id: 'perfil', label: 'Perfil', icon: <User className="w-4 h-4" /> },
];

export default function OrganizacaoPage() {
  const [activeTab, setActiveTab] = useState('visao');

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-white font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden relative z-10">
          
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Organização</h1>
              <p className="text-sm text-gray-400 mt-1">Gerencie as informações da sua empresa, equipe e conta.</p>
            </div>
            <div>
               <button className="relative p-2 bg-[#121826] hover:bg-white/5 text-gray-300 rounded-lg transition-colors border border-white/10">
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
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
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
                 {activeTab === 'visao' && <TabVisaoGeral />}
                 {activeTab === 'empresa' && <TabDadosEmpresa />}
                 {activeTab === 'usuarios' && <TabUsuarios />}
                 {activeTab === 'setores' && <TabSetores />}
                 {activeTab === 'permissoes' && <TabPlaceholder title="Permissões" description="Gerencie os níveis de acesso e papéis dos usuários." />}
                 {activeTab === 'plano' && <TabPlaceholder title="Plano" description="Gerencie sua assinatura, faturamento e limites de uso." />}
                 {activeTab === 'integracoes' && <TabPlaceholder title="Integrações" description="Conecte o ApexShield com outras ferramentas e APIs." />}
                 {activeTab === 'perfil' && <TabPerfil />}
               </motion.div>
             </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}

function TabVisaoGeral() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-[15px] font-bold text-white">Status da Organização</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Nome da empresa</span>
              <span className="text-sm font-bold text-white">Larion Indústria Ltda.</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Plano atual</span>
              <span className="text-sm font-bold text-purple-400 px-2 py-0.5 bg-purple-500/10 rounded-full text-xs">Enterprise</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-[15px] font-bold text-white">Resumo de Equipe</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Usuários ativos</span>
              <span className="text-sm font-bold text-white">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Setores cadastrados</span>
              <span className="text-sm font-bold text-white">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Integrações ativas</span>
              <span className="text-sm font-bold text-white">6</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[15px] font-bold text-white">Segurança e Acesso</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Autenticação de dois fatores e políticas de acesso ativas para toda a organização.</p>
          <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-colors">
            Ver logs de auditoria
          </button>
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-[15px] font-bold text-white">Informações Principais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
             <span className="text-[10px] text-gray-500 uppercase font-black">Segmento</span>
             <p className="text-sm text-white">Indústria</p>
          </div>
          <div className="space-y-1">
             <span className="text-[10px] text-gray-500 uppercase font-black">CNPJ</span>
             <p className="text-sm text-white">12.345.678/0001-90</p>
          </div>
          <div className="space-y-1">
             <span className="text-[10px] text-gray-500 uppercase font-black">Telefone</span>
             <p className="text-sm text-white">(11) 3456-7890</p>
          </div>
          <div className="space-y-1">
             <span className="text-[10px] text-gray-500 uppercase font-black">E-mail</span>
             <p className="text-sm text-white">contato@larion.com.br</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabDadosEmpresa() {
   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         <div className="flex-1 space-y-6">
            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Dados da Empresa</h3>
                  <p className="text-sm text-gray-400">Informações principais que aparecem em laudos e cabeçalhos.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Razão Social</label>
                     <input type="text" defaultValue="Larion Indústria Ltda." className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">CNPJ</label>
                     <input type="text" defaultValue="12.345.678/0001-90" className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Telefone</label>
                     <input type="text" defaultValue="(11) 3456-7890" className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail Corporativo</label>
                     <input type="email" defaultValue="contato@larion.com.br" className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço Completo</label>
                     <input type="text" defaultValue="Rua das Indústrias, 123, Galpão A - São Paulo/SP" className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-white/5">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                     Salvar dados
                  </button>
               </div>
            </div>

            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <div className="mb-6 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-white">Preferências Locais</h3>
                     <p className="text-sm text-gray-400">Padrões regionais da planta.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fuso Horário</label>
                     <select className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                        <option>Brasília (UTC-3)</option>
                        <option>Manaus (UTC-4)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Idioma</label>
                     <select className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                        <option>Português (BR)</option>
                        <option>English</option>
                        <option>Español</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-full lg:w-[400px] space-y-6">
            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <h3 className="text-[15px] font-bold text-white mb-4">Logo da Empresa</h3>
               <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-purple-500/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-[#0b0f19] border border-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <Building2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <button className="text-sm font-medium text-white bg-white/5 px-4 py-2 rounded-lg border border-white/10 mb-2">Alterar logo</button>
                  <p className="text-[11px] text-gray-500 leading-relaxed">PNG ou JPG. Máx 2MB.<br/>Recomendado: 512x512</p>
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
      <div className="bg-[#121826] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
         <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
               <input 
                  type="text" 
                  placeholder="Buscar usuários..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" 
               />
            </div>
            <button onClick={handleAdd} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> Novo usuário
            </button>
         </div>

         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead className="bg-[#0b0f19] border-b border-white/5">
                  <tr>
                     <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">E-mail</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                     <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`} alt={u.name} className="w-8 h-8 rounded-full bg-gray-800" />
                              <input 
                                 className="bg-transparent border-none text-[13px] font-bold text-gray-200 focus:outline-none focus:border-b-2 focus:border-purple-500"
                                 value={u.name}
                                 onChange={(e) => updateUser(u.id, { name: e.target.value })}
                              />
                           </div>
                        </td>
                        <td className="px-5 py-4">
                           <input 
                              className="bg-transparent border-none text-[13px] text-gray-400 focus:outline-none focus:border-b-2 focus:border-purple-500"
                              value={u.role}
                              onChange={(e) => updateUser(u.id, { role: e.target.value })}
                           />
                        </td>
                        <td className="px-5 py-4">
                           <input 
                              className="bg-transparent border-none text-[13px] text-gray-400 focus:outline-none focus:border-b-2 focus:border-purple-500"
                              value={u.email}
                              onChange={(e) => updateUser(u.id, { email: e.target.value })}
                           />
                        </td>
                        <td className="px-5 py-4">
                           <button 
                              onClick={() => updateUser(u.id, { status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' })}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              u.status === 'Ativo' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-400 bg-white/5 border-white/10'
                           }`}>{u.status}</button>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors">
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

function TabSetores() {
   const { sectors, addSector, updateSector, deleteSector } = useAppStore();

   const handleAddSector = () => {
      addSector({ name: 'Novo Setor' });
   };

   return (
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col min-h-[500px]">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="text-lg font-bold text-white">Gestão de Setores</h3>
               <p className="text-sm text-gray-400">Organize os departamentos e unidades da sua empresa.</p>
            </div>
            <button onClick={handleAddSector} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
               <Plus className="w-4 h-4" /> Novo Setor
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2">
            {sectors.map((setor) => (
               <div key={setor.id} className="flex items-center gap-3 p-4 bg-[#0b0f19] border border-white/5 rounded-xl group hover:border-[#A78BFA]/30 transition-all cursor-move">
                  <GripVertical className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  <input 
                     value={setor.name} 
                     onChange={(e) => updateSector(setor.id, e.target.value)}
                     className="bg-transparent border-none text-sm font-bold text-gray-200 flex-1 focus:outline-none focus:border-b border-purple-500" 
                  />
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => deleteSector(setor.id)} className="text-red-500/70 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

function TabPerfil() {
   return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
         <div className="flex-1 space-y-6">
            
            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
               <h3 className="text-lg font-bold text-white mb-6">Meu Perfil Corporativo</h3>
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" className="w-24 h-24 rounded-2xl object-cover bg-gray-800 shadow-xl" />
                     <button className="text-[11px] font-medium text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                        Alterar foto
                     </button>
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                        <input type="text" defaultValue="Rafael Oliveira" className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cargo / Setor</label>
                        <input type="text" readOnly defaultValue="Engenheiro de Segurança" className="w-full bg-transparent border-b border-white/5 px-1 py-2.5 text-sm text-gray-400 focus:outline-none select-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">E-mail de Login</label>
                        <input type="email" readOnly defaultValue="rafael@larion.com" className="w-full bg-transparent border-b border-white/5 px-1 py-2.5 text-sm text-gray-400 focus:outline-none select-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Telefone (Opcional)</label>
                        <input type="text" defaultValue="(11) 98765-4321" className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                     </div>
                  </div>
               </div>
               <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                  <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border border-white/10">
                     Salvar perfil
                  </button>
               </div>
            </div>

            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-emerald-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-white">Segurança da Conta</h3>
               </div>
               <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[#0b0f19] border border-white/5 rounded-xl">
                     <div>
                        <p className="text-[14px] font-bold text-white">Senha de Acesso</p>
                        <p className="text-[12px] text-gray-400 mt-1">Última alteração: há 45 dias.</p>
                     </div>
                     <button className="text-[12px] font-medium text-white px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5"/> Alterar
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#0b0f19] border border-white/5 rounded-xl group relative overflow-hidden">
                     <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500"></div>
                     <div className="pl-3">
                        <div className="flex items-center gap-2">
                           <p className="text-[14px] font-bold text-white">Autenticação 2FA</p>
                           <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Ativa</span>
                        </div>
                        <p className="text-[12px] text-gray-400 mt-1">Proteção por app autenticador ligada.</p>
                     </div>
                     <button className="text-[12px] font-medium text-gray-400 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                        Gerenciar
                     </button>
                  </div>
               </div>
            </div>

         </div>

         <div className="w-full lg:w-[400px] h-fit bg-[#121826] border border-white/5 rounded-2xl p-6">
            <h3 className="text-[15px] font-bold text-white mb-6">Preferências de Notificação</h3>
            <div className="space-y-5">
               {[
                  { t: 'Alertas Críticos', d: 'Riscos, não conformidades graves.', on: true },
                  { t: 'Ações Atrasadas', d: 'Lembretes de ações sob minha tutela.', on: true },
                  { t: 'Inspeções Pendentes', d: 'Quando serei auditor ou responsável.', on: false },
                  { t: 'Resumos Semanais', d: 'Insights por e-mail toda segunda-feira.', on: true },
               ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                     <div>
                        <p className="text-[13px] font-bold text-gray-200">{item.t}</p>
                        <p className="text-[11px] text-gray-500">{item.d}</p>
                     </div>
                     <div className={`w-9 h-5 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors ${item.on ? 'bg-purple-600' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.on ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   )
}

function TabPlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-[#121826] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        <Settings className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-sm mx-auto">{description}</p>
    </div>
  )
}
