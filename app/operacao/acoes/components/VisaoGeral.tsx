"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ActionItem } from '../types';
import { Clock, Play, CheckCircle2, AlertTriangle, Eye, ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS: Record<string, string> = {
  Pendente: '#f97316',
  'Em andamento': '#3b82f6',
  Vencida: '#ef4444',
  'Concluída': '#10b981',
  'Cancelada': '#9ca3af',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Crítica': '#ef4444',
  'Alta': '#f97316',
  'Média': '#eab308',
  'Baixa': '#22c55e',
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(n => n.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function getPrazoDetails(prazoStr: string, status: string) {
  if (!prazoStr || typeof prazoStr !== 'string') return { subtext: '', color: 'text-[var(--text-muted)]' };
  
  const parts = prazoStr.includes('/') ? prazoStr.split('/') : prazoStr.split('-');
  const dateStr = parts.length === 3 && parts[0].length === 2 ? `${parts[2]}-${parts[1]}-${parts[0]}` : prazoStr;
  
  const d = new Date(dateStr);
  const now = new Date();
  
  if (isNaN(d.getTime())) return { subtext: '', color: 'text-[var(--text-muted)]' };

  d.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (status === 'Vencida' || diffDays < 0) return { subtext: 'Vencido', color: 'text-red-500' };
  if (diffDays === 0) return { subtext: 'Hoje', color: 'text-orange-600 dark:text-orange-400' };
  return { subtext: `Em ${diffDays} dias`, color: 'text-emerald-500' };
}

import { getNrMetrics } from '@/lib/risk-calculations';
import { useAppStore } from '@/lib/store';

export default function VisaoGeral({ acoes, onOpen }: { acoes: ActionItem[], onOpen: (a: ActionItem) => void }) {
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const storeRiscos = useAppStore(state => state.riscos);
  const storeInspecoes = useAppStore(state => state.inspecoes);

  const nrMetrics = useMemo(() => getNrMetrics({ inspections: storeInspecoes || [], risks: storeRiscos || [], actions: acoes }), [storeInspecoes, storeRiscos, acoes]);

  const acoesPorNR = useMemo(() => {
     return nrMetrics.map(m => ({ name: m.nr, value: m.totalAcoes })).filter(d => d.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [nrMetrics]);

  const stats = useMemo(() => {
     let pendentes = 0, andamento = 0, concluidas = 0, vencidas = 0, canceladas = 0;
     let followUpsPendentes = 0, escalonadas = 0, semAtualizacao = 0;
     let automaticas = 0, manuais = 0;
     acoes.forEach(a => {
        if (a.status === 'Pendente') pendentes++;
        else if (a.status === 'Em andamento') andamento++;
        else if (a.status === 'Concluída') concluidas++;
        else if (a.status === 'Vencida') vencidas++;
        else if (a.status === 'Cancelada') canceladas++;

        if (a.followUp?.precisaFollowUp) followUpsPendentes++;
        if (a.followUp?.escalado) escalonadas++;
        if (a.followUp?.precisaFollowUp && a.status === 'Em andamento') semAtualizacao++;
        
        if (a.regraFixa || (a.riscoVinculado && (storeRiscos || []).find(r => r.id === a.riscoId)?.regraFixa)) {
           automaticas++;
        } else {
           manuais++;
        }
     });
     return { pendentes, andamento, concluidas, vencidas, canceladas, total: acoes.length, followUpsPendentes, escalonadas, semAtualizacao, automaticas, manuais };
  }, [acoes, storeRiscos]);

  const pieData = useMemo(() => [
    { name: 'Pendentes', value: stats.pendentes, color: PIE_COLORS['Pendente'] },
    { name: 'Em andamento', value: stats.andamento, color: PIE_COLORS['Em andamento'] },
    { name: 'Vencidas', value: stats.vencidas, color: PIE_COLORS['Vencida'] },
    { name: 'Concluídas', value: stats.concluidas, color: PIE_COLORS['Concluída'] },
    { name: 'Canceladas', value: stats.canceladas, color: PIE_COLORS['Cancelada'] },
  ].filter(d => d.value > 0), [stats]);

  const prioritiesList = useMemo(() => {
    const counts = { 'Crítica': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0 };
    acoes.forEach(a => { if (counts[a.prioridade as keyof typeof counts] !== undefined) counts[a.prioridade as keyof typeof counts]++; });
    const total = acoes.length || 1;
    return [
      { name: 'Crítica', count: counts['Crítica'], pct: (counts['Crítica']/total)*100 },
      { name: 'Alta', count: counts['Alta'], pct: (counts['Alta']/total)*100 },
      { name: 'Média', count: counts['Média'], pct: (counts['Média']/total)*100 },
      { name: 'Baixa', count: counts['Baixa'], pct: (counts['Baixa']/total)*100 },
    ];
  }, [acoes]);

  const topAcoes = useMemo(() => {
     if (filterPriority === 'Exige atenção') {
        const d = acoes.filter(a => 
           a.status === 'Vencida' || 
           a.followUp?.precisaFollowUp || 
           a.followUp?.escalado || 
           a.followUp?.nivel === 'bloqueada' || 
           ((a.prioridade === 'Crítica' || a.prioridade === 'Alta') && getPrazoDetails(a.prazo, a.status).subtext === 'Hoje')
        );
        return d.slice(0, 10); // show a bit more
     }
     return acoes.slice(0, 6);
  }, [acoes, filterPriority]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      
      {/* 1. Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pendentes */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                 <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-secondary)]">Pendentes</h3>
           </div>
           <div>
              <div className="text-[32px] leading-tight font-bold text-[var(--text-primary)] mb-1.5">{stats.pendentes}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium tracking-wide">12 vencem esta semana</p>
                <div className="flex items-center gap-0.5 text-xs text-red-500 font-bold"><ArrowUpRight className="w-3.5 h-3.5"/> 8%</div>
              </div>
           </div>
        </div>

        {/* Em andamento */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-[12px] flex flex-col justify-between shadow-[var(--shadow)]">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <Play className="w-5 h-5 fill-blue-400 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-secondary)]">Em andamento</h3>
           </div>
           <div>
              <div className="text-[32px] leading-tight font-bold text-[var(--text-primary)] mb-1.5">{stats.andamento}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium tracking-wide">6 responsáveis ativos</p>
                <div className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 font-bold"><ArrowUpRight className="w-3.5 h-3.5"/> 12%</div>
              </div>
           </div>
        </div>

        {/* Vencidas */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-secondary)]">Vencidas</h3>
           </div>
           <div>
              <div className="text-[32px] leading-tight font-bold text-[var(--text-primary)] mb-1.5">{stats.vencidas}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-red-500 font-medium tracking-wide">Exigem priorização imediata</p>
                <div className="flex items-center gap-0.5 text-xs text-red-500 font-bold"><ArrowUpRight className="w-3.5 h-3.5"/> 25%</div>
              </div>
           </div>
        </div>

        {/* Concluídas */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-[12px] flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-secondary)]">Concluídas</h3>
           </div>
           <div>
              <div className="text-[32px] leading-tight font-bold text-[var(--text-primary)] mb-1.5">{stats.concluidas}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-emerald-500 font-medium tracking-wide">84% dentro do prazo</p>
                <div className="flex items-center gap-0.5 text-xs text-emerald-500 font-bold"><ArrowUpRight className="w-3.5 h-3.5"/> 16%</div>
              </div>
           </div>
        </div>
      </div>

      {/* Alertas Operacionais / Cobrança */}
      <div className="bg-gradient-to-r from-red-500/10 via-[#121826] to-[#121826] border border-red-500/20 p-5 rounded-[12px] flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
               <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight mb-1">Atenção Operacional</h3>
               <p className="text-sm text-[var(--text-muted)]">Ações que precisam de intervenção da coordenação hoje.</p>
            </div>
         </div>
         <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
               <span className="text-2xl font-bold text-red-500">{stats.vencidas}</span>
               <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Vencidas</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-2xl font-bold text-pink-400">{acoes.filter(a => a.followUp?.escalado && a.status !== 'Concluída').length}</span>
               <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Escalonadas</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-2xl font-bold text-indigo-400">{acoes.filter(a => a.followUp?.precisaFollowUp && a.status !== 'Concluída').length}</span>
               <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Sem Atualização</span>
            </div>
         </div>
      </div>

      {/* 2. Distribuição & Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Gráfico Donut */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[12px] flex flex-col">
           <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-5">Distribuição por status</h3>
           <div className="flex flex-col gap-4">
              <div className="w-[140px] h-[140px] shrink-0 relative self-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                       >
                          {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: "var(--text-primary)" }}
                       />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                 {[
                    { label: 'Pendentes', value: stats.pendentes, color: 'bg-orange-500' },
                    { label: 'Em andamento', value: stats.andamento, color: 'bg-blue-500' },
                    { label: 'Vencidas', value: stats.vencidas, color: 'bg-red-500' },
                    { label: 'Concluídas', value: stats.concluidas, color: 'bg-emerald-500' },
                 ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-[12px]">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[var(--text-secondary)]">{item.label}</span>
                       </div>
                       <div className="flex gap-2">
                          <span className="text-[var(--text-primary)] font-medium">{item.value}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Barras de Prioridade */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[12px] flex flex-col">
           <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6">Ações por prioridade</h3>
           <div className="flex-1 flex flex-col justify-center space-y-5">
              {prioritiesList.map(item => (
                 <div key={item.name} className="flex items-center gap-4 text-[13px]">
                    <span className="text-[var(--text-secondary)] w-16">{item.name}</span>
                    <div className="flex-1 bg-[var(--bg-active-group)] h-2.5 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: PRIORITY_COLORS[item.name] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                       />
                    </div>
                    <div className="flex gap-3 w-16 justify-end">
                       <span className="text-[var(--text-primary)] font-medium">{item.count}</span>
                       <span className="text-[var(--text-muted)] text-xs mt-[1px]">({item.count > 0 ? Math.round(item.pct) : 0}%)</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Origem das ações */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[12px] flex flex-col">
           <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6">Ações por Origem</h3>
           <div className="flex-1 flex flex-col justify-center space-y-6">
                 <div className="flex items-center gap-4 text-[13px]">
                    <span className="text-[var(--text-secondary)] w-24">Ação Sistêmica</span>
                    <div className="flex-1 bg-[var(--bg-active-group)] h-2.5 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full rounded-full bg-indigo-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.total > 0 ? (stats.automaticas/stats.total)*100 : 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                       />
                    </div>
                    <div className="flex gap-3 w-16 justify-end">
                       <span className="text-[var(--text-primary)] font-medium">{stats.automaticas}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-[13px]">
                    <span className="text-[var(--text-secondary)] w-24">Ação Manual</span>
                    <div className="flex-1 bg-[var(--bg-active-group)] h-2.5 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full rounded-full bg-gray-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.total > 0 ? (stats.manuais/stats.total)*100 : 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                       />
                    </div>
                    <div className="flex gap-3 w-16 justify-end">
                       <span className="text-[var(--text-primary)] font-medium">{stats.manuais}</span>
                    </div>
                 </div>
           </div>
        </div>

        {/* Ações por NR */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[12px] flex flex-col">
           <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-6">Ações por NR</h3>
           <div className="flex-1 flex flex-col justify-center space-y-5">
              {acoesPorNR.map(item => (
                 <div key={item.name} className="flex items-center gap-4 text-[13px]">
                    <span className="text-[var(--text-secondary)] w-16">{item.name}</span>
                    <div className="flex-1 bg-[var(--bg-active-group)] h-2.5 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full rounded-full bg-emerald-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.total > 0 ? (item.value/stats.total)*100 : 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                       />
                    </div>
                    <div className="flex gap-3 w-16 justify-end">
                       <span className="text-[var(--text-primary)] font-medium">{item.value}</span>
                    </div>
                 </div>
              ))}
              {acoesPorNR.length === 0 && <span className="text-[var(--text-muted)] text-sm">Nenhum dado de NR</span>}
           </div>
        </div>
      </div>

      {/* Card de Cobrança Operacional */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-[12px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div className="flex flex-col gap-1">
             <h3 className="text-[15px] font-medium text-indigo-300 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" />
                 Cobrança Operacional
             </h3>
             <p className="text-[13px] text-[var(--text-muted)]">Ações que exigem follow-up, atualização ou estão com prazo crítico.</p>
         </div>
         <div className="flex flex-wrap items-center gap-6">
             <div className="flex flex-col">
                 <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">Follow-ups pendentes</span>
                 <span className="text-[18px] font-bold text-[var(--text-primary)]">{stats.followUpsPendentes}</span>
             </div>
             <div className="w-px h-8 bg-[var(--bg-active-group)] hidden md:block"></div>
             <div className="flex flex-col">
                 <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">Escalonadas</span>
                 <span className="text-[18px] font-bold text-pink-400">{stats.escalonadas}</span>
             </div>
             <div className="w-px h-8 bg-[var(--bg-active-group)] hidden md:block"></div>
             <div className="flex flex-col">
                 <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">Sem atualização</span>
                 <span className="text-[18px] font-bold text-orange-600 dark:text-orange-400">{stats.semAtualizacao}</span>
             </div>
             <div className="w-px h-8 bg-[var(--bg-active-group)] hidden md:block"></div>
             <div className="flex flex-col">
                 <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">Vencidas</span>
                 <span className="text-[18px] font-bold text-red-500">{stats.vencidas}</span>
             </div>
             <button onClick={() => setFilterPriority('Exige atenção')} className="ml-4 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors">
                Ver ações
             </button>
         </div>
      </div>

      {/* 3. Tabela Recentes */}
      <div className="bg-[var(--bg-card)] rounded-[12px] border border-[var(--border)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
           <h2 className="text-[15px] font-medium text-[var(--text-primary)]">
              {filterPriority === 'Exige atenção' ? 'Ações que exigem atenção' : 'Ações recentes'}
           </h2>
           {filterPriority === 'Exige atenção' && (
              <button 
                 onClick={() => setFilterPriority('Todos')}
                 className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                 Limpar filtro
              </button>
           )}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
           <thead className="bg-[var(--bg-card)]">
              <tr>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Prioridade</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Ação</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Risco vinculado</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Responsável</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Prazo</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Status</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">Origem</th>
                 <th className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)] text-right">Ações</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-[var(--border)]">
              {topAcoes.map(acao => {
                 const pDetails = getPrazoDetails(acao.prazo, acao.status);
                 const rInitials = getInitials(acao.responsavel);
                 
                 const avatarColors = [
                    'bg-purple-500/20 text-purple-400', 'bg-blue-500/20 text-blue-600 dark:text-blue-600 dark:text-blue-400', 
                    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400', 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                    'bg-indigo-500/20 text-indigo-400', 'bg-pink-500/20 text-pink-400'
                 ];
                 const charCode = (acao.responsavel || "").charCodeAt(0) || 0;
                 const avatarColor = avatarColors[charCode % avatarColors.length];

                 return (
                    <tr key={acao.id} onClick={() => onOpen(acao)} className="hover:bg-[var(--bg-active-group)] transition-colors cursor-pointer group">
                       <td className="px-5 py-4 w-28">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border bg-transparent ${
                             acao.prioridade === 'Crítica' ? 'text-red-500 border-red-500/30' :
                             acao.prioridade === 'Alta' ? 'text-orange-500 border-orange-500/30' :
                             acao.prioridade === 'Média' ? 'text-yellow-500 border-yellow-500/30' :
                             'text-emerald-500 border-emerald-500/30'
                          }`}>
                             {acao.prioridade}
                          </span>
                       </td>
                       <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                             <h3 className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{acao.titulo}</h3>
                             <div className="flex items-center gap-2 flex-wrap">
                               {acao.followUp?.precisaFollowUp && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Precisa follow-up</span>}
                               {acao.followUp?.escalado && <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded">Escalonada</span>}
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-48">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                             <span className="text-[13px] text-[var(--text-secondary)] truncate max-w-[150px]">{acao.riscoVinculado || acao.setor || '-'}</span>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-44">
                          <div className="flex items-center gap-2.5">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor}`}>
                                {rInitials}
                             </div>
                             <span className="text-[13px] text-[var(--text-secondary)] truncate max-w-[120px]">{acao.responsavel}</span>
                          </div>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <div className="flex flex-col">
                             <span className="text-[13px] text-[var(--text-secondary)]">{acao.prazo}</span>
                             {pDetails.subtext && <span className={`text-[11px] font-medium mt-0.5 ${pDetails.color}`}>{pDetails.subtext}</span>}
                          </div>
                       </td>
                       <td className="px-5 py-4 w-32">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center justify-center w-fit ${
                             acao.status === 'Vencida' ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10' :
                             acao.status === 'Em andamento' ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10' :
                             acao.status === 'Concluída' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                             'text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10'
                          }`}>
                             {acao.status}
                          </span>
                       </td>
                       <td className="px-5 py-4 w-32 text-[13px] text-[var(--text-muted)]">Inspeção #{acao.id.split('-').pop()?.substring(0,4)}</td>
                       <td className="px-5 py-4 text-right">
                          <button 
                             onClick={(e) => { e.stopPropagation(); onOpen(acao); }}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-active-group)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all text-xs font-medium"
                          >
                             <Eye className="w-3.5 h-3.5" />
                             Ver
                          </button>
                       </td>
                    </tr>
                 );
              })}
              {topAcoes.length === 0 && (
                 <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">Nenhuma ação encontrada.</td>
                 </tr>
              )}
           </tbody>
        </table>
        </div>
        
        {/* 4. Footer Pagination */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-between text-sm w-full bg-[var(--bg-card)]">
           <span className="text-[var(--text-muted)]">Mostrando 1 a {topAcoes.length} de {stats.total} ações</span>
           <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-active-group)] transition-colors" disabled>
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-medium">
                 1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-active-group)] transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

    </motion.div>
  );
}
