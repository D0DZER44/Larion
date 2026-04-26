"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { NormativeEngine, RiskEngine, EconomicImpactEngine } from '@/lib/engines';
import { 
  ClipboardCheck, Clock, FileText, AlertTriangle, Star, 
  Download, Plus, Settings as SettingsIcon, Calendar, 
  History, ShieldAlert, User, ChevronLeft, ChevronRight, X,
  Play
} from 'lucide-react';

type Inspecao = {
  id: string;
  prioridade: 'P1' | 'P2';
  checklist: string;
  ondeUsar: string;
  proximaInspecao: string;
  responsavel: string;
  situacao: 'Pendente' | 'Em atraso' | 'Revisar' | 'Agendada';
  isAtrasada?: boolean;
};

const mockInspecoes: Inspecao[] = [
  { id: '1', prioridade: 'P1', checklist: 'Trabalho em altura', ondeUsar: 'Operação', proximaInspecao: 'Hoje 14h', responsavel: 'Supervisor + SST', situacao: 'Pendente' },
  { id: '2', prioridade: 'P1', checklist: 'Máquinas e equipamentos', ondeUsar: 'Produção', proximaInspecao: 'Hoje 16h', responsavel: 'Técnico SST', situacao: 'Em atraso', isAtrasada: true },
  { id: '3', prioridade: 'P2', checklist: 'Checklist de EPI', ondeUsar: 'Almoxarifado', proximaInspecao: 'Amanhã 09h', responsavel: 'Encarregado', situacao: 'Revisar' },
  { id: '4', prioridade: 'P2', checklist: 'Checklist de Ambiente', ondeUsar: 'Área externa', proximaInspecao: 'Amanhã 15h', responsavel: 'Técnico de campo', situacao: 'Agendada' },
];

