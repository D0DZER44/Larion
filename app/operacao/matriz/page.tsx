"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { NR_MATRIX, getNRsAplicaveis } from '@/lib/nrMatrix';
import { fixedNrChecklists } from '@/lib/normativeChecklists';
import { 
  ShieldCheck, 
  BookOpen, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Activity,
  Users,
  ClipboardCheck
} from 'lucide-react';

export default function MatrizNormativaPage() {
  const [activeTab, setActiveTab] = useState<'Matriz' | 'Checklists'>('Matriz');
  const storeChecklists = useAppStore(state => state.checklists);

  // We can get org settings from some context or assume "Indústria" as an example based on existing mock data or let user filter
  const [selectedSegment, setSelectedSegment] = useState<string>('Indústria');

  const activeRulePackages = useAppStore(state => state.rulePackages.filter(p => p.isActive).map(p => p.name));

  const nrsAplicaveis = getNRsAplicaveis({
    segmentoOrganizacao: selectedSegment,
    atividadesCriticas: [], // User could filter
    pacotesAtivos: activeRulePackages
  });

  const allNrs = Array.from(new Set(NR_MATRIX.map(nr => nr.pacote)));

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0b0f19]">
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
          
          <div className="flex flex-col gap-2 shrink-0 mb-6 mt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="text-gray-300">Operação</span>
              <span className="text-purple-400">/ Matriz Normativa</span>
            </div>
            
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto gap-1">
                <button
                  onClick={() => setActiveTab('Matriz')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'Matriz'
                      ? 'bg-purple-600 shadow-lg shadow-purple-500/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Matriz de Aplicabilidade
                </button>
                <button
                  onClick={() => setActiveTab('Checklists')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'Checklists'
                      ? 'bg-purple-600 shadow-lg shadow-purple-500/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Base Legal dos Checklists
                </button>
              </div>
            </header>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
            {activeTab === 'Matriz' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Filtro Lateral */}
                  <div className="w-full lg:w-[300px] shrink-0 space-y-4">
                    <div className="bg-[#121826] border border-white/5 rounded-xl p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                         <ShieldCheck className="w-24 h-24" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-4 relative z-10">Filtro de Contexto</h3>
                      
                      <div className="space-y-4 relative z-10">
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">Segmento da Operação</label>
                          <select 
                            value={selectedSegment}
                            onChange={(e) => setSelectedSegment(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="Todos">Todos (Aplicáveis)</option>
                            <option value="Indústria">Indústria</option>
                            <option value="Construção Civil">Construção Civil</option>
                            <option value="Saúde">Saúde / Hospitalar</option>
                            <option value="Logística">Logística / Transporte</option>
                            <option value="Serviços">Serviços Gerais</option>
                          </select>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5">
                           <div className="flex items-center gap-2 mb-2">
                             <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                             <span className="text-[13px] font-medium text-white">{nrsAplicaveis.length} NRs Ativas</span>
                           </div>
                           <p className="text-[11px] text-gray-500 leading-relaxed">
                             A matriz avalia dinamicamente os pacotes de regras ativos, o segmento da organização e as atividades críticas cadastradas para definir quais normas regulamentadoras são aplicáveis em tempo real.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabela Matriz */}
                  <div className="flex-1 min-w-0">
                    <div className="grid gap-4">
                      {NR_MATRIX.filter(nr => selectedSegment === 'Todos' || nr.segmentosAplicaveis.includes('Todos') || nr.segmentosAplicaveis.includes(selectedSegment)).map((nr) => {
                        const isAplicavel = nrsAplicaveis.some(n => n.id === nr.id);
                        
                        return (
                          <div key={nr.id} className={`bg-[#121826] border rounded-xl overflow-hidden transition-all duration-300 ${isAplicavel ? 'border-purple-500/30 shadow-[0_0_15px_rgba(124,58,237,0.05)]' : 'border-white/5 opacity-60'}`}>
                            <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                               <div className="flex items-start md:items-center gap-4 flex-1">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isAplicavel ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-gray-800/50 border-white/5 text-gray-500'}`}>
                                     <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className={`text-[15px] font-bold ${isAplicavel ? 'text-white' : 'text-gray-400'}`}>{nr.id}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isAplicavel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                                           {isAplicavel ? 'Aplicável' : 'Inaplicável'}
                                        </span>
                                     </div>
                                     <p className="text-[13px] text-gray-400 font-medium">{nr.nome}</p>
                                  </div>
                               </div>
                               
                               <div className="flex flex-col gap-2 min-w-[200px]">
                                 <div className="flex items-center gap-2 text-[12px]">
                                   <span className="text-gray-500 w-24">Segmento:</span>
                                   <span className="text-gray-300 font-medium">{nr.segmentosAplicaveis.join(', ')}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[12px]">
                                   <span className="text-gray-500 w-24">Prioridade:</span>
                                   <span className={`font-bold ${nr.prioridadePadrao === 'Crítica' ? 'text-red-400' : nr.prioridadePadrao === 'Alta' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                      {nr.prioridadePadrao}
                                   </span>
                                 </div>
                               </div>
                            </div>
                            
                            {isAplicavel && (
                              <div className="bg-purple-900/10 px-5 py-3 border-t border-purple-500/10 text-[12px] flex items-start gap-2 text-purple-300/80">
                                 <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                 <p>
                                   <strong className="text-purple-300">Justificativa de Ativação:</strong> Ativada por pertencer ao pacote <strong>{nr.pacote}</strong> ou ser exigência legal para o segmento de <strong>{selectedSegment}</strong> ({nr.atividadesRelacionadas.slice(0, 2).join(', ')}).
                                 </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#121826] border border-white/5 rounded-xl p-5 mb-6 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 z-0">
                      <BookOpen className="w-32 h-32" />
                   </div>
                   <div className="relative z-10 max-w-3xl">
                     <h2 className="text-lg font-bold text-white mb-2">Transparência Legal (Checklists)</h2>
                     <p className="text-[13px] text-gray-400 leading-relaxed text-justify">
                        Todos os itens de inspeção aplicados nas operações possuem rastreabilidade direta com as Normas Regulamentadoras MTE.
                        Esta visão detalha o amparo legal de cada verificação, garantindo que a fiscalização e a gestão de conformidade tenham validade jurídica e justificativa técnica sólida.
                     </p>
                   </div>
                </div>

                <div className="space-y-8">
                   {fixedNrChecklists.map((chk: any) => (
                     <div key={chk.id} className="bg-[#121826] border border-white/5 rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-[#1a2133] p-5 border-b border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                 <ClipboardCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-[15px] font-bold text-white">{chk.titulo}</h3>
                                <p className="text-[12px] text-gray-400 mt-0.5">Rastreabilidade Normativa MTE</p>
                              </div>
                           </div>
                        </div>
                        
                        <div className="p-0 overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-[#0b0f19] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                 <tr>
                                   <th className="px-5 py-4">Item de Verificação</th>
                                   <th className="px-5 py-4 text-center">Referência Normativa</th>
                                   <th className="px-5 py-4">Risco Associado</th>
                                   <th className="px-5 py-4 text-center">Criticidade Legal</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-[13px]">
                                 {chk.sections.flatMap((s: any) => s.questions).map((q: any) => (
                                   <tr key={q.id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-5 py-4 w-[40%]">
                                         <p className="font-medium text-gray-200">{q.text}</p>
                                         <p className="text-[11px] text-gray-500 mt-1">Gera risco automaticamente se não conforme.</p>
                                      </td>
                                      <td className="px-5 py-4 text-center">
                                         <span className="inline-flex px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[11px]">
                                            Item {q.regraId || q.nrRelacionada}
                                         </span>
                                      </td>
                                      <td className="px-5 py-4">
                                         <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-orange-400" />
                                            <span className="text-gray-300">{q.tipoRisco || 'Exposição Direta'}</span>
                                         </div>
                                      </td>
                                      <td className="px-5 py-4 text-center">
                                         <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                           q.criticidade === 'Crítica' ? 'text-red-400 bg-red-500/10' :
                                           q.criticidade === 'Alta' ? 'text-orange-400 bg-orange-500/10' :
                                           'text-emerald-400 bg-emerald-500/10'
                                         }`}>
                                            {q.criticidade}
                                         </span>
                                      </td>
                                   </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
