"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ClipboardCheck, Activity, AlertTriangle, 
  Settings, LogOut, ChevronRight, ChevronDown,
  LayoutGrid, HardHat, Brain, BarChart3, Bell, HelpCircle, 
  ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './ThemeToggle';

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  badge?: string | number;
  color?: string;
  isGroup?: boolean;
  children?: NavItem[];
};

const navGroups: { items: NavItem[] }[] = [
  {
    items: [
      { name: 'Visão Geral', href: '/', icon: LayoutGrid },
      { 
        name: 'Operação',
        href: '/operacao/inspecoes', 
        icon: HardHat,
        isGroup: true,
        children: [
          { name: 'Inspeções', href: '/operacao/inspecoes', icon: ClipboardCheck },
          { name: 'Riscos', href: '/operacao/riscos', icon: AlertTriangle },
          { name: 'Ações', href: '/operacao/acoes', icon: Activity, badge: 12 },
        ]
      }
    ]
  },
  {
    items: [
      { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { name: 'Central de Inteligência', href: '/central', icon: Brain },
      { name: 'Notificações', href: '/notificacoes', icon: Bell },
      { name: 'Configurações', href: '/configuracoes', icon: Settings },
      { name: 'Ajuda', href: '/ajuda', icon: HelpCircle },
    ]
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [operacaoOpen, setOperacaoOpen] = useState(pathname.startsWith('/operacao'));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/operacao')) {
      const timer = setTimeout(() => setOperacaoOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const toggleOperacao = (e: React.MouseEvent) => {
    e.preventDefault();
    setOperacaoOpen(!operacaoOpen);
    if (!pathname.startsWith('/operacao')) {
      router.push('/operacao/inspecoes');
      if (onClose) onClose();
    }
  };

  const isDark = mounted ? resolvedTheme !== 'light' : true;

  // Colors matching logic
  const bgSidebar = isDark ? '#0B0814' : '#FFFFFF';
  const borderRight = isDark ? 'border-[var(--border)]' : 'border-black/5';

  return (
    <aside className={`w-[260px] flex-shrink-0 flex flex-col h-screen ${borderRight} border-r top-0 sticky print:hidden`} style={{ backgroundColor: bgSidebar, transition: 'background-color 300ms ease' }}>
      {/* Logo Area & Workspace */}
      <div className="p-6 pb-4 flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}>
            <ShieldCheck className="w-5 h-5 text-[var(--text-primary)]" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-tight" style={{ color: isDark ? '#FFFFFF' : '#18181B' }}>ApexShield</h1>
            <p className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">SST INTELIGENTE</p>
          </div>
        </Link>


        {/* Workspace Dropdown */}
        <div className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[var(--bg-active-group)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#A78BFA]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#71717A] font-medium leading-none mb-1">Workspace</p>
              <p className="text-sm font-semibold leading-none" style={{ color: isDark ? '#F4F4F5' : '#18181B' }}>ApexShield Corp</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#71717A]" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        {navGroups.flatMap(g => g.items as NavItem[]).map((item) => {
          if (item.isGroup && item.children) {
            const isGroupActive = pathname.startsWith('/operacao');
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={toggleOperacao}
                  className={`w-full flex items-center justify-between transition-all duration-200 ${
                    isGroupActive 
                      ? 'px-4 py-3 font-semibold' 
                      : 'px-4 py-3 text-[#71717A] rounded-xl hover:bg-[var(--bg-active-group)] hover:text-[var(--accent)]'
                  }`}
                  style={isGroupActive ? {
                    color: isDark ? '#F4F4F5' : '#7C3AED',
                    background: isDark ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.10))' : 'rgba(124,58,237,0.10)',
                    border: isDark ? '1px solid rgba(167,139,250,0.30)' : '1px solid rgba(124,58,237,0.4)',
                    borderRadius: '12px',
                    boxShadow: isDark ? '0 0 20px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none'
                  } : {}}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 shrink-0" style={{ color: isGroupActive ? (isDark ? '#A78BFA' : '#7C3AED') : 'currentColor' }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${operacaoOpen ? 'rotate-90' : ''}`} style={{ color: isDark ? '#A78BFA' : '#7C3AED' }} />
                </button>
                {operacaoOpen && (
                  <div className="pl-5 space-y-1 pt-1">
                    {item.children.map(child => {
                      const isChildActive = pathname.startsWith(child.href!);
                      return (
                        <Link
                          key={child.name}
                          href={child.href!}
                          prefetch={true}
                          onClick={onClose}
                          className={`flex items-center justify-between py-2 pl-4 pr-3 text-[12px] font-medium transition-all duration-200 relative rounded-lg ${
                            isChildActive 
                              ? 'font-semibold' 
                              : 'text-[#71717A] hover:bg-[var(--bg-active-group)] hover:text-[var(--accent)]'
                          }`}
                          style={isChildActive ? { color: isDark ? '#F4F4F5' : '#7C3AED' } : {}}
                        >
                          {isChildActive && (
                            <div className="absolute left-1 top-1 bottom-1 w-[3px] bg-[#7C3AED] rounded-r-md"></div>
                          )}
                          <div className="flex items-center gap-3">
                            <child.icon className={`w-4 h-4 shrink-0`} style={{ color: isChildActive ? (isDark ? '#A78BFA' : '#7C3AED') : 'inherit' }} />
                            <span className="truncate">{child.name}</span>
                          </div>
                          {child.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)', color: isDark ? '#A78BFA' : '#7C3AED', border: isDark ? '1px solid rgba(167,139,250,0.20)' : 'none' }}>
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href!}
              prefetch={true}
              onClick={onClose}
              className={`flex items-center justify-between transition-all duration-200 ${
                isActive 
                  ? 'px-4 py-3 font-semibold' 
                  : 'px-4 py-3 text-[#71717A] rounded-xl hover:bg-[var(--bg-active-group)] hover:text-[var(--accent)]'
              }`}
              style={isActive ? {
                color: isDark ? '#F4F4F5' : '#7C3AED',
                background: isDark ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.10))' : 'rgba(124,58,237,0.10)',
                border: isDark ? '1px solid rgba(167,139,250,0.30)' : '1px solid rgba(124,58,237,0.4)',
                borderRadius: '12px',
                boxShadow: isDark ? '0 0 20px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none'
              } : {}}
            >
              <div className="flex items-center gap-3 w-full">
                <item.icon className="w-5 h-5 shrink-0" style={{ color: isActive ? (isDark ? '#A78BFA' : '#7C3AED') : 'currentColor' }} />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)', color: isDark ? '#A78BFA' : '#7C3AED', border: isDark ? '1px solid rgba(167,139,250,0.20)' : 'none' }}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4" style={{ color: isDark ? '#A78BFA' : '#7C3AED' }} />}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Promotional Card: Lari Copiloto */}
      <div className="px-4 py-2 mt-auto">
        <div style={{
          background: isDark ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(76,29,149,0.10))' : 'rgba(124,58,237,0.06)',
          border: isDark ? '1px solid rgba(167,139,250,0.20)' : '1px solid rgba(124,58,237,0.20)',
          borderRadius: '16px'
        }} className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: isDark ? '#A78BFA' : '#7C3AED' }} />
              <span className="text-[13px] font-semibold" style={{ color: isDark ? '#F4F4F5' : '#18181B' }}>Lari Copiloto</span>
            </div>
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Novo
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: isDark ? '#A1A1AA' : '#52525B' }}>
            Sua copiloto de IA em SST. Tire dúvidas sobre NRs, gere documentos e receba orientações.
          </p>
          <Link 
            href="/chat"
            onClick={onClose}
            className="w-full text-center text-[12px] font-semibold text-[var(--text-primary)] py-2 rounded-lg transition-colors hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{
              background: isDark ? 'rgba(124,58,237,0.15)' : '#7C3AED',
              border: isDark ? '1px solid rgba(167,139,250,0.20)' : 'none',
              color: '#FFFFFF'
            }}
          >
            Conversar com a Lari <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      
      {/* Theme Toggle Element */}
      <div className="px-4 pb-2 pt-2 flex justify-center">
        <ThemeToggle />
      </div>

      {/* User Profile */}
      <div className={`p-4 border-t pb-6 ${borderRight}`}>
        <div className="flex items-center justify-between cursor-pointer group px-2 py-1.5 rounded-xl -mx-2 transition-all hover:bg-[var(--bg-active-group)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="https://picsum.photos/seed/lucas/40/40"
                alt="Lucas Martins"
                width={36}
                height={36}
                className="rounded-full bg-gray-800"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 rounded-full" style={{ borderColor: isDark ? '#0B0814' : '#FFFFFF' }}></div>
            </div>
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: isDark ? '#F4F4F5' : '#18181B' }}>Lucas Martins</p>
              <p className="text-[10px] uppercase tracking-wider text-[#71717A] truncate font-bold mt-0.5">Administrador</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#71717A] transition-colors group-hover:text-[#18181B] dark:group-hover:text-[#F4F4F5]" />
        </div>
      </div>
    </aside>
  );
}

