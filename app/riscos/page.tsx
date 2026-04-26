"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { NormativeEngine, RiskEngine, EconomicImpactEngine } from '@/lib/engines';
import { 
  Plus, Search, AlertTriangle, X, ChevronRight,
  Shield, Activity, Settings, Settings2, Clock, CheckCircle2,
  FileText, UserPlus, PlayCircle, ShieldAlert,
  TrendingUp, Users, BarChart2, Trash2
} from 'lucide-react';

type NivelRisco = 'Crítico' | 'Alto' | 'Médio' | 'Baixo';

type RiskInstance = {
  id: string;
  atividade: string;
  setor: string;
  nr: string;
  
  tipoDeRisco: string;
  gravidade: string;
  probabilidade: string;

  hasEpiEpc: boolean;
  hasTreinamento: boolean;
  hasProcedimento: boolean;
  
  // Computed fields
  nivel: NivelRisco;
  prioridade: 'P1' | 'P2' | 'P3' | 'P4';
  problemaPrincipal?: string;
  acaoRecomendada?: string;
  prazo?: string;
  responsavel?: string;
  status?: 'Pendente' | 'Em análise' | 'A tratar' | 'Monitorando';
};

const ATIVIDADES_OPCOES = [
  'Trabalho em altura',
  'Manutenção elétrica',
  'Operação de máquinas',
  'Espaço confinado',
  'Trabalho a quente',
  'Movimentação de cargas',
  'Outras atividades'
];

function applyNRLules(payload: Partial<RiskInstance>): RiskInstance {
  const { atividade, hasEpiEpc, hasTreinamento, hasProcedimento } = payload;
  const norm = NormativeEngine.detect(atividade || '');
  
  let tipoDeRisco = 'Geral / Acidente';
  let gravidade = 'Moderada';
  let probabilidade = 'Baixa';
  let nivel: NivelRisco = 'Baixo';
  let prioridade: 'P1' | 'P2' | 'P3' | 'P4' = 'P4';
  let problemaPrincipal = 'Conformidade adequada';
  let acaoRecomendada = 'Manter monitoramento de rotina';
  let responsavel = 'Líder da área';
  let prazo = 'Rotina diária';
  let nr = 'NR-XX';

  if (norm) {
    nr = norm.nr;
    tipoDeRisco = norm.riskType;
    gravidade = norm.severity === 'crítica' ? 'Fatal/Grave' : norm.severity === 'alta' ? 'Grave' : 'Moderada';
    
    let nonConformities = 0;
    if (!hasEpiEpc) nonConformities++;
    if (!hasTreinamento) nonConformities++;
    if (!hasProcedimento) nonConformities++;

    let isCritical = false;
    let isHigh = false;

    if (!hasEpiEpc || !hasProcedimento) {
      isCritical = norm.severity === 'crítica' || norm.severity === 'alta';
      if (!isCritical) isHigh = true;
    } else if (!hasTreinamento) {
      isHigh = true;
    }

    if (isCritical) {
      probabilidade = 'Alta';
      problemaPrincipal = `Falta de ${!hasEpiEpc ? 'EPIs/EPCs' : ''} ${!hasEpiEpc && !hasProcedimento ? 'e' : ''} ${!hasProcedimento ? 'Procedimento/PT' : ''}`;
      acaoRecomendada = norm.recommendedAction;
      responsavel = 'Supervisor + SST';
      prazo = 'Hoje (Imediato)';
    } else if (isHigh) {
      probabilidade = 'Média';
      problemaPrincipal = `Pendência de ${!hasTreinamento ? 'Treinamento' : 'EPI/Procedimento'}`;
      acaoRecomendada = norm.recommendedAction;
      responsavel = 'RH + SST';
      prazo = '24h';
    } else {
      probabilidade = 'Baixa';
    }

    const calculatedRiskScore = RiskEngine.calculateRisk({
      severity: norm.severity,
      exposedPeople: 2, // valor padrao mockado
      overdueInspections: 0,
      overdueActions: 0,
      nonConformities: nonConformities,
      recurrence: false,
      criticalActivity: norm.severity === 'crítica' || norm.severity === 'alta'
    });

    const calculatedLevel = RiskEngine.getRiskLevel(calculatedRiskScore);
    switch (calculatedLevel) {
      case 'crítico': nivel = 'Crítico'; prioridade = 'P1'; break;
      case 'alto': nivel = 'Alto'; prioridade = 'P2'; break;
      case 'médio': nivel = 'Médio'; prioridade = 'P3'; break;
      case 'baixo': nivel = 'Baixo'; prioridade = 'P4'; break;
    }
  }

  return {
    ...payload,
    id: payload.id || Math.random().toString(36).substr(2, 9),
    atividade: payload.atividade!,
    setor: payload.setor!,
    nr: payload.nr || nr,
    hasEpiEpc: payload.hasEpiEpc!,
    hasTreinamento: payload.hasTreinamento!,
    hasProcedimento: payload.hasProcedimento!,
    status: payload.status || 'Pendente',
    tipoDeRisco,
    gravidade,
    probabilidade,
    problemaPrincipal,
    acaoRecomendada,
    responsavel,
    prazo: payload.prazo || prazo,
    nivel,
    prioridade: payload.prioridade || prioridade
  };
}

