"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FolderKanban,
  History,
  Link2,
  ShieldCheck,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { actionRequiresEvidence } from "@/lib/action-rules";
import { useAppStore } from "@/lib/store";

type RecordLike = Record<string, any>;
type ReportId = "inspecao" | "riscos-acoes" | "executivo" | "portal-cliente" | "pgr-vivo";

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(value: unknown) {
  return stripAccents(String(value ?? "").trim().toLowerCase());
}

function firstMeaningful(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
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

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: unknown) {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleDateString("pt-BR") : "-";
}

function formatDateTime(value: unknown) {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString("pt-BR") : "-";
}

function displayDate(value: unknown) {
  const formatted = formatDate(value);
  return formatted === "-" ? "" : formatted;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  const label = parsed.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isSameMonth(month: string, ...values: unknown[]) {
  return values.some((value) => {
    if (typeof value === "string" && value.startsWith(month)) return true;
    const parsed = parseDate(value);
    if (!parsed) return false;
    const itemMonth = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    return itemMonth === month;
  });
}

function isClosedRisk(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes("mitig") || normalized.includes("resolv") || normalized.includes("fechad");
}

function isClosedAction(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes("conclu") || normalized.includes("fechad") || normalized.includes("cancelad");
}

function isClosedInspection(status?: string) {
  const normalized = normalizeText(status);
  return normalized.includes("conclu") || normalized.includes("realiz") || normalized.includes("anulad");
}

function riskSeverityScore(risk: RecordLike) {
  const normalized = normalizeText(risk.criticidade || risk.nivel || risk.level || risk.prioridade || risk.severidade);
  if (normalized.startsWith("cr") || normalized === "p1" || normalized.includes("urg")) return 4;
  if (normalized.includes("alt") || normalized === "p2") return 3;
  if (normalized.includes("med") || normalized === "p3") return 2;
  return 1;
}

function riskName(risk: RecordLike) {
  return firstMeaningful(risk.titulo, risk.title, risk.atividade, risk.descricao, "Risco sem nome");
}

function riskSector(risk: RecordLike) {
  return firstMeaningful(risk.setor, risk.sector_id, risk.onde, "Setor nao definido");
}

function riskNr(risk: RecordLike) {
  return firstMeaningful(risk.nr, risk.nrRelacionada, "NR nao vinculada");
}

function riskOwner(risk: RecordLike) {
  return firstMeaningful(risk.responsavel, risk.validadorCorrecao, risk.executorCorrecao, "Responsavel nao definido");
}

function riskFine(risk: RecordLike) {
  return parseMoney(risk.multaEstimada ?? risk.multaEstimativaMax ?? risk.multaEstimativaMin);
}

function actionName(action: RecordLike) {
  return firstMeaningful(action.oQue, action.titulo, action.title, action.descricao, "Acao sem nome");
}

function actionOwner(action: RecordLike) {
  return firstMeaningful(action.quem, action.responsavel, action.executor, action.validador, "Responsavel nao definido");
}

function actionSector(action: RecordLike, linkedRisk?: RecordLike, linkedInspection?: RecordLike) {
  return firstMeaningful(
    action.onde,
    action.setor,
    action.sector_id,
    linkedRisk && riskSector(linkedRisk),
    linkedInspection && inspectionSector(linkedInspection),
    "Setor nao definido",
  );
}

function actionWhy(action: RecordLike, linkedRisk?: RecordLike) {
  return firstMeaningful(
    action.porQue,
    action.justificativa,
    linkedRisk && `Tratar o risco ${riskName(linkedRisk).toLowerCase()}.`,
    "Eliminar ou reduzir a exposicao operacional identificada.",
  );
}

function actionCost(action: RecordLike) {
  return parseMoney(action.quantoCusta ?? action.valorEstimado ?? action.custoEstimado);
}

function inspectionName(inspection: RecordLike) {
  return firstMeaningful(inspection.titulo, inspection.title, inspection.nome, inspection.tipoInspecao, inspection.checklist, "Inspecao");
}

function inspectionChecklist(inspection: RecordLike) {
  return firstMeaningful(inspection.checklist, inspection.tipoInspecao, inspection.titulo, "Checklist nao informado");
}

function inspectionSector(inspection: RecordLike) {
  return firstMeaningful(inspection.setor, inspection.ondeUsar, inspection.sector_id, inspection.onde, "Setor nao definido");
}

function inspectionOwner(inspection: RecordLike) {
  return firstMeaningful(inspection.responsavel, inspection.inspector, "Responsavel nao definido");
}

function inspectionStatus(inspection: RecordLike) {
  return firstMeaningful(inspection.status, inspection.situacao, "Pendente");
}

function evidenceEntries(source: RecordLike, label: string) {
  const entries: Array<{ source: string; title: string; description: string; url?: string }> = [];

  if (Array.isArray(source?.evidencia)) {
    source.evidencia.forEach((item: RecordLike, index: number) => {
      entries.push({
        source: label,
        title: firstMeaningful(item.nomeArquivo, item.referencia, `Evidencia ${index + 1}`),
        description: firstMeaningful(item.descricao, item.baseadoEm, item.referencia, "Registro de evidencia."),
        url: firstMeaningful(item.url, item.fileUrl),
      });
    });
  }

  if (Array.isArray(source?.evidencias)) {
    source.evidencias.forEach((item: RecordLike, index: number) => {
      if (typeof item === "string") {
        entries.push({
          source: label,
          title: `Evidencia ${index + 1}`,
          description: item,
          url: item.startsWith("http") ? item : undefined,
        });
        return;
      }

      entries.push({
        source: label,
        title: firstMeaningful(item?.nomeArquivo, item?.referencia, `Evidencia ${index + 1}`),
        description: firstMeaningful(item?.descricao, item?.baseadoEm, item?.referencia, "Registro de evidencia."),
        url: firstMeaningful(item?.url, item?.fileUrl),
      });
    });
  }

  if (typeof source?.evidencias === "string" && source.evidencias.trim()) {
    entries.push({
      source: label,
      title: "Registro textual",
      description: source.evidencias,
    });
  }

  if (Array.isArray(source?.fotos)) {
    source.fotos.forEach((item: string, index: number) => {
      entries.push({
        source: label,
        title: `Foto ${index + 1}`,
        description: "Foto registrada no fluxo.",
        url: item,
      });
    });
  }

  return entries;
}

function inspectionItems(inspection: RecordLike) {
  if (Array.isArray(inspection.answers) && inspection.answers.length > 0) {
    return inspection.answers.map((answer: RecordLike, index: number) => {
      const nonConform = answer?.isConform === false;
      return {
        id: firstMeaningful(answer.questionId, answer.id, `answer-${index}`),
        title: firstMeaningful(answer.question, answer.text, `Item ${index + 1}`),
        status: nonConform ? "Nao conforme" : "Conforme",
        nonConform,
        nr: firstMeaningful(answer.nr, answer.nrRelacionada),
        action: firstMeaningful(answer.acaoSugerida),
        response: firstMeaningful(answer.value, answer.status, nonConform ? "Nao" : "Sim"),
      };
    });
  }

  if (Array.isArray(inspection.items) && inspection.items.length > 0) {
    return inspection.items.map((item: RecordLike, index: number) => {
      const normalized = normalizeText(item?.status);
      const nonConform = normalized.startsWith("n") || normalized.includes("parc") || normalized.includes("reprov");
      return {
        id: firstMeaningful(item.id, `item-${index}`),
        title: firstMeaningful(item.text, item.question, `Item ${index + 1}`),
        status: firstMeaningful(item.status, nonConform ? "Nao conforme" : "Conforme"),
        nonConform,
        nr: firstMeaningful(item.nr, item.nrRelacionada),
        action: firstMeaningful(item.acaoSugerida),
        response: firstMeaningful(item.status),
      };
    });
  }

  return [];
}

function reportSignature(company: string, owner: string, validator: string) {
  return [
    { title: "Responsavel pela inspecao", value: owner || "Pendente" },
    { title: "Validacao tecnica", value: validator || "Pendente" },
    { title: "Empresa", value: company || "Nao informada" },
  ];
}

function ReportCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: string; tone?: "slate" | "red" | "amber" | "emerald" | "blue" }) {
  const toneClass = {
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  }[tone];

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function InspectionReport({
  inspection,
  linkedRisks,
  linkedActions,
  companyName,
}: {
  inspection: RecordLike | null;
  linkedRisks: RecordLike[];
  linkedActions: RecordLike[];
  companyName: string;
}) {
  if (!inspection) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">Selecione uma inspecao para montar o relatorio.</p>
      </div>
    );
  }

  const items = inspectionItems(inspection);
  const nonConformItems = items.filter((item) => item.nonConform);
  const evidence = [
    ...evidenceEntries(inspection, "Inspecao"),
    ...linkedRisks.flatMap((risk) => evidenceEntries(risk, "Risco")),
    ...linkedActions.flatMap((action) => evidenceEntries(action, "Acao")),
  ];
  const totalFine = linkedRisks.reduce((sum, risk) => sum + riskFine(risk), 0);
  const nrs = Array.from(new Set([...nonConformItems.map((item) => item.nr), ...linkedRisks.map((risk) => riskNr(risk))].filter(Boolean)));
  const validator = firstMeaningful(
    inspection.validador,
    linkedActions.find((action) => firstMeaningful(action.validador))?.validador,
    linkedRisks.find((risk) => firstMeaningful(risk.validadorCorrecao, risk.responsavel))?.validadorCorrecao,
  );
  const signatures = reportSignature(companyName, inspectionOwner(inspection), validator);

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Relatorio de inspecao</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{inspectionName(inspection)}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              O cliente enxerga valor aqui porque a inspecao deixa de ser checklist isolado e vira prova concreta do que foi achado,
              do risco que nasceu e da acao corretiva que precisa acontecer.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p><strong>Gerado em:</strong> {formatDateTime(new Date().toISOString())}</p>
            <p className="mt-2"><strong>Status:</strong> {inspectionStatus(inspection)}</p>
            <p className="mt-2"><strong>Multa estimada:</strong> {formatCurrency(totalFine)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={FileText} title="Empresa" value={companyName || "Nao informada"} detail="Emissao vinculada a organizacao cadastrada." />
        <ReportCard icon={ClipboardCheck} title="Checklist" value={inspectionChecklist(inspection)} detail={`Setor: ${inspectionSector(inspection)}`} />
        <ReportCard icon={AlertTriangle} title="Itens nao conformes" value={String(nonConformItems.length)} detail={`${linkedRisks.length} risco(s) e ${linkedActions.length} acao(oes) gerados pelo fluxo.`} />
        <ReportCard icon={Wallet} title="Multa estimada" value={formatCurrency(totalFine)} detail={`${nrs.length} NR(s) relacionadas neste relatorio.`} />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <SectionHeader
          eyebrow="Cabecalho auditavel"
          title="Dados que o cliente precisa ver de primeira"
          text="Empresa, setor, data, checklist, responsavel e prazo aparecem logo no inicio para a leitura ficar comercial e defensavel ao mesmo tempo."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Empresa", value: companyName || "-" },
            { label: "Setor", value: inspectionSector(inspection) },
            { label: "Data", value: formatDate(inspection.data || inspection.criadoEm) },
            { label: "Checklist", value: inspectionChecklist(inspection) },
            { label: "Responsavel", value: inspectionOwner(inspection) },
            { label: "Prazo / proxima data", value: firstMeaningful(displayDate(inspection.proximaInspecao), displayDate(inspection.prazo), "-") },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <SectionHeader
          eyebrow="Nao conformidades"
          title="Itens nao conformes que justificam o valor da inspecao"
          text="Cada desvio mostra o item, a resposta, a NR associada e a tratativa sugerida. Isso ajuda o cliente a entender exatamente o que foi encontrado."
        />
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Resposta</th>
                <th className="px-4 py-3 font-semibold">NR</th>
                <th className="px-4 py-3 font-semibold">Tratativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {nonConformItems.length > 0 ? (
                nonConformItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-4 text-slate-600">{item.response || item.status}</td>
                    <td className="px-4 py-4 text-slate-600">{item.nr || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{item.action || "Gerar acao corretiva vinculada."}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">Nenhum item nao conforme registrado nesta inspecao.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Fotos e evidencias"
            title="Prova visual e rastreabilidade"
            text="Se houver foto ou evidencia, ela aparece aqui. Se nao houver, o relatorio evidencia essa lacuna para o cliente entender o risco documental."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {evidence.length > 0 ? (
              evidence.slice(0, 6).map((item, index) => (
                <div key={`${item.source}-${index}`} className="overflow-hidden rounded-3xl border border-slate-200">
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <Badge tone="blue">{item.source}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 sm:col-span-2">
                Nenhuma foto ou evidencia foi registrada ainda. Para inspecoes criticas, isso reduz a forca comercial e a defensabilidade do relatorio.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Riscos gerados"
              title="O risco nasce da inspecao e fica rastreavel"
              text="Aqui o cliente enxerga claramente quais riscos foram gerados, a NR afetada, o responsavel e o passivo potencial."
            />
            <div className="mt-6 space-y-4">
              {linkedRisks.length > 0 ? (
                linkedRisks.map((risk) => (
                  <div key={risk.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{riskName(risk)}</p>
                        <p className="mt-1 text-sm text-slate-600">{riskSector(risk)} | {riskNr(risk)}</p>
                      </div>
                      <Badge tone={riskSeverityScore(risk) >= 4 ? "red" : riskSeverityScore(risk) >= 3 ? "amber" : "slate"}>
                        {firstMeaningful(risk.criticidade, risk.nivel, risk.prioridade, "Risco aberto")}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p><strong>Responsavel:</strong> {riskOwner(risk)}</p>
                      <p><strong>Status:</strong> {firstMeaningful(risk.status, "Aberto")}</p>
                      <p><strong>Acao vinculada:</strong> {firstMeaningful(risk.acaoVinculada, "Gerar plano corretivo")}</p>
                      <p><strong>Multa estimada:</strong> {formatCurrency(riskFine(risk))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Nenhum risco gerado foi relacionado diretamente a esta inspecao ainda.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Acoes corretivas"
              title="Quem faz o que, ate quando e quanto custa"
              text="O relatorio ja entrega o plano corretivo amarrado em 5W2H para o cliente sair da reuniao sabendo onde esta o valor."
            />
            <div className="mt-6 space-y-4">
              {linkedActions.length > 0 ? (
                linkedActions.map((action) => (
                  <div key={action.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{actionName(action)}</p>
                        <p className="mt-1 text-sm text-slate-600">{actionWhy(action, linkedRisks.find((risk) => risk.id === action.riscoId))}</p>
                      </div>
                      <Badge tone={actionRequiresEvidence(action) ? "red" : "slate"}>{firstMeaningful(action.status, "Pendente")}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p><strong>Onde:</strong> {actionSector(action, linkedRisks.find((risk) => risk.id === action.riscoId), inspection)}</p>
                      <p><strong>Quem:</strong> {actionOwner(action)}</p>
                      <p><strong>Quando:</strong> {firstMeaningful(action.quando, action.prazo, formatDate(action.due_date), "-")}</p>
                      <p><strong>Quanto custa:</strong> {formatCurrency(actionCost(action))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Nenhuma acao corretiva vinculada foi encontrada para esta inspecao.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <SectionHeader
          eyebrow="Assinatura e validacao"
          title="Fechamento tecnico do relatorio"
          text="O relatorio termina com responsabilidade clara, validacao e NRs relacionadas, reforcando confianca comercial e juridica."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {nrs.length > 0 ? nrs.map((nr) => <Badge key={nr} tone="blue">{nr}</Badge>) : <Badge tone="slate">Sem NR relacionada</Badge>}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {signatures.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.title}</p>
              <p className="mt-10 border-t border-slate-300 pt-3 text-sm font-medium text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RisksActionsReport({
  risks,
  actions,
  companyName,
  periodLabel,
}: {
  risks: RecordLike[];
  actions: RecordLike[];
  companyName: string;
  periodLabel: string;
}) {
  const openRisks = risks.filter((risk) => !isClosedRisk(risk.status));
  const openActions = actions.filter((action) => !isClosedAction(action.status));
  const totalFine = openRisks.reduce((sum, risk) => sum + riskFine(risk), 0);
  const totalActionCost = openActions.reduce((sum, action) => sum + actionCost(action), 0);
  const groupedBySector = Array.from(
    openRisks.reduce((map, risk) => {
      const key = riskSector(risk);
      const current = map.get(key) || { sector: key, risks: 0, actions: 0, fine: 0 };
      current.risks += 1;
      current.fine += riskFine(risk);
      map.set(key, current);
      return map;
    }, new Map<string, { sector: string; risks: number; actions: number; fine: number }>()),
  )
    .map(([, value]) => ({
      ...value,
      actions: openActions.filter((action) => actionSector(action) === value.sector).length,
    }))
    .sort((a, b) => b.risks - a.risks || b.fine - a.fine);

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Relatorio de riscos e acoes</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Riscos abertos e resposta corretiva do periodo</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              O cliente entende valor quando ve o problema, a resposta e o custo lado a lado. Este relatorio mostra exatamente isso.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p><strong>Empresa:</strong> {companyName || "Nao informada"}</p>
            <p className="mt-2"><strong>Periodo:</strong> {periodLabel}</p>
            <p className="mt-2"><strong>Gerado em:</strong> {formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={Shield} title="Riscos abertos" value={String(openRisks.length)} detail="Riscos ainda sem bloqueio completo no fluxo." />
        <ReportCard icon={CheckSquare} title="Acoes em aberto" value={String(openActions.length)} detail="Acoes pendentes de execucao ou validacao." />
        <ReportCard icon={Wallet} title="Multa potencial" value={formatCurrency(totalFine)} detail="Passivo consolidado dos riscos ainda abertos." />
        <ReportCard icon={Camera} title="Acoes sem evidencia" value={String(openActions.filter((action) => actionRequiresEvidence(action) && evidenceEntries(action, "Acao").length === 0).length)} detail="Acoes criticas que ainda nao conseguem sustentar fechamento." />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <SectionHeader
          eyebrow="Leitura comercial"
          title="Onde o cliente perde mais se nao agir"
          text="Setor, NR, responsavel e dinheiro aparecem juntos para facilitar decisao e priorizacao."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {groupedBySector.slice(0, 3).map((sector) => (
            <div key={sector.sector} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{sector.sector}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{sector.risks} risco(s)</p>
               <p className="mt-2 text-sm text-slate-600">{sector.actions} acao(oes) abertas | {formatCurrency(sector.fine)} em multa potencial.</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Riscos prioritarios"
            title="Riscos que mais pressionam a operacao"
            text="Cada risco aparece com a acao vinculada, o responsavel e a multa estimada."
          />
          <div className="mt-6 space-y-4">
            {openRisks.length > 0 ? (
              openRisks
                .sort((a, b) => riskSeverityScore(b) - riskSeverityScore(a) || riskFine(b) - riskFine(a))
                .slice(0, 8)
                .map((risk) => (
                  <div key={risk.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{riskName(risk)}</p>
                        <p className="mt-1 text-sm text-slate-600">{riskSector(risk)} | {riskNr(risk)}</p>
                      </div>
                      <Badge tone={riskSeverityScore(risk) >= 4 ? "red" : riskSeverityScore(risk) >= 3 ? "amber" : "slate"}>
                        {firstMeaningful(risk.criticidade, risk.nivel, risk.prioridade, "Aberto")}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p><strong>Origem:</strong> {firstMeaningful(risk.origem, "Fluxo operacional")}</p>
                      <p><strong>Responsavel:</strong> {riskOwner(risk)}</p>
                      <p><strong>Acao vinculada:</strong> {firstMeaningful(risk.acaoVinculada, "Criar acao corretiva")}</p>
                      <p><strong>Multa estimada:</strong> {formatCurrency(riskFine(risk))}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                Nenhum risco aberto foi encontrado no periodo filtrado.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Plano corretivo"
            title="Acoes que mostram entrega de valor"
            text="5W2H basico, custo e evidencia deixam claro o que precisa sair do papel."
          />
          <div className="mt-6 space-y-4">
            {openActions.length > 0 ? (
              openActions
                .sort((a, b) => actionCost(b) - actionCost(a))
                .slice(0, 8)
                .map((action) => {
                  const linkedRisk = openRisks.find((risk) => risk.id === action.riscoId);
                  return (
                    <div key={action.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">{actionName(action)}</p>
                          <p className="mt-1 text-sm text-slate-600">{actionWhy(action, linkedRisk)}</p>
                        </div>
                        <Badge tone={actionRequiresEvidence(action) ? "red" : "slate"}>{firstMeaningful(action.status, "Pendente")}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <p><strong>Onde:</strong> {actionSector(action, linkedRisk)}</p>
                        <p><strong>Quem:</strong> {actionOwner(action)}</p>
                        <p><strong>Quando:</strong> {firstMeaningful(action.quando, action.prazo, "-")}</p>
                        <p><strong>Quanto custa:</strong> {formatCurrency(actionCost(action))}</p>
                        <p className="md:col-span-2"><strong>Como:</strong> {firstMeaningful(action.como, action.descricao, "Executar a tratativa definida e validar a eficacia.")}</p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                Nenhuma acao em aberto foi encontrada no periodo filtrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveMonthlyReport({
  inspections,
  risks,
  actions,
  companyName,
  periodLabel,
}: {
  inspections: RecordLike[];
  risks: RecordLike[];
  actions: RecordLike[];
  companyName: string;
  periodLabel: string;
}) {
  const openRisks = risks.filter((risk) => !isClosedRisk(risk.status));
  const openActions = actions.filter((action) => !isClosedAction(action.status));
  const completedActions = actions.filter((action) => isClosedAction(action.status));
  const completedInspections = inspections.filter((inspection) => isClosedInspection(inspection.status || inspection.situacao));
  const totalFine = openRisks.reduce((sum, risk) => sum + riskFine(risk), 0);
  const totalActionCost = openActions.reduce((sum, action) => sum + actionCost(action), 0);
  const evidenceGap = openActions.filter((action) => actionRequiresEvidence(action) && evidenceEntries(action, "Acao").length === 0).length;

  const topSector = Array.from(
    openRisks.reduce((map, risk) => {
      const key = riskSector(risk);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])[0];

  const topNr = Array.from(
    openRisks.reduce((map, risk) => {
      const key = riskNr(risk);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])[0];

  const topResponsible = Array.from(
    openActions.reduce((map, action) => {
      const key = actionOwner(action);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])[0];

  const executiveNarrative = openRisks.length === 0
    ? "O periodo fecha com operacao controlada: nao ha riscos abertos relevantes no fluxo e as acoes estao sustentando a conformidade."
    : `O periodo fecha com ${openRisks.length} risco(s) aberto(s), concentrados principalmente em ${topSector?.[0] || "setor nao definido"}. A maior pressao normativa recai sobre ${topNr?.[0] || "NR nao vinculada"}, com ${formatCurrency(totalFine)} em multa potencial e ${formatCurrency(totalActionCost)} em custo estimado de resposta.`;

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Relatorio executivo mensal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Resumo gerencial do fluxo em {periodLabel}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Este e o relatorio que ajuda a vender continuidade: ele traduz inspecao, risco e acao em decisao executiva.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p><strong>Empresa:</strong> {companyName || "Nao informada"}</p>
            <p className="mt-2"><strong>Periodo:</strong> {periodLabel}</p>
            <p className="mt-2"><strong>Gerado em:</strong> {formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={ClipboardCheck} title="Inspecoes realizadas" value={String(completedInspections.length)} detail={`${inspections.length} inspecao(oes) no periodo.`} />
        <ReportCard icon={Shield} title="Riscos abertos" value={String(openRisks.length)} detail={`${topNr?.[0] || "Sem NR dominante"} concentra a maior pressao atual.`} />
        <ReportCard icon={CheckCircle2} title="Acoes concluida(s)" value={String(completedActions.length)} detail={`${openActions.length} acao(oes) ainda aguardam fechamento.`} />
        <ReportCard icon={Wallet} title="Exposicao total" value={formatCurrency(totalFine + totalActionCost)} detail="Soma de multas estimadas e custo das acoes em aberto." />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <SectionHeader
          eyebrow="Mensagem executiva"
          title="O que a diretoria precisa entender em poucos minutos"
          text={executiveNarrative}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Setor mais pressionado</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{topSector?.[0] || "Sem setor critico"}</p>
            <p className="mt-2 text-sm text-slate-600">{topSector?.[1] || 0} risco(s) aberto(s).</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Responsavel com mais fila</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{topResponsible?.[0] || "Sem responsavel pendente"}</p>
            <p className="mt-2 text-sm text-slate-600">{topResponsible?.[1] || 0} acao(oes) em aberto.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lacuna de evidencia</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{evidenceGap}</p>
            <p className="mt-2 text-sm text-slate-600">Acoes criticas sem prova para conclusao.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Indicadores mensais"
            title="Resultado do fluxo no periodo"
            text="Leitura simples para comite, cliente e diretoria."
          />
          <div className="mt-6 space-y-4">
            {[
              { label: "Inspecoes executadas", value: `${completedInspections.length} de ${inspections.length}` },
              { label: "Riscos ainda abertos", value: `${openRisks.length}` },
              { label: "Acoes concluida(s)", value: `${completedActions.length} de ${actions.length}` },
              { label: "Multa estimada em aberto", value: formatCurrency(totalFine) },
              { label: "Custo de execucao em aberto", value: formatCurrency(totalActionCost) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Recomendacao do mes"
            title="Onde a venda de valor fica evidente"
            text="O relatorio aponta o proximo movimento prioritario para reduzir risco, multa e desgaste operacional."
          />
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            Priorizar o setor <strong>{topSector?.[0] || "com maior exposicao"}</strong>, acelerar as acoes sob responsabilidade de{" "}
            <strong>{topResponsible?.[0] || "responsavel pendente"}</strong> e fechar primeiro as frentes relacionadas a{" "}
            <strong>{topNr?.[0] || "NR mais critica"}</strong>. Esse movimento reduz a parte mais cara e mais visivel do passivo agora.
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientPortalModule() {
  const sharedLinks: Array<{
    id: string;
    nome: string;
    permissao: string;
    status: string;
    ultimoAcesso: string;
    expiracao: string;
  }> = [];

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Portal do cliente</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Estrutura visual para compartilhamento com clientes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Esta tela e apenas estrutural: sem token real, sem rota publica real e sem integracao real com dashboard neste momento.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Modulo visual em preparacao.
            <br />
            Proximo passo: ligar geracao real, permissoes e expiracao auditavel.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={Link2} title="Links compartilhados" value="0" detail="Nenhum link ativo conectado ao cliente." />
        <ReportCard icon={Eye} title="Permissao padrao" value="Somente leitura" detail="Visualizacao pensada para consumo externo." />
        <ReportCard icon={Calendar} title="Expiracao" value="Manual" detail="Estrutura pronta para regras futuras de vencimento." />
        <ReportCard icon={Users} title="Ultimo acesso" value="-" detail="Ainda sem historico real de acesso." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <SectionHeader
            eyebrow="Novo link"
            title="Configurar compartilhamento"
            text="Formulario visual para a operacao definir o que o cliente podera visualizar quando o modulo for conectado de verdade."
          />

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Nome do link</span>
              <input
                value="Portal mensal - Cliente XPTO"
                readOnly
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Conteudo compartilhado</span>
              <select
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option>Relatorio executivo mensal</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Permissoes de visualizacao</span>
              <select
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option>Somente leitura</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Status do link</span>
                <div className="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  Rascunho
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Expiracao</span>
                <div className="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  30 dias apos geracao
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Observacao interna</span>
              <textarea
                value="Estrutura visual apenas. Sem token e sem publicacao externa nesta fase."
                readOnly
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="pt-2">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                <Link2 className="h-4 w-4" />
                Gerar link
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Links compartilhados"
              title="Gestao de links do portal"
              text="Lista desenhada para receber links reais quando o fluxo de compartilhamento for implementado."
            />

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Links compartilhados</th>
                    <th className="px-4 py-3 font-semibold">Permissoes de visualizacao</th>
                    <th className="px-4 py-3 font-semibold">Status do link</th>
                    <th className="px-4 py-3 font-semibold">Ultimo acesso</th>
                    <th className="px-4 py-3 font-semibold">Expiracao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sharedLinks.length > 0 ? (
                    sharedLinks.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-4 py-4 text-slate-600">{item.permissao}</td>
                        <td className="px-4 py-4 text-slate-600">{item.status}</td>
                        <td className="px-4 py-4 text-slate-600">{item.ultimoAcesso}</td>
                        <td className="px-4 py-4 text-slate-600">{item.expiracao}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="rounded-full border border-slate-200 bg-slate-50 p-4">
                            <Link2 className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="mt-4 font-medium text-slate-900">Nenhum link compartilhado criado ainda.</p>
                          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                            Quando o modulo for conectado de verdade, os links ativos, permissoes, ultimo acesso e expiracao aparecerao aqui.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Preview do controle"
              title="Campos previstos para a proxima fase"
              text="A tela ja antecipa os pontos que normalmente o cliente cobra no compartilhamento externo."
            />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                "Links compartilhados",
                "Novo link",
                "Permissoes de visualizacao",
                "Status do link",
                "Ultimo acesso",
                "Expiracao",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PgrTabId = "inventario" | "plano" | "controle" | "historico" | "exportacao";

function PgrVivoModule() {
  const [activeTab, setActiveTab] = useState<PgrTabId>("inventario");

  const tabs: Array<{
    id: PgrTabId;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    {
      id: "inventario",
      title: "Inventario de Riscos",
      description: "Visao estrutural do inventario que no futuro sera alimentado pelo fluxo real do sistema.",
      icon: ClipboardList,
    },
    {
      id: "plano",
      title: "Plano de Acao",
      description: "Area visual para organizar o recorte gerencial das acoes que sustentarao o PGR Vivo.",
      icon: FolderKanban,
    },
    {
      id: "controle",
      title: "Medidas de Controle",
      description: "Estrutura para consolidar controles de engenharia, administrativos e barreiras operacionais.",
      icon: ShieldCheck,
    },
    {
      id: "historico",
      title: "Historico de Revisoes",
      description: "Linha do tempo visual das futuras revisoes e atualizacoes do modulo.",
      icon: History,
    },
    {
      id: "exportacao",
      title: "Exportacao",
      description: "Espaco visual para futuras saidas controladas do PGR Vivo, sem criar documento oficial agora.",
      icon: Download,
    },
  ];

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">PGR Vivo</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Estrutura visual do modulo vivo de PGR</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Este modulo foi adicionado apenas como estrutura visual. Nenhum PGR real foi gerado, nenhum risco foi alterado, nenhuma acao foi alterada e nenhum documento oficial foi criado.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Modulo em preparacao visual.
            <br />
            Sem documento oficial e sem consolidacao real nesta fase.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={ClipboardList} title="Inventario" value="Visual pronto" detail="Subaba preparada para receber riscos consolidados no futuro." />
        <ReportCard icon={FolderKanban} title="Plano de acao" value="Estrutural" detail="Area visual separada para priorizacao e acompanhamento futuro." />
        <ReportCard icon={ShieldCheck} title="Controles" value="Mapeamento" detail="Espaco reservado para medidas de controle e evidencias." />
        <ReportCard icon={History} title="Revisoes" value="Linha do tempo" detail="Historico previsto apenas na interface por enquanto." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Subabas</h2>
          <div className="mt-5 space-y-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-2xl p-3 ${active ? "bg-white/10" : "bg-slate-100"}`}>
                      <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-700"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{tab.title}</p>
                      <p className={`mt-1 text-sm leading-6 ${active ? "text-slate-300" : "text-slate-600"}`}>{tab.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Subaba ativa"
              title={activeTabMeta.title}
              text={activeTabMeta.description}
            />

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <ActiveIcon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{activeTabMeta.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Os dados do PGR Vivo serão gerados a partir dos riscos, ações e evidências registrados no sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Estrutura prevista"
              title="Subabas desenhadas para a proxima fase"
              text="Tudo aqui e apenas visual. O modulo nao gera PGR real, nao altera riscos, nao altera acoes e nao exporta documento oficial."
            />

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {tabs.map((tab) => (
                <div key={tab.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {tab.title}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Estado vazio"
              title="Modulo aguardando consolidacao futura"
              text="A mensagem abaixo foi mantida exatamente como referencia de estado vazio do PGR Vivo."
            />
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-600">
              “Os dados do PGR Vivo serão gerados a partir dos riscos, ações e evidências registrados no sistema.”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowReportsPage() {
  const store = useAppStore();
  const { organization, inspecoes = [], riscos = [], acoes = [] } = store;
  const [activeReport, setActiveReport] = useState<ReportId>("inspecao");
  const [reportMonth, setReportMonth] = useState("2026-05");
  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [selectedInspectionId, setSelectedInspectionId] = useState("");

  const companyName = firstMeaningful(
    organization?.name,
    organization?.razaoSocial,
    "Empresa nao informada",
  );

  const sectors = useMemo(() => {
    const values = new Set<string>();
    inspecoes.forEach((inspection) => values.add(inspectionSector(inspection)));
    riscos.forEach((risk) => values.add(riskSector(risk)));
    acoes.forEach((action) => values.add(firstMeaningful(action.setor, action.onde)));
    return ["Todos", ...Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [acoes, inspecoes, riscos]);

  const filteredInspections = useMemo(() => {
    return inspecoes.filter((inspection) => {
      const matchesSector = sectorFilter === "Todos" || inspectionSector(inspection) === sectorFilter;
      return matchesSector;
    });
  }, [inspecoes, sectorFilter]);

  const selectedInspection = useMemo(() => {
    return filteredInspections.find((inspection) => inspection.id === selectedInspectionId) || filteredInspections[0] || null;
  }, [filteredInspections, selectedInspectionId]);

  const selectedInspectionRisks = useMemo(() => {
    if (!selectedInspection) return [];
    return riscos.filter((risk) => {
      const byInspectionId = String(risk.inspection_id || risk.inspecaoId || risk.checklistOrigem || "") === String(selectedInspection.id);
      return byInspectionId;
    });
  }, [riscos, selectedInspection]);

  const selectedInspectionActions = useMemo(() => {
    if (!selectedInspection) return [];
    const selectedRiskIds = new Set(selectedInspectionRisks.map((risk) => String(risk.id)));
    return acoes.filter((action) => {
      const directInspection =
        String(action.inspecaoId || action.inspection_id || action.item_origem_id || "") === String(selectedInspection.id) &&
        normalizeText(action.item_origem_tipo || action.source_type || "inspecao").includes("inspec");
      const viaRisk = selectedRiskIds.has(String(action.riscoId || action.riskId || ""));
      return directInspection || viaRisk;
    });
  }, [acoes, selectedInspection, selectedInspectionRisks]);

  const monthRisks = useMemo(() => {
    return riscos.filter((risk) => {
      const matchesSector = sectorFilter === "Todos" || riskSector(risk) === sectorFilter;
      return matchesSector && isSameMonth(reportMonth, risk.criadoEm, risk.atualizadoEm, risk.dataLancamento, risk.prazo);
    });
  }, [reportMonth, riscos, sectorFilter]);

  const monthActions = useMemo(() => {
    return acoes.filter((action) => {
      const matchesSector = sectorFilter === "Todos" || firstMeaningful(action.setor, action.onde) === sectorFilter;
      return matchesSector && isSameMonth(reportMonth, action.criadoEm, action.atualizadoEm, action.prazo, action.quando, action.due_date);
    });
  }, [acoes, reportMonth, sectorFilter]);

  const monthInspections = useMemo(() => {
    return inspecoes.filter((inspection) => {
      const matchesSector = sectorFilter === "Todos" || inspectionSector(inspection) === sectorFilter;
      return matchesSector && isSameMonth(reportMonth, inspection.criadoEm, inspection.atualizadoEm, inspection.data, inspection.proximaInspecao);
    });
  }, [inspecoes, reportMonth, sectorFilter]);

  const reportPeriodLabel = useMemo(() => monthLabel(reportMonth), [reportMonth]);

  const reportOptions: Array<{ id: ReportId; title: string; description: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "inspecao", title: "Relatorio de inspecao", description: "Checklist, nao conformidades, riscos, fotos e validacao.", icon: ClipboardCheck },
    { id: "riscos-acoes", title: "Relatorio de riscos e acoes", description: "Problema, tratativa, responsavel e custo lado a lado.", icon: Shield },
    { id: "executivo", title: "Relatorio executivo mensal", description: "Resumo para diretoria, com risco, custo e prioridade.", icon: FileText },
    { id: "portal-cliente", title: "Portal do cliente", description: "Estrutura visual para links compartilhados e acesso externo.", icon: Link2 },
    { id: "pgr-vivo", title: "PGR Vivo", description: "Estrutura visual com subabas do modulo vivo.", icon: ClipboardList },
  ];

  const handleExport = (type: "Impressao" | "PDF") => {
    store.addLog({
      empresa_id: "1",
      user_id: "Sistema",
      event_type: "relatorio_gerado",
      description: `Relatorio ${activeReport} gerado (${type})`,
      origin_type: "relatorio",
      origin_id: activeReport,
    });

    window.print();
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#111827_18%,#f8fafc_18%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-white/10 bg-slate-950 px-6 py-8 text-white shadow-2xl print:hidden lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Relatorios que vendem valor</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Tres relatorios bons deixam claro o que foi encontrado, o que isso custa e quem precisa agir.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Esta central combina os tres relatorios principais do fluxo com modulos visuais complementares, como <strong>Portal do Cliente</strong> e <strong>PGR Vivo</strong>, sem acoplar logica nova nesta etapa.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/operacao/inspecoes" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:bg-white/5">
                Inspecoes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operacao/riscos" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:bg-white/5">
                Riscos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operacao/acoes" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:bg-white/5">
                Acoes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operacao/incidentes" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:bg-white/5">
                Incidentes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 print:hidden md:grid-cols-2 xl:grid-cols-4">
          <ReportCard icon={ClipboardCheck} title="Inspecoes na base" value={String(inspecoes.length)} detail="Fonte primaria para gerar risco, acao e prova de valor." />
          <ReportCard icon={Shield} title="Riscos na base" value={String(riscos.length)} detail="Riscos tecnicos e normativos vinculados ao fluxo." />
          <ReportCard icon={CheckSquare} title="Acoes na base" value={String(acoes.length)} detail="Planos corretivos com 5W2H e evidencias." />
          <ReportCard icon={Users} title="Empresa" value={companyName} detail="Cabecalho institucional usado nos relatorios." />
        </section>

        <section className="grid gap-6 print:hidden xl:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Modelos</h2>
              <div className="mt-5 space-y-3">
                {reportOptions.map((option) => {
                  const Icon = option.icon;
                  const active = option.id === activeReport;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setActiveReport(option.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${active ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`rounded-2xl p-3 ${active ? "bg-white/10" : "bg-slate-100"}`}>
                          <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-700"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{option.title}</p>
                          <p className={`mt-1 text-sm leading-6 ${active ? "text-slate-300" : "text-slate-600"}`}>{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Filtros</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Mes de referencia</span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                    <input
                      type="month"
                      value={reportMonth}
                      onChange={(event) => setReportMonth(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-700 outline-none [color-scheme:light]"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Setor</span>
                  <select
                    value={sectorFilter}
                    onChange={(event) => setSectorFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
                  >
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Inspecao do relatorio</span>
                  <select
                    value={selectedInspection?.id || ""}
                    onChange={(event) => setSelectedInspectionId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
                  >
                    {filteredInspections.length > 0 ? (
                      filteredInspections.map((inspection) => (
                        <option key={inspection.id} value={inspection.id}>{inspectionName(inspection)}</option>
                      ))
                    ) : (
                      <option value="">Nenhuma inspecao disponivel</option>
                    )}
                  </select>
                </label>

                <div className="space-y-2 pt-2">
                  <button onClick={() => handleExport("Impressao")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    <FileText className="h-4 w-4" />
                    Gerar relatorio
                  </button>
                  <button onClick={() => handleExport("PDF")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div id="printable-report" className="print:max-w-none">
            {activeReport === "inspecao" && (
              <InspectionReport
                inspection={selectedInspection}
                linkedRisks={selectedInspectionRisks}
                linkedActions={selectedInspectionActions}
                companyName={companyName}
              />
            )}
            {activeReport === "riscos-acoes" && (
              <RisksActionsReport
                risks={monthRisks}
                actions={monthActions}
                companyName={companyName}
                periodLabel={reportPeriodLabel}
              />
            )}
            {activeReport === "executivo" && (
              <ExecutiveMonthlyReport
                inspections={monthInspections}
                risks={monthRisks}
                actions={monthActions}
                companyName={companyName}
                periodLabel={reportPeriodLabel}
              />
            )}
            {activeReport === "portal-cliente" && <ClientPortalModule />}
            {activeReport === "pgr-vivo" && <PgrVivoModule />}
          </div>
        </section>
      </div>
    </main>
  );
}
