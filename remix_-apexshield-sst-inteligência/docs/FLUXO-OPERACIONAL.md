# Fluxo Operacional

> Da inspeção planejada até o PGR vivo. Esse é o **fluxo único** que dá sentido
> ao produto. Toda feature precisa caber em alguma etapa abaixo.

---

## Visão geral

```
[1] Inspeção  →  [2] Não conformidade  →  [3] Risco  →  [4] Ação
       │                                                     │
       │                                                     ▼
       │                                              [5] Evidência
       │                                                     │
       │                                                     ▼
       └──────────────────►  [6] Dashboard  ←──────────────┘
                                  │
                                  ▼
                          [7] Central executiva
                                  │
                                  ▼
                          [8] Relatórios
                                  │
                                  ▼
                          [9] PGR Vivo
```

Cada caixa é uma **entidade do domínio**. Cada seta é uma **transformação** do motor
(geralmente automática).

---

## [1] Inspeção

### O que é

Auditoria de campo de uma atividade ou setor, baseada num **checklist** específico.

### Quem cria

- Manual: gestor SST agenda em `/operacao/inspecoes`.
- Automático (futuro V2): regra de recorrência (toda 2ª segunda do mês — inspeção
  elétrica).

### Estados

`Agendada → Hoje → Em andamento → Concluída`
(ou `Atrasada` em qualquer ponto, ou `Cancelada`)

### Dados obrigatórios

- Setor (`ondeUsar`)
- Responsável
- Checklist vinculado (define a NR)
- Data
- Trabalhadores expostos + perfil exposto

### O que dispara

- Mudança de status (`Agendada → Em andamento`) ⇒ marca em log + abre cronômetro.
- Conclusão ⇒ chama `AutomationEngine.processInspection(id)`.

### Onde no código

- UI: `app/operacao/inspecoes/page.tsx`
- Execução: `app/inspecoes/ExecutionView.tsx`
- Store: `lib/store.ts → addInspecao`, `updateInspecao`

---

## [2] Não conformidade (NC)

### O que é

Resposta `Não` ou `Parcialmente` em uma pergunta do checklist durante a execução.

### Quem identifica

Auditor durante a inspeção.

### Dados que cada NC carrega (do checklist)

| Campo | Origem |
| --- | --- |
| pergunta | item.text |
| NR vinculada | item.nrRelacionada |
| pacote | item.pacote |
| criticidade | item.criticidade |
| ação sugerida | item.acaoSugerida |
| exige evidência? | item.exigeEvidencia |
| gera risco? | item.geraRisco |
| prazo padrão | item.prazoPadraoHoras |

### O que dispara

- Se `item.geraRisco === false` → registra a NC sem propagar.
- Se `item.geraRisco === true` (default) → passa pra etapa [3].

### Status atual no código

Não existe entidade `NaoConformidade` formal. NCs são `inspection.items[]` com
`status: "Não"`. Risco e ação são geradas diretamente sem passar por uma entidade
intermediária. Isso será refatorado no V2.

---

## [3] Risco

### O que é

Probabilidade de incidente ocupacional vinculada a uma NC.

### Quem gera

- Automático: `AutomationEngine.processInspection` cria `risk-${insp}-${item}`.
- Manual: operador cadastra em `/operacao/riscos` (forms livre).

### ID idempotente

`risk-${inspectionId}-${checklistItemId}` — se já existir, **atualiza**, não duplica.

### Estados

`Aberto → Em análise → Mitigado` (ou `Vencido` se prazo estoura sem ação).

### Dados que herda

Todos os 8 campos da NC + NR-28 calculada (multa min/max) + dados da pessoa
(trabalhadores expostos, perfil).

### O que dispara

- Risco Crítico/Alto sem ação → `processAutoActions` gera ação automática
  (passo [4]).
- Risco volta como `Mitigado` quando todas as ações vinculadas estão
  `Concluída + Validada`.

### Onde no código

