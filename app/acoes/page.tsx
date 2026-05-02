"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Download, Plus, AlertTriangle, Clock, Activity, CheckCircle2, PlayCircle, Filter, Sparkles, X, User } from 'lucide-react';
import { useAcoes } from './hooks';
import VisaoGeral from './components/VisaoGeral';
import Pendentes from './components/Pendentes';
import EmAndamento from './components/EmAndamento';
import Concluidas from './components/Concluidas';
import Historico from './components/Historico';
import DrawerAcao from './components/DrawerAcao';
import { ActionItem } from './types';
import ModalNovaAcao from './components/ModalNovaAcao';

export default function AcoesPage() {
  const { acoes, createAction, updateActionStatus, iniciarAcao, atualizarProgresso, concluirAcao, reatribuirAcao, cancelarAcao, reabrirAcao, executarFollowUps } = useAcoes();
  const [activeTab, setActiveTab] = useState<'VisaoGeral' | 'Pendentes' | 'EmAndamento' | 'Concluidas' | 'Historico'>('VisaoGeral');
  
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    executarFollowUps();
  }, [executarFollowUps]);

  const handleOpenDrawer = (item: ActionItem) => {
    setSelectedAction(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedAction(null), 300);
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#03060e] text-white">
      <motion.div layout className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                Ações
              </h1>
              <p className="text-sm text-gray-400 mt-1">Central de execução e acompanhamento das ações corretivas.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-purple-600/90 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <Plus className="w-4 h-4" />
                Nova Ação
              </button>
            </div>
          </header>

          {/* Subabas */}
          <div className="flex items-center gap-6 border-b border-white/5 mb-6 shrink-0">
            {[
              { id: 'VisaoGeral', label: 'Visão Geral' },
              { id: 'Pendentes', label: 'Pendentes' },
              { id: 'EmAndamento', label: 'Em andamento' },
              { id: 'Concluidas', label: 'Concluídas' },
              { id: 'Historico', label: 'Histórico' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="acoes-tabs" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto rounded-xl">
            <AnimatePresence mode="wait">
              {activeTab === 'VisaoGeral' && <VisaoGeral key="visao" acoes={acoes} onOpen={handleOpenDrawer} />}
              {activeTab === 'Pendentes' && <Pendentes key="pend" acoes={acoes} onOpen={handleOpenDrawer} />}
              {activeTab === 'EmAndamento' && <EmAndamento key="anda" acoes={acoes} onOpen={handleOpenDrawer} />}
              {activeTab === 'Concluidas' && <Concluidas key="conc" acoes={acoes} onOpen={handleOpenDrawer} />}
              {activeTab === 'Historico' && <Historico key="hist" acoes={acoes} onOpen={handleOpenDrawer} />}
            </AnimatePresence>
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
