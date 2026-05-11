"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardPlus,
  Eye,
  Factory,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

type IncidentType =
  | "Quase acidente"
  | "Acidente sem afastamento"
  | "Acidente com afastamento"
  | "Dano material"
  | "Condicao perigosa";

type IncidentStatus = "Rascunho" | "Aberto" | "Em analise" | "Encerrado";
type IncidentSeverity = "Baixa" | "Media" | "Alta" | "Critica";

const incidentTypes: IncidentType[] = [
  "Quase acidente",
  "Acidente sem afastamento",
  "Acidente com afastamento",
  "Dano material",
  "Condicao perigosa",
];

const statusOptions: IncidentStatus[] = ["Rascunho", "Aberto", "Em analise", "Encerrado"];
const severityOptions: IncidentSeverity[] = ["Baixa", "Media", "Alta", "Critica"];

const sharedFieldClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none";

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
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

export default function IncidentesPage() {
  const [selectedType, setSelectedType] = useState<IncidentType>("Quase acidente");
  const incidents: Array<{
    id: string;
    tipo: IncidentType;
    status: IncidentStatus;
    gravidade: IncidentSeverity;
    setor: string;
    responsavel: string;
    ultimoRegistro: string;
  }> = [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fee2e2_0%,#fff 35%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white px-6 py-8 shadow-sm lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Operacao</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Incidentes</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                Estrutura visual do modulo de incidentes. Sem conexao com riscos, sem geracao de acoes e sem alteracao no motor nesta fase.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/operacao/inspecoes" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
                Inspecoes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operacao/riscos" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
                Riscos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operacao/acoes" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
                Acoes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                Incidentes
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={FileWarning} title="Registrar incidente" value="Visual pronto" detail="Entrada preparada para registrar ocorrencias quando a integracao com dados for ativada." />
          <StatCard icon={AlertTriangle} title="Status" value="Estrutural" detail="Rascunho, aberto, em analise e encerrado previstos na interface." />
          <StatCard icon={ShieldAlert} title="Gravidade" value="4 niveis" detail="Baixa, media, alta e critica desenhadas para priorizacao futura." />
          <StatCard icon={Factory} title="Estado da lista" value="Vazio" detail="Nenhum incidente carregado porque esta tela ainda nao usa base real." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeader
              eyebrow="Registrar incidente"
              title="Formulario visual do modulo"
              text="A tela ja antecipa os campos operacionais principais, mas ainda sem persistencia, token, motor ou automacoes."
            />

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Tipo de incidente</span>
                <select value={selectedType} onChange={(event) => setSelectedType(event.target.value as IncidentType)} className={sharedFieldClass}>
                  {incidentTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Status</span>
                  <select className={sharedFieldClass} defaultValue="Rascunho">
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Gravidade</span>
                  <select className={sharedFieldClass} defaultValue="Media">
                    {severityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Setor</span>
                  <input value="Producao" readOnly className={sharedFieldClass} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Responsavel</span>
                  <input value="Responsavel do setor" readOnly className={sharedFieldClass} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Descricao inicial</span>
                <textarea
                  rows={5}
                  readOnly
                  value={`Estrutura visual de ${selectedType.toLowerCase()} pronta para receber dados reais em uma proxima etapa.`}
                  className={sharedFieldClass}
                />
              </label>

              <div className="pt-2">
                <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  <ClipboardPlus className="h-4 w-4" />
                  Registrar incidente
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeader
                eyebrow="Tipos previstos"
                title="Categorias do modulo"
                text="Os cinco tipos principais pedidos ja aparecem como estrutura visual, sem disparar nenhum fluxo automatico."
              />

              <div className="mt-6 grid gap-3">
                {incidentTypes.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeader
                eyebrow="Lista de incidentes"
                title="Estado vazio"
                text="Quando a base real entrar, esta area recebe os registros com status, gravidade, setor e responsavel."
              />

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Gravidade</th>
                      <th className="px-4 py-3 font-semibold">Setor</th>
                      <th className="px-4 py-3 font-semibold">Responsavel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {incidents.length > 0 ? (
                      incidents.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-medium text-slate-900">{item.tipo}</td>
                          <td className="px-4 py-4 text-slate-600">{item.status}</td>
                          <td className="px-4 py-4 text-slate-600">{item.gravidade}</td>
                          <td className="px-4 py-4 text-slate-600">{item.setor}</td>
                          <td className="px-4 py-4 text-slate-600">{item.responsavel}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-10">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="rounded-full border border-slate-200 bg-slate-50 p-4">
                              <Eye className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="mt-4 font-medium text-slate-900">Nenhum incidente registrado ainda.</p>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                              Estado vazio do modulo. Nenhum risco foi criado, nenhuma acao foi gerada e nenhum motor foi alterado nesta etapa.
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
                eyebrow="Campos visuais"
                title="O que ja esta previsto na interface"
                text="Checklist rapido do escopo visual solicitado para o modulo."
              />
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  "Registrar incidente",
                  "Quase acidente",
                  "Acidente sem afastamento",
                  "Acidente com afastamento",
                  "Dano material",
                  "Condicao perigosa",
                  "Status",
                  "Gravidade",
                  "Setor",
                  "Responsavel",
                  "Estado vazio",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
