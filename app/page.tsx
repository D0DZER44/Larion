"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bell, Download, Calendar, Activity, AlertTriangle, 
  FileText, ShieldCheck, HardHat, TrendingUp, TrendingDown, CalendarCheck,
  Info, ArrowRight, ShieldAlert, BookOpen, Users,
  Bot, MessageSquare, CheckCircle2, Clock, Zap, ClipboardCheck,
  AlertCircle, UserX, RefreshCw, PlusCircle, Send, Sparkles, X, GraduationCap, ChevronLeft, ChevronRight, CheckSquare,
  CalendarX
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAppStore } from '@/lib/store';
import { EconomicImpactEngine, LariContextEngine } from '@/lib/engines';
import { FineEngine } from '@/lib/fineEngine';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const scoreDataMap: any = {
  dia: [
    { name: '08:00', value: 85 },
    { name: '10:00', value: 82 },
    { name: '12:00', value: 80 },
    { name: '14:00', value: 84 },
    { name: '16:00', value: 88 },
  ],
  semana: [
    { name: 'Seg', value: 75 },
    { name: 'Ter', value: 70 },
    { name: 'Qua', value: 85 },
    { name: 'Qui', value: 88 },
    { name: 'Sex', value: 92 },
  ],
  mes: [
    { name: 'S1', value: 30 },
    { name: 'S2', value: 45 },
    { name: 'S3', value: 55 },
    { name: 'S4', value: 70 },
  ],
  ano: [
    { name: 'Jan', value: 50 },
    { name: 'Fev', value: 52 },
    { name: 'Mar', value: 60 },
    { name: 'Abr', value: 75 },
    { name: 'Mai', value: 80 },
  ]
};

const exposureData = [
  { name: '1', value: 200000 },
  { name: '2', value: 220000 },
  { name: '3', value: 210000 },
  { name: '4', value: 250000 },
  { name: '5', value: 278450 },
];

