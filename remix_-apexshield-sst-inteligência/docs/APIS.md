# APIs — Contratos Conceituais

> **Estado atual:** existe **uma única rota HTTP real** (`/api/lari`). Todas as outras
> "APIs" do produto são operações do Zustand store (`lib/store.ts`).
>
> Este documento define os **contratos conceituais** — como ficaria a API REST quando
> o V2 sair do localStorage para o Supabase. Por ora, cada contrato mostra também
> **como funciona hoje no store**.

---

## Convenções

- **Base URL futura:** `/api/v1`
- **Auth futura:** Bearer token (Supabase JWT)
- **Status codes:** 200 ok · 201 criado · 400 inválido · 401 sem auth · 404 inexistente · 409 conflito · 422 regra de negócio rejeitou
- **IDs:** strings (UUID ou prefixadas tipo `risk-`, `act-`, `ins-`)
- **Datas:** ISO 8601 UTC

---

## 1. Inspeções

### Contrato

```
GET    /api/v1/inspecoes                   → lista
GET    /api/v1/inspecoes/:id               → detalhe
POST   /api/v1/inspecoes                   → criar
PATCH  /api/v1/inspecoes/:id               → atualizar (incl. respostas)
DELETE /api/v1/inspecoes/:id               → remover
POST   /api/v1/inspecoes/:id/iniciar       → status → "Em andamento"
POST   /api/v1/inspecoes/:id/concluir      → status → "Concluída" + dispara motor
POST   /api/v1/inspecoes/:id/cancelar      → status → "Cancelada"
```

### Schema

```js
Inspecao {
  id: string,
  tipoInspecao: string,               // "Trabalho em Altura (NR-35)"
  checklist: string,                  // título do checklist usado
  checklistId: string,
  pacote: string,                     // "Construção Civil"
  ondeUsar: string,                   // setor
  data: string,                       // ISO date
  responsavel: string,
  prioridade: "Baixa"|"Média"|"Alta"|"Crítica",
  status: "Agendada"|"Hoje"|"Em andamento"|"Atrasada"|"Concluída"|"Cancelada",
  trabalhadoresExpostos: number,
  perfilExposto: string,
  items: ChecklistItemResposta[],
  evidencia?: string[],
  observacoes?: string,
  criadoEm: string,
  atualizadoEm: string,
  concluidoEm?: string
}

ChecklistItemResposta {
  id: string,                         // mesmo id da pergunta
  text: string,
  status: "Sim"|"Não"|"Parcialmente"|"N/A"|"Pendente",
  observacao?: string,
  evidencia?: string,
  // Campos do motor herdados do checklist:
  nrRelacionada: string,
  pacote: string,
  criticidade: string,
  acaoSugerida: string,
  exigeEvidencia: boolean,
  geraRisco: boolean,
  prazoPadraoHoras: number
}
```

### Como funciona hoje

- Store: `useAppStore().inspecoes`
- Operações: `addInspecao`, `updateInspecao`, `deleteInspecao` (em `lib/store.ts`).
- Motor dispara automaticamente ao chamar `addInspecao`/`updateInspecao`.

---

## 2. Riscos

### Contrato

```
GET    /api/v1/riscos                      → lista (filtros: ?status, ?nr, ?setor)
GET    /api/v1/riscos/:id                  → detalhe
POST   /api/v1/riscos                      → criar manual
PATCH  /api/v1/riscos/:id                  → atualizar
DELETE /api/v1/riscos/:id                  → remover
POST   /api/v1/riscos/:id/mitigar          → status → "Mitigado"
POST   /api/v1/riscos/:id/reabrir          → status → "Aberto"
```

### Schema

```js
Risco {
  id: string,
  titulo: string,
  descricao?: string,
  atividade: string,
  setor: string,
  nr: string,                         // "NR-12"
  nrRelacionada: string,              // alias backward-compat
  pacote: "Base SST"|"Indústria"|"Construção Civil"|"Saúde/Hospitalar",
  nivel: "Baixo"|"Médio"|"Alto"|"Crítico",
  criticidade: same,
  prioridade: "Baixa"|"Média"|"Alta"|"Crítica",
  status: "Aberto"|"Em análise"|"Mitigado"|"Resolvido"|"Vencido",
  prazo: string,                      // "Até 24h" ou ISO date
  origem: "Manual"|"Inspeção / Checklist"|"Automático",
  inspection_id?: string,
  checklist_item_id?: string,
  regraId?: string,
  perguntaOrigem?: string,
  respostaOrigem?: string,
  // Multa NR-28
  multaEstimada: number,
  multaEstimativaMin: number,
  multaEstimativaMax: number,
  faixaMultaLabel: string,
  // Pessoa no centro
  trabalhadoresExpostos: number,
  perfilExposto: string,
  impactoHumano: string,
  executorCorrecao: string,
  validadorCorrecao: string,
  criadoEm: string,
  atualizadoEm: string
}
```

