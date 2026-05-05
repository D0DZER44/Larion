"use client";

import React from 'react';
import { Shield, Lock } from 'lucide-react';

export function ProfileTab() {
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
  );
}
