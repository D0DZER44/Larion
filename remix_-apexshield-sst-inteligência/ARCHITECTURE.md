# ApexShield SST — Arquitetura Conceitual

> **Status:** mapeamento e documentação. **Nada foi movido, renomeado ou apagado.**
> Este documento existe para alinhar a leitura do que já está construído nas seis camadas
> conceituais (README / Skills / APIs / Motor / CLIs / MCPs).

---

## 1. Visão executiva

ApexShield SST Inteligência é um Next.js 15 (App Router) que roda 100% client-side em
Zustand + persist (localStorage). Não há banco de dados nem auth — todo "estado" vive no
navegador do usuário. Existe **uma única chamada de rede**: `/api/lari` (Gemini) usada
pelo chat da L.A.R.I.

O domínio é Saúde e Segurança do Trabalho: o usuário cadastra Inspeções, o motor gera
Riscos automáticos a partir de não-conformidades, dispara Ações corretivas, agrega
Alertas, calcula multa estimada (NR-28) e abastece dashboards. As regras vivem em três
fontes paralelas — `rules` (custom), `riskRules` (por pacote) e `fixedNrRules` (90 regras
NR). O motor (`lib/engines.ts`) é o único orquestrador.

---

## 2. Inventário completo

### 2.1 Páginas (rotas Next.js)

| Rota | Arquivo | Propósito |
| --- | --- | --- |
| `/` | `app/page.tsx` | Re-export → `FlowDashboard` |
| `/central` | `app/central/page.tsx` | Re-export → `FlowDashboard` *(mesmo componente que `/`)* |
| `/central/motor` | `app/central/motor/page.tsx` | Transparência do motor (NR-28, gatilhos) |
| `/chat` | `app/chat/page.tsx` | Chat L.A.R.I fullscreen |
| `/configuracoes` | `app/configuracoes/page.tsx` | 6 sub-tabs: Geral / Checklists / Regras / SLAs / Alertas / Indicadores |
| `/operacao/inspecoes` | `app/operacao/inspecoes/page.tsx` | Lista + drawer + form de inspeções |
| `/operacao/riscos` | `app/operacao/riscos/page.tsx` | Cadastro e visualização de riscos |
| `/operacao/acoes` | `app/operacao/acoes/page.tsx` | Kanban + drawer de ações |
| `/operacao/matriz` | `app/operacao/matriz/page.tsx` | Matriz de aplicabilidade das NRs |
| `/operacao/incidentes` | `app/operacao/incidentes/page.tsx` | **Órfã — não está no Sidebar** |
| `/organizacao` | `app/organizacao/page.tsx` | 7 sub-tabs: Visão / Empresa / Usuários / Setores / Permissões / Plano / Integrações |
| `/perfil` | `app/perfil/page.tsx` | Wrapper de `<ProfileTab />` |
| `/relatorios` | `app/relatorios/page.tsx` | Re-export → `FlowReportsPage` |
| `/api/lari` | `app/api/lari/route.ts` | POST Gemini (única rota de API) |
| infra | `app/layout.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/globals.css` | Layout raiz, errors, estilos globais |
| infra | `app/inspecoes/ExecutionView.tsx` | View fullscreen de execução de inspeção (sem `page.tsx`, usada como componente) |

### 2.2 Componentes compartilhados (`components/`)

| Arquivo | Usado por |
| --- | --- |
| `components/LayoutShell.tsx` | `app/layout.tsx` (shell + sidebar + notif + ticker do motor) |
| `components/Sidebar.tsx` | `LayoutShell` |
| `components/FloatingChat.tsx` | `app/layout.tsx` |
| `components/lari/ChatPanel.tsx` | `FloatingChat` + `app/chat/page.tsx` |
| `components/AcaoRecomendadaCard.tsx` | `configuracoes/page.tsx` (renderizado) e `inspecoes/page.tsx` (importado, **não renderizado**) |
| `components/ProfileTab.tsx` | `app/perfil/page.tsx` |
| `components/Sparkline.tsx` | `app/operacao/riscos/page.tsx` |
| `components/TimelineHistory.tsx` | `app/operacao/riscos/page.tsx` |
| `components/dashboard/FlowDashboard.tsx` | `/` e `/central` |
| `components/reports/FlowReportsPage.tsx` | `/relatorios` |