const dbMock: RiskInstance[] = [
  applyNRLules({ id: 'r1', atividade: 'Trabalho em altura', setor: 'Operacional', nr: 'NR-35', hasEpiEpc: false, hasProcedimento: false, hasTreinamento: true, status: 'Pendente' }),
  applyNRLules({ id: 'r2', atividade: 'Manutenção elétrica', setor: 'Manutenção', nr: 'NR-10', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Em análise' }),
  applyNRLules({ id: 'r3', atividade: 'Operação de máquinas', setor: 'Produção', nr: 'NR-12', hasEpiEpc: false, hasProcedimento: true, hasTreinamento: true, status: 'Pendente' }),
  applyNRLules({ id: 'r4', atividade: 'Trabalho em altura', setor: 'Logística', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Pendente' }),
  applyNRLules({ id: 'r5', atividade: 'Espaço confinado', setor: 'Manutenção', nr: 'NR-33', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: false, status: 'A tratar' }), // Critico
  applyNRLules({ id: 'r6', atividade: 'Movimentação de cargas', setor: 'Logística', nr: 'NR-11', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'A tratar' }), // Alto 
  applyNRLules({ id: 'r7', atividade: 'Trabalho a quente', setor: 'Manutenção', nr: 'NR-34', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Monitorando' }), // Medio
  applyNRLules({ id: 'r8', atividade: 'Trabalho em altura', setor: 'Administrativo', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: true, hasTreinamento: true, status: 'Monitorando' }), // Baixo
];

const TABS: ('Todos' | NivelRisco)[] = ['Todos', 'Crítico', 'Alto', 'Médio', 'Baixo'];

export default function RiscosPage() {
  const { sectors } = useAppStore();
  const SETORES_OPCOES = sectors.map(s => s.name);

  const [activeTab, setActiveTab] = useState<'Todos' | NivelRisco>('Todos');
  const [data, setData] = useState<RiskInstance[]>(dbMock);
  
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
    status: 'Pendente'
  });
  
  const [selectedAction, setSelectedAction] = useState<RiskInstance | null>(null);

  const normativeDetection = useMemo(() => NormativeEngine.detect(formData.atividade || ''), [formData.atividade]);

  const getNivelColor = (nivel?: NivelRisco) => {
    switch(nivel) {
      case 'Crítico': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Alto': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Pendente': return 'text-red-400 border-red-500/20';
      case 'Em análise': return 'text-orange-400 border-orange-500/20';
      case 'A tratar': return 'text-yellow-400 border-yellow-500/20';
      case 'Monitorando': return 'text-emerald-400 border-emerald-500/20';
      default: return 'text-gray-400 border-gray-500/20';
    }
  };

  const getActivityIcon = (atividade: string) => {
    switch(atividade) {
      case 'Trabalho em altura': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'Manutenção elétrica': return <Settings2 className="w-4 h-4 text-blue-400" />;
      case 'Operação de máquinas': return <Settings className="w-4 h-4 text-orange-400" />;
      case 'Espaço confinado': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'Movimentação de cargas': return <Shield className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setData(prev => prev.filter(r => r.id !== id));
    setIsDrawerOpen(false);
  };

  const handleSaveForm = () => {
    const evaluated = applyNRLules(formData);
    if (editingItem) {
      setData(prev => prev.map(r => r.id === editingItem.id ? evaluated : r));
    } else {
      setData(prev => [evaluated, ...prev]);
    }
    setIsDrawerOpen(false);
  };

  // Views Data Prep
  const filteredData = useMemo(() => {
    let result = data;
    if (activeTab !== 'Todos') {
      result = data.filter(d => d.nivel === activeTab);
    }
    return result.sort((a,b) => a.prioridade > b.prioridade ? 1 : -1);
  }, [data, activeTab]);
  
  const criticosCount = data.filter(d => d.nivel === 'Crítico').length;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0b0f19]">
      <motion.div layout className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 shrink-0">
            <div className="bg-[#121826] p-1.5 rounded-xl border border-white/10 flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab === 'Crítico' && <AlertTriangle className={`w-4 h-4 ${activeTab === tab ? 'text-red-400' : 'text-gray-500'}`} />}
                  {tab === 'Todos' ? tab : `Nível: ${tab}`}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
               <button onClick={() => {
                 setFormData({ atividade: 'Trabalho em altura', setor: 'Produção', hasEpiEpc: false, hasProcedimento: false, hasTreinamento: false });
                 setEditingItem(null);
                 setIsDrawerOpen(true);
               }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-500/50">
                <Plus className="w-4 h-4" />
                Registrar Risco
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 mt-2 shrink-0">
               <div>
                 <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                    {activeTab === 'Todos' ? 'Mapeamento Geral de Riscos' : `Riscos nível: ${activeTab}`}
                 </h2>
                 <p className="text-xs text-gray-400 mt-1">
                    {activeTab === 'Crítico' && "Ação imediata requerida. Bloqueio de atividade recomendado."}
                    {activeTab === 'Alto' && "Tratar em até 24h. Risco iminente de acidente grave."}
                    {activeTab === 'Médio' && "Acompanhar e corrigir processos ou infraestrutura a médio prazo."}
                    {activeTab === 'Baixo' && "Monitoramento contínuo de rotina. Baixa probabilidade."}
                    {activeTab === 'Todos' && "Identificação, classificação e priorização de todos os riscos da operação."}
                 </p>
               </div>
               <div className="flex items-center gap-3">
                 <button className="flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-[#121826] hover:bg-white/5 border border-white/10 transition-colors">
                   <BarChart2 className="w-4 h-4" /> Filtros
                 </button>
                 <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors">
                   Exportar
                 </button>
               </div>
            </div>

            {/* Dashboard Cards for Overview */}
            {(activeTab === 'Todos' || activeTab === 'Crítico') && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                {/* Card 1 */}
                <div className="bg-[#1e1a30] p-5 rounded-xl border border-red-500/20 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-red-500/5 opacity-50"></div>
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4 text-red-500">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ação Imediata
                        </span>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2 flex items-baseline gap-2">
                        {criticosCount} <span className="text-[11px] font-medium text-red-400 tracking-wide uppercase">riscos críticos</span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-red-500" /> 3 novos hoje
                      </div>
                   </div>
                </div>

                <div className="bg-[#121826] p-5 rounded-xl border border-orange-500/30 relative">
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4 text-orange-400">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" /> Prioridade do dia
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white mb-2 leading-tight">
                        Trabalho em altura
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Maior risco legal e operacional
                      </div>
                   </div>
                </div>

                <div className="bg-[#1e1a30]/60 p-5 rounded-xl border border-purple-500/30 relative">
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4 text-purple-400">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                          <Users className="w-3.5 h-3.5" /> Responsável sugerido
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white mb-2 leading-tight">
                        SST + Supervisor da área
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Aguardando validação
                      </div>
                   </div>
                </div>

                <div className="bg-[#0f1715] p-5 rounded-xl border border-emerald-500/30 relative">
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4 text-emerald-400">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" /> Prazo recomendado
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white mb-2">
                        Hoje até 17h
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Bloquear atividade até correção
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Plano de Ação Table */}
            <div className="bg-[#121826] border border-white/5 rounded-xl shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-0 border-b border-white/5 hidden md:block"></div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#0b0f19] sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Nível (Agir)</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Atividade / Setor</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Tipo de Risco / Gravidade / Probabilidade</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Responsável / Status</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Prazo</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentItems.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                            Nenhum risco encontrado neste filtro.
                         </td>
                       </tr>
                    ) : currentItems.map((item) => (
                      <tr key={item.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedAction?.id === item.id ? 'bg-purple-900/10' : ''}`} onClick={() => { setSelectedAction(item); setIsDrawerActionOpen(true); }}>
                        <td className="px-5 py-4 align-top w-[120px]">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border tracking-wider ${getNivelColor(item.nivel)}`}>
                            {item.nivel}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top w-[250px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="text-gray-400 shrink-0">
                                {getActivityIcon(item.atividade)}
                              </div>
                              <span className="text-[13px] font-bold text-gray-200 leading-tight">{item.atividade}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-6">
                              <span className="text-[11px] text-gray-500 uppercase font-medium">{item.setor}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span className="text-[11px] text-purple-400/80 font-medium">{item.nr}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-bold text-gray-300">{item.tipoDeRisco}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-gray-400">Gravidade: <strong className="text-gray-300 font-medium">{item.gravidade}</strong></span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span className="text-[11px] text-gray-400">Probabilidade: <strong className="text-gray-300 font-medium">{item.probabilidade}</strong></span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top w-[200px]">
                          <div className="flex flex-col gap-2">
                             <span className="text-[12px] font-medium text-gray-300 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-500" /> {item.responsavel}</span>
                             <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold border bg-[#121826] w-fit ${getStatusColor(item.status)}`}>
                               {item.status}
                             </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top w-[140px]">
                          <span className={`text-[12px] font-bold flex items-center gap-1.5 ${item.prazo?.includes('Hoje') || item.prazo?.includes('Imediato') ? 'text-red-400' : (item.prazo?.includes('24h') ? 'text-orange-400' : 'text-gray-400')}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {item.prazo}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-2 text-gray-400 hover:text-purple-400 transition-colors bg-[#0b0f19] border border-white/10 rounded-lg hover:border-purple-500/30" title="Gerar Ação">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setFormData(item); setEditingItem(item); setIsDrawerOpen(true); }} className="p-2 text-gray-400 hover:text-white transition-colors bg-[#0b0f19] border border-white/10 rounded-lg hover:border-white/30" title="Editar">
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 bg-[#121826]">
                 <span>Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros</span>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <button 
                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                         disabled={currentPage === 1}
                         className="px-2 py-1 rounded bg-[#0b0f19] border border-white/5 hover:text-white transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                       <button className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30">{currentPage}</button>
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
                         className="bg-[#0b0f19] border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500">
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1e1a30] flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                       Atuar no risco ({selectedAction.nivel})
                    </h3>
                    <h2 className="text-base font-bold text-white leading-snug">{selectedAction.atividade}</h2>
                  </div>
                </div>
                <button onClick={() => setIsDrawerActionOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               
               <div className={`bg-[#121826] rounded-xl overflow-hidden relative border ${selectedAction.nivel === 'Crítico' ? 'border-red-500/20' : (selectedAction.nivel === 'Alto' ? 'border-orange-500/20' : 'border-purple-500/20')}`}>
                 {(selectedAction.nivel === 'Crítico' || selectedAction.nivel === 'Alto') && (
                   <div className={`absolute inset-0 opacity-20 ${selectedAction.nivel === 'Crítico' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                 )}
                 <div className="relative z-10 p-5">
                   <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${selectedAction.nivel === 'Crítico' ? 'text-red-400' : (selectedAction.nivel === 'Alto' ? 'text-orange-400' : 'text-purple-400')}`}>
                     <AlertTriangle className="w-3.5 h-3.5" /> Foco da ação
                   </h4>
                   <ul className="space-y-3 text-xs text-gray-300">
                     <li className="flex gap-2.5 items-start">
                       <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${selectedAction.nivel === 'Crítico' ? 'bg-red-400' : 'bg-purple-400'}`}></span> 
                       <span className="leading-relaxed">Problema principal: <span className="font-bold text-white block mt-1">{selectedAction.problemaPrincipal}</span></span>
                     </li>
                     <li className="flex gap-2.5 items-start">
                       <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${selectedAction.nivel === 'Crítico' ? 'bg-red-400' : 'bg-purple-400'}`}></span> 
                       <span className="leading-relaxed">Ação recomendada: <span className="font-bold text-white block mt-1">{selectedAction.acaoRecomendada}</span></span>
                     </li>
                   </ul>
                 </div>
               </div>

               {/* Gerar ação blocks as requested */}
               <div className="space-y-3">
                 <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Ações disponíveis</h4>
                 
                 <button className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-[#0b0f19] hover:bg-white/5 hover:border-purple-500/30 transition-all group">
                   <div className="bg-[#121826] p-2 rounded border border-white/10 group-hover:border-purple-500/30">
                     <CheckCircle2 className="w-4 h-4 text-purple-400" />
                   </div>
                   <div>
                     <span className="block text-xs font-bold text-gray-200 group-hover:text-white">Gerar Plano de Ação</span>
                     <span className="block text-[10px] text-gray-500">Abre formulário para designar tarefas e equipe</span>
                   </div>
                 </button>

                 <button className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-[#0b0f19] hover:bg-white/5 hover:border-purple-500/30 transition-all group">
                   <div className="bg-[#121826] p-2 rounded border border-white/10 group-hover:border-purple-500/30">
                     <ShieldAlert className="w-4 h-4 text-emerald-400" />
                   </div>
                   <div>
                     <span className="block text-xs font-bold text-gray-200 group-hover:text-white">Agendar Inspeção</span>
                     <span className="block text-[10px] text-gray-500">Gera checklist automático para verificação no local</span>
                   </div>
                 </button>

                 <button className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-[#0b0f19] hover:bg-white/5 hover:border-purple-500/30 transition-all group">
                   <div className="bg-[#121826] p-2 rounded border border-white/10 group-hover:border-purple-500/30">
                     <AlertTriangle className="w-4 h-4 text-orange-400" />
                   </div>
                   <div>
                     <span className="block text-xs font-bold text-gray-200 group-hover:text-white">Emitir Alerta</span>
                     <span className="block text-[10px] text-gray-500">Notifica responsáveis via e-mail e push applet</span>
                   </div>
                 </button>
               </div>

               <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5">
                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <UserPlus className="w-3.5 h-3.5" /> Responsável Designado
                 </h4>
                 <div className="flex justify-between items-center bg-[#121826] p-3 rounded-lg border border-white/5">
                    <span className="text-sm text-white font-bold">{selectedAction.responsavel}</span>
                    <span className="text-[9px] bg-purple-600/10 text-purple-400 px-2 py-1 rounded font-bold uppercase tracking-wider border border-purple-500/20">{selectedAction.status}</span>
                 </div>
               </div>

               <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden">
                 {selectedAction.nivel === 'Crítico' && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
                 )}
                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> Prazo Máximo Exigido
                 </h4>
                 <div className={`${selectedAction.nivel === 'Crítico' ? 'text-red-400' : 'text-orange-400'} font-bold text-lg mb-2 relative z-10`}>{selectedAction.prazo}</div>
                 <div className="text-[11px] text-gray-400 leading-snug relative z-10">Prazo estipulado com base na gravidade do risco avaliado.</div>
                 
                 {(selectedAction.nivel === 'Crítico' || selectedAction.nivel === 'Alto') && (() => {
                    const estimate = EconomicImpactEngine.estimate({ 
                      severityLevel: selectedAction.nivel.toLowerCase() as 'alto' | 'crítico', 
                      exposedPeople: 2, 
                      recurrence: false 
                    });
                    return (
                      <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Impacto Reversível / Economia Estimada
                        </h4>
                        <div className="text-red-400 font-bold text-sm mb-1">
                          {EconomicImpactEngine.formatCurrency(estimate.min)} a {EconomicImpactEngine.formatCurrency(estimate.max)}
                        </div>
                        <div className="text-[9px] text-gray-500 italic">
                          Estimativa preventiva. O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento.
                        </div>
                      </div>
                    );
                 })()}
               </div>

             </div>

             <div className="p-6 border-t border-white/5 bg-[#0b0f19] space-y-3">
               <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors flex justify-center items-center gap-2 border border-purple-500/30">
                 Marcar como tratado <CheckCircle2 className="w-4 h-4 ml-1" />
               </button>
               <button onClick={() => setIsDrawerActionOpen(false)} className="w-full py-3 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors border border-transparent">
                 Fechar painel
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

    </div>
  );
}