- Geração: `lib/engines.ts → AutomationEngine.processInspection` (bloco "RISK
  GENERATION")
- Store: `lib/store.ts → addRisco`, `updateRisco`
- Cascata: `app/acoes/hooks.ts → updateActionStatus`

---

## [4] Ação corretiva

### O que é

Plano de mitigação concreto pra um risco. Tem responsável, prazo e exigência de
evidência.

### Quem gera

- Automático: `AutomationEngine.processInspection` (a partir de risco da inspeção).
- Automático: `processAutoActions` (a partir de risco crítico sem ação).
- Manual: operador cria em `/operacao/acoes`.

### ID idempotente

`act-${riskId}` — uma ação por risco automático.

### Estados

```
Pendente → Em andamento → Aguardando Validação → Validada/Concluída
   │                              │
   ▼                              ▼
Cancelada                     Rejeitada → volta pra Em andamento
```

Status paralelo: `Vencida` se prazo expira sem conclusão.

### Dados herdados

| Campo | De onde |
| --- | --- |
| título | `Mitigação: ${risco.titulo}` |
| descrição | `acaoSugerida` da NC |
| prazo | `now() + prazoPadraoHoras` |
| prioridade | derivada de criticidade |
| responsável | inspecao.responsavel ou "Operação / SSO" |
| exigeEvidencia | `item.exigeEvidencia` |
| bloqueante | `item.bloqueante` |

### Follow-up automático

`useAcoes() → executarFollowUps()` roda a cada 60s:

| Criticidade | 1º follow-up | Escalonamento |
| --- | --- | --- |
| Crítica | 4h sem update | 8h sem update |
| Alta | 24h sem update | 48h sem update |
| Média | 48h sem update | 96h sem update |
| Baixa | 168h (7d) | 168h |

### Onde no código

- Geração: `lib/engines.ts → AutomationEngine.processInspection` (bloco "ACTION
  GENERATION") + `lib/store.ts → processAutoActions`
- Hooks: `app/acoes/hooks.ts → useAcoes`, `executarFollowUps`,
  `updateActionStatus`, `iniciarAcao`, `concluirAcao`, etc.
- UI: `app/operacao/acoes/page.tsx` + sub-componentes

---

## [5] Evidência

### O que é

Prova material (foto, PDF, vídeo, observação) de que a ação foi executada no campo.

### Quando é exigida

- Toda ação **Crítica** ou **Alta**.
- Toda ação cujo item de checklist tem `exigeEvidencia: true`.

### Status atual

V1: campo `acao.evidencia[]` aceita strings/URLs. **Sem upload real.**

### Status futuro (V2)

- Upload real via Supabase Storage ou Google Drive.
- Hash SHA-256 calculado no upload (anti-tampering).
- Metadata: `{ tipo, url, geolocalizacao, enviadoPor, enviadoEm, hash }`.

### Regra crítica

`lib/action-rules.ts → actionRequiresEvidence(acao)`:
- Se `true` e `acao.evidencia.length === 0` → ação **não pode** ir pra `Concluída`.
- Fica em `Aguardando Validação`.

### O que dispara

- Evidência anexada → habilita botão "Concluir ação".
- Validador aprova → ação vira `Concluída`; cascata pro risco (etapa [6]).

---

## [6] Dashboard

### O que é

Visão operacional em tempo real do estado consolidado.

### KPIs principais

| KPI | Origem |
| --- | --- |
| Exposição operacional | derivada de `riscoScore` + criticalCount |
| Trabalhadores expostos | soma `risco.trabalhadoresExpostos` (ativos) |
| Riscos críticos abertos | `riscos.filter(status !== Mitigado, nivel === Crítico)` |
| Ações atrasadas | `acoes.filter(status === Vencida)` |
| Inspeções hoje / atrasadas | derivadas de `data` vs hoje |
| Score operacional | 100 − penalty (riscos críticos × 3 + atrasos × 3 + ...) |
| Conformidade EPI | `epi_records` (ainda fake) |
| Multa evitada | soma `risco.multaEstimada` onde `status === Mitigado` |
| Multa estimada | soma `risco.multaEstimada` onde `status !== Mitigado` |
| Setor mais crítico | `groupBy(setor)` ordenado por peso |

### Atualização

Reativo via Zustand — toda mudança no store re-renderiza o dashboard
instantaneamente.

### Onde no código

- UI: `components/dashboard/FlowDashboard.tsx`
- Métricas: `lib/engines.ts → LariContextEngine.getRealtimeContext`
- (Não usado) `lib/dashboardMetrics.ts → calculateDashboardMetrics`

---

## [7] Central executiva

### O que é

Visão para alta gestão — agregada por organização inteira, foco em decisão e
narrativa, não em operação.

### Estado atual

`/central` re-exporta `FlowDashboard` (mesmo do `/`). **Conceitualmente errado** —
deveria ser uma visão diferente. Será corrigido no V2.

### O que deveria mostrar (V2)

- Tendência de score (linha 90 dias).
- Riscos por NR (heatmap).
- Comparativo entre setores.
- "Top 5 decisões da semana" (do DecisionEngine).
- Status do PGR Vivo.
- Maturidade SST (gauge).

---

## [8] Relatórios

### O que é

Snapshot histórico do programa — formato apresentável (PDF/HTML).

### Tipos planejados

- Executivo (mensal).
- Compliance (preparação pra fiscalização MTE).
- PGR (oficial).
- Customizado (filtros do usuário).

### Estado atual

`/relatorios` renderiza `FlowReportsPage`. HTML inline. Sem PDF, sem agendamento.

### V2

- Export PDF.
- Agendamento via cron (Vercel Cron + e-mail).
- Histórico de relatórios gerados.

---

## [9] PGR Vivo

### O que é

Programa de Gerenciamento de Riscos (obrigatório pela NR-01) que se atualiza
sozinho a cada inspeção concluída.

### Diferença pro PGR estático

| PGR tradicional | PGR Vivo |
| --- | --- |
| PDF anual revisado | Documento gerado sob demanda |
| Defasa em 6 meses | Sempre < 30 dias |
| Sem rastreabilidade | Hash + versionamento |
| Cadeia de revisão manual | Disparo automático |

### Estado atual

**Não implementado.** Escopo de V2.

### Trigger de regeneração

- Novo risco crítico identificado.
- Risco mitigado.
- Pacote de regras ativado/desativado.
- Operador clica "Gerar nova versão".

### Saída

- HTML on-screen + PDF/A pra arquivo.
- Hash SHA-256 publicado pra prova de integridade.
- Histórico de todas as versões anteriores acessível.

---

## Resumo: caminho da NC ao PGR

```
1. Auditor responde "Não" → cria NC implícita
2. Motor lê os 8 campos do item → cria Risco (idempotente)
3. Risco crítico/alto → motor cria Ação (idempotente)
4. Operador executa → anexa Evidência (obrigatória se crítica)
5. Validador aprova → Ação vira Concluída → Risco vira Mitigado
6. Dashboard atualiza score + multa evitada
7. Central executiva mostra tendência
8. Relatório próximo registra o ciclo
9. PGR Vivo regenera versão com o estado consolidado
```

Tempo total típico: **minutos para o motor reagir**, **horas/dias para a ação
ser executada no campo**, **semanas pro ciclo aparecer no PGR**.

---

## Pontos de fricção atuais

- Etapa [2] não é entidade própria — perde rastreabilidade longitudinal.
- Etapa [5] não tem upload real → fácil de fraudar.
- Etapa [7] é cópia da [6] — não cumpre função.
- Etapa [9] não existe — depende de cadência manual hoje.
- Cascata [4] → [3] (ação concluída → risco mitigado) tem casos edge não
  cobertos (ações múltiplas, validação parcial).
