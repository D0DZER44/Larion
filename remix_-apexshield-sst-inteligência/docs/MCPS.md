# MCPs — Integrações Futuras

> **Estado atual:** **nenhuma integração externa** além de Google Gemini (chat
> L.A.R.I via `/api/lari`). Todo dado vive no `localStorage`.
>
> Este documento mapeia as integrações planejadas pra V2/V3, com contrato esperado,
> ponto de inserção no código e prioridade.

---

## Convenção

MCP aqui = "Módulo de Conexão com Plataforma externa". Cada integração tem:
- **Camada** onde se encaixa (Persistência / Notificação / Storage / etc.)
- **Trigger** que dispara o uso.
- **Contrato mínimo** (funções expostas).
- **Fallback** se a integração estiver offline.

Pasta proposta: `/src/mcps/` (a criar no V2 com arquivos `.js`).

---

## 1. Supabase — Persistência e Auth

**Prioridade:** 🔴 P0 — bloqueador do V2.

### Por que

Hoje tudo vive no `localStorage`. Limitações:
- Cada usuário tem sua própria base isolada.
- Não tem auth real (qualquer um na máquina vê tudo).
- Não tem histórico permanente — `localStorage.clear()` apaga tudo.
- Não dá pra escalar pra time/multi-tenant.

Supabase resolve com:
- **Postgres** gerenciado.
- **Row Level Security** (RLS) — multi-tenant nativo.
- **Auth** com magic link, OAuth (Google/MS), MFA.
- **Realtime** — sync entre dispositivos.
- **Storage** — bucket pra evidências (substitui Drive em parte).

### Contrato

```js
// /src/mcps/supabase.js
export const supabase = createClient(URL, ANON_KEY)

export async function syncToSupabase(entity, payload) { ... }
export async function fetchFromSupabase(entity, filter) { ... }
export function subscribeToChanges(entity, callback) { ... }
```

### Pontos de inserção

- `lib/store.ts` → middleware Zustand que substitui `persist(localStorage)` por
  `persist(supabaseStorage)`.
- `app/layout.tsx` → wrapper `<SupabaseProvider>` com session.
- Cada `addX/updateX/deleteX` no store dispara `syncToSupabase` em background.

### Tabelas planejadas

```
organizations  inspecoes      acoes        evidencias
users          riscos         alertas      logs
sectors        checklists     rule_packages   custom_rules
work_hours     risk_rules     engine_config   pgr_versions
```

### Fallback

Se offline → fila local em IndexedDB. Sync quando voltar online.

### Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...    # só server-side
```

---

## 2. WhatsApp — Notificações ativas

**Prioridade:** 🟠 P1 — diferencial de mercado.

### Por que

Operário SST em campo não fica olhando dashboard. Recebe via WhatsApp:
- Risco crítico identificado → notifica gestor e área.
- Ação atribuída → notifica responsável com link.
- SLA estourado → escalona pro gerente.
- PGR atualizado → confirma com diretor.

### Provider

- **Meta Cloud API** (WhatsApp Business) — oficial, pago por conversa.
- Alternativa: **Twilio WhatsApp**, **Z-API**, **360dialog**.

### Contrato

```js
// /src/mcps/whatsapp.js
export async function enviarMensagem({ telefone, template, parametros }) { ... }
export async function enviarTemplate(templateId, params) { ... }
export async function setupWebhook(handler) { ... }
```

### Templates necessários (V2)

| Template | Quando |
| --- | --- |
| `risco_critico` | `addRisco` com `nivel === "Crítico"` |
| `acao_atribuida` | `acao.responsavel` mudou |
| `acao_vencendo_hoje` | Daily cron, prazo == hoje |
| `acao_vencida` | `processAutoActions` detecta vencimento |
| `escalonamento` | `executarFollowUps` detecta `precisaEscalonamento` |
| `pgr_publicado` | Nova versão de PGR gerada |

### Pontos de inserção

- `lib/store.ts` → hook em `addRisco`, `updateAcao`.
- `app/acoes/hooks.ts` → `executarFollowUps()` dispara escalonamento.
- API route nova: `/api/whatsapp/webhook` pra receber confirmações.

### Compliance

LGPD — opt-in explícito por usuário; armazenar consentimento; permitir opt-out.

---

## 3. Google Drive — Anexo de evidências

**Prioridade:** 🟡 P2 — fácil ganho de credibilidade.

### Por que

Evidência hoje é string/URL na `acao.evidencia[]`. Sem prova real de upload, sem
versionamento, sem permissão.

Drive resolve:
- Upload nativo via Picker API.
- Cada organização tem pasta `/ApexShield/{empresa}/evidencias/`.
- Permissão granular (gestor vê tudo, operário só os próprios).
- Histórico de versões.

### Alternativa

**Supabase Storage** — mais simples, mas operário pode achar estranho não ver "no
Drive da empresa". Drive ganha em UX corporativa.

### Contrato

```js
// /src/mcps/drive.js
export async function uploadEvidencia({ file, acaoId, metadata }) { ... }
export async function listarEvidencias(acaoId) { ... }
export async function gerarSignedUrl(fileId, expiresIn) { ... }
export async function deletarEvidencia(fileId) { ... }
```

### Pontos de inserção

- `app/acoes/components/DrawerAcao.tsx` → botão "Anexar evidência" abre Picker.
- `lib/action-rules.ts → actionRequiresEvidence` continua validando.
- Hash SHA-256 calculado no client antes do upload (anti-tampering).

### Variáveis

```
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
```

---

## 4. E-mail — Relatórios e digest

**Prioridade:** 🟡 P2.

### Por que

Diretoria não entra no app diariamente, mas recebe e-mail. Casos:
- Digest semanal de SST (score, multa evitada, top riscos).
- PGR gerado pra arquivo (PDF anexo).
- Convite pra usuário novo na organização.
- Reset de senha.

### Provider

- **Resend** — DX moderna, bom free tier.
- Alternativa: **SendGrid**, **AWS SES**, **Postmark**.

### Contrato

```js
// /src/mcps/email.js
export async function enviarEmail({ to, subject, html, attachments }) { ... }
export async function enviarDigest(orgId) { ... }
export async function enviarRelatorio(relatorioId, destinatarios) { ... }
```

### Templates

| Template | Trigger |
| --- | --- |
| `digest_semanal` | Cron domingo 18h |
| `pgr_publicado` | Nova versão de PGR (anexa PDF) |
| `convite_usuario` | `addUser` no store |
| `reset_senha` | Fluxo de auth |
| `relatorio_pronto` | `gerarRelatorio` conclui |

### Pontos de inserção

- API route: `/api/email/send` (server-side, key segura).
- Cron: `/api/cron/digest-semanal` (Vercel Cron).

---

## 5. Integrações futuras (V3)

### eSocial

**Prioridade:** 🔵 P3 — épico de compliance.

- Envio automático de evento S-2240 (Condições Ambientais do Trabalho).
- Envio de S-2210 (CAT — Comunicação de Acidente de Trabalho).
- Reconciliação com riscos cadastrados.

**Complexidade:** alta. Requer certificado A1, mapeamento de catálogo, ambiente de
homologação.

### Microsoft 365 / Outlook

**Prioridade:** 🔵 P3.

- Calendário de inspeções → Outlook.
- Tarefas (Ações) → Microsoft Planner.
- SSO via Azure AD.

### Slack / Microsoft Teams

**Prioridade:** 🔵 P3.

- Canal `#sst-alertas` recebe risco crítico em real-time.
- Comando `/sst riscos abertos` puxa dados.

### Power BI / Looker

**Prioridade:** 🔵 P3.

- Export OData ou dataset Postgres direto.
- Dashboards executivos customizados pelo cliente.

### CIPA / SESMT (módulos próprios)

**Prioridade:** 🔵 P3.

- Agenda de reuniões CIPA.
- Eleição online.
- Ata digital.

### Marketplace de checklists

**Prioridade:** 🔵 P3.

- Operadoras criam checklists customizados.
- Outras empresas compram/instalam.
- Receita compartilhada com a autora.

### API pública

**Prioridade:** 🔵 P3.

- REST + webhooks documentados em OpenAPI.
- Token por organização.
- Rate limiting + observabilidade.

---

## Padrões para implementar uma MCP

1. **Adapter pattern.** Toda MCP expõe interface estável; troca de provider
   (ex: Twilio → Meta) não muda o resto do código.
2. **Idempotência.** Reenviar a mesma notificação não duplica.
3. **Retry com backoff.** Falha de rede vira retry exponencial até 5 tentativas.
4. **Observabilidade.** Toda chamada externa loga `{provider, endpoint, status,
   latency, traceId}`.
5. **Fallback.** Toda MCP tem modo offline com fila local.
6. **Segredo no servidor.** Chaves nunca chegam no client. APIs externas só via
   `app/api/<mcp>/route.ts`.
7. **Configurável.** Cliente pode desabilitar uma MCP em
   `/configuracoes → Integrações`.

---

## Ordem sugerida de implementação

```
V2.0  → Supabase (persistência + auth)
V2.1  → E-mail (digest + reset senha)
V2.2  → WhatsApp (notificações ativas)
V2.3  → Drive (evidências)
V3.0  → Mobile app + eSocial
V3.1  → Marketplace + API pública
```
