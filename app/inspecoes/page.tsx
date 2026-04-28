"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { NormativeEngine } from '@/lib/engines';
import { 
  ClipboardCheck, Clock, FileText, AlertTriangle, 
  Download, Plus, Settings as SettingsIcon, 
  ShieldAlert, User, ChevronLeft, ChevronRight, X,
  Trash2
} from 'lucide-react';

import AcaoRecomendadaCard from '@/components/AcaoRecomendadaCard';

type Inspecao = {
  id: string;
  prioridade: string;
  checklist: string;
  ondeUsar: string;
  proximaInspecao: string;
  responsavel: string;
  situacao: string;
  status?: string;
  isAtrasada?: boolean;
  items?: any[];
  data?: string;
};



export default function InspecoesPage() {
  const store = useAppStore();
  const { checklists, addInspecao, addRisco, addAcao } = store;
  const [drawerMode, setDrawerMode] = useState<'VIEW' | 'EXECUTE' | 'ISSUES' | 'RESCHEDULE' | 'REPORT'>('VIEW');
  const [activeTab, setActiveTab] = useState<'Executar' | 'Modelos'>('Executar');
  const [selectedInspecao, setSelectedInspecao] = useState<Inspecao | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelActionType, setCancelActionType] = useState<'DELETE' | 'CANCEL' | 'VOID'>('DELETE');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formType, setFormType] = useState<'Inspecao' | 'Modelo'>('Inspecao');
  const [formData, setFormData] = useState({ nome: '', ondeUsar: '' });
  
  const [inspectionStep, setInspectionStep] = useState<1 | 2>(1);
  const [inspectionData, setInspectionData] = useState({
    checklistId: '',
    ondeUsar: '',
    data: '',
    prioridade: 'P2 - Moderada',
    responsavel: ''
  });
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [urlFilter, setUrlFilter] = useState<string>('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      setTimeout(() => setUrlFilter(p.get('filter') || ''), 0);
    }
  }, []);

  const normativeDetection = NormativeEngine.detect(formData.nome || '');

  const hojeDateStr = new Date().toISOString().split('T')[0];

  const pendentesHoje = (store.inspecoes || []).filter(i => {
    const isCompleted = i.status === 'Concluída' || i.situacao === 'Concluída' || i.status === 'Cancelada' || i.situacao === 'Cancelada' || i.status === 'Anulada' || i.situacao === 'Anulada';
    if (isCompleted) return false;
    
    const isPendingStatus = ['Pendente', 'Agendada', 'Em atraso', 'Revisar'].includes(i.status || i.situacao || 'Pendente');
    const isToday = (i.proximaInspecao || i.data) === hojeDateStr;
    
    return isPendingStatus && isToday;
  }).length || 0;

  const emAtraso = (store.inspecoes || []).filter(i => {
    const isCompleted = i.status === 'Concluída' || i.situacao === 'Concluída' || i.status === 'Cancelada' || i.situacao === 'Cancelada' || i.status === 'Anulada' || i.situacao === 'Anulada';
    if (isCompleted) return false;
    
    if (i.status === 'Em atraso' || i.situacao === 'Em atraso' || i.isAtrasada) return true;
    
    const dateToCompare = i.proximaInspecao || i.data;
    if (dateToCompare && dateToCompare < hojeDateStr) return true;
    
    return false;
  }).length || 0;

  const checklistsVencendo = (store.checklists || []).filter(c => {
    if (c.status === 'Revisar') return true;
    if (c.proximaRevisao && c.proximaRevisao <= hojeDateStr) return true;
    return false;
  }).length || 0;

  const naoConformidadesRecorrentes = React.useMemo(() => {
    const ocorrenciasPorTema: Record<string, number> = {};
    (store.inspecoes || []).forEach(i => {
      if (i.items && Array.isArray(i.items)) {
         i.items.forEach((item: any) => {
            if (item.status === 'Não conforme') {
               const tema = item.sectionTitle || i.checklist || 'Geral';
               ocorrenciasPorTema[tema] = (ocorrenciasPorTema[tema] || 0) + 1;
            }
         });
      }
    });

    const mostCommonIssues = Object.entries(ocorrenciasPorTema)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    if (mostCommonIssues.length === 0) return 'Dados insuficientes';
    return mostCommonIssues.join(', ');
  }, [store.inspecoes]);

  let allInspecoes = [...(store.inspecoes || [])].reverse();
  
  if (urlFilter === 'pendentes') {
     allInspecoes = allInspecoes.filter(i => {
       const isCompleted = i.status === 'Concluída' || i.situacao === 'Concluída' || i.status === 'Finalizada' || i.situacao === 'Finalizada';
       return !isCompleted;
     });
  }

  const listToPaginate = activeTab === 'Executar' ? allInspecoes : checklists;
  const totalPages = Math.ceil(listToPaginate.length / itemsPerPage) || 1;
  const currentItems = listToPaginate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenDrawer = (item: Inspecao, mode: 'VIEW' | 'EXECUTE' | 'ISSUES' | 'RESCHEDULE' | 'REPORT' | 'CANCEL' = 'VIEW') => {
    if (mode === 'REPORT') {
      alert('Gerar relatório em desenvolvimento.');
      return;
    }
    if (mode === 'CANCEL') {
      const hasHistory = (item.items && item.items.length > 0) || store.riscos?.some(r => r.inspection_id === item.id) || store.acoes?.some(a => a.inspection_id === item.id);
      const isOngoing = item.situacao === 'Em andamento' || item.status === 'Em andamento';
      const isCompleted = item.situacao === 'Concluída' || item.status === 'Concluída' || item.situacao === 'Revisar' || item.status === 'Revisar';
      
      let type: 'DELETE' | 'CANCEL' | 'VOID' = 'DELETE';
      if (isCompleted || hasHistory) type = 'VOID';
      else if (isOngoing) type = 'CANCEL';
      
      setCancelActionType(type);
      setSelectedInspecao(item);
      setCancelReason('');
      setCancelModalOpen(true);
      return;
    }
    
    setSelectedInspecao(item);
    setDrawerMode(mode);
    if (mode === 'EXECUTE') {
      if (item.items && item.items.length > 0) {
        setChecklistItems(item.items);
      } else {
        // Find checklist using item.checklist
        const tempChecklistItems: any[] = [];
        const foundC = checklists.find(c => c.name === item.checklist);
        if (foundC) {
          foundC.sections.forEach(sec => {
            sec.questions.forEach(q => {
              tempChecklistItems.push({
                id: q.id,
                sectionId: sec.id,
                sectionTitle: sec.title,
                text: q.text,
                status: 'Conforme',
                gravidade: 'Baixo',
                observacao: '',
                acaoCorretiva: getAcaoSugerida(q.text),
                evidencia: ''
              });
            });
          });
        }
        setChecklistItems(tempChecklistItems);
      }
    }
    setIsDrawerOpen(true);
  };

  const getPriorityColor = (prioridade: string) => {
    switch(prioridade) {
      case 'P1': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'P2': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-gray-500 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getAcaoSugerida = (question: string) => {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('partes móveis') && lowerQ.includes('proteg')) return 'Instalar ou regularizar proteção física nas partes móveis.';
    if (lowerQ.includes('rotas de fuga') && lowerQ.includes('desobstruídas')) return 'Desobstruir imediatamente as rotas de fuga do local.';
    if (lowerQ.includes('ambiente') && lowerQ.includes('limpo')) return 'Realizar limpeza e organização do local sinalizando as áreas.';
    if (lowerQ.includes('epi') && lowerQ.includes('estado')) return 'Solicitar e substituir EPIs danificados por uniformes/equipamentos novos.';
    if (lowerQ.includes('permissão de trabalho')) return 'Emitir, revisar e validar a Permissão de Trabalho (PT) com os responsáveis antes de continuar a operação.';
    if (lowerQ.includes('ancoragem')) return 'Avaliar os pontos de ancoragem e testar estabilidade antes da tarefa.';
    if (lowerQ.includes('emergência') && lowerQ.includes('botão')) return 'Solicitar manutenção imediata do botão de emergência da máquina.';
    return `Regularizar conformidade: ${question.replace('?', '')}`;
  };

  const getPrazoDias = (gravidade: string) => {
    switch(gravidade) {
      case 'Crítico': return 1;
      case 'Alta': return 7;
      case 'Média': return 15;
      case 'Baixo': default: return 30;
    }
  };

  const handleAvancarInspecao = () => {
    if (formType === 'Inspecao') {
      const selectedModel = checklists.find(c => c.id === (inspectionData.checklistId || checklists[0]?.id));
      if (!selectedModel) return;
      
      const newItems: any[] = [];
      selectedModel.sections.forEach(sec => {
        sec.questions.forEach(q => {
          newItems.push({
            id: q.id,
            sectionId: sec.id,
            sectionTitle: sec.title,
            text: q.text,
            status: 'Conforme',
            gravidade: 'Baixo',
            observacao: '',
            acaoCorretiva: getAcaoSugerida(q.text),
            evidencia: ''
          });
        });
      });
      setChecklistItems(newItems);
      setInspectionStep(2);
    }
  };

  const handleSalvarInspecao = () => {
    if (formType === 'Inspecao') {
      const isConcluido = checklistItems.every(item => item.status === 'Conforme' || item.status === 'Não se aplica');
      const inspecaoId = Date.now().toString();
      const modelo = checklists.find(c => c.id === (inspectionData.checklistId || checklists[0]?.id))?.name || 'Inspeção';
      
      // Salva inspecao
      const newInspecao = {
        id: inspecaoId,
        checklist: modelo,
        ondeUsar: inspectionData.ondeUsar || 'Geral',
        proximaInspecao: inspectionData.data || 'Hoje',
        responsavel: inspectionData.responsavel || 'Responsável não definido',
        prioridade: inspectionData.prioridade.split(' ')[0],
        situacao: isConcluido ? 'Concluída' : 'Revisar',
        data: inspectionData.data,
        status: isConcluido ? 'Concluída' : 'Revisar',
        items: checklistItems
      };
      
      addInspecao(newInspecao);
      console.log('Inspeção salva:', newInspecao);
      
      // Processa itens 'Não conforme' criando riscos e ações logicamente
      checklistItems.forEach(item => {
        if (item.status === 'Não conforme') {
          const existingRisco = store.riscos?.find((r: any) => r.inspection_id === inspecaoId && r.titulo?.includes(item.text));
          if (existingRisco) return;

          const riscoId = Date.now().toString() + '_' + item.id;
          
          let riscoNivel = 'Baixo';
          if (item.gravidade === 'Crítico') riscoNivel = 'Crítico';
          if (item.gravidade === 'Alta') riscoNivel = 'Alto';
          if (item.gravidade === 'Média') riscoNivel = 'Médio';
          
          const actionDays = getPrazoDias(item.gravidade);
          
          const prazoDate = new Date();
          prazoDate.setDate(prazoDate.getDate() + actionDays);
          const prazoStr = prazoDate.toISOString().split('T')[0];

          try {
            // Cria Risco
            addRisco({
              id: riscoId,
              empresa_id: '1',
              inspection_id: inspecaoId,
              inspection_name: store.checklists?.find((c: any) => c.id === inspectionData.checklistId)?.name || `Inspeção`,
              checklist_item_id: item.id || `item_${Date.now()}`,
              setor: inspectionData.ondeUsar || 'Geral',
              inspection_date: inspectionData.data || hojeDateStr,
              non_compliant_item: item.text,
              titulo: `Não Conformidade: ${item.text}`,
              descricao: item.observacao || 'Risco gerado a partir de inspeção não conforme.',
              severidade: riscoNivel,
              nivel: riscoNivel,
              status: 'Aberto',
              origem: 'Inspeção',
              item_origem_tipo: 'inspecao',
              createdAutomatically: true,
              created_at: new Date().toISOString()
            });
            console.log('Risco criado automaticamente:', riscoId);

            // Cria Ação
            addAcao({
              id: Date.now().toString() + '_acao_' + item.id,
              empresa_id: '1',
              inspection_id: inspecaoId,
              inspection_name: store.checklists?.find((c: any) => c.id === inspectionData.checklistId)?.name || `Inspeção`,
              risk_id: riscoId,
              checklist_item_id: item.id || `item_${Date.now()}`,
              setor: inspectionData.ondeUsar || 'Geral',
              titulo: item.acaoCorretiva || `Corrigir: ${item.text}`,
              acao_corretiva_sugerida: item.acaoCorretiva || `Corrigir: ${item.text}`,
              descricao: item.observacao || 'Ação corretiva automática de inspeção.',
              responsavel: inspectionData.responsavel || 'Responsável não definido',
              prazo: prazoStr,
              status: 'Pendente',
              origem: 'Risco',
              item_origem_tipo: 'risco',
              item_origem_id: riscoId,
              createdAutomatically: true,
              created_at: new Date().toISOString()
            });
            console.log('Ação criada automaticamente para o risco:', riscoId);
          } catch(err) {
            console.error('Erro ao processar motor automático:', err);
          }
        }
      });
      
      setIsFormDrawerOpen(false);
      setInspectionStep(1);
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
      case 'Cancelada': return 'text-red-400 border-red-500/30 bg-red-500/10 line-through opacity-70';
      case 'Anulada': return 'text-gray-400 border-gray-500/30 bg-gray-500/10 line-through opacity-70';
      default: return 'text-gray-400 border-gray-500/30 bg-transparent';
    }
  };

  const getInspectionActions = (item: Inspecao) => {
    const sit = item.situacao || item.status;
    const isAtrasada = item.isAtrasada || sit === 'Em atraso';
    
    if (sit === 'Cancelada' || sit === 'Anulada') {
      return [
        { label: 'Ver Detalhes', action: 'VIEW', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' }
      ];
    }
    
    if (isAtrasada) {
      return [
        { label: 'Iniciar', action: 'EXECUTE', style: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500/50' },
        { label: 'Reagendar', action: 'RESCHEDULE', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' }
      ];
    }
    
    if (sit === 'Em andamento') {
      return [
        { label: 'Continuar', action: 'EXECUTE', style: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500/50' },
        { label: 'Cancelar', action: 'CANCEL', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' }
      ];
    }
    
    if (sit === 'Concluída' || sit === 'Revisar') {
      const hasIssues = item.items?.some((i: any) => i.status === 'Não conforme');
      const actions = [];
      if (hasIssues) {
        actions.push({ label: 'Pendências', action: 'ISSUES', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' });
      }
      actions.push({ label: 'Revisar', action: 'VIEW', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' });
      actions.push({ label: 'Relatório', action: 'REPORT', style: 'bg-[#121826] hover:bg-white/10 text-gray-300 border-white/10' });
      return actions;
    }
    
    // Default to Pendente or Agendada
    return [
      { label: 'Iniciar', action: 'EXECUTE', style: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500/50' }
    ];
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
                  setInspectionStep(1);
                  setInspectionData({
                    checklistId: '',
                    ondeUsar: '',
                    data: '',
                    prioridade: 'P2 - Moderada',
                    responsavel: ''
                  });
                  setChecklistItems([]);
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
                     <div className="text-3xl font-bold text-white leading-none">{pendentesHoje}</div>
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
                     <div className="text-3xl font-bold text-white leading-none">{emAtraso}</div>
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
                     <div className="text-3xl font-bold text-white leading-none">{checklistsVencendo}</div>
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
                     <div className="text-sm font-medium text-white leading-snug truncate" title={naoConformidadesRecorrentes}>{naoConformidadesRecorrentes}</div>
                  </div>
                  <div className="flex justify-end mt-1">
                     <span className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">Ver detalhes <ChevronRight className="w-3 h-3" /></span>
                  </div>
               </div>
            </div>

            {/* Banner Recomendação */}
            <AcaoRecomendadaCard context="inspecoes" />

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/10 mb-4 shrink-0 px-2">
               <div className="flex items-center gap-6">
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
               
               {urlFilter === 'pendentes' && activeTab === 'Executar' && (
                 <div className="pb-3 flex items-center">
                   <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 text-xs rounded-full flex items-center gap-2">
                     <AlertTriangle className="w-3.5 h-3.5" />
                     Mostrando apenas inspeções pendentes
                     <button onClick={() => setUrlFilter('')} className="ml-2 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                   </div>
                 </div>
               )}
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
                            {getInspectionActions(item).map((action, idx) => (
                              <button 
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(item, action.action as any);
                                }}
                                className={`px-3 py-1.5 text-[11px] font-medium rounded transition-colors border focus:outline-none flex items-center gap-1.5 ${action.style}`}
                              >
                                {action.label}
                              </button>
                            ))}
                            {(item.status !== 'Cancelada' && item.status !== 'Anulada' && item.situacao !== 'Cancelada' && item.situacao !== 'Anulada') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(item, 'CANCEL');
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ml-2"
                                title="Cancelar / Excluir / Anular"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                       {Array.from({ length: Math.min(3, totalPages || 1) }).map((_, i) => {
                         let pageNum;
                         if (totalPages <= 3) {
                            pageNum = i + 1;
                         } else if (currentPage <= 2) {
                            pageNum = i + 1; 
                         } else if (currentPage >= totalPages - 1) {
                            pageNum = totalPages - 2 + i;
                         } else {
                            pageNum = currentPage - 1 + i;
                         }
                         return (
                            <button 
                               key={pageNum}
                               onClick={() => setCurrentPage(pageNum)}
                               className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-[#0b0f19] text-gray-400 border border-transparent hover:border-white/5 hover:text-white transition-colors'}`}
                            >
                               {pageNum}
                            </button>
                         );
                       })}
                       <button 
                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                         disabled={currentPage === totalPages || totalPages === 0}
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
                
                {drawerMode === 'VIEW' && (
                  <>
                  {/* Meta details list */}
                  <div className="space-y-0.5 border-b border-white/10 pb-6 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                       <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300">
                          <User className="w-4 h-4" />
                       </div>
                       <div className="flex-1 ml-3">
                          <span className="text-sm text-gray-400 group-hover:text-gray-300 block mb-1">Responsável</span>
                          <span className="text-sm font-medium text-white">{selectedInspecao.responsavel}</span>
                       </div>
                    </div>
                  </div>
                  <div className="mb-6">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-400">Itens Executados</span>
                     </div>
                     <div className="space-y-3 mb-6">
                        {selectedInspecao.items && selectedInspecao.items.length > 0 ? selectedInspecao.items.map((item: any, idx: number) => (
                           <div key={idx} className="p-3 bg-black/20 rounded-lg border border-white/5">
                             <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-300 flex-1 pr-4">{item.text}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded h-max ${item.status === 'Conforme' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : item.status === 'Não conforme' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>{item.status}</span>
                             </div>
                             {item.status === 'Não conforme' && (
                               <div className="mt-2 text-xs border-t border-white/10 pt-2 space-y-1">
                                  <p className="text-red-400"><span className="font-bold">Obs:</span> {item.observacao}</p>
                                  <p className="text-purple-400"><span className="font-bold">Ação Sugerida:</span> {item.acaoCorretiva}</p>
                               </div>
                             )}
                           </div>
                        )) : (
                          <div className="text-sm text-gray-500 italic">Nenhum item executado.</div>
                        )}
                     </div>
                  </div>
                  </>
                )}

                {drawerMode === 'ISSUES' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Riscos Gerados</h3>
                    {store.riscos?.filter((r: any) => r.inspection_id === selectedInspecao.id).map((r: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <p className="text-sm font-bold text-red-400">{r.titulo}</p>
                        <p className="text-xs text-gray-400 mt-1">Status: {r.status} | Severidade: {r.severidade}</p>
                      </div>
                    ))}
                    {(store.riscos?.filter((r: any) => r.inspection_id === selectedInspecao.id).length === 0) && (
                      <p className="text-sm text-gray-500">Nenhum risco encontrado.</p>
                    )}

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Ações Corretivas</h3>
                    {store.acoes?.filter((a: any) => a.inspection_id === selectedInspecao.id).map((a: any, idx: number) => (
                      <div key={idx} className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                        <p className="text-sm font-bold text-purple-400">{a.titulo}</p>
                        <p className="text-xs text-gray-300 mt-1">Responsável: {a.responsavel}</p>
                        <p className="text-xs text-gray-300">Prazo: {a.prazo}</p>
                      </div>
                    ))}
                    {(store.acoes?.filter((a: any) => a.inspection_id === selectedInspecao.id).length === 0) && (
                      <p className="text-sm text-gray-500">Nenhuma ação encontrada.</p>
                    )}
                  </div>
                )}

                {drawerMode === 'RESCHEDULE' && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-300">Atualize os dados de agendamento desta inspeção.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nova Data</label>
                      <input type="date" value={selectedInspecao.data || selectedInspecao.proximaInspecao} onChange={(e) => setSelectedInspecao({...selectedInspecao, data: e.target.value, proximaInspecao: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Responsável</label>
                      <input type="text" value={selectedInspecao.responsavel} onChange={(e) => setSelectedInspecao({...selectedInspecao, responsavel: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                  </div>
                )}

                {drawerMode === 'EXECUTE' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                      <h3 className="text-sm font-bold text-white mb-1">Execução do Checklist</h3>
                      <p className="text-[11px] text-gray-400">Classifique os itens. Itens não conformes requererão gravação de evidência, risco e ação corretiva.</p>
                    </div>

                    <div className="space-y-6">
                      {checklistItems.map((item, index) => (
                        <div key={index} className="p-4 bg-[#1a1f2e] border border-white/5 rounded-xl flex flex-col">
                           <div className="mb-3">
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{item.sectionTitle}</span>
                             <p className="text-sm font-medium text-white leading-relaxed">{item.text}</p>
                           </div>
                           
                           <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const newItems = [...checklistItems];
                                  newItems[index].status = 'Conforme';
                                  setChecklistItems(newItems);
                                }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${item.status === 'Conforme' ? 'bg-purple-600 text-white border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/5'}`}
                              >
                                Conforme
                              </button>
                              <button 
                                onClick={() => {
                                  const newItems = [...checklistItems];
                                  newItems[index].status = 'Não conforme';
                                  setChecklistItems(newItems);
                                }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${item.status === 'Não conforme' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/5'}`}
                              >
                                Não conforme
                              </button>
                              <button 
                                onClick={() => {
                                  const newItems = [...checklistItems];
                                  newItems[index].status = 'Não se aplica';
                                  setChecklistItems(newItems);
                                }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${item.status === 'Não se aplica' ? 'bg-gray-600 text-white border-gray-500/50' : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/5'}`}
                              >
                                Não se aplica
                              </button>
                           </div>

                           {item.status === 'Não conforme' && (
                             <div className="space-y-3 mt-3 pt-3 border-t border-white/5">
                               <div>
                                 <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Gravidade do Risco</label>
                                 <select 
                                    value={item.gravidade || 'Baixo'}
                                    onChange={(e) => {
                                      const newItems = [...checklistItems];
                                      newItems[index].gravidade = e.target.value;
                                      newItems[index].acaoCorretiva = getAcaoSugerida(item.text);
                                      setChecklistItems(newItems);
                                    }}
                                    className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 appearance-none">
                                   <option>Baixo</option>
                                   <option>Média</option>
                                   <option>Alta</option>
                                   <option>Crítico</option>
                                 </select>
                               </div>

                               <div className="flex gap-4">
                                 <div className="flex-1 bg-black/20 p-2 rounded-lg border border-white/5">
                                   <p className="text-[10px] text-gray-400">Prazo sugerido <br/><span className="font-bold text-white text-xs">{getPrazoDias(item.gravidade || 'Baixo')} {getPrazoDias(item.gravidade || 'Baixo') === 1 ? 'dia (24h)' : 'dias'}</span></p>
                                 </div>
                                 <div className="flex-1 bg-black/20 p-2 rounded-lg border border-white/5">
                                   <p className="text-[10px] text-gray-400">Responsável <br/><span className="font-bold text-white truncate inline-block max-w-[120px] align-bottom text-xs">{selectedInspecao.responsavel || 'Não definido'}</span></p>
                                 </div>
                               </div>

                               <div>
                                 <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Ação Corretiva Sugerida (Obrigatória)</label>
                                 <input 
                                    type="text"
                                    placeholder="Ex: Instalar proteção nas partes móveis..."
                                    value={item.acaoCorretiva || ''}
                                    onChange={(e) => {
                                      const newItems = [...checklistItems];
                                      newItems[index].acaoCorretiva = e.target.value;
                                      setChecklistItems(newItems);
                                    }}
                                    className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                                 />
                               </div>

                               <div>
                                 <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Observação (Obrigatória)</label>
                                 <textarea 
                                    placeholder="Descreva o problema encontrado..."
                                    value={item.observacao || ''}
                                    onChange={(e) => {
                                      const newItems = [...checklistItems];
                                      newItems[index].observacao = e.target.value;
                                      setChecklistItems(newItems);
                                    }}
                                    className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none h-20"
                                 ></textarea>
                               </div>
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="p-6 border-t border-white/5 bg-[#0b0f19] space-y-3 shrink-0">
               {drawerMode === 'EXECUTE' && (
                 <button 
                  onClick={() => {
                    const hasErros = checklistItems.some(i => i.status === 'Não conforme' && (!i.observacao?.trim() || !i.acaoCorretiva?.trim()));
                    if (hasErros) {
                      alert('Preencha a observação e a ação corretiva obrigatórias para itens não conformes.');
                      return;
                    }
                    
                    const isConcluido = checklistItems.every(item => item.status === 'Conforme' || item.status === 'Não se aplica');
                    
                    const updatedInspecao = {
                      ...selectedInspecao,
                      situacao: isConcluido ? 'Concluída' : 'Revisar',
                      status: isConcluido ? 'Concluída' : 'Revisar',
                      items: checklistItems
                    };
                    store.updateInspecao(updatedInspecao.id, updatedInspecao);
                    
                    checklistItems.forEach(item => {
                      if (item.status === 'Não conforme') {
                        const existingRisco = store.riscos?.find((r: any) => r.inspection_id === updatedInspecao.id && (r.titulo?.includes(item.text) || r.title?.includes(item.text)));
                        if (existingRisco) return;
                        
                        const riscoId = Date.now().toString() + '_' + item.id;
                        let riscoNivel: 'Crítico' | 'Alto' | 'Médio' | 'Baixo' = 'Baixo';
                        let priorityAction = 'P4';
                        
                        if (item.gravidade === 'Crítico') { riscoNivel = 'Crítico'; priorityAction = 'P1'; }
                        if (item.gravidade === 'Alta') { riscoNivel = 'Alto'; priorityAction = 'P2'; }
                        if (item.gravidade === 'Média') { riscoNivel = 'Médio'; priorityAction = 'P3'; }
                        
                        const actionDays = getPrazoDias(item.gravidade || 'Baixo');
                        const prazoDate = new Date();
                        prazoDate.setDate(prazoDate.getDate() + actionDays);
                        const prazoStr = prazoDate.toISOString().split('T')[0];

                        // Verifica repeticao: se o mesmo tipo de risco aparecer 3 vezes no mesmo setor, aumentar prioridade em 1 nivel.
                        const sameCategoryRisks = store.riscos?.filter((r: any) => r.setor === (updatedInspecao.ondeUsar || 'Geral') && (r.titulo === `Não Conformidade: ${item.text}` || r.title === `Não Conformidade: ${item.text}`)) || [];
                        if (sameCategoryRisks.length >= 3) {
                           if (priorityAction === 'P4') priorityAction = 'P3';
                           else if (priorityAction === 'P3') priorityAction = 'P2';
                           else if (priorityAction === 'P2') priorityAction = 'P1';
                        }

                        let acaoResponsavel = updatedInspecao.responsavel;
                        if (!acaoResponsavel || acaoResponsavel.includes('não definido') || acaoResponsavel === '') {
                           acaoResponsavel = 'Atenção: Não Definido';
                        }
                        
                        const acaoId = Date.now().toString() + '_acao_' + item.id;
                        
                        store.addRisco({
                          id: riscoId,
                          empresa_id: '1',
                          inspection_id: updatedInspecao.id,
                          inspection_name: updatedInspecao.checklist || `Inspeção`,
                          checklist_item_id: item.id,
                          setor: updatedInspecao.ondeUsar || 'Geral',
                          inspection_date: updatedInspecao.data || updatedInspecao.proximaInspecao || hojeDateStr,
                          non_compliant_item: item.text,
                          categoria: 'Inspeção',
                          titulo: `Não Conformidade: ${item.text}`,
                          title: `Não Conformidade: ${item.text}`,
                          atividade: item.text,
                          descricao: item.observacao || 'Risco gerado a partir de inspeção não conforme.',
                          description: item.observacao || 'Risco gerado a partir de inspeção não conforme.',
                          severidade: riscoNivel,
                          nivel: riscoNivel,
                          gravidade: item.gravidade || 'Baixo',
                          prioridade: priorityAction,
                          status: 'Aberto',
                          origem: 'Inspeção',
                          item_origem_tipo: 'inspecao',
                          acao_vinculada_id: acaoId,
                          createdAutomatically: true,
                          created_at: new Date().toISOString()
                        });
                        
                        store.addAcao({
                          id: acaoId,
                          empresa_id: '1',
                          inspection_id: updatedInspecao.id,
                          inspection_name: updatedInspecao.checklist || `Inspeção`,
                          risk_id: riscoId,
                          checklist_item_id: item.id,
                          item_origem_id: riscoId,
                          item_origem_tipo: 'risco',
                          source_type: 'risco',
                          setor: updatedInspecao.ondeUsar || 'Geral',
                          titulo: item.acaoCorretiva || `Corrigir: ${item.text}`,
                          title: item.acaoCorretiva || `Corrigir: ${item.text}`,
                          acao_corretiva_sugerida: item.acaoCorretiva || `Corrigir: ${item.text}`,
                          descricao: item.observacao || 'Ação corretiva automática de inspeção.',
                          description: item.observacao || 'Ação corretiva automática de inspeção.',
                          responsavel: acaoResponsavel,
                          prazo: prazoStr,
                          due_date: prazoDate.toISOString(),
                          status: 'Aberta',
                          prioridade: priorityAction,
                          priority: priorityAction,
                          origem: 'Risco',
                          createdAutomatically: true,
                          created_at: new Date().toISOString()
                        });
                      }
                    });
                    
                    setIsDrawerOpen(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-colors flex justify-center items-center gap-2 border border-emerald-500/30"
                 >
                   <ClipboardCheck className="w-4 h-4" /> Finalizar Inspeção
                 </button>
               )}
               {drawerMode === 'RESCHEDULE' && (
                 <button 
                  onClick={() => {
                    store.updateInspecao(selectedInspecao.id, selectedInspecao);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors border border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                 >
                   Salvar Agendamento
                 </button>
               )}
               
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
                {formType === 'Inspecao' && inspectionStep === 1 && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Checklist Modelo</label>
                      <select 
                        value={inspectionData.checklistId}
                        onChange={(e) => setInspectionData({...inspectionData, checklistId: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                        <option value="">Selecione um modelo...</option>
                        {checklists.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Onde usar (Setor/Área)</label>
                      <input type="text" value={inspectionData.ondeUsar} onChange={(e) => setInspectionData({...inspectionData, ondeUsar: e.target.value})} placeholder="Ex: Produção, Expedição" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Data de Agendamento</label>
                        <input type="date" value={inspectionData.data} onChange={(e) => setInspectionData({...inspectionData, data: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Prioridade</label>
                        <select value={inspectionData.prioridade} onChange={(e) => setInspectionData({...inspectionData, prioridade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none">
                          <option>P1 - Crítica</option>
                          <option>P2 - Moderada</option>
                          <option>P3 - Baixa</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Responsável pela execução</label>
                      <input type="text" value={inspectionData.responsavel} onChange={(e) => setInspectionData({...inspectionData, responsavel: e.target.value})} placeholder="Nome do responsável" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                  </>
                )}

                {formType === 'Inspecao' && inspectionStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-[#0b0c0d] p-3 rounded border border-white/5 mb-4">
                       <h3 className="text-white text-xs font-bold mb-1">Execução do Checklist</h3>
                       <p className="text-[10px] text-gray-400">Classifique os itens. Itens não conformes gerarão risco e ação automaticamente.</p>
                    </div>
                    
                    {checklistItems.map((item, index) => (
                      <div key={item.id} className="bg-[#121415] border border-white/5 p-4 rounded-xl space-y-3">
                         <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-gray-300">{item.sectionTitle}</span>
                         </div>
                         <p className="text-sm text-white leading-relaxed">{item.text}</p>
                         
                         <div className="flex flex-wrap gap-2">
                            {['Conforme', 'Não conforme', 'Não se aplica'].map(statusOption => (
                              <button 
                                key={statusOption}
                                onClick={() => {
                                  const newItems = [...checklistItems];
                                  newItems[index].status = statusOption;
                                  setChecklistItems(newItems);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] border font-bold transition-all ${item.status === statusOption ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                              >
                                {statusOption}
                              </button>
                            ))}
                         </div>

                         {item.status === 'Não conforme' && (
                           <div className="space-y-3 mt-3 pt-3 border-t border-white/5">
                             <div>
                               <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Gravidade do Risco</label>
                               <select 
                                  value={item.gravidade}
                                  onChange={(e) => {
                                    const newItems = [...checklistItems];
                                    newItems[index].gravidade = e.target.value;
                                    setChecklistItems(newItems);
                                  }}
                                  className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 appearance-none">
                                 <option>Baixo</option>
                                 <option>Média</option>
                                 <option>Alta</option>
                                 <option>Crítico</option>
                               </select>
                             </div>

                             <div className="flex gap-4">
                               <div className="flex-1">
                                 <p className="text-[10px] text-gray-400">Prazo sugerido: <span className="font-bold text-white">{getPrazoDias(item.gravidade)} {getPrazoDias(item.gravidade) === 1 ? 'dia (24h)' : 'dias'}</span></p>
                               </div>
                               <div className="flex-1 text-right">
                                 <p className="text-[10px] text-gray-400">Responsável: <span className="font-bold text-white truncate inline-block max-w-[120px] align-bottom">{inspectionData.responsavel || 'Não definido'}</span></p>
                               </div>
                             </div>

                             <div>
                               <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Ação Corretiva Sugerida (Obrigatória)</label>
                               <input 
                                  type="text"
                                  placeholder="Ex: Instalar proteção nas partes móveis..."
                                  value={item.acaoCorretiva || ''}
                                  onChange={(e) => {
                                    const newItems = [...checklistItems];
                                    newItems[index].acaoCorretiva = e.target.value;
                                    setChecklistItems(newItems);
                                  }}
                                  className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                               />
                             </div>

                             <div>
                               <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Observação (Obrigatória)</label>
                               <textarea 
                                  placeholder="Descreva o problema encontrado..."
                                  value={item.observacao}
                                  onChange={(e) => {
                                    const newItems = [...checklistItems];
                                    newItems[index].observacao = e.target.value;
                                    setChecklistItems(newItems);
                                  }}
                                  className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none h-20"
                               ></textarea>
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
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
                {formType === 'Inspecao' && inspectionStep === 1 ? (
                  <button 
                    onClick={() => {
                      if (!inspectionData.checklistId) {
                        alert('Por favor, selecione um checklist modelo antes de avançar.');
                        return;
                      }
                      handleAvancarInspecao();
                    }}
                    className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl text-[11px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50 uppercase tracking-wider"
                  >
                    Avançar
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (formType === 'Inspecao') {
                         const hasErros = checklistItems.some(i => i.status === 'Não conforme' && (!i.observacao?.trim() || !i.acaoCorretiva?.trim()));
                         if (hasErros) {
                           alert('Preencha a observação e a ação corretiva obrigatórias para itens não conformes.');
                           return;
                         }
                         handleSalvarInspecao();
                      } else {
                        setIsFormDrawerOpen(false);
                      }
                    }} 
                    className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl text-[11px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50 uppercase tracking-wider"
                  >
                    Salvar {formType === 'Inspecao' && 'Inspeção'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {cancelModalOpen && selectedInspecao && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCancelModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121826] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${cancelActionType === 'DELETE' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {cancelActionType === 'DELETE' && 'Excluir Inspeção'}
                  {cancelActionType === 'CANCEL' && 'Cancelar Inspeção'}
                  {cancelActionType === 'VOID' && 'Anular Inspeção'}
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  {cancelActionType === 'DELETE' && 'Esta inspeção ainda não gerou histórico. Deseja excluir?'}
                  {cancelActionType === 'CANCEL' && 'A inspeção está em andamento. Forneça o motivo do cancelamento.'}
                  {cancelActionType === 'VOID' && 'Esta inspeção já gerou histórico. Ela não será excluída, apenas anulada com justificativa.'}
                </p>

                {(cancelActionType === 'CANCEL' || cancelActionType === 'VOID') && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivo / Justificativa</label>
                    <textarea 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Descreva o motivo..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                    ></textarea>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setCancelModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors border border-transparent"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      if ((cancelActionType === 'CANCEL' || cancelActionType === 'VOID') && !cancelReason.trim()) {
                        alert('Por favor, forneça o motivo.');
                        return;
                      }

                      if (cancelActionType === 'DELETE') {
                        store.deleteInspecao(selectedInspecao.id);
                      } else if (cancelActionType === 'CANCEL') {
                        store.updateInspecao(selectedInspecao.id, { 
                          ...selectedInspecao, 
                          status: 'Cancelada', 
                          situacao: 'Cancelada',
                          cancelReason,
                          canceledAt: new Date().toISOString(),
                          canceledBy: 'Usuário Atual'
                        });
                      } else if (cancelActionType === 'VOID') {
                        store.updateInspecao(selectedInspecao.id, { 
                          ...selectedInspecao, 
                          status: 'Anulada', 
                          situacao: 'Anulada',
                          cancelReason,
                          canceledAt: new Date().toISOString(),
                          canceledBy: 'Usuário Atual'
                        });

                        // Arquivar riscos
                        const risksToArchive = store.riscos?.filter((r: any) => r.inspection_id === selectedInspecao.id && r.status !== 'Arquivado') || [];
                        risksToArchive.forEach((r: any) => {
                          store.updateRisco?.(r.id, { status: 'Arquivado', archivedReason: cancelReason });
                        });

                        // Cancelar ações abertas
                        const actionsToCancel = store.acoes?.filter((a: any) => a.inspection_id === selectedInspecao.id && a.status !== 'Concluída' && a.status !== 'Cancelada') || [];
                        actionsToCancel.forEach((a: any) => {
                          store.updateAcao?.(a.id, { status: 'Cancelada', cancelReason });
                        });
                      }

                      setCancelModalOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors border ${cancelActionType === 'DELETE' ? 'bg-red-600 hover:bg-red-700 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-orange-600 hover:bg-orange-700 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.3)]'}`}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
