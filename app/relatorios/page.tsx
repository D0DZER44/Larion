"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { NormativeEngine, RiskEngine, EconomicImpactEngine } from '@/lib/engines';

export default function RelatoriosPage() {
  const [simulatedRisks] = useState([
    { id: 1, text: "trabalho em altura no telhado", people: 3, recurrence: false },
    { id: 2, text: "manutenção em painel elétrico", people: 2, recurrence: true },
    { id: 3, text: "espaço confinado", people: 1, recurrence: false }
  ]);

  const totals = simulatedRisks.reduce((acc, sim) => {
     const normMatch = NormativeEngine.detect(sim.text);
     if (!normMatch) return acc;
     const estimate = EconomicImpactEngine.estimate({
       severityLevel: normMatch.severity as 'baixo' | 'médio' | 'alto' | 'crítico',
       exposedPeople: sim.people,
       recurrence: sim.recurrence
     });
     acc.min += estimate.min;
     acc.max += estimate.max;
     return acc;
  }, { min: 0, max: 0 });

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full bg-[#0A0D14] overflow-y-auto">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Relatórios Executivos</h1>
          <p className="text-sm text-gray-400 mt-1">Impactos econômicos simulados e detecção normativa.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <Download className="w-4 h-4" /> Exportar Relatório Oficial (PDF)
        </button>
      </header>

      <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
         <div>
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Exposição Financeira Total Estimada (Passivo/Autuações)</h2>
            <p className="text-xs text-gray-500 mt-1 italic max-w-2xl">
               Estimativa preventiva, considerando cenário acumulado (ações simultâneas ou FAP majorado). O valor real depende de fiscalização, enquadramento, número de empregados, reincidência e contexto do evento.
            </p>
         </div>
         <div className="text-2xl font-bold text-red-400 text-right whitespace-nowrap bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
            {EconomicImpactEngine.formatCurrency(totals.min)} — {EconomicImpactEngine.formatCurrency(totals.max)}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {simulatedRisks.map((sim, idx) => {
          const normMatch = NormativeEngine.detect(sim.text);
          if (!normMatch) return null;

          const estimate = EconomicImpactEngine.estimate({
            severityLevel: normMatch.severity as 'baixo' | 'médio' | 'alto' | 'crítico',
            exposedPeople: sim.people,
            recurrence: sim.recurrence
          });

          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#121826] border border-white/5 p-6 rounded-2xl flex flex-col relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl"></div>
              <div className="flex items-center gap-3 mb-4 text-purple-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold tracking-wider uppercase">{normMatch.nr}</h3>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-2 leading-snug">{normMatch.riskType}</h4>
              <p className="text-sm text-gray-400 mb-6 truncate">{navString(sim.text)}</p>

              <div className="bg-[#0b0f19] rounded-xl p-4 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Passivo Estimado</span>
                   <span className="text-lg font-bold text-red-400 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> R$ {(estimate.max/1000).toFixed(1)}k</span>
                </div>
                
                <div className="h-px bg-white/5 w-full"></div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                   <span>{sim.people} expostos</span>
                   <span>Reincidência: {sim.recurrence ? 'Sim' : 'Não'}</span>
                   <span className={`px-2 py-0.5 rounded font-bold uppercase ${normMatch.severity === 'crítica' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-400'}`}>
                     {normMatch.severity}
                   </span>
                </div>
              </div>
              
            </motion.div>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col bg-[#121826] border border-white/5 p-6 rounded-2xl">
         <div className="flex items-center gap-2 mb-6">
           <FileText className="w-5 h-5 text-gray-400" />
           <h3 className="text-lg font-bold text-white">Análise Normativa Detalhada</h3>
         </div>
         <div className="text-sm text-gray-400">
           Integração de relatórios completos do PGR e análises aprofundadas com base nos dados reais do State central em andamento. Atualmente simulando impactos para NRs críticas (NR-10, NR-12, NR-33, NR-35).
         </div>
      </div>
    </div>
  );
}

function navString(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
