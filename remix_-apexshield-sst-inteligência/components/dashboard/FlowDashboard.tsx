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
import { actionRequiresEvidence } from "@/lib/action-rules";
import { useAppStore } from "@/lib/store";

type RiskLike = Record<string, any>;
type ActionLike = Record<string, any>;
type InspectionLike = Record<string, any>;
type OwnerSummary = {
  owner: string;
  pendencias: number;
  riscos: number;
  acoes: number;
  inspecoes: number;
  custo: number;
};
type SectorSummary = {
  sector: string;
  score: number;
  riscos: number;
  acoes: number;
  inspecoes: number;
  custo: number;
  evidencias: number;
};
type NrSummary = {
  nr: string;
  score: number;
  riscos: number;
  multas: number;
};

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(value: unknown) {
  return stripAccents(String(value ?? "").trim().toLowerCase());
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstMeaningful(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isRiskClosed(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes("resolv") || normalized.includes("mitig") || normalized.includes("fechad");
}

function isActionClosed(status?: string) {
  const normalized = normalizeText(status);
  return (
    normalized.includes("conclu") ||
    normalized.includes("fechad") ||
    normalized.includes("cancelad")
  );
}

function isInspectionClosed(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes("realiz") || normalized.includes("conclu") || normalized.includes("anulad");
}

function isOverdue(value: unknown) {
  const parsed = parseDate(value);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

function getRiskName(risk: RiskLike) {
  return firstMeaningful(risk.titulo, risk.title, risk.atividade, risk.descricao, "Risco sem nome");
}

function getRiskSector(risk: RiskLike) {
  return firstMeaningful(risk.setor, risk.sector_id, risk.onde, "Setor nao definido");
}

function getRiskNr(risk: RiskLike) {
  return firstMeaningful(risk.nr, risk.nrRelacionada, "NR nao vinculada");
}

function getRiskOwner(risk: RiskLike) {
  return firstMeaningful(risk.responsavel, risk.validadorCorrecao, risk.executorCorrecao, "Responsavel nao definido");
}

function getRiskSeverityWeight(risk: RiskLike) {
  const normalized = normalizeText(risk.criticidade || risk.nivel || risk.level || risk.prioridade || risk.severidade);
  if (normalized.startsWith("cr") || normalized === "p1" || normalized.includes("urg")) return 4;
  if (normalized.includes("alt") || normalized === "p2") return 3;
  if (normalized.includes("med") || normalized === "p3") return 2;
  return 1;
}

function getActionName(action: ActionLike) {
  return firstMeaningful(action.oQue, action.titulo, action.title, action.descricao, "Acao sem nome");
}

function getActionSector(action: ActionLike, linkedRisk?: RiskLike, linkedInspection?: InspectionLike) {
  return firstMeaningful(
    action.onde,
    action.setor,
    action.sector_id,
    linkedRisk && getRiskSector(linkedRisk),
    linkedInspection && getInspectionSector(linkedInspection),
    "Setor nao definido",
  );
}

function getActionOwner(action: ActionLike) {
  return firstMeaningful(action.quem, action.responsavel, action.executor, action.validador, "Responsavel nao definido");
}

function getActionCost(action: ActionLike) {
  const raw = action.quantoCusta ?? action.valorEstimado ?? action.custoEstimado;
  return parseMoney(raw);
}

function getInspectionName(inspection: InspectionLike) {
  return firstMeaningful(
    inspection.titulo,
    inspection.title,
    inspection.tipoInspecao,
    inspection.checklist,
    "Inspecao sem nome",
  );
}

function getInspectionSector(inspection: InspectionLike) {
  return firstMeaningful(
    inspection.setor,
    inspection.ondeUsar,
    inspection.sector_id,
    inspection.onde,
    "Setor nao definido",
  );
}

function getInspectionOwner(inspection: InspectionLike) {
  return firstMeaningful(inspection.responsavel, inspection.inspector, "Responsavel nao definido");
}

function hasRiskEvidence(risk: RiskLike) {
  if (typeof risk.evidencias === "string") return risk.evidencias.trim().length > 0;
  if (Array.isArray(risk.evidencia)) return risk.evidencia.length > 0;
  if (Array.isArray(risk.evidencias)) return risk.evidencias.length > 0;
  return false;
}

function getActionEvidenceCount(action: ActionLike) {
  if (Array.isArray(action.evidencia)) return action.evidencia.length;
  if (Array.isArray(action.evidencias)) return action.evidencias.length;
  if (typeof action.evidencias === "string" && action.evidencias.trim()) return 1;
  return 0;
}

function getActionNr(action: ActionLike, linkedRisk?: RiskLike, linkedInspection?: InspectionLike) {
  return firstMeaningful(
    action.nr,
    action.nrRelacionada,
    linkedRisk && getRiskNr(linkedRisk),
    linkedInspection?.nr,
    "NR nao vinculada",
  );
}

function getInspectionIssueCount(inspection: InspectionLike) {
  const answers = Array.isArray(inspection.answers) ? inspection.answers : [];
  const items = Array.isArray(inspection.items) ? inspection.items : [];

  const answerIssues = answers.filter((answer) => answer?.isConform === false).length;
  const itemIssues = items.filter((item) => {
    const status = normalizeText(item?.status);
    return status.startsWith("n") || status.includes("parc") || status.includes("reprov");
  }).length;
  const declaredIssues = Number(inspection.nonConformities || 0);

  return Math.max(answerIssues + itemIssues, declaredIssues);
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

  const metrics = useMemo(() => {
    const riskMap = new Map<string, RiskLike>();
    const inspectionMap = new Map<string, InspectionLike>();

    riscos.forEach((risk) => {
      if (risk?.id) riskMap.set(String(risk.id), risk);
    });

    inspecoes.forEach((inspection) => {
      if (inspection?.id) inspectionMap.set(String(inspection.id), inspection);
    });

    const activeRisks = riscos.filter((risk) => !isRiskClosed(risk.status));
    const activeActions = acoes.filter((action) => !isActionClosed(action.status));
    const overdueActions = activeActions.filter((action) => isOverdue(action.prazo || action.quando || action.due_date));
    const overdueInspections = inspecoes.filter(
      (inspection) =>
        !isInspectionClosed(inspection.status || inspection.situacao) &&
        isOverdue(inspection.data || inspection.proximaInspecao),
    );

    const criticalActionsWithoutEvidence = activeActions.filter(
      (action) => actionRequiresEvidence(action) && getActionEvidenceCount(action) === 0,
    );
    const activeRisksWithoutEvidence = activeRisks.filter((risk) => !hasRiskEvidence(risk));

    const openRiskFines = activeRisks.reduce((total, risk) => total + Number(risk.multaEstimada || 0), 0);
    const openActionCosts = activeActions.reduce((total, action) => total + getActionCost(action), 0);
    const exposureTotal = openRiskFines + openActionCosts;

    const ownerMap = new Map<string, OwnerSummary>();
    const sectorMap = new Map<string, SectorSummary>();
    const nrMap = new Map<string, NrSummary>();

    const currentProblems: Array<{
      id: string;
      type: string;
      title: string;
      sector: string;
      owner: string;
      nr?: string;
      detail: string;
      cost: number;
      severity: number;
    }> = [];

    const registerOwner = (owner: string, payload: Partial<OwnerSummary>) => {
      const current = ownerMap.get(owner) || { owner, pendencias: 0, riscos: 0, acoes: 0, inspecoes: 0, custo: 0 };
      ownerMap.set(owner, {
        owner,
        pendencias: current.pendencias + (payload.pendencias || 0),
        riscos: current.riscos + (payload.riscos || 0),
        acoes: current.acoes + (payload.acoes || 0),
        inspecoes: current.inspecoes + (payload.inspecoes || 0),
        custo: current.custo + (payload.custo || 0),
      });
    };

    const registerSector = (sector: string, payload: Partial<SectorSummary>) => {
      const current = sectorMap.get(sector) || {
        sector,
        score: 0,
        riscos: 0,
        acoes: 0,
        inspecoes: 0,
        custo: 0,
        evidencias: 0,
      };
      sectorMap.set(sector, {
        sector,
        score: current.score + (payload.score || 0),
        riscos: current.riscos + (payload.riscos || 0),
        acoes: current.acoes + (payload.acoes || 0),
        inspecoes: current.inspecoes + (payload.inspecoes || 0),
        custo: current.custo + (payload.custo || 0),
        evidencias: current.evidencias + (payload.evidencias || 0),
      });
    };

    activeRisks.forEach((risk) => {
      const sector = getRiskSector(risk);
      const owner = getRiskOwner(risk);
      const nr = getRiskNr(risk);
      const severity = getRiskSeverityWeight(risk);
      const fine = Number(risk.multaEstimada || 0);
      const missingEvidence = hasRiskEvidence(risk) ? 0 : 1;

      registerOwner(owner, { pendencias: 1, riscos: 1, custo: fine });
      registerSector(sector, { score: severity * 3, riscos: 1, custo: fine, evidencias: missingEvidence });

      const nrCurrent = nrMap.get(nr) || { nr, score: 0, riscos: 0, multas: 0 };
      nrMap.set(nr, {
        nr,
        score: nrCurrent.score + severity * 3,
        riscos: nrCurrent.riscos + 1,
        multas: nrCurrent.multas + fine,
      });

      currentProblems.push({
        id: `risk-${risk.id}`,
        type: "Risco",
        title: getRiskName(risk),
        sector,
        owner,
        nr,
        detail: firstMeaningful(risk.origem, risk.acaoVinculada, risk.descricao, "Risco aberto sem tratamento concluido."),
        cost: fine,
        severity,
      });
    });

    activeActions.forEach((action) => {
      const linkedRisk = action.riscoId ? riskMap.get(String(action.riscoId)) : undefined;
      const linkedInspection = action.inspecaoId ? inspectionMap.get(String(action.inspecaoId)) : undefined;
      const sector = getActionSector(action, linkedRisk, linkedInspection);
      const owner = getActionOwner(action);
      const cost = getActionCost(action);
      const overdue = isOverdue(action.prazo || action.quando || action.due_date);
      const severity = overdue ? 4 : actionRequiresEvidence(action) ? 3 : 2;
      const missingEvidence = actionRequiresEvidence(action) && getActionEvidenceCount(action) === 0 ? 1 : 0;
      const nr = getActionNr(action, linkedRisk, linkedInspection);

      registerOwner(owner, { pendencias: 1, acoes: 1, custo: cost });
      registerSector(sector, {
        score: overdue ? 4 : 2,
        acoes: 1,
        custo: cost,
        evidencias: missingEvidence,
      });

      if (nr && nr !== "NR nao vinculada") {
        const nrCurrent = nrMap.get(nr) || { nr, score: 0, riscos: 0, multas: 0 };
        nrMap.set(nr, {
          nr,
          score: nrCurrent.score + (overdue ? 2 : 1),
          riscos: nrCurrent.riscos,
          multas: nrCurrent.multas,
        });
      }

      if (overdue || missingEvidence) {
        currentProblems.push({
          id: `action-${action.id}`,
          type: "Acao",
          title: getActionName(action),
          sector,
          owner,
          nr,
          detail: overdue
            ? `Prazo vencido em ${firstMeaningful(action.prazo, action.quando, action.due_date, "data nao informada")}.`
            : "Acao critica ainda sem evidencia registrada.",
          cost,
          severity,
        });
      }
    });

    inspecoes.forEach((inspection) => {
      const issueCount = getInspectionIssueCount(inspection);
      const overdue =
        !isInspectionClosed(inspection.status || inspection.situacao) &&
        isOverdue(inspection.data || inspection.proximaInspecao);
      if (!issueCount && !overdue) return;

      const sector = getInspectionSector(inspection);
      const owner = getInspectionOwner(inspection);
      const severity = overdue ? 3 : Math.min(4, Math.max(2, issueCount));

      registerOwner(owner, { pendencias: 1, inspecoes: 1 });
      registerSector(sector, { score: overdue ? 3 : issueCount * 2, inspecoes: 1 });

      currentProblems.push({
        id: `inspection-${inspection.id}`,
        type: "Inspecao",
        title: getInspectionName(inspection),
        sector,
        owner,
        nr: firstMeaningful(inspection.nr, inspection.nrRelacionada),
        detail: overdue
          ? "Inspecao vencida e ainda nao concluida."
          : `${issueCount} item(ns) nao conforme(s) identificado(s).`,
        cost: 0,
        severity,
      });
    });

    const owners = Array.from(ownerMap.values()).sort((a, b) => {
      if (b.pendencias !== a.pendencias) return b.pendencias - a.pendencias;
      return b.custo - a.custo;
    });

    const sectors = Array.from(sectorMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.custo - a.custo;
    });

    const nrs = Array.from(nrMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.multas - a.multas;
    });

    currentProblems.sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return b.cost - a.cost;
    });

    return {
      activeRisks,
      activeActions,
      overdueActions,
      overdueInspections,
      criticalActionsWithoutEvidence,
      activeRisksWithoutEvidence,
      openRiskFines,
      openActionCosts,
      exposureTotal,
      evidenceGapTotal: criticalActionsWithoutEvidence.length + activeRisksWithoutEvidence.length,
      currentProblems,
      owners,
      sectors,
      nrs,
      worstSector: sectors[0],
      topOwner: owners[0],
      topNr: nrs[0],
    };
  }, [acoes, inspecoes, riscos]);

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
                    formatter={(value: number, name: string) => {
                      if (name === "custo") return [formatCurrency(value), "Custo potencial"];
                      return [value, name];
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
                    formatter={(value: number, name: string) => {
                      if (name === "multas") return [formatCurrency(value), "Multa potencial"];
                      return [value, name];
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
