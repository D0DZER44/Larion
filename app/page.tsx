"use client";

import React from 'react';
import { 
  Bell, Download, Calendar, Activity, AlertTriangle, 
  FileText, Clock, Settings, Search, CheckCircle2, 
  ChevronRight, TrendingUp, TrendingDown, Info, ShieldAlert,
  ArrowRight, Shield, BookOpen, Wrench, Users, MessageSquare,
  ShieldCheck, HardHat, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import Image from 'next/image';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// --- MOCK COMPONENTS FOR DASHBOARD ---

const StatCard = ({ title, value, trend, trendDir, trendColor, subtext, icon: Icon, data, lineColor = '#c084fc' }: any) => (
  <div className="glass-panel p-4 flex flex-col justify-between border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer rounded-xl group relative">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-gray-400 text-xs font-medium tracking-wider flex items-center gap-1.5 group-hover:text-gray-300 transition-colors">
        {title} <Info className="w-3.5 h-3.5 text-gray-500" />
      </h3>
      <div className="p-1.5 bg-white/5 rounded-md">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
    </div>
    
    <div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendDir === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{trend}</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>
    </div>
    
    {data && (
       <div className="h-10 w-full mt-4 pt-2 border-t border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={lineColor} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const RiskDonut = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    {/* Background Circle */}
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {/* Red segment (Critical - 15%) */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray="351" strokeDashoffset="298" className="transition-all duration-1000" />
      {/* Orange segment (High - 30%) */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="351" strokeDashoffset="193" className="transition-all duration-1000" />
      {/* Yellow segment (Medium - 35%) */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#eab308" strokeWidth="12" strokeDasharray="351" strokeDashoffset="70" className="transition-all duration-1000" />
      {/* Green segment (Low - 20%) */}
      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#22c55e" strokeWidth="12" strokeDasharray="351" strokeDashoffset="0" className="transition-all duration-1000" />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-3xl font-bold text-white leading-none">68</span>
      <span className="text-[10px] text-gray-400">/100</span>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b0f19] shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Bom dia, Rafael! <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Aqui está o panorama da segurança hoje.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#121826] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            01/05/2024 - 31/05/2024
            <ChevronRight className="w-4 h-4 ml-3 text-gray-500 rotate-90" />
          </div>
          
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0b0f19]"></span>
          </button>
          
          <button className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </header>

      {/* Split Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
          <div className="space-y-4">
            {/* Top Hero Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              
              {/* Main Risk Score Card */}
              <div className="glass-panel p-5 rounded-xl xl:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#121826] to-[#1a1625]">
                <div className="flex flex-col gap-4 h-full relative">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <h2 className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">SST Inteligência</h2>
                    <span className="text-[9px] text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Insights automáticos</span>
                  </div>
                  
                  <div className="flex items-center gap-6 border-b border-white/5 pb-5">
                    <div className="shrink-0 scale-90 origin-left">
                      <RiskDonut />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">NÍVEL DE RISCO GERAL <Info className="w-3.5 h-3.5"/></h3>
                      <div className="text-3xl font-bold text-red-500 mb-1 leading-none tracking-tight">ALTO</div>
                      <p className="text-[11px] text-gray-300 leading-snug">Probabilidade de incidente<br/><strong className="text-white">68% nas próximas 2 semanas</strong></p>
                      <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3"/> 18% vs. período anterior</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[9px] text-gray-500 mb-2 uppercase tracking-widest font-medium">PRINCIPAIS FATORES QUE AUMENTAM O RISCO:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent border border-red-500/20 text-red-500 text-[10px] font-medium">
                        <Clock className="w-3.5 h-3.5" /> Horas extras elevadas
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent border border-orange-500/20 text-orange-500 text-[10px] font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> EPIs vencidos ou não utilizados
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent border border-yellow-500/20 text-yellow-500 text-[10px] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Falhas em inspeções
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action CTA within Hero */}
              <div className="xl:col-span-3 bg-[#1e1a30] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden border-2 border-transparent" style={{ backgroundClip: 'padding-box', backgroundImage: 'linear-gradient(#1e1a30, #1e1a30), linear-gradient(to bottom right, rgba(124,58,237,0.5), rgba(124,58,237,0.1))', backgroundOrigin: 'border-box' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative z-10 w-full mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">Ação Prioritária</h3>
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded text-[9px] font-bold border border-emerald-400/20">
                      <span className="bg-emerald-500/20 px-1 rounded-sm">$</span> IMPACTO FINANCEIRO
                    </div>
                  </div>
                  
                  <h2 className="text-base font-bold text-white leading-tight mb-1">
                    Regularizar EPIs vencidos
                  </h2>
                  <p className="text-[11px] text-gray-400 mb-6">(12 colaboradores)</p>

                  <div className="text-[11px] text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Prazo:</span>
                      <span className="text-purple-400 font-medium">Hoje</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impacto:</span>
                      <span className="text-emerald-500 font-medium">-2 riscos críticos</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <div className="text-2xl font-bold text-emerald-400 mb-1 flex items-center justify-between">
                    R$ 32.400
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-4">Economia estimada evitando correção ou multas.</p>
                  
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 text-xs rounded-lg flex items-center justify-between transition-colors shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-500/30">
                    <span>Executar agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dicas Banner (moved to top row) */}
              <div className="xl:col-span-4 glass-panel p-5 rounded-xl border-t-2 border-t-[#121826]/10 flex flex-col justify-between">
                <h3 className="text-gray-300 text-[10px] font-bold flex items-center gap-2 mb-4 uppercase tracking-wider">
                  DICAS PARA REDUZIR RISCOS <Info className="w-3.5 h-3.5 text-gray-500" />
                </h3>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="bg-[#121826]/60 p-4 rounded-xl flex items-center justify-between border border-emerald-500/10 flex-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-200 font-medium leading-snug">Se reduzir horas extras em 20%</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Impacto estimado no risco geral</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-emerald-400 flex items-center gap-1 relative z-10">
                      -35% <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="bg-[#121826]/60 p-4 rounded-xl flex items-center justify-between border border-emerald-500/10 flex-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-200 font-medium leading-snug">Se 100% dos EPIs estiverem conformes</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Impacto estimado no risco geral</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-emerald-400 flex items-center gap-1 relative z-10">
                      -52% <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-[#121826] mt-1 select-none">Espaçamento do fundo da tela.</p>
              </div>
            </div>

            {/* 4 Mini Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard 
                title="TFA" 
                value="12,45" 
                trend="8,2%" 
                trendDir="up" 
                trendColor="text-emerald-500" 
                subtext="vs. período anterior" 
                icon={Users} 
                lineColor="#c084fc"
                data={[ { value: 12 }, { value: 10 }, { value: 11 }, { value: 9 }, { value: 10 }, { value: 11 }, { value: 15 }, { value: 12 }, { value: 13 }, { value: 17 } ]}
              />
              <StatCard 
                title="TG" 
                value="0,98" 
                trend="15,6%" 
                trendDir="down" 
                trendColor="text-red-500" 
                subtext="vs. período anterior" 
                icon={TrendingUpIcon} 
                lineColor="#ef4444"
                data={[ { value: 1.5 }, { value: 1.2 }, { value: 1.1 }, { value: 1.3 }, { value: 1.2 }, { value: 1.0 }, { value: 1.2 }, { value: 0.9 }, { value: 1.1 }, { value: 0.8 } ]}
              />
              <StatCard 
                title="Near Miss" 
                value="23" 
                trend="4,1%" 
                trendDir="up" 
                trendColor="text-emerald-500" 
                subtext="vs. período anterior" 
                icon={ShieldCheck} 
                lineColor="#c084fc"
                data={[ { value: 18 }, { value: 15 }, { value: 20 }, { value: 19 }, { value: 22 }, { value: 25 }, { value: 21 }, { value: 24 }, { value: 22 }, { value: 26 } ]}
              />
              <StatCard 
                title="EPIs Conformes" 
                value="78%" 
                trend="6,3%" 
                trendDir="down" 
                trendColor="text-red-500" 
                subtext="vs. período anterior" 
                icon={HardHat} 
                lineColor="#c084fc"
                data={[ { value: 85 }, { value: 83 }, { value: 86 }, { value: 84 }, { value: 81 }, { value: 82 }, { value: 80 }, { value: 77 }, { value: 79 }, { value: 78 } ]}
              />
            </div>

            {/* Lower Main Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Riscos Críticos List */}
              <div className="glass-panel rounded-xl flex flex-col h-[380px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                      RISCOS CRÍTICOS (5)
                    </h3>
                    <a href="#" className="text-[11px] text-purple-400 hover:text-purple-300">Ver todos</a>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-none flex flex-col space-y-1">
                  {[
                    { title: "Máquina sem proteção", subtitle: "NR-12 • 3 pessoas expostas", level: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", isCheck: false },
                    { title: "Trabalho em altura sem proteção", subtitle: "NR-35 • 5 pessoas expostas", level: "ALTO", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", isCheck: false },
                    { title: "EPIs vencidos", subtitle: "NR-06 • 12 colaboradores", level: "MÉDIO", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", isCheck: false },
                    { title: "Extintor vencido", subtitle: "NR-23 • Setor Almoxarifado", level: "MÉDIO", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", isCheck: false },
                    { title: "Ventilação inadequada", subtitle: "NR-15 • Setor Solda", level: "BAIXO", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", isCheck: true },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col py-2 px-3 border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 rounded-lg transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="mt-0.5 shrink-0">
                              {item.isCheck ? <CheckCircle2 className={`w-5 h-5 ${item.color}`} /> : <AlertTriangle className={`w-5 h-5 text-[#0b0f19] ${item.color.replace('text-', 'fill-')}`} />}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">{item.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.color} ${item.bg} ${item.border} border`}>
                            {item.level}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex-1 flex items-end">
                    <div className="w-full text-center pb-2">
                       <span className="text-[10px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer transition-colors">+2 riscos em monitoramento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colaboradores em Risco List */}
              <div className="glass-panel rounded-xl flex flex-col h-[380px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                      COLABORADORES EM POSSÍVEIS RISCOS
                    </h3>
                    <a href="#" className="text-[11px] text-purple-400 hover:text-purple-300">Ver todas</a>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-none flex flex-col space-y-1">
                  {[
                    { name: "João Silva", sector: "Setor Solda", percent: 82, level: "ALTO", color: "text-red-500", bgCol: "bg-red-500/10", border: "border-red-500/20" },
                    { name: "Carlos Lima", sector: "Manutenção", percent: 65, level: "ALTO", color: "text-orange-500", bgCol: "bg-orange-500/10", border: "border-orange-500/20" },
                    { name: "Maria Santos", sector: "Produção", percent: 43, level: "MÉDIO", color: "text-yellow-500", bgCol: "bg-yellow-500/10", border: "border-yellow-500/20" },
                    { name: "Pedro Costa", sector: "Almoxarifado", percent: 28, level: "BAIXO", color: "text-emerald-500", bgCol: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { name: "Ana Paula", sector: "Adm. / Escritório", percent: 18, level: "BAIXO", color: "text-emerald-500", bgCol: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 border border-transparent hover:border-purple-500/50 hover:bg-purple-500/5 rounded-lg transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <Image src={`https://picsum.photos/seed/${item.name}/32/32`} width={32} height={32} alt={item.name} className="rounded-full bg-gray-800 border-2 border-white/10" />
                        <div>
                          <p className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">{item.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.sector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32 h-2 bg-[#121826] rounded-full overflow-hidden">
                          <div className={`h-full bg-purple-600 rounded-full`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                        <span className="text-[12px] font-medium text-gray-300 w-8 text-right">{item.percent}%</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.color} ${item.bgCol} ${item.border} border w-14 text-center`}>
                          {item.level}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Lists */}
        <div className="w-[360px] shrink-0 border-l border-white/5 bg-[#121826]/30 overflow-y-auto p-6 space-y-6 scrollbar-none">
          
          {/* Alertas Críticos */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">ALERTAS CRÍTICOS</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todos</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[
                  { title: "ASO - João Silva", desc: "Vence em 3 dias", type: "CRÍTICO", color: "text-red-500", bgDot: "bg-red-500", icon: Users },
                  { title: "Treinamento NR-35", desc: "Vence em 5 dias", type: "ALTO", color: "text-orange-500", bgDot: "bg-orange-500", icon: BookOpen },
                  { title: "CA - Equipamento", desc: "Vence em 7 dias", type: "ALTO", color: "text-orange-500", bgDot: "bg-orange-500", icon: ShieldAlert },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col group cursor-pointer relative">
                      <div className="absolute -left-2 top-1.5 w-[3px] h-0 bg-purple-500 rounded-r-full transition-all group-hover:h-5"></div>
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{item.title}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${item.color}`}>{item.type}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 ml-5.5">{item.desc}</p>
                  </div>
                ))}
              </div>
          </div>

          {/* Ações Prioritárias */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">AÇÕES PRIORITÁRIAS</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todas</a>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[
                  { title: "Regularizar EPIs vencidos", desc: "João Silva", type: "CRÍTICO", color: "text-red-500", date: "24/05", icon: ShieldAlert },
                  { title: "Treinamento NR-35", desc: "Maria Santos", type: "ALTA", color: "text-orange-500", date: "27/05", icon: BookOpen },
                  { title: "Inspeção em máquinas - NR-12", desc: "Carlos Lima", type: "ALTA", color: "text-orange-500", date: "29/05", icon: Wrench },
                  { title: "Manutenção preventiva", desc: "Ana Paula", type: "MÉDIA", color: "text-yellow-500", date: "31/05", icon: Settings },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-white/5 p-1 rounded">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors leading-tight mb-1">{item.title}</p>
                          <p className="text-[11px] text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-current ${item.color} bg-white/5`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] text-gray-600">{item.date}</span>
                      </div>
                  </div>
                ))}
              </div>
          </div>

          {/* Atividade Recente */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">ATIVIDADE RECENTE</h3>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Ver todas</a>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { title: "Inspeção realizada", desc: "Setor Produção", time: "08:45", icon: CheckCircle2, color: "text-emerald-500" },
                  { title: "Treinamento concluído", desc: "NR-06 - Uso de EPIs", time: "07:30", icon: CheckCircle2, color: "text-emerald-500" },
                  { title: "Near miss registrado", desc: "Queda de objeto", time: "Ontem", icon: AlertTriangle, color: "text-orange-500" },
                  { title: "Ação concluída", desc: "Regularização de EPIs", time: "Ontem", icon: CheckCircle2, color: "text-emerald-500" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                      <div className="flex items-start gap-3 w-full">
                        <div className="mt-0.5 opacity-80">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[11px] text-gray-500 truncate">{item.desc}</p>
                            <span className="text-[10px] text-gray-600 whitespace-nowrap ml-2">{item.time}</span>
                          </div>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:bg-purple-500 hover:scale-105 transition-all text-white border border-purple-400/30 z-50">
        <MessageSquare className="w-6 h-6" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0b0f19] rounded-full"></span>
      </button>
    </div>
  );
}
