"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { getTodasRegrasAtivas } from '@/lib/normativeRules';
import { getTodosChecklistsAtivos } from '@/lib/normativeChecklists';
import { getNRsAplicaveis } from '@/lib/nrMatrix';
import { NormativeEngine } from '@/lib/engines';
import {
  ClipboardCheck, Clock, FileText, AlertTriangle,
  Download, Plus, Settings as SettingsIcon,
  ShieldAlert, User, ChevronLeft, ChevronRight, X,
  Trash2, Filter, Calendar, CalendarDays, Activity, Power, Play, MoreVertical,
  Zap, LayoutGrid, CheckSquare, Info, ShieldCheck, ListTodo, HardHat, Smartphone,
  TrendingUp, ChevronUp, CheckCircle2, ListChecks, XCircle, ClipboardList, ExternalLink, Share2, MapPin, RefreshCcw,
  PlusCircle, Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import ExecutionView from '../../inspecoes/ExecutionView';
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
  answers?: any[];
  data?: string;
  tipoInspecao?: string;
  observacoes?: string;

  // PESSOA NO CENTRO
  trabalhadoresExpostos?: number;
  perfilExposto?: string;
};

export default function InspecoesPage() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const router = useRouter();
  const { checklists: customChecklists, addInspecao, updateInspecao, addRisco, addAcao, riscos, acoes, rulePackages, organization } = store;
  const checklists = useMemo(() => getTodosChecklistsAtivos(customChecklists), [customChecklists]);

  // Os 5 status operacionais + a aba de Checklists.
  const [activeTab, setActiveTab] = useState<'Hoje' | 'Agendada' | 'EmAndamento' | 'Atrasada' | 'Concluida' | 'Checklists'>('Hoje');
  const [iniciarOpen, setIniciarOpen] = useState(false);
  
  const [drawerMode, setDrawerMode] = useState<'VIEW' | 'EXECUTE' | 'ISSUES' | 'RESCHEDULE' | 'REPORT' | 'CANCEL' | 'CHECKLIST_VIEW' | 'EDIT' | 'REOPEN'>('VIEW');
  const [selectedInspecao, setSelectedInspecao] = useState<Inspecao | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editWarning, setEditWarning] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const canEditField = (field: string, inspecao?: Inspecao | null) => {
    if (!inspecao) return true;
    const status = getResolvedStatus(inspecao);
    const hasAnswers = (inspecao.answers && inspecao.answers.length > 0) || (inspecao.items && inspecao.items.some(i => i.status && i.status !== 'Pendente'));
    
    if (status === 'Concluída') return false;
    
    if (status === 'Em andamento') {
      // Enquanto status = Em andamento: permitir editar apenas: responsável, observações, evidências, continuar checklist
      if (['responsavel', 'observacoes', 'evidencias'].includes(field)) return true;
      return false;
    }
    
    if (status === 'Agendada' || status === 'Atrasada' || status === 'Hoje') {
      // Enquanto status = Agendada: permitir editar: data, responsável, checklist, observações, setor, tipo, se ainda não foi iniciada
      if (hasAnswers) {
         if (['responsavel', 'observacoes', 'data'].includes(field)) return true;
         return false;
      }
      return true;
    }
    
    return true;
  };

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelActionType, setCancelActionType] = useState<'DELETE' | 'CANCEL' | 'VOID'>('DELETE');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formType, setFormType] = useState<'Inspecao' | 'Modelo'>('Inspecao');
  const [formData, setFormData] = useState({ nome: '', ondeUsar: '' });
  
  const [inspectionStep, setInspectionStep] = useState<1 | 2>(1);
  const [inspectionData, setInspectionData] = useState({
    tipoInspecao: '',
    checklistId: '',
    ondeUsar: '',
    data: new Date().toISOString().split('T')[0],
    responsavel: '',
    observacoes: '',
    prioridade: 'Normal',
    trabalhadoresExpostos: 0,
    perfilExposto: ''
  });

  // Checklist Filter Logic for New Inspection Form
  const filteredChecklistsForForm = useMemo(() => {
    const pacotesAtivos = rulePackages.filter(p => p.isActive).map(p => p.name);
    
    const nrsAplicaveis = getNRsAplicaveis({
      segmentoOrganizacao: organization.segmento,
      atividadesCriticas: organization.atividadesCriticas,
      pacotesAtivos: pacotesAtivos
    });
    const nrsAplicaveisIds = nrsAplicaveis.map(nr => nr.id);

    return checklists.filter(checklist =>
      checklist.ativo && (
        checklist.pacote === "Base SST" || 
        (nrsAplicaveisIds.includes(checklist.nr) && pacotesAtivos.includes(checklist.pacote))
      )
    );
  }, [checklists, rulePackages, organization.segmento, organization.atividadesCriticas]);

  const prioridadeCalculada = useMemo(() => {
    const t = inspectionData.tipoInspecao.toLowerCase();
    if (t.includes('altura') || t.includes('elétrica') || t.includes('espaço') || t.includes('confinado') || t.includes('químico') || t.includes('incêndio') || t.includes('fogo')) return 'Alta';
    if (t.includes('máquina') || t.includes('movimentação') || t.includes('carga')) return 'Média';
    return 'Baixa';
  }, [inspectionData.tipoInspecao]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [urlFilter, setUrlFilter] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      setTimeout(() => setUrlFilter(p.get('filter') || ''), 0);
    }
  }, []);

  const normativeDetection = NormativeEngine.detect(formData.nome || '');
  const hojeDateStr = new Date().toISOString().split('T')[0];

  const filterJunk = (items: any[]) => {
    return items.filter(i => {
      const textFields = [i.title, i.titulo, i.descricao, i.name, i.nome, i.atividade, i.nr, i.responsavel, i.category].filter(Boolean).join(' ').toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!i.title && !i.titulo && !i.atividade && !i.nome && !i.name && !i.descricao && !i.category && !i.checklist) return false;
      return true;
    });
  };

  let allInspecoes = [...filterJunk(store.inspecoes || [])].reverse();

  // Resolve em um dos 5 estados operacionais: Agendada, Hoje, Em andamento, Atrasada, Concluída
  const getResolvedStatus = (item: any) => {
    const s = item.status || item.situacao || 'Agendada';
    if (['Concluída', 'Concluído', 'Finalizada', 'Cancelada', 'Anulada', 'Reprovada', 'Reprovado'].includes(s)) return 'Concluída';
    if (s === 'Em andamento') return 'Em andamento';
    const d = item.data || item.proximaInspecao;
    if (!d) return 'Agendada';
    if (d < hojeDateStr) return 'Atrasada';
    if (d === hojeDateStr) return 'Hoje';
    return 'Agendada';
  };

  const getResolvedDate = (item: any) => item.data || item.proximaInspecao;

  // Tenta inferir a NR a partir do checklist, do tipo de inspeção ou dos itens.
  const getResolvedNr = (item: any): string => {
    if (item.nr) return item.nr;
    const text = `${item.tipoInspecao || ''} ${item.checklist || ''}`;
    const m = text.match(/NR[-\s]?(\d+)/i);
    if (m) return `NR-${m[1].padStart(2, '0')}`;
    if (item.items && item.items.length) {
      const it = item.items.find((q: any) => q.nrRelacionada || q.nr);
      if (it) return it.nrRelacionada || it.nr;
    }
    return '—';
  };

  // Conta evidências (de itens da inspeção e das ações vinculadas).
  const getEvidenciasCount = (item: any): number => {
    let count = 0;
    if (item.items && Array.isArray(item.items)) {
      item.items.forEach((q: any) => {
        if (q.evidencia && (typeof q.evidencia === 'string' ? q.evidencia.length > 0 : (Array.isArray(q.evidencia) ? q.evidencia.length : !!q.evidencia))) count++;
        if (q.evidenciaUrl) count++;
      });
    }
    const acoesEvid = (store.acoes || []).filter((a: any) => a.inspection_id === item.id || a.inspecaoId === item.id);
    acoesEvid.forEach((a: any) => {
      if (Array.isArray(a.evidencia)) count += a.evidencia.length;
      else if (a.evidenciaUrl) count++;
    });
    return count;
  };

  const getNCCount = (item: any): number => {
    if (!item.items) return 0;
    return item.items.filter((q: any) => q.status === 'Não' || q.status === 'Parcialmente' || q.isConform === false).length;
  };

  // Cinco "buckets" mutuamente exclusivos para alimentar as abas.
  const inspByStatus = useMemo(() => {
    const groups: Record<string, any[]> = { Hoje: [], Agendada: [], 'Em andamento': [], Atrasada: [], Concluída: [] };
    allInspecoes.forEach(i => {
      const rs = getResolvedStatus(i);
      if (groups[rs]) groups[rs].push(i);
    });
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allInspecoes, hojeDateStr]);

  // Mantemos os antigos `agendadas`/`realizadas` para não quebrar trechos legados.
  const agendadas = useMemo(() => allInspecoes.filter(i => {
    const rs = getResolvedStatus(i);
    return rs === 'Agendada' || rs === 'Em andamento' || rs === 'Atrasada' || rs === 'Hoje';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [allInspecoes, hojeDateStr]);

  const realizadas = useMemo(() => allInspecoes.filter(i => getResolvedStatus(i) === 'Concluída'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [allInspecoes, hojeDateStr]);

  const totalNConformidades = realizadas.reduce((acc, current) => {
    return acc + (current.items?.filter((item: any) => item.status === 'Não' || item.status === 'Parcialmente').length || 0);
  }, 0);

  const totalRiscosRealizadas = store.riscos?.filter((r: any) => 
    realizadas.some(ins => ins.id === r.inspection_id)
  ).length || 0;

  const totalAcoesRealizadas = store.acoes?.filter((a: any) => 
    realizadas.some(ins => ins.id === a.inspection_id)
  ).length || 0;

  const pendentesHoje = agendadas.filter(i => {
    return getResolvedDate(i) === hojeDateStr;
  }).length || 0;

  const emAtraso = agendadas.filter(i => {
    return getResolvedStatus(i) === 'Atrasada';
  }).length || 0;

  const activeExecutions = agendadas.filter(i => {
    return getResolvedStatus(i) === 'Em andamento';
  }).length || 0;

  // Mock data for Checklists tab as per requirements
  const checklistsTabItems = useMemo(() => {
    return checklists.map((c: any) => ({
      ...c,
      tipo: c.regraFixa ? 'Padrão do motor' : 'Personalizado',
      atividade: c.titulo.includes('Altura') ? 'Atividades Críticas' : 'Operação Fabril',
      nr: c.regraFixa ? (c.sections[0]?.questions[0]?.nrRelacionada || 'NR-01') : (c.titulo.includes('Altura') ? 'NR-35' : (c.titulo.includes('Máquinas') ? 'NR-12' : (c.titulo.includes('Elétrica') ? 'NR-10' : 'NR-01'))),
      riscoAuto: true,
      acaoAuto: true,
      impactoScore: c.titulo.includes('Altura') ? 15 : 8,
      perguntasCriticas: c.sections.reduce((acc: any, sec: any) => acc + sec.questions.filter((q: any) => q.riskMap === 'Crítico' || q.riskMap === 'Alta' || q.riskMap === 'Crítica').length, 0),
      totalPerguntas: c.sections.reduce((acc: any, sec: any) => acc + sec.questions.length, 0),
    }));
  }, [checklists]);

  const checklistsStats = useMemo(() => ({
    ativos: checklistsTabItems.filter(c => c.status === 'Ativo').length,
    padraoMotor: checklistsTabItems.filter(c => c.tipo === 'Padrão do motor').length,
    totalPerguntas: checklistsTabItems.reduce((acc, cur) => acc + cur.totalPerguntas, 0),
    nrsVinculadas: new Set(checklistsTabItems.map(c => c.nr)).size
  }), [checklistsTabItems]);

  let listToPaginate: any[] = [];
  if (activeTab === 'Hoje') listToPaginate = inspByStatus['Hoje'];
  else if (activeTab === 'Agendada') listToPaginate = inspByStatus['Agendada'];
  else if (activeTab === 'EmAndamento') listToPaginate = inspByStatus['Em andamento'];
  else if (activeTab === 'Atrasada') listToPaginate = inspByStatus['Atrasada'];
  else if (activeTab === 'Concluida') listToPaginate = inspByStatus['Concluída'];
  else listToPaginate = checklistsTabItems;

  if (urlFilter === 'pendentes' && activeTab !== 'Checklists' && activeTab !== 'Concluida') {
     listToPaginate = listToPaginate.filter((i: any) => getResolvedStatus(i) === 'Atrasada' || getResolvedDate(i) <= hojeDateStr);
  }

  const totalPages = Math.ceil(listToPaginate.length / itemsPerPage) || 1;
  const currentItems = listToPaginate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleOpenDrawer = (item: Inspecao, mode: 'VIEW' | 'EXECUTE' | 'ISSUES' | 'RESCHEDULE' | 'REPORT' | 'CANCEL' | 'EDIT' = 'VIEW') => {
    if (mode === 'REPORT') { alert('Gerar relatório em desenvolvimento.'); return; }
    
    setSelectedInspecao(item);
    
    if (mode === 'EDIT') {
      setInspectionData({
        tipoInspecao: item.tipoInspecao || item.checklist || '',
        checklistId: checklists.find(c => c.titulo === item.checklist)?.id || '',
        ondeUsar: item.ondeUsar || '',
        data: item.data || item.proximaInspecao || '',
        responsavel: item.responsavel || '',
        observacoes: item.observacoes || '',
        prioridade: item.prioridade || 'Normal',
        trabalhadoresExpostos: item.trabalhadoresExpostos || 0,
        perfilExposto: item.perfilExposto || ''
      });
      setIsEditing(true);
      setIsFormDrawerOpen(true);
      return;
    }

    setDrawerMode(mode);
    if (mode === 'EXECUTE') {
      // Update status to 'Em andamento' se ainda não está em execução
      const currentStatus = getResolvedStatus(item);
      if (currentStatus === 'Agendada' || currentStatus === 'Atrasada' || currentStatus === 'Hoje') {
        updateInspecao(item.id, {
          status: 'Em andamento',
          situacao: 'Em andamento'
        });
      }

      if (item.items && item.items.length > 0) {
        setChecklistItems(item.items);
      } else {
        const tempChecklistItems: any[] = [];
        const foundC = checklists.find(c => c.titulo === item.checklist);
        if (foundC) {
          foundC.sections.forEach((sec: any) => {
            sec.questions.forEach((q: any) => {
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

  const handleAvancarInspecao = () => {
    if (formType === 'Inspecao') {
      const selectedModel = checklists.find(c => c.id === (inspectionData.checklistId || checklists[0]?.id));
      if (!selectedModel) return;
      const newItems: any[] = [];
      selectedModel.sections.forEach((sec: any) => {
        sec.questions.forEach((q: any) => {
          newItems.push({ id: q.id, sectionId: sec.id, sectionTitle: sec.title, text: q.text, status: 'Conforme', gravidade: 'Baixo', observacao: '', acaoCorretiva: getAcaoSugerida(q.text), evidencia: '' });
        });
      });
      setChecklistItems(newItems);
      setInspectionStep(2);
    }
  };

   const handleSalvarInspecao = () => {
    if (!inspectionData.tipoInspecao || !inspectionData.ondeUsar || !inspectionData.responsavel || !inspectionData.data || !inspectionData.checklistId) {
      alert("Preencha todos os campos obrigatórios (marcados com *).");
      return;
    }

    const modelo = checklists.find(c => c.id === inspectionData.checklistId)?.titulo || 'Inspeção';
    const dataHoje = new Date().toISOString().split('T')[0];

    if (isEditing && selectedInspecao) {
      const updatedData = {
        tipoInspecao: inspectionData.tipoInspecao,
        checklist: modelo,
        ondeUsar: inspectionData.ondeUsar,
        proximaInspecao: inspectionData.data,
        responsavel: inspectionData.responsavel,
        prioridade: prioridadeCalculada,
        data: inspectionData.data,
        observacoes: inspectionData.observacoes,
        trabalhadoresExpostos: inspectionData.trabalhadoresExpostos,
        perfilExposto: inspectionData.perfilExposto
      };
      updateInspecao(selectedInspecao.id, updatedData);
      setSelectedInspecao({ ...selectedInspecao, ...updatedData });
      setIsEditing(false);
    } else {
      const inspecaoId = Date.now().toString();
      let statusInicial = 'Agendada';
      if (inspectionData.data < dataHoje) statusInicial = 'Atrasada';
      
      const newInspecao = {
        id: inspecaoId,
        tipoInspecao: inspectionData.tipoInspecao,
        checklist: modelo,
        ondeUsar: inspectionData.ondeUsar,
        proximaInspecao: inspectionData.data,
        responsavel: inspectionData.responsavel,
        prioridade: prioridadeCalculada,
        situacao: statusInicial,
        status: statusInicial,
        data: inspectionData.data,
        observacoes: inspectionData.observacoes,
        trabalhadoresExpostos: inspectionData.trabalhadoresExpostos,
        perfilExposto: inspectionData.perfilExposto,
        items: []
      };
      
      addInspecao(newInspecao);
      
      // Auto-select and open view for the new inspection
      setSelectedInspecao(newInspecao);
      setDrawerMode('VIEW');
      setIsDrawerOpen(true);
    }
    
    // Após criar/editar, leva o usuário pra aba que faça mais sentido com a nova data.
    const dataInsp = inspectionData.data;
    if (dataInsp === hojeDateStr) setActiveTab('Hoje');
    else if (dataInsp < hojeDateStr) setActiveTab('Atrasada');
    else setActiveTab('Agendada');
    setIsFormDrawerOpen(false);
  };

  const handleSalvarRascunho = () => {
    const inspecaoId = Date.now().toString();
    const modelo = checklists.find(c => c.id === inspectionData.checklistId)?.titulo || 'Inspeção';
    
    addInspecao({
      id: inspecaoId,
      tipoInspecao: inspectionData.tipoInspecao || 'Nova Inspeção',
      checklist: modelo,
      ondeUsar: inspectionData.ondeUsar || 'Geral',
      proximaInspecao: inspectionData.data || new Date().toISOString().split('T')[0],
      responsavel: inspectionData.responsavel || 'Não definido',
      prioridade: prioridadeCalculada,
      situacao: 'Rascunho',
      status: 'Rascunho',
      data: inspectionData.data || new Date().toISOString().split('T')[0],
      observacoes: inspectionData.observacoes,
      trabalhadoresExpostos: inspectionData.trabalhadoresExpostos,
      perfilExposto: inspectionData.perfilExposto,
      items: []
    });
    
    setIsFormDrawerOpen(false);
  };

  const getStatusStyle = (situacao: string) => {
    switch(situacao) {
      case 'Pendente': return 'text-yellow-500 border-yellow-500/30 bg-transparent';
      case 'Atrasada': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Revisar': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Agendada': return 'text-blue-400 border-blue-500/30 bg-transparent';
      case 'Ativo': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Rascunho': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'Em andamento': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'Em revisão': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'Concluída': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Finalizada': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Arquivado': return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
      case 'Cancelada': return 'text-red-400 border-red-500/30 bg-red-500/10 opacity-70';
      case 'Anulada': return 'text-gray-400 border-gray-500/30 bg-gray-500/10 opacity-70';
      default: return 'text-gray-400 border-gray-500/30 bg-transparent';
    }
  };

  const activeTabMetrics = useMemo(() => {
    const totalInspecoes = store.inspecoes.length;
    let totalNConformidades = 0;
    
    store.inspecoes.forEach(i => {
       if (i.items) {
          i.items.forEach((item: any) => {
             if (item.status === 'Não' || item.status === 'Parcialmente') {
                totalNConformidades++;
             }
          });
       }
    });

    const riscosInspecão = store.riscos.filter(r => r.origem === 'Inspeção / Checklist').length;
    const acoesPendentes = store.acoes.filter(a => a.status === 'Em aberto' || a.status === 'Pendente').length;
    const evidenciasAusentes = store.acoes.filter(a => a.exigeEvidencia && !a.evidenciaUrl).length;

    return {
       totalInspecoes,
       totalNConformidades,
       ncQueGeraramRisco: riscosInspecão,
       acoesPendentes,
       evidenciasAusentes
    };
  }, [store.inspecoes, store.riscos, store.acoes]);

  if (!mounted) return null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#03060e]">
      <motion.div layout className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
        {isDrawerOpen && drawerMode !== 'EXECUTE' && (
           <div 
             className="absolute inset-0 z-30" 
             onClick={() => { setIsDrawerOpen(false); setSelectedChecklist(null); }}
           />
        )}
        <div className="p-4 md:p-6 lg:px-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 shrink-0 mt-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2">
                 <span>Operação</span>
                 <span>&gt;</span>
                 <span className="text-gray-300">Inspeções</span>
                 <span>&gt;</span>
                 <span className="text-purple-400">{activeTab === 'EmAndamento' ? 'Em andamento' : activeTab === 'Concluida' ? 'Concluída' : activeTab}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Inspeções</h1>
              <p className="text-[13px] text-gray-400 mt-1.5 font-medium tracking-wide">
                Planeje, execute e acompanhe inspeções operacionais com geração automática de riscos, ações e conformidade.
              </p>
            </div>
            <div className="flex gap-3 items-center relative">
              <button className="flex items-center gap-2 bg-[#0b0f19] hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border border-white/10 shadow-sm focus:outline-none">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="flex items-center gap-2 bg-[#0b0f19] hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border border-white/10 shadow-sm focus:outline-none">
                <Download className="w-4 h-4" />
                Exportar
              </button>

              {/* Botão secundário: criar nova inspeção (planejamento) */}
              <button
                onClick={() => {
                  setFormType('Inspecao');
                  setInspectionStep(1);
                  setInspectionData({
                    tipoInspecao: '', checklistId: '', ondeUsar: '', data: new Date().toISOString().split('T')[0], responsavel: '', observacoes: '',
                    prioridade: 'Normal', trabalhadoresExpostos: 0, perfilExposto: ''
                  });
                  setChecklistItems([]);
                  setIsEditing(false);
                  setIsFormDrawerOpen(true);
                }}
                className="flex items-center gap-2 bg-[#0b0f19] hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border border-white/10 shadow-sm focus:outline-none"
              >
                <PlusCircle className="w-4 h-4" />
                Nova inspeção
              </button>

              {/* Botão primário: iniciar inspeção pendente */}
              <button
                onClick={() => setIniciarOpen(o => !o)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
              >
                <Play className="w-4 h-4" />
                Iniciar inspeção
                <ChevronUp className={`w-4 h-4 transition-transform ${iniciarOpen ? '' : 'rotate-180'}`} />
              </button>

              {iniciarOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIniciarOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-[420px] bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">Iniciar inspeção</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Escolha uma inspeção pendente para começar agora.</p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {(inspByStatus['Em andamento']?.length || 0) + (inspByStatus['Hoje']?.length || 0) + (inspByStatus['Atrasada']?.length || 0)} pendentes
                      </span>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {(() => {
                        const queue = [
                          ...(inspByStatus['Em andamento'] || []).map((i: any) => ({ i, label: 'Em andamento', tone: 'text-purple-300' })),
                          ...(inspByStatus['Atrasada'] || []).map((i: any) => ({ i, label: 'Atrasada', tone: 'text-red-400' })),
                          ...(inspByStatus['Hoje'] || []).map((i: any) => ({ i, label: 'Hoje', tone: 'text-cyan-300' })),
                          ...(inspByStatus['Agendada'] || []).slice(0, 5).map((i: any) => ({ i, label: 'Agendada', tone: 'text-blue-300' })),
                        ];
                        if (queue.length === 0) {
                          return (
                            <div className="p-8 text-center">
                              <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto mb-3">
                                <ClipboardCheck className="w-6 h-6 text-gray-700" />
                              </div>
                              <p className="text-xs text-gray-500 mb-3">Nenhuma inspeção pendente.</p>
                              <button
                                onClick={() => {
                                  setIniciarOpen(false);
                                  setFormType('Inspecao');
                                  setInspectionStep(1);
                                  setInspectionData({
                                    tipoInspecao: '', checklistId: '', ondeUsar: '', data: new Date().toISOString().split('T')[0], responsavel: '', observacoes: '',
                                    prioridade: 'Normal', trabalhadoresExpostos: 0, perfilExposto: ''
                                  });
                                  setChecklistItems([]);
                                  setIsEditing(false);
                                  setIsFormDrawerOpen(true);
                                }}
                                className="text-[11px] font-bold text-purple-400 hover:text-purple-300"
                              >
                                Criar nova inspeção
                              </button>
                            </div>
                          );
                        }
                        return queue.map(({ i, label, tone }) => (
                          <button
                            key={i.id}
                            onClick={() => { setIniciarOpen(false); handleOpenDrawer(i, 'EXECUTE'); }}
                            className="w-full p-4 flex gap-3 items-start hover:bg-white/5 transition-colors border-b border-white/5 text-left"
                          >
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-white/10 ${tone}`}>
                              <Play className="w-4 h-4" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${tone}`}>{label}</span>
                                <span className="text-[10px] text-gray-500">• {getResolvedNr(i)}</span>
                                <span className="text-[10px] text-gray-500">• {getResolvedDate(i) === hojeDateStr ? 'Hoje' : getResolvedDate(i)}</span>
                              </div>
                              <p className="text-xs font-bold text-gray-200 truncate">{i.tipoInspecao || i.checklist}</p>
                              <p className="text-[11px] text-gray-500 truncate">{i.ondeUsar || 'Setor não definido'} • {i.responsavel || 'Sem responsável'}</p>
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0 mb-6">
            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Inspeções do período</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.totalInspecoes}</div>
                    <span className="text-[11px] text-blue-400 font-medium">Global</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Não conformidades</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.totalNConformidades}</div>
                    <span className="text-[11px] text-red-400 font-medium whitespace-nowrap">Itens reprovados</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Riscos por inspeção</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.ncQueGeraramRisco}</div>
                    <span className="text-[11px] text-orange-400 font-medium uppercase tracking-tight">Auto-gerados</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Ações pendentes</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.acoesPendentes}</div>
                    <span className="text-[11px] text-purple-400 font-medium">Corretivas</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                      <PlusCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Evidências ausentes</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.evidenciasAusentes}</div>
                    <span className="text-[11px] text-gray-400 font-medium">Em falta</span>
                </div>
            </div>
          </div>

          <div className="flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full overflow-x-auto custom-scrollbar gap-1 mb-6">
             {[
               { id: 'Hoje', label: 'Inspeção do dia', icon: <CalendarDays className="w-4 h-4" />, count: inspByStatus['Hoje']?.length || 0, accent: 'text-cyan-400' },
               { id: 'Agendada', label: 'Agendada', icon: <Calendar className="w-4 h-4" />, count: inspByStatus['Agendada']?.length || 0, accent: 'text-blue-400' },
               { id: 'EmAndamento', label: 'Em andamento', icon: <Play className="w-4 h-4" />, count: inspByStatus['Em andamento']?.length || 0, accent: 'text-purple-400' },
               { id: 'Atrasada', label: 'Atrasada', icon: <AlertTriangle className="w-4 h-4" />, count: inspByStatus['Atrasada']?.length || 0, accent: 'text-red-400' },
               { id: 'Concluida', label: 'Concluída', icon: <CheckCircle2 className="w-4 h-4" />, count: inspByStatus['Concluída']?.length || 0, accent: 'text-emerald-400' },
               { id: 'Checklists', label: 'Checklists', icon: <ListChecks className="w-4 h-4" />, count: checklistsTabItems.length || 0, accent: 'text-gray-400' }
             ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); setIsDrawerOpen(false); setIsFormDrawerOpen(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 justify-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${activeTab === tab.id ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' : `bg-white/5 border-white/10 ${tab.accent}`}`}>{tab.count}</span>
                </button>
             ))}
          </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-6">
              
              {activeTab === 'Checklists' && (
                <div className="bg-blue-500/5 border border-blue-500/20 p-3 px-4 rounded-xl flex items-center gap-3 shrink-0">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-[12px] text-blue-200">
                    <span className="font-bold">Os checklists são gerenciados em Configurações.</span> Checklists padrão do motor são essenciais e não podem ser removidos.
                  </p>
                </div>
              )}

              {/* Table */}
            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#121826]/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                    {activeTab === 'Checklists' ? (
                      <tr>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Nome do checklist</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Tipo</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Atividade vinculada</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">NR vinculada</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Total perguntas</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Gera Risco</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Gera Ação</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Status</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 w-24">Ações</th>
                      </tr>
                    ) : (
                      // Tabela unificada para os 5 status (Hoje, Agendada, Em andamento, Atrasada, Concluída).
                      // Inclui os 10 campos pedidos: setor, responsável, checklist, NR, data, status, evidências, NCs, riscos, ações.
                      <tr>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Status</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Tipo de inspeção</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Setor</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Responsável</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Checklist</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">NR</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Data</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 text-center">NCs</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 text-center">Riscos</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 text-center">Ações</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 text-center">Evidências</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 w-32">Operação</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentItems.map((item: any, idx: number) => {
                      if (activeTab === 'Checklists') {
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-200">{item.titulo}</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">{item.category}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.tipo === 'Padrão do motor' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                                {item.tipo}
                              </span>
                            </td>
                            <td className="px-5 py-4"><span className="text-[13px] text-gray-400">{item.atividade}</span></td>
                            <td className="px-5 py-4"><span className="text-[13px] text-blue-400 font-medium">{item.nr}</span></td>
                            <td className="px-5 py-4 text-center"><span className="text-[13px] text-gray-400 font-bold">{item.totalPerguntas}</span></td>
                            <td className="px-5 py-4 text-center">
                              {item.riscoAuto ? <CheckSquare className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-600 mx-auto" />}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {item.acaoAuto ? <CheckSquare className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-600 mx-auto" />}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getStatusStyle(item.status || 'Ativo')}`}>
                                {item.status || 'Ativo'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                 <button 
                                  onClick={() => {
                                    setSelectedChecklist(item);
                                    setDrawerMode('CHECKLIST_VIEW');
                                    setIsDrawerOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                 >Visualizar</button>
                                 <div className="w-[1px] h-3 bg-white/10" />
                                 <button 
                                  onClick={() => router.push('/configuracoes?tab=checklists')}
                                  className="text-[11px] font-bold text-gray-500 hover:text-gray-300 transition-colors"
                                 >Configurações</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const rStatus = getResolvedStatus(item);
                      const rDate = getResolvedDate(item);
                      const rNr = getResolvedNr(item);

                      const itemRiscos = store.riscos?.filter((r: any) => r.inspection_id === item.id || r.inspecaoId === item.id) || [];
                      const itemAcoes = store.acoes?.filter((a: any) => a.inspection_id === item.id || a.inspecaoId === item.id) || [];
                      const itemNCs = getNCCount(item);
                      const itemEvid = getEvidenciasCount(item);

                      const statusIcon = rStatus === 'Concluída' ? <CheckCircle2 className="w-3.5 h-3.5" />
                                       : rStatus === 'Em andamento' ? <Play className="w-3.5 h-3.5" />
                                       : rStatus === 'Atrasada' ? <AlertTriangle className="w-3.5 h-3.5" />
                                       : rStatus === 'Hoje' ? <CalendarDays className="w-3.5 h-3.5" />
                                       : <CheckSquare className="w-3.5 h-3.5" />;
                      const statusStyle = rStatus === 'Hoje'
                        ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
                        : getStatusStyle(rStatus);

                      return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpenDrawer(item, 'VIEW')}>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 w-fit ${statusStyle}`}>
                             {statusIcon}
                             {rStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                             {(item.checklist || '').includes('Altura') || (item.checklist || '').includes('NR-35') ? <Activity className="w-3.5 h-3.5 text-purple-400" /> :
                              (item.checklist || '').includes('Elétrica') || (item.checklist || '').includes('NR-10') ? <Zap className="w-3.5 h-3.5 text-orange-400" /> :
                              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />}
                             <span className="text-[13px] font-bold text-gray-200">{item.tipoInspecao || (item.checklist || '').replace('Checklist ', '')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                             <MapPin className="w-3.5 h-3.5 text-gray-500" />
                             <span className="text-[13px]">{item.ondeUsar || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                              <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 overflow-hidden relative">
                                 <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.responsavel || 'sem'}`} alt="avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                              </div>
                              <span className="text-[13px]">{item.responsavel || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <span className="text-[13px] text-blue-400 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">{item.checklist || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                           <span className={`text-[12px] font-bold px-2 py-0.5 rounded border ${rNr === '—' ? 'text-gray-500 border-white/10 bg-white/5' : 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10'}`}>{rNr}</span>
                        </td>
                        <td className="px-5 py-4">
                           <span className={`text-[13px] font-medium ${rStatus === 'Atrasada' ? 'text-red-400' : 'text-gray-300'}`}>
                              {rDate ? (rDate === hojeDateStr ? 'Hoje' : rDate) : '—'}
                           </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <span className={`text-[13px] font-bold ${itemNCs > 0 ? 'text-red-400' : 'text-gray-500'}`}>{itemNCs}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <span className={`text-[13px] font-bold ${itemRiscos.length > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{itemRiscos.length}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <span className={`text-[13px] font-bold ${itemAcoes.length > 0 ? 'text-purple-400' : 'text-gray-500'}`}>{itemAcoes.length}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <span className={`text-[13px] font-bold inline-flex items-center gap-1 ${itemEvid > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                              <Camera className="w-3.5 h-3.5" /> {itemEvid}
                           </span>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-2">
                             {(rStatus === 'Agendada' || rStatus === 'Hoje') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border-purple-500/30`}
                                >
                                  <Play className="w-3 h-3" /> Iniciar inspeção
                                </button>
                             )}
                             {rStatus === 'Em andamento' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-transparent hover:bg-white/5 text-purple-400 border-purple-500/30`}
                                >
                                  <Play className="w-3 h-3" /> Continuar
                                </button>
                             )}
                             {rStatus === 'Atrasada' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30`}
                                >
                                  <AlertTriangle className="w-3 h-3" /> Iniciar agora
                                </button>
                             )}
                             {rStatus === 'Concluída' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'VIEW'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-transparent hover:bg-white/5 text-emerald-400 border-emerald-500/30`}
                                >
                                  Ver detalhes
                                </button>
                             )}

                             <button className="p-1 hover:text-white text-gray-500 transition-colors focus:outline-none" onClick={(e) => e.stopPropagation()}>
                               <MoreVertical className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                      );
                    })}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan={activeTab === 'Checklists' ? 9 : 12} className="px-5 py-12 text-center text-sm text-gray-500">
                           Nenhuma inspeção encontrada nesta aba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 bg-[#0b0f19]/80 backdrop-blur-md">
                 <span>{((currentPage - 1) * itemsPerPage) + 1} – {Math.min(currentPage * itemsPerPage, listToPaginate.length)} de {listToPaginate.length} inspeções</span>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 rounded bg-transparent border border-transparent hover:text-white transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                       {Array.from({ length: Math.min(5, totalPages || 1) }).map((_, i) => (
                           <button 
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-7 h-7 rounded text-sm flex items-center justify-center ${currentPage === i + 1 ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 font-bold' : 'bg-transparent text-gray-400 border border-transparent hover:bg-white/5 hover:text-white transition-colors'}`}
                           >
                              {i + 1}
                           </button>
                       ))}
                       {totalPages > 5 && <span className="px-1 text-gray-600">...</span>}
                       {totalPages > 5 && (
                          <button 
                             onClick={() => setCurrentPage(totalPages)}
                             className={`w-7 h-7 rounded text-sm flex items-center justify-center ${currentPage === totalPages ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 font-bold' : 'bg-transparent text-gray-400 border border-transparent hover:bg-white/5 hover:text-white transition-colors'}`}
                          >
                             {totalPages}
                          </button>
                       )}
                       <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-2 py-1 rounded bg-transparent border border-transparent hover:text-white transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-2 bg-[#121826] border border-white/10 rounded-lg px-2 h-8">
                       <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-transparent outline-none text-gray-300 font-medium">
                          <option value={10}>10 por página</option>
                          <option value={20}>20 por página</option>
                       </select>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Drawer */}
      <AnimatePresence mode="wait">
        {isDrawerOpen && selectedInspecao && drawerMode === 'EXECUTE' ? (
          <ExecutionView key={`execute-${selectedInspecao.id}`} inspectionId={selectedInspecao.id} onClose={() => setIsDrawerOpen(false)} />
        ) : isDrawerOpen && drawerMode === 'CHECKLIST_VIEW' && selectedChecklist ? (
          <>
           <motion.div 
             initial={{ opacity: 0, width: 0 }} 
             animate={{ opacity: 1, width: 420 }} 
             exit={{ opacity: 0, width: 0 }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="h-full bg-[#121826] border-l border-white/10 shadow-2xl z-40 flex flex-col overflow-hidden shrink-0 relative"
           >
             <div className="w-[420px] h-full flex flex-col pt-safe-top overflow-hidden">
               <div className="p-6 flex justify-between items-start border-b border-white/5 shrink-0 bg-[#0b0f19]">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Detalhes do Checklist</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase inline-block ${selectedChecklist.tipo === 'Padrão do motor' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>{selectedChecklist.tipo}</span>
                    <h2 className="text-xl font-bold text-white leading-snug mt-3">{selectedChecklist.titulo}</h2>
                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{selectedChecklist.nr} • {selectedChecklist.atividade}</p>
                  </div>
                  <button onClick={() => { setIsDrawerOpen(false); setSelectedChecklist(null); }} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-8 pb-32">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Total de perguntas</span>
                        <span className="text-2xl font-black text-white">{selectedChecklist.totalPerguntas}</span>
                     </div>
                     <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Perguntas Críticas</span>
                        <span className="text-2xl font-black text-red-500">{selectedChecklist.perguntasCriticas}</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest border-b border-white/10 pb-2">Configurações Ativas</h4>
                     <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[13px] text-emerald-400 font-medium">Geração de Risco Automático</span>
                     </div>
                     <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span className="text-[13px] text-emerald-400 font-medium">Geração de Ação Automática</span>
                     </div>
                     <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-[13px] text-blue-400 font-medium">Impacto no Score: <span className="font-bold">+{selectedChecklist.impactoScore} pts</span></span>
                     </div>
                    </div>

                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest border-b border-white/10 pb-2">Perguntas Essenciais</h4>
                     <div className="space-y-3">
                        {selectedChecklist.sections[0]?.questions.map((q: any) => (
                          <div key={q.id} className="p-3 bg-black/20 border border-white/5 rounded-xl">
                             <div className="flex items-start gap-3">
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${q.riskMap === 'Crítico' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} />
                                <p className="text-[12px] text-gray-300 leading-relaxed">{q.text}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#121826]/90 backdrop-blur-md space-y-3 shrink-0">
                  {!selectedChecklist.regraFixa ? (
                     <button 
                       onClick={() => router.push('/configuracoes?tab=checklists')}
                       className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors border border-purple-500/50 flex justify-center items-center gap-2"
                     >
                        <SettingsIcon className="w-4 h-4" /> Editar em Configurações
                     </button>
                  ) : (
                     <p className="text-[11px] text-purple-400 font-bold text-center border border-purple-500/20 bg-purple-500/10 py-2 rounded-lg">Checklist padrão do sistema. Não editável.</p>
                  )}
                  <p className="text-[10px] text-gray-500 text-center italic">Checklists padrão do motor são protegidos contra edição direta.</p>
               </div>
             </div>
           </motion.div>
          </>
        ) : isDrawerOpen && selectedInspecao && (
          <>
           <motion.div 
           initial={{ opacity: 0, width: 0 }} 
           animate={{ opacity: 1, width: 420 }} 
           exit={{ opacity: 0, width: 0 }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="h-full bg-[#121826] border-l border-white/10 shadow-2xl z-40 flex flex-col overflow-hidden shrink-0 relative"
         >
           <div className="w-[420px] h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start border-b border-white/5 shrink-0 bg-[#0b0f19]">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Detalhes da inspeção</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase inline-block ${getStatusStyle(selectedInspecao.situacao || 'Agendada')}`}>{selectedInspecao.situacao || 'Agendada'}</span>
                  <h2 className="text-xl font-bold text-white leading-snug mt-3">{selectedInspecao.checklist}</h2>
                  <p className="text-[12px] font-medium text-gray-500 mt-1 uppercase tracking-wider">ID: {selectedInspecao.id.length > 8 ? `I-2025-${selectedInspecao.id.slice(-5)}` : selectedInspecao.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                
                {drawerMode === 'VIEW' && (
                  <>
                  {selectedInspecao.situacao === 'Concluída' ? (
                     <>
                        {/* Painel "Identidade da inspeção" — 10 campos exigidos por inspeção */}
                        {(() => {
                          const insp = selectedInspecao as any;
                          const nr = getResolvedNr(insp);
                          const ncs = getNCCount(insp);
                          const evid = getEvidenciasCount(insp);
                          const riscosGer = (store.riscos || []).filter((r: any) => r.inspection_id === insp.id || r.inspecaoId === insp.id).length;
                          const acoesGer = (store.acoes || []).filter((a: any) => a.inspection_id === insp.id || a.inspecaoId === insp.id).length;
                          return (
                            <div className="bg-[#0b0f19]/80 border border-white/10 rounded-xl p-4 mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[12px] font-bold text-gray-300 uppercase tracking-wider">Identidade da inspeção</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium border uppercase text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Concluída</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                                <div className="flex flex-col"><span className="text-gray-500">Setor</span><span className="font-bold text-white">{insp.ondeUsar || '—'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Responsável</span><span className="font-bold text-white">{insp.responsavel || '—'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Checklist</span><span className="font-bold text-blue-300">{insp.checklist || '—'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">NR relacionada</span><span className={`font-bold ${nr === '—' ? 'text-gray-500' : 'text-indigo-300'}`}>{nr}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Data</span><span className="font-bold text-white">{insp.data || insp.proximaInspecao || '—'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Status</span><span className="font-bold text-emerald-400">Concluída</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Não conformidades</span><span className={`font-bold ${ncs > 0 ? 'text-red-400' : 'text-gray-300'}`}>{ncs}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Riscos gerados</span><span className={`font-bold ${riscosGer > 0 ? 'text-orange-400' : 'text-gray-300'}`}>{riscosGer}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Ações geradas</span><span className={`font-bold ${acoesGer > 0 ? 'text-purple-300' : 'text-gray-300'}`}>{acoesGer}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500">Evidências</span><span className={`font-bold inline-flex items-center gap-1 ${evid > 0 ? 'text-emerald-400' : 'text-gray-300'}`}><Camera className="w-3 h-3" /> {evid}</span></div>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5 mb-6">
                           <div className="flex items-center gap-3 mb-5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                 <TrendingUp className="w-4 h-4 text-indigo-400" />
                              </div>
                              <h4 className="text-[15px] font-bold text-white">Resumo da inspeção</h4>
                           </div>
                           
                           <div className="space-y-3.5">
                              <div className="flex justify-between items-center">
                                 <span className="text-[13px] text-gray-400">Setor</span>
                                 <span className="text-[13px] font-semibold text-white">{selectedInspecao.ondeUsar}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[13px] text-gray-400">Responsável local</span>
                                 <span className="text-[13px] font-semibold text-white">{selectedInspecao.responsavel}</span>
                              </div>
                               <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                  <span className="text-[13px] font-bold text-blue-400 flex items-center gap-2"><User className="w-4 h-4"/> Pessoas expostas</span>
                                  <div className="text-right">
                                     <p className="text-[14px] font-bold text-white">{selectedInspecao.trabalhadoresExpostos || 0} vidas</p>
                                     <p className="text-[10px] text-blue-300">{selectedInspecao.perfilExposto || 'Não especificado'}</p>
                                  </div>
                               </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[13px] text-gray-400">Resultado do checklist</span>
                                 <span className="text-[15px] font-bold text-gray-200">
                                   {selectedInspecao.items && selectedInspecao.items.length > 0
                                     ? Math.round((selectedInspecao.items.filter((i: any) => i.status === 'Sim' || i.status === 'Conforme').length / selectedInspecao.items.filter((i: any) => i.status !== 'N/A').length) * 100)
                                     : 100}%
                                 </span>
                              </div>
                              {(() => {
                                 let impactScore = 0;
                                 let rulesApplied = 0;
                                 const nrsAfetadas = new Set<string>();
                                 if (selectedInspecao.items) {
                                   selectedInspecao.items.forEach((item: any) => {
                                     if ((item.status === 'Não' || item.status === 'Parcialmente') && item.regraFixa) {
                                       rulesApplied++;
                                       if (item.nrRelacionada) nrsAfetadas.add(item.nrRelacionada);
                                       const severity = (item.riskMap || item.severidade || '').toLowerCase();
                                       let penalty = severity === 'crítica' ? 10 : severity === 'alta' ? 5 : severity === 'média' ? 2 : 1;
                                       if (item.status === 'Parcialmente') penalty = penalty / 2;
                                       impactScore -= penalty;
                                     }
                                   });
                                 }
                                 const checklistApproval = selectedInspecao.items && selectedInspecao.items.length > 0
                                     ? Math.round((selectedInspecao.items.filter((i: any) => i.status === 'Sim' || i.status === 'Conforme').length / selectedInspecao.items.filter((i: any) => i.status !== 'N/A').length) * 100)
                                     : 100;
                                 const finalScore = Math.max(0, checklistApproval + impactScore);
                                 return (
                                   <>
                                      <div className="flex justify-between items-center">
                                         <span className="text-[13px] text-gray-400">Score de conformidade</span>
                                         <span className={`text-[15px] font-bold ${finalScore >= 90 ? 'text-emerald-400' : finalScore >= 70 ? 'text-orange-400' : 'text-red-500'}`}>{finalScore.toFixed(1)}%</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                         <span className="text-[13px] text-gray-400">Impacto no score</span>
                                         <span className={`text-[13px] font-bold ${impactScore < 0 ? 'text-red-500' : 'text-emerald-400'}`}>{impactScore < 0 ? `${impactScore.toFixed(1)} pts` : 'Nenhum'}</span>
                                      </div>
                                      {rulesApplied > 0 && (
                                        <div className="bg-[#1e1a30]/50 p-3 mt-2 rounded border border-purple-500/20 text-[12px] text-gray-300 space-y-1">
                                          <p><span className="font-bold text-gray-400">Regras fixas aplicadas:</span> {rulesApplied}</p>
                                          {nrsAfetadas.size > 0 && <p><span className="font-bold text-gray-400">NRs afetadas:</span> {Array.from(nrsAfetadas).join(', ')}</p>}
                                        </div>
                                      )}
                                   </>
                                 );
                              })()}
                              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                 <span className="text-[13px] text-gray-400">Prioridade operacional</span>
                                 <span className="text-[13px] font-bold text-red-500 flex items-center gap-1"><ChevronUp className="w-4 h-4" /> Alta</span>
                              </div>
                              
                              <div className="pt-1 space-y-3">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Calendar className="w-4 h-4 text-indigo-400/70" /> Agendada para</span>
                                    <span className="text-[13px] font-semibold text-white">{selectedInspecao.proximaInspecao || selectedInspecao.data} <span className="text-gray-500 font-normal ml-1">08:30</span></span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4 text-indigo-400/70" /> Iniciada em</span>
                                    <span className="text-[13px] font-semibold text-white">{selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="text-gray-500 font-normal ml-1">14:02</span></span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4 text-indigo-400/70" /> Concluída em</span>
                                    <span className="text-[13px] font-semibold text-white">{selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="text-gray-500 font-normal ml-1">14:48</span></span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {(() => {
                           const inspectionRisks = riscos.filter(r => r.inspection_id === selectedInspecao.id);
                           const inspectionActions = acoes.filter(a => a.item_origem_id === selectedInspecao.id || a.source_id === selectedInspecao.id);
                           const answers = selectedInspecao.answers || [];
                           const nonConformities = answers.filter(a => a.isConform === false).length;
                           const totalQuestions = answers.length || 24; 
                           const conformityScore = totalQuestions > 0 ? Math.round(((totalQuestions - nonConformities) / totalQuestions) * 100) : 100;

                           return (
                              <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5 mb-6">
                                 <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                       <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <h4 className="text-[15px] font-bold text-white">Resultado da auditoria</h4>
                                 </div>
                                 
                                 <div className="mb-4">
                                    <span className={`text-[13px] font-bold flex items-center gap-1.5 ${conformityScore >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                                       {conformityScore >= 80 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} 
                                       Checklist aprovado: {conformityScore}%
                                    </span>
                                 </div>

                                 <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-[#121621] rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                                       <div className="flex items-center gap-2 mb-1">
                                          <ListChecks className="w-4 h-4 text-indigo-400" />
                                          <span className="text-lg font-bold text-white">{totalQuestions}/{totalQuestions}</span>
                                       </div>
                                       <span className="text-[11px] text-gray-400 font-medium">Respondidas</span>
                                    </div>
                                    <div className="bg-[#121621] rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                                       <div className="flex items-center gap-2 mb-1">
                                          <XCircle className="w-4 h-4 text-red-500" />
                                          <span className="text-lg font-bold text-white">{nonConformities}</span>
                                       </div>
                                       <span className="text-[11px] text-gray-400 font-medium">Reprovadas</span>
                                    </div>
                                    <div className="bg-[#121621] rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                                       <div className="flex items-center gap-2 mb-1">
                                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                                          <span className="text-lg font-bold text-white">{inspectionRisks.length}</span>
                                       </div>
                                       <span className="text-[11px] text-gray-400 font-medium">Riscos gerados</span>
                                    </div>
                                    <div className="bg-[#121621] rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                                       <div className="flex items-center gap-2 mb-1">
                                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                          <span className="text-lg font-bold text-white">{inspectionActions.length}</span>
                                       </div>
                                       <span className="text-[11px] text-gray-400 font-medium">Ações geradas</span>
                                    </div>
                                 </div>
                              </div>
                           );
                        })()}

                        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5 mb-6">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                 <ClipboardList className="w-4 h-4 text-indigo-400" />
                              </div>
                              <h4 className="text-[15px] font-bold text-white">Checklist respondido</h4>
                           </div>
                           
                           <div className="flex items-center justify-between border-t border-white/5 pt-4">
                              <div className="flex items-center gap-3">
                                 <FileText className="w-4 h-4 text-gray-400" />
                                 <span className="text-[13px] font-bold text-white">{selectedInspecao.checklist}</span>
                              </div>
                              <button 
                                 onClick={() => setDrawerMode('CHECKLIST_VIEW')}
                                 className="px-4 py-2 bg-[#121621] hover:bg-white/5 text-gray-300 text-[12px] font-medium rounded-lg border border-white/5 transition-colors flex items-center justify-center gap-2">
                                 Visualizar todas as respostas <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </div>

                        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5 mb-6">
                           <div className="flex items-center gap-3 mb-5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                 <Clock className="w-4 h-4 text-indigo-400" />
                              </div>
                              <h4 className="text-[15px] font-bold text-white">Timeline da execução</h4>
                           </div>

                           <div className="relative pl-3 space-y-5 before:content-[''] before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                              <div className="relative pl-6">
                                 <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                 <p className="text-[13px] font-bold text-white">Inspeção criada</p>
                                 <p className="text-[12px] text-gray-500 mt-0.5">{selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="ml-2">11:30</span></p>
                              </div>
                              <div className="relative pl-6">
                                 <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                 <p className="text-[13px] font-bold text-white">Iniciada</p>
                                 <p className="text-[12px] text-gray-500 mt-0.5">{selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="ml-2">14:02</span></p>
                              </div>
                              <div className="relative pl-6">
                                 <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                 <p className="text-[13px] font-bold text-white">Concluída</p>
                                 <p className="text-[12px] text-gray-500 mt-0.5">{selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="ml-2">14:48</span></p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                           <div className="flex items-center gap-2 mb-1">
                              <Share2 className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-[13px] font-semibold text-gray-300">Origem e conectividade</h4>
                           </div>
                           <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-2 gap-y-1">
                              <span className="flex items-center gap-1 text-indigo-400"><Smartphone className="w-3.5 h-3.5" /> APP MOBILE (V2.4.1)</span>
                              <span className="text-gray-700">•</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-600" /> Geo: -23.5505, -46.6333</span>
                              <span className="text-gray-700">•</span>
                              <span className="flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5 text-gray-600" /> Sincronia: Instantânea</span>
                           </div>
                        </div>
                     </>
                  ) : (
                     <>
                     {/* Painel "Identidade da inspeção" — expõe os 10 campos exigidos por inspeção */}
                     {(() => {
                       const insp = selectedInspecao as any;
                       const nr = getResolvedNr(insp);
                       const ncs = getNCCount(insp);
                       const evid = getEvidenciasCount(insp);
                       const riscosGer = (store.riscos || []).filter((r: any) => r.inspection_id === insp.id || r.inspecaoId === insp.id).length;
                       const acoesGer = (store.acoes || []).filter((a: any) => a.inspection_id === insp.id || a.inspecaoId === insp.id).length;
                       const rs = getResolvedStatus(insp);
                       return (
                         <div className="bg-[#0b0f19]/80 border border-white/10 rounded-xl p-4 mb-6">
                           <div className="flex items-center justify-between mb-3">
                             <h4 className="text-[12px] font-bold text-gray-300 uppercase tracking-wider">Identidade da inspeção</h4>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase ${rs === 'Hoje' ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' : getStatusStyle(rs)}`}>{rs}</span>
                           </div>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                             <div className="flex flex-col"><span className="text-gray-500">Setor</span><span className="font-bold text-white">{insp.ondeUsar || '—'}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Responsável</span><span className="font-bold text-white">{insp.responsavel || '—'}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Checklist</span><span className="font-bold text-blue-300">{insp.checklist || '—'}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">NR relacionada</span><span className={`font-bold ${nr === '—' ? 'text-gray-500' : 'text-indigo-300'}`}>{nr}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Data</span><span className="font-bold text-white">{insp.data || insp.proximaInspecao || '—'}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Status</span><span className="font-bold text-white">{rs}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Não conformidades</span><span className={`font-bold ${ncs > 0 ? 'text-red-400' : 'text-gray-300'}`}>{ncs}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Riscos gerados</span><span className={`font-bold ${riscosGer > 0 ? 'text-orange-400' : 'text-gray-300'}`}>{riscosGer}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Ações geradas</span><span className={`font-bold ${acoesGer > 0 ? 'text-purple-300' : 'text-gray-300'}`}>{acoesGer}</span></div>
                             <div className="flex flex-col"><span className="text-gray-500">Evidências</span><span className={`font-bold inline-flex items-center gap-1 ${evid > 0 ? 'text-emerald-400' : 'text-gray-300'}`}><Camera className="w-3 h-3" /> {evid}</span></div>
                           </div>
                         </div>
                       );
                     })()}

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2 flex items-center justify-between">
                           Resumo da inspeção
                           {selectedInspecao.situacao === 'Concluída' && (
                             <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Auditada</span>
                           )}
                         </h4>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Setor</span>
                              <span className="text-[13px] font-medium text-white">{selectedInspecao.ondeUsar}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Responsável local</span>
                              <span className="text-[13px] font-medium text-white">{selectedInspecao.responsavel}</span>
                           </div>
                           <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                              <span className="text-[13px] font-bold text-blue-400 flex items-center gap-2"><User className="w-4 h-4"/> Pessoas expostas</span>
                              <div className="text-right">
                                 <p className="text-[14px] font-bold text-white">{selectedInspecao.trabalhadoresExpostos || 0} vidas</p>
                                 <p className="text-[10px] text-blue-300">{selectedInspecao.perfilExposto || 'Não especificado'}</p>
                              </div>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Prioridade operacional</span>
                              <span className="text-[13px] font-bold text-red-500 flex items-center gap-1"><ChevronUp className="w-3.5 h-3.5 -rotate-90" /> Alta</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Agendada para</span>
                              <span className="text-[13px] font-medium text-white flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-500" /> {selectedInspecao.proximaInspecao || selectedInspecao.data} <span className="opacity-50">08:30</span></span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Criada em</span>
                              <span className="text-[13px] font-medium text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> {selectedInspecao.data || selectedInspecao.proximaInspecao} <span className="opacity-50">14:02</span></span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">Checklist respondido</h4>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                           <div className="flex items-center gap-3 mb-2">
                              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20"><ClipboardCheck className="w-4 h-4" /></div>
                              <span className="text-sm font-bold text-white">{selectedInspecao.checklist}</span>
                           </div>
                           
                           <p className="text-[12px] text-gray-500 leading-relaxed mt-2">Este checklist será utilizado na execução desta inspeção.</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">Observações</h4>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 min-h-[80px]">
                           <p className="text-[12px] text-gray-400 leading-relaxed">Inspeção programada para início do turno. Validar EPCs, linha de vida, ancoragem e treinamento NR-35.</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2 uppercase tracking-wide text-[11px] text-gray-500">Timeline da execução</h4>
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                          <div className="relative">
                            <div className="absolute left-[-23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#121826]"></div>
                            <p className="text-[13px] font-bold text-white">Inspeção criada</p>
                            <p className="text-[11px] text-gray-500">{selectedInspecao.data || selectedInspecao.proximaInspecao} — 11:30</p>
                          </div>
                          {selectedInspecao.situacao === 'Em andamento' && (
                             <div className="relative">
                                <div className="absolute left-[-23px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121826]"></div>
                                <p className="text-[13px] font-bold text-white">Iniciada</p>
                                <p className="text-[11px] text-gray-500">{selectedInspecao.data || selectedInspecao.proximaInspecao} — 14:02</p>
                             </div>
                          )}
                        </div>
                     </div>
                     </>
                  )}
                  </>
                )}
                {/* Execute and Cancel logics would go here as they already exist */}
             </div>

             <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#121826]/90 backdrop-blur-md space-y-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
               {drawerMode === 'VIEW' && (
                  <>
                     <div className="flex flex-col gap-4">
                        {selectedInspecao.situacao === 'Concluída' ? (
                           <>
                              <button 
                                onClick={() => setDrawerMode('CHECKLIST_VIEW')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_15px_40px_rgba(79,70,229,0.3)] border border-indigo-500/50 active:scale-95 group"
                              >
                                <FileText className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                Ver Relatório
                              </button>
                           </>
                        ) : (
                           <>
                              <button 
                                onClick={() => handleOpenDrawer(selectedInspecao, 'EXECUTE')}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_15px_40px_rgba(124,58,237,0.3)] border border-purple-500/50 active:scale-95 group"
                              >
                                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                {getResolvedStatus(selectedInspecao) === 'Em andamento' ? 'Continuar auditoria' : 'Iniciar auditoria'}
                              </button>
                           </>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                           {selectedInspecao.situacao === 'Concluída' ? (
                              <button 
                                onClick={() => setDrawerMode('REOPEN')}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border border-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" /> Reabrir Inspeção
                              </button>
                           ) : (
                              <button 
                                onClick={() => handleOpenDrawer(selectedInspecao, 'EDIT')}
                                className="bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                              >
                                <SettingsIcon className="w-3.5 h-3.5" /> Editar
                              </button>
                           )}

                           <button className="bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95">
                             <Download className="w-3.5 h-3.5" /> Laudo
                           </button>
                        </div>
                     </div>
                  </>
               )}
               {drawerMode === 'REOPEN' && (
                  <div className="flex flex-col gap-4">
                     <p className="text-[13px] text-gray-300">Tem certeza que deseja reabrir esta inspeção? Informe o motivo abaixo.</p>
                     <textarea 
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Ex: Faltou registrar foto da evidência."
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[13px] text-white focus:border-red-500/50 outline-none resize-none h-[80px]"
                     />
                     <div className="grid grid-cols-2 gap-3 mt-2">
                        <button 
                           onClick={() => setDrawerMode('VIEW')}
                           className="bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border border-white/10 transition-all flex items-center justify-center"
                        >
                           Cancelar
                        </button>
                        <button 
                           onClick={() => {
                              // Perform reopen action here
                              setIsDrawerOpen(false);
                           }}
                           className="bg-red-500/90 hover:bg-red-500 text-white py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border border-red-500 transition-all flex items-center justify-center gap-2"
                        >
                           Confirmar
                        </button>
                     </div>
                  </div>
               )}
             </div>
           </div>
         </motion.div>
         </>
        )}

        {isFormDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFormDrawerOpen(false)} />
             <div className="bg-[#121826] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col p-8 max-h-[90vh]">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Inspeção' : 'Nova Inspeção'}</h2>
                    <p className="text-[13px] text-gray-400 mt-1">{isEditing ? 'Atualize os dados desta inspeção.' : 'Cadastre uma nova inspeção operacional e vincule um checklist para execução.'}</p>
                  </div>
                  <button onClick={() => { setIsFormDrawerOpen(false); setIsEditing(false); }} className="text-gray-500 hover:text-white p-1 rounded-md transition-colors border border-transparent hover:border-white/10"><X className="w-5 h-5" /></button>
                </div>
                
                {isEditing && selectedInspecao?.situacao === 'Em andamento' && (
                   <div className="mb-6 bg-orange-500/10 border border-orange-500/20 p-3 px-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                      <p className="text-[12px] text-orange-200">
                        Esta inspeção já foi iniciada. Para preservar a rastreabilidade, tipo, setor e checklist não podem ser alterados.
                      </p>
                   </div>
                 )}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Tipo de inspeção <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         placeholder="Ex: Trabalho em altura" disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                         value={inspectionData.tipoInspecao} 
                         onChange={(e) => {
                           const val = e.target.value;
                           let newChecklistId = inspectionData.checklistId;
                           if (val.trim().length > 3) {
                             const search = val.toLowerCase();
                             const match = checklists.find(c => c.titulo.toLowerCase().includes(search) || search.includes(c.titulo.toLowerCase().replace('checklist', '').trim()));
                             if (match) newChecklistId = match.id;
                           }
                           setInspectionData({...inspectionData, tipoInspecao: val, checklistId: newChecklistId});
                         }}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Checklist vinculado <span className="text-red-500">*</span></label>
                       <select 
                         value={inspectionData.checklistId} disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'} 
                         onChange={(e) => setInspectionData({...inspectionData, checklistId: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors"
                       >
                         <option value="">Selecione um modelo</option>
                         {filteredChecklistsForForm
                           .slice()
                           .sort((a, b) => {
                             const numA = parseInt((a.nr || '').replace(/\D/g, '')) || 99;
                             const numB = parseInt((b.nr || '').replace(/\D/g, '')) || 99;
                             return numA - numB;
                           })
                           .map((c) => (
                             <option key={c.id} value={c.id}>
                               {c.nr ? `${c.nr} — ${c.titulo || c.name}` : (c.titulo || c.name)}
                             </option>
                           ))
                         }
                       </select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Setor <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         placeholder="Ex: Produção" disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                         value={inspectionData.ondeUsar} 
                         onChange={(e) => setInspectionData({...inspectionData, ondeUsar: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Responsável <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         placeholder="Nome do responsável"
                         value={inspectionData.responsavel} 
                         onChange={(e) => setInspectionData({...inspectionData, responsavel: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Data da inspeção <span className="text-red-500">*</span></label>
                       <input 
                         type="date" disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'} 
                         value={inspectionData.data} 
                         onChange={(e) => setInspectionData({...inspectionData, data: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Prioridade operacional</label>
                       <div className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold flex items-center justify-between text-gray-400">
                          {prioridadeCalculada}
                          {prioridadeCalculada === 'Alta' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                       </div>
                       <p className="text-[10px] text-gray-500 ml-1 mt-1">Preenchimento automático via regras de negócio.</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Qtd. Trabalhadores Expostos Na Área</label>
                       <input 
                         type="number" min="0" placeholder="0" disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                         value={inspectionData.trabalhadoresExpostos} 
                         onChange={(e) => setInspectionData({...inspectionData, trabalhadoresExpostos: parseInt(e.target.value) || 0})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Perfil Exposto (Função/Cargo)</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Eletricistas, Montadores" disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                         value={inspectionData.perfilExposto} 
                         onChange={(e) => setInspectionData({...inspectionData, perfilExposto: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                       />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <div className="flex justify-between items-end">
                        <label className="text-[13px] font-bold text-gray-300">Observações <span className="text-gray-500 font-normal">(Opcional)</span></label>
                        <span className={`text-[10px] ${inspectionData.observacoes.length > 500 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{inspectionData.observacoes.length}/500</span>
                     </div>
                     <textarea 
                       placeholder="Detalhes adicionais sobre a inspeção..."
                       rows={3}
                       maxLength={500}
                       value={inspectionData.observacoes} 
                       onChange={(e) => setInspectionData({...inspectionData, observacoes: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors resize-none placeholder:text-gray-600 custom-scrollbar"
                     />
                   </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/5">
                   <button onClick={() => { setIsFormDrawerOpen(false); setIsEditing(false); }} className="px-5 py-2.5 rounded-xl border border-transparent text-gray-400 hover:text-white hover:bg-white/5 text-[13px] font-bold transition-colors">Cancelar</button>
                   {!isEditing && <button onClick={handleSalvarRascunho} className="px-5 py-2.5 rounded-xl border border-white/10 bg-transparent text-gray-300 hover:bg-white/5 text-[13px] font-bold transition-colors">Salvar rascunho</button>}
                   <button onClick={handleSalvarInspecao} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50 text-[13px] font-bold transition-colors flex items-center gap-2">
                     {isEditing ? <CheckSquare className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isEditing ? 'Salvar alterações' : 'Gerar inspeção'}
                   </button>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
