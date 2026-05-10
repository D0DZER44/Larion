"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { buildTargetCentralPageModel } from "@/lib/motor/adapters/intelligenceAdapter.js";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeInfo,
  BarChart2,
  Calendar,
  Clock,
  Download,
  FileText,
  Filter,
  History,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const CARD_ICON_MAP = {
  criticalOpen: ShieldAlert,
  overdueActions: Clock,
  delayedInspections: Calendar,
  pendingEvidence: FileText,
  recurrence: RefreshCw,
  nrCompliance: ShieldCheck,
};

const CARD_TONE_MAP = {
  critical: {
    icon: "text-red-400",
    glow: "from-red-500/20 to-transparent",
    border: "border-red-500/20",
    chip: "text-red-300 bg-red-500/10 border-red-500/20",
  },
  warning: {
    icon: "text-orange-400",
    glow: "from-orange-500/20 to-transparent",
    border: "border-orange-500/20",
    chip: "text-orange-300 bg-orange-500/10 border-orange-500/20",
  },
  success: {
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-transparent",
    border: "border-emerald-500/20",
    chip: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
  info: {
    icon: "text-blue-400",
    glow: "from-blue-500/20 to-transparent",
    border: "border-blue-500/20",
    chip: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  },
  neutral: {
    icon: "text-purple-400",
    glow: "from-purple-500/20 to-transparent",
    border: "border-purple-500/20",
    chip: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  },
};

const CENTRAL_TABS = [
  { id: "VisaoGeral", label: "Visão Geral", icon: BarChart2 },
  { id: "Diagnostico", label: "Diagnóstico", icon: Target },
  { id: "Tendencia", label: "Tendência", icon: TrendingUp },
  { id: "Gargalos", label: "Gargalos", icon: ShieldAlert },
  { id: "Historico", label: "Histórico", icon: History },
] as const;

type CentralTab = (typeof CENTRAL_TABS)[number]["id"];

function formatSignedDelta(delta: number) {
  if (delta > 0) return `+${delta.toFixed(1)}`;
  if (delta < 0) return delta.toFixed(1);
  return "0.0";
}

function formatImpact(value: number) {
  if (value > 0) return `+${value} pts`;
  if (value < 0) return `${value} pts`;
  return "0 pts";
}

function handleNavigate(path: string) {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}

function PremiumTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-[12px]">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CentralPage() {
  const storeState = useAppStore();
  const [activeTab, setActiveTab] = useState<CentralTab>("VisaoGeral");
  const model = useMemo(() => buildTargetCentralPageModel(storeState), [storeState]);

  const radarData = model.radarAxes.map((axis: any) => ({
    subject: axis.label,
    score: axis.value,
    fullMark: 100,
  }));

  const activeTabLabel = CENTRAL_TABS.find((tab) => tab.id === activeTab)?.label || "Visão Geral";
  const overviewCards = model.topCards.slice(0, 4);
  const overviewRankings = model.rankings.slice(0, 3);
  const overviewTimeline = model.timeline.slice(0, 3);
  const overviewAlerts = model.criticalAlerts.slice(0, 2);
  const firstTimeline = overviewTimeline[0];

  const renderExecutiveSection = () => (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%)]" />
      <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-6 md:grid-cols-[220px,1fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
              <Target className="h-4 w-4 text-purple-400" />
              Score SST
            </div>
            <div className="mt-5 text-6xl font-black tracking-tight text-white">{model.executive.score}</div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  model.executive.delta >= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {formatSignedDelta(model.executive.delta)} vs mes anterior
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">{model.executive.level}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">Resumo executivo</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Gargalo principal: {model.executive.bottleneck}</h2>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-[#121826] px-4 py-3 text-right md:block">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Motor base</p>
                <p className="mt-1 text-xl font-bold text-white">{model.executive.engineScore}</p>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300">{model.executive.summary}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">Maior fricção</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">{model.executive.scoreLabel}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">Leitura do período</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">
                  Radar consolidado com tendência mensal, gargalos operacionais e impacto dos eventos no score.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {model.criticalAlerts.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Alertas críticos</p>
              <p className="mt-4 text-sm leading-6 text-gray-300">Sem alertas críticos gerados pelo motor neste momento.</p>
            </div>
          ) : (
            model.criticalAlerts.map((alert: any) => (
              <div key={alert.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300">{alert.level}</p>
                    <h3 className="mt-1 text-sm font-bold text-white">{alert.titulo}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{alert.descricao}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );

  const renderOverviewPulseSection = () => (
    <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <div className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Painel de maturidade</p>
            <h2 className="mt-2 text-xl font-bold text-white">Radar resumido dos eixos críticos</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300">
            Score atual: <span className="font-bold text-white">{model.executive.score}</span>
          </div>
        </div>

        <div className="h-[320px] rounded-[24px] border border-white/10 bg-[#111827]/70 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(148,163,184,0.18)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
              <Radar
                name="Maturidade"
                dataKey="score"
                stroke="#a855f7"
                fill="rgba(168,85,247,0.28)"
                fillOpacity={1}
                strokeWidth={2.5}
              />
              <Tooltip content={<PremiumTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Tendência consolidada</p>
            <h2 className="mt-2 text-xl font-bold text-white">Resumo mensal do score e da pressão operacional</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300">
            Base: {model.trend.latestLabel}
          </div>
        </div>

        <div className="h-[320px] rounded-[24px] border border-white/10 bg-[#111827]/70 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={model.trend.series}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="count" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<PremiumTooltip />} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              <Line yAxisId="score" type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ r: 3 }} name="Score" />
              <Line yAxisId="score" type="monotone" dataKey="conformidadeNr" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} name="Conformidade NR" />
              <Line yAxisId="count" type="monotone" dataKey="riscosCríticos" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2 }} name="Riscos críticos" />
              <Line yAxisId="count" type="monotone" dataKey="acoesVencidas" stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2 }} name="Ações vencidas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );

  const renderTopCardsSection = (cards = model.topCards, compact = false) => (
    <section className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-${compact ? "2" : "3"}`}>
      {cards.map((card: any) => {
        const Icon = CARD_ICON_MAP[card.id as keyof typeof CARD_ICON_MAP] || Activity;
        const tone = CARD_TONE_MAP[card.tone as keyof typeof CARD_TONE_MAP] || CARD_TONE_MAP.neutral;

        return (
          <button
            key={card.id}
            onClick={() => handleNavigate(card.href)}
            className={`group relative overflow-hidden rounded-[22px] border bg-[#0b0f19]/80 ${compact ? "p-4" : "p-5"} text-left shadow-xl shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/20 ${tone.border}`}
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tone.glow}`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] ${tone.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-300">{card.label}</p>
              <div className={`${compact ? "mt-2 text-3xl" : "mt-3 text-4xl"} font-black tracking-tight text-white`}>{card.value}</div>
              <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${tone.chip}`}>
                {card.sub}
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );

  const renderRadarSection = () => (
    <section className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
      <div className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Radar principal</p>
            <h2 className="mt-2 text-xl font-bold text-white">Eixos de maturidade operacional</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300">
            Score medio atual: <span className="font-bold text-white">{model.executive.score}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="h-[360px] rounded-[24px] border border-white/10 bg-[#111827]/70 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.18)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <Radar
                  name="Maturidade"
                  dataKey="score"
                  stroke="#a855f7"
                  fill="rgba(168,85,247,0.28)"
                  fillOpacity={1}
                  strokeWidth={2.5}
                />
                <Tooltip content={<PremiumTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {model.radarAxes.map((axis: any) => (
              <div key={axis.key} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{axis.label}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{axis.detail}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{axis.value}</div>
                    <div className="mt-1 h-2.5 w-24 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400"
                        style={{ width: `${axis.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Diagnóstico automático</p>
        <h2 className="mt-2 text-xl font-bold text-white">Leitura orientada pelo motor</h2>

        <div className="mt-6 space-y-4">
          {[
            { key: "strength", icon: TrendingUp, tone: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
            { key: "weakness", icon: TrendingDown, tone: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
            { key: "hiddenRisk", icon: AlertTriangle, tone: "text-red-400 border-red-500/20 bg-red-500/5" },
            { key: "recommendedAction", icon: Zap, tone: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
          ].map((item) => {
            const content = model.diagnosis[item.key as keyof typeof model.diagnosis] as any;
            const Icon = item.icon;

            return (
              <div key={item.key} className={`rounded-[22px] border p-4 ${item.tone}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{content.label}</p>
                    <h3 className="mt-2 text-sm font-bold text-white">{content.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{content.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  const renderTrendSection = () => (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Tendência mensal</p>
          <h2 className="mt-2 text-xl font-bold text-white">Evolução do radar de maturidade</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300">
          Base: {model.trend.latestLabel} e 5 meses anteriores
        </div>
      </div>

      <div className="h-[380px] rounded-[24px] border border-white/10 bg-[#111827]/70 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.trend.series}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="count" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip content={<PremiumTooltip />} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            <Line yAxisId="score" type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} name="Score de maturidade" />
            <Line yAxisId="score" type="monotone" dataKey="conformidadeNr" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} name="Conformidade NR" />
            <Line yAxisId="count" type="monotone" dataKey="riscosCríticos" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Riscos críticos" />
            <Line yAxisId="count" type="monotone" dataKey="acoesVencidas" stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Ações vencidas" />
            <Line yAxisId="count" type="monotone" dataKey="evidenciasPendentes" stroke="#eab308" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Evidências pendentes" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );

  const renderRankingsSection = () => (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Ranking de gargalos</p>
      <h2 className="mt-2 text-xl font-bold text-white">Onde o score está travando</h2>

      <div className="mt-6 space-y-3">
        {model.rankings.map((item: any, index: number) => (
          <div key={item.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#121826] text-sm font-black text-purple-300">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                <h3 className="mt-1 text-sm font-bold text-white">{item.value}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.meta}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {model.automaticInsights.length > 0 && (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Insights auxiliares</p>
          <div className="mt-4 space-y-3">
            {model.automaticInsights.map((insight: any) => (
              <div key={insight.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">{insight.titulo}</p>
                <p className="mt-1 text-sm leading-6 text-gray-400">{insight.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );

  const renderTimelineSection = () => (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Linha do tempo inteligente</p>
      <h2 className="mt-2 text-xl font-bold text-white">Inspeção, risco, ação, prazo e evidência conectados ao score</h2>

      {model.timeline.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-sm font-medium text-gray-300">Sem eventos relevantes suficientes para montar a timeline.</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Assim que inspecoes, riscos e acoes gerarem logs operacionais, a linha do tempo passa a explicar o impacto no score.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {model.timeline.map((event: any, index: number) => (
            <div key={event.id} className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              {index !== model.timeline.length - 1 && (
                <span className="absolute bottom-[-18px] left-8 top-[52px] w-px bg-gradient-to-b from-purple-500/40 to-transparent" />
              )}
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#121826]">
                  <BadgeInfo className="h-5 w-5 text-purple-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-300">
                          {event.stage}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                            event.impact >= 0
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-500/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {formatImpact(event.impact)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-white">{event.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{event.description}</p>
                    </div>
                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Cadeia</p>
                      <div className="mt-2 flex flex-wrap gap-2 md:justify-end">
                        {event.chain.map((step: string) => (
                          <span key={step} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-gray-300">
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => handleNavigate(event.href)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 transition-colors hover:text-purple-200"
                    >
                      Ver detalhe <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {renderExecutiveSection()}
      {renderOverviewPulseSection()}

      <section className="rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Resumo operacional</p>
            <h2 className="mt-2 text-xl font-bold text-white">Principais sinais do radar agora</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300">
            {model.executive.summary}
          </div>
        </div>

        {renderTopCardsSection(overviewCards, true)}

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Maiores travas</p>
                <h3 className="mt-2 text-lg font-bold text-white">Top gargalos do ciclo</h3>
              </div>
              <button
                onClick={() => setActiveTab("Gargalos")}
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 transition-colors hover:text-purple-200"
              >
                Abrir aba <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {overviewRankings.map((item: any, index: number) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#121826] text-sm font-black text-purple-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{item.label}</p>
                      <h4 className="mt-1 text-sm font-bold text-white">{item.value}</h4>
                      <p className="mt-1 text-sm leading-6 text-gray-400">{item.meta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Últimos impactos</p>
                <h3 className="mt-2 text-lg font-bold text-white">Eventos que mexeram no score</h3>
              </div>
              <button
                onClick={() => setActiveTab("Historico")}
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 transition-colors hover:text-purple-200"
              >
                Abrir aba <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {overviewTimeline.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-gray-400">
                Sem movimentos recentes suficientes para resumir a linha do tempo neste momento.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {overviewTimeline.map((event: any) => (
                  <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-300">
                        {event.stage}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                          event.impact >= 0
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-red-500/20 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {formatImpact(event.impact)}
                      </span>
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-white">{event.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{event.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Leitura do motor</p>
            <div className="mt-4 grid gap-3">
              {[
                model.diagnosis.strength,
                model.diagnosis.weakness,
                model.diagnosis.hiddenRisk,
                model.diagnosis.recommendedAction,
              ].map((item: any) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-purple-300">{item.label}</p>
                  <h4 className="mt-2 text-sm font-bold text-white">{item.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Sinais de atenção</p>
            <div className="mt-4 grid gap-3">
              {overviewAlerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-bold text-emerald-300">Sem alertas críticos abertos</p>
                  <p className="mt-1 text-sm leading-6 text-gray-300">O motor não identificou alertas urgentes adicionais para esta janela.</p>
                </div>
              ) : (
                overviewAlerts.map((alert: any) => (
                  <div key={alert.id} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">{alert.level}</p>
                    <h4 className="mt-2 text-sm font-bold text-white">{alert.titulo}</h4>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{alert.descricao}</p>
                  </div>
                ))
              )}

              {firstTimeline && (
                <button
                  onClick={() => handleNavigate(firstTimeline.href)}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Próximo detalhe útil</p>
                  <h4 className="mt-2 text-sm font-bold text-white">{firstTimeline.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-gray-400">{firstTimeline.description}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-purple-300">
                    Ver detalhe <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Diagnostico":
        return (
          <div className="space-y-6">
            {renderTopCardsSection()}
            {renderRadarSection()}
          </div>
        );
      case "Tendencia":
        return renderTrendSection();
      case "Gargalos":
        return renderRankingsSection();
      case "Historico":
        return renderTimelineSection();
      case "VisaoGeral":
      default:
        return renderOverviewSection();
    }
  };

  return (
    <div className="min-h-screen bg-[#03060e] text-white">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col p-4 md:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-900/30 shadow-[0_0_30px_rgba(124,58,237,0.18)]">
              <BarChart2 className="h-7 w-7 text-purple-400" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-purple-300/80">
              <span>Central de inteligência</span>
                <span className="text-white/20">&gt;</span>
                <span className="text-white/90">{activeTabLabel}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Radar de Maturidade SST</h1>
              <p className="mt-1 text-sm text-gray-400">Leitura executiva da maturidade operacional em segurança do trabalho.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-[#0b0f19]/80 px-4 py-2.5 text-sm font-medium text-gray-300 backdrop-blur-xl">
              Últimos 6 meses
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/80 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5">
              <Filter className="h-4 w-4" /> Filtros
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/80 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5">
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button
              onClick={() => handleNavigate("/operacao/riscos")}
              className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-600/90 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-colors hover:bg-purple-600"
            >
              Abrir operação <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {!model.hasOperationalData ? (
          <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0f19]/85 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_35%)]" />
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-500/20 bg-purple-500/10">
                <Target className="h-10 w-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">Radar aguardando base operacional</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">
                Esta central passa a ler dados reais de inspecoes, riscos, acoes, evidencias, prazos, responsaveis e NRs.
                Assim que o fluxo operacional gerar registros, o radar calcula score, tendência, gargalos e diagnósticos automaticamente.
              </p>
              <div className="mt-8 grid w-full gap-4 md:grid-cols-3">
                {[
                  { title: "Inspeções", description: "Planejamento e execução alimentam prevenção e conformidade.", href: "/operacao/inspecoes" },
                  { title: "Riscos", description: "Criticidade e reincidência ajustam o score mensal.", href: "/operacao/riscos" },
                  { title: "Ações", description: "Prazo, evidência e disciplina fecham o ciclo de maturidade.", href: "/operacao/acoes" },
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.href)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-6 flex bg-[#0f172a]/80 p-1.5 rounded-2xl border border-slate-400/20 shrink-0 self-start w-full sm:w-auto overflow-x-auto gap-1">
              {CENTRAL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {renderTabContent()}
          </>
        )}
      </main>
    </div>
  );
}
