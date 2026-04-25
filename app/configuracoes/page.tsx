"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';
import Image from 'next/image';

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Configurações</h1>
          <p className="text-sm text-gray-400 mt-1">Ajuste as preferências do sistema e do seu perfil.</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          {[
            { label: 'Perfil', icon: User, active: true },
            { label: 'Notificações', icon: Bell, active: false },
            { label: 'Segurança', icon: Shield, active: false },
            { label: 'Gerenciamento de Dados', icon: Database, active: false },
            { label: 'Preferências do Sistema', icon: Settings, active: false },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl flex flex-col items-start min-h-[500px]">
          <h2 className="text-lg font-bold text-white mb-6">Informações do Perfil</h2>
          <div className="flex items-center gap-6 mb-8 w-full border-b border-white/5 pb-8">
            <div className="w-20 h-20 bg-gray-800 rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden">
               <Image src="https://picsum.photos/seed/rafael/80/80" alt="Rafael" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div>
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2">
                Alterar Foto
              </button>
              <p className="text-xs text-gray-500">JPG, GIF ou PNG. Tamanho máximo 800K.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</label>
               <input type="text" defaultValue="Rafael Oliveira" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
               <input type="email" defaultValue="rafael@larionsst.com.br" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cargo</label>
               <input type="text" defaultValue="Engenheiro de Segurança" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Empresa</label>
               <input type="text" defaultValue="Larion SST Inteligência" disabled className="w-full bg-black/10 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 w-full flex justify-end gap-3">
             <button className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
               Descartar
             </button>
             <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg">
               Salvar Alterações
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
