"use client";

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Download, Plus, AlertTriangle, Clock, Activity, CheckCircle2, PlayCircle, Filter, Sparkles, X, User, BarChart2, AlertCircle, History } from 'lucide-react';
import { useAcoes } from '@/app/acoes/hooks';
import VisaoGeral from '@/app/acoes/components/VisaoGeral';
import Pendentes from '@/app/acoes/components/Pendentes';
import EmAndamento from '@/app/acoes/components/EmAndamento';
import Concluidas from '@/app/acoes/components/Concluidas';
import Historico from '@/app/acoes/components/Historico';
import DrawerAcao from '@/app/acoes/components/DrawerAcao';
import { ActionItem } from '@/app/acoes/types';
import ModalNovaAcao from '@/app/acoes/components/ModalNovaAcao';

class ErrorBoundary extends Component<{children: ReactNode, fallback: (error: Error) => ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode, fallback: (error: Error) => ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Ações Error Boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

export default function AcoesPage() {
  return (
    <ErrorBoundary fallback={(error) => (
      <div className="p-8 text-red-600 dark:text-red-400 bg-[var(--bg-primary)] h-full">
        Erro ao carregar Ações: {error.message}
      </div>
    )}>
      <AcoesContent />
    </ErrorBoundary>
  );
}

function AcoesContent() {
  const [isMounted, setIsMounted] = useState(false);
  const { acoes, createAction, updateActionStatus, iniciarAcao, atualizarProgresso, concluirAcao, reatribuirAcao, cancelarAcao, reabrirAcao, executarFollowUps } = useAcoes();
  const [activeTab, setActiveTab] = useState<'VisaoGeral' | 'Pendentes' | 'EmAndamento' | 'Concluidas' | 'Historico'>('VisaoGeral');
  
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const executarFollowUpsRef = React.useRef(executarFollowUps);

  useEffect(() => {
    executarFollowUpsRef.current = executarFollowUps;
  }, [executarFollowUps]);

  useEffect(() => {
    // Roda followUps a cada minuto
    executarFollowUpsRef.current();
    const ticker = setInterval(() => {
      executarFollowUpsRef.current();
    }, 60 * 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleOpenDrawer = (item: ActionItem) => {
    setSelectedAction(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedAction(null), 300);
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <motion.div layout className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)] mb-2">
                <span>Operação</span>
                <span className="text-[var(--text-secondary)]">›</span>
                <span>Ações</span>
                <span className="text-[var(--text-secondary)]">›</span>
                <span className="text-[var(--text-muted)]">
                  {activeTab === 'VisaoGeral' ? 'Visão Geral' : activeTab === 'EmAndamento' ? 'Em andamento' : activeTab === 'Concluidas' ? 'Concluídas' : activeTab === 'Historico' ? 'Histórico' : 'Pendentes'}
                </span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                Ações
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">Central de execução e acompanhamento das ações corretivas.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-secondary)] px-4 py-2 rounded-xl text-sm font-medium transition-all border border-[var(--border)]">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="flex items-center gap-2 bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-secondary)] px-4 py-2 rounded-xl text-sm font-medium transition-all border border-[var(--border)]">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-purple-600/90 hover:bg-purple-600 text-[var(--text-primary)] px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <Plus className="w-4 h-4" />
                Nova Ação
              </button>
            </div>
          </header>

          {/* Subabas */}
          <div className="flex bg-[var(--bg-card)] p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto custom-scrollbar gap-1 mb-6">
            {[
              { id: 'VisaoGeral', label: 'Visão Geral', icon: <BarChart2 className="w-4 h-4" /> },
              { id: 'Pendentes', label: 'Pendentes', icon: <AlertCircle className="w-4 h-4" /> },
              { id: 'EmAndamento', label: 'Em andamento', icon: <Clock className="w-4 h-4" /> },
              { id: 'Concluidas', label: 'Concluídas', icon: <CheckCircle2 className="w-4 h-4" /> },
              { id: 'Historico', label: 'Histórico', icon: <History className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-[var(--shadow-glow)]' 
                    : 'bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-active-group)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto rounded-xl">
            {isMounted && (
              <AnimatePresence mode="wait">
                {activeTab === 'VisaoGeral' && <VisaoGeral key="visao" acoes={acoes} onOpen={handleOpenDrawer} />}
                {activeTab === 'Pendentes' && <Pendentes key="pend" acoes={acoes} onOpen={handleOpenDrawer} />}
                {activeTab === 'EmAndamento' && <EmAndamento key="anda" acoes={acoes} onOpen={handleOpenDrawer} />}
                {activeTab === 'Concluidas' && <Concluidas key="conc" acoes={acoes} onOpen={handleOpenDrawer} />}
                {activeTab === 'Historico' && <Historico key="hist" acoes={acoes} onOpen={handleOpenDrawer} />}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      {/* Right Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedAction && (
          <DrawerAcao 
            acao={acoes.find(a => a.id === selectedAction.id) || selectedAction} 
            onClose={handleCloseDrawer} 
            iniciarAcao={iniciarAcao}
            atualizarProgresso={atualizarProgresso}
            concluirAcao={concluirAcao}
            reatribuirAcao={reatribuirAcao}
            cancelarAcao={cancelarAcao}
            reabrirAcao={reabrirAcao}
            forcarFollowUp={executarFollowUps}
          />
        )}
      </AnimatePresence>

      {/* Modal Nova Acao */}
      <AnimatePresence>
         {isModalOpen && (
            <ModalNovaAcao onClose={() => setIsModalOpen(false)} onCreate={createAction} />
         )}
      </AnimatePresence>
    </div>
  );
}
