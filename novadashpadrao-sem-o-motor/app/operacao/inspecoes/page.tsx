"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { getTodosChecklistsAtivos } from '@/lib/normativeChecklists';
import { adaptTargetInspectionPayload } from '@/lib/motor/adapters/inspectionsAdapter.js';
import { 
  ClipboardCheck, Clock, FileText, AlertTriangle, 
  Download, Plus, Settings as SettingsIcon, 
  ShieldAlert, User, ChevronLeft, ChevronRight, X,
  Trash2, Filter, Calendar, Activity, Power, Play, MoreVertical,
  Zap, LayoutGrid, CheckSquare, Info, ShieldCheck, ListTodo, HardHat, Smartphone,
  TrendingUp, ChevronUp, CheckCircle2, ListChecks, XCircle, ClipboardList, ExternalLink, Share2, MapPin, RefreshCcw,
  PlusCircle
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

function getChecklistTitle(checklist: any) {
  return checklist?.titulo || checklist?.title || checklist?.name || checklist?.nome || checklist?.nr || 'Checklist';
}

function getChecklistSections(checklist: any) {
  return Array.isArray(checklist?.sections) ? checklist.sections : [];
}

function getChecklistNr(checklist: any) {
  return (
    checklist?.nr ||
    checklist?.nrRelacionada ||
    checklist?.sections?.[0]?.questions?.[0]?.nrRelacionada ||
    checklist?.sections?.[0]?.questions?.[0]?.nr || ''
  );
}

function getChecklistQuestions(checklist: any) {
  return getChecklistSections(checklist).flatMap((section: any) =>
    Array.isArray(section?.questions) ? section.questions : []
  );
}

function buildChecklistIdFallback(checklist: any, index = 0) {
  const seed = getChecklistTitle(checklist)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return checklist?.id || `checklist-${seed || index}-${index}`;
}

function normalizeChecklistQuestion(question: any, sectionId: string, index: number) {
  return {
    ...question,
    id: question?.id || `${sectionId}-question-${index}`,
    text: question?.text || question?.titulo || question?.label || `Pergunta ${index + 1}`,
    type: question?.type || 'boolean',
  };
}

function normalizeChecklistSectionsForUi(checklist: any) {
  const sourceSections = Array.isArray(checklist?.sections)
    ? checklist.sections
    : Array.isArray(checklist?.perguntas)
      ? [{ id: `${buildChecklistIdFallback(checklist)}-section-0`, title: 'Itens de verificação', questions: checklist.perguntas }]
      : [];

  return sourceSections.map((section: any, index: number) => {
    const sectionId = section?.id || `${buildChecklistIdFallback(checklist)}-section-${index}`;
    const questions = Array.isArray(section?.questions)
      ? section.questions
      : Array.isArray(section?.itens)
        ? section.itens
        : [];

    return {
      ...section,
      id: sectionId,
      title: section?.title || section?.titulo || `Seção ${index + 1}`,
      questions: questions.map((question: any, questionIndex: number) =>
        normalizeChecklistQuestion(question, sectionId, questionIndex),
      ),
    };
  });
}

function normalizeChecklistForUi(checklist: any, index: number) {
  const normalizedSections = normalizeChecklistSectionsForUi(checklist);
  return {
    ...checklist,
    id: buildChecklistIdFallback(checklist, index),
    titulo: getChecklistTitle(checklist),
    title: checklist?.title || getChecklistTitle(checklist),
    name: checklist?.name || getChecklistTitle(checklist),
    status: checklist?.status || (checklist?.ativo === false ? 'Inativo' : 'Ativo'),
    ativo: checklist?.ativo !== false,
    category: checklist?.category || getChecklistNr(checklist) || 'Base SST',
    atividade: checklist?.atividade || getChecklistActivityLabel(checklist),
    pacote: checklist?.pacote || checklist?.package || getChecklistPackage(checklist),
    sections: normalizedSections,
  };
}

function buildChecklistExecutionItems(checklist: any, getAcaoSugerida: (question: string) => string) {
  return getChecklistSections(checklist).flatMap((section: any) =>
    (section?.questions || []).map((question: any) => ({
      id: question.id,
      sectionId: section.id,
      sectionTitle: section.title,
      text: question.text,
      status: 'Conforme',
      gravidade: 'Baixo',
      observacao: '',
      acaoCorretiva: getAcaoSugerida(question.text),
      evidencia: '',
    })),
  );
}

function getChecklistPackage(checklist: any) {
  return checklist?.pacote || checklist?.package || checklist?.group || 'Base SST';
}

function getChecklistActivityLabel(checklist: any) {
  return (
    checklist?.atividade ||
    checklist?.ondeUsar ||
    checklist?.area ||
    checklist?.segmento ||
    checklist?.category ||
    getChecklistPackage(checklist) ||
    'Nao classificado'
  );
}

function normalizeLookupToken(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getChecklistActivities(checklist: any) {
  const directActivities = Array.isArray(checklist?.atividades) ? checklist.atividades : [];
  const fallbackValues = [
    checklist?.atividade,
    checklist?.ondeUsar,
    checklist?.area,
    checklist?.segmento,
    getChecklistActivityLabel(checklist),
  ];

  return Array.from(new Set([...directActivities, ...fallbackValues].map((value) => String(value || '').trim()).filter(Boolean)));
}

function getChecklistPackageLabel(checklist: any) {
  return checklist?.pacote || checklist?.package || 'Base SST';
}

function getInspectionPriorityFromSource(activity: string, checklist?: any) {
  const checklistSeverity = normalizeLookupToken(checklist?.criticidadePadrao || checklist?.priority || checklist?.prioridade);
  if (checklistSeverity.includes('crit') || checklistSeverity.includes('alta')) return 'Alta';
  if (checklistSeverity.includes('med')) return 'Média';
  if (checklistSeverity.includes('baix')) return 'Baixa';

  const t = normalizeLookupToken(activity);
  if (t.includes('altura') || t.includes('eletric') || t.includes('espaco') || t.includes('confinado') || t.includes('quimic') || t.includes('incendio') || t.includes('fogo') || t.includes('hospital') || t.includes('biologico')) return 'Alta';
  if (t.includes('maquina') || t.includes('movimentacao') || t.includes('carga') || t.includes('manutencao') || t.includes('construcao')) return 'Média';
  return 'Baixa';
}

function getChecklistCriticalCount(checklist: any) {
  return getChecklistQuestions(checklist).filter((question: any) =>
    ['Crítico', 'Crítica', 'Alta'].includes(question?.riskMap),
  ).length;
}

function hasChecklistRiskAutomation(checklist: any) {
  return getChecklistQuestions(checklist).some((question: any) =>
    Boolean(question?.riskMap || question?.nr || question?.nrRelacionada || question?.regraId),
  );
}

function hasChecklistActionAutomation(checklist: any) {
  return getChecklistQuestions(checklist).some((question: any) =>
    Boolean(question?.acaoSugerida || question?.actionSuggestion || question?.riskMap),
  );
}

function getChecklistImpactScore(checklist: any) {
  return Math.max(0, getChecklistCriticalCount(checklist) * 2);
}

function getInspectionChecklistLabel(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'Checklist';
}

function getInspectionQuestions(item: any) {
  if (Array.isArray(item?.items)) return item.items;
  if (Array.isArray(item?.answers)) return item.answers;
  return [];
}

function getInspectionAnsweredItems(item: any) {
  return getInspectionQuestions(item).filter((question: any) => question?.status && question.status !== 'Pendente');
}

function getInspectionApprovedItems(item: any) {
  return getInspectionQuestions(item).filter((question: any) =>
    ['Sim', 'Conforme', 'N/A'].includes(question?.status),
  );
}

function getInspectionConformityScore(item: any) {
  const relevantItems = getInspectionQuestions(item).filter((question: any) => question?.status !== 'N/A');
  if (relevantItems.length === 0) return 0;
  const approvedItems = relevantItems.filter((question: any) => ['Sim', 'Conforme'].includes(question?.status));
  return Math.round((approvedItems.length / relevantItems.length) * 100);
}

function getInspectionPriorityLabel(item: any) {
  return item?.prioridade || item?.priority || 'Nao definida';
}

function formatInspectionDate(value?: string) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR');
}

function findChecklistForInspection(item: any, checklistList: any[]) {
  return checklistList.find((checklist: any) =>
    checklist?.id === item?.checklistId ||
    getChecklistTitle(checklist) === item?.checklist ||
    getChecklistTitle(checklist) === item?.tipoInspecao,
  );
}

export default function InspecoesPage() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const router = useRouter();
  const { checklists: customChecklists, addInspecao, updateInspecao, riscos, acoes, sectors, users, rulePackages } = store;
  const checklists = useMemo(
    () => getTodosChecklistsAtivos(customChecklists).map((checklist: any, index: number) => normalizeChecklistForUi(checklist, index)),
    [customChecklists],
  );
  const activePackageNames = useMemo(() => {
    const names = (rulePackages || []).filter((pkg: any) => pkg?.isActive).map((pkg: any) => pkg.name);
    return Array.from(new Set(['Base SST', ...names]));
  }, [rulePackages]);
  const eligibleChecklists = useMemo(() => {
    return checklists.filter((checklist: any) => {
      if (checklist.ativo === false || checklist.status === 'Inativo') return false;
      const packageName = getChecklistPackageLabel(checklist);
      return packageName === 'Base SST' || activePackageNames.includes(packageName);
    });
  }, [checklists, activePackageNames]);
  const inspectionActivityOptions = useMemo(() => {
    const activityMap = new Map<string, { activity: string; checklistId: string; checklistTitle: string; pacote: string; priority: string }>();

    eligibleChecklists.forEach((checklist: any) => {
      getChecklistActivities(checklist).forEach((activity) => {
        const token = normalizeLookupToken(activity);
        if (!token || activityMap.has(token)) return;
        activityMap.set(token, {
          activity,
          checklistId: checklist.id,
          checklistTitle: getChecklistTitle(checklist),
          pacote: getChecklistPackageLabel(checklist),
          priority: getInspectionPriorityFromSource(activity, checklist),
        });
      });
    });

    return Array.from(activityMap.values()).sort((left, right) => left.activity.localeCompare(right.activity, 'pt-BR'));
  }, [eligibleChecklists]);
  const sectorOptions = useMemo(
    () => (sectors || []).map((sector: any) => sector?.name).filter(Boolean),
    [sectors],
  );
  const responsibleOptions = useMemo(
    () => (users || []).filter((user: any) => user?.status !== 'Inativo').map((user: any) => user?.name).filter(Boolean),
    [users],
  );

  const [activeTab, setActiveTab] = useState<'Todas' | 'Em andamento' | 'Agendadas' | 'Realizadas' | 'Checklists'>('Todas');
  
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
    
    if (status === 'Agendada' || status === 'Atrasada') {
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
  const selectedInspectionActivityPreset = useMemo(() => {
    const selectedToken = normalizeLookupToken(inspectionData.tipoInspecao);
    return inspectionActivityOptions.find((option) => normalizeLookupToken(option.activity) === selectedToken) || null;
  }, [inspectionActivityOptions, inspectionData.tipoInspecao]);

  const filteredChecklistsForForm = useMemo(() => {
    if (!inspectionData.tipoInspecao) return eligibleChecklists;
    const selectedToken = normalizeLookupToken(inspectionData.tipoInspecao);
    return eligibleChecklists.filter((checklist) =>
      getChecklistActivities(checklist).some((activity) => normalizeLookupToken(activity) === selectedToken),
    );
  }, [eligibleChecklists, inspectionData.tipoInspecao]);

  const prioridadeCalculada = useMemo(() => {
    if (selectedInspectionActivityPreset?.priority) return selectedInspectionActivityPreset.priority;
    const selectedChecklist = eligibleChecklists.find((checklist: any) => checklist.id === inspectionData.checklistId);
    return getInspectionPriorityFromSource(inspectionData.tipoInspecao, selectedChecklist);
  }, [selectedInspectionActivityPreset, eligibleChecklists, inspectionData.checklistId, inspectionData.tipoInspecao]);
  const buildInspectionFormState = (
    activity: string,
    baseState?: typeof inspectionData,
  ) => {
    const preset =
      inspectionActivityOptions.find((option) => option.activity === activity) ||
      inspectionActivityOptions.find((option) => normalizeLookupToken(option.activity) === normalizeLookupToken(activity)) ||
      null;

    const fallbackState = baseState || inspectionData;
    const selectedChecklist = eligibleChecklists.find((checklist: any) => checklist.id === preset?.checklistId) || null;

    return {
      ...fallbackState,
      tipoInspecao: preset?.activity || activity,
      checklistId: preset?.checklistId || '',
      prioridade:
        preset?.priority ||
        getInspectionPriorityFromSource(preset?.activity || activity, selectedChecklist) ||
        fallbackState.prioridade ||
        'Baixa',
    };
  };
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [urlFilter, setUrlFilter] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      setTimeout(() => setUrlFilter(p.get('filter') || ''), 0);
    }
  }, []);

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

  const getResolvedStatus = (item: any) => {
    const s = item.status || item.situacao || 'Agendada';
    if (['Concluída', 'Concluído', 'Finalizada', 'Cancelada', 'Anulada', 'Reprovada', 'Reprovado'].includes(s)) return 'Concluída';
    if (s === 'Em andamento') return 'Em andamento';
    const d = item.data || item.proximaInspecao;
    if (d < hojeDateStr) return 'Atrasada';
    return 'Agendada';
  };

  const getResolvedDate = (item: any) => item.data || item.proximaInspecao;

  const todas = allInspecoes.filter(i => {
    const rs = getResolvedStatus(i);
    return rs === 'Agendada' || rs === 'Em andamento' || rs === 'Atrasada';
  });

  const emAndamento = allInspecoes.filter(i => {
    return getResolvedStatus(i) === 'Em andamento';
  });

  const agendadas = allInspecoes.filter(i => {
    return getResolvedStatus(i) === 'Agendada';
  });

  const atrasadas = allInspecoes.filter(i => {
    return getResolvedStatus(i) === 'Atrasada';
  });

  const realizadas = allInspecoes.filter(i => {
    const rs = getResolvedStatus(i);
    return rs === 'Concluída';
  });

  const totalNConformidades = realizadas.reduce((acc, current) => {
    return acc + (current.items?.filter((item: any) => item.status === 'Não' || item.status === 'Parcialmente').length || 0);
  }, 0);

  const totalRiscosRealizadas = store.riscos?.filter((r: any) => 
    realizadas.some(ins => ins.id === r.inspection_id)
  ).length || 0;

  const totalAcoesRealizadas = store.acoes?.filter((a: any) => 
    realizadas.some(ins => ins.id === a.inspection_id)
  ).length || 0;

  const pendentesHoje = todas.filter(i => {
    return getResolvedDate(i) === hojeDateStr;
  }).length || 0;

  const emAtraso = atrasadas.length || 0;

  const activeExecutions = emAndamento.length || 0;

  const checklistsTabItems = useMemo(() => {
    return checklists.map((c: any) => ({
      ...c,
      titulo: getChecklistTitle(c),
      tipo: c.regraFixa ? 'Padrão do motor' : 'Personalizado',
      atividade: getChecklistActivityLabel(c),
      nr: getChecklistNr(c) || 'Sem NR',
      riscoAuto: hasChecklistRiskAutomation(c),
      acaoAuto: hasChecklistActionAutomation(c),
      impactoScore: getChecklistImpactScore(c),
      perguntasCriticas: getChecklistCriticalCount(c),
      totalPerguntas: getChecklistQuestions(c).length,
    }));
  }, [checklists]);

  const checklistsStats = useMemo(() => ({
    ativos: checklistsTabItems.filter(c => c.status === 'Ativo').length,
    padraoMotor: checklistsTabItems.filter(c => c.tipo === 'Padrão do motor').length,
    totalPerguntas: checklistsTabItems.reduce((acc, cur) => acc + cur.totalPerguntas, 0),
    nrsVinculadas: new Set(checklistsTabItems.map(c => c.nr)).size
  }), [checklistsTabItems]);

  let listToPaginate: any[] = [];
  if (activeTab === 'Todas') {
    listToPaginate = todas;
  } else if (activeTab === 'Em andamento') {
    listToPaginate = emAndamento;
  } else if (activeTab === 'Agendadas') {
    listToPaginate = agendadas;
  } else if (activeTab === 'Realizadas') {
    listToPaginate = realizadas;
  } else {
    listToPaginate = checklistsTabItems;
  }

  if (urlFilter === 'pendentes' && activeTab === 'Todas') {
     listToPaginate = listToPaginate.filter(i => getResolvedStatus(i) === 'Atrasada' || getResolvedDate(i) <= hojeDateStr);
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
        checklistId: item.checklistId || checklists.find(c => getChecklistTitle(c) === item.checklist)?.id || '',
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
      // Update status to 'Em andamento' if it was 'Agendada' or 'Atrasada'
      const currentStatus = getResolvedStatus(item);
      if (currentStatus === 'Agendada' || currentStatus === 'Atrasada') {
        updateInspecao(item.id, { 
          status: 'Em andamento',
          situacao: 'Em andamento'
        });
      }

      if (item.items && item.items.length > 0) {
        setChecklistItems(item.items);
      } else {
        const tempChecklistItems: any[] = [];
      const foundC = checklists.find(c => c.id === item.checklistId) || checklists.find(c => getChecklistTitle(c) === item.checklist);
      if (foundC) {
          tempChecklistItems.push(...buildChecklistExecutionItems(foundC, getAcaoSugerida));
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
      const newItems = buildChecklistExecutionItems(selectedModel, getAcaoSugerida);
      if (newItems.length === 0) {
        alert('O checklist selecionado ainda não possui perguntas válidas para execução. Revise o modelo em Configurações.');
        return;
      }
      setChecklistItems(newItems);
      setInspectionStep(2);
    }
  };

  const handleSalvarInspecao = () => {
    if (!inspectionData.tipoInspecao || !inspectionData.ondeUsar || !inspectionData.responsavel || !inspectionData.data || !inspectionData.checklistId) {
      alert("Preencha todos os campos obrigatórios (marcados com *).");
      return;
    }

    const selectedChecklistModel = checklists.find(c => c.id === inspectionData.checklistId);
    if (!selectedChecklistModel) {
      alert('O checklist selecionado não foi encontrado. Atualize a página e tente novamente.');
      return;
    }

    const modelo = getChecklistTitle(selectedChecklistModel) || 'Inspeção';
    const dataHoje = new Date().toISOString().split('T')[0];
    const adaptedInspection = adaptTargetInspectionPayload(
      {
        titulo: modelo,
        tipoInspecao: inspectionData.tipoInspecao,
        setor: inspectionData.ondeUsar,
        responsavel: inspectionData.responsavel,
        atividades: [inspectionData.tipoInspecao],
        data: inspectionData.data,
      },
      {
        sectorName: inspectionData.ondeUsar,
        responsibleName: inspectionData.responsavel,
      },
    );

    if (isEditing && selectedInspecao) {
      const updatedData = {
        ...adaptedInspection,
        tipoInspecao: adaptedInspection.tipoInspecao,
        checklistId: selectedChecklistModel.id,
        checklist: modelo,
        ondeUsar: adaptedInspection.ondeUsar,
        proximaInspecao: adaptedInspection.proximaInspecao,
        responsavel: adaptedInspection.responsavel,
        prioridade: prioridadeCalculada,
        data: adaptedInspection.data,
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
        ...adaptedInspection,
        tipoInspecao: adaptedInspection.tipoInspecao,
        checklist: modelo,
        ondeUsar: adaptedInspection.ondeUsar,
        proximaInspecao: adaptedInspection.proximaInspecao,
        responsavel: adaptedInspection.responsavel,
        prioridade: prioridadeCalculada,
        situacao: statusInicial,
        status: statusInicial,
        data: adaptedInspection.data,
        observacoes: inspectionData.observacoes,
        trabalhadoresExpostos: inspectionData.trabalhadoresExpostos,
        perfilExposto: inspectionData.perfilExposto,
        checklistId: selectedChecklistModel.id,
        items: []
      };
      
      addInspecao(newInspecao);
      
      // Auto-select and open view for the new inspection
      setSelectedInspecao(newInspecao);
      setDrawerMode('VIEW');
      setIsDrawerOpen(true);
    }
    
    setActiveTab('Todas');
    setIsFormDrawerOpen(false);
  };

  const handleSalvarRascunho = () => {
    const inspecaoId = Date.now().toString();
    const selectedChecklistModel = checklists.find(c => c.id === inspectionData.checklistId);
    const modelo = getChecklistTitle(selectedChecklistModel) || 'Inspeção';
    const adaptedInspection = adaptTargetInspectionPayload(
      {
        titulo: modelo,
        tipoInspecao: inspectionData.tipoInspecao || 'Nova Inspeção',
        setor: inspectionData.ondeUsar || 'Geral',
        responsavel: inspectionData.responsavel || 'Não definido',
        atividades: [inspectionData.tipoInspecao || 'Nova Inspeção'],
        data: inspectionData.data || new Date().toISOString().split('T')[0],
      },
      {
        sectorName: inspectionData.ondeUsar || 'Geral',
        responsibleName: inspectionData.responsavel || 'Não definido',
      },
    );
    
    addInspecao({
      id: inspecaoId,
      ...adaptedInspection,
      tipoInspecao: adaptedInspection.tipoInspecao,
      checklist: modelo,
      ondeUsar: adaptedInspection.ondeUsar,
      proximaInspecao: adaptedInspection.proximaInspecao,
      responsavel: adaptedInspection.responsavel,
      prioridade: prioridadeCalculada,
      situacao: 'Rascunho',
      status: 'Rascunho',
      data: adaptedInspection.data,
      observacoes: inspectionData.observacoes,
      trabalhadoresExpostos: inspectionData.trabalhadoresExpostos,
      perfilExposto: inspectionData.perfilExposto,
      checklistId: selectedChecklistModel?.id || '',
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

  const activeTabMetrics = (() => {
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

    const riscosInspecao = store.riscos.filter(r => r.origem === 'Inspeção / Checklist').length;
    const acoesPendentes = store.acoes.filter(a => a.status === 'Em aberto' || a.status === 'Pendente').length;
    const evidenciasAusentes = store.acoes.filter(a => a.exigeEvidencia && !a.evidenciaUrl).length;

     return {
       totalInspecoes,
       inspecoesPeriodo: totalInspecoes,
       totalNConformidades,
       ncQueGeraramRisco: riscosInspecao,
       acoesPendentes,
       evidenciasAusentes,
       todas: todas.length,
       emAndamento: emAndamento.length,
       agendadas: agendadas.length,
       realizadas: realizadas.length,
       checklists: checklistsTabItems.length,
       atrasadas: atrasadas.length,
     };
  })();

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
                 <span className="text-purple-400">{activeTab}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Inspeções</h1>
              <p className="text-[13px] text-gray-400 mt-1.5 font-medium tracking-wide">
                Planeje, execute e acompanhe inspeções operacionais com geração automática de riscos, ações e conformidade.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-[#0b0f19] hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border border-white/10 shadow-sm focus:outline-none">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="flex items-center gap-2 bg-[#0b0f19] hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border border-white/10 shadow-sm focus:outline-none">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button 
               onClick={() => {
                   const firstActivityOption = inspectionActivityOptions[0];
                   setFormType('Inspecao');
                   setInspectionStep(1);
                   setInspectionData(
                     buildInspectionFormState(firstActivityOption?.activity || '', {
                       tipoInspecao: '',
                       checklistId: '',
                       ondeUsar: '',
                       data: new Date().toISOString().split('T')[0],
                       responsavel: '',
                       observacoes: '',
                       prioridade: 'Baixa',
                       trabalhadoresExpostos: 0,
                       perfilExposto: '',
                     }),
                   );
                   setChecklistItems([]);
                   setIsEditing(false);
                   setIsFormDrawerOpen(true);
                 }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50"
               >
                <Plus className="w-4 h-4" />
                Nova Inspeção
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0 mb-6">
             <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Atrasadas</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.atrasadas}</div>
                    <span className="text-[11px] text-red-400 font-medium">Exigem atenção imediata</span>
                 </div>
             </div>

             <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Em andamento</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.emAndamento}</div>
                    <span className="text-[11px] text-blue-400 font-medium whitespace-nowrap">Em execução agora</span>
                 </div>
             </div>

             <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Agendadas</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.agendadas}</div>
                    <span className="text-[11px] text-purple-400 font-medium uppercase tracking-tight">Na agenda futura</span>
                 </div>
             </div>

             <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Realizadas</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.realizadas}</div>
                    <span className="text-[11px] text-emerald-400 font-medium">Concluídas</span>
                 </div>
             </div>

             <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <ListChecks className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Checklists</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activeTabMetrics.checklists}</div>
                    <span className="text-[11px] text-indigo-400 font-medium">Modelos ativos</span>
                 </div>
             </div>
           </div>

           <div className="flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto custom-scrollbar gap-1 mb-6">
              {[
               { id: 'Todas', label: 'Todas', icon: <ClipboardList className="w-4 h-4" />, count: activeTabMetrics.todas },
               { id: 'Em andamento', label: 'Em andamento', icon: <Play className="w-4 h-4" />, count: activeTabMetrics.emAndamento },
               { id: 'Agendadas', label: 'Agendadas', icon: <Calendar className="w-4 h-4" />, count: activeTabMetrics.agendadas },
               { id: 'Realizadas', label: 'Realizadas', icon: <CheckCircle2 className="w-4 h-4" />, count: activeTabMetrics.realizadas },
               { id: 'Checklists', label: 'Checklists', icon: <ListChecks className="w-4 h-4" />, count: activeTabMetrics.checklists }
              ].map((tab) => (
                 <button 
                   key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); setIsDrawerOpen(false); setIsFormDrawerOpen(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                      : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                 >
                   {tab.icon}
                   {tab.label}
                   <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-300'}`}>
                     {tab.count}
                   </span>
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
                    ) : activeTab === 'Realizadas' ? (
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Data Conclusão</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Tipo de inspeção</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Setor</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Responsável</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Checklist</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Conformidade</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Riscos</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Ações</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Status</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 w-32">Detalhes</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Status</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Tipo de inspeção</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Setor</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Responsável</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Data</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Checklist vinculado</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Riscos gerados</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Ações geradas</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">Progresso</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 w-32">Ações</th>
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
                                <span className="text-[13px] font-bold text-gray-200">{getChecklistTitle(item)}</span>
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

                      if (activeTab === 'Realizadas') {
                        const itemRiscos = store.riscos?.filter((r: any) => r.inspection_id === item.id) || [];
                        const itemAcoes = store.acoes?.filter((a: any) => a.inspection_id === item.id) || [];
                        
                        const conformidadeNum = getInspectionConformityScore(item);

                        return (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpenDrawer(item, 'VIEW')}>
                            <td className="px-6 py-4 font-medium text-gray-300 text-[13px]">{item.data || item.proximaInspecao}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[13px] font-bold text-gray-200">{item.tipoInspecao || item.checklist}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-[13px]">{item.ondeUsar}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 overflow-hidden relative">
                                  <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.responsavel}`} alt="avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                </div>
                                <span className="text-[13px] text-gray-400">{item.responsavel}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[13px] text-blue-400">{item.checklist}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[13px] font-bold ${conformidadeNum > 70 ? 'text-emerald-400' : conformidadeNum > 40 ? 'text-orange-400' : 'text-red-400'}`}>{conformidadeNum}%</span>
                                <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${conformidadeNum > 70 ? 'bg-emerald-500' : conformidadeNum > 40 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${conformidadeNum}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[13px] text-red-500/80 font-medium">{itemRiscos.length}</td>
                            <td className="px-5 py-4 text-[13px] text-orange-500/80 font-medium">{itemAcoes.length}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-500/10 border-emerald-500/20 text-emerald-400`}>Concluída</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button className="text-gray-500 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      }

                      const rStatus = getResolvedStatus(item);
                      const rDate = getResolvedDate(item);
                      const inspectionChecklist = findChecklistForInspection(item, checklists);
                      const inspectionNr = getChecklistNr(inspectionChecklist);
                      
                      const itemRiscos = store.riscos?.filter((r: any) => r.inspection_id === item.id) || [];
                      const itemAcoes = store.acoes?.filter((a: any) => a.inspection_id === item.id) || [];
                      
                      let progressoNum = 0;
                      if (item.items && item.items.length > 0) {
                        const total = item.items.length;
                        const answered = item.items.filter((i: any) => i.status && i.status !== 'Pendente').length;
                        progressoNum = Math.round((answered / total) * 100);
                      }
                      
                      return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpenDrawer(item, 'VIEW')}>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 w-fit ${getStatusStyle(rStatus)}`}>
                             {rStatus === 'Agendada' ? <CheckSquare className="w-3.5 h-3.5" /> : (rStatus === 'Em andamento' ? <Play className="w-3.5 h-3.5" /> : (rStatus === 'Atrasada' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />))}
                             {rStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                             {inspectionNr === 'NR-35' ? <Activity className="w-3.5 h-3.5 text-purple-400" /> :
                              inspectionNr === 'NR-10' ? <Zap className="w-3.5 h-3.5 text-orange-400" /> :
                               <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />}
                             <span className="text-[13px] font-bold text-gray-200">{item.tipoInspecao || getInspectionChecklistLabel(item.checklist).replace('Checklist ', '')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                             <span className="text-[13px]">{item.ondeUsar}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                              <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 overflow-hidden relative">
                                 <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.responsavel}`} alt="avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                              </div>
                              <span className="text-[13px]">{item.responsavel}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <span className={`text-[13px] font-medium text-gray-300`}>
                              {rDate === hojeDateStr ? 'Hoje' : formatInspectionDate(rDate)}
                           </span>
                        </td>
                        <td className="px-5 py-4">
                           <span className="text-[13px] text-blue-400 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-md hover:bg-blue-500/20 transition-colors cursor-pointer">{getInspectionChecklistLabel(item.checklist)}</span>
                        </td>
                        <td className="px-5 py-4">
                           <span className={`text-[13px] font-medium ${itemRiscos.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>{itemRiscos.length} risco{itemRiscos.length !== 1 && 's'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[13px] font-medium ${itemAcoes.length > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{itemAcoes.length} ação{itemAcoes.length !== 1 && 'ões'}</span>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-3 w-32">
                             <span className="text-[12px] text-gray-300 font-bold w-9">{progressoNum}%</span>
                             <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progressoNum}%` }}></div>
                             </div>
                           </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-2">
                             {rStatus === 'Agendada' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-transparent hover:bg-white/5 text-gray-300 border-white/20`}
                                >
                                  Iniciar
                                </button>
                             )}
                             {rStatus === 'Em andamento' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-transparent hover:bg-white/5 text-purple-400 border-purple-500/30`}
                                >
                                  Continuar
                                </button>
                             )}
                             {rStatus === 'Atrasada' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenDrawer(item, 'EXECUTE'); }}
                                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors border flex items-center gap-1.5 focus:outline-none bg-transparent hover:bg-white/5 text-red-500 border-red-500/30`}
                                >
                                  Iniciar agora
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
                        <td colSpan={activeTab === 'Checklists' ? 9 : 10} className="px-5 py-12 text-center text-sm text-gray-500">
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
                    <h2 className="text-xl font-bold text-white leading-snug mt-3">{getChecklistTitle(selectedChecklist)}</h2>
                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{getChecklistNr(selectedChecklist)} â€¢ {selectedChecklist.atividade || 'Checklist operacional'}</p>
                  </div>
                  <button onClick={() => { setIsDrawerOpen(false); setSelectedChecklist(null); }} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-8 pb-32">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Total de perguntas</span>
                        <span className="text-2xl font-black text-white">{selectedChecklist.totalPerguntas || getChecklistQuestions(selectedChecklist).length}</span>
                     </div>
                     <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Perguntas Críticas</span>
                        <span className="text-2xl font-black text-red-500">{selectedChecklist.perguntasCriticas || 0}</span>
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
                        <span className="text-[13px] text-blue-400 font-medium">Impacto no Score: <span className="font-bold">+{selectedChecklist.impactoScore || 0} pts</span></span>
                     </div>
                    </div>

                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest border-b border-white/10 pb-2">Perguntas Essenciais</h4>
                     <div className="space-y-3">
                        {getChecklistQuestions(selectedChecklist).map((q: any) => (
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
                                 <span className="text-[13px] font-bold text-red-500 flex items-center gap-1"><ChevronUp className="w-4 h-4" /> {getInspectionPriorityLabel(selectedInspecao)}</span>
                              </div>
                              
                              <div className="pt-1 space-y-3">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Calendar className="w-4 h-4 text-indigo-400/70" /> Agendada para</span>
                                    <span className="text-[13px] font-semibold text-white">{formatInspectionDate(selectedInspecao.proximaInspecao || selectedInspecao.data)}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4 text-indigo-400/70" /> Iniciada em</span>
                                    <span className="text-[13px] font-semibold text-white">{formatInspectionDate(selectedInspecao.iniciadaEm || selectedInspecao.updated_at || selectedInspecao.data || selectedInspecao.proximaInspecao)}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[13px] flex items-center gap-2 text-gray-400"><Clock className="w-4 h-4 text-indigo-400/70" /> Concluída em</span>
                                    <span className="text-[13px] font-semibold text-white">{formatInspectionDate(selectedInspecao.finalizadaEm || selectedInspecao.dataConclusao || selectedInspecao.updated_at || selectedInspecao.data || selectedInspecao.proximaInspecao)}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {(() => {
                           const inspectionRisks = riscos.filter(r => r.inspection_id === selectedInspecao.id);
                           const inspectionActions = acoes.filter(a => a.item_origem_id === selectedInspecao.id || a.source_id === selectedInspecao.id);
                           const answers = selectedInspecao.answers || [];
                           const nonConformities = answers.filter(a => a.isConform === false).length;
                           const totalQuestions = getInspectionQuestions(selectedInspecao).length;
                           const answeredQuestions = getInspectionAnsweredItems(selectedInspecao).length;
                           const conformityScore = getInspectionConformityScore(selectedInspecao);

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
                                       Conformidade do checklist: {conformityScore}%
                                    </span>
                                 </div>

                                 <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-[#121621] rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                                       <div className="flex items-center gap-2 mb-1">
                                          <ListChecks className="w-4 h-4 text-indigo-400" />
                                          <span className="text-lg font-bold text-white">{answeredQuestions}/{totalQuestions}</span>
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
                                 <p className="text-[12px] text-gray-500 mt-0.5">{formatInspectionDate(selectedInspecao.created_at || selectedInspecao.criadoEm || selectedInspecao.data || selectedInspecao.proximaInspecao)}</p>
                              </div>
                              <div className="relative pl-6">
                                 <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                 <p className="text-[13px] font-bold text-white">Iniciada</p>
                                 <p className="text-[12px] text-gray-500 mt-0.5">{formatInspectionDate(selectedInspecao.iniciadaEm || selectedInspecao.updated_at || selectedInspecao.data || selectedInspecao.proximaInspecao)}</p>
                              </div>
                              <div className="relative pl-6">
                                 <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                 <p className="text-[13px] font-bold text-white">Concluída</p>
                                 <p className="text-[12px] text-gray-500 mt-0.5">{formatInspectionDate(selectedInspecao.finalizadaEm || selectedInspecao.dataConclusao || selectedInspecao.updated_at || selectedInspecao.data || selectedInspecao.proximaInspecao)}</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                           <div className="flex items-center gap-2 mb-1">
                              <Share2 className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-[13px] font-semibold text-gray-300">Origem e conectividade</h4>
                           </div>
                           <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-2 gap-y-1">
                              <span className="flex items-center gap-1 text-indigo-400"><Smartphone className="w-3.5 h-3.5" /> Status: {selectedInspecao.situacao || selectedInspecao.status || 'Agendada'}</span>
                              <span className="text-gray-700">â€¢</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-600" /> Setor: {selectedInspecao.ondeUsar || 'Nao informado'}</span>
                              <span className="text-gray-700">â€¢</span>
                              <span className="flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5 text-gray-600" /> Checklist: {selectedInspecao.checklist || 'Nao vinculado'}</span>
                           </div>
                        </div>
                     </>
                  ) : (
                     <>
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
                              <span className="text-[13px] font-bold text-red-500 flex items-center gap-1"><ChevronUp className="w-3.5 h-3.5 -rotate-90" /> {getInspectionPriorityLabel(selectedInspecao)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Agendada para</span>
                              <span className="text-[13px] font-medium text-white flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-500" /> {formatInspectionDate(selectedInspecao.proximaInspecao || selectedInspecao.data)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[13px] text-gray-400">Criada em</span>
                              <span className="text-[13px] font-medium text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> {formatInspectionDate(selectedInspecao.created_at || selectedInspecao.criadoEm || selectedInspecao.data || selectedInspecao.proximaInspecao)}</span>
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
                           
                           <p className="text-[12px] text-gray-500 leading-relaxed mt-2">{selectedInspecao.items?.length ? `${selectedInspecao.items.length} itens registrados nesta inspeção.` : 'Checklist vinculado pronto para execução.'}</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">Observações</h4>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 min-h-[80px]">
                           <p className="text-[12px] text-gray-400 leading-relaxed">{selectedInspecao.observacoes || 'Nenhuma observação registrada para esta inspeção.'}</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2 uppercase tracking-wide text-[11px] text-gray-500">Timeline da execução</h4>
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                          <div className="relative">
                            <div className="absolute left-[-23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#121826]"></div>
                            <p className="text-[13px] font-bold text-white">Inspeção criada</p>
                            <p className="text-[11px] text-gray-500">{formatInspectionDate(selectedInspecao.created_at || selectedInspecao.criadoEm || selectedInspecao.data || selectedInspecao.proximaInspecao)}</p>
                          </div>
                          {selectedInspecao.situacao === 'Em andamento' && (
                             <div className="relative">
                                <div className="absolute left-[-23px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121826]"></div>
                                <p className="text-[13px] font-bold text-white">Iniciada</p>
                                <p className="text-[11px] text-gray-500">{formatInspectionDate(selectedInspecao.iniciadaEm || selectedInspecao.updated_at || selectedInspecao.data || selectedInspecao.proximaInspecao)}</p>
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
                     <select
                       disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                       value={inspectionData.tipoInspecao}
                       onChange={(e) => {
                         const activity = e.target.value;
                         setInspectionData(buildInspectionFormState(activity, inspectionData));
                       }}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors"
                     >
                      <option value="">Selecione o tipo de inspeção</option>
                      {inspectionActivityOptions.map((option) => (
                        <option key={`${option.pacote}-${option.activity}`} value={option.activity}>
                          {option.activity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-300">Checklist vinculado <span className="text-red-500">*</span></label>
                    <select 
                      value={inspectionData.checklistId}
                      disabled
                      onChange={(e) => setInspectionData({...inspectionData, checklistId: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Selecione um modelo</option>
                          {filteredChecklistsForForm.map(c => <option key={c.id} value={c.id}>{getChecklistTitle(c)}</option>)}
                       </select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Setor <span className="text-red-500">*</span></label>
                       <select
                         disabled={isEditing && selectedInspecao?.situacao === 'Em andamento'}
                         value={inspectionData.ondeUsar}
                         onChange={(e) => setInspectionData({...inspectionData, ondeUsar: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors"
                       >
                         <option value="">Selecione um setor</option>
                         {sectorOptions.map((sectorName) => (
                           <option key={sectorName} value={sectorName}>{sectorName}</option>
                         ))}
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[13px] font-bold text-gray-300">Responsável <span className="text-red-500">*</span></label>
                       <select
                         value={inspectionData.responsavel}
                         onChange={(e) => setInspectionData({...inspectionData, responsavel: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors"
                       >
                         <option value="">Selecione um responsável</option>
                         {responsibleOptions.map((responsibleName) => (
                           <option key={responsibleName} value={responsibleName}>{responsibleName}</option>
                         ))}
                       </select>
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