### 2.3 Página de Ações (sub-componentes)

| Arquivo | Função |
| --- | --- |
| `app/acoes/components/VisaoGeral.tsx` | Aba "Visão Geral" do kanban |
| `app/acoes/components/Pendentes.tsx` | Aba "Pendentes" |
| `app/acoes/components/EmAndamento.tsx` | Aba "Em andamento" |
| `app/acoes/components/Concluidas.tsx` | Aba "Concluídas" |
| `app/acoes/components/Historico.tsx` | Aba "Histórico" |
| `app/acoes/components/DrawerAcao.tsx` | Drawer lateral de detalhe |
| `app/acoes/components/ModalNovaAcao.tsx` | Modal de criação |
| `app/acoes/hooks.ts` | `useAcoes()` — normalização, follow-ups, cascata risco↔ação |
| `app/acoes/types.ts` | `ActionItem`, `AcaoStatus`, `AcaoPrioridade`, `ActionFollowUp` |

### 2.4 Bibliotecas (`lib/`)

| Arquivo | Conteúdo |
| --- | --- |
| `lib/store.ts` | Zustand store + `processAutoActions` (motor reativo) |
| `lib/types.ts` | Tipos compartilhados (`Risco`, `Acao`, `Inspecao`, `Alerta`, etc.) |
| `lib/engines.ts` | `NormativeEngine`, `RiskEngine`, `InspectionEngine`, `ActionEngine`, `EconomicImpactEngine`, `DecisionEngine`, `PriorityEngine`, `AutomationEngine`, `LariContextEngine` |
| `lib/fineEngine.ts` | NR-28 — tabela de multas e cálculo |
| `lib/risk-calculations.ts` | `applyManualRules`, cálculos de prioridade/prazo/multa/chance |
| `lib/normativeRules.ts` | 90 regras fixas NR + `getTodasRegrasAtivas`, `compareRegras`, `getNrNumber` |
| `lib/normativeChecklists.ts` | `fixedNrChecklists` + `enrichChecklistQuestion`, `getTodosChecklistsAtivos` |
| `lib/checklists.ts` | `INITIAL_CHECKLISTS` (sementes editáveis) |
| `lib/nrMatrix.ts` | `NR_MATRIX`, `NR_MATRIX_ORDENADA`, `getNRsAplicaveis`, `compareNRs`, `getNrIdNumber` |
| `lib/riskRules.ts` | `INITIAL_RISK_RULES` (regras por pacote) |
| `lib/action-rules.ts` | `actionRequiresEvidence`, `normalizeActionDraft`, `validateActionDraft`, `validateActionCompletion` |
| `lib/lari/client.ts` | Cliente do `/api/lari` (fetch + fallback offline) |
| `lib/dashboardMetrics.ts` | `calculateDashboardMetrics` — **sem consumidores** |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) — **sem consumidores** |

### 2.5 Contextos, hooks e infra

| Arquivo | Status |
| --- | --- |
| `contexts/AppContext.tsx` | Store paralela (useReducer) — **montada em `layout.tsx` mas sem consumidores** |
| `hooks/use-mobile.ts` | Sem consumidores |
| `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.eslintrc.json`, `postcss.config.mjs` | Configuração build/lint |
| `package.json`, `package-lock.json` | Dependências |
| `vercel.json`, `metadata.json` | Deploy + metadados |
| `next-env.d.ts` | Tipos auto-gerados Next.js |
| `README.md` | Bootstrap mínimo (AI Studio + Gemini key) |

---

## 3. Classificação nas 6 camadas

### 3.1 README — visão do produto

| Item | Onde está hoje | Cobertura |
| --- | --- | --- |
| Visão do produto | `README.md` | **Faltando** — README atual só fala em "AI Studio app" |
| Fluxo principal | Sem documentação | **Faltando** — implícito em `lib/store.ts` (`processAutoActions`) e `lib/engines.ts` (`AutomationEngine.processInspection`) |
| Regras do produto | Sem documentação | **Faltando** — implícitas em `lib/normativeRules.ts`, `lib/riskRules.ts`, `lib/engines.ts` |
| Módulos existentes | Sem documentação | **Faltando** — derivável só lendo `components/Sidebar.tsx` |

