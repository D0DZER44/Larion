"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { getTodasRegrasAtivas } from '@/lib/normativeRules';
import { FineEngine } from '@/lib/fineEngine';
import { 
  Zap, AlertTriangle, CheckCircle2, ChevronDown, ListChecks, ArrowRight,
  TrendingUp, Scaling, ShieldCheck, Activity, BarChart2, DollarSign, Brain
} from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MotorNormativoPage() {
  const { riscos = [], rules: customRules = [], rulePackages = [] } = useAppStore();
  
  const rules = useMemo(() => getTodasRegrasAtivas(customRules), [customRules]);

  const activeRulePackages = useMemo(() => 
    rulePackages.filter(p => p.isActive).map(p => p.name)
  , [rulePackages]);

  // Calculations for Multa Evitada & Multa Estimada
  const riskStats = useMemo(() => {
    let estimada = 0;
    let evitada = 0;
    let regrasAcionadasCount = 0;

    const regrasMap: Record<string, { count: number, multaEstimada: number, evitada: number, detalhes: any }> = {};

    riscos.forEach(r => {
      let multa = Number(r.multaEstimada);
      if (isNaN(multa) || multa === 0) {
         // Fallback calculation using engine if not explicitly set
         const est = FineEngine.calcularFaixaMulta({
           nr: r.nr || 'NR-Geral',
           criticidade: r.nivel || r.level || 'Alta',
           numeroEmpregados: 50 // assume standard
         });
         multa = est.maximoEstimado;
      }

      if (r.status === 'Resolvido' || r.status === 'Mitigado') {
        evitada += multa;
      } else {
        estimada += multa;
      }

      if (r.nr) {
         if (!regrasMap[r.nr]) regrasMap[r.nr] = { count: 0, multaEstimada: 0, evitada: 0, detalhes: [] };
         regrasMap[r.nr].count++;
         if (r.status === 'Resolvido' || r.status === 'Mitigado') {
            regrasMap[r.nr].evitada += multa;
         } else {
            regrasMap[r.nr].multaEstimada += multa;
         }
         regrasMap[r.nr].detalhes.push(r);
         regrasAcionadasCount++;
      }
    });

    const regrasData = Object.entries(regrasMap).map(([nr, stats]) => ({
       nr, ...stats
    })).sort((a,b) => b.multaEstimada - a.multaEstimada);

    return { estimada, evitada, regrasAcionadasCount, regrasData };
  }, [riscos]);

  const [expandedNR, setExpandedNR] = useState<string | null>(null);

  const toggleNR = (nr: string) => {
     if (expandedNR === nr) setExpandedNR(null);
     else setExpandedNR(nr);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0b0f19]">
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <div className="flex flex-col gap-2 shrink-0 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="text-gray-300">Inteligência</span>
              <span className="text-purple-400">/ Motor Normativo</span>
            </div>
            
            <header className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-900/40 border border-purple-500/30 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Motor Normativo</h1>
                  <p className="text-[13px] text-gray-400 mt-0.5 font-medium tracking-wide">
                    Transparência sobre cálculos de multas, exposição e gatilhos de conformidade.
                  </p>
                </div>
              </div>
            </header>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 pr-2">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Multa Evitada KPI */}
              <div className="bg-[#121826] border border-emerald-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all z-0"></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                         <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-300">Valor de Multa Evitada</h3>
                    </div>
                    <div className="text-4xl font-bold text-emerald-400 mb-1">{formatCurrency(riskStats.evitada)}</div>
                    <p className="text-[12px] text-gray-500">Riscos operacionais mitigados/resolvidos (NR-28).</p>
                 </div>
              </div>

               {/* Multa Estimada KPI */}
               <div className="bg-[#121826] border border-yellow-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(234,179,8,0.05)] relative overflow-hidden group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all z-0"></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                         <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-300">Potencial Passivo (Multa Estimada)</h3>
                    </div>
                    <div className="text-4xl font-bold text-yellow-500 mb-1">{formatCurrency(riskStats.estimada)}</div>
                    <p className="text-[12px] text-gray-500">Exposição financeira por descumprimento.</p>
                 </div>
              </div>

               {/* Regras Acionadas KPI */}
               <div className="bg-[#121826] border border-purple-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.05)] relative overflow-hidden group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all z-0"></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                         <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-300">Gatilhos Normativos</h3>
                    </div>
                    <div className="text-4xl font-bold text-purple-400 mb-1">{riskStats.regrasAcionadasCount}</div>
                    <p className="text-[12px] text-gray-500">Disparos do motor com base em inspeções e ações.</p>
                 </div>
              </div>
            </div>

            <div className="bg-[#121826] border border-white/5 rounded-xl flex flex-col overflow-hidden mb-8">
               <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white mb-2">Memória de Cálculo e Contexto Legal</h2>
                  <p className="text-[13px] text-gray-400 leading-relaxed text-justify max-w-4xl">
                    Nesta área, tornamos transparente a caixa-preta do motor de SST. Toda multa estimada é baseada na NR-28. Em vez de focar apenas no custo, os KPIs de <strong className="text-emerald-400">Multa Evitada</strong> transformam multas recebidas em narrativa de gestão de valor, demonstrando a proteção em vidas humanas e capital após o arquivamento das evidências de mitigação (EPIs, bloqueios e engenharias).
                  </p>
               </div>

               <div className="p-0">
                  {riskStats.regrasData.map(group => (
                     <div key={group.nr} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                        <button 
                           className="w-full flex items-center justify-between p-6 focus:outline-none"
                           onClick={() => toggleNR(group.nr)}
                        >
                           <div className="flex items-center gap-6">
                              <div className="w-16 flex flex-col items-center justify-center shrink-0">
                                 <span className="text-[15px] font-bold text-white">{group.nr}</span>
                                 <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wider">{group.count} Ocor.</span>
                              </div>
                              <div className="h-10 w-px bg-white/10 shrink-0 hidden sm:block"></div>
                              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                                 <div className="text-left">
                                    <div className="text-[11px] text-gray-500 uppercase font-bold mb-1">Passivo Corrente</div>
                                    <div className="text-[16px] font-bold text-yellow-500">{formatCurrency(group.multaEstimada)}</div>
                                 </div>
                                 <div className="text-left">
                                    <div className="text-[11px] text-gray-500 uppercase font-bold mb-1">Valor Protegido / Evitado</div>
                                    <div className="text-[16px] font-bold text-emerald-400">{formatCurrency(group.evitada)}</div>
                                 </div>
                              </div>
                           </div>
                           <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedNR === group.nr ? 'rotate-180 text-white' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                           {expandedNR === group.nr && (
                              <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 transition={{ duration: 0.3 }}
                                 className="overflow-hidden bg-[#0A0D15] border-t border-white/5"
                              >
                                 <div className="p-6 custom-scrollbar">
                                    <table className="w-full text-left text-[13px]">
                                       <thead className="bg-[#121826] border border-white/5">
                                          <tr>
                                             <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Origem / Gatilho</th>
                                             <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Risco Direto / Consequência</th>
                                             <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px] text-center">Severidade da Regra</th>
                                             <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px] text-right">Potencial (NR-28)</th>
                                             <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px] text-center">Gestão</th>
                                          </tr>
                                       </thead>
                                       <tbody className="border-x border-b border-white/5 divide-y divide-white/5">
                                          {group.detalhes.map((r: any, idx: number) => {
                                             const val = Number(r.multaEstimada);
                                             const actualVal = (isNaN(val) || val === 0) ? FineEngine.calcularFaixaMulta({ nr: r.nr||'NR-Geral', criticidade: r.nivel||r.level||'Alta', numeroEmpregados: 50}).maximoEstimado : val;
                                             const resolvido = r.status === 'Resolvido' || r.status === 'Mitigado';
                                             
                                             let criticidadeStr = r.criticidade || r.nivel || r.level || 'Alta';

                                             return (
                                             <tr key={r.id || idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-4 w-[25%]">
                                                   <p className="font-bold text-gray-200">{r.titulo || r.atividade}</p>
                                                   <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{r.descricao || r.gatilho || `Identificado no setor ${r.setor}.`}</p>
                                                </td>
                                                <td className="px-4 py-4 w-[25%]">
                                                   <span className="text-gray-300">{r.consequencia || r.danosDesc || 'Danos à saúde ou integridade'}</span>
                                                   <div className="mt-1 flex items-center gap-2 text-[10px]">
                                                      <span className="text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">{r.setor || 'N/A'}</span>
                                                      <span className="text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">{r.trabalhadoresExpostos || 1} exposto(s)</span>
                                                   </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                   <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                      criticidadeStr.includes('Crític') ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                                                      criticidadeStr.includes('Alt') ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' :
                                                      'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                                   }`}>
                                                      {criticidadeStr}
                                                   </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                   <span className={`font-bold ${resolvido ? 'text-gray-500 line-through' : 'text-yellow-500'}`}>
                                                      {formatCurrency(actualVal)}
                                                   </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                   {resolvido ? (
                                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded border border-emerald-500/20">
                                                         <CheckCircle2 className="w-3 h-3" /> Evitada
                                                      </span>
                                                   ) : (
                                                      <button className="text-[11px] font-bold text-purple-400 hover:text-white transition-colors" onClick={() => window.location.href='/operacao/riscos'}>
                                                         Tratar Risco
                                                      </button>
                                                   )}
                                                </td>
                                             </tr>
                                          )})}
                                       </tbody>
                                    </table>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
