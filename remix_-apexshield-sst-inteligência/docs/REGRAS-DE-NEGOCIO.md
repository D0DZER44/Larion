# Regras de Negócio

> Invariantes do produto. Toda feature nova precisa **respeitar** estas regras —
> se for quebrar, exige decisão explícita documentada.

---

## R1 — Toda inspeção tem 10 atributos visíveis

Cada inspeção (em qualquer aba) precisa expor:

`setor · responsável · checklist · NR relacionada · data · status · evidências · não conformidades · riscos gerados · ações geradas`

**Por quê:** a inspeção é o documento mínimo de defesa do programa SST.

**Onde valida:** `app/operacao/inspecoes/page.tsx` (tabela unificada).

---

## R2 — Inspeção tem 5 estados operacionais

`Hoje (Inspeção do dia) · Agendada · Em andamento · Atrasada · Concluída`

**Por quê:** simplifica leitura do operador. "Realizada" e "Concluída" são
sinônimos — o sistema só guarda um.

**Cascata:**
- `Agendada` + data == hoje → `Hoje`
- Qualquer estado + data passada e não-concluída → `Atrasada`
- `Em andamento` + conclusão → `Concluída`

---

## R3 — Checklist é o motor de risco, não lista de perguntas

Toda pergunta de checklist carrega obrigatoriamente os **8 campos do motor**:

| Campo | Obrigatório |
| --- | --- |
| pergunta (text) | sim |
| NR vinculada (nrRelacionada) | sim |
| pacote | sim |
| criticidade se não conforme | sim |
| ação sugerida | sim |
| exige evidência? | sim |
| gera risco? | sim |
| prazo padrão (horas) | sim |

**Quando campo faltar:** `enrichChecklistQuestion` em `lib/normativeChecklists.ts`
preenche default (criticidade → prazo, criticidade → exigeEvidencia, NR → pacote).

---

## R4 — Resposta `Não` em pergunta com `geraRisco: true` cria risco

**Sempre.** Sem confirmação, sem botão extra. O motor é proativo.

**Exceção:** `geraRisco: false` no item — usado para perguntas informativas
(ex: "Houve alguma observação adicional?").

**Idempotência:** ID do risco é `risk-${inspectionId}-${itemId}`. Re-rodar
a inspeção atualiza, não duplica.

---

## R5 — Risco Crítico ou Alto sem ação → motor cria ação automática

**Trigger:** `processAutoActions()` em `lib/store.ts` roda a cada `addRisco`,
`updateRisco`, `addInspecao`, `updateInspecao`, e no `LayoutShell` a cada 60s.

**ID idempotente:** `act-${riskId}`.

**Prazo:** P1 (Crítico) = 24h, P2 (Alto) = 72h.

---

## R6 — Ação crítica exige evidência para concluir

`lib/action-rules.ts → actionRequiresEvidence(acao)`:

- Crítica → sempre `true`.
- Alta → sempre `true`.
- Média → depende do checklist item.
- Baixa → opcional.

**Bloqueio:** ação sem evidência permanece em `Aguardando Validação`. Não pode ir
pra `Concluída`.

**Por quê:** sem evidência = sem defesa documental no MTE.

---

## R7 — Ação concluída + validada → risco vira "Mitigado"

**Cascata** em `app/acoes/hooks.ts → updateActionStatus`:

```
todas relevantes em (Concluída + Validada)  →  risco = Mitigado
alguma em (Aguardando Validação)            →  risco = Em análise
alguma reaberta                              →  risco = Aberto
```

**"Relevantes"**: se o risco tem ação Crítica/Alta, só essas contam. Senão, todas.

---

## R8 — Reabertura preserva histórico

Reabrir uma ação ou risco **não apaga** o histórico anterior. O novo evento é
acrescentado em `acao.historico[]` com `evento: "Reabertura"` e justificativa
obrigatória.

---

## R9 — Pacote desativado não dispara regras

Quando `rulePackages[].isActive === false`, o motor:
- Não cria novos riscos baseados em regras daquele pacote.
- Esconde riscos antigos do pacote no dashboard (filtro `activePackageNames`).
- Mantém os dados no store — não apaga histórico.

**Exceção:** `Base SST` **sempre ativo**. UI bloqueia desativar.

---

## R10 — Regras fixas NR não são editáveis

`fixedNrRules` em `lib/normativeRules.ts` (90 regras) são imutáveis para o cliente.
UI bloqueia em `/configuracoes → Regras → Fixas`.

**Por quê:** são o diferencial do produto. Cliente edita só o pacote "Personalizadas".

---

## R11 — Toda multa segue tabela NR-28

`lib/fineEngine.ts → calcularFaixaMulta()` é a **única fonte** de cálculo de multa.
UI nunca hard-coda valor.

**Entradas:** `nr, criticidade, numeroEmpregados, reincidencia?, tipoInfracao?,
nivelInfracao?`.

**Saída:** `{ minimoEstimado, maximoEstimado, faixaLabel, baseLegal, disclaimer }`.

**Disclaimer obrigatório:** toda exibição de valor estimado mostra o aviso "Estimativa
preventiva. Valor real depende de fiscalização."

---

## R12 — Pessoa no centro

Todo risco, ação e inspeção carrega:
- `trabalhadoresExpostos: number`
- `perfilExposto: string`

UI prioriza esses campos sobre números técnicos:
- ❌ "3 riscos críticos abertos"
- ✅ "42 vidas expostas a 3 riscos críticos"

---

## R13 — SLA tem origem clara

Prazo de uma ação vem nessa ordem:
1. `item.prazoPadraoHoras` (do checklist).
2. `regraFixa.prazoBase × 24` (regra NR vinculada via `regraId`).
3. `engineConfig.slas` (default por criticidade).