### 3.2 Skills — capacidades inteligentes

| Skill | Implementação atual | Local |
| --- | --- | --- |
| Detectar risco | `NormativeEngine.detect()` (palavras-chave → NR) + `AutomationEngine.processInspection()` (item NC → risco) | `lib/engines.ts` |
| Gerar ação | `AutomationEngine.processInspection()` + `processAutoActions()` (risco crítico → ação) | `lib/engines.ts`, `lib/store.ts` |
| Calcular prioridade | `calcularPrioridade`, `PriorityEngine.getQueue` | `lib/risk-calculations.ts`, `lib/engines.ts` |
| Exigir evidência | `actionRequiresEvidence`, campo `exigeEvidencia` enriquecido por `enrichChecklistQuestion` | `lib/action-rules.ts`, `lib/normativeChecklists.ts` |
| Gerar relatório | `FlowReportsPage` | `components/reports/FlowReportsPage.tsx` |
| Gerar insights | `LariContextEngine.respond()`, `DecisionEngine.getMainDecision()` | `lib/engines.ts` |
| Calcular dashboard | `FlowDashboard` (inline) + `lib/dashboardMetrics.ts` (não usado) | `components/dashboard/FlowDashboard.tsx` |
| Atualizar PGR Vivo | **Faltando** — não há implementação |

### 3.3 APIs — contratos de dados

Hoje só existe **uma** rota HTTP real (`/api/lari`). Todas as outras "APIs" do produto são
**operações do store Zustand**, não endpoints. Mapeando o que existe como operação:

| API conceitual | Realização atual | Local |
| --- | --- | --- |
| Inspeções | `addInspecao`, `updateInspecao`, `deleteInspecao` (store) | `lib/store.ts` |
| Riscos | `addRisco`, `updateRisco`, `deleteRisco` (store) | `lib/store.ts` |
| Ações | `addAcao`, `updateAcao`, `deleteAcao` (store) + `useAcoes()` | `lib/store.ts`, `app/acoes/hooks.ts` |
| Evidências | Campo `evidencia[]` em ação/inspeção (sem endpoint) | embutido nos tipos |
| Dashboard | `FlowDashboard` + `LariContextEngine.getRealtimeContext()` | `lib/engines.ts` |
| Inteligência (L.A.R.I) | `POST /api/lari` ↔ `lib/lari/client.ts::askLari` | `app/api/lari/route.ts` |
| Relatórios | `FlowReportsPage` consome direto do store | `components/reports/FlowReportsPage.tsx` |
| Configurações | `updateOrganization`, `updateEngineConfig`, `updateRulePackage`, etc. (store) | `lib/store.ts` |

> **Observação:** não existe `lib/api/` nem `services/`. O contrato de dados está
> implícito nas funções do store e nos tipos de `lib/types.ts`.

### 3.4 Motor — regras de negócio

| Regra | Implementação | Local |
| --- | --- | --- |
| NR | 90 regras fixas + helpers de ordem/numero | `lib/normativeRules.ts` |
| NR (metadata por NR) | `NR_MATRIX` (segmentos, pacotes, atividades) | `lib/nrMatrix.ts` |
| Setores | `sectors[]` no store + sementes | `lib/store.ts` |
| Atividades | `organization.atividadesCriticas` + `ATIVIDADES_OPCOES` | `lib/store.ts`, `app/operacao/riscos/page.tsx` |
| Riscos padrão | `INITIAL_RISK_RULES` (por pacote) | `lib/riskRules.ts` |
| Ações padrão | `acaoSugerida` em cada `fixedNrRule` e `riskRule` | `lib/normativeRules.ts`, `lib/riskRules.ts` |
| SLA | `engineConfig.slas` + cálculo de `prazoBase` | `lib/store.ts`, `lib/risk-calculations.ts` |
| Evidências (regras) | `exigeEvidencia` no checklist + `action-rules.ts` | `lib/normativeChecklists.ts`, `lib/action-rules.ts` |
| PGR Vivo | **Faltando** — sem implementação |
| Maturidade | **Faltando** — sem implementação |
| Reincidência | `engineConfig.economia.fatorReincidencia` aplicado em multa/impacto | `lib/store.ts`, `lib/fineEngine.ts` |
| Impacto estimado | `FineEngine` (NR-28) + `EconomicImpactEngine` | `lib/fineEngine.ts`, `lib/engines.ts` |