export default function InspecoesPage() {
  const { checklists } = useAppStore();
  const [activeTab, setActiveTab] = useState<'Executar' | 'Modelos'>('Executar');
  const [selectedInspecao, setSelectedInspecao] = useState<Inspecao | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formType, setFormType] = useState<'Inspecao' | 'Modelo'>('Inspecao');
  const [formData, setFormData] = useState({ nome: '', ondeUsar: '' });

  const normativeDetection = NormativeEngine.detect(formData.nome || '');

  const [inspecoes, setInspecoes] = useState<Inspecao[]>(mockInspecoes);

  const listToPaginate = activeTab === 'Executar' ? inspecoes : checklists;
  const totalPages = Math.ceil(listToPaginate.length / itemsPerPage) || 1;
  const currentItems = listToPaginate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenDrawer = (item: Inspecao) => {
    setSelectedInspecao(item);
    setIsDrawerOpen(true);
  };

  const getPriorityColor = (prioridade: string) => {
    switch(prioridade) {
      case 'P1': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'P2': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-gray-500 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getStatusStyle = (situacao: string) => {
    switch(situacao) {
      case 'Pendente': return 'text-yellow-500 border-yellow-500/30 bg-transparent';
      case 'Em atraso': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Revisar': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Agendada': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Ativo': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Rascunho': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'Em revisão': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'Arquivado': return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-transparent';
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0b0f19]">
      <motion.div layout className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Inspeções e checklists</h1>
              <p className="text-sm text-gray-400 mt-1">Execute inspeções, acompanhe pendências e revise modelos críticos.</p>
            </div>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 bg-[#121826] hover:bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                <Download className="w-4 h-4" />
                Importar checklist
              </button>
               <button 
                onClick={() => {
                  setFormType(activeTab === 'Executar' ? 'Inspecao' : 'Modelo');
                  setIsFormDrawerOpen(true);
                }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
               >
                <Plus className="w-4 h-4" />
                {activeTab === 'Executar' ? 'Nova inspeção' : 'Novo modelo'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
               <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                     </div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">Inspeções<br/>Pendentes Hoje</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                     <div className="text-3xl font-bold text-white leading-none">12</div>
                     <span className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">Ver todas <ChevronRight className="w-3 h-3" /></span>
                  </div>
               </div>

               <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-red-500" />
                     </div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">Em Atraso</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                     <div className="text-3xl font-bold text-white leading-none">3</div>
                     <span className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">Ver todas <ChevronRight className="w-3 h-3" /></span>
                  </div>
               </div>

               <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-400" />
                     </div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">Checklists<br/>Vencendo Revisão</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                     <div className="text-3xl font-bold text-white leading-none">2</div>
                     <span className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">Ver todos <ChevronRight className="w-3 h-3" /></span>
                  </div>
               </div>

               <div className="bg-[#121826] border border-white/5 p-5 rounded-xl">
                  <div className="flex items-start gap-3 mb-2">
                     <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                     </div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">Não Conformidades<br/>Recorrentes</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                     <div className="text-sm font-medium text-white leading-snug truncate">EPI, Máquinas, Altura</div>
                  </div>
                  <div className="flex justify-end mt-1">
                     <span className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">Ver detalhes <ChevronRight className="w-3 h-3" /></span>
                  </div>
               </div>
            </div>

            {/* Banner Recomendação */}
            <div className="bg-[#121826] border border-indigo-500/20 rounded-xl p-5 mb-6 flex items-start gap-4 shadow-lg shrink-0">
               <div className="p-2 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                  <Star className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <h4 className="text-white font-bold text-sm mb-1">Ação recomendada</h4>
                  <p className="text-sm text-gray-400">Priorize hoje: Trabalho em Altura, Máquinas e EPI. Há 3 inspeções em atraso e 2 checklists vencendo revisão.</p>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/10 mb-4 shrink-0 px-2">
               <button 
                  onClick={() => { setActiveTab('Executar'); setCurrentPage(1); }}
                  className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'Executar' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  Executar
                  {activeTab === 'Executar' && (
                     <motion.div layoutId="activeTabInspecoes" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
               </button>
               <button 
                  onClick={() => { setActiveTab('Modelos'); setCurrentPage(1); }}
                  className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'Modelos' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  Modelos
                  {activeTab === 'Modelos' && (
                     <motion.div layoutId="activeTabInspecoes" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
               </button>
            </div>

            {/* Table */}
            <div className="bg-[#121826] border border-white/5 rounded-xl shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#0b0f19] sticky top-0 z-10">
                    {activeTab === 'Executar' ? (
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Prioridade</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Checklist</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Onde usar</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Próxima inspeção</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Responsável</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Situação</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Ações</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Nome</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Categoria</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Itens</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Última Revisão</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Status</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Aviso</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Ações</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentItems.map((item: any) => activeTab === 'Executar' ? (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getPriorityColor(item.prioridade)}`}>
                            {item.prioridade}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                           <span className="text-[13px] font-bold text-gray-200">{item.checklist}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-gray-300">{item.ondeUsar}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[13px] font-medium ${item.isAtrasada ? 'text-red-400' : 'text-gray-300'}`}>{item.proximaInspecao}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-gray-300">{item.responsavel}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] border ${getStatusStyle(item.situacao)}`}>
                            {item.situacao}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenDrawer(item)} className="px-3 py-1.5 text-[11px] font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors border border-purple-500/50 flex items-center gap-1.5 focus:outline-none">
                              Iniciar
                            </button>
                            <button className="px-3 py-1.5 text-[11px] font-medium text-gray-300 hover:text-white bg-[#121826] hover:bg-white/10 rounded transition-colors border border-white/10 focus:outline-none">
                              Pendências
                            </button>
                            <button className="px-3 py-1.5 text-[11px] font-medium text-gray-300 hover:text-white bg-[#121826] hover:bg-white/10 rounded transition-colors border border-white/10 focus:outline-none">
                              Revisar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                           <span className="text-[13px] font-bold text-gray-200">{item.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-gray-300">{item.category}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-gray-300">{item.sections?.reduce((acc: number, cur: any) => acc + cur.questions.length, 0) || 0} itens</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[13px] font-medium text-gray-300`}>12/04/2024</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] border ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {item.status === 'Rascunho' && (
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/30 w-fit">
                              <AlertTriangle className="w-3.5 h-3.5" /> Revisar modelo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-[11px] font-medium text-gray-300 hover:text-white bg-[#121826] hover:bg-white/10 rounded transition-colors border border-white/10 focus:outline-none">
                              Editar
                            </button>
                            <button className="px-3 py-1.5 text-[11px] font-medium text-gray-300 hover:text-white bg-[#121826] hover:bg-white/10 rounded transition-colors border border-white/10 focus:outline-none">
                              Duplicar
                            </button>
                            <button className="px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 bg-[#121826] rounded transition-colors border border-white/10 focus:outline-none">
                              Arquivar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 bg-[#0b0f19]">
                 <span>Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, listToPaginate.length)} de {listToPaginate.length} itens</span>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <button 
                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                         disabled={currentPage === 1}
                         className="px-2 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                       <button className="px-3 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30">{currentPage}</button>
                       <button 
                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                         disabled={currentPage === totalPages}
                         className="px-2 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                       <span>Itens por página:</span>
                       <select 
                         value={itemsPerPage}
                         onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                         className="bg-[#121826] border border-white/10 rounded px-2 py-1 outline-none text-gray-300 focus:border-purple-500">
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                       </select>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedInspecao && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
           <motion.div 
           initial={{ opacity: 0, x: '100%' }} 
           animate={{ opacity: 1, x: 0 }} 
           exit={{ opacity: 0, x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#121826] border-l border-white/10 shadow-3xl z-50 flex flex-col overflow-hidden"
         >
           <div className="h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <SettingsIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-white leading-snug">{selectedInspecao.checklist}</h2>
                    <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Categoria: Equipamentos</h3>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto px-6 pb-6">
                
                {/* Meta details list */}
                <div className="space-y-0.5 border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        Última revisão
                     </div>
                     <span className="text-sm font-medium text-white">17/05/2024</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300">
                        <History className="w-4 h-4" />
                        Uso recente
                     </div>
                     <span className="text-sm font-medium text-white">14 inspeções</span>
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                     </div>
                     <div className="flex-1 ml-3">
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 block mb-1">Não conformidades recorrentes</span>
                        <span className="text-sm font-medium text-white">Proteções, bloqueio, sinalização</span>
                     </div>
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 mt-0.5">
                        <User className="w-4 h-4" />
                     </div>
                     <div className="flex-1 ml-3">
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 block mb-1">Responsável</span>
                        <span className="text-sm font-medium text-white">{selectedInspecao.responsavel}</span>
                     </div>
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 mt-0.5">
                        <ClipboardCheck className="w-4 h-4" />
                     </div>
                     <div className="flex-1 ml-3">
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 block mb-1">Próxima ação</span>
                        <span className="text-sm font-medium text-purple-400">Iniciar inspeção {selectedInspecao.proximaInspecao.toLowerCase()}</span>
                     </div>
                  </div>
                </div>

                <div className="mb-6">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400">Itens para a inspeção</span>
                      <span className="text-xs font-bold text-gray-500">0/5 completos</span>
                   </div>
                   <div className="space-y-3 mb-6">
                      {[
                         'Verificar proteções fixas e móveis',
                         'Checar dispositivos de bloqueio',
                         'Avaliar sinalização de segurança',
                         'Inspecionar comandos e emergências',
                         'Registrar condições gerais dos equipamentos'
                      ].map((item, idx) => (
                         <label key={idx} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                           <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#121826] checked:bg-purple-500 checked:border-purple-500 focus:ring-offset-0 focus:ring-0" />
                           <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{item}</span>
                         </label>
                      ))}
                   </div>
                   
                   {(() => {
                      const normMatch = NormativeEngine.detect(selectedInspecao.checklist);
                      if (normMatch && (normMatch.severity === 'crítica' || normMatch.severity === 'alta')) {
                        const estimate = EconomicImpactEngine.estimate({ 
                          severityLevel: normMatch.severity, 
                          exposedPeople: 3, 
                          recurrence: false 
                        });
                        return (
                          <div className="mb-6 p-5 rounded-xl border border-red-500/20 bg-red-500/5">
                             <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                               Economia Estimada (Ação Preventiva)
                             </h4>
                             <div className="text-red-400 font-bold text-sm mb-1">
                               {EconomicImpactEngine.formatCurrency(estimate.min)} a {EconomicImpactEngine.formatCurrency(estimate.max)}
                             </div>
                             <div className="text-[9px] text-gray-500 italic mt-2">
                               Estimativa preventiva. O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento.
                             </div>
                          </div>
                        );
                      }
                      return null;
                   })()}
                </div>

             </div>

             <div className="p-6 border-t border-white/5 bg-[#0b0f19] space-y-3 shrink-0">
               <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors flex justify-center items-center gap-2 border border-purple-500/30">
                 Registrar Não Conformidade
               </button>
               <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-colors flex justify-center items-center gap-2 border border-emerald-500/30">
                 <ClipboardCheck className="w-4 h-4" /> Finalizar Inspeção
               </button>
               <div className="grid grid-cols-2 gap-3 pt-2">
                 <button className="py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10 flex justify-center items-center gap-2">
                   <FileText className="w-4 h-4" /> Relatório
                 </button>
                 <button className="py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10 flex justify-center items-center gap-2">
                   <AlertTriangle className="w-4 h-4" /> Pendências
                 </button>
               </div>
               <button onClick={() => setIsDrawerOpen(false)} className="w-full py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors border border-transparent mt-1">
                 Fechar
               </button>
             </div>
           </div>
         </motion.div>
         </>
        )}

        {isFormDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFormDrawerOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#121826] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0b0f19] rounded-t-2xl shrink-0">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {formType === 'Inspecao' ? 'Nova Inspeção' : 'Novo Modelo Checklist'}
                </h2>
                <button onClick={() => setIsFormDrawerOpen(false)} className="p-1 text-gray-500 hover:text-white rounded-md hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                {formType === 'Inspecao' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Checklist Modelo</label>
                      <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                        {checklists.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Onde usar (Setor/Área)</label>
                      <input type="text" placeholder="Ex: Produção, Expedição" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Data de Agendamento</label>
                        <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Prioridade</label>
                        <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                          <option>P1 - Crítica</option>
                          <option>P2 - Moderada</option>
                          <option>P3 - Baixa</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Responsável pela execução</label>
                      <input type="text" placeholder="Nome do responsável" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                  </>
                )}

                {formType === 'Modelo' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nome do Modelo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: NR-12 Máquinas Específicas" 
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 mb-3" 
                      />

                      {normativeDetection && (
                        <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3 mb-4">
                           <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                             <ShieldAlert className="w-4 h-4" /> Relacionado: {normativeDetection.nr}
                           </h4>
                           <p className="text-xs text-gray-300">
                             <strong>Risco:</strong> {normativeDetection.riskType} <br/>
                             <strong>Severidade:</strong> <span className={normativeDetection.severity === 'crítica' ? 'text-red-400' : 'text-orange-400'}>{normativeDetection.severity.toUpperCase()}</span>
                           </p>
                           {normativeDetection.documents.length > 0 && (
                             <div>
                               <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Checklists Recomendados</span>
                               <div className="flex flex-wrap gap-1.5">
                                 {normativeDetection.documents.map((doc: string) => (
                                   <span key={doc} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-300">{doc}</span>
                                 ))}
                               </div>
                             </div>
                           )}
                           <button 
                              onClick={() => {}}
                              className="w-full py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-600/30 mt-2"
                            >
                             Autopreencher itens sugeridos
                           </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Categoria</label>
                      <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                        <option>Operacional</option>
                        <option>Equipamentos</option>
                        <option>Geral</option>
                        <option>Instalações</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Adicionar Item de Inspeção</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Descreva o que verificar..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                        <button className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors border border-purple-500/30">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="border border-white/10 rounded-xl p-3 bg-black/20 min-h-[150px]">
                      <span className="text-[11px] text-gray-500 block text-center mt-10">Nenhum item adicionado ainda.</span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-5 border-t border-white/5 bg-[#0b0f19] flex gap-3 rounded-b-2xl shrink-0">
                <button 
                  onClick={() => setIsFormDrawerOpen(false)} 
                  className="flex-1 px-4 py-3 rounded-xl text-[11px] font-bold text-gray-400 bg-[#121826] hover:bg-white/10 hover:text-white transition-colors border border-white/10 uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => setIsFormDrawerOpen(false)} 
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl text-[11px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50 uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
