"use client";

import Link from "next/link";
import { useMemo, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Camera,
  ClipboardList,
  HardHat,
  ShieldAlert,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "@/lib/store";
import { dashboardMetricsService } from "@/src/services/dashboardMetricsService";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "slate" | "amber" | "red" | "blue" | "emerald";
  detail?: string;
}) {
  const toneClass = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-3 text-2xl font-semibold leading-tight">{value}</p>
          {detail ? <p className="mt-2 text-sm opacity-75">{detail}</p> : null}
        </div>
        <div className="rounded-2xl border border-current/10 bg-white/60 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function FlowDashboard() {
  const { riscos = [], acoes = [], inspecoes = [] } = useAppStore();

  const metrics = useMemo(
    () => dashboardMetricsService.fromLegacyRuntime({ riscos, acoes, inspecoes }),
    [acoes, inspecoes, riscos]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fff 40%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Dashboard do fluxo</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A operacao aparece aqui como consequencia do que foi inspecionado, do risco que ficou aberto e da acao
                que ainda precisa sair do papel.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Esta leitura usa apenas <strong>inspecoes</strong>, <strong>riscos</strong> e <strong>acoes</strong>.
                Nada aqui vem de recomendacao solta, pacote ou widget paralelo.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/operacao/inspecoes"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Inspecoes
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/operacao/riscos"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Riscos
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/operacao/acoes"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Acoes
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/operacao/incidentes"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Incidentes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">O que esta errado agora?</p>
              {metrics.currentProblems.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {metrics.currentProblems.slice(0, 3).map((problem) => (
                    <div key={problem.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {problem.type}: {problem.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{problem.detail}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {problem.sector}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Quem age: {problem.owner}</span>
                        {problem.nr ? <span>{problem.nr}</span> : null}
                        {problem.cost > 0 ? <span>Custo: {formatCurrency(problem.cost)}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  Nenhum problema aberto foi encontrado no fluxo agora.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={ShieldAlert}
            label="O que esta errado agora?"
            value={`${metrics.currentProblems.length} pendencias reais`}
            tone="red"
            detail={`${metrics.activeRisks.length} riscos abertos, ${metrics.overdueActions.length} acoes vencidas, ${metrics.overdueInspections.length} inspecoes atrasadas.`}
          />
          <StatCard
            icon={HardHat}
            label="Quem precisa agir?"
            value={metrics.topOwner ? metrics.topOwner.owner : "Sem responsavel pendente"}
            tone="amber"
            detail={
              metrics.topOwner
                ? `${metrics.topOwner.pendencias} pendencias no fluxo.`
                : "Nenhuma pessoa com pendencia aberta agora."
            }
          />
          <StatCard
            icon={TriangleAlert}
            label="Qual setor esta pior?"
            value={metrics.worstSector ? metrics.worstSector.sector : "Sem setor critico"}
            tone="slate"
            detail={
              metrics.worstSector
                ? `${metrics.worstSector.riscos} riscos, ${metrics.worstSector.acoes} acoes e ${metrics.worstSector.inspecoes} inspecoes com desvio.`
                : "Nenhum setor com desvio aberto."
            }
          />
          <StatCard
            icon={BadgeAlert}
            label="Qual NR mais preocupa?"
            value={metrics.topNr ? metrics.topNr.nr : "Sem NR dominante"}
            tone="blue"
            detail={
              metrics.topNr
                ? `${metrics.topNr.riscos} risco(s) aberto(s) e ${formatCurrency(metrics.topNr.multas)} em multa potencial.`
                : "Nenhuma NR com risco aberto agora."
            }
          />
          <StatCard
            icon={Wallet}
            label="Quanto isso pode custar?"
            value={formatCurrency(metrics.exposureTotal)}
            tone="red"
            detail={`${formatCurrency(metrics.openRiskFines)} em multas estimadas e ${formatCurrency(metrics.openActionCosts)} em custo de execucao.`}
          />
          <StatCard
            icon={Camera}
            label="Evidencias pendentes"
            value={`${metrics.evidenceGapTotal} lacunas`}
            tone="amber"
            detail={`${metrics.criticalActionsWithoutEvidence.length} acoes criticas sem evidencia e ${metrics.activeRisksWithoutEvidence.length} riscos sem evidencias registradas.`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Setores mais pressionados</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Qual setor esta pior agora</h2>
              </div>
              <ClipboardList className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sectors.slice(0, 6)} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="sector" tickLine={false} axisLine={false} fontSize={12} interval={0} angle={-12} textAnchor="end" height={48} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(value: number | string | undefined, name: string) => {
                      if (name === "custo") return [formatCurrency(Number(value) || 0), "Custo potencial"];
                      return [Number(value) || 0, name];
                    }}
                    contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                  />
                  <Bar dataKey="score" name="Pressao do setor" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quem precisa agir</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Responsaveis com mais pendencias</h2>
            <div className="mt-5 space-y-3">
              {metrics.owners.length > 0 ? (
                metrics.owners.slice(0, 6).map((owner) => (
                  <div key={owner.owner} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{owner.owner}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {owner.riscos} riscos, {owner.acoes} acoes, {owner.inspecoes} inspecoes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-950">{owner.pendencias}</p>
                        <p className="text-xs text-slate-500">pendencias</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Impacto economico sob responsabilidade: {formatCurrency(owner.custo)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  Nenhum responsavel com fila aberta neste momento.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">NRs mais expostas</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Qual NR mais preocupa</h2>
              </div>
              <AlertTriangle className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.nrs.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis dataKey="nr" type="category" tickLine={false} axisLine={false} fontSize={12} width={80} />
                  <Tooltip
                    formatter={(value: number | string | undefined, name: string) => {
                      if (name === "multas") return [formatCurrency(Number(value) || 0), "Multa potencial"];
                      return [Number(value) || 0, name];
                    }}
                    contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                  />
                  <Bar dataKey="score" name="Indice de preocupacao" fill="#f97316" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Fila real do fluxo</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Problemas abertos agora</h2>
            <div className="mt-5 space-y-3">
              {metrics.currentProblems.length > 0 ? (
                metrics.currentProblems.slice(0, 8).map((problem) => (
                  <div key={problem.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">
                        {problem.type}: {problem.title}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {problem.sector}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{problem.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Responsavel: {problem.owner}</span>
                      {problem.nr ? <span>{problem.nr}</span> : null}
                      {problem.cost > 0 ? <span>Custo: {formatCurrency(problem.cost)}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  O fluxo nao tem problemas pendentes agora.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
