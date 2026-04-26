"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, ShieldAlert, ClipboardCheck, Activity, AlertTriangle, 
  BookOpen, FileText, BarChart2, Settings, MessageSquare, 
  LogOut, Moon, Sun, Users, Wrench, Shield, CheckSquare
} from 'lucide-react';
import Image from 'next/image';

const navGroups = [
  {
    items: [
      { name: 'Visão Geral', href: '/', icon: Home },
      { name: 'Riscos', href: '/riscos', icon: AlertTriangle },
      { name: 'Inspeções', href: '/inspecoes', icon: ClipboardCheck },
    ]
  },
  {
    items: [
      { name: 'Ações', href: '/acoes', icon: Activity, badge: 12 },
    ]
  },
  {
    items: [
      { name: 'Relatórios', href: '/relatorios', icon: FileText },
      { name: 'Central de Inteligência', href: '/central', icon: BarChart2, color: 'text-purple-400' },
      { name: 'L.A.R.I — Copiloto SST', href: '/chat', icon: MessageSquare, badge: 'Novo', color: 'text-purple-400' },
      { name: 'Configurações', href: '/configuracoes', icon: Settings },
    ]
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
    }
  }, [isDark]);

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-screen bg-[#0b0f19] border-r border-white/5 top-0 sticky print:hidden">
      {/* Logo Area */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-[#121826] to-[#1e1a30] border border-blue-500/30 overflow-hidden relative group shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="ApexShield Logo" 
              width={32} 
              height={32} 
              className="object-cover w-full h-full relative z-10" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
            <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-[#121826] z-0">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-blue-400">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
               </svg>
            </div>
            <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
          </div>
          <div>
            <h1 className="font-bold text-white text-xl tracking-tight leading-tight">ApexShield</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">SST Inteligência</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        {navGroups.flatMap(g => g.items as any[]).map((item) => {
          const itemAny = item as any;
          const isActive = pathname === item.href || itemAny.isActive;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-purple-500/10 text-purple-400 font-bold border border-purple-500/10' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <item.icon className="w-[18px] h-[18px] shrink-0" style={{ color: isActive ? '#c084fc' : (itemAny.color ? 'var(--tw-colors-purple-400)' : 'currentColor') }} />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {itemAny.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                    typeof itemAny.badge === 'string' 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                      : 'bg-white/5 text-gray-300 border-white/10'
                  }`}>
                    {itemAny.badge}
                  </span>
                )}
                {itemAny.hasSubmenu && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 ${isActive ? 'rotate-90 text-purple-400' : 'text-gray-600'}`}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#121826]/30 pb-12"> {/* Added padding to push content up and avoid dev indicator */}
        <div className="flex items-center gap-3 mb-4 px-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
          <Image
            src="https://picsum.photos/seed/rafael/40/40"
            alt="Rafael Oliveira"
            width={36}
            height={36}
            className="rounded-full bg-gray-800 border bg-[#121826]"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Rafael Oliveira</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 truncate font-medium">Administrador</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-500">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div className="flex items-center gap-2 px-2">
           <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 px-2 py-1.5 rounded-md transition-colors flex-1 -ml-2">
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
          
          <div className="flex items-center bg-[#0b0f19] rounded-full p-0.5 border border-white/10 shadow-sm shrink-0">
            <button 
              onClick={() => setIsDark(true)}
              className={`p-1.5 rounded-full transition-all ${isDark ? 'bg-[#1e1a30] text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsDark(false)}
              className={`p-1.5 rounded-full transition-all ${!isDark ? 'bg-white text-gray-900 shadow border border-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