### 3.5 CLIs — validação e limpeza

**Não existe nenhuma CLI no projeto hoje.** Os scripts em `package.json` são padrão Next
(`dev / build / start / lint / clean`). Todas as validações abaixo estão pulverizadas em
filtros inline:

| CLI conceitual | Onde a regra mora hoje | Status |
| --- | --- | --- |
| Validar mocks | `filterJunk` (duplicado em 2 páginas) + `BLOCKED_GENERIC_TERMS` em `action-rules.ts` | Espalhado |
| Validar regras | `normalizarRegra` em `lib/normativeRules.ts` | Embutido na lib |
| Validar dashboard | `lib/dashboardMetrics.ts` (não usado) | **Órfão** |
| Validar dados órfãos | Sem implementação | **Faltando** |
| Validar NRs | `getNrNumber`, `compareRegras` espalhados em 3 arquivos | Duplicado |
| Validar ações sem evidência | `actionRequiresEvidence` em `lib/action-rules.ts` | Existe mas só usado por UI |

### 3.6 MCPs — integrações futuras

**Nenhuma integração MCP/externa hoje além de Gemini.** Mapeando intenção:

| MCP / Integração | Status |
| --- | --- |
| Supabase (auth + persistência) | **Faltando** — hoje tudo é Zustand+localStorage |
| WhatsApp (notificações) | **Faltando** |
| Drive (anexo de evidências) | **Faltando** — evidências são strings/URLs em memória |
| E-mail (escalonamento SLA) | **Faltando** |
| Integrações futuras | `app/organizacao/page.tsx` tem sub-tab "Integrações" como placeholder visual |

---

## 4. Problemas de organização

### 4.1 Camadas misturadas

- **Motor dentro do store:** `lib/store.ts` define a função `processAutoActions` que é
  motor de negócio, não state management. Mistura camada de dados com regra.
- **APIs implícitas:** não existem contratos. As "APIs" são funções soltas no store; UI
  fala direto com store. Sem fronteira clara entre dado e regra.
- **Validação dentro da UI:** filtros `filterJunk` repetidos em páginas (camada CLI
  morando em componente).
- **Engines aglomerados:** `lib/engines.ts` carrega 9 objetos diferentes
  (Normative/Risk/Inspection/Action/Economic/Decision/Priority/Automation/LariContext).
  Cada um deveria ser uma "skill" separada.

### 4.2 Lacunas claras

- **PGR Vivo** e **Maturidade** estão no escopo conceitual do produto mas não têm
  nenhuma linha de código.
- **CLIs zeradas** — não há nenhum script de validação além do `lint`.
- **MCPs zeradas** — só Gemini.

### 4.3 Duplicações conceituais

- **Três sistemas de "regra"** coexistem: `rules` (custom), `riskRules` (pacote),
  `fixedNrRules` (90 NR). Cada um com schema diferente, todos consumidos pelo motor.
- **Dois checklists** — `INITIAL_CHECKLISTS` (sementes editáveis) e `fixedNrChecklists`
  (rígidos), unificados em runtime por `getTodosChecklistsAtivos`.
- **Helpers de NR duplicados** — `getNrNumber` em `normativeRules.ts` e
  `normativeChecklists.ts`; `getNrIdNumber` em `nrMatrix.ts`. Mesma lógica.
- **Dois `useAppStore`** — `lib/store.ts` (Zustand, usado) e `contexts/AppContext.tsx`
  (useReducer, **não usado** mas `<AppProvider>` está montado em `layout.tsx`).
- **Dashboard duplicado em rotas** — `/` e `/central` re-exportam o mesmo
  `FlowDashboard`.

### 4.4 Imports/variáveis órfãs

