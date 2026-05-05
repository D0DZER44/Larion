"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, HardHat, Brain, BarChart3, Settings, Building2, Bell, HelpCircle, 
  Sparkles, ShieldCheck, ChevronRight, Moon, Sun, LogOut, ChevronDown, 
  ClipboardCheck, AlertTriangle, Activity, User, Zap
} from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';

const navGroups = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutGrid },
      { 
        name: 'Operação', 
        href: '#', 
        icon: ShieldCheck,
        subItems: [
          { name: 'Inspeções', href: '/operacao/inspecoes', icon: HardHat },
          { name: 'Riscos', href: '/operacao/riscos', icon: AlertTriangle },
          { name: 'Ações', href: '/operacao/acoes', icon: Activity },
          { name: 'Matriz Normativa', href: '/operacao/matriz', icon: ClipboardCheck },
        ]
      },
      { 
        name: 'Inteligência', 
        href: '#', 
        icon: Brain,
        subItems: [
          { name: 'Visão Geral (Central)', href: '/central', icon: BarChart3 },
          { name: 'Motor Normativo', href: '/central/motor', icon: Zap },
        ]
      },
      { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
    ]
  },
  {
    items: [
      { name: 'Organização', href: '/organizacao', icon: Building2 },
      { name: 'Configurações', href: '/configuracoes', icon: Settings },
    ]
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { rulePackages = [] } = useAppStore();
  const [isDark, setIsDark] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Operação': pathname.startsWith('/operacao'),
    'Inteligência': pathname.startsWith('/central')
  });

  useEffect(() => {
    if (pathname.startsWith('/operacao') && !expanded['Operação']) {
      const timer = setTimeout(() => {
        setExpanded(prev => {
          if (!prev['Operação']) {
            return { ...prev, 'Operação': true };
          }
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
    if (pathname.startsWith('/central') && !expanded['Inteligência']) {
      const timer = setTimeout(() => {
        setExpanded(prev => {
          if (!prev['Inteligência']) {
            return { ...prev, 'Inteligência': true };
          }
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, expanded]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
    }
  }, [isDark]);

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col h-screen bg-[#0B0814] border-r border-white/5 top-0 sticky print:hidden overflow-hidden">
      {/* Logo Area */}
      <div className="p-6 mb-2 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] shadow-lg shadow-purple-500/20 relative group shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-white text-lg tracking-tight leading-none">ApexShield</h1>
            <p className="text-[10px] text-[#71717A] uppercase tracking-[0.2em] font-bold mt-1">SST INTELIGENTE</p>
          </div>
        </Link>
      </div>

      {/* Workspace Selector */}
      <div className="mx-4 mb-6 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] text-[#71717A] font-medium leading-none mb-1">Organização ativa</p>
            <p className="text-sm font-semibold text-[#F4F4F5] truncate">ApexShield Corp</p>
          </div>
          <ChevronDown className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-6 pb-6 overflow-hidden">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.items.map((item) => {
              const itemAny = item as any;
              const isExpanded = expanded[item.name];
              const hasSubItems = !!itemAny.subItems;
              const isActive = pathname === item.href || (hasSubItems && (
                (pathname.startsWith('/operacao') && item.name === 'Operação') ||
                (pathname.startsWith('/central') && item.name === 'Inteligência')
              ));
              
              return (
                <div key={item.name} className="flex flex-col relative">
                  <Link
                    href={hasSubItems ? '#' : item.href}
                    prefetch={true}
                    onClick={(e) => {
                      if (hasSubItems) {
                        e.preventDefault();
                        setExpanded(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                      } else {
                        if (onClose) onClose();
                      }
                    }}
                    className={`group flex items-center justify-between px-4 py-3 rounded-xl text-[14px] transition-all duration-200 relative ${
                      isActive 
                        ? 'text-[#F4F4F5] font-semibold border border-[#A78BFA]/30 shadow-[0_0_20px_rgba(124,58,237,0.15)] bg-gradient-to-br from-[#7C3AED]/25 to-[#7C3AED]/10' 
                        : 'text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/5'
                    }`}
                    style={isActive ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' } : {}}
                  >
                    <div className="flex items-center gap-3 w-full relative z-10">
                      <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[#A78BFA]' : 'text-[#71717A] group-hover:text-[#F4F4F5]'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {hasSubItems ? (
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 z-10 ${isExpanded ? 'rotate-90 text-white' : 'text-[#71717A]'}`} />
                    ) : isActive && (
                      <ChevronRight className="w-4 h-4 text-white/40 z-10" />
                    )}
                  </Link>
                  
                  {hasSubItems && isExpanded && (
                    <div className="mt-1 flex flex-col">
                      {itemAny.subItems.map((sub: any) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-11 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 relative group ${
                              isSubActive 
                                ? 'text-white' 
                                : 'text-[#71717A] hover:text-[#F4F4F5]'
                            }`}
                          >
                             {isSubActive && (
                               <div className="absolute left-0 w-[2px] h-4 bg-[#7C3AED] rounded-full" />
                             )}
                             {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Area: Navigation & User Profile */}
      <div className="p-4 bg-[#0B0814] border-t border-white/5 flex flex-col gap-2 shrink-0">
        {/* Promotion Card: Lari Copiloto SST */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#4C1D95]/10 border border-[#A78BFA]/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-12 h-12 text-[#A78BFA]" />
          </div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
             <div className="w-6 h-6 rounded bg-[#A78BFA]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
             </div>
             <span className="text-[14px] font-bold text-white">Lari Copiloto SST</span>
             <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-black">NOVO</span>
          </div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-4 relative z-10">
            Sua copiloto de IA em SST. Tire dúvidas sobre NRs, gere documentos e receba orientações em tempo real.
          </p>
          <Link 
            href="/chat"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-white text-[12px] font-bold transition-all relative z-10 active:scale-95"
          >
            Conversar com a Lari →
          </Link>
        </div>

        {/* Minha conta */}
        <Link 
          href="/perfil" 
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/5 transition-all group"
        >
          <User className="w-4 h-4 group-hover:text-[#A78BFA] transition-colors" />
          <span className="font-medium">Minha conta</span>
        </Link>
        
        {/* Utilities Row: Ajuda | Tema | Sair */}
        <div className="flex items-center justify-between gap-1 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
          <Link 
            href="/ajuda" 
            className="flex items-center gap-2 text-[12px] text-[#71717A] hover:text-[#F4F4F5] transition-all group"
            title="Ajuda"
          >
            <HelpCircle className="w-4 h-4 group-hover:text-[#A78BFA] transition-colors" />
            <span className="font-medium hidden xl:block">Ajuda</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#12121A] rounded-lg p-0.5 border border-white/10">
              <button 
                onClick={() => setIsDark(true)}
                className={`p-1 rounded-md transition-all ${isDark ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-[#71717A] hover:text-[#F4F4F5]'}`}
                title="Tema Escuro"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsDark(false)}
                className={`p-1 rounded-md transition-all ${!isDark ? 'bg-white text-[#0B0814]' : 'text-[#71717A] hover:text-[#F4F4F5]'}`}
                title="Tema Claro"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button 
            className="flex items-center gap-2 text-[12px] text-red-500/80 hover:text-red-400 transition-all group"
            onClick={() => {}}
            title="Sair"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-semibold hidden xl:block">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