Nunca é hard-coded em UI.

---

## R14 — NRs aparecem em ordem numérica

`getTodasRegrasAtivas`, `getNRsAplicaveis`, `NR_MATRIX_ORDENADA`,
`getTodosChecklistsAtivos` — todos retornam ordenados por número de NR (01 → 35)
e dentro de cada NR alfabético por título.

UI nunca reordena por outro critério sem ser explícito no nome ("ordenar por
criticidade").

---

## R15 — Persistência: localStorage no V1, Supabase no V2

**V1:** Zustand + `persist(localStorage)` com key `app-storage`.

**V2:** migração com versionamento. Schema antigo precisa ser convertido — nenhum
dado do cliente é descartado.

---

## R16 — L.A.R.I responde com dados reais ou marca como offline

`/api/lari/route.ts`:
- Se `GEMINI_API_KEY` ausente → resposta `isOffline: true` com dados brutos do
  contexto (sem inventar narrativa).
- Se Gemini falhar → mesmo fallback offline.

L.A.R.I **nunca** inventa risco/ação/número que não esteja no estado.

---

## R17 — Único ponto de cálculo de multa NR-28

`lib/fineEngine.ts`. Qualquer feature que precise estimar multa importa daqui —
não duplica a tabela.

(Reforço da R11. Listada também aqui por importância.)

---

## R18 — Toda ação tem responsável e validador

Nunca uma ação fica sem `responsavel` E sem `validador`. Quando o motor cria
automaticamente, usa `inspecao.responsavel` como ambos (operador troca depois).

**Validador ≠ responsável** quando ação é Crítica — exige dupla checagem.

---

## R19 — Reincidência aumenta a multa

`engineConfig.economia.fatorReincidencia` (default 1.2) multiplica a multa
estimada quando o sistema detecta reincidência.

**V1:** flag manual no `engineConfig`.
**V2:** detecção automática — mesmo `regraId` no mesmo setor em < 90 dias.

---

## R20 — Bloqueio operacional só com flag explícita

Regra ou item de checklist com `bloqueante: true` permite ao gestor **paralisar
a atividade** até regularização.

UI mostra alerta visual e bloqueio de "iniciar atividade" enquanto risco
bloqueante estiver aberto.

---

## R21 — Histórico é imutável

`acao.historico[]` e `logs[]` são append-only. Editar evento antigo é violação.

**V2:** hash SHA-256 por evento + chain (cada evento referencia hash do anterior)
pra detectar adulteração.

---

## R22 — Dashboard reflete apenas dados ativos

Score, multa estimada, riscos críticos — todos filtram por
`pacote === "Base SST" || pacotesAtivos.includes(pacote)`.

Riscos de pacotes desativados ficam visíveis em "Mostrar inativos" mas não
contam no score.

---

## R23 — Toda mudança de estado dispara log + alerta

`addAcao`, `addRisco`, `addInspecao` — todos criam entrada em `logs[]` e em
`alertas[]` com severidade derivada.

**Por quê:** auditoria + central de notificações.

---

## R24 — Operação não bloqueia leitura

Mesmo offline (sem Gemini), o usuário consegue:
- Ler inspeções, riscos, ações.
- Executar inspeção (gera local).
- Ver dashboard.

Só perde: chat L.A.R.I com IA real (cai pra fallback de números brutos).

---

## R25 — Componentes não falam com API externa

Toda chamada externa (Gemini, Supabase, WhatsApp) passa por:
1. API route em `app/api/<provider>/route.ts` (server-side, segredos seguros).
2. Cliente tipado em `lib/<provider>/client.ts`.
3. UI consome só o cliente, nunca `fetch` direto.

**Por quê:** segurança de chaves + observabilidade unificada.

---

## R26 — Linguagem da UI é português operacional

- ❌ "Compliance dashboard"
- ✅ "Painel de conformidade"
- ❌ "Active rules"
- ✅ "Regras ativas"
- ❌ "User onboarding"
- ✅ "Cadastro de colaborador"

Termos NR mantém forma oficial: `NR-12`, `NR-35` (não "norma 12").

---

## R27 — Tipos PT e EN convivem mas sempre PT é fonte da verdade

Por compat histórica, alguns campos têm versão PT e EN
(`titulo/title`, `prazo/due_date`). **PT é canônico**, EN é alias de leitura.

**V2:** unificar pra PT apenas + migração de dados.

---

## R28 — Página renderizada vazia precisa ter empty state útil

Toda lista vazia mostra:
- Ícone + texto explicando o estado.
- CTA principal (ex: "Iniciar primeira inspeção").
- Link pra documentação se o conceito for novo.

**Não** mostrar lista vazia em branco.

---

## R29 — Nenhuma ação automática silenciosa

Quando o motor cria risco/ação automaticamente:
- Cria entrada em `logs[]` ("Risco gerado automaticamente da inspeção #...").
- Cria entrada em `alertas[]` com severidade.
- Marca `auto_generated: true` no objeto.

Usuário sempre consegue rastrear "quem fez isso?".

---

## R30 — Decisão arquitetural exige documentação

Mudança em:
- Tipo (`StatusAcao`, `Prioridade`)
- Schema de persistência
- Regra de motor (`SLA`, `processAutoActions`)
- Rota nova ou removida

**Atualiza `/docs`** no mesmo PR. PR sem doc não passa em review.

---

## Como usar este documento

1. Antes de implementar uma feature, leia as regras relevantes (R1–R30).
2. Se a feature **viola** uma regra, escreva o motivo no PR e marque o time
   pra discussão.
3. Toda regra nova entra aqui — com número, motivo, ponto de validação.
4. Regras numeradas são estáveis — não renumeramos. Aposentadas viram
   "R12 (revogada em 2026-XX-XX)".
