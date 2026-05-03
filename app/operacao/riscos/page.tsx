"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import TimelineHistory from '@/components/TimelineHistory';
import { 
  Plus, AlertTriangle, X, ChevronRight,
  Shield, Activity, Settings, Settings2, Clock, CheckCircle2,
  UserPlus, ShieldAlert,
  TrendingUp, TrendingDown, Waves, FlaskConical, Users, BarChart2, Trash2, Filter, Zap, BadgeInfo, ArrowRight, ShieldCheck,
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
import { NormativeEngine, RiskEngine, EconomicImpactEngine } from '@/lib/engines';

const SPARK_COLORS = {
  purple: '#a855f7',
  red: '#ef4444',
  emerald: '#10b981',
  orange: '#f97316',
  blue: '#3b82f6',
  yellow: '#eab308'
};

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `gradient-${color.replace('#', '')}`;
  const endY = height - ((data[data.length - 1] - min) / range) * height;

  return (
    <svg width="100%" height="100%" viewBox={`0 -5 ${width} ${height + 15}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={endY} fill="var(--text-primary)" stroke={color} strokeWidth="2" r="3" />
    </svg>
  );
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
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-lg shadow-xl shrink-0 whitespace-nowrap z-[100]">
        <p className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-[12px]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555' }}></div>
            <span className="text-[var(--text-secondary)]">{entry.name === 'Total' || entry.name === 'value' ? 'Valor' : entry.name}:</span>
            <span className="font-bold text-[var(--text-primary)] whitespace-nowrap">
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
  const { sectors } = useAppStore();
  const SETORES_OPCOES = sectors.map(s => s.name);

  const filterJunk = (items: any[]) => {
    return items.filter(i => {
      const textFields = [i.title, i.titulo, i.descricao, i.name, i.nome, i.atividade, i.nr, i.responsavel, i.category].filter(Boolean).join(' ').toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!i.title && !i.titulo && !i.atividade && !i.nome && !i.name && !i.descricao && !i.category) return false;
      return true;
    });
  };

  const storeRiscosRaw = useAppStore(state => state.riscos);
  const storeAcoesRaw = useAppStore(state => state.acoes);
  
  const storeRiscos = useMemo(() => filterJunk(storeRiscosRaw || []), [storeRiscosRaw]);
  const storeAcoes = useMemo(() => filterJunk(storeAcoesRaw || []), [storeAcoesRaw]);

  const [activeTab, setActiveTab] = useState<TabType>('Visão Geral');
  const [tipoFilter, setTipoFilter] = useState<'Todos' | NivelRisco>('Todos');

  const combinedData = useMemo(() => {
    return storeRiscos.map(sr => {
      let status = sr.status;
      if (status === 'Pendente' || status === 'A tratar') status = 'Aberto';
      if (status === 'Monitorando') status = 'Em análise';
      
      return {
        ...sr,
        atividade: sr.atividade || sr.tipoDeRisco || sr.titulo || sr.title || 'Atividade não especificada',
        status: status || 'Aberto',
        nivel: (sr.nivel as NivelRisco) || 'Baixo',
        prioridade: sr.prioridade || 'P4',
        prazo: sr.prazo || 'Sem prazo',
        gravidade: sr.gravidade || sr.severidade || 'Baixa',
        probabilidade: sr.probabilidade || 'Média',
        tipoDeRisco: sr.tipoDeRisco || sr.titulo || sr.title || 'Risco de segurança',
        setor: sr.setor || 'Geral'
      } as RiskInstance;
    });
  }, [storeRiscos]);
  
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
    status: 'Aberto'
  });
  
  const [selectedAction, setSelectedAction] = useState<RiskInstance | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);

  const normativeDetection = useMemo(() => NormativeEngine.detect(formData.atividade || ''), [formData.atividade]);

  const getNivelColor = (nivel?: NivelRisco) => {
    switch(nivel) {
      case 'Crítico': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Alto': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-[var(--text-muted)] bg-gray-500/10 border-gray-500/30';
    }
  };

  const getRiskTypeIcon = (tipo: string) => {
    const term = tipo.toLowerCase();
    if (term.includes('queda')) return <TrendingDown className="w-5 h-5 text-purple-400" />;
    if (term.includes('choque') || term.includes('elétric')) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (term.includes('asfixia') || term.includes('afogamento')) return <Waves className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (term.includes('químic')) return <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (term.includes('máquina') || term.includes('prensamento') || term.includes('corte')) return <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (term.includes('ergonômico') || term.includes('físico') || term.includes('esforço')) return <Activity className="w-5 h-5 text-indigo-400" />;
    if (term.includes('incêndio') || term.includes('explosão')) return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    return <AlertTriangle className="w-5 h-5 text-[var(--text-muted)]" />;
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
      case 'Aberto': return 'text-red-600 dark:text-red-400 border-red-500/20';
      case 'Em análise': return 'text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Mitigado': return 'text-yellow-400 border-yellow-500/20';
      case 'Resolvido': return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'text-[var(--text-muted)] border-gray-500/20';
    }
  };

  const getActivityIcon = (atividade: string) => {
    const term = atividade.toLowerCase();
    switch(term) {
      case 'produção': return <Factory className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'manutenção': return <Wrench className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'operacional': return <Shield className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'logística': return <Truck className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'almoxarifado': return <Package className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'administrativo': return <User className="w-5 h-5 text-[var(--text-muted)]" />;
      case 'trabalho em altura': return <Activity className="w-5 h-5 text-purple-400" />;
      case 'manutenção elétrica': return <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'operação de máquinas': return <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'espaço confinado': return <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'movimentação de cargas': return <Truck className="w-5 h-5 text-yellow-400" />;
      default: return <Activity className="w-5 h-5 text-[var(--text-muted)]" />;
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    useAppStore.getState().deleteRisco(id);
    setIsDrawerOpen(false);
  };

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
    { id: 'c11', label: 'Chance média de incidente', val: `${Math.round(avgChanceIncidente)}%`, sub: 'Risco moderado', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  const storeInspecoes = useAppStore(state => state.inspecoes);
  const nrMetrics = useMemo(() => getNrMetrics({ inspections: storeInspecoes || [], risks: combinedData, actions: storeAcoes }), [storeInspecoes, combinedData, storeAcoes]);

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
        atividade: act
      };
    }
    
    const obj = activityGroups[act];
    obj.count++;
    if (r.tipoDeRisco && !obj.riscosNames.includes(r.tipoDeRisco)) obj.riscosNames.push(r.tipoDeRisco);
    if (r.setor && !obj.setores.includes(r.setor)) obj.setores.push(r.setor);
    if (r.nr && !obj.nrs.includes(r.nr)) obj.nrs.push(r.nr);
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

  return (
    <div className="flex w-full h-full overflow-hidden bg-[var(--bg-primary)]">
      <motion.div layout className={`flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300 ${isDrawerActionOpen || isDrawerOpen || selectedSectorItem ? 'lg:pr-[400px]' : ''}`}>
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 shrink-0">
            <div className="flex bg-[var(--bg-card)] p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto custom-scrollbar gap-1 mb-6">
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
                      ? 'bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-[var(--shadow-glow)]' 
                      : 'bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-active-group)] hover:text-[var(--text-primary)]'
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
               }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[var(--shadow-glow)] border border-purple-500/50">
                <Plus className="w-4 h-4" />
                Registrar Risco
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 mt-2 shrink-0">
               <div>
                 <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)] mb-2">
                   <span>Operação</span>
                   <span className="text-[var(--text-secondary)]">›</span>
                   <span>Riscos</span>
                   <span className="text-[var(--text-secondary)]">›</span>
                   <span className="text-[var(--text-muted)]">{activeTab}</span>
                 </div>
                 <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide uppercase">
                    {activeTab === 'Visão Geral' && 'Visão Geral de Riscos'}
                    {activeTab === 'Atividade' && 'Riscos por Atividade'}
                    {activeTab === 'Setor' && 'Riscos por Setor'}
                    {activeTab === 'Tipo' && 'Filtro por Tipo/Nível'}
                    {activeTab === 'Histórico' && 'Histórico de Riscos'}
                 </h2>
                 <p className="text-xs text-[var(--text-muted)] mt-1">
                    {activeTab === 'Visão Geral' && "Mapeamento analítico e distribuição da criticidade de toda a operação."}
                    {activeTab === 'Atividade' && "Rastreabilidade de risco diretamente ligada às tarefas executadas em campo."}
                    {activeTab === 'Setor' && "Panorama de segurança verticalizado por departamentos e áreas físicas das unidades."}
                    {activeTab === 'Tipo' && "Classificação dos riscos por nível crítico, alto, médio e baixo."}
                    {activeTab === 'Histórico' && "Trilha de auditoria imutável de todos os riscos da plataforma."}
                 </p>
               </div>
               {activeTab === 'Tipo' && (
                 <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1.5 rounded-lg border border-[var(--border)]">
                   <Filter className="w-4 h-4 text-[var(--text-muted)] ml-2" />
                   <select 
                     value={tipoFilter} 
                     onChange={(e) => { setTipoFilter(e.target.value as any); setCurrentPage(1); }}
                     className="bg-transparent text-sm text-[var(--text-primary)] focus:outline-none px-2"
                   >
                     <option value="Todos">Todos os níveis</option>
                     <option value="Crítico">Crítico</option>
                     <option value="Alto">Alto</option>
                     <option value="Médio">Médio</option>
                     <option value="Baixo">Baixo</option>
                   </select>
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
                      <div key={card.id} className="bg-[var(--bg-card)] border border-[var(--border)] p-5 lg:p-6 rounded-xl flex flex-col relative group overflow-hidden shadow-lg shadow-black/20 hover:border-[var(--border)] transition-all">
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30`} style={{ backgroundColor: card.sparkColor }}></div>
                        <div className="flex items-start justify-between relative z-10 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${card.bg} ${card.border}`}>
                              <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <h3 className="text-[13px] font-medium text-[var(--text-secondary)]">{card.label}</h3>
                          </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight relative z-10 mb-2">
                          {card.val}
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-[12px] font-medium text-[var(--text-muted)]">{card.sub}</span>
                          {card.id === 'c9' && <div className="w-4 h-4 text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </div>}
                        </div>
                        {card.trend && (
                          <div className="absolute bottom-4 right-4 left-4 h-12 opacity-40 pointer-events-none z-0">
                             <Sparkline data={card.trend} color={card.sparkColor || '#ffffff'} />
                          </div>
                        )}
                        {card.id === 'c11' && (
                          <div className="absolute bottom-6 left-6 right-6 h-[5px] bg-[var(--bg-active-group)] rounded-full overflow-hidden z-10">
                             <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" style={{ width: card.val }}></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Distribuição por nível</h3>
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
                          <span className="text-3xl font-bold text-[var(--text-primary)] leading-none">{abertosCountStats}</span>
                          <span className="text-[12px] text-[var(--text-muted)] font-medium mt-1">Total abertos</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 font-sans">
                        {pieDataNivel.length > 0 ? pieDataNivel.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] opacity-90" style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#555' }}></div>
                            <span className="text-[13px] text-[var(--text-secondary)] w-16">{entry.name}</span>
                            <span className="text-[13px] font-bold text-[var(--text-primary)]">{entry.value} <span className="font-normal text-[var(--text-muted)]">({Math.round((entry.value/abertosCountStats)*100)}%)</span></span>
                          </div>
                        )) : (
                          <div className="text-xs text-[var(--text-muted)]">Sem dados suficientes</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Riscos por setor</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barDataMultaSetor} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
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

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Multa estimada por NR</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={nrBarData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={55} />
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
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Riscos por NR</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nrRiscosData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Bar dataKey="Total" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={24} />
                          <Bar dataKey="Críticos" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Riscos por Origem</h3>
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
                            <span className="text-[13px] text-[var(--text-secondary)] w-16 truncate">{entry.name}</span>
                            <span className="text-[13px] font-bold text-[var(--text-primary)]">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6 font-sans">Chance Média de Incidente por NR (%)</h3>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={avgChanceData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                          <Line type="monotone" dataKey="Chance" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 mt-2 pb-12">
                   <div className="bg-[var(--bg-card)] border border-purple-500/20 rounded-xl p-6 flex flex-col shadow-[0_0_30px_rgba(124,58,237,0.03)] font-sans relative overflow-hidden">
                      <div className="absolute inset-0  pointer-events-none"></div>
                      <div className="flex items-center gap-2 mb-6 relative z-10">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Insights operacionais</h3>
                      </div>
                      <div className="flex-1 space-y-5 relative z-10">
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-[var(--text-primary)]">{criticosCount} riscos críticos em aberto exigem ação imediata.</p>
                               <p className="text-[12px] text-[var(--text-muted)] mt-1">Impacto potencial alto em SST e conformidade.</p>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
                              <TrendingUp className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-[var(--text-primary)]">{nrBarData[0]?.name || 'NR'} concentra {Math.round(((nrBarData[0]?.Total || 0) / (totalMultaAberto||1)) * 100) || 0}% da multa.</p>
                               <p className="text-[12px] text-[var(--text-muted)] mt-1">Priorize adequações e controles para evitar infrações pesadas.</p>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                               <p className="text-[13px] font-medium text-[var(--text-primary)]">{listRiscos[0]?.titulo || 'Sem riscos'} lidera as chances de incidente.</p>
                               <p className="text-[12px] text-[var(--text-muted)] mt-1">Reforce treinamentos e inspeções nas áreas operacionais.</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col font-sans">
                      <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Top riscos críticos</h3>
                      </div>
                      <div className="flex-1 space-y-3">
                         {listRiscos.map((r, i) => (
                            <div key={r.id || i} className="flex items-center gap-4 py-2 border-b border-[var(--border)] last:border-0 group cursor-pointer hover:bg-[var(--bg-active-group)] px-3 -mx-3 rounded-lg transition-colors" onClick={(e) => {
                                e.stopPropagation(); 
                                setEditingItem(r); 
                                setIsDrawerOpen(true);
                            }}>
                               <div className="w-6 h-6 rounded bg-red-500/10 text-[12px] font-bold text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                  {i+1}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[13px] font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)] transition-colors">{r.titulo || r.atividade}</h4>
                               </div>
                               <div className="text-[12px] text-[var(--text-muted)] truncate text-right">
                                  {r.setor}
                               </div>
                            </div>
                         ))}
                         {listRiscos.length === 0 && (
                            <div className="text-sm text-[var(--text-muted)] italic mt-4 text-center">Nenhum risco crítico encontrado.</div>
                         )}
                      </div>
                   </div>

                   <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col font-sans">
                      <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Top 5 riscos por chance (%)</h3>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2 space-y-5">
                         {renderTopRisksChance.map((r, i) => (
                            <div key={i} className="cursor-pointer group" onClick={() => { setActiveTab('Visão Geral'); setIsDrawerActionOpen(false); setSelectedSectorItem(null); setTimeout(() => setSelectedAction(null), 300); }}>
                               <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-[13px] font-medium text-[var(--text-secondary)] truncate pr-4 group-hover:text-[var(--text-primary)] transition-colors">{r.name}</h4>
                                  <span className="text-[13px] font-bold text-[var(--text-primary)]">{r.chance}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(r.chance, 100)}%` }}></div>
                               </div>
                            </div>
                         ))}
                         {renderTopRisksChance.length === 0 && (
                            <div className="text-sm text-[var(--text-muted)] italic mt-4 text-center">Sem dados suficientes.</div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'Setor' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 pb-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl shadow-lg relative overflow-hidden group">
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                           <Users className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-[var(--text-muted)] mb-1">Setores monitorados</h3>
                        <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">{totalSetoresAtivos}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-[var(--text-muted)]">100% dos setores ativos</span>
                        </div>
                        <div className="mt-3 text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 pt-3 border-t border-[var(--border)]">
                           <span className="w-1.5 h-0.5 bg-gray-500 rounded"></span> Sem variação
                        </div>
                     </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl shadow-lg relative overflow-hidden group">
                     {maxCritSector && <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>}
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Setor mais crítico</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-snug mb-2 truncate">{maxCritSector?.setor || 'N/A'}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-[var(--text-muted)]">{maxCritSector?.crits || 0} riscos críticos</span>
                        </div>
                        <button onClick={() => {}} className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 pt-3 border-t border-[var(--border)] w-full text-left">
                           Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl shadow-lg relative overflow-hidden group">
                     {maxConcSector && <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>}
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                           <PieChartIcon className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">Maior concentração de risco</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-snug mb-2 truncate">{maxConcSector?.setor || 'N/A'}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-[var(--text-muted)]">{totalRiscosSetores > 0 ? Math.round((maxConcSector?.count || 0) / totalRiscosSetores * 100) : 0}% do total de riscos</span>
                        </div>
                        <button onClick={() => {}} className="mt-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 pt-3 border-t border-[var(--border)] w-full text-left">
                           Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl shadow-lg relative overflow-hidden group">
                     <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                     <div className="flex items-start justify-between relative z-10 mb-4">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                           <DollarSign className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Exposição financeira por setor</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] font-mono tracking-tight mb-2">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMultaSetores)}
                        </p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-[var(--text-muted)]">Estimativa total de multas</span>
                        </div>
                        <div className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1pt-3 pt-3 border-t border-[var(--border)]">
                           <ArrowDownRight className="w-3 h-3" /> -8,4% <span className="text-[var(--text-muted)] font-normal">vs mês anterior</span>
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
                            className={`bg-[var(--bg-card)] border rounded-xl p-4 flex flex-col items-start cursor-pointer hover:bg-[var(--bg-active-group)] transition-colors relative overflow-hidden
                            ${isSelected ? 'border-purple-500 shadow-[var(--shadow-glow)] ring-1 ring-purple-500/50' : 'border-[var(--border)]'}`}>
                          
                          <div className="flex w-full items-center gap-3 mb-3">
                             <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                   <path className="text-gray-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                   <path className={bgCircle} strokeDasharray={`${pct}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="absolute text-[10px] text-[var(--text-muted)] flex items-center justify-center">
                                   {getActivityIcon(group.setor)}
                                </div>
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold text-[var(--text-primary)] truncate w-full">{group.setor}</h4>
                                <div className={`text-lg font-bold leading-none ${bgCircle}`}>{pct}%</div>
                             </div>
                          </div>
                          
                          <div className="mt-auto">
                             <span className={`text-[10px] font-medium block truncate ${bgCircle}`}>Nível de risco: {sectorLevel}</span>
                             <span className="text-[11px] text-[var(--text-muted)]">{group.count} riscos</span>
                          </div>
                       </div>
                     )
                  })}
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                          <tr>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Setor</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Total de Riscos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-red-500/80 uppercase tracking-wider text-center">Críticos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-orange-500/80 uppercase tracking-wider text-center">Altos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-yellow-500/80 uppercase tracking-wider text-center">Médios</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider text-center">Baixos</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Multa Estimada</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Chance Média de Incidente</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Último Registro</th>
                             <th className="px-5 py-4 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                           {sectorGroups.map((group, idx) => {
                             const isSelected = selectedSectorItem?.setor === group.setor;
                             const avgChance = group.count > 0 ? Math.round(group.chanceSum / group.count) : 0;
                             const chanceLabel = avgChance >= 60 ? 'Alta' : avgChance >= 35 ? 'Média' : 'Baixa';
                             const chanceColor = avgChance >= 60 ? 'text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20' : avgChance >= 35 ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';

                             return (
                               <tr key={idx} 
                                   className={`hover:bg-[var(--bg-active-group)] transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} 
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
                                       <span className="text-[13px] font-bold text-[var(--text-primary)] truncate pr-4">{group.setor}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-[var(--text-secondary)]">{group.count}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-red-500 font-bold">{group.crits}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-orange-500 font-bold">{group.altos}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-yellow-500 font-bold">{group.medios}</td>
                                 <td className="px-5 py-4 align-middle text-center font-mono text-[13px] text-emerald-500 font-bold">{group.baixos}</td>
                                 <td className="px-5 py-4 align-middle text-right text-[13px] font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(group.multaTotal)}
                                 </td>
                                 <td className="px-5 py-4 align-middle text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <span className="text-[13px] text-[var(--text-muted)] w-8 text-right font-mono">{avgChance}%</span>
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chanceColor}`}>{chanceLabel}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right font-mono text-[12px] text-[var(--text-muted)] whitespace-nowrap">
                                    {group.lastRecord.toLocaleString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right">
                                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                 </td>
                               </tr>
                             )
                           })}
                        </tbody>
                     </table>
                     <div className="p-4 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                        Exibindo 1 a {sectorGroups.length} de {sectorGroups.length} setores
                     </div>
                   </div>
                </div>
              </div>
            )}



            {activeTab === 'Tipo' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Settings2 className="w-6 h-6 text-purple-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-purple-400 mb-0.5">Tipos monitorados</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">{Object.keys(countByType).length}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Cobrem 100% dos riscos ativos</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <PieChartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">Tipo mais recorrente</h3>
                        <p className="text-lg font-bold text-[var(--text-primary)] mb-0.5 leading-tight truncate">{topType}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{Math.round(((countByType[topType] || 0) / Math.max(1, combinedData.length))*100)}% dos riscos registrados</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 z-10">
                        <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                     </div>
                     <div className="z-10 relative">
                        <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-0.5">Maior criticidade</h3>
                        <p className="text-lg font-bold text-[var(--text-primary)] mb-0.5 leading-tight">Crítico</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{combinedData.filter((c: any) => c.nivel === 'Crítico').length} tipos classificados como críticos</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden flex items-center gap-4 ">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 z-10">
                        <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <div className="z-10 relative">
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Risco financeiro por tipo</h3>
                        <p className="text-lg font-bold text-[var(--text-primary)] mb-0.5 leading-tight">{formatCurrency(totalMultaAberto)}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Exposição total estimada</p>
                     </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[var(--bg-primary)]">
                          <tr>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Tipo de Risco</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Nível</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Setor Princip.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Atividade Princip.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Origem</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] whitespace-nowrap">Chance Inc.</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] text-right">Multa Estimada</th>
                             <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                           {currentItems.map((item) => {
                               const isSelected = selectedAction?.id === item.id;
                               return (
                               <tr key={item.id} className={`hover:bg-[var(--bg-active-group)] transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => {
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
                                      <span className="text-[13px] font-bold text-[var(--text-primary)]">{item.tipoDeRisco}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${getNivelColor(item.nivel)}`}>{item.nivel}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-[var(--text-secondary)]">{item.setor}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-[var(--text-secondary)]">{item.atividade}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <span className="text-[13px] text-[var(--text-muted)]">{getRiskOrigem(item.tipoDeRisco || '')}</span>
                                 </td>
                                 <td className="px-5 py-4 align-middle">
                                    <div className="flex items-center gap-1.5">
                                       <span className={`text-[13px] font-bold ${((item.chanceIncidente || 0) >= 60) ? 'text-red-500' : ((item.chanceIncidente || 0) >= 35) ? 'text-orange-500' : 'text-emerald-500'}`}>
                                          {((item.chanceIncidente || 0) >= 60) ? 'Alta' : ((item.chanceIncidente || 0) >= 35) ? 'Média' : 'Baixa'}
                                       </span>
                                       <span className={`text-xs ${((item.chanceIncidente || 0) >= 60) ? 'text-red-500' : ((item.chanceIncidente || 0) >= 35) ? 'text-orange-500' : 'text-emerald-500'}`}>{item.chanceIncidente || 0}%</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 align-middle text-right text-[13px] font-mono text-[var(--text-secondary)]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.multaEstimada || 0)}</td>
                                 <td className="px-5 py-4 align-middle text-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 ${item.status === 'Monitorado' ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'Crítico' ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-muted)]'}`}>
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
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 ">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                     <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">Este histórico é imutável e somente leitura.</p>
                    <p className="text-[13px] text-[var(--text-muted)]">Os registros não podem ser editados ou excluídos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-purple-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-purple-400 mb-0.5">Registros históricos</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">{combinedData.length}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Total de registros</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">Origem automática</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">{combinedData.filter(d => (d.origem || '').toLowerCase().includes('auto') || (d.origem || '').toLowerCase().includes('inspe')).length}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{Math.round((combinedData.filter(d => (d.origem || '').toLowerCase().includes('auto') || (d.origem || '').toLowerCase().includes('inspe')).length / Math.max(1, combinedData.length)) * 100)}% do total</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Origem manual</h3>
                        <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">{combinedData.filter(d => !((d.origem || '').toLowerCase().includes('auto') || (d.origem || '').toLowerCase().includes('inspe'))).length}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{Math.round((combinedData.filter(d => !((d.origem || '').toLowerCase().includes('auto') || (d.origem || '').toLowerCase().includes('inspe'))).length / Math.max(1, combinedData.length)) * 100)}% do total</p>
                     </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-5 border border-[var(--border)] rounded-xl flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-0.5">Última atualização</h3>
                        <p className="text-lg font-bold text-[var(--text-primary)] mb-0.5">Hoje, 08:42</p>
                        <p className="text-[11px] text-[var(--text-muted)]">21/05/2025</p>
                     </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg-primary)]">
                        <tr>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">ID</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Título do risco</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Origem</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Setor</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Atividade</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">NR</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Data e hora v</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">Status atual</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                        {combinedData.map((item) => {
                          const isSelected = selectedAction?.id === item.id;
                          const isAuto = (item.origem || '').toLowerCase().includes('auto') || (item.origem || '').toLowerCase().includes('inspe');
                          return (
                          <tr key={item.id} className={`hover:bg-[var(--bg-active-group)] transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => {
                             if (isSelected && isDrawerActionOpen) {
                                setIsDrawerActionOpen(false);
                                setTimeout(() => setSelectedAction(null), 300);
                             } else {
                                setSelectedAction(item);
                                setIsDrawerActionOpen(true);
                             }
                          }}>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-[var(--text-secondary)]">{item.id}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] font-bold text-[var(--text-primary)]">{item.tipoDeRisco || item.atividade}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold bg-[var(--bg-primary)] ${isAuto ? 'text-blue-600 dark:text-blue-400 border-blue-500/20' : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                                 {isAuto ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                 {isAuto ? 'Automática' : 'Manual'}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-[var(--text-secondary)]">{item.setor}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-[var(--text-secondary)]">{item.atividade}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-purple-400">{Array.isArray(item.nr) ? item.nr[0] : item.nr}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[13px] text-[var(--text-secondary)]">21/05/2025 08:42</span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 ${item.status === 'Monitorado' ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'Crítico' || item.status === 'Aberto' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Monitorado' ? 'bg-emerald-500' : item.status === 'Crítico' || item.status === 'Aberto' ? 'bg-red-500' : 'bg-blue-500'} mb-0.5`}></span>
                                 {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                               <button className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-active-group)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
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
                <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Activity className="w-16 h-16" />
                  </div>
                  <h3 className="text-[12px] text-purple-400 mb-1 z-10 relative">Atividades monitoradas</h3>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mb-2 z-10 relative">{totalAtividades}</p>
                  <p className="text-xs text-[var(--text-muted)] z-10 relative">+3 desde a semana passada</p>
                </div>
                <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <ShieldAlert className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-[12px] text-red-600 dark:text-red-400 mb-1 z-10 relative">Atividades com risco crítico</h3>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mb-2 z-10 relative">{atividadesCriticas}</p>
                  <p className="text-xs text-[var(--text-muted)] z-10 relative">{getPercentage(atividadesCriticas, totalAtividades)}% do total</p>
                </div>
                <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <TrendingUp className="w-16 h-16 text-orange-500" />
                  </div>
                  <h3 className="text-[12px] text-orange-600 dark:text-orange-400 mb-1 z-10 relative">Maior atividade de risco</h3>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mb-2 z-10 relative truncate">{maiorAtividade}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 z-10 relative">Crítico</span>
                </div>
                <div className="bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <BadgeInfo className="w-16 h-16 text-yellow-500" />
                  </div>
                  <h3 className="text-[12px] text-yellow-400 mb-1 z-10 relative">Multa estimada por atividade</h3>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mb-2 z-10 relative">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMultaAbertoActivity)}</p>
                  <p className="text-xs text-[var(--text-muted)] z-10 relative">Total potencial</p>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Atividade</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Setor Vinculado</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Riscos e Perigos</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Exigência EPI/EPC</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Chance de Incidente</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Multa Estimada</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {sortedActivities.length === 0 ? (
                         <tr>
                           <td colSpan={8} className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                              Nenhuma atividade encontrada neste filtro.
                           </td>
                         </tr>
                      ) : sortedActivities.map((item, idx) => {
                         const isSelected = selectedAction?.atividade === item.atividade;
                         const avgChance = item.count > 0 ? Math.round(item.chanceSum / item.count) : 0;
                         const chanceLabel = avgChance >= 60 ? 'Alta' : avgChance >= 35 ? 'Média' : 'Baixa';
                         const chanceColor = avgChance >= 60 ? 'text-red-500' : avgChance >= 35 ? 'text-yellow-500' : 'text-emerald-500';

                         return (
                          <tr key={idx} className={`hover:bg-[var(--bg-active-group)] transition-colors cursor-pointer ${isSelected ? 'bg-purple-900/10 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`} onClick={() => { 
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
                                   <span className="text-[13px] font-bold text-[var(--text-primary)]">{item.atividade}</span>
                                   <span className="text-[11px] text-[var(--text-muted)]">{Array.from(new Set(item.nrs))[0] || item.nrString}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <span className="text-[13px] text-[var(--text-muted)]">{item.setores[0] || 'Vários'}</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-[13px] text-[var(--text-primary)] truncate max-w-[180px]">{item.riscosNames[0] || 'Nenhum Risco'}</span>
                                 <span className="text-[11px] text-[var(--text-muted)]">{item.count} risco{item.count !== 1 ? 's' : ''} associado{item.count !== 1 ? 's' : ''}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-1">
                                 {item.episAusentes > 0 ? (
                                    <>
                                      <span className="text-[13px] text-[var(--text-primary)] truncate max-w-[150px]">Cinto paraquedista...</span>
                                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded w-max">{item.episAusentes} de {item.episTotal} ausentes</span>
                                    </>
                                 ) : (
                                    <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-active-group)] border border-[var(--border)] px-2 py-1 rounded w-max font-medium">Sem equipamento</span>
                                 )}
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                               <div className="flex flex-col gap-0.5">
                                  <span className={`text-[13px] font-bold ${chanceColor}`}>{chanceLabel}</span>
                                  {avgChance > 0 && <span className="text-[11px] text-[var(--text-muted)]">{avgChance}%</span>}
                               </div>
                            </td>
                            <td className="px-5 py-4 align-middle whitespace-nowrap">
                               <span className="text-[13px] text-[var(--text-secondary)] font-mono">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(item.multaTotal)}
                               </span>
                            </td>
                            <td className="px-5 py-4 align-middle text-center">
                               <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border tracking-wider bg-opacity-10 
                                  ${item.maxNivelName === 'Crítico' ? 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-400' : 
                                    item.maxNivelName === 'Alto' ? 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-400' : 
                                    item.maxNivelName === 'Médio' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                                    'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                                 {item.maxNivelName}
                               </span>
                            </td>
                          </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-primary)]">
                   <span>Mostrando 1 a {sortedActivities.length} de {sortedActivities.length} atividades</span>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                         <button className="px-2 py-1 rounded hover:text-[var(--text-primary)] transition-colors disabled:opacity-50" disabled><ChevronRight className="w-4 h-4 rotate-180" /></button>
                         <button className="px-2.5 py-1 rounded text-sm bg-purple-600/20 text-purple-400 border border-purple-500/30">1</button>
                         <button className="px-2 py-1 rounded hover:text-[var(--text-primary)] transition-colors disabled:opacity-50" disabled><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                         <select className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-muted)] focus:outline-none">
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
              className="fixed inset-0 bg-[var(--bg-primary)] z-40 lg:hidden"
              onClick={() => setIsDrawerActionOpen(false)}
            />
           <motion.div 
           initial={{ opacity: 0, x: '100%' }} 
           animate={{ opacity: 1, x: 0 }} 
           exit={{ opacity: 0, x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-y-0 right-0 w-full sm:w-[400px] h-full bg-[var(--bg-card)] border-l border-[var(--border)] shadow-3xl z-50 flex flex-col overflow-hidden"
         >
           <div className="h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                   {activeTab === 'Tipo' ? 'Detalhes do risco' : 'Detalhes da atividade'}
                </h3>
                <button onClick={() => setIsDrawerActionOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-[var(--bg-active-group)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               {activeTab === 'Histórico' ? (
                 <>
                   <div className="flex items-start justify-between border-b border-[var(--border)] pb-4 mb-4">
                     <span className="text-sm font-bold text-purple-400">{selectedAction.id}</span>
                     <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border bg-opacity-10 
                          ${selectedAction.status === 'Crítico' || selectedAction.status === 'Pendente' ? 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-400' : 
                            selectedAction.status === 'Em análise' ? 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-400' :
                            selectedAction.status === 'Concluído' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-400' : 
                            'text-yellow-400 border-yellow-500/20 bg-yellow-400'}`}>
                       {selectedAction.status}
                     </span>
                   </div>

                   <div className="flex items-start gap-4 mb-8">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--bg-card)] text-blue-600 dark:text-blue-400">
                       <ShieldAlert className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col gap-1">
                       <h2 className="text-lg font-bold text-[var(--text-primary)] leading-none">{selectedAction.tipoDeRisco || selectedAction.atividade}</h2>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--text-muted)] font-medium">{Array.isArray(selectedAction.nr) ? selectedAction.nr.join(', ') : selectedAction.nr}</span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="text-xs text-[var(--text-muted)]">{selectedAction.setor}</span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span className="text-xs text-[var(--text-muted)]">{selectedAction.atividade}</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     {selectedAction.inspection_name && (
                       <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                          <span className="text-[13px] text-[var(--text-muted)] shrink-0">Inspeção de origem</span>
                          <span className="text-[13px] text-purple-400 font-bold text-right">
                             {selectedAction.inspection_name}
                          </span>
                       </div>
                     )}
                     {(selectedAction as any).checklistId && (
                       <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                          <span className="text-[13px] text-[var(--text-muted)] shrink-0">Checklist vinculado</span>
                          <span className="text-[13px] text-[var(--text-primary)] text-right">
                             {selectedAction.atividade || 'Checklist de Inspeção'}
                          </span>
                       </div>
                     )}
                     <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Justificativa</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right">
                           {(selectedAction as any).justificativa || (selectedAction as any).justificativaMulta || 'Risco identificado durante auditoria.'}
                        </span>
                     </div>
                     <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Pergunta origem</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right">
                           {(selectedAction as any).perguntaOrigem || 'A atividade envolve entrada em espaços confinados ou locais com ventilação limitada?'}
                        </span>
                     </div>
                     <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Resposta origem</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right">{(selectedAction as any).respostaOrigem || 'Sim'}</span>
                     </div>
                     <div className="flex justify-between items-start gap-6 border-b border-[var(--border)] pb-4">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Multa estimada</span>
                        <span className="text-[13px] font-mono text-[var(--text-primary)] text-right">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(selectedAction.multaEstimada || 40000)}
                        </span>
                     </div>
                     <div className="flex justify-between items-center gap-6 border-b border-[var(--border)] pb-4">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Chance de incidente</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 min-w-0 ${((selectedAction.chanceIncidente || 0) >= 60) ? 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/10' : ((selectedAction.chanceIncidente || 0) >= 35) ? 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-500/10' : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${((selectedAction.chanceIncidente || 0) >= 60) ? 'bg-red-500' : ((selectedAction.chanceIncidente || 0) >= 35) ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                           {((selectedAction.chanceIncidente || 0) >= 60) ? 'Alta' : ((selectedAction.chanceIncidente || 0) >= 35) ? 'Média' : 'Baixa'}
                        </span>
                     </div>
                     <div className="flex justify-between items-center gap-6 pt-2">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Responsável atual</span>
                        <div className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                           <div className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center border border-[var(--border)] overflow-hidden">
                              <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                           </div>
                           <span className="font-medium">SST <span className="text-[var(--text-muted)] font-normal">• Supervisor da área</span></span>
                        </div>
                     </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
                     <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Informações de auditoria
                     </h3>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Criado em</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right">21/05/2025 08:31</span>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Origem</span>
                        <div className="flex items-center gap-2 text-[13px] text-blue-600 dark:text-blue-400">
                           {(selectedAction.origem || '').toLowerCase().includes('inspe') ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                           {selectedAction.origem || 'Automática'} 
                            <span className="text-[var(--text-muted)] text-xs">({(selectedAction.origem || '').toLowerCase().includes('inspe') ? 'Inspeção de campo' : ((selectedAction.origem || '').toLowerCase().includes('auto') ? 'Motor de Riscos' : 'Inserção Manual')})</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Última atualização</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right">21/05/2025 08:31</span>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Atualizado por</span>
                        <div className="flex items-center gap-2 text-[13px] text-blue-600 dark:text-blue-400">
                           <Settings2 className="w-3.5 h-3.5" />
                           Sistema
                        </div>
                     </div>
                     <div className="flex justify-between items-center gap-6 pb-3">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Versão do registro</span>
                        <span className="text-[13px] text-[var(--text-primary)] text-right font-mono">1</span>
                     </div>
                     <div className="flex justify-between items-center gap-6">
                        <span className="text-[13px] text-[var(--text-muted)] shrink-0">Hash do registro</span>
                        <div className="flex items-center gap-2 group cursor-pointer">
                           <span className="text-[12px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">a7f2c9e1d4b7...</span>
                           <File className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)]" />
                        </div>
                     </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--bg-card)] text-purple-400">
                         {activeTab === 'Tipo' ? getRiskTypeIcon(selectedAction.tipoDeRisco || '') : getActivityIcon(selectedAction.atividade)}
                       </div>
                       <div className="flex flex-col gap-1">
                         <h2 className="text-lg font-bold text-[var(--text-primary)] leading-none">{selectedAction.atividade || selectedAction.tipoDeRisco}</h2>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)]">{Array.isArray(selectedAction.nr) ? selectedAction.nr.join(', ') : selectedAction.nr}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="text-xs text-[var(--text-muted)]">{selectedAction.setor}</span>
                         </div>
                       </div>
                     </div>
                     <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-opacity-10 
                          ${selectedAction.nivel === 'Crítico' ? 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-400' : 
                            selectedAction.nivel === 'Alto' ? 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-400' : 
                            selectedAction.nivel === 'Médio' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                            'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                       {selectedAction.nivel}
                     </span>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-2">Resumo</h4>
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                         Atividade com alto potencial de incidentes em {selectedAction.setor?.toLowerCase()} relacionados aos riscos: {(selectedAction as any).riscosNomes?.join(', ') || selectedAction.tipoDeRisco || 'N/A'}. Requer acompanhamento de fatores agravantes para manter compliance. 
                      </p>
                   </div>

                   {(selectedAction.regraFixa !== undefined || selectedAction.nrRelacionada || selectedAction.nr) && (
                     <div className="bg-[var(--bg-card)]/50 p-4 rounded-xl border border-[var(--border)] space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                           <FileText className="w-4 h-4 text-purple-400" />
                           <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Base Normativa Aplicada</h4>
                        </div>
                        <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
                           {(selectedAction.nrRelacionada || selectedAction.nr) && <p><span className="font-bold text-[var(--text-muted)]">NR Relacionada:</span> {selectedAction.nrRelacionada || selectedAction.nr}</p>}
                           {selectedAction.regraTitulo && <p><span className="font-bold text-[var(--text-muted)]">Regra:</span> {selectedAction.regraTitulo}</p>}
                           {selectedAction.regraId && <p><span className="font-bold text-[var(--text-muted)]">Regra ID:</span> {selectedAction.regraId}</p>}
                           
                           {selectedAction.regraFixa === true ? (
                              <p><span className="font-bold text-[var(--text-muted)]">Regra Fixa:</span> Sim</p>
                           ) : selectedAction.regraFixa === false ? (
                              <p><span className="font-bold text-[var(--text-muted)]">Regra Fixa:</span> Não</p>
                           ) : (
                              <p><span className="font-bold text-[var(--text-muted)]">Regra Fixa:</span> Regra normativa não vinculada</p>
                           )}

                           {selectedAction.perguntaOrigem && <p><span className="font-bold text-[var(--text-muted)]">Pergunta:</span> {selectedAction.perguntaOrigem}</p>}
                           {selectedAction.respostaOrigem && <p><span className="font-bold text-[var(--text-muted)]">Resposta:</span> {selectedAction.respostaOrigem}</p>}
                           {(selectedAction.inspection_name || selectedAction.checklistId) && (
                              <p><span className="font-bold text-[var(--text-muted)]">Origem:</span> {selectedAction.inspection_id ? `Inspeção #${selectedAction.inspection_id.substring(0,6).toUpperCase()}` : 'Inspeção'} / {selectedAction.inspection_name || selectedAction.checklistId}</p>
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

               <div className="grid grid-cols-2 gap-6 bg-[var(--bg-primary)] p-4 border border-[var(--border)] rounded-xl">
                 <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Chance de incidente</h4>
                    <p className={`text-base font-bold ${((selectedAction.chanceIncidente || 0) >= 60 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 60)) ? 'text-red-500' : ((selectedAction.chanceIncidente || 0) >= 35 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 35)) ? 'text-orange-500' : 'text-emerald-500'}`}>
                       {((selectedAction.chanceIncidente || 0) >= 60 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 60)) ? 'Alta' : ((selectedAction.chanceIncidente || 0) >= 35 || ((selectedAction as any).chanceSum > 0 && Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) >= 35)) ? 'Média' : 'Baixa'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Estimativa: {(selectedAction as any).chanceSum > 0 ? Math.round((selectedAction as any).chanceSum / Math.max(1, (selectedAction as any).count || 1)) : (selectedAction.chanceIncidente || 0)}%</p>
                 </div>
                 <div className="pl-6 border-l border-[var(--border)]">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Multa estimada</h4>
                    <p className="text-base font-bold text-[var(--text-primary)] font-mono">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format((selectedAction as any).multaTotal || selectedAction.multaEstimada || 0)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Potencial</p>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border)] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                     </div>
                     <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] leading-none mb-1">Checklist vinculado</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">Checklist {(selectedAction.atividade as string).split(' ')[0]}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 w-[100px]">
                     <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/80 rounded-full" style={{width: '70%'}}></div>
                     </div>
                     <span className="text-[11px] font-mono text-[var(--text-muted)]">70%</span>
                  </div>
               </div>

               <div className="flex items-start justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                  <div className="flex items-start gap-4">
                     <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mt-0.5 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                     </div>
                     <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">EPI/EPC ausente</h4>
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug">
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

               <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border)] transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                     </div>
                     <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] leading-none mb-1">Ação recomendada</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">{(selectedAction as any).acaoRecomendada || `Revisar processos de ${(selectedAction.atividade as string).toLowerCase()}.`}</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-emerald-600 dark:text-emerald-400 transition-colors shrink-0" />
               </div>

               <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border)] transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] flex items-center justify-center text-xs font-bold border border-[var(--border)] uppercase shrink-0">
                        {selectedAction.responsavel ? selectedAction.responsavel.substring(0, 2) : 'JS'}
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Responsável</h4>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{selectedAction.responsavel || 'João Silva'}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Técnico de Segurança</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
               </div>
               </>
               )}

             </div>

             <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-primary)] space-y-3">
               {activeTab !== 'Histórico' && (
                 <button className="w-full bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] py-3 rounded-lg text-sm font-bold shadow-[var(--shadow-glow)] transition-colors flex justify-center items-center gap-2 border border-purple-500/30">
                   Marcar como tratado <CheckCircle2 className="w-4 h-4 ml-1" />
                 </button>
               )}
               <button onClick={() => setIsDrawerActionOpen(false)} className={`w-full py-3 rounded-lg ${activeTab === 'Histórico' ? 'bg-[var(--bg-active-group)] hover:bg-[var(--bg-active-group)] text-[var(--text-primary)] text-sm' : 'text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]'} font-bold transition-colors border border-transparent`}>
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
              className="fixed inset-0 bg-[var(--bg-primary)] z-40 lg:hidden"
              onClick={() => setSelectedSectorItem(null)}
            />
           <motion.div 
           initial={{ opacity: 0, x: '100%' }} 
           animate={{ opacity: 1, x: 0 }} 
           exit={{ opacity: 0, x: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-y-0 right-0 w-full sm:w-[400px] h-full bg-[var(--bg-card)] border-l border-[var(--border)] shadow-3xl z-50 flex flex-col overflow-hidden"
         >
           <div className="h-full flex flex-col pt-safe-top overflow-y-auto">
             <div className="p-6 flex justify-between items-start border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">Detalhes do setor</h3>
                <button onClick={() => setSelectedSectorItem(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-[var(--bg-active-group)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               <div className="flex items-start justify-between border-b border-[var(--border)] pb-4 mb-4">
                 <span className="text-sm font-bold text-purple-400">SETOR-{selectedSectorItem.setor.substring(0,3).toUpperCase()}</span>
                 <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border bg-opacity-10 
                      ${selectedSectorItem.crits > 0 ? 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-400' : 
                        selectedSectorItem.altos > 0 ? 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-400' : 
                        selectedSectorItem.medios > 0 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-400' : 
                        'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-400'}`}>
                   {selectedSectorItem.crits > 0 ? 'Crítico' : selectedSectorItem.altos > 0 ? 'Alto' : selectedSectorItem.medios > 0 ? 'Médio' : 'Baixo'}
                 </span>
               </div>

               <div className="flex items-start gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--bg-card)] text-blue-600 dark:text-blue-400">
                   {getActivityIcon(selectedSectorItem.setor)}
                 </div>
                 <div className="flex flex-col gap-1">
                   <h2 className="text-lg font-bold text-[var(--text-primary)] leading-none">{selectedSectorItem.setor}</h2>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-muted)] font-medium">{selectedSectorItem.nrs[0] || 'NR-Geral'}</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                      <span className="text-xs text-[var(--text-muted)]">{selectedSectorItem.count} riscos mapeados</span>
                   </div>
                 </div>
               </div>

               <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-2">Visão geral do setor</h4>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                     {selectedSectorItem.crits > 0 ? 'Setor com maior concentração de riscos críticos.' : 'Setor estável, focar em prevenções rotineiras.'} Processos com exposição aos riscos: {selectedSectorItem.riscosNames.slice(0, 3).join(', ')}.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-6 bg-[var(--bg-primary)] p-4 border border-[var(--border)] rounded-xl">
                 <div>
                    <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Chance Incidente</h4>
                    <p className={`text-base font-bold ${
                      (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 60 ? 'text-red-500' : 
                      (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 35 ? 'text-orange-500' : 'text-emerald-500'
                    }`}>
                       {(selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 60 ? 'Alta' : (selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count)) >= 35 ? 'Média' : 'Baixa'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Estimativa: {Math.round(selectedSectorItem.chanceSum / Math.max(1, selectedSectorItem.count))}%</p>
                 </div>
                 <div className="pl-6 border-l border-[var(--border)]">
                    <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Multa estimada</h4>
                    <p className="text-base font-bold text-[var(--text-primary)] font-mono">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(selectedSectorItem.multaTotal)}
                    </p>
                 </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-bold text-[var(--text-primary)] mb-2">Riscos mais recorrentes</h4>
                  <ul className="space-y-2">
                     {selectedSectorItem.riscosNames.slice(0, 4).map((r: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span> <span className="truncate">{r}</span>
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-bold text-[var(--text-primary)] mb-2">NR dominante</h4>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        {selectedSectorItem.nrs[0] || 'NR-Geral'}
                     </span>
                     <span className="text-[12px] text-[var(--text-muted)] truncate">Avaliada com base nos riscos</span>
                  </div>
               </div>

               <div className="flex flex-col gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl border-l-2 border-l-purple-500">
                  <h4 className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
                     <Zap className="w-3.5 h-3.5"/> Ação sugerida
                  </h4>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                     Priorizar adequações nas frentes de trabalho relacionadas aos principais riscos detectados no setor de {selectedSectorItem.setor.toLowerCase()} e intensificar inspeções de rotina.
                  </p>
               </div>

               <div className="flex items-center gap-4 py-4 border-t border-[var(--border)] group pt-6">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] flex items-center justify-center text-sm font-bold border border-[var(--border)] uppercase shrink-0">
                     <UserPlus className="w-4 h-4 text-purple-400"/>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Responsável</h4>
                     <p className="text-sm font-bold text-[var(--text-primary)]">Carlos Eduardo Silva</p>
                     <p className="text-[11px] text-[var(--text-muted)]">Gerente de {selectedSectorItem.setor}</p>
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
            className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-primary)] rounded-t-2xl shrink-0">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {editingItem ? `Avaliar Condição Existente` : `Registro de Risco`}
                </h2>
                <div className="flex items-center gap-2">
                  {editingItem && (
                    <button 
                      onClick={(e) => handleDelete(editingItem.id, e)} 
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-active-group)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                <div className="space-y-4 border-b border-[var(--border)] pb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                        Prioridade Manual (Opcional)
                      </label>
                      <select 
                        value={formData.prioridade || ''} 
                        onChange={e => setFormData({...formData, prioridade: e.target.value as any})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                      >
                        <option value="">Automático</option>
                        <option value="P1">P1 - Crítico</option>
                        <option value="P2">P2 - Alto</option>
                        <option value="P3">P3 - Médio</option>
                        <option value="P4">P4 - Baixo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                        Prazo Máximo (Opcional)
                      </label>
                      <input 
                        type="text" 
                        value={formData.prazo || ''} 
                        onChange={e => setFormData({...formData, prazo: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-colors placeholder:text-[var(--text-secondary)]"
                        placeholder="Ex: Imediato"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Atividade Operacional
                    </label>
                    <select 
                      value={formData.atividade} 
                      onChange={e => setFormData({...formData, atividade: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-colors appearance-none mb-3"
                    >
                      {ATIVIDADES_OPCOES.map(opt => <option key={opt} value={opt} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{opt}</option>)}
                    </select>

                    {normativeDetection && (
                      <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl space-y-3">
                         <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                           <Shield className="w-4 h-4" /> {normativeDetection.nr} - {normativeDetection.riskType}
                         </h4>
                         <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border)]">
                             <span className="text-[var(--text-muted)] block mb-0.5">Severidade</span>
                             <span className={`font-bold uppercase ${normativeDetection.severity === 'crítica' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                               {normativeDetection.severity}
                             </span>
                           </div>
                           <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border)]">
                             <span className="text-[var(--text-muted)] block mb-0.5">Ação Inicial Recomendada</span>
                             <span className="text-[var(--text-secondary)] font-medium leading-tight">
                               {normativeDetection.recommendedAction}
                             </span>
                           </div>
                         </div>
                         
                         {normativeDetection.documents.length > 0 && (
                           <div>
                             <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Documentos Exigidos</span>
                             <div className="flex flex-wrap gap-1.5">
                               {normativeDetection.documents.map((doc: string) => (
                                 <span key={doc} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-active-group)] border border-[var(--border)] text-[var(--text-secondary)]">{doc}</span>
                               ))}
                             </div>
                           </div>
                         )}

                         {normativeDetection.ppe.length > 0 && (
                           <div>
                             <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">EPI / EPC Mínimos</span>
                             <div className="flex flex-wrap gap-1.5">
                               {normativeDetection.ppe.map((epi: string) => (
                                 <span key={epi} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-active-group)] border border-[var(--border)] text-[var(--text-secondary)]">{epi}</span>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Área / Setor
                    </label>
                    <select 
                      value={formData.setor} 
                      onChange={e => setFormData({...formData, setor: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      {SETORES_OPCOES.map(opt => <option key={opt} value={opt} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                       Checklist de Conformidade Base
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight">Marque as opções em que o cenário está 100% conforme. Ausências gerarão gatilhos de Criticidade Alta/Extrema baseado na matriz de risco NR.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-4 p-4 bg-[var(--bg-active-group)] border border-[var(--border)] hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasEpiEpc} 
                          onChange={e => setFormData({...formData, hasEpiEpc: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[var(--bg-primary)] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] mb-1">EPI / EPC (Equipamentos)</span>
                         <span className="block text-[11px] text-[var(--text-muted)] leading-snug">O colaborador utiliza os equipamentos obrigatórios corretos para a tarefa (Cinto, ferramentas, proteções ativas)?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 bg-[var(--bg-active-group)] border border-[var(--border)] hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasProcedimento} 
                          onChange={e => setFormData({...formData, hasProcedimento: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[var(--bg-primary)] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] mb-1">Procedimento Operacional / PT</span>
                         <span className="block text-[11px] text-[var(--text-muted)] leading-snug">Existe Permissão de Trabalho (PT), Análise de Risco (APR) preenchida ou protocolo LOTO ativo e seguido?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 bg-[var(--bg-active-group)] border border-[var(--border)] hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.hasTreinamento} 
                          onChange={e => setFormData({...formData, hasTreinamento: e.target.checked})} 
                          className="w-4 h-4 rounded border-gray-600 bg-[var(--bg-primary)] checked:bg-purple-500 checked:border-purple-500"
                        />
                      </div>
                      <div>
                         <span className="block text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] mb-1">Capacitação Normativa (NR)</span>
                         <span className="block text-[11px] text-[var(--text-muted)] leading-snug">O colaborador possui treinamento válido exigido para este maquinário ou risco (ex: NR-35, NR-10)?</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[var(--bg-card)] to-purple-900/10 border border-purple-500/20 p-5 rounded-xl flex items-start gap-3">
                  <Settings2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">Cálculo de Tipo / Severidade Automático</h4>
                    <p className="text-[11px] text-purple-200/60 leading-relaxed">
                      De acordo com o tipo de risco (Físico, Químico, etc.) e as opções acima, a prioridade será designada automaticamente para garantir agilidade na ação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-primary)] flex gap-3 rounded-b-2xl shrink-0">
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] hover:bg-[var(--bg-active-group)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)] uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveForm} 
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-[11px] font-bold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/50 uppercase tracking-wider"
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
              className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div>
                     <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Detalhamento do Cálculo</h2>
                     <p className="text-[11px] text-[var(--text-muted)]">Risco: {selectedAction.titulo || selectedAction.atividade}</p>
                   </div>
                 </div>
                 <button onClick={() => setShowCalculationModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-active-group)] transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="overflow-y-auto p-5 space-y-6">
                 
                 {/* Card 1 */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                       <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-3 flex items-center gap-2">
                         <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Variáveis Base
                       </h4>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Severidade Padrão</span>
                             <span className="font-bold text-[var(--text-primary)]">{selectedAction.severidade || selectedAction.gravidade}</span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Prioridade Final</span>
                             <span className="font-bold text-[var(--text-primary)]">{selectedAction.prioridade}</span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">NR Relacionada</span>
                             <span className="font-bold text-blue-600 dark:text-blue-400">{selectedAction.nr}</span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Prazo Automático</span>
                             <span className="font-bold text-orange-600 dark:text-orange-400">{selectedAction.prazo}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                       <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-3 flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Resultados do Motor
                       </h4>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Impacto Operacional</span>
                             <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase
                                ${selectedAction.impactoOperacional === 'Crítico' ? 'bg-red-500/20 text-red-500 dark:text-red-600 dark:text-red-400' : 
                                  selectedAction.impactoOperacional === 'Alto' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                                  selectedAction.impactoOperacional === 'Médio' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400'
                                }`}>{selectedAction.impactoOperacional}</span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Multa Estimada</span>
                             <span className="font-bold text-red-600 dark:text-red-400 hover:underline cursor-help" title={selectedAction.faixaMulta}>
                               {selectedAction.multaEstimada !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAction.multaEstimada) : 'N/D'}
                             </span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Chance de Incidente</span>
                             <span className="font-bold text-orange-600 dark:text-orange-400">{selectedAction.chanceIncidente}%</span>
                          </div>
                          <div className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded text-xs">
                             <span className="text-[var(--text-muted)]">Conformidade</span>
                             <span className={`font-bold ${
                                selectedAction.nivelConformidade === 'Conforme' ? 'text-emerald-600 dark:text-emerald-400' :
                                selectedAction.nivelConformidade === 'Atenção' ? 'text-yellow-400' :
                                selectedAction.nivelConformidade === 'Não conforme crítico' ? 'text-red-600 dark:text-red-400' :
                                'text-orange-600 dark:text-orange-400'
                             }`}>{selectedAction.nivelConformidade}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Justifications */}
                 <div className="space-y-3">
                    <h4 className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Justificativas</h4>
                    
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                         <span className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Multa Investigada:</span>
                         “{selectedAction.justificativaMulta || 'Cálculo com base em tabela NR.'}”
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                         <span className="text-orange-600 dark:text-orange-400 font-bold block mb-1">Chance de Incidente:</span>
                         “{selectedAction.justificativaIncidente || 'Variáveis base da matriz.'}”
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                         <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Origem do Dado:</span>
                         “{selectedAction.justificativa || 'Lançado pela inspeção.'}”
                      </div>
                    </div>
                 </div>

                 {/* Fatores Considered */}
                 {selectedAction.fatoresDeCalculo && selectedAction.fatoresDeCalculo.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Fatores Analisados (Agravantes/Mitigantes)</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAction.fatoresDeCalculo.map((f, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded text-[10px] text-[var(--text-secondary)]">
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
