"use client";

import React, { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, Bell, Search, Calendar, ChevronDown, Clock, Info, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { alertas = [], rulePackages = [] } = useAppStore();
  const runEngine = useAppStore(state => state.runEngine);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Motor central: roda na montagem e a cada 60s para manter abas (Riscos,
  // Ações, Inspeções, Alertas) sincronizadas e os SLAs atualizados.
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof runEngine !== 'function') return;
    runEngine();
    const ticker = setInterval(() => runEngine(), 60 * 1000);
    return () => clearInterval(ticker);
  }, [runEngine]);

  // Quando pacotes de regras mudam, o motor reavalia o que é aplicável
  React.useEffect(() => {
    if (typeof runEngine === 'function') runEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulePackages.map(p => `${p.id}:${p.isActive}`).join('|')]);

  const activePackageNames = useMemo(() => 
    rulePackages.filter(p => p.isActive).map(p => p.name), 
  [rulePackages]);

  const filteredAlerts = useMemo(() => 
    alertas.filter(a => 
      a.status === 'Ativo' && 
      (!a.package || a.package === 'Base SST' || activePackageNames.includes(a.package))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [alertas, activePackageNames]);

  const activeAlertsCount = filteredAlerts.length;

  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden">
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] relative shrink-0">
             <Image 
               src="/logo.jpg" 
               alt="ApexShield Logo" 
               width={32} 
               height={32} 
               className="object-cover w-full h-full relative z-10 opacity-0" 
             />
             <div className="absolute inset-0 flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
             </div>
          </div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">ApexShield</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-gray-400 hover:text-white relative"
          >
            <Bell className="w-5 h-5" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full border border-[#0b0f19]" />
            )}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white focus:outline-none"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-[60] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Desktop Top Header & Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex h-16 border-b border-white/5 bg-[#0b0f19]/50 backdrop-blur-md items-center justify-between px-8 shrink-0 z-50">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-medium text-gray-400">
               {pathname === '/' ? 'Portal de Gestão SST' : pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[12px] text-gray-400">
               <Calendar className="w-3.5 h-3.5 text-purple-400" />
               <span>{mounted ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()) : ''}</span>
            </div>

            <div className="h-4 w-px bg-white/10 mx-2" />

            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl transition-all relative ${isNotifOpen ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Bell className="w-5 h-5" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-[#0b0f19]" />
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-[70]" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[80] animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Notificações</h3>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        {activeAlertsCount} novas
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                      {filteredAlerts.length > 0 ? (
                        filteredAlerts.map((alerta) => (
                          <Link 
                            key={alerta.id}
                            href={alerta.link || '/notificacoes'}
                            onClick={() => setIsNotifOpen(false)}
                            className="p-4 flex gap-3 hover:bg-white/5 transition-colors border-b border-white/5 group"
                          >
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                              alerta.severity === 'Crítico' ? 'bg-red-500/10 text-red-500' :
                              alerta.severity === 'Alto' ? 'bg-orange-500/10 text-orange-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {alerta.severity === 'Crítico' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors truncate">{alerta.title}</p>
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{alerta.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3 text-gray-600" />
                                <span className="text-[10px] text-gray-600">{new Date(alerta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-gray-700" />
                          </div>
                          <p className="text-xs text-gray-500">Nenhuma notificação no momento</p>
                        </div>
                      )}
                    </div>
                    <Link 
                      href="/notificacoes" 
                      onClick={() => setIsNotifOpen(false)}
                      className="block p-3 text-center text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
                    >
                      Ver todas notificações
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-16 lg:pt-0 print:pt-0">
          <div className="flex-1 w-full flex flex-col h-full overflow-hidden pt-6 lg:pt-0 print:pt-0 print:overflow-visible overflow-y-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Notification Dropdown Overlay */}
      {isNotifOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-[#0b0f19] flex flex-col animate-in fade-in slide-in-from-right duration-300">
           <div className="h-16 border-b border-white/5 flex items-center justify-between px-4">
              <h1 className="text-lg font-bold text-white">Notificações</h1>
              <button onClick={() => setIsNotifOpen(false)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map(alerta => (
                  <Link 
                    key={alerta.id}
                    href={alerta.link || '/notificacoes'}
                    onClick={() => setIsNotifOpen(false)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5"
                  >
                     <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          alerta.severity === 'Crítico' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>{alerta.severity}</span>
                        <span className="text-[10px] text-gray-500">{new Date(alerta.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h3 className="text-sm font-bold text-white">{alerta.title}</h3>
                     <p className="text-xs text-gray-400 mt-1">{alerta.description}</p>
                  </Link>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center">
                   <Bell className="w-12 h-12 text-gray-800 mb-4" />
                   <p className="text-gray-500">Tudo limpo por aqui</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