export default function Dashboard() {
  const { riscos = [], acoes = [], inspecoes = [], checklists = [], logs = [], rulePackages = [], alertas = [] } = useAppStore();
  const router = useRouter();

  const activePackageNames = useMemo(() => 
    rulePackages.filter(p => p.isActive).map(p => p.name), 
    [rulePackages]
  );

  const isPackageActive = useCallback((pkg?: string) => {
    if (!pkg || pkg === 'Base SST') return true;
    return activePackageNames.includes(pkg);
  }, [activePackageNames]);

  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [scoreTimeRange, setScoreTimeRange] = useState<'dia' | 'semana' | 'mes' | 'ano'>('semana');
  const [lariInput, setLariInput] = useState('');
  const [lariIsTyping, setLariIsTyping] = useState(false);
  const [lariMessages, setLariMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [lariMessages, lariIsTyping]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      setLariMessages([
        {
          id: '1',
          sender: 'lari',
          text: "Olá! Posso te ajudar rapidamente com riscos, inspeções e ações.",
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLariSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lariInput.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: lariInput.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setLariMessages(prev => [...prev, userMsg]);
    setLariInput('');
    setLariIsTyping(true);

    setTimeout(() => {
      const stateObj = { riscos, acoes, inspecoes, checklists, logs };
      // Depending on the version, sometimes it's .respond(text, state) 
      const respText = typeof LariContextEngine.respond === 'function' 
         ? LariContextEngine.respond(userMsg.text, stateObj) 
         : "Posso ajudar com a gestão dos seus KPIs.";
         
      setLariMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'lari',
        text: respText,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
      setLariIsTyping(false);
    }, 1200);
  };

  const filterJunk = (items: any[]) => {
    return items.filter(i => {
      const textFields = [i.title, i.titulo, i.descricao, i.name, i.nome, i.atividade, i.nr, i.responsavel].filter(Boolean).join(' ').toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!i.title && !i.titulo && !i.atividade && !i.nome && !i.name && !i.descricao) return false;
      return true;
    });
  };

  const cleanRiscos = useMemo(() => filterJunk(riscos || []), [riscos]);
  const cleanAcoes = useMemo(() => filterJunk(acoes || []), [acoes]);
  const cleanInspecoes = useMemo(() => filterJunk(inspecoes || []), [inspecoes]);
  const cleanChecklists = useMemo(() => filterJunk(checklists || []), [checklists]);
  const cleanLogs = useMemo(() => (logs || []), [logs]);

  const metrics = useMemo(() => {
    // KPI 1: Exposição
    let criticalCount = 0;
    let openRisksCount = 0;
    let riskScore = 0;
    let totalTrabalhadoresExpostos = 0;
    
    const activeRisks = cleanRiscos.filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado');
    activeRisks.forEach(r => {
      openRisksCount++;
      const level = (r.nivel || r.level || '').toLowerCase();
      if (level === 'crítico') {
        criticalCount++;
        riskScore += 10;
        totalTrabalhadoresExpostos += r.trabalhadoresExpostos || 0;
      } else if (level === 'alto') {
        riskScore += 5;
        totalTrabalhadoresExpostos += r.trabalhadoresExpostos || 0;
      } else if (level === 'médio') {
        riskScore += 2;
      } else {
        riskScore += 1;
      }
    });

    // Multa Exposure Calculation
    let estimatedExposure = 0;
    let avoidedExposure = 0;
    cleanRiscos.forEach(r => {
      let multa = Number(r.multaEstimada);
      if (isNaN(multa) || multa === 0) {
         // Fallback calculation using engine
         const est = FineEngine.calcularFaixaMulta({
           nr: r.nr || 'NR-Geral',
           criticidade: r.nivel || r.level || 'Alta',
           numeroEmpregados: 50
         });
         multa = est.maximoEstimado;
      }

      if (r.status === 'Resolvido' || r.status === 'Mitigado') {
        avoidedExposure += multa;
      } else {
        estimatedExposure += multa;
      }
    });

    const getRiskWeight = (r: any) => {
       const level = (r.nivel || r.level || '').toLowerCase();
       let w = 0;
       if (level === 'crítico') w += 10000;
       else if (level === 'alto') w += 1000;
       else if (level === 'médio') w += 100;
       else w += 10;
       
       const hasAction = cleanAcoes.some(a => (a.riskId === r.id || a.origin_id === r.id));
       if (!hasAction) {
          w += 500; 
       }
       
       const time = new Date(r.created_at || r.dataIdentificacao || 0).getTime();
       return w + (time / 10000000000000);
    }

    const topRisks = [...activeRisks].sort((a,b) => getRiskWeight(b) - getRiskWeight(a));

    let exposicaoOperacional = 'Baixa';
    if (riskScore >= 20 || criticalCount >= 1) exposicaoOperacional = 'Alta';
    else if (riskScore >= 10 || openRisksCount >= 5) exposicaoOperacional = 'Média';

    // KPI 2: Ações
    const pendingActions = cleanAcoes.filter(a => a.status !== 'Concluído' && a.status !== 'Concluída' && a.status !== 'Fechada' && a.status !== 'Cancelada');
    const emAndamentoActions = cleanAcoes.filter(a => a.status === 'Em andamento' || a.status === 'Progresso');
    const concluidasActions = cleanAcoes.filter(a => a.status === 'Concluído' || a.status === 'Concluída' || a.status === 'Fechada');
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    const atrasadasActions = pendingActions.filter(a => {
      if (a.status === 'Atrasada' || a.status === 'Vencida') return true;
      if (a.prazo) {
        try {
          const prazoStr = new Date(a.prazo).toISOString().split('T')[0];
          return prazoStr < todayStr;
        } catch { return false; }
      }
      return false;
    });
    
    // prioridade crítica/alta
    const criticalActions = pendingActions.filter(a => {
      const p = (a.prioridade || a.priority || '').toLowerCase();
      return p === 'crítico' || p === 'crítica' || p === 'alto' || p === 'alta' || p === 'urgente' || p === 'p1';
    });
    
    const actionsExpiringToday = pendingActions.filter(a => {
       if (a.status === 'Vence hoje') return true;
       const p = (a.prazo || a.deadlineTime || '').toLowerCase();
       return p.startsWith(todayStr) || p.includes('hoje');
    });
    
    const actionsNoResponsible = pendingActions.filter(a => {
       if (a.responsavel === 'Não definido' || a.responsavel === 'Pendente') return true;
       if (!a.responsavel && !a.assigned_to && (!a.responsible || !a.responsible.name)) return true;
       return false;
    });

    // KPI 3: Inspeções
    const pendingInspections = cleanInspecoes.filter(i => i.status !== 'Concluído' && i.status !== 'Concluída' && i.status !== 'Finalizada');
    const completedInspections = cleanInspecoes.filter(i => i.status === 'Concluído' || i.status === 'Concluída' || i.status === 'Finalizada');
    const previstasInspections = cleanInspecoes; 

    const vencidasInspections = pendingInspections.filter(i => {
       if (i.status === 'Atrasada' || i.status === 'Vencida') return true;
       const dtStr = i.data || i.date || i.dataPrevista || '';
       if (dtStr) {
          try {
             return dtStr.split('T')[0] < todayStr;
          } catch { return false; }
       }
       return false;
    });

    const inspExpiringToday = pendingInspections.filter(i => {
       if (i.status === 'Vence hoje') return true;
       const dtStr = i.data || i.date || i.dataPrevista || '';
       return dtStr.split('T')[0] === todayStr || dtStr.toLowerCase().includes('hoje');
    });

    const isConcluidoStatus = (status: string) => {
       const s = (status || '').toLowerCase();
       return s === 'concluído' || s === 'concluída' || s === 'fechada' || s === 'resolvido' || s === 'mitigado' || s === 'finalizada';
    };

    const inspTodayTotal = cleanInspecoes.filter(i => {
       const dtStr = i.data || i.date || i.dataPrevista || i.proximaInspecao || '';
       return dtStr.split('T')[0] === todayStr || dtStr.toLowerCase().includes('hoje') || i.status === 'Vence hoje';
    });

    const checkListCategoryCount: Record<string, { total: number, completed: number }> = {};
    inspTodayTotal.forEach(i => {
       const cat = i.checklist || i.categoria || i.title || i.nome || i.norma || 'Geral';
       if (!checkListCategoryCount[cat]) checkListCategoryCount[cat] = { total: 0, completed: 0 };
       checkListCategoryCount[cat].total++;
       if (isConcluidoStatus(i.status) || isConcluidoStatus(i.situacao)) {
          checkListCategoryCount[cat].completed++;
       }
    });

    const checklistsTodayCats = Object.keys(checkListCategoryCount).map(k => ({
       name: k,
       total: checkListCategoryCount[k].total,
       completed: checkListCategoryCount[k].completed
    })).sort((a,b) => b.total - a.total).slice(0, 5);

    // KPI 4: Conformidade Geral
    let vI = cleanInspecoes.length > 0 ? (completedInspections.length / cleanInspecoes.length) * 100 : null;
    const concluidasActionsRate = cleanAcoes.filter(a => a.status === 'Concluído' || a.status === 'Concluída' || a.status === 'Fechada');
    let vA = cleanAcoes.length > 0 ? (concluidasActionsRate.length / cleanAcoes.length) * 100 : null;
    const resolvedRisks = cleanRiscos.filter(r => r.status === 'Resolvido' || r.status === 'Mitigado');
    let vR = cleanRiscos.length > 0 ? (resolvedRisks.length / cleanRiscos.length) * 100 : null;
    
    let validWeights = 0;
    let totalScore = 0;
    
    // Pesos originais: checklists 30%, inspeções 30%, ações 25%, riscos resolvidos 15%
    // Redireciona o peso de checklists (ausente) proporcionalmente pela divisão por validWeights.
    if (vI !== null) { validWeights += 30; totalScore += vI * 30; }
    if (vA !== null) { validWeights += 25; totalScore += vA * 25; }
    if (vR !== null) { validWeights += 15; totalScore += vR * 15; }
    
    const conformityRate = validWeights > 0 ? Math.round(totalScore / validWeights) : 100;

    const ctxLari = LariContextEngine.getRealtimeContext({ riscos, acoes, inspecoes, checklists, logs, rulePackages, organization: useAppStore.getState().organization });
    const lariRecommendations = ctxLari.top5Recomendacoes;

    // Pie chart by sector
    const sectorsMap: Record<string, { count: number; prioritySum: number }> = {};
    let totalRiskCount = 0;

    cleanRiscos.forEach(r => {
      if (r.status !== 'Resolvido' && r.status !== 'Mitigado') {
        const s = r.sector_id || r.setor || 'Outros';
        const level = (r.nivel || r.level || '').toLowerCase();
        let pScore = 0;
        if (level === 'crítico') pScore = 4;
        else if (level === 'alto') pScore = 3;
        else if (level === 'médio') pScore = 2;
        else if (level === 'baixo') pScore = 1;
        
        if (!sectorsMap[s]) sectorsMap[s] = { count: 0, prioritySum: 0 };
        sectorsMap[s].count++;
        sectorsMap[s].prioritySum += pScore;
        totalRiskCount++;
      }
    });

    const getPriorityLabel = (avg: number) => {
        if (avg >= 3.5) return 'Crítica';
        if (avg >= 2.5) return 'Alta';
        if (avg >= 1.5) return 'Média';
        if (avg > 0) return 'Baixa';
        return 'N/A';
    };

    const sortedSectors = Object.keys(sectorsMap)
        .map(key => ({
            name: key,
            value: sectorsMap[key].count,
            percent: totalRiskCount > 0 ? Math.round((sectorsMap[key].count / totalRiskCount) * 100) : 0,
            avgPriorityValue: sectorsMap[key].count > 0 ? sectorsMap[key].prioritySum / sectorsMap[key].count : 0
        }))
        .sort((a,b) => b.value - a.value);

    let riskSectorData: any[] = [];
    if (sortedSectors.length > 5) {
        const top5 = sortedSectors.slice(0, 5);
        const others = sortedSectors.slice(5);
        let othersSum = 0;
        let othersPrioritySum = 0;
        others.forEach(o => {
            othersSum += o.value;
            othersPrioritySum += o.avgPriorityValue * o.value;
        });
        
        riskSectorData = [...top5, {
            name: 'Outros',
            value: othersSum,
            percent: totalRiskCount > 0 ? Math.round((othersSum / totalRiskCount) * 100) : 0,
            avgPriorityValue: othersSum > 0 ? othersPrioritySum / othersSum : 0
        }];
    } else {
        riskSectorData = sortedSectors;
    }

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];
    riskSectorData = riskSectorData.map((s, i) => ({
        ...s,
        avgPriorityLabel: getPriorityLabel(s.avgPriorityValue),
        color: COLORS[i % COLORS.length]
    }));

    if (riskSectorData.length === 0) {
      riskSectorData = [{ name: 'Sem dados', value: 1, percent: 100, avgPriorityLabel: 'N/A', color: '#374151', isEmpty: true }];
    }

    const checkIsConcluido = (status: string) => {
       const s = (status || '').toLowerCase();
       return s === 'concluído' || s === 'concluída' || s === 'fechada' || s === 'resolvido' || s === 'mitigado' || s === 'finalizada';
    };

    // Conformidade NR
    const nrMap: Record<string, { total: number; resolved: number }> = {};
    
    const addToNrMap = (nrValue: string, resolved: boolean) => {
        let nrStr = (nrValue || '').toString().toUpperCase().trim();
        const match = nrStr.match(/NR[- \s]?(\d+)/i);
        if (match) {
            nrStr = `NR-${match[1]}`;
        } else {
            nrStr = 'Sem NR definida';
        }
        if (!nrMap[nrStr]) nrMap[nrStr] = { total: 0, resolved: 0 };
        nrMap[nrStr].total++;
        if (resolved) nrMap[nrStr].resolved++;
    };

    cleanRiscos.forEach(r => addToNrMap(r.nr || r.title || r.titulo || '', checkIsConcluido(r.status)));
    cleanAcoes.forEach(a => addToNrMap(a.nr || a.title || a.titulo || a.category || '', checkIsConcluido(a.status)));
    cleanInspecoes.forEach(i => addToNrMap(i.nr || i.norma || i.title || i.nome || i.titulo || i.checklist || '', checkIsConcluido(i.status)));
    cleanChecklists.forEach((c: any) => addToNrMap(c.nr || c.norma || c.name || c.category || '', c.status === 'Ativo'));

    let conformidadeNR = Object.keys(nrMap)
      .sort((a, b) => nrMap[b].total - nrMap[a].total) // Sort by volume of items, descending
      .slice(0, 5) // Take top 5
      .map(k => {
      const rate = nrMap[k].resolved / nrMap[k].total;
      return {
        nr: k,
        val: Math.round(rate * 100),
        color: rate >= 0.7 ? 'bg-emerald-500' : (rate >= 0.4 ? 'bg-orange-500' : 'bg-red-500')
      };
    });

    if (conformidadeNR.length === 0) {
       conformidadeNR = [{ nr: 'Sem NR definida', val: 0, color: 'bg-gray-600' }];
    }

    // Atividades recentes (logs + gerados)
    const generatedActivities: any[] = [];
    
    cleanRiscos.forEach(r => {
        if (r.created_at) {
            generatedActivities.push({
                id: `log_r_c_${r.id}`,
                event_type: 'risco_criado',
                description: `Risco registrado: ${r.title || r.titulo || r.descricao || r.id}`,
                origin_type: 'Risco',
                created_at: r.created_at,
                user_id: r.created_by || r.responsavel || 'Sistema'
            });
        }
        if (r.updated_at && r.updated_at !== r.created_at) {
            generatedActivities.push({
                id: `log_r_u_${r.id}`,
                event_type: 'risco_atualizado',
                description: `Risco atualizado: ${r.title || r.titulo || r.descricao || r.id}`,
                origin_type: 'Risco',
                created_at: r.updated_at,
                user_id: r.updated_by || r.responsavel || 'Sistema'
            });
        }
    });

    cleanAcoes.forEach(a => {
        if (a.created_at) {
            generatedActivities.push({
                id: `log_a_c_${a.id}`,
                event_type: 'acao_criada',
                description: `Ação solicitada: ${a.title || a.titulo || a.id}`,
                origin_type: 'Ação',
                created_at: a.created_at,
                user_id: a.created_by || a.responsavel || 'Sistema'
            });
        }
        if (isConcluidoStatus(a.status)) {
            generatedActivities.push({
                id: `log_a_u_${a.id}`,
                event_type: 'acao_concluida',
                description: `Ação concluída: ${a.title || a.titulo || a.id}`,
                origin_type: 'Ação',
                created_at: a.updated_at || a.created_at, // Use created_at as fallback if no updated_at
                user_id: a.updated_by || a.responsavel || 'Sistema'
            });
        }
    });

    cleanInspecoes.forEach(i => {
        if (isConcluidoStatus(i.status) || isConcluidoStatus(i.situacao)) {
            generatedActivities.push({
                id: `log_i_c_${i.id}`,
                event_type: 'inspecao_concluida',
                description: `Inspeção concluída: ${i.title || i.nome || i.titulo || i.id}`,
                origin_type: 'Inspeção',
                created_at: i.updated_at || i.date || i.data || i.created_at || new Date().toISOString(),
                user_id: i.inspector || i.responsavel || 'Sistema'
            });
        }
    });
    
    cleanChecklists.forEach((c: any) => {
        if (isConcluidoStatus(c.status) && c.updated_at) {
            generatedActivities.push({
                id: `log_c_c_${c.id}`,
                event_type: 'checklist_concluido',
                description: `Checklist concluído: ${c.name || c.title || c.id}`,
                origin_type: 'Checklist',
                created_at: c.updated_at,
                user_id: c.updated_by || c.responsavel || 'Sistema'
            });
        }
    });

    const allActivities = [...cleanLogs, ...generatedActivities].sort((a,b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
    });

    // Removendo ids possivelmente duplicados (caso haja fallback de ids iguais)
    const uniqueActivities = [];
    const _set = new Set();
    // eslint-disable-next-line react-hooks/purity
    const nowTime = Date.now();
    for (const act of allActivities) {
        if (!_set.has(act.id)) {
            _set.add(act.id);
            // Precompute timeStr
            const dateObj = new Date(act.created_at);
            const hasTime = !isNaN(dateObj.getTime());
            let timeStr = 'Recente';
            if (hasTime) {
               const diffSecs = (nowTime - dateObj.getTime()) / 1000;
               if (diffSecs < 60) timeStr = 'Agora mesmo';
               else if (diffSecs < 3600) timeStr = `Há ${Math.round(diffSecs/60)} min`;
               else if (diffSecs < 86400) timeStr = `Há ${Math.round(diffSecs/3600)} h`;
               else timeStr = dateObj.toLocaleDateString('pt-BR');
            }
            act.timeStr = timeStr;
            uniqueActivities.push(act);
        }
    }

    const sortedLogs = uniqueActivities.slice(0, 5);

    // Prox Actions (timeline - Ações, Inspeções, Checklists)
    const allUpcoming: any[] = [];

    // Ações
    pendingActions.filter(a => a.prazo && a.prazo >= todayStr).forEach(a => {
       allUpcoming.push({
           id: `acao_${a.id}`,
           title: a.title || a.titulo || 'Sem título',
           origin: 'Ação',
           sector: a.setor || a.sector_id || 'Geral',
           date: a.prazo,
           priority: a.nivel || a.level || a.prioridade || 'Normal',
           link: '/operacao/acoes'
       })
    });

    // Inspeções
    cleanInspecoes.filter(i => !isConcluidoStatus(i.status) && !isConcluidoStatus(i.situacao)).forEach(i => {
       const d = i.data || i.date || i.dataPrevista;
       if (d && d >= todayStr) {
           allUpcoming.push({
               id: `insp_${i.id}`,
               title: i.title || i.nome || i.titulo || 'Sem título',
               origin: 'Inspeção',
               sector: i.setor || i.sector_id || 'Geral',
               date: d,
               priority: i.prioridade || i.nivel || 'Normal',
               link: '/operacao/inspecoes'
           });
       }
    });

    // Checklists
    cleanChecklists.filter((c: any) => !isConcluidoStatus(c.status) && !isConcluidoStatus(c.situacao)).forEach((c: any) => {
       const d = c.proximaRevisao || c.data || c.dataPrevista;
       if (d && d >= todayStr) {
           allUpcoming.push({
               id: `check_${c.id}`,
               title: c.name || c.title || c.nome || 'Sem título',
               origin: 'Checklist',
               sector: c.setor || c.sector_id || 'Geral',
               date: d,
               priority: c.prioridade || c.nivel || 'Normal',
               link: '/inspecoes' // Assuming checklists go to inspecoes based on what we had before, or specific link
           });
       }
    });

    const upcomingActions = allUpcoming
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    // Pendências Operacionais
    const isToday = (dtStr: string) => {
       if (!dtStr) return false;
       return dtStr === todayStr || dtStr.substring(0, 10) === todayStr || dtStr.toLowerCase().includes('hoje');
    };

    // Alertas
    const allAlertas: any[] = [];

    // Alertas será gerado mais abaixo
    let pendenciasAbertas = 0;
    let pendenciasSemResponsavel = 0;
    let pendenciasSemPrazo = 0;
    let pendenciasVencemHoje = 0;

    // Riscos
    for (const r of cleanRiscos) {
       if (!checkIsConcluido(r.status)) {
          pendenciasAbertas++;
          if (!r.responsavel || r.responsavel.trim() === '') pendenciasSemResponsavel++;
          if (!r.prazo || r.prazo.trim() === '') pendenciasSemPrazo++;
          else if (isToday(r.prazo)) pendenciasVencemHoje++;
       }
    }

    // Ações
    for (const a of cleanAcoes) {
       if (!checkIsConcluido(a.status)) {
          pendenciasAbertas++;
          if (!a.responsavel || a.responsavel.trim() === '') pendenciasSemResponsavel++;
          if (!a.prazo || a.prazo.trim() === '') pendenciasSemPrazo++;
          else if (isToday(a.prazo)) pendenciasVencemHoje++;
       }
    }

    // Inspeções
    for (const i of cleanInspecoes) {
       if (!checkIsConcluido(i.status)) {
          pendenciasAbertas++;
          const resp = i.inspector || i.responsavel;
          if (!resp || resp.trim() === '') pendenciasSemResponsavel++;
          
          const pz = i.dataPrevista || i.proximaInspecao || i.data;
          if (!pz || pz.trim() === '') pendenciasSemPrazo++;
          else if (isToday(pz)) pendenciasVencemHoje++;
       }
    }

    // Checklists
    for (const c of cleanChecklists) {
       if (!checkIsConcluido(c.status) && c.status !== 'Ativo' && c.status !== 'Inativo') {
          pendenciasAbertas++;
          // Checklists são templates. Ignorar responsável e prazo se não existir, 
          // mas se tiver 'proximaRevisao' nós checamos
          if (c.proximaRevisao) {
             if (isToday(c.proximaRevisao)) pendenciasVencemHoje++;
          }
       }
    }

    // Diagnostico Executivo
    let diagTopSector = 'Nenhum';
    let diagTopSectorPercentage = 0;
    if (riskSectorData.length > 0 && totalRiskCount > 0 && riskSectorData[0].name !== 'Sem dados' && riskSectorData[0].name !== 'Outros') {
       diagTopSector = riskSectorData[0].name;
       diagTopSectorPercentage = Math.round((riskSectorData[0].value / totalRiskCount) * 100);
    }
    const prioridadeOperacional = criticalCount > 0 ? 'Focos Críticos' : (atrasadasActions.length > 0 ? 'Ações Atrasadas' : 'Prevenção e Monitoramento');
    const updatePlano = atrasadasActions.length > 0 || vencidasInspections.length > 0 || criticalCount > 0 ? 'Requer atualização imediata' : 'Plano em dia';

    const inspTodayCompleted = inspTodayTotal.filter(i => isConcluidoStatus(i.status) || isConcluidoStatus(i.situacao));
    const inspTodayPending = inspTodayTotal.filter(i => !isConcluidoStatus(i.status) && !isConcluidoStatus(i.situacao));

    // - risco crítico aberto (Prio: 1)
    activeRisks.filter(r => isPackageActive(r.pacote || r.package) && (r.nivel || r.level || '').toLowerCase() === 'crítico').forEach(r => {
        allAlertas.push({ id: `risk_${r.id}`, type: 'risco_critico', icon: AlertTriangle, color: 'text-red-500', title: 'Risco Crítico', desc: r.title || r.titulo || r.descricao || 'Sem título', link: '/operacao/riscos', priority: 1, dateStr: r.data_identificacao || r.created_at || '' });
    });

    // - ação vencendo hoje (Prio: 2)
    pendingActions.filter(a => isPackageActive(a.pacote || a.package) && a.prazo && isToday(a.prazo)).forEach(a => {
        allAlertas.push({ id: `acao_vence_hoje_${a.id}`, type: 'acao_vence_hoje', icon: Clock, color: 'text-orange-500', title: 'Ação Vence Hoje', desc: a.title || a.titulo || 'Sem título', link: '/acoes', priority: 2, dateStr: a.prazo });
    });

    // - ação atrasada (Prio: 3)
    atrasadasActions.filter(a => isPackageActive(a.pacote || a.package)).forEach(a => {
        allAlertas.push({ id: `acao_atrasada_${a.id}`, type: 'acao_atrasada', icon: AlertCircle, color: 'text-red-400', title: 'Ação Atrasada', desc: a.title || a.titulo || 'Sem título', link: '/acoes', priority: 3, dateStr: a.prazo });
    });

    // - inspeção vencida (Prio: 3)
    vencidasInspections.filter(i => isPackageActive(i.pacote || i.package)).forEach(i => {
        allAlertas.push({ id: `insp_vencida_${i.id}`, type: 'insp_vencida', icon: ShieldAlert, color: 'text-orange-400', title: 'Inspeção Vencida', desc: i.title || i.nome || i.titulo || 'Sem título', link: '/inspecoes', priority: 3, dateStr: i.data || i.date || i.dataPrevista || '' });
    });

    // - checklist pendente crítico (Prio: 3)
    inspTodayPending.filter(i => isPackageActive(i.pacote || i.package)).forEach(i => {
        allAlertas.push({ id: `checklist_pendente_${i.id}`, type: 'checklist_pendente', icon: ClipboardCheck, color: 'text-yellow-500', title: 'Checklist Pendente', desc: i.checklist || i.categoria || i.title || i.nome || 'Sem título', link: '/inspecoes', priority: 3, dateStr: i.data || i.date || i.dataPrevista || todayStr });
    });

    // - item sem responsável (Prio: 4)
    activeRisks.filter(r => isPackageActive(r.pacote || r.package) && (!r.responsavel || r.responsavel.trim() === '')).forEach(r => {
        allAlertas.push({ id: `risk_sem_resp_${r.id}`, type: 'sem_resp', icon: UserX, color: 'text-purple-400', title: 'Risco s/ Resp', desc: r.title || r.titulo || 'Sem título', link: '/riscos', priority: 4, dateStr: r.created_at || '' });
    });
    pendingActions.filter(a => isPackageActive(a.pacote || a.package) && (!a.responsavel || a.responsavel.trim() === '')).forEach(a => {
        allAlertas.push({ id: `acao_sem_resp_${a.id}`, type: 'sem_resp', icon: UserX, color: 'text-purple-400', title: 'Ação s/ Resp', desc: a.title || a.titulo || 'Sem título', link: '/acoes', priority: 4, dateStr: a.created_at || '' });
    });

    // - item sem prazo (Prio: 4)
    pendingActions.filter(a => isPackageActive(a.pacote || a.package) && (!a.prazo || a.prazo.trim() === '')).forEach(a => {
        allAlertas.push({ id: `acao_sem_prazo_${a.id}`, type: 'sem_prazo', icon: Calendar, color: 'text-gray-400', title: 'Ação s/ Prazo', desc: a.title || a.titulo || 'Sem título', link: '/acoes', priority: 4, dateStr: a.created_at || '' });
    });

    // Ordenar e pegar os top 5
    const alertas = allAlertas.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        const dateA = new Date(a.dateStr || '').getTime();
        const dateB = new Date(b.dateStr || '').getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    }).slice(0, 5);

    // ------------------------------------
    // Score Operacional
    // ------------------------------------
    let operationalScore = 100;
    const penalties = {
       criticalRisks: criticalCount * 8,
       delayedActions: atrasadasActions.length * 5,
       expiredInspections: vencidasInspections.length * 4,
       pendingChecklists: inspTodayPending.length * 2,
       missingResp: pendenciasSemResponsavel * 3,
       missingDeadline: pendenciasSemPrazo * 2
    };

    let totalPenalty = Object.values(penalties).reduce((acc, val) => acc + val, 0);

    operationalScore = Math.max(0, operationalScore - totalPenalty);

    let scoreClass = '';
    let scoreColorText = '';
    let scoreColorBg = '';
    let scoreColorStroke = '';

    if (operationalScore >= 80) {
       scoreClass = 'Excelente';
       scoreColorText = 'text-green-500';
       scoreColorBg = 'bg-green-500/10 text-green-500 border border-green-500/20';
       scoreColorStroke = '#22c55e'; // green-500
    } else if (operationalScore >= 60) {
       scoreClass = 'Bom';
       scoreColorText = 'text-emerald-400';
       scoreColorBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
       scoreColorStroke = '#34d399'; // emerald-400
    } else if (operationalScore >= 40) {
       scoreClass = 'Atenção';
       scoreColorText = 'text-yellow-500';
       scoreColorBg = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
       scoreColorStroke = '#eab308'; // yellow-500
    } else {
       scoreClass = 'Crítico';
       scoreColorText = 'text-red-500';
       scoreColorBg = 'bg-red-500/10 text-red-500 border border-red-500/20';
       scoreColorStroke = '#ef4444'; // red-500
    }

    const lastHistoricalScore = scoreDataMap[scoreTimeRange][scoreDataMap[scoreTimeRange].length - 1].value;
    const scoreDiff = operationalScore - (lastHistoricalScore || operationalScore);

    // Dynamic trends logic
    const exposureDiffRaw = 0; // Removed mock data logic
    const conformityDiffRaw = 0; // Removed mock data logic

    let exposicaoOperacionalClass = 'border-green-500 text-green-500 bg-green-500/10';
    if (exposicaoOperacional === 'Alta') exposicaoOperacionalClass = 'border-red-500 text-red-500 bg-red-500/10';
    else if (exposicaoOperacional === 'Média') exposicaoOperacionalClass = 'border-white/20 text-white bg-white/5';

    return {
      operationalScore,
      scoreClass,
      scoreColorText,
      scoreColorBg,
      scoreColorStroke,
      scoreDiff,
      openRisksCount,
      exposicaoOperacional: exposicaoOperacional === 'Média' ? 'Normal' : exposicaoOperacional,
      exposicaoOperacionalClass,
      estimatedExposure,
      avoidedExposure,
      exposureDiffRaw,
      conformityDiffRaw,
      criticalCount,
      criticalActionsCount: criticalActions.length,
      actionsAwaitingValidation: pendingActions.filter(a => a.status === 'Aguardando Validação' || a.status === 'Em Análise').length,
      actionsExpiringTodayCount: actionsExpiringToday.length,
      actionsDelayedCount: atrasadasActions.length,
      actionsNoResponsibleCount: actionsNoResponsible.length,
      vencidasInspectionsCount: vencidasInspections.length,
      pendingInspectionsCount: pendingInspections.length,
      previstasInspectionsCount: previstasInspections.length,
      completedInspectionsCount: completedInspections.length,
      inspExpiringTodayCount: inspExpiringToday.length,
      conformityRate,
      riskSectorData,
      conformidadeNR,
      sortedLogs,
      upcomingActions,
      alertas,
      topRisks: topRisks.slice(0, 5),
      lariRecommendations,
      missingEvidenceCount: pendingActions.filter((a: any) => a.exigeEvidencia && (!a.evidenciaUrl && !a.evidence)).length,
      
      // Inteligencia
      focosCriticos: criticalCount,
      operationsToday: inspTodayTotal.length,
      operationsCompleted: inspTodayCompleted.length,
      operationsPending: inspTodayPending.length,
      
      actionsTotal: pendingActions.length,
      actionsInProgress: emAndamentoActions.length,
      actionsCompleted: concluidasActions.length,
      actionsDelayed: atrasadasActions.length,

      totalTrabalhadoresExpostos,

      checklistsTodayCats,

      pendenciasAbertas,
      pendenciasSemResponsavel,
      pendenciasSemPrazo,
      pendenciasVencemHoje,
      diagTopSector,
      diagTopSectorPercentage,
      prioridadeOperacional,
      updatePlano
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanRiscos, cleanAcoes, cleanInspecoes, cleanChecklists, cleanLogs, scoreTimeRange, isPackageActive]);

  if (!isMounted) {
    return <div className="flex h-screen w-full items-center justify-center bg-[#03060e] text-purple-500">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#03060e] text-gray-300 font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-white/5 shrink-0 gap-4 bg-[#03060e]/80 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            Olá, Operador! <span>👋</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Aqui está o panorama estratégico da segurança hoje.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#0a0f1a] border border-white/5 rounded-lg px-4 py-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>Hoje</span>
          </div>
          
          <button 
            onClick={() => router.push('/notificacoes')}
            className="relative p-2.5 text-gray-400 hover:text-white transition-colors bg-[#0a0f1a] rounded-lg border border-white/5"
          >
            <Bell className="w-5 h-5" />
            {alertas.filter(a => isPackageActive(a.package) && a.status === 'Ativo').length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0f1a]"></span>
            )}
          </button>
          
          <button className="flex items-center bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Download className="w-4 h-4 mr-2" />
            Exportar relatório
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        
        {/* Left/Main Column */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none custom-scrollbar pb-20 transition-all duration-300">
          
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden xl:flex absolute top-1/2 -translate-y-1/2 z-50 bg-[#121826] border border-white/10 p-1.5 rounded-l-lg hover:bg-white/10 transition-all ${isSidebarOpen ? 'right-[320px] shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.5)]' : 'right-0'}`}
          >
            {isSidebarOpen ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronLeft className="w-5 h-5 text-gray-400" />}
          </button>
          
          {/* KPIs SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-5">
            {/* NOVO KPI 0: Pessoas Expostas */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all duration-300 flex flex-col justify-between group relative flex-1">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Pessoas em Risco <Users className="w-3.5 h-3.5 text-red-500" />
                </span>
                <Info className="w-4 h-4 text-gray-500 opacity-50" />
              </div>
              <div className="relative z-10 mt-auto flex flex-col pt-1">
                <div className={`text-[2.5rem] leading-none font-bold tracking-tighter mb-2 ${metrics.totalTrabalhadoresExpostos > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {metrics.totalTrabalhadoresExpostos}
                </div>
                {metrics.totalTrabalhadoresExpostos > 0 ? (
                   <div className="text-[12px] text-red-500 font-bold mb-2 uppercase tracking-wide">Trabalhadores Expostos</div>
                ) : (
                   <div className="text-[12px] text-green-500 font-bold mb-2 uppercase tracking-wide">Nenhuma Exposição</div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                  <span>Em riscos alto/crítico</span>
                </div>
              </div>
            </div>

            {/* KPI 1: Riscos Críticos Abertos */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 flex flex-col justify-between group relative flex-1">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Riscos Críticos <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                </span>
                <Info className="w-4 h-4 text-gray-500 opacity-50" />
              </div>
              <div className="relative z-10 mt-auto flex flex-col pt-1">
                <div className="text-[2.5rem] leading-none font-bold tracking-tighter mb-2 text-red-500">
                  {metrics.criticalCount}
                </div>
                <div className="text-[12px] text-red-500 font-bold mb-2 uppercase tracking-wide">Ação Imediata</div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                  <span>De {metrics.openRisksCount} riscos ativos</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Ações s/ Validação */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 flex flex-col justify-between group relative flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors">s/ Validação</span>
                <CheckSquare className={`w-4 h-4 ${metrics.actionsAwaitingValidation > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
              </div>
              <div className="mt-auto pt-2">
                <div className={`text-[2.5rem] leading-none font-bold tracking-tighter mb-2 ${metrics.actionsAwaitingValidation > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                  {metrics.actionsAwaitingValidation}
                </div>
                {metrics.actionsAwaitingValidation > 0 ? (
                  <div className="text-[12px] text-orange-500 font-bold mb-2 uppercase tracking-wide">Aguardando Aval</div>
                ) : (
                  <div className="text-[12px] text-green-500 font-bold mb-2 uppercase tracking-wide">Fluxo Livre</div>
                )}
                <div className="flex flex-col gap-1 text-[11px] text-gray-400 font-medium">
                   Ações aguardando supervisor
                </div>
              </div>
            </div>

            {/* KPI 4: Evidências Pendentes */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 flex flex-col justify-between group relative flex-1">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Evidências <FileText className="w-3.5 h-3.5 text-blue-400" />
                </span>
                <Info className="w-4 h-4 text-gray-500 opacity-50" />
              </div>
              <div className="relative z-10 mt-auto flex flex-col pt-1">
                <div className={`text-[2.5rem] leading-none font-bold tracking-tighter mb-2 ${metrics.missingEvidenceCount > 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                  {metrics.missingEvidenceCount}
                </div>
                {metrics.missingEvidenceCount > 0 ? (
                  <div className="text-[12px] text-blue-400 font-bold mb-2 uppercase tracking-wide">Anexo Pendente</div>
                ) : (
                  <div className="text-[12px] text-green-500 font-bold mb-2 uppercase tracking-wide">Tudo Anexado</div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                  <span>Itens críticos sem foto/doc</span>
                </div>
              </div>
            </div>

            {/* KPI 5: Multas Estimadas em Aberto */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group flex-1">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Multas Estimadas <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
                </span>
                <Info className="w-4 h-4 text-gray-500 opacity-50" />
              </div>
              <div className="relative z-10 mt-auto flex flex-col pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[1.8rem] font-bold tracking-tighter text-yellow-500 whitespace-nowrap`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metrics.estimatedExposure)}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-gray-500">Passivo atual aberto</div>
              </div>
            </div>

            {/* KPI 6: Multa Evitada */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group flex-1">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Multa Evitada <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                <Info className="w-4 h-4 text-gray-500 opacity-50" />
              </div>
              <div className="relative z-10 mt-auto flex flex-col pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[1.8rem] font-bold tracking-tighter text-emerald-500 whitespace-nowrap`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metrics.avoidedExposure)}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-gray-500">Riscos já tratados</div>
              </div>
            </div>

            {/* KPI 7: NRs com mais Não Conformidades */}
            <div className="bg-[#0a0f1a] p-4 rounded-xl border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 flex flex-col justify-between group relative flex-1 overflow-hidden">
               <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top NRs Ofensoras</span>
                  <HardHat className="w-4 h-4 text-purple-400" />
               </div>
               <div className="mt-auto space-y-2">
                  {metrics.conformidadeNR.slice(0, 2).map((item) => (
                    <div key={item.nr} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-300">{item.nr}</span>
                        <span className="text-gray-500">{item.val}% Conf.</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* INTELIGÊNCIA OPERACIONAL (CARD PRINCIPAL) */}
          <div className="bg-gradient-to-br from-[#120b29] to-[#0a0514] border border-[#7c3aed]/40 p-6 sm:p-8 rounded-xl relative overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.1)]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c3aed]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 mb-8 border-b border-white/10 pb-8">
              <h2 className="text-[22px] font-bold text-white tracking-wide">INTELIGÊNCIA OPERACIONAL</h2>
              <p className="text-base text-gray-400 mt-1">Resumo automático da operação</p>

              {/* CAMADA 1 — Diagnóstico executivo */}
              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 mt-8">
                <div className="flex items-center gap-4 sm:pr-6 py-4 sm:py-0 w-full">
                  <AlertTriangle className={`w-8 h-8 shrink-0 ${metrics.focosCriticos > 0 ? 'text-red-500' : 'text-gray-500'}`} />
                  <span className="text-sm text-gray-200 leading-tight"><strong className="text-lg">{metrics.focosCriticos} focos críticos</strong><br/>exigem ação</span>
                </div>
                <div className="flex items-center gap-4 sm:px-6 py-4 sm:py-0 w-full">
                  <ShieldAlert className={`w-8 h-8 shrink-0 ${metrics.diagTopSectorPercentage > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
                  <span className="text-sm text-gray-200 leading-tight">
                    {metrics.diagTopSectorPercentage > 0 ? (
                      <><strong className="text-lg">{metrics.diagTopSectorPercentage}% da exposição</strong><br/>em {metrics.diagTopSector}</>
                    ) : (
                      <><strong className="text-lg text-gray-400">Risco mitigado</strong><br/>Exposição controlada</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4 sm:px-6 py-4 sm:py-0 w-full">
                  <ShieldCheck className={`w-8 h-8 shrink-0 ${metrics.prioridadeOperacional === 'Focos Críticos' ? 'text-red-500' : 'text-blue-400'}`} />
                  <span className="text-sm text-gray-200 leading-tight">Prioridade:<br/><span className="text-lg text-gray-300">{metrics.prioridadeOperacional}</span></span>
                </div>
                <div className="flex items-center gap-4 sm:pl-6 py-4 sm:py-0 w-full">
                  <TrendingUp className={`w-8 h-8 shrink-0 ${metrics.updatePlano === 'Plano em dia' ? 'text-green-500' : 'text-purple-400'}`} />
                  <span className="text-sm text-gray-200 leading-tight"><strong className={`text-lg ${metrics.updatePlano === 'Plano em dia' ? 'text-green-500' : 'text-purple-400'}`}>{metrics.updatePlano}</strong><br/>ações direcionadas</span>
                </div>
              </div>
            </div>

            {/* CAMADA 2 — Operação resumida */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/10">
              {/* Coluna 1 */}
              <Link href="/operacao/inspecoes" className="block hover:bg-white/[0.02] p-2 -m-2 rounded-xl transition-colors cursor-pointer group">
                <h3 className="text-[12px] font-bold text-gray-400 group-hover:text-[#7c3aed] transition-colors uppercase tracking-widest mb-6">Operação SST Hoje</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <Calendar className="w-5 h-5 text-gray-400 group-hover:text-[#7c3aed] transition-colors" />
                     <span className="text-2xl font-bold text-white w-8">{metrics.operationsToday}</span>
                     <span className="text-sm text-gray-400">Previstas</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <CheckCircle2 className="w-5 h-5 text-green-500" />
                     <span className="text-2xl font-bold text-green-500 w-8">{metrics.operationsCompleted}</span>
                     <span className="text-sm text-gray-400">Concluídas</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <Clock className="w-5 h-5 text-orange-500" />
                     <span className="text-2xl font-bold text-orange-500 w-8">{metrics.operationsPending}</span>
                     <span className="text-sm text-gray-400">Pendentes</span>
                  </div>
                </div>
              </Link>
              
              {/* Coluna 2 */}
              <div className="block p-2 -m-2 rounded-xl transition-colors border-l-2 border-white/5 pl-6 -ml-4 md:border-l-0 md:pl-0 md:ml-0">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-0 md:pl-0 md:ml-0">Plano de Ação</h3>
                <div className="space-y-4">
                  <Link href="/acoes?filter=abertas" className="flex items-center gap-4 group cursor-pointer hover:bg-white/[0.04] p-1 -m-1 rounded transition-colors">
                     <ClipboardCheck className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                     <span className="text-2xl font-bold text-blue-400 w-8 group-hover:text-blue-300 transition-colors">{metrics.actionsTotal}</span>
                     <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Abertas</span>
                  </Link>
                  <Link href="/acoes?filter=andamento" className="flex items-center gap-4 group cursor-pointer hover:bg-white/[0.04] p-1 -m-1 rounded transition-colors">
                     <Activity className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                     <span className="text-2xl font-bold text-orange-500 w-8 group-hover:text-orange-400 transition-colors">{metrics.actionsInProgress}</span>
                     <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Em andamento</span>
                  </Link>
                  <Link href="/acoes?filter=concluidas" className="flex items-center gap-4 group cursor-pointer hover:bg-white/[0.04] p-1 -m-1 rounded transition-colors">
                     <CheckCircle2 className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                     <span className="text-2xl font-bold text-green-500 w-8 group-hover:text-green-400 transition-colors">{metrics.actionsCompleted}</span>
                     <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Concluídas</span>
                  </Link>
                  <Link href="/acoes?filter=atrasadas" className="flex items-center gap-4 group cursor-pointer hover:bg-white/[0.04] p-1 -m-1 rounded transition-colors">
                     <AlertTriangle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                     <span className="text-2xl font-bold text-red-500 w-8 group-hover:text-red-400 transition-colors">{metrics.actionsDelayed}</span>
                     <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Atrasadas</span>
                  </Link>
                </div>
              </div>

              {/* Coluna 3 */}
              <div className="block p-2 -m-2 rounded-xl transition-colors border-l-2 border-white/5 pl-6 -ml-4 md:border-l-0 md:pl-0 md:ml-0">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-0 md:pl-0 md:ml-0">Pessoas Críticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <Users className="w-5 h-5 text-purple-400" />
                     <span className="text-2xl font-bold text-purple-400 w-8">42</span>
                     <span className="text-sm text-gray-400">Monitorados</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <GraduationCap className="w-5 h-5 text-orange-400" />
                     <span className="text-2xl font-bold text-orange-400 w-8">8</span>
                     <span className="text-sm text-gray-400">Treinamento pendente</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <UserX className="w-5 h-5 text-red-500" />
                     <span className="text-2xl font-bold text-red-500 w-8">3</span>
                     <span className="text-sm text-gray-400">Sem EPI</span>
                  </div>
                </div>
              </div>

              {/* Coluna 4 - Conformidade NR */}
              <div className="block p-2 -m-2 rounded-xl transition-colors border-l-2 border-white/5 pl-6 -ml-4 md:border-l-0 md:pl-0 md:ml-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-0 md:pl-0 md:ml-0">Conformidade NR</h3>
                  <div className="space-y-4">
                    {metrics.conformidadeNR.slice(0, 4).map(item => (
                      <div key={item.nr} className="flex items-center gap-3 group">
                        <span className="text-[11px] leading-tight font-semibold text-gray-400 w-12 truncate" title={item.nr}>{item.nr}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-in-out`} style={{ width: isMounted ? `${item.val}%` : '0%' }}></div>
                        </div>
                        <span className="text-[12px] font-bold text-gray-200 w-8 text-right">{item.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/central" className="mt-4 inline-block">
                  <span className="text-[11px] text-[#7c3aed] font-medium cursor-pointer hover:underline">Ver análises completas</span>
                </Link>
              </div>
            </div>

            {/* Botoes Rodape do Card */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-2">
              <Link href="/central">
                <button className="w-full sm:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] px-6 py-3 rounded-lg text-white font-bold text-sm transition-all flex items-center justify-center gap-2 relative shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                   Abrir Central de Inteligência <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <Link href="/operacao/riscos" className="w-full sm:w-auto text-gray-300 hover:text-white font-medium text-sm flex items-center justify-center gap-2 group transition-colors">
                Ver riscos <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <div className="hidden sm:block w-px h-6 bg-white/10 ml-auto mx-4 flex-shrink-0"></div>
              <button className="w-full sm:w-auto text-gray-300 hover:text-white font-medium text-sm flex items-center justify-center gap-2 group transition-colors">
                Gerar relatório <Download className="w-4 h-4 text-gray-500 group-hover:text-white transition-all" />
              </button>
            </div>
          </div>

          {/* LINHA ABAIXO DO CARD PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1.7fr] gap-5">
            {/* 1. Riscos que exigem ação */}
            <div className="bg-[#0a0f1a] border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 rounded-xl flex flex-col overflow-hidden">
              <div className="px-4 sm:px-5 py-0 border-b border-white/5 flex items-center justify-between bg-[#0b0f19] h-[55px]">
                <h3 className="text-[11px] font-bold text-[#b48bf8] uppercase tracking-wider">Riscos que exigem ação</h3>
                <Link href="/riscos">
                  <span className="text-[11px] text-[#7c3aed] font-medium cursor-pointer hover:underline">Ver todos</span>
                </Link>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[9px] text-gray-500 uppercase tracking-widest bg-[#03060e]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">NR</th>
                      <th className="px-4 py-2 font-semibold">Setor</th>
                      <th className="px-4 py-2 font-semibold">Tipo</th>
                      <th className="px-4 py-2 font-semibold text-center">Pessoas Exp.</th>
                      <th className="px-4 py-2 font-semibold text-right">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {metrics.topRisks.length > 0 ? metrics.topRisks.map((r) => (
                      <tr key={r.id} onClick={() => router.push(`/riscos?search=${r.id}`)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                        <td className="px-4 py-2.5 text-gray-300 max-w-[60px]">
                            <div className="line-clamp-2 text-[11px] leading-tight break-words">{r.nr || '-'}</div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 max-w-[70px]">
                           <div className="line-clamp-2 text-[11px] leading-tight break-words">
                              {(() => {
                                 const s = r.setor || r.sector_id || '';
                                 if (!s) return '-';
                                 const lower = s.toLowerCase();
                                 if (lower.includes('manuten')) return 'Manut.';
                                 if (lower.includes('operacion') || lower.includes('operação')) return 'Operac.';
                                 if (lower.includes('produç') || lower.includes('produc')) return 'Prod.';
                                 if (lower.includes('logístic') || lower.includes('logistic')) return 'Logíst.';
                                 if (lower.includes('administra') || lower.includes('admin')) return 'Admin.';
                                 if (lower.includes('seguran')) return 'Seg.';
                                 return s.length > 8 ? s.substring(0, 8) + '.' : s;
                              })()}
                           </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-300 max-w-[100px]">
                           <div className="line-clamp-2 text-[11px] leading-tight break-words">{r.tipoDeRisco || r.title || r.atividade || 'Não especificado'}</div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                           <span className={`text-[11px] font-bold ${r.trabalhadoresExpostos > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                             {r.trabalhadoresExpostos || 0}
                           </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                           <span className={`inline-block border text-[9px] font-bold px-2 py-0.5 rounded uppercase
                             ${(r.nivel || r.level) === 'Crítico' || (r.nivel || r.level) === 'Alto' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}
                           `}>
                             {r.nivel || r.level}
                           </span>
                        </td>
                      </tr>
                    )) : (
                       <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Sem dados suficientes</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Risco por Setor */}
            <div className="bg-[#0a0f1a] border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 rounded-xl flex flex-col overflow-hidden">
               <div className="px-4 sm:px-5 py-0 border-b border-white/5 flex flex-col justify-center bg-[#0b0f19] h-[55px]">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Risco por Setor</h3>
              </div>
              <div className="p-4 sm:px-5 sm:py-3 flex-1 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-6">
                  <div className="h-[110px] w-[110px] relative shrink-0">
                    <ResponsiveContainer width={110} height={110}>
                      <PieChart>
                        <Pie
                          data={metrics.riskSectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {metrics.riskSectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#121826', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                           itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[9px] text-gray-400 font-bold uppercase">Riscos</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 shrink-0">
                    {metrics.riskSectorData.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-start group gap-4">
                        <div className="flex items-center gap-1.5 overflow-hidden w-[65px] pt-[3px]">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[11px] font-medium text-gray-300 truncate group-hover:text-white transition-colors" title={item.name}>{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                           {item.isEmpty ? (
                               <span className="text-gray-600 text-[10px]">Sem dados</span>
                           ) : (
                              <div className="flex flex-col items-end leading-tight">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[12px] font-bold text-white">{item.value}</span>
                                  <span className="text-[10px] text-gray-400 font-medium">({item.percent}%)</span>
                                </div>
                                {item.avgPriorityLabel && (
                                   <span className="text-[9px] text-gray-500 font-medium mt-0.5">Prio. <span className={item.avgPriorityLabel === 'Crítico' || item.avgPriorityLabel === 'Alto' ? 'text-red-400/80' : 'text-orange-400/80'}>{item.avgPriorityLabel}</span></span>
                                )}
                              </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Evolução da Segurança */}
            <div className="bg-[#0a0f1a] border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 rounded-xl flex flex-col overflow-hidden">
              <div className="px-4 sm:px-5 py-0 border-b border-white/5 flex items-center justify-between bg-[#0b0f19] h-[55px]">
                <div className="flex items-center gap-3">
                  <div className="bg-[#7c3aed]/20 p-1.5 rounded-lg border border-[#7c3aed]/30">
                    <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-white">Evolução da segurança</h3>
                    <p className="text-[10px] text-gray-500">Tendência de risco operacional ao longo do tempo.</p>
                  </div>
                </div>
                <div className="flex items-center bg-[#121826] border border-white/5 rounded-lg overflow-hidden pr-2">
                   <select 
                     value={scoreTimeRange} 
                     onChange={(e) => setScoreTimeRange(e.target.value as any)}
                     className="bg-transparent text-gray-300 text-[11px] font-medium px-3 py-1.5 appearance-none focus:outline-none cursor-pointer"
                   >
                     <option className="bg-[#121826]" value="semana">Últimos 7 dias</option>
                     <option className="bg-[#121826]" value="mes">Últimos 30 dias</option>
                     <option className="bg-[#121826]" value="ano">Este ano</option>
                   </select>
                </div>
              </div>
              
              <div className="p-4 sm:px-5 sm:py-3 flex-1 flex flex-col sm:flex-row gap-6">
                {/* Left Side (Line Chart) */}
                <div className="flex-1 min-h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreDataMap[scoreTimeRange].concat([{ name: 'Atual', value: metrics.operationalScore }])} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScoreUpdate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121826', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        formatter={(value: any) => [`${value}`, 'Score']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#7c3aed" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorScoreUpdate)" 
                        activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Right Side (Card) */}
                <div className="shrink-0 w-full sm:w-[130px] flex flex-col justify-center">
                  <div className="bg-[#121826] border border-white/5 rounded-xl p-4 flex flex-col items-start w-full h-full justify-center">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Risco atual</span>
                    <div className="text-3xl font-bold text-[#b48bf8] leading-none mb-1">{metrics.operationalScore}</div>
                    <span className="text-[11px] text-green-400 font-medium mb-4">{metrics.scoreClass}</span>
                    
                    <div className="flex flex-col items-start gap-1">
                       {metrics.scoreDiff !== 0 ? (
                         <>
                           <span className={`text-[12px] font-bold flex items-center gap-1 ${metrics.scoreDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                             {metrics.scoreDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} 
                             {metrics.scoreDiff > 0 ? `+${metrics.scoreDiff}%` : `${metrics.scoreDiff}%`}
                           </span>
                           <span className="text-[9px] text-gray-500">vs. período anterior</span>
                         </>
                       ) : (
                         <span className="text-[10px] text-gray-500 mt-2">Sem variação no período</span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={`hidden xl:flex flex-col bg-[#0a0f1a] border-l border-white/5 h-full overflow-y-auto overflow-x-hidden custom-scrollbar shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[320px] p-5 space-y-5 opacity-100' : 'w-0 p-0 opacity-0 border-none'}`}>
          
          {/* Card 1: Alertas Críticos */}
          <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Alertas Críticos</h3>
              <Link href="/riscos">
                <span className="text-[10px] text-[#7c3aed] font-medium cursor-pointer hover:underline">Ver todos</span>
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {metrics.alertas.length > 0 ? metrics.alertas.slice(0, 3).map(a => (
                <Link href={a.link || '#'} key={a.id} className="flex gap-3 items-start p-2 -mx-2 rounded hover:bg-white/5 transition-colors cursor-pointer group">
                  <a.icon className={`w-4 h-4 ${a.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                     <p className="text-xs text-gray-200 font-bold mb-0.5 group-hover:text-white transition-colors truncate">{a.title}</p>
                     <p className="text-[10px] text-gray-400 line-clamp-2">{a.desc}</p>
                  </div>
                </Link>
              )) : (
                 <div className="text-center py-4 text-gray-500 text-xs">Nenhum alerta crítico no momento.</div>
              )}
            </div>
          </div>

          {/* Card 2: Recomendações da Lari */}
          <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0 relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="p-4 border-b border-white/5 flex items-center gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Recomendações da L.A.R.I.</h3>
            </div>
            <div className="p-4 space-y-3 relative z-10">
              {metrics.lariRecommendations.length > 0 ? metrics.lariRecommendations.map((rec: string, i: number) => (
                 <div key={i} className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                    <p className="text-xs text-gray-300 leading-snug">{rec}</p>
                 </div>
              )) : (
                 <div className="text-center py-4 text-gray-500 text-xs">Nenhuma recomendação no momento.</div>
              )}
            </div>
          </div>

          {/* Card 3: Itens Sem Responsável */}
          <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Sem Responsável</h3>
            </div>
            <div className="p-4 space-y-4">
              {metrics.alertas.filter(a => a.type === 'sem_resp').length > 0 ? metrics.alertas.filter(a => a.type === 'sem_resp').slice(0, 3).map(a => (
                <Link href={a.link || '#'} key={a.id} className="flex gap-3 items-center p-2 -mx-2 rounded hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
                     <UserX className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs text-gray-200 font-bold mb-0.5 truncate">{a.desc}</p>
                     <p className="text-[10px] text-red-400">{a.title}</p>
                  </div>
                </Link>
              )) : (
                 <div className="text-center py-4 text-gray-500 text-xs">Todos os itens têm responsáveis!</div>
              )}
            </div>
          </div>

          {/* Card 4: Últimos Riscos e Ações */}
          <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Recentes (Riscos e Ações)</h3>
            </div>
            <div className="p-4 space-y-4">
              {metrics.sortedLogs.filter((l: any) => l.event_type.includes('criad') || l.event_type.includes('registrado')).length > 0 ? 
                 metrics.sortedLogs.filter((l: any) => l.event_type.includes('criad') || l.event_type.includes('registrado')).slice(0, 3).map((log: any) => {
                const isRisco = log.origin_type === 'Risco';
                return (
                  <div key={log.id} className="flex gap-3 items-start relative group">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isRisco ? 'bg-orange-500' : 'bg-blue-400'}`}></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs text-gray-200 font-medium leading-snug line-clamp-2" title={log.description}>{log.description}</p>
                       <p className="text-[9px] text-gray-500 font-bold tracking-wider mt-1">{log.timeStr}</p>
                    </div>
                  </div>
                )
              }) : (
                 <div className="text-center py-4 text-gray-500 text-xs">Nenhum registro recente recém-criado.</div>
              )}
            </div>
          </div>

          {/* Card 4: L.A.R.I */}
          <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 flex flex-col items-center text-center mt-auto shrink-0 relative">
            <div className="flex items-center gap-3 w-full mb-3">
              <div className="w-12 h-12 rounded-full bg-[#1e1145] flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <div className="flex flex-col items-start px-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-widest">L.A.R.I.</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">BETA</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-6 text-left w-full px-1">
              Seu assistente IA para segurança do trabalho.
            </p>
            <Link href="/chat" className="w-full">
              <button className="w-full bg-[#1e1145] hover:bg-[#2d1b6e] text-purple-100 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border border-purple-500/20">
                <MessageSquare className="w-5 h-5 opacity-70" />
                Abrir chat
              </button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