### Como funciona hoje

- Store: `useAppStore().riscos`
- Operações: `addRisco`, `updateRisco`, `deleteRisco`.
- Cada `addRisco` dispara `processAutoActions` que gera ação corretiva se Crítico/Alto.

---

## 3. Ações

### Contrato

```
GET    /api/v1/acoes                       → lista (filtros: ?status, ?responsavel)
GET    /api/v1/acoes/:id                   → detalhe + histórico + evidências
POST   /api/v1/acoes                       → criar manual
PATCH  /api/v1/acoes/:id                   → atualizar
POST   /api/v1/acoes/:id/iniciar           → status → "Em andamento"
POST   /api/v1/acoes/:id/concluir          → status → "Concluída" (exige evidência se aplicável)
POST   /api/v1/acoes/:id/validar           → faseExecucao → "Validada"
POST   /api/v1/acoes/:id/rejeitar          → faseExecucao → "Rejeitada"
POST   /api/v1/acoes/:id/reatribuir        → muda responsável
POST   /api/v1/acoes/:id/cancelar          → status → "Cancelada"
POST   /api/v1/acoes/:id/reabrir           → status → "Em andamento"
```

### Schema

```js
Acao {
  id: string,
  titulo: string,
  descricao: string,
  acaoSugerida: string,
  prioridade: "Baixa"|"Média"|"Alta"|"Crítica",
  status: "Pendente"|"Em andamento"|"Concluída"|"Vencida"|"Cancelada",
  faseExecucao?: "Aguardando Validação"|"Validada"|"Rejeitada",
  riscoId?: string,
  inspecaoId?: string,
  perguntaOrigem?: string,
  respostaOrigem?: string,
  nr: string,
  pacote: string,
  criticidade: string,
  prazo: string,                       // ISO date
  prazoPadraoHoras: number,
  exigeEvidencia: boolean,
  bloqueante: boolean,
  setor: string,
  responsavel: string,
  validador: string,
  executor: string,
  trabalhadoresExpostos: number,
  perfilExposto: string,
  progresso: number,                   // 0-100
  evidencia: Evidencia[],
  historico: ActionHistoryEntry[],
  followUp?: ActionFollowUp,
  criadoEm: string,
  atualizadoEm: string,
  iniciadoEm?: string,
  concluidoEm?: string,
  canceladoEm?: string
}
```

### Como funciona hoje

- Store: `useAppStore().acoes` + hook `useAcoes()` em `app/acoes/hooks.ts`.
- Cascata: ação concluída + validada → risco vinculado vira "Mitigado".
- Follow-ups: ticker rodando a cada 60s em `app/operacao/acoes/page.tsx`.

---

## 4. Evidências

### Contrato

```
POST   /api/v1/evidencias                  → upload (multipart)
GET    /api/v1/evidencias/:id              → metadata + signed URL
DELETE /api/v1/evidencias/:id              → remover
GET    /api/v1/acoes/:id/evidencias        → listar de uma ação
```

### Schema

```js
Evidencia {
  id: string,
  acaoId?: string,
  inspecaoId?: string,
  tipo: "foto"|"pdf"|"video"|"texto",
  url: string,                         // signed URL (Drive ou Supabase Storage)
  legenda?: string,
  geolocalizacao?: { lat: number, lng: number },
  enviadoPor: string,
  enviadoEm: string,
  hash?: string                        // SHA-256 pra anti-tampering
}
```

### Como funciona hoje

- **Não existe upload real.** Evidências são strings/URLs salvas no campo
  `acao.evidencia[]` direto no localStorage.
- Validação `actionRequiresEvidence` em `lib/action-rules.ts`.

---

## 5. Dashboard

### Contrato

```
GET    /api/v1/dashboard/kpis              → KPIs principais
GET    /api/v1/dashboard/score             → score operacional histórico
GET    /api/v1/dashboard/multas            → multa evitada vs estimada
GET    /api/v1/dashboard/exposicao         → pessoas expostas por setor
GET    /api/v1/dashboard/timeline          → eventos recentes
```

### Schema

```js
DashboardKPIs {
  periodoStart: string,
  periodoEnd: string,
  exposicaoOperacional: "Baixa"|"Média"|"Alta",
  trabalhadoresExpostos: number,
  riscosCriticosAbertos: number,
  riscosAltosAbertos: number,
  acoesAtrasadas: number,
  acoesPendentes: number,
  inspecoesAtrasadas: number,
  inspecoesHoje: number,
  scoreOperacional: number,            // 0-100
  conformidadeEPI: number,             // 0-100
  multaEvitada: number,                // BRL
  multaEstimada: number,               // BRL
  setorMaisCritico: string,
  topRecomendacoes: string[]
}
```