- `app/operacao/inspecoes/page.tsx`: `AcaoRecomendadaCard`, `getTodasRegrasAtivas`,
  `normativeDetection`, `addRisco`, `addAcao` — declarados, nunca consumidos.
- `app/operacao/matriz/page.tsx`: `compareNRs` importado, nunca chamado.
- `app/central/motor/page.tsx`: `rules` e `activeRulePackages` calculados, nunca lidos.

### 4.5 Arquivos sem consumidores

- `lib/dashboardMetrics.ts`, `lib/utils.ts`, `hooks/use-mobile.ts`,
  `contexts/AppContext.tsx`.

### 4.6 Rotas inconsistentes

- Sidebar tem `Link href="/ajuda"` mas não existe `app/ajuda/page.tsx` (404).
- `app/operacao/incidentes/page.tsx` existe mas não está no Sidebar (órfã).
- Menu de perfil lista `/configuracoes` duas vezes (rótulos "Personalização" e
  "Configurações").

### 4.7 Tipos com sinônimos

- `StatusAcao`: Concluída/Concluído/Fechada são o mesmo. Vencida/Em atraso/Atrasada
  também. Pendente/Em aberto também.
- `StatusInspecao`: Agendada/Programada; Concluída/Realizada.
- `Prioridade` mistura 9 valores (Baixa/Média/Alta/Crítica + P1-P4 + Urgente).
- Campos PT/EN no mesmo objeto: `titulo`/`title`, `prazo`/`due_date`,
  `inspection_id`/`inspecaoId`, `responsavel`/`responsible`. Hooks vivem fazendo
  `acao.title || acao.titulo`.

---

## 5. Estrutura alvo sugerida

> Proposta conceitual de onde cada coisa **deveria** morar quando o reorg começar.
> Nada precisa ser feito agora. Mantém Next.js App Router.

```
remix_-apexshield-sst-inteligência/
├─ README.md                       ← visão real do produto (substitui o bootstrap)
├─ ARCHITECTURE.md                 ← este arquivo
├─ docs/
│   ├─ FLUXO.md                    ← fluxo principal (inspeção → risco → ação)
│   ├─ REGRAS.md                   ← regras de produto (SLA, escalonamento, evidência)
│   ├─ MODULOS.md                  ← módulos existentes + roadmap
│   └─ CHANGELOG.md
│
├─ app/                            ← rotas Next.js (sem mudança estrutural)
│   ├─ api/
│   │   ├─ lari/route.ts           ← (existe) chat
│   │   ├─ inspecoes/route.ts      ← (futuro) quando sair do localStorage
│   │   ├─ riscos/route.ts         ← (futuro)
│   │   └─ acoes/route.ts          ← (futuro)
│   └─ (rotas atuais permanecem)
│
├─ src/
│   ├─ skills/                     ← capacidades inteligentes (1 por arquivo)
│   │   ├─ detectarRisco.js
│   │   ├─ gerarAcao.js
│   │   ├─ calcularPrioridade.js
│   │   ├─ exigirEvidencia.js
│   │   ├─ gerarRelatorio.js
│   │   ├─ gerarInsights.js
│   │   ├─ calcularDashboard.js
│   │   └─ atualizarPGRVivo.js
│   │
│   ├─ motor/                      ← regras de negócio
│   │   ├─ nrs/
│   │   ├─ setores.js
│   │   ├─ atividades.js
│   │   ├─ riscosPadrao.js
│   │   ├─ acoesPadrao.js
│   │   ├─ sla.js
│   │   ├─ evidencias.js
│   │   ├─ pgrVivo.js
│   │   ├─ maturidade.js
│   │   ├─ reincidencia.js
│   │   └─ impactoEstimado.js
│   │
│   ├─ apis/                       ← contratos (mesmo que ainda chamem store)
│   │   ├─ inspecoes.js
│   │   ├─ riscos.js
│   │   ├─ acoes.js
│   │   ├─ evidencias.js
│   │   ├─ dashboard.js
│   │   ├─ inteligencia.js
│   │   ├─ relatorios.js
│   │   └─ configuracoes.js
│   │
│   ├─ mcps/                       ← integrações futuras (stubs hoje)
│   │   ├─ supabase.js
│   │   ├─ whatsapp.js
│   │   ├─ drive.js
│   │   └─ email.js
│   │
│   └─ store/                      ← Zustand fica só com dados
│       └─ index.js                ← derivado de lib/store.ts no futuro
│
├─ cli/                            ← scripts node (não Next)
│   ├─ validar-mocks.js
│   ├─ validar-regras.js
│   ├─ validar-dashboard.js
│   ├─ validar-orfaos.js
│   ├─ validar-nrs.js
│   └─ validar-evidencias.js
│
├─ lib/                            ← (existente) mantido durante transição
└─ components/                     ← (existente) mantido
```

