"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import TimelineHistory from '@/components/TimelineHistory';
import { 
  Plus, AlertTriangle, X, ChevronRight,
  Shield, Activity, Settings, Settings2, Clock, CheckCircle2,
  UserPlus, ShieldAlert,
  TrendingUp, TrendingDown, Waves, FlaskConical, Users, BarChart2, Trash2, Filter, Zap, BadgeInfo, ArrowRight, ShieldCheck, RefreshCw, HardHat,
  DollarSign, ArrowDownRight, PieChart as PieChartIcon,
  Factory, Wrench, Truck, Package, User, Info, FileText, Bot, Calendar, Eye, File, CalendarDays
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import {
  calcularPrioridade, 
  calcularPrazo, 
  calcularMultaEstimada, 
  calcularChanceIncidente, 
  calcularImpactoOperacional, 
  calcularNivelConformidade,
  formatCurrency,
  RiskInstance,
  NivelRisco,
  applyManualRules,
  getNrMetrics
} from '@/lib/risk-calculations';
import { buildTargetRisksViewModel } from '@/lib/motor/adapters/risksAdapter.js';
import { buildRiskHistoryViewModel, buildRiskAuditDetailViewModel } from '@/lib/motor/adapters/auditAdapter.js';

import Sparkline from '@/components/Sparkline';

const SPARK_COLORS = {
  purple: '#a855f7',
  red: '#ef4444',
  emerald: '#10b981',
  orange: '#f97316',
  blue: '#3b82f6',
  yellow: '#eab308'
};


const PIE_COLORS = {
  Crítico: '#ef4444',
  Alto: '#f97316',
  Médio: '#eab308',
  Baixo: '#10b981'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121826] border border-white/10 p-3 rounded-lg shadow-xl shrink-0 whitespace-nowrap z-[100]">
        <p className="text-[13px] font-bold text-white mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-[12px]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555' }}></div>
            <span className="text-gray-300">{entry.name === 'Total' || entry.name === 'value' ? 'Valor' : entry.name}:</span>
            <span className="font-bold text-white whitespace-nowrap">
              {entry.value > 1000 ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

type RiskInstanceLocal = RiskInstance; // Keep for internal type alias if needed or just use RiskInstance

const ATIVIDADES_OPCOES = [
  'Trabalho em altura',
  'Manutenção elétrica',
  'Operação de máquinas',
  'Espaço confinado',
  'Trabalho a quente',
  'Movimentação de cargas',
  'Outras atividades'
];



const SUB_TABS = ['Visão Geral', 'Atividade', 'Setor', 'Tipo', 'Histórico'] as const;
type TabType = typeof SUB_TABS[number];

export default function RiscosPage() {
  const store = useAppStore();
  const { sectors, inspecoes, riscos: rawRiscos = [], acoes: rawAcoes = [], rulePackages } = store;
  const SETORES_OPCOES = sectors.map(s => s.name);

  const filterJunk = (items: any[]) => {
    return items.filter(i => {
      const textFields = [i.title, i.titulo, i.descricao, i.name, i.nome, i.atividade, i.nr, i.responsavel, i.category].filter(Boolean).join(' ').toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!i.title && !i.titulo && !i.atividade && !i.nome && !i.name && !i.descricao && !i.category) return false;
      return true;
    });
  };

  const activePackageNames = useMemo(() => rulePackages.filter(p => p.isActive).map(p => p.name), [rulePackages]);
  
  const [showInactivePackages, setShowInactivePackages] = useState(false);

  const risksViewModel = useMemo(() => {
    return buildTargetRisksViewModel(
      {
        ...store,
        riscos: filterJunk(rawRiscos || []),
        acoes: filterJunk(rawAcoes || []),
      },
      {
        activePackages: activePackageNames,
        includeInactivePackages: showInactivePackages,
      },
    );
  }, [store, rawRiscos, rawAcoes, activePackageNames, showInactivePackages]);

  const storeRiscos = useMemo(() => risksViewModel.risks || [], [risksViewModel]);
  const storeAcoes = useMemo(() => filterJunk(rawAcoes || []), [rawAcoes]);

  const [activeTab, setActiveTab] = useState<TabType>('Visão Geral');
  const [tipoFilter, setTipoFilter] = useState<'Todos' | NivelRisco>('Todos');

  const combinedData = useMemo(() => {
    return storeRiscos.map((risk: any) => ({
      ...risk,
      nivel: ((risk.nivel || 'Baixo') as NivelRisco),
    }) as RiskInstance);
  }, [storeRiscos]);

  const riskHistoryList = useMemo(() => {
    return buildRiskHistoryViewModel(store, combinedData as any[]);
  }, [store, combinedData]);

  const riskHistoryById = useMemo(() => {
    return riskHistoryList.reduce((acc, item) => {
      acc[item.riskId] = item;
      return acc;
    }, {} as Record<string, any>);
  }, [riskHistoryList]);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerActionOpen, setIsDrawerActionOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<RiskInstance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState<Partial<RiskInstance>>({
    atividade: 'Trabalho em altura',
    setor: 'Manutenção',
    hasEpiEpc: true,
    hasProcedimento: true,
    hasTreinamento: true,
    status: 'Aberto',
    trabalhadoresExpostos: 0,
    perfilExposto: '',
    executorCorrecao: '',
    validadorCorrecao: ''
  });
  
  const [selectedAction, setSelectedAction] = useState<RiskInstance | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);

  const selectedRiskAudit = useMemo(() => {
    return selectedAction ? buildRiskAuditDetailViewModel(store, selectedAction as any) : null;
  }, [store, selectedAction]);

  const getNivelColor = (nivel?: NivelRisco) => {
    switch(nivel) {
      case 'Crítico': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Alto': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getRiskTypeIcon = (tipo: string) => {
    const term = tipo.toLowerCase();
    if (term.includes('queda')) return <TrendingDown className="w-5 h-5 text-purple-400" />;
    if (term.includes('choque') || term.includes('elétric')) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (term.includes('asfixia') || term.includes('afogamento')) return <Waves className="w-5 h-5 text-blue-400" />;
    if (term.includes('químic')) return <FlaskConical className="w-5 h-5 text-emerald-400" />;
    if (term.includes('máquina') || term.includes('prensamento') || term.includes('corte')) return <Settings className="w-5 h-5 text-orange-400" />;
    if (term.includes('ergonômico') || term.includes('físico') || term.includes('esforço')) return <Activity className="w-5 h-5 text-indigo-400" />;
    if (term.includes('incêndio') || term.includes('explosão')) return <AlertTriangle className="w-5 h-5 text-red-400" />;
    return <AlertTriangle className="w-5 h-5 text-gray-400" />;
  };

  const getRiskOrigem = (tipo: string) => {
    const term = tipo.toLowerCase();
    if (term.includes('queda') || term.includes('choque') || term.includes('elétric') || term.includes('máquina') || term.includes('prensamento') || term.includes('corte') || term.includes('incêndio') || term.includes('explosão') || term.includes('atropelamento') || term.includes('impacto') || term.includes('esmagamento')) return 'Acidentes (Mecânicos)';
    if (term.includes('químic') || term.includes('asfixia') || term.includes('afogamento') || term.includes('gases')) return 'Químicos';
    if (term.includes('ergonômic') || term.includes('esforço') || term.includes('repetit')) return 'Ergonômicos';
    if (term.includes('biológic') || term.includes('vírus') || term.includes('bactéri')) return 'Biológicos';
    return 'Físicos';
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Aberto': return 'text-red-400 border-red-500/20';
      case 'Em análise': return 'text-orange-400 border-orange-500/20';
      case 'Mitigado': return 'text-yellow-400 border-yellow-500/20';
      case 'Resolvido': return 'text-emerald-400 border-emerald-500/20';
      default: return 'text-gray-400 border-gray-500/20';
    }
  };

  const getActivityIcon = (atividade: string) => {
    const term = atividade.toLowerCase();
    switch(term) {
      case 'produção': return <Factory className="w-5 h-5 text-gray-400" />;
      case 'manutenção': return <Wrench className="w-5 h-5 text-gray-400" />;
      case 'operacional': return <Shield className="w-5 h-5 text-gray-400" />;
      case 'logística': return <Truck className="w-5 h-5 text-gray-400" />;
      case 'almoxarifado': return <Package className="w-5 h-5 text-gray-400" />;
      case 'administrativo': return <User className="w-5 h-5 text-gray-400" />;
      case 'trabalho em altura': return <Activity className="w-5 h-5 text-purple-400" />;
      case 'manutenção elétrica': return <Settings2 className="w-5 h-5 text-blue-400" />;
      case 'operação de máquinas': return <Settings className="w-5 h-5 text-orange-400" />;
      case 'espaço confinado': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'movimentação de cargas': return <Truck className="w-5 h-5 text-yellow-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    useAppStore.getState().deleteRisco(id);
    setIsDrawerOpen(false);
  };

  const riscosReincidentes = useMemo(() => {
     return storeRiscos.filter((r: any) => r.reincidente || r.isRecurring).length;
  }, [storeRiscos]);

  const riscosPorFiltroGlobal = useMemo(() => {
    return {
      critico: storeRiscos.filter((r: any) => r.nivel === 'Crítico' || r.criticidade === 'Muito Alta').length,
      totalAbertos: storeRiscos.filter((r: any) => r.status && r.status !== 'Resolvido' && r.status !== 'Mitigado').length,
      totalMulta: storeRiscos.filter((r: any) => r.status && r.status !== 'Resolvido' && r.status !== 'Mitigado')
                      .reduce((acc: number, r: any) => acc + (r.multaEstimada || 0), 0),
      reincidentes: riscosReincidentes,
      nrsCount: Array.from(new Set(storeRiscos.map((r: any) => r.nr).filter(Boolean))).length
    };
  }, [storeRiscos, riscosReincidentes]);

  const storeAddRisco = useAppStore(state => state.addRisco);
  const storeUpdateRisco = useAppStore(state => state.updateRisco);

  const handleSaveForm = () => {
    const evaluated = applyManualRules(formData);
    if (editingItem) {
      storeUpdateRisco(editingItem.id, evaluated);
    } else {
      storeAddRisco(evaluated);
    }
    setIsDrawerOpen(false);
  };

  // Views Data Prep
  const filteredData = useMemo(() => {
    let result = combinedData;
    if (activeTab === 'Tipo' && tipoFilter !== 'Todos') {
      result = combinedData.filter(d => d.nivel === tipoFilter);
    }
    return result.sort((a,b) => a.prioridade > b.prioridade ? 1 : -1);
  }, [combinedData, activeTab, tipoFilter]);
  
  const criticosCount = combinedData.filter(d => d.nivel === 'Crítico').length;
  const altosCount = combinedData.filter(d => d.nivel === 'Alto').length;
  const mediosCount = combinedData.filter(d => d.nivel === 'Médio').length;
  const baixosCount = combinedData.filter(d => d.nivel === 'Baixo').length;
  
  const abertosCount = combinedData.filter(d => d.status === 'Aberto' || d.status === 'Em análise' || d.status === 'Em andamento').length;
  const resolvidosCount = combinedData.filter(d => d.status === 'Resolvido' || d.status === 'Mitigado').length;
  
  // Setor com mais riscos
  const countBySector = combinedData.reduce((acc, curr) => {
    acc[curr.setor] = (acc[curr.setor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topSector = Object.keys(countBySector).sort((a,b) => countBySector[b] - countBySector[a])[0] || 'N/A';

  const sectorGroups = useMemo(() => {
    const groups: Record<string, {
      setor: string;
      count: number;
      crits: number;
      altos: number;
      medios: number;
      baixos: number;
      multaTotal: number;
      chanceSum: number;
      riscosNames: string[];
      nrs: string[];
      lastRecord: Date;
    }> = {};

    combinedData.filter(r => r.status && r.status !== 'Resolvido' && r.status !== 'Mitigado').forEach(r => {
        const s = r.setor || 'Diversos';
        if (!groups[s]) {
            groups[s] = {
                setor: s, count: 0, crits: 0, altos: 0, medios: 0, baixos: 0,
                multaTotal: 0, chanceSum: 0, riscosNames: [], nrs: [], lastRecord: new Date('2000-01-01')
            };
        }
        const obj = groups[s];
        obj.count++;
        if (r.nivel === 'Crítico') obj.crits++;
        else if (r.nivel === 'Alto') obj.altos++;
        else if (r.nivel === 'Médio') obj.medios++;
        else obj.baixos++;

        obj.multaTotal += r.multaEstimada || 0;
        obj.chanceSum += r.chanceIncidente || 0;
        if (r.tipoDeRisco && !obj.riscosNames.includes(r.tipoDeRisco)) obj.riscosNames.push(r.tipoDeRisco);
        if (r.nr && !obj.nrs.includes(r.nr)) obj.nrs.push(r.nr);
        const rd = new Date(r.criadoEm || r.dataLancamento || new Date());
        if (rd > obj.lastRecord) obj.lastRecord = rd;
    });

    const list = Object.values(groups).sort((a,b) => b.crits - a.crits || b.multaTotal - a.multaTotal);
    return list;
  }, [combinedData]);

  const totalSetoresAtivos = countBySector ? Object.keys(countBySector).length : 0;
  const maxCritSector = sectorGroups.length > 0 ? sectorGroups[0] : null; // Already sorted by crits
  const maxConcSector = sectorGroups.length > 0 ? [...sectorGroups].sort((a,b) => b.count - a.count)[0] : null;
  const totalMultaSetores = sectorGroups.reduce((acc, s) => acc + s.multaTotal, 0);
  const totalRiscosSetores = sectorGroups.reduce((acc, s) => acc + s.count, 0);

  const [selectedSectorItem, setSelectedSectorItem] = useState<any>(null);

  // Atividade com mais riscos
  const countByActivity = combinedData.reduce((acc, curr) => {
    acc[curr.atividade] = (acc[curr.atividade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topActivity = Object.keys(countByActivity).sort((a,b) => countByActivity[b] - countByActivity[a])[0] || 'N/A';

  // Tipo mais frequente
  const countByType = combinedData.reduce((acc, curr) => {
    acc[curr.tipoDeRisco] = (acc[curr.tipoDeRisco] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topType = Object.keys(countByType).sort((a,b) => countByType[b] - countByType[a])[0] || 'N/A';

  // Computed Financial e EHS Stats
  const totalMultaAberto = combinedData
    .filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado')
    .reduce((sum, curr) => sum + (curr.multaEstimada || 0), 0);
  
  const totalChance = combinedData
    .filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado')
    .reduce((sum, curr) => sum + (curr.chanceIncidente || 0), 0);
  
  const abertosCountStats = combinedData.filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado').length;
  const avgChanceIncidente = abertosCountStats > 0 ? Math.round(totalChance / abertosCountStats) : 0;

  const topRiscosMulta = [...combinedData]
    .filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado')
    .sort((a, b) => (b.multaEstimada || 0) - (a.multaEstimada || 0))
    .slice(0, 5);

  const multaPorSetor = combinedData
    .filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado')
    .reduce((acc, curr) => {
      acc[curr.setor] = (acc[curr.setor] || 0) + (curr.multaEstimada || 0);
      return acc;
    }, {} as Record<string, number>);

  const barDataMultaSetor = Object.keys(multaPorSetor).map(key => ({
    name: key.length > 15 ? key.substring(0, 15) + '...' : key,
    value: multaPorSetor[key]
  })).sort((a,b) => b.value - a.value).slice(0, 5);

  const pieDataNivel = [
    { name: 'Crítico', value: criticosCount, color: '#ef4444' },
    { name: 'Alto', value: altosCount, color: '#f97316' },
    { name: 'Médio', value: mediosCount, color: '#eab308' },
    { name: 'Baixo', value: baixosCount, color: '#10b981' }
  ].filter(d => d.value > 0);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const mockTrend = [5, 7, 6, 8, 10, 9, 12, 10, 15, 14, 18];

  const topCards = [
    { id: 'c9', label: 'Total de riscos', val: combinedData.length, sub: '+4 no último mês', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', trend: mockTrend, sparkColor: SPARK_COLORS.purple },
    { id: 'c5', label: 'Críticos em aberto', val: criticosCount, sub: 'Exigem ação imediata', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', trend: mockTrend, sparkColor: SPARK_COLORS.red },
    { id: 'c10', label: 'Multa estimada em aberto', val: formatCurrency(totalMultaAberto), sub: 'Potencial de multas', icon: BadgeInfo, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', trend: mockTrend, sparkColor: SPARK_COLORS.yellow },
    { id: 'c11', label: 'Chance média de incidente', val: `${Math.round(avgChanceIncidente)}%`, sub: 'Risco moderado', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  const nrMetrics = useMemo(() => getNrMetrics({ inspections: inspecoes || [], risks: combinedData, actions: storeAcoes }), [inspecoes, combinedData, storeAcoes]);

  let nrBarData = nrMetrics.map(m => ({ name: m.nr, Total: m.multaEstimada })).sort((a,b) => b.Total - a.Total).slice(0, 6);
  let nrRiscosData = nrMetrics.map(m => ({ name: m.nr, Total: m.totalRiscos, Críticos: m.riscosCriticos })).sort((a,b) => b.Total - a.Total).slice(0, 6);
  let avgChanceData = nrMetrics.map(m => ({ name: m.nr, Chance: m.chanceMediaIncidente })).sort((a,b) => b.Chance - a.Chance).slice(0, 6);

  const origemCounts: Record<string, number> = {};
  combinedData.forEach(r => {
    const o = r.origem || 'Manual';
    origemCounts[o] = (origemCounts[o] || 0) + 1;
  });
  const pieDataOrigem = Object.entries(origemCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const topRisksByChance = [...combinedData]
    .filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado')
    .sort((a,b) => (b.chanceIncidente || 0) - (a.chanceIncidente || 0))
    .slice(0, 5);
  
  const renderTopRisksChance = topRisksByChance.map(r => ({
    name: r.titulo || r.atividade || r.id,
    chance: r.chanceIncidente || 0
  }));

  const listRiscos = topRisksByChance.length > 0 ? combinedData.filter(r => r.nivel === 'Crítico').slice(0,5) : [];

  const activityGroups: Record<string, {
    count: number;
    riscosNames: string[];
    setores: string[];
    nrs: string[];
    multaTotal: number;
    chanceSum: number;
    maxNivelValue: number;
    maxNivelName: string;
    episTotal: number;
    episAusentes: number;
    nrString: string;
    atividade: string;
  }> = {};

  const nivelToValue = { 'Crítico': 4, 'Alto': 3, 'Médio': 2, 'Baixo': 1 };
  
  combinedData.filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado').forEach(r => {
    const act = r.atividade || 'Diversos';
    const pacote = r.pacote || r.package || 'Base SST';
    if (!activityGroups[act]) {
      activityGroups[act] = {
        count: 0,
        riscosNames: [],
        setores: [],
        nrs: [],
        multaTotal: 0,
        chanceSum: 0,
        maxNivelValue: 0,
        maxNivelName: 'Baixo',
        episTotal: 0,
        episAusentes: 0,
        nrString: r.nr || 'NR-Geral',
        atividade: act,
        pacotes: []
      };
    }
    
    const obj = activityGroups[act] as any;
    obj.count++;
    if (r.tipoDeRisco && !obj.riscosNames.includes(r.tipoDeRisco)) obj.riscosNames.push(r.tipoDeRisco);
    if (r.setor && !obj.setores.includes(r.setor)) obj.setores.push(r.setor);
    if (r.nr && !obj.nrs.includes(r.nr)) obj.nrs.push(r.nr);
    if (pacote && !obj.pacotes.includes(pacote)) obj.pacotes.push(pacote);
    obj.multaTotal += r.multaEstimada || 0;
    obj.chanceSum += r.chanceIncidente || 0;
    
    const nv = nivelToValue[r.nivel as keyof typeof nivelToValue] || 1;
    if (nv > obj.maxNivelValue) {
      obj.maxNivelValue = nv;
      obj.maxNivelName = r.nivel as string;
    }

    obj.episTotal += 1;
    if (!r.hasEpiEpc) obj.episAusentes += 1;
  });

  const sortedActivities = Object.values(activityGroups).sort((a,b) => b.maxNivelValue - a.maxNivelValue || b.multaTotal - a.multaTotal);

  const totalAtividades = Object.keys(activityGroups).length;
  const atividadesCriticas = Object.values(activityGroups).filter(a => a.maxNivelName === 'Crítico').length;
  const maiorAtividade = sortedActivities[0]?.atividade || 'N/A';
  const totalMultaAbertoActivity = sortedActivities.reduce((sum, a) => sum + a.multaTotal, 0);

  const getPercentage = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0b0f19]">
      <motion.div layout className={`flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300 ${isDrawerActionOpen || isDrawerOpen || selectedSectorItem ? 'lg:pr-[400px]' : ''}`}>
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <div className="flex flex-col gap-2 shrink-0 mb-6 mt-2">
             <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                 <span>Operação</span>
                 <span>&gt;</span>
                 <span className="text-gray-300">Riscos</span>
                 <span>&gt;</span>
                 <span className="text-purple-400">{activeTab}</span>
             </div>
             <header className="flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto custom-scrollbar gap-1">
              {SUB_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsDrawerActionOpen(false);
                    setSelectedSectorItem(null);
                    setTimeout(() => setSelectedAction(null), 300);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                      : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab === 'Visão Geral' && <BarChart2 className="w-4 h-4" />}
                  {tab === 'Atividade' && <Activity className="w-4 h-4" />}
                  {tab === 'Setor' && <Users className="w-4 h-4" />}
                  {tab === 'Tipo' && <ShieldAlert className="w-4 h-4" />}
                  {tab === 'Histórico' && <Clock className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
               <button onClick={() => {
                 setFormData({ 
                   titulo: '',
                   atividade: 'Trabalho em altura', 
                   setor: 'Produção', 
                   justificativa: '',
                   evidencias: '',
                   acaoVinculada: '',
                   responsavel: '',
                   severidade: 'Média',
                   status: 'Aberto',
                   hasEpiEpc: false, 
                   hasProcedimento: false, 
                   hasTreinamento: false 
                 });
                 setEditingItem(null);
                 setIsDrawerOpen(true);
               }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
                <Plus className="w-4 h-4" />
                Registrar Risco
              </button>
            </div>
          </header>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0 mb-6">
            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Riscos Críticos</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{riscosPorFiltroGlobal.critico}</div>
                    <span className="text-[11px] text-red-400 font-medium whitespace-nowrap">Ação Imediata</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <HardHat className="w-4 h-4 text-orange-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Riscos por NR</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{riscosPorFiltroGlobal.nrsCount}</div>
                    <span className="text-[11px] text-orange-400 font-medium">Normas ativas</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Riscos por Pacote</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{activePackageNames.length}</div>
                    <span className="text-[11px] text-purple-400 font-medium uppercase tracking-tight">Pacotes instalados</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Multa Estimada Total</h3>
                </div>
                <div className="flex flex-col items-start mt-1">
                    <div className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(riscosPorFiltroGlobal.totalMulta)}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-tighter">Impacto Consolidado</span>
                </div>
            </div>

            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-[12px] font-medium text-gray-400">Riscos Reincidentes</h3>
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">{riscosPorFiltroGlobal.reincidentes}</div>
                    <span className="text-[11px] text-gray-400 font-medium">Reincidência</span>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 mt-2 shrink-0">
               <div>
                 <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                    {activeTab === 'Visão Geral' && 'Visão Geral de Riscos'}
                    {activeTab === 'Atividade' && 'Riscos por Atividade'}
                    {activeTab === 'Setor' && 'Riscos por Setor'}
                    {activeTab === 'Tipo' && 'Filtro por Tipo/Nível'}
                    {activeTab === 'Histórico' && 'Histórico de Riscos'}
                 </h2>
                 <p className="text-xs text-gray-400 mt-1">
                    {activeTab === 'Visão Geral' && "Mapeamento analítico e distribuição da criticidade de toda a operação."}
                    {activeTab === 'Atividade' && "Rastreabilidade de risco diretamente ligada às tarefas executadas em campo."}
                    {activeTab === 'Setor' && "Panorama de segurança verticalizado por departamentos e áreas físicas das unidades."}
                    {activeTab === 'Tipo' && "Classificação dos riscos por nível crítico, alto, médio e baixo."}
                    {activeTab === 'Histórico' && "Trilha de auditoria imutável de todos os riscos da plataforma."}
                 </p>
               </div>
               {(activeTab === 'Tipo' || activeTab === 'Histórico' || activeTab === 'Atividade') && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowInactivePackages(!showInactivePackages)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        showInactivePackages 
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Mostrar itens de pacotes inativos
                    </button>
                    {activeTab === 'Tipo' && (
                      <div className="flex items-center gap-2 bg-[#121826] p-1.5 rounded-lg border border-white/5">
                        <Filter className="w-4 h-4 text-gray-400 ml-2" />
                        <select 
                          value={tipoFilter} 
                          onChange={(e) => { setTipoFilter(e.target.value as any); setCurrentPage(1); }}
                          className="bg-transparent text-sm text-white focus:outline-none px-2"
                        >
                          <option value="Todos">Todos os níveis</option>
                          <option value="Crítico">Crítico</option>
                          <option value="Alto">Alto</option>
                          <option value="Médio">Médio</option>
                          <option value="Baixo">Baixo</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
               <div className="flex items-center gap-3">
                 <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors">
                   Exportar
                 </button>
               </div>
            </div>

            {/* Sub Tabs Contet Below */}
            {activeTab === 'Visão Geral' && (
              <div className="flex flex-col gap-6 shrink-0 custom-scrollbar overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0">
                  {topCards.map((card, i) => {
                    if (!card) return null;
                    return (
                      <div key={card.id} className="bg-[#0e1322] border border-white/10 p-5 lg:p-6 rounded-xl flex flex-col relative group overflow-hidden shadow-lg shadow-black/20 hover:border-white/20 transition-all">
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30`} style={{ backgroundColor: card.sparkColor }}></div>
                        <div className="flex items-start justify-between relative z-10 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${card.bg} ${card.border}`}>
                              <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <h3 className="text-[13px] font-medium text-gray-300">{card.label}</h3>
                          </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-white tracking-tight relative z-10 mb-2">
                          {card.val}
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-[12px] font-medium text-gray-400">{card.sub}</span>
                          {card.id === 'c9' && <div className="w-4 h-4 text-emerald-400 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </div>}
                        </div>
                        {card.trend && (
                          <div className="absolute bottom-4 right-4 left-4 h-12 opacity-40 pointer-events-none z-0">
                             <Sparkline data={card.trend} color={card.sparkColor || '#ffffff'} />
                          </div>
                        )}
                        {card.id === 'c11' && (
                          <div className="absolute bottom-6 left-6 right-6 h-[5px] bg-white/5 rounded-full overflow-hidden z-10">
                             <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" style={{ width: card.val }}></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Distribuição por nível</h3>
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
                      <div className="w-[180px] h-[180px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieDataNivel}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieDataNivel.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555'} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-sans mt-1">
                          <span className="text-3xl font-bold text-white leading-none">{abertosCountStats}</span>
                          <span className="text-[12px] text-gray-400 font-medium mt-1">Total abertos</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 font-sans">
                        {pieDataNivel.length > 0 ? pieDataNivel.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] opacity-90" style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555' }}></div>
                            <span className="text-[13px] text-gray-300 w-16">{entry.name}</span>
                            <span className="text-[13px] font-bold text-white">{entry.value} <span className="font-normal text-gray-500">({Math.round((entry.value/abertosCountStats)*100)}%)</span></span>
                          </div>
                        )) : (
                          <div className="text-xs text-gray-500">Sem dados suficientes</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Riscos por setor</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barDataMultaSetor} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Bar dataKey="value" fill="#7c3aed" radius={[2, 2, 0, 0]} barSize={32}>
                            {barDataMultaSetor.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#colorBarChart)`} />
                            ))}
                          </Bar>
                          <defs>
                            <linearGradient id="colorBarChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#6d28d9" stopOpacity={1}/>
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Multa estimada por NR</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={nrBarData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={55} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Bar dataKey="Total" fill="#eab308" radius={[0, 2, 2, 0]} barSize={16}>
                              {nrBarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#ca8a04'} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 mt-2">
                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Riscos por NR</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nrRiscosData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Bar dataKey="Total" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={24} />
                          <Bar dataKey="Críticos" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Riscos por Origem</h3>
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 min-h-[220px]">
                      <div className="w-[180px] h-[180px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieDataOrigem} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                              {pieDataOrigem.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-3 font-sans">
                        {pieDataOrigem.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full opacity-90" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5] }}></div>
                            <span className="text-[13px] text-gray-300 w-16 truncate">{entry.name}</span>
                            <span className="text-[13px] font-bold text-white">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-white mb-6 font-sans">Chance Média de Incidente por NR (%)</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={avgChanceData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Line type="monotone" dataKey="Chance" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 mt-2 pb-12">
                   <div className="bg-[#0e1322] border border-purple-500/20 rounded-xl p-6 flex flex-col shadow-[0_0_30px_rgba(124,58,237,0.03)] font-sans relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                      <div className="flex items-center gap-2 mb-6 relative z-10">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h3 className="text-[15px] font-medium text-white">Insights operacionais</h3>
                      </div>
                      <div className="flex-1 space-y-5 relative z-10">
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                              <ShieldAlert className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-gray-200">{criticosCount} riscos críticos em aberto exigem ação imediata.</p>
                               <p className="text-[12px] text-gray-500 mt-1">Impacto potencial alto em SST e conformidade.</p>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
                              <TrendingUp className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-gray-200">{nrBarData[0]?.name || 'NR'} concentra {Math.round(((nrBarData[0]?.Total || 0) / (totalMultaAberto||1)) * 100) || 0}% da multa.</p>
                               <p className="text-[12px] text-gray-500 mt-1">Priorize adequações e controles para evitar infrações pesadas.</p>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[#1a1c23] border border-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-gray-200">{listRiscos[0]?.titulo || 'Sem riscos'} lidera as chances de incidente.</p>
                               <p className="text-[12px] text-gray-500 mt-1">Reforce treinamentos e inspeções nas áreas operacionais.</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col font-sans">
                      <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-[15px] font-medium text-white">Top riscos críticos</h3>
                      </div>
                      <div className="flex-1 space-y-3">
                         {listRiscos.map((r, i) => (
                            <div key={r.id || i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors" onClick={(e) => {
                                e.stopPropagation(); 
                                setEditingItem(r); 
                                setIsDrawerOpen(true);
                            }}>
                               <div className="w-6 h-6 rounded bg-red-500/10 text-[12px] font-bold text-red-400 flex items-center justify-center shrink-0">
                                  {i+1}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[13px] font-medium text-gray-200 truncate group-hover:text-white transition-colors">{r.titulo || r.atividade}</h4>
                               </div>
                               <div className="text-[12px] text-gray-400 truncate text-right">
                                  {r.setor}
                               </div>
                            </div>
                         ))}
                         {listRiscos.length === 0 && (
                            <div className="text-sm text-gray-500 italic mt-4 text-center">Nenhum risco crítico encontrado.</div>
                         )}
                      </div>
                   </div>

                   <div className="bg-[#0e1322] border border-white/10 rounded-xl p-6 flex flex-col font-sans">
                      <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-[15px] font-medium text-white">Top 5 riscos por chance (%)</h3>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2 space-y-5">
                         {renderTopRisksChance.map((r, i) => (
                            <div key={i} className="cursor-pointer group" onClick={() => { setActiveTab('Visão Geral'); setIsDrawerActionOpen(false); setSelectedSectorItem(null); setTimeout(() => setSelectedAction(null), 300); }}>
                               <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-[13px] font-medium text-gray-300 truncate pr-4 group-hover:text-white transition-colors">{r.name}</h4>
                                  <span className="text-[13px] font-bold text-gray-200">{r.chance}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-[#1a1c23] rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(r.chance, 100)}%` }}></div>
                               </div>
                            </div>
                         ))}
                         {renderTopRisksChance.length === 0 && (
                            <div className="text-sm text-gray-500 italic mt-4 text-center">Sem dados suficientes.</div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'Setor' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 pb-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl shadow-lg relative overflow-hidden group">
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                           <Users className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-gray-400 mb-1">Setores monitorados</h3>
                        <p className="text-3xl font-bold text-white tracking-tight mb-2">{totalSetoresAtivos}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-500">100% dos setores ativos</span>
                        </div>
                        <div className="mt-3 text-xs font-medium text-gray-500 flex items-center gap-1.5 pt-3 border-t border-white/5">
                           <span className="w-1.5 h-0.5 bg-gray-500 rounded"></span> Sem variação
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl shadow-lg relative overflow-hidden group">
                     {maxCritSector && <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>}
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-red-400 mb-1">Setor mais crítico</h3>
                        <p className="text-2xl font-bold text-white tracking-tight leading-snug mb-2 truncate">{maxCritSector?.setor || 'N/A'}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400">{maxCritSector?.crits || 0} riscos críticos</span>
                        </div>
                        <button onClick={() => {}} className="mt-3 text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 pt-3 border-t border-white/5 w-full text-left">
                           Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl shadow-lg relative overflow-hidden group">
                     {maxConcSector && <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>}
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                           <PieChartIcon className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-orange-400 mb-1">Maior concentração de risco</h3>
                        <p className="text-2xl font-bold text-white tracking-tight leading-snug mb-2 truncate">{maxConcSector?.setor || 'N/A'}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400">{totalRiscosSetores > 0 ? Math.round((maxConcSector?.count || 0) / totalRiscosSetores * 100) : 0}% do total de riscos</span>
                        </div>
                        <button onClick={() => {}} className="mt-3 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 pt-3 border-t border-white/5 w-full text-left">
                           Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl shadow-lg relative overflow-hidden group">
                     <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                           <DollarSign className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-emerald-400 mb-1">Exposição financeira por setor</h3>
                        <p className="text-2xl font-bold text-white font-mono tracking-tight mb-2">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMultaSetores)}
                        </p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400">Estimativa total de multas</span>
                        </div>
                        <div className="mt-3 text-xs font-medium text-emerald-400 flex items-center gap-1pt-3 pt-3 border-t border-white/5">
                           <ArrowDownRight className="w-3 h-3" /> -8,4% <span className="text-gray-500 font-normal">vs mês anterior</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {sectorGroups.slice(0, 6).map((group) => {
                     const pct = totalRiscosSetores > 0 ? Math.round((group.count / totalRiscosSetores) * 100) : 0;
                     const sectorLevel = group.crits > 0 ? 'Crítico' : group.altos > 0 ? 'Alto' : group.medios > 0 ? 'Médio' : 'Baixo';
                     const colorClass = sectorLevel === 'Crítico' ? 'text-red-500 border-red-500' : sectorLevel === 'Alto' ? 'text-orange-500 border-orange-500' : sectorLevel === 'Médio' ? 'text-yellow-500 border-yellow-500' : 'text-emerald-500 border-emerald-500';
                     const bgCircle = sectorLevel === 'Crítico' ? 'text-red-500' : sectorLevel === 'Alto' ? 'text-orange-500' : sectorLevel === 'Médio' ? 'text-yellow-500' : 'text-emerald-500';
                     
                     const isSelected = selectedSectorItem?.setor === group.setor;

                     return (
                       <div key={group.setor} 
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedSectorItem(null);
                                } else {
                                    setSelectedSectorItem(group);
                                }
                            }}
                            className={`bg-[#121826] border rounded-xl p-4 flex flex-col items-start cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden
                            ${isSelected ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50' : 'border-white/5'}`}>
                          
                          <div className="flex w-full items-center gap-3 mb-3">
                             <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                   <path className="text-gray-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                   <path className={bgCircle} strokeDasharray={`${pct}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="absolute text-[10px] text-gray-400 flex items-center justify-center">
                                   {getActivityIcon(group.setor)}
                                </div>
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold text-white truncate w-full">{group.setor}</h4>
                                <div className={`text-lg font-bold leading-none ${bgCircle}`}>{pct}%</div>
                             </div>
                          </div>
                          
                          <div className="mt-auto">
                             <span className={`text-[10px] font-medium block truncate ${bgCircle}`}>Nível de risco: {sectorLevel}</span>
                             <span className="text-[11px] text-gray-400">{group.count} riscos</span>
                          </div>
                       </div>
                     )
                  })}
                </div>

                <div className="bg-[#121826] border border-white/5 rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[#0b0f19] border-b border-white/5">
                          <tr>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Setor</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Total de Riscos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-red-500/80 uppercase tracking-wider text-center">Críticos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-orange-500/80 uppercase tracking-wider text-center">Altos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-yellow-500/80 uppercase tracking-wider text-center">Médios</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider text-center">Baixos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Multa Estimada</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Chance Média de Incidente</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Último Registro</th>
                             <th className="px-5 py-4 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {sectorGroups.map((group, idx) => {
                             const isSelected = selectedSectorItem?.setor === group.setor;
                             const avgChance = group.count > 0 ? Math.round(group.chanceSum / group.count) : 0;
                             const chanceLabel = avgChance >= 60 ? 'Alta' : avgChance >= 35 ? 'Média' : 'Baixa';
                             const chanceColor = avgChance >= 60 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : avgChance >= 35 ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';

                             return (
                               <tr key={idx} 
                                   className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} 
                                   onClick={() => {
                                       if (isSelected) {
                                           setSelectedSectorItem(null);
                                       } else {
                                           setSelectedSectorItem(group);
                                       }
                                   }}>
                                 <td className="px-5 py-4 align-middle">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${isSelected ? 'text-purple-400' : 'text-purple-500/50'}`}>
                                          {getActivityIcon(group.setor)}
                                       </div>
                                       <span className="text-[13px] font-bold text-gray-200 truncate pr-4">{group.setor}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-gray-300">{group.count}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-red-500 font-bold">{group.crits}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-orange-500 font-bold">{group.altos}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-yellow-500 font-bold">{group.medios}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-emerald-500 font-bold">{group.baixos}</td>
                                 <td className="px-5 py-4 align-middle text-right text-[13px] font-mono text-gray-300 whitespace-nowrap">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(group.multaTotal)}
                                 </td>
                                 <td className="px-5 py-4 align-middle text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <span className="text-[13px] text-gray-400 w-8 text-right font-mono">{avgChance}%</span>
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chanceColor}`}>{chanceLabel}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right font-mono text-[12px] text-gray-400 whitespace-nowrap">
                                    {group.lastRecord.toLocaleString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right">
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                 </td>
                               </tr>
                             )
                           })}
                        </tbody>
                     </table>
                     <div className="p-4 border-t border-white/5 text-[11px] text-gray-500">
                        Exibindo 1 a {sectorGroups.length} de {sectorGroups.length} setores
                     </div>
                   </div>
                </div>
              </div>
            )}



            {activeTab === 'Tipo' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Settings2 className="w-6 h-6 text-purple-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-purple-400 mb-0.5">Tipos monitorados</h3>
                        <p className="text-2xl font-bold text-white mb-0.5">{Object.keys(countByType).length}</p>
                        <p className="text-[11px] text-gray-500">Cobrem 100% dos riscos ativos</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <PieChartIcon className="w-6 h-6 text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-blue-400 mb-0.5">Tipo mais recorrente</h3>
                        <p className="text-lg font-bold text-white mb-0.5 leading-tight truncate">{topType}</p>
                        <p className="text-[11px] text-gray-500">{Math.round(((countByType[topType] || 0) / Math.max(1, combinedData.length))*100)}% dos riscos registrados</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-4 border border-orange-500/30 rounded-xl relative overflow-hidden flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 z-10">
                        <ShieldAlert className="w-6 h-6 text-orange-400" />
                     </div>
                     <div className="z-10 relative">
                        <h3 className="text-xs font-bold text-orange-400 mb-0.5">Maior criticidade</h3>
                        <p className="text-lg font-bold text-white mb-0.5 leading-tight">Crítico</p>
                        <p className="text-[11px] text-gray-400">{combinedData.filter((c: any) => c.nivel === 'Crítico').length} tipos classificados como críticos</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-4 border border-emerald-500/30 rounded-xl relative overflow-hidden flex items-center gap-4 bg-gradient-to-br from-emerald-500/5 to-transparent">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 z-10">
                        <DollarSign className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div className="z-10 relative">
                        <h3 className="text-xs font-bold text-emerald-400 mb-0.5">Risco financeiro por tipo</h3>
                        <p className="text-lg font-bold text-white mb-0.5 leading-tight">{formatCurrency(totalMultaAberto)}</p>
                        <p className="text-[11px] text-gray-400">Exposição total estimada</p>
                     </div>
                  </div>
                </div>

                <div className="bg-[#121826] border border-white/5 rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[#0b0f19]">
                          <tr>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Tipo de Risco</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Nível</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Setor Princip.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Atividade Princip.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Origem</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Chance Inc.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-right">Multa Estimada</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {currentItems.map((item) => {
                               const isSelected = selectedAction?.id === item.id;
                               return (
                               <tr key={item.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => {
                                   if (isSelected && isDrawerActionOpen) {
                                       setIsDrawerActionOpen(false);
                                       setTimeout(() => setSelectedAction(null), 300);
                                   } else {
                                       setSelectedAction(item);
                                       setIsDrawerActionOpen(true);
                                   }
                               }}>
                                 <td className="px-5 py-4 align-middle">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${isSelected ? 'text-purple-400' : 'text-purple-500/50'}`}>
                                         {getRiskTypeIcon(item.tipoDeRisco || 'Outro')}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-gray-200">{item.tipoDeRisco}</span>
                                        {item.pacote && item.pacote !== 'Base SST' && !activePackageNames.includes(item.pacote) && (
                                          <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
                                            <Package className="w-2.5 h-2.5" />
                                            {item.pacote} (Inativo)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${getNivelColor(item.nivel)}`}>{item.nivel}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-gray-300">{item.setor}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-gray-300">{item.atividade}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-gray-400">{getRiskOrigem(item.tipoDeRisco || '')}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <div className="flex items-center gap-1.5">
                                       <span className={`text-[13px] font-bold ${((item.chanceIncidente || 0) >= 60) ? 'text-red-500' : ((item.chanceIncidente || 0) >= 35) ? 'text-orange-500' : 'text-emerald-500'}`}>
                                          {((item.chanceIncidente || 0) >= 60) ? 'Alta' : ((item.chanceIncidente || 0) >= 35) ? 'Média' : 'Baixa'}
                                       </span>
                                       <span className={`text-xs ${((item.chanceIncidente || 0) >= 60) ? 'text-red-500' : ((item.chanceIncidente || 0) >= 35) ? 'text-orange-500' : 'text-emerald-500'}`}>{item.chanceIncidente || 0}%</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right text-[13px] font-mono text-gray-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.multaEstimada || 0)}</td>
                                 <td className="px-5 py-4 align-middle text-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 ${item.status === 'Monitorado' ? 'text-emerald-400' : item.status === 'Crítico' ? 'text-red-400' : 'text-gray-400'}`}>
                                       {item.status === 'Monitorado' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5"></span>}
                                       {item.status}
                                    </span>
                                 </td>
                               </tr>
                           )})}
                        </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'Histórico' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="bg-[#121826] border border-blue-500/20 rounded-xl p-4 flex items-center gap-4 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                     <Info className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">Este histórico é imutável e somente leitura.</p>
                    <p className="text-[13px] text-gray-400">Os registros não podem ser editados ou excluídos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-purple-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-purple-400 mb-0.5">Registros históricos</h3>
                        <p className="text-2xl font-bold text-white mb-0.5">{riskHistoryList.length}</p>
                        <p className="text-[11px] text-gray-500">Total de registros</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-blue-400 mb-0.5">Origem automática</h3>
                        <p className="text-2xl font-bold text-white mb-0.5">{riskHistoryList.filter(item => item.isAutomatic).length}</p>
                        <p className="text-[11px] text-gray-500">{Math.round((riskHistoryList.filter(item => item.isAutomatic).length / Math.max(1, riskHistoryList.length)) * 100)}% do total</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-emerald-400 mb-0.5">Origem manual</h3>
                        <p className="text-2xl font-bold text-white mb-0.5">{riskHistoryList.filter(item => !item.isAutomatic).length}</p>
                        <p className="text-[11px] text-gray-500">{Math.round((riskHistoryList.filter(item => !item.isAutomatic).length / Math.max(1, riskHistoryList.length)) * 100)}% do total</p>
                     </div>
                  </div>
                  <div className="bg-[#121826] p-5 border border-white/5 rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-6 h-6 text-orange-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-orange-400 mb-0.5">Última atualização</h3>
                        <p className="text-lg font-bold text-white mb-0.5">{riskHistoryList[0] ? new Date(riskHistoryList[0].updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                        <p className="text-[11px] text-gray-500">{riskHistoryList[0] ? new Date(riskHistoryList[0].updatedAt).toLocaleDateString('pt-BR') : '--/--/----'}</p>
                     </div>
                  </div>
                </div>

                <div className="bg-[#121826] border border-white/5 rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#0b0f19]">
                        <tr>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">ID</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Título do risco</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Origem</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Setor</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Atividade</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">NR</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Data e hora v</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center">Status atual</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#121826]">
                        {combinedData.map((item) => {
                          const isSelected = selectedAction?.id === item.id;
                          const historyItem = riskHistoryById[item.id];
                          const isAuto = historyItem ? historyItem.isAutomatic : (item.origem || '').toLowerCase().includes('auto') || (item.origem || '').toLowerCase().includes('inspe');
                          return (
                          <tr key={item.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => {
                             if (isSelected && isDrawerActionOpen) {
                                setIsDrawerActionOpen(false);
                                setTimeout(() => setSelectedAction(null), 300);
                             } else {
                                setSelectedAction(item);
                                setIsDrawerActionOpen(true);
                             }
                          }}>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-gray-300">{item.id}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-200">{item.tipoDeRisco || item.atividade}</span>
                                {item.pacote && item.pacote !== 'Base SST' && !activePackageNames.includes(item.pacote) && (
                                  <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
                                    <Package className="w-2.5 h-2.5" />
                                    {item.pacote} (Inativo)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold bg-[#0b0f19] ${isAuto ? 'text-blue-400 border-blue-500/20' : 'text-emerald-400 border-emerald-500/20'}`}>
                                 {isAuto ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                 {isAuto ? 'Automática' : 'Manual'}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-gray-300">{item.setor}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-gray-300">{item.atividade}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-purple-400">{Array.isArray(item.nr) ? item.nr[0] : item.nr}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-gray-300">{historyItem?.updatedAt ? new Date(historyItem.updatedAt).toLocaleString('pt-BR') : '--'}</span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 ${item.status === 'Monitorado' ? 'text-emerald-400' : item.status === 'Crítico' || item.status === 'Aberto' ? 'text-red-400' : 'text-blue-400'}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Monitorado' ? 'bg-emerald-500' : item.status === 'Crítico' || item.status === 'Aberto' ? 'bg-red-500' : 'bg-blue-500'} mb-0.5`}></span>
                                 {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                               <button className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                                  <Eye className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Atividade' && (
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121826] p-4 border border-purple-500/30 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Activity className="w-16 h-16" />
                  </div>
                  <h3 className="text-[12px] text-purple-400 mb-1 z-10 relative">Atividades monitoradas</h3>
                  <p className="text-3xl font-bold text-white mb-2 z-10 relative">{totalAtividades}</p>
                  <p className="text-xs text-gray-500 z-10 relative">+3 desde a semana passada</p>
                </div>
                <div className="bg-[#121826] p-4 border border-red-500/30 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <ShieldAlert className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-[12px] text-red-400 mb-1 z-10 relative">Atividades com risco crítico</h3>
                  <p className="text-3xl font-bold text-white mb-2 z-10 relative">{atividadesCriticas}</p>
                  <p className="text-xs text-gray-500 z-10 relative">{getPercentage(atividadesCriticas, totalAtividades)}% do total</p>
                </div>
                <div className="bg-[#121826] p-4 border border-orange-500/30 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <TrendingUp className="w-16 h-16 text-orange-500" />
                  </div>
                  <h3 className="text-[12px] text-orange-400 mb-1 z-10 relative">Maior atividade de risco</h3>
                  <p className="text-2xl font-bold text-white mb-2 z-10 relative truncate">{maiorAtividade}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-red-500/20 bg-red-500/10 text-red-400 z-10 relative">Crítico</span>
                </div>
                <div className="bg-[#121826] p-4 border border-yellow-500/30 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <BadgeInfo className="w-16 h-16 text-yellow-500" />
                  </div>
                  <h3 className="text-[12px] text-yellow-400 mb-1 z-10 relative">Multa estimada por atividade</h3>
                  <p className="text-2xl font-bold text-white mb-2 z-10 relative">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMultaAbertoActivity)}</p>
                  <p className="text-xs text-gray-500 z-10 relative">Total potencial</p>
                </div>
              </div>

              <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left">
                    <thead className="bg-[#0b0f19] border-b border-white/5">
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Atividade</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Setor Vinculado</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Riscos e Perigos</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Exigência EPI/EPC</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Chance de Incidente</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Multa Estimada</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedActivities.length === 0 ? (
                         <tr>
                           <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                              Nenhuma atividade encontrada neste filtro.
                           </td>
                         </tr>
                      ) : sortedActivities.map((item, idx) => {
                         const isSelected = selectedAction?.atividade === item.atividade;
                         const avgChance = item.count > 0 ? Math.round(item.chanceSum / item.count) : 0;
                         const chanceLabel = avgChance >= 60 ? 'Alta' : avgChance >= 35 ? 'Média' : 'Baixa';
                         const chanceColor = avgChance >= 60 ? 'text-red-500' : avgChance >= 35 ? 'text-yellow-500' : 'text-emerald-500';

                         return (
                          <tr key={idx} className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => { 
                             if (isSelected && isDrawerActionOpen) {
                                 setIsDrawerActionOpen(false);
                                 setTimeout(() => setSelectedAction(null), 300);
                             } else {
                                 // Let's create a combined simulated risk instance to feed the right drawer
                                 setSelectedAction({
                                     id: `simulated-${idx}`,
                                     atividade: item.atividade,
                                     setor: item.setores.join(', ') || 'N/A',
                                     nr: Array.from(new Set(item.nrs)).join(', ') || 'NR-Geral',
                                     nivel: item.maxNivelName,
                                     status: 'Aberto',
                                     responsavel: 'João Silva', // Mock as per screenshot
                                     episAusentes: item.episAusentes,
                                     episTotal: item.episTotal,
                                     riscosNomes: item.riscosNames,
                                     chanceSum: item.chanceSum,
                                     count: item.count,
                                     maxNivelName: item.maxNivelName,
                                     acaoRecomendada: `Implementar linha de vida e treinamento de reciclagem.`,
                                     problemaPrincipal: `Alta chance de incidente em ${item.atividade}`,
                                     multaTotal: item.multaTotal
                                 } as any);
                                 setIsDrawerActionOpen(true);
                             }
                          }}>
                            <td className="px-5 py-4 align-middle min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${isSelected ? 'text-purple-400' : 'text-purple-500/50'}`}>
                                   {getActivityIcon(item.atividade)}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                   <div className="flex flex-col">
                                     <span className="text-[13px] font-bold text-gray-200">{item.atividade}</span>
                                     {(item as any).pacotes?.map((p: string) => {
                                       if (p !== 'Base SST' && !activePackageNames.includes(p)) {
                                         return (
                                           <span key={p} className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
                                             <Package className="w-2.5 h-2.5" />
                                             {p} (Inativo)
                                           </span>
                                         );
                                       }
                                       return null;
                                     })}
                                   </div>
                                   <span className="text-[11px] text-gray-500">{Array.from(new Set(item.nrs))[0] || item.nrString}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <span className="text-[13px] text-gray-400">{item.setores[0] || 'Vários'}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-[13px] text-gray-200 truncate max-w-[180px]">{item.riscosNames[0] || 'Nenhum Risco'}</span>
                                 <span className="text-[11px] text-gray-500">{item.count} risco{item.count !== 1 ? 's' : ''} associado{item.count !== 1 ? 's' : ''}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-1">
                                 {item.episAusentes > 0 ? (
                                    <>
                                      <span className="text-[13px] text-gray-200 truncate max-w-[150px]">Cinto paraquedista...</span>
                                      <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded w-max">{item.episAusentes} de {item.episTotal} ausentes</span>
                                    </>
                                 ) : (
                                    <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded w-max font-medium">Sem equipamento</span>
                                 )}
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-0.5">
                                  <span className={`text-[13px] font-bold ${chanceColor}`}>{chanceLabel}</span>
                                  {avgChance > 0 && <span className="text-[11px] text-gray-500">{avgChance}%</span>}
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                               <span className="text-[13px] text-gray-300 font-mono">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.multaTotal)}
                               </span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                               <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border tracking-wider bg-opacity-10 
                                  ${item.maxNivelName === 'Crítico' ? 'text-red-400 border-red-500/20 bg-red-400' : 
                                    item.maxNivelName === 'Alto' ? 'text-orange-400 border-orange-500/20 bg-orange-400' : 
                                    item.maxNivelName === 'Médio' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                                    'text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                                 {item.maxNivelName}
                               </span>
                            </td>
                          </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 bg-[#0b0f19]">
                   <span>Mostrando 1 a {sortedActivities.length} de {sortedActivities.length} atividades</span>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                         <button className="px-2 py-1 rounded hover:text-white transition-colors disabled:opacity-50" disabled><ChevronRight className="w-4 h-4 rotate-180" /></button>
                         <button className="px-2.5 py-1 rounded text-sm bg-purple-600/20 text-purple-400 border border-purple-500/30">1</button>
                         <button className="px-2 py-1 rounded hover:text-white transition-colors disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                         <select className="bg-[#121826] border border-white/10 rounded px-2 py-1 text-gray-400 focus:outline-none">
                            <option>10 por página</option>
                         </select>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* DRAWER DETALHES DE AÇÃO CRÍTICA */}
      <AnimatePresence>
        {isDrawerActionOpen && selectedAction && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsDrawerActionOpen(false)}
            />
           <motion.div 
           initial={{ opacity: 0, x: '100%' }} 
           animate={{ opacity: 1, x: 0 }} 
           exit={{ opacity: 0, x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-y-0 right-0 w-full sm:w-[400px] h-full bg-[#121826] border-l border-white/10 shadow-3xl z-50 flex flex-col overflow-hidden"
         >
           <div className="h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start border-b border-white/5">
                <h3 className="text-sm font-bold text-white leading-snug">
                   {activeTab === 'Tipo' ? 'Detalhes do risco' : 'Detalhes da atividade'}
                </h3>
                <button onClick={() => setIsDrawerActionOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               {activeTab === 'Histórico' ? (
                 <>
                   <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
                     <span className="text-sm font-bold text-purple-400">{selectedAction.id}</span>
                     <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border bg-opacity-10 
                          ${selectedAction.status === 'Crítico' || selectedAction.status === 'Pendente' ? 'text-red-400 border-red-500/20 bg-red-400' : 
                            selectedAction.status === 'Em análise' ? 'text-blue-400 border-blue-500/20 bg-blue-400' :
                            selectedAction.status === 'Concluído' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-400' : 
                            'text-yellow-400 border-yellow-500/20 bg-yellow-400'}`}>
                       {selectedAction.status}
                     </span>
                   </div>

                   <div className="flex items-start gap-4 mb-8">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-[#121826] text-blue-400">
                       <ShieldAlert className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col gap-1">
                       <h2 className="text-lg font-bold text-white leading-none">{selectedAction.tipoDeRisco || selectedAction.atividade}</h2>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 font-medium">{Array.isArray(selectedAction.nr) ? selectedAction.nr.join(', ') : selectedAction.nr}</span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="text-xs text-gray-400">{selectedAction.setor}</span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="text-xs text-gray-400">{selectedAction.atividade}</span>
                       </div>
                     </div>
                   </div>

                   {/* RASTREABILIDADE TOTAL - LINHAGEM DO RISCO */}
                   <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                     <h3 className="text-sm font-bold text-blue-400 mb-6 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" /> Rastreabilidade (Linhagem do Risco)
                     </h3>

                     <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-6">
                        {/* Passo 1: Inspeção/Origem */}
                        <div className="relative">
                           <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-emerald-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           </div>
                           <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Origem da Identificação</p>
                           <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                              {(selectedAction.origem || '').toLowerCase().includes('inspe') ? (
                                 <>
                                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-[13px] mb-1">
                                       <ShieldCheck className="w-4 h-4" /> Inspeção de Segurança
                                    </div>
                                    <p className="text-[13px] text-gray-200">
                                       <span className="text-gray-400">Inspeção:</span> {selectedAction.inspection_name || 'Auditoria Interna'}
                                    </p>
                                    <p className="text-[13px] text-gray-200">
                                       <span className="text-gray-400">Checklist/Item:</span> {selectedAction.atividade || 'Checklist de rotina'}
                                    </p>
                                    {(selectedAction as any).perguntaOrigem && (
                                       <div className="mt-2 text-[12px] bg-black/20 p-2 rounded">
                                          <p className="text-gray-400 italic">&quot;{((selectedAction as any).perguntaOrigem)}&quot;</p>
                                          <p className="text-red-400 font-medium mt-1">Resposta Inconforme: {(selectedAction as any).respostaOrigem || 'Não'}</p>
                                       </div>
                                    )}
                                 </>
                              ) : (
                                 <>
                                    <div className="flex items-center gap-2 text-blue-400 font-medium text-[13px] mb-1">
                                       <Bot className="w-4 h-4" /> Motor de Riscos (Sistema)
                                    </div>
                                    <p className="text-[13px] text-gray-400">Gerado automaticamente via parâmetros da organização e histórico.</p>
                                 </>
                              )}
                           </div>
                        </div>

                        {/* Passo 2: Fundamentação Legal */}
                        <div className="relative">
                           <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-purple-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                           </div>
                           <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Fundamentação Normativa</p>
                           <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-purple-400 font-medium text-[13px] mb-1">
                                 <FileText className="w-4 h-4" /> {selectedAction.nr || selectedAction.nrRelacionada || 'Norma não especificada'}
                              </div>
                              <p className="text-[13px] text-gray-200">
                                 <span className="text-gray-400">Regra associada:</span> {selectedAction.regraTitulo || selectedAction.titulo || 'Regra não declarada'}
                              </p>
                              {(selectedAction.multaEstimada || selectedAction.chanceIncidente) ? (
                                <div className="mt-2 flex gap-4 text-[12px]">
                                   {selectedAction.multaEstimada && <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">Multa potencial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(selectedAction.multaEstimada)}</span>}
                                   {selectedAction.chanceIncidente && <span className="text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">Modulador (Incidente): {selectedAction.chanceIncidente}%</span>}
                                </div>
                              ) : null}
                           </div>
                        </div>

                        {/* Passo 3: Pessoas/Dano Potencial */}
                        <div className="relative">
                           <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-orange-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                           </div>
                           <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Impacto Humano</p>
                           <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 text-orange-400 font-medium text-[13px] mb-1">
                                       <Users className="w-4 h-4" /> {selectedAction.trabalhadoresExpostos || 0} Trabalhadores Expostos
                                    </div>
                                    <p className="text-[13px] text-gray-200">
                                       <span className="text-gray-400">Perfil:</span> {selectedAction.perfilExposto || 'Não informado'}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[11px] text-gray-500 mb-1">Dano Potencial Evitado</p>
                                    <p className="text-[12px] font-bold text-red-400 max-w-[150px]">{selectedAction.impactoHumano || 'Dano físico'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Passo 4: Próximo passo -> Ação (Se existir) */}
                        <div className="relative">
                           <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#121826] border-2 border-gray-600 flex items-center justify-center">
                              <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                           </div>
                           <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Resolução (Ação/Mitigação)</p>
                           <div className="bg-white/5 border border-white/5 border-dashed rounded-lg p-3 flex justify-between items-center">
                              <div className="text-[13px]">
                                 <p className="text-gray-300 font-medium mb-0.5">Execução & Validação</p>
                                 <p className="text-gray-500 text-[12px]">Quem resolve: {selectedAction.executorCorrecao || 'Não definido'}</p>
                                 <p className="text-gray-500 text-[12px]">Quem assina: {selectedAction.validadorCorrecao || 'SST'}</p>
                              </div>
                              <button onClick={() => window.location.href='/operacao/acoes'} className="text-[12px] bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded border border-white/10 transition-colors">
                                 Ver Ações
                              </button>
                           </div>
                        </div>

                     </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                     <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Informações de auditoria
                     </h3>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-gray-500 shrink-0">Criado em</span>
                        <span className="text-[13px] text-gray-200 text-right">{selectedRiskAudit?.createdAt ? new Date(selectedRiskAudit.createdAt).toLocaleString('pt-BR') : '--'}</span>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-gray-500 shrink-0">Origem</span>
                        <div className="flex items-center gap-2 text-[13px] text-blue-400">
                           {(selectedAction.origem || '').toLowerCase().includes('inspe') ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                           {selectedAction.origem || 'Automática'} 
                            <span className="text-gray-500 text-xs">({(selectedAction.origem || '').toLowerCase().includes('inspe') ? 'Inspeção de campo' : ((selectedAction.origem || '').toLowerCase().includes('auto') ? 'Motor de Riscos' : 'Inserção Manual')})</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-gray-500 shrink-0">Última atualização</span>
                        <span className="text-[13px] text-gray-200 text-right">{selectedRiskAudit?.updatedAt ? new Date(selectedRiskAudit.updatedAt).toLocaleString('pt-BR') : '--'}</span>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-gray-500 shrink-0">Atualizado por</span>
                        <div className="flex items-center gap-2 text-[13px] text-blue-400">
                           <Settings2 className="w-3.5 h-3.5" />
                           {selectedRiskAudit?.updatedBy || 'Sistema'}
                        </div>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-gray-500 shrink-0">Versão do registro</span>
                        <span className="text-[13px] text-gray-200 text-right font-mono">{selectedRiskAudit?.version || '1'}</span>
                     </div>
                     <div className="flex justify-between items-center gap-6">
                        <span className="text-[13px] text-gray-500 shrink-0">Hash do registro</span>
                        <div className="flex items-center gap-2 group cursor-pointer">
                           <span className="text-[12px] font-mono text-gray-400 group-hover:text-gray-300">{selectedRiskAudit?.hash ? `${selectedRiskAudit.hash.slice(0, 12)}...` : '---'}</span>
                           <File className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-400" />
                        </div>
                     </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10 bg-[#121826] text-purple-400">
                         {activeTab === 'Tipo' ? getRiskTypeIcon(selectedAction.tipoDeRisco || '') : getActivityIcon(selectedAction.atividade)}
                       </div>
                       <div className="flex flex-col gap-1">
                         <h2 className="text-lg font-bold text-white leading-none">{selectedAction.atividade || selectedAction.tipoDeRisco}</h2>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{Array.isArray(selectedAction.nr) ? selectedAction.nr.join(', ') : selectedAction.nr}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="text-xs text-gray-400">{selectedAction.setor}</span>
                         </div>
                       </div>
                     </div>
                     <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-opacity-10 
                          ${selectedAction.nivel === 'Crítico' ? 'text-red-400 border-red-500/20 bg-red-400' : 
                            selectedAction.nivel === 'Alto' ? 'text-orange-400 border-orange-500/20 bg-orange-400' : 
                            selectedAction.nivel === 'Médio' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                            'text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                       {selectedAction.nivel}
                     </span>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-gray-200 mb-2">Resumo</h4>
                      <p className="text-[13px] text-gray-400 leading-relaxed">
                         Atividade com alto potencial de incidentes em {selectedAction.setor?.toLowerCase()} relacionados aos riscos: {(selectedAction as any).riscosNomes?.join(', ') || selectedAction.tipoDeRisco || 'N/A'}. Requer acompanhamento de fatores agravantes para manter compliance. 
                      </p>
                   </div>

                   {/* PESSOA NO CENTRO */}
                   <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                         <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Trabalhadores Expostos</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] text-gray-500 mb-0.5">Perfil Expôsto</p>
                          <p className="text-[13px] font-medium text-gray-200">{selectedAction.perfilExposto || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 mb-0.5">Qtd. Pessoas</p>
                          <p className="text-[13px] font-medium text-gray-200">{selectedAction.trabalhadoresExpostos || 0} expostos</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[11px] text-gray-500 mb-0.5">Impacto Humano Estimado</p>
                          <p className="text-[13px] font-medium text-red-400">{selectedAction.impactoHumano || 'Dano à integridade física'}</p>
                        </div>
                      </div>

                      <div className="h-px bg-white/5 w-full my-1"></div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[11px] text-gray-500 mb-0.5">Executor da Correção</p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                  {selectedAction.executorCorrecao?.charAt(0) || 'E'}
                               </div>
                               <span className="text-[13px] text-gray-300 truncate">{selectedAction.executorCorrecao || 'A definir'}</span>
                            </div>
                         </div>
                         <div>
                            <p className="text-[11px] text-gray-500 mb-0.5">Validador (Responsável)</p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="w-5 h-5 rounded-full bg-[#121826] border border-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                  {selectedAction.validadorCorrecao?.charAt(0) || 'V'}
                               </div>
                               <span className="text-[13px] text-gray-300 truncate">{selectedAction.validadorCorrecao || 'A definir'}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {(selectedAction.regraFixa !== undefined || selectedAction.nrRelacionada || selectedAction.nr) && (
                     <div className="bg-[#1e1a30]/50 p-4 rounded-xl border border-purple-500/20 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                           <FileText className="w-4 h-4 text-purple-400" />
                           <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Base Normativa Aplicada</h4>
                        </div>
                        <div className="space-y-1.5 text-[12px] text-gray-300">
                           {(selectedAction.nrRelacionada || selectedAction.nr) && <p><span className="font-bold text-gray-500">NR Relacionada:</span> {selectedAction.nrRelacionada || selectedAction.nr}</p>}
                           {selectedAction.regraTitulo && <p><span className="font-bold text-gray-500">Regra:</span> {selectedAction.regraTitulo}</p>}
                           {selectedAction.regraId && <p><span className="font-bold text-gray-500">Regra ID:</span> {selectedAction.regraId}</p>}
                           
                           {selectedAction.regraFixa === true ? (
                              <p><span className="font-bold text-gray-500">Regra Fixa:</span> Sim</p>
                           ) : selectedAction.regraFixa === false ? (
                              <p><span className="font-bold text-gray-500">Regra Fixa:</span> Não</p>
                           ) : (
                              <p><span className="font-bold text-gray-500">Regra Fixa:</span> Regra normativa não vinculada</p>
                           )}

                           {selectedAction.perguntaOrigem && <p><span className="font-bold text-gray-500">Pergunta:</span> {selectedAction.perguntaOrigem}</p>}
                           {selectedAction.respostaOrigem && <p><span className="font-bold text-gray-500">Resposta:</span> {selectedAction.respostaOrigem}</p>}
                           {(selectedAction.inspection_name || selectedAction.checklistId) && (
                              <p><span className="font-bold text-gray-500">Origem:</span> {selectedAction.inspection_id ? `Inspeção #${selectedAction.inspection_id.substring(0,6).toUpperCase()}` : 'Inspeção'} / {selectedAction.inspection_name || selectedAction.checklistId}</p>
                           )}
                        </div>
                        {selectedAction.explicacaoNormativa && (
                           <div className="mt-3 pt-3 border-t border-purple-500/20">
                              <p className="text-[12px] text-purple-200/80 leading-relaxed italic border-l-2 border-purple-500/50 pl-3">
                                 {selectedAction.explicacaoNormativa}
                              </p>
                           </div>
                        )}
                     </div>
                   )}

               <div className="grid grid-cols-2 gap-6 bg-[#0b0f19] p-4 border border-white/5 rounded-xl">
                 <div>
                    <h4 className="text-xs font-bold text-gray-200 mb-1">Chance de incidente</h4>
                    <p className={`text-base font-bold ${((selectedAction.chanceIncidente || 0) >= 60 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 60)) ? 'text-red-500' : ((selectedAction.chanceIncidente || 0) >= 35 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 35)) ? 'text-orange-500' : 'text-emerald-500'}`}>
                       {((selectedAction.chanceIncidente || 0) >= 60 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 60)) ? 'Alta' : ((selectedAction.chanceIncidente || 0) >= 35 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 35)) ? 'Média' : 'Baixa'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Estimativa: {(selectedAction as any).chanceSum > 0 ? Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) : (selectedAction.chanceIncidente || 0)}%</p>
                 </div>
                 <div className="pl-6 border-l border-white/5">
                    <h4 className="text-xs font-bold text-gray-200 mb-1">Multa estimada</h4>
                    <p className="text-base font-bold text-white font-mono">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format((selectedAction as any).multaTotal || selectedAction.multaEstimada || 0)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Potencial</p>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-[#121826] border border-white/5 rounded-xl cursor-pointer hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                     </div>
                     <div>
                        <h4 className="text-xs font-bold text-gray-200 leading-none mb-1">Checklist vinculado</h4>
                        <p className="text-[11px] text-gray-500">Checklist {(selectedAction.atividade as string).split(' ')[0]}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 w-[100px]">
                     <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/80 rounded-full" style={{width: '70%'}}></div>
                     </div>
                     <span className="text-[11px] font-mono text-gray-400">70%</span>
                  </div>
               </div>

               <div className="flex items-start justify-between p-4 bg-[#121826] border border-red-500/10 rounded-xl">
                  <div className="flex items-start gap-4">
                     <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mt-0.5 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                     </div>
                     <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-gray-200">EPI/EPC ausente</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">
                           Falta de equipamentos essenciais para atuação segura em {(selectedAction.atividade as string).toLowerCase()}.
                        </p>
                     </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                     <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20 bg-red-500/10 text-red-500 w-max mt-1 whitespace-nowrap">
                       {(selectedAction as any).episAusentes || 0} de {(selectedAction as any).episTotal || 1}
                     </span>
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-[#121826] border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                     </div>
                     <div>
                        <h4 className="text-xs font-bold text-gray-200 leading-none mb-1">Ação recomendada</h4>
                        <p className="text-[11px] text-gray-500">{(selectedAction as any).acaoRecomendada || `Revisar processos de ${(selectedAction.atividade as string).toLowerCase()}.`}</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
               </div>

               <div className="flex items-center justify-between p-4 bg-[#121826] border border-white/5 rounded-xl cursor-pointer hover:border-white/20 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-[#1e1a30] text-gray-400 flex items-center justify-center text-xs font-bold border border-white/10 uppercase shrink-0">
                        {selectedAction.responsavel ? selectedAction.responsavel.substring(0, 2) : 'JS'}
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Responsável</h4>
                        <p className="text-xs font-bold text-white">{selectedAction.responsavel || 'João Silva'}</p>
                        <p className="text-[11px] text-gray-500">Técnico de Segurança</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
               </div>
               </>
               )}

             </div>

             <div className="p-6 border-t border-white/5 bg-[#0b0f19] space-y-3">
               {activeTab !== 'Histórico' && (
                 <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors flex justify-center items-center gap-2 border border-purple-500/30">
                   Marcar como tratado <CheckCircle2 className="w-4 h-4 ml-1" />
                 </button>
               )}
               <button onClick={() => setIsDrawerActionOpen(false)} className={`w-full py-3 rounded-lg ${activeTab === 'Histórico' ? 'bg-white/5 hover:bg-white/10 text-white text-sm' : 'text-xs text-gray-400 hover:text-white'} font-bold transition-colors border border-transparent`}>
                 Fechar painel
               </button>
             </div>
           </div>
         </motion.div>
         </>
        )}
      </AnimatePresence>

      {/* DRAWER DETALHES DE SETOR */}
      <AnimatePresence>
        {selectedSectorItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSelectedSectorItem(null)}
            />
           <motion.div 
           initial={{ opacity: 0, x: '100%' }} 
           animate={{ opacity: 1, x: 0 }} 
           exit={{ opacity: 0, x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-y-0 right-0 w-full sm:w-[400px] h-full bg-[#121826] border-l border-white/10 shadow-3xl z-50 flex flex-col overflow-hidden"
         >
           <div className="h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start border-b border-white/5">
                <h3 className="text-sm font-bold text-white leading-snug">Detalhes do setor</h3>
                <button onClick={() => setSelectedSectorItem(null)} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
                 <span className="text-sm font-bold text-purple-400">SETOR-{selectedSectorItem.setor.substring(0,3).toUpperCase()}</span>
                 <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border bg-opacity-10 
                      ${selectedSectorItem.crits > 0 ? 'text-red-400 border-red-500/20 bg-red-400' : 
                        selectedSectorItem.altos > 0 ? 'text-orange-400 border-orange-500/20 bg-orange-400' : 
                        selectedSectorItem.medios > 0 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                        'text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                   {selectedSectorItem.crits > 0 ? 'Crítico' : selectedSectorItem.altos > 0 ? 'Alto' : selectedSectorItem.medios > 0 ? 'Médio' : 'Baixo'}
                 </span>
               </div>

               <div className="flex items-start gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-[#121826] text-blue-400">
                   {getActivityIcon(selectedSectorItem.setor)}
                 </div>
                 <div className="flex flex-col gap-1">
                   <h2 className="text-lg font-bold text-white leading-none">{selectedSectorItem.setor}</h2>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-medium">{selectedSectorItem.nrs[0] || 'NR-Geral'}</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                      <span className="text-xs text-gray-400">{selectedSectorItem.count} riscos mapeados</span>
                   </div>
                 </div>
               </div>

               <div>
                  <h4 className="text-xs font-bold text-gray-200 mb-2">Visão geral do setor</h4>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                     {selectedSectorItem.crits > 0 ? 'Setor com maior concentração de riscos críticos.' : 'Setor estável, focar em prevenções rotineiras.'} Processos com exposição aos riscos: {selectedSectorItem.riscosNames.slice(0, 3).join(', ')}.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-6 bg-[#0b0f19] p-4 border border-white/5 rounded-xl">
                 <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Chance Incidente</h4>
                    <p className={`text-base font-bold ${
                      (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 60 ? 'text-red-500' : 
                      (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 35 ? 'text-orange-500' : 'text-emerald-500'
                    }`}>
                       {(selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 60 ? 'Alta' : (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 35 ? 'Média' : 'Baixa'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Estimativa: {Math.round(selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count))}%</p>
                 </div>
                 <div className="pl-6 border-l border-white/5">
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Multa estimada</h4>
                    <p className="text-base font-bold text-white font-mono">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(selectedSectorItem.multaTotal)}
                    </p>
                 </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-bold text-white mb-2">Riscos mais recorrentes</h4>
                  <ul className="space-y-2">
                     {selectedSectorItem.riscosNames.slice(0, 4).map((r: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-[12px] text-gray-400">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span> <span className="truncate">{r}</span>
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-bold text-white mb-2">NR dominante</h4>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        {selectedSectorItem.nrs[0] || 'NR-Geral'}
                     </span>
                     <span className="text-[12px] text-gray-400 truncate">Avaliada com base nos riscos</span>
                  </div>
               </div>

               <div className="flex flex-col gap-2 p-4 bg-[#121826] border border-white/5 rounded-xl border-l-2 border-l-purple-500">
                  <h4 className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
                     <Zap className="w-3.5 h-3.5"/> Ação sugerida
                  </h4>
                  <p className="text-[12px] text-gray-300">
                     Priorizar adequações nas frentes de trabalho relacionadas aos principais riscos detectados no setor de {selectedSectorItem.setor.toLowerCase()} e intensificar inspeções de rotina.
                  </p>
               </div>

               <div className="flex items-center gap-4 py-4 border-t border-white/5 group pt-6">
                  <div className="w-10 h-10 rounded-full bg-[#1e1a30] text-gray-400 flex items-center justify-center text-sm font-bold border border-purple-500/20 uppercase shrink-0">
                     <UserPlus className="w-4 h-4 text-purple-400"/>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Responsável</h4>
                     <p className="text-sm font-bold text-white">Carlos Eduardo Silva</p>
                     <p className="text-[11px] text-gray-500">Gerente de {selectedSectorItem.setor}</p>
                  </div>
               </div>
               
               <button onClick={() => {}} className="w-full text-center py-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded-xl text-sm font-bold text-purple-400 transition-colors flex items-center justify-center gap-2">
                  Ver riscos do setor <ArrowRight className="w-4 h-4" />
               </button>

             </div>

           </div>
         </motion.div>
         </>
        )}
      </AnimatePresence>

      {/* FORM CRUD MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#121826] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0b0f19] rounded-t-2xl shrink-0">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {editingItem ? `Avaliar Condição Existente` : `Registro de Risco`}
                </h2>
                <div className="flex items-center gap-2">
                  {editingItem && (
                    <button 
                      onClick={(e) => handleDelete(editingItem.id, e)} 
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                <div className="space-y-4 border-b border-white/5 pb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Prioridade Manual (Opcional)
                      </label>
                      <select 
                        value={formData.prioridade || ''} 
                        onChange={e => setFormData({...formData, prioridade: e.target.value as any})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                      >
                        <option value="">Automático</option>
                        <option value="P1">P1 - Crítico</option>
                        <option value="P2">P2 - Alto</option>
                        <option value="P3">P3 - Médio</option>
                        <option value="P4">P4 - Baixo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Prazo Máximo (Opcional)
                      </label>
                      <input 
                        type="text" 
                        value={formData.prazo || ''} 
                        onChange={e => setFormData({...formData, prazo: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                        placeholder="Ex: Imediato"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Atividade Operacional
                    </label>
                    <select 
                      value={formData.atividade} 
                      onChange={e => setFormData({...formData, atividade: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none mb-3"
                    >
                      {ATIVIDADES_OPCOES.map(opt => <option key={opt} value={opt} className="bg-[#121826] text-white">{opt}</option>)}
                    </select>

                    {normativeDetection && (
                      <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3">
                         <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                           <Shield className="w-4 h-4" /> {normativeDetection.nr} - {normativeDetection.riskType}
                         </h4>
                         <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className="bg-[#0b0f19] p-2 rounded-lg border border-white/5">
                             <span className="text-gray-500 block mb-0.5">Severidade</span>
                             <span className={`font-bold uppercase ${normativeDetection.severity === 'crítica' ? 'text-red-400' : 'text-orange-400'}`}>
                               {normativeDetection.severity}
                             </span>
                           </div>
                           <div className="bg-[#0b0f19] p-2 rounded-lg border border-white/5">
                             <span className="text-gray-500 block mb-0.5">Ação Inicial Recomendada</span>
                             <span className="text-gray-300 font-medium leading-tight">
                               {normativeDetection.recommendedAction}
                             </span>
                           </div>
                         </div>
                         
                         {normativeDetection.documents.length > 0 && (
                           <div>
                             <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Documentos Exigidos</span>
                             <div className="flex flex-wrap gap-1.5">
                               {normativeDetection.documents.map((doc: string) => (
                                 <span key={doc} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-300">{doc}</span>
                               ))}
                             </div>
                           </div>
                         )}

                         {normativeDetection.ppe.length > 0 && (
                           <div>
                             <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">EPI / EPC Mínimos</span>
                             <div className="flex flex-wrap gap-1.5">
                               {normativeDetection.ppe.map((epi: string) => (
                                 <span key={epi} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-300">{epi}</span>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Área / Setor
                    </label>
                    <select 
                      value={formData.setor} 
                      onChange={e => setFormData({...formData, setor: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      {SETORES_OPCOES.map(opt => <option key={opt} value={opt} className="bg-[#121826] text-white">{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 border-b border-white/5 pb-5">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                         Qtd. Pessoas Expostas
                       </label>
                       <input 
                         type="number" min="0" 
                         value={formData.trabalhadoresExpostos || 0} 
                         onChange={e => setFormData({...formData, trabalhadoresExpostos: parseInt(e.target.value) || 0})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-blue-500 transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                         Perfil Exposto (Função)
                       </label>
                       <input 
                         type="text" 
                         value={formData.perfilExposto || ''} 
                         onChange={e => setFormData({...formData, perfilExposto: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                         placeholder="Ex: Soldadores"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                         Executor da Ação
                       </label>
                       <input 
                         type="text" 
                         value={formData.executorCorrecao || ''} 
                         onChange={e => setFormData({...formData, executorCorrecao: e.target.value})}
                         className="w-full bg-black/40 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                         placeholder="Iniciais/Nome"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                         Validador / Responsável
                       </label>
                       <input 
                         type="text" 
                         value={formData.validadorCorrecao || ''} 
                         onChange={e => setFormData({...formData, validadorCorrecao: e.target.value})}
                         className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600"
                         placeholder="Quem assina a baixa"
                       />
                     </div>
                   </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                       Checklist de Conformidade Base
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-tight">Marque as opções em que o cenário está 100% conforme. Ausências gerarão gatilhos de Criticidade Alta/Extrema baseado na matriz de risco NR.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasEpiEpc} 
                          onChange={e => setFormData({...formData, hasEpiEpc: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[#0b0f19] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-gray-200 group-hover:text-white mb-1">EPI / EPC (Equipamentos)</span>
                         <span className="block text-[11px] text-gray-500 leading-snug">O colaborador utiliza os equipamentos obrigatórios corretos para a tarefa (Cinto, ferramentas, proteções ativas)?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasProcedimento} 
                          onChange={e => setFormData({...formData, hasProcedimento: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[#0b0f19] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-gray-200 group-hover:text-white mb-1">Procedimento Operacional / PT</span>
                         <span className="block text-[11px] text-gray-500 leading-snug">Existe Permissão de Trabalho (PT), Análise de Risco (APR) preenchida ou protocolo LOTO ativo e seguido?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasTreinamento} 
                          onChange={e => setFormData({...formData, hasTreinamento: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[#0b0f19] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-gray-200 group-hover:text-white mb-1">Capacitação Normativa (NR)</span>
                         <span className="block text-[11px] text-gray-500 leading-snug">O colaborador possui treinamento válido exigido para este maquinário ou risco (ex: NR-35, NR-10)?</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#121826] to-purple-900/10 border border-purple-500/20 p-5 rounded-xl flex items-start gap-3">
                  <Settings2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">Cálculo de Tipo / Severidade Automático</h4>
                    <p className="text-[11px] text-purple-200/60 leading-relaxed">
                      De acordo com o tipo de risco (Físico, Químico, etc.) e as opções acima, a prioridade será designada automaticamente para garantir agilidade na ação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-white/5 bg-[#0b0f19] flex gap-3 rounded-b-2xl shrink-0">
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold text-gray-400 bg-[#121826] hover:bg-white/10 hover:text-white transition-colors border border-white/10 uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveForm} 
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50 uppercase tracking-wider"
                >
                  Salvar Risco
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* CALCULATION MODAL */}
      <AnimatePresence>
        {showCalculationModal && selectedAction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCalculationModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-[#0b0f19] border border-white/10 rounded-2xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#121826]">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Activity className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                     <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detalhamento do Cálculo</h2>
                     <p className="text-[11px] text-gray-400">Risco: {selectedAction.titulo || selectedAction.atividade}</p>
                   </div>
                 </div>
                 <button onClick={() => setShowCalculationModal(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="overflow-y-auto p-5 space-y-6">
                 
                 {/* Card 1 */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
                       <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
                         <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Variáveis Base
                       </h4>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Severidade Padrão</span>
                             <span className="font-bold text-white">{selectedAction.severidade || selectedAction.gravidade}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Prioridade Final</span>
                             <span className="font-bold text-white">{selectedAction.prioridade}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">NR Relacionada</span>
                             <span className="font-bold text-blue-400">{selectedAction.nr}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Prazo Automático</span>
                             <span className="font-bold text-orange-400">{selectedAction.prazo}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
                       <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5 text-red-400" /> Resultados do Motor
                       </h4>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Impacto Operacional</span>
                             <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase
                                ${selectedAction.impactoOperacional === 'Crítico' ? 'bg-red-500/20 text-red-400' : 
                                  selectedAction.impactoOperacional === 'Alto' ? 'bg-orange-500/20 text-orange-400' :
                                  selectedAction.impactoOperacional === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>{selectedAction.impactoOperacional}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Multa Estimada</span>
                             <span className="font-bold text-red-400 hover:underline cursor-help" title={selectedAction.faixaMulta}>
                               {selectedAction.multaEstimada !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAction.multaEstimada) : 'N/D'}
                             </span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Chance de Incidente</span>
                             <span className="font-bold text-orange-400">{selectedAction.chanceIncidente}%</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                             <span className="text-gray-400">Conformidade</span>
                             <span className={`font-bold ${
                                selectedAction.nivelConformidade === 'Conforme' ? 'text-emerald-400' :
                                selectedAction.nivelConformidade === 'Atenção' ? 'text-yellow-400' :
                                selectedAction.nivelConformidade === 'Não conforme crítico' ? 'text-red-400' :
                                'text-orange-400'
                             }`}>{selectedAction.nivelConformidade}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Justifications */}
                 <div className="space-y-3">
                    <h4 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Justificativas</h4>
                    
                    <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
                      <div className="text-xs text-gray-300 leading-relaxed mb-3">
                         <span className="text-blue-400 font-bold block mb-1">Multa Investigada:</span>
                         “{selectedAction.justificativaMulta || 'Cálculo com base em tabela NR.'}”
                      </div>
                      <div className="text-xs text-gray-300 leading-relaxed mb-3">
                         <span className="text-orange-400 font-bold block mb-1">Chance de Incidente:</span>
                         “{selectedAction.justificativaIncidente || 'Variáveis base da matriz.'}”
                      </div>
                      <div className="text-xs text-gray-300 leading-relaxed">
                         <span className="text-emerald-400 font-bold block mb-1">Origem do Dado:</span>
                         “{selectedAction.justificativa || 'Lançado pela inspeção.'}”
                      </div>
                    </div>
                 </div>

                 {/* Fatores Considered */}
                 {selectedAction.fatoresDeCalculo && selectedAction.fatoresDeCalculo.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Fatores Analisados (Agravantes/Mitigantes)</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAction.fatoresDeCalculo.map((f, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#121826] border border-white/5 rounded text-[10px] text-gray-300">
                             {f}
                          </span>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Warning Area */}
                 <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3">
                   <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                   <p className="text-[9px] sm:text-[10px] font-medium text-yellow-200/80 leading-relaxed">
                     Os valores de multa e chance de incidente são estimativas internas para apoio à decisão e priorização. Não substituem avaliação legal, fiscalização oficial, perícia, laudo técnico ou análise profissional habilitada.
                   </p>
                 </div>

               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