### Como funciona hoje

- `components/dashboard/FlowDashboard.tsx` consome `useAppStore()` direto.
- `lib/engines.ts → LariContextEngine.getRealtimeContext()` agrega métricas (usado
  pelo chat).
- `lib/dashboardMetrics.ts → calculateDashboardMetrics()` existe mas **sem consumidor**.

---

## 6. Inteligência (L.A.R.I)

### Contrato

```
POST   /api/lari                            → mensagem → resposta
```

**Já existe e funciona.** Único endpoint HTTP real do projeto.

### Schema

```js
// Request
{
  message: string,
  context: LariContext {
    summary: string,
    criticalRisks: number,
    acoesAtrasadas: number,
    inspecoesPendentes: number,
    operationalScore: number,
    topSector: string,
    conformidade: number,
    checklistsHoje: number,
    [key: string]: any
  }
}

// Response
LariMessage {
  id: string,
  role: "lari",
  text: string,
  contextData?: string,
  isOffline?: boolean
}
```

### Como funciona hoje

- Rota: `app/api/lari/route.ts` (POST).
- Provider: Google Gemini via `@google/genai`.
- Fallback offline: se não tem `GEMINI_API_KEY`, retorna resposta com os números brutos.
- Cliente: `lib/lari/client.ts → askLari()`.
- UI: `components/lari/ChatPanel.tsx` (chat) + `components/FloatingChat.tsx` (botão).

---

## 7. Relatórios

### Contrato

```
GET    /api/v1/relatorios                  → lista relatórios gerados
POST   /api/v1/relatorios                  → gerar (assíncrono)
GET    /api/v1/relatorios/:id              → detalhe + status
GET    /api/v1/relatorios/:id/download     → PDF/Excel
DELETE /api/v1/relatorios/:id              → remover
```

### Schema

```js
Relatorio {
  id: string,
  titulo: string,
  tipo: "executivo"|"compliance"|"pgr"|"customizado",
  periodoStart: string,
  periodoEnd: string,
  filtros?: object,
  status: "gerando"|"pronto"|"erro",
  formato: "pdf"|"xlsx"|"html",
  url?: string,
  geradoPor: string,
  geradoEm: string
}
```

### Como funciona hoje

- `components/reports/FlowReportsPage.tsx` renderiza relatório em HTML inline.
- Não há histórico nem export PDF.

---

## 8. Configurações

### Contrato

```
GET    /api/v1/config/organizacao          → dados da empresa
PATCH  /api/v1/config/organizacao
GET    /api/v1/config/setores
POST   /api/v1/config/setores
PATCH  /api/v1/config/setores/:id
DELETE /api/v1/config/setores/:id
GET    /api/v1/config/usuarios
POST   /api/v1/config/usuarios
PATCH  /api/v1/config/usuarios/:id
DELETE /api/v1/config/usuarios/:id
GET    /api/v1/config/pacotes              → pacotes de regras
PATCH  /api/v1/config/pacotes/:id          → ativar/desativar
GET    /api/v1/config/regras-personalizadas
POST   /api/v1/config/regras-personalizadas
PATCH  /api/v1/config/regras-personalizadas/:id
DELETE /api/v1/config/regras-personalizadas/:id
GET    /api/v1/config/checklists
POST   /api/v1/config/checklists
PATCH  /api/v1/config/checklists/:id
DELETE /api/v1/config/checklists/:id
GET    /api/v1/config/engine               → SLAs, alertas, economia
PATCH  /api/v1/config/engine
```

### Como funciona hoje

- Tudo no `useAppStore()`:
  - `organization`, `updateOrganization`
  - `sectors`, `addSector`, `updateSector`, `deleteSector`, `reorderSectors`
  - `users`, `addUser`, `updateUser`, `deleteUser`
  - `rulePackages`, `updateRulePackage`
  - `rules`, `addRule`, `updateRule`, `deleteRule`
  - `riskRules`, `addRiskRule`, `updateRiskRule`, `deleteRiskRule`
  - `checklists`, `addChecklist`, `updateChecklist`, `deleteChecklist`
  - `engineConfig`, `updateEngineConfig`

---

## Princípios de API (quando virar REST)

1. **Verbos coerentes.** GET nunca muda estado.
2. **Idempotência.** PUT/PATCH com mesmo payload duas vezes = mesmo resultado.
3. **Validação no servidor.** Cliente confia, servidor verifica.
4. **Cascata implícita.** Concluir ação com `?cascade=true` mitiga risco vinculado.
5. **Versionamento.** `/api/v1`, `/api/v2` — quebra de contrato exige nova versão.
6. **Webhooks.** Eventos importantes (risco crítico criado, ação vencida) emitem
   webhook para integração futura.