---

## 6. O que pode ser reorganizado sem quebrar (ordem segura)

Cada item abaixo pode ser executado isoladamente sem afetar runtime.

1. **Criar `docs/`** com `FLUXO.md`, `REGRAS.md`, `MODULOS.md` derivados deste mapa.
   Custo zero, ganho de onboarding.
2. **Reescrever `README.md`** removendo o boilerplate do AI Studio e colocando a visão
   do produto (1 parágrafo) + link pro `ARCHITECTURE.md`.
3. **Criar `cli/`** com 6 scripts `.js` standalone que rodam `node cli/validar-xxx.js`.
   Cada um lê os arquivos do projeto (regras/mocks/dashboard) e cospe relatório.
   Não toca em nada do runtime.
4. **Criar `src/skills/`, `src/motor/`, `src/apis/`, `src/mcps/`** como **stubs `.js`**
   que **importam e reexportam** o que já está em `lib/`. Exemplo:
   `src/motor/sla.js → export { engineConfig } from '../../lib/store'`. Nenhum import
   existente quebra; novo código pode começar a usar `src/`.
5. **Anotar em cada arquivo de `lib/`** (no topo, comentário) a qual camada ele
   pertence. Custo zero. Facilita o próximo refactor.

## 7. O que exige cuidado

1. **Mover qualquer arquivo de `lib/`** quebra imports `@/lib/...` em ≥20 pontos.
   Se mover, fazer com mod-path + grep coordenado.
2. **Unificar `getNrNumber`/`getNrIdNumber`** — fácil, mas exige alinhar assinatura
   (um recebe `nr`, outro recebe `id`).
3. **Apagar `contexts/AppContext.tsx`** — primeiro remover `<AppProvider>` de
   `layout.tsx`, depois o import, depois o arquivo. Três passos atômicos.
4. **Tocar nos tipos `StatusAcao` / `StatusInspecao` / `Prioridade`** — afeta dezenas
   de comparações `===` em UI. Precisa de migração de dados no `localStorage`
   persistido (`app-storage` key) senão usuários antigos veem itens "sumidos".
5. **Mover `processAutoActions` pra `src/skills/`** — exige separar do `useAppStore`
   set/get. Hoje a função fecha sobre o store. Refator não trivial.
6. **Trocar localStorage por Supabase** — escopo de épico. Tipos atuais
   (`addRisco: any => void`) não dão garantia mínima.
7. **Renomear rotas** (`/operacao/acoes` → `/acoes` etc.) — quebra deep-links,
   precisa adicionar redirects em `next.config.ts`.

---

## 8. Resumo de saúde por camada

| Camada | Existe? | Maturidade | Próximo passo sugerido |
| --- | --- | --- | --- |
| README | Sim (mínimo) | 1/5 | Reescrever com visão real |
| Skills | Sim, mas embaralhadas em `lib/engines.ts` | 3/5 | Quebrar em arquivos por skill |
| APIs | Implícitas no store | 2/5 | Criar `src/apis/` como fachada |
| Motor | Concentrado em `lib/` (forte) | 4/5 | Documentar SLAs e adicionar PGR + Maturidade |
| CLIs | Inexistente | 0/5 | Criar `cli/` com 6 scripts node |
| MCPs | Inexistente (só Gemini) | 0/5 | Stubs em `src/mcps/` |

---

*Documento gerado a partir de inventário automatizado em 2026-05-11. Nenhum arquivo
de código foi modificado.*
