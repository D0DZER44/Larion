# Princípios do Produto

> Os princípios são **invariantes de design**. Qualquer feature pode mudar;
> esses não. Quando dois pedidos entram em conflito, ganha o que respeita
> os princípios. Quando todos os pedidos respeitam, ganha o que mais reforça
> a frase central.
>
> Frase central:
>
> > **"Nada crítico fica sem dono, prazo e evidência."**

Estes princípios complementam — não substituem — as 30 **regras invariantes
operacionais** em `REGRAS-DE-NEGOCIO.md`. Esse arquivo aqui é arquitetural;
o outro é regulamentar.

---

## P1 — Tudo entra por uma fonte

**Inspeção é a única porta de entrada operacional do produto.** Risco e
ação **não** são criados do nada — emergem da inspeção (ou de cadastro
manual que aceita as mesmas regras do motor).

**Por quê:** controlar a entrada é controlar a qualidade. Se qualquer um
puder criar risco "porque sim", o motor perde sentido e o produto vira
formulário livre.

**Implicações:**
- Cadastro manual de risco/ação ainda existe, mas passa por
  `applyManualRules` (lib/risk-calculations.ts) — mesmo motor da inspeção.
- Importação de dados externos (V2) precisa ser canonizada pelo motor.
- Integrações de mensageria (WhatsApp) podem criar **comentário** em item
  existente, nunca abrir um item novo do zero sem motor.

---

## P2 — Tudo vira item operacional

**Nenhum dado fica solto.** Cada não-conformidade, cada risco, cada
desvio identificado **vira um item** com identidade própria — não vira
campo de texto perdido em documento.

**Por quê:** SST tradicional fracassa por gerar PDF que ninguém lê.
ApexOps fracassa se permitir mesma coisa.

**Implicações:**
- Pergunta de checklist respondida "Não" **sempre** vira risco
  (ou tem flag explícita `geraRisco: false` na regra).
- Observação textual em inspeção **não conta** como tratamento. Precisa
  virar ação atribuída.
- Anexar PDF em inspeção não cria item. Anexar PDF **na ação** vira
  evidência.

---

## P3 — Item crítico precisa de dono

**Toda ação tem responsável + validador.** Não há ação "Pendente sem
ninguém". O motor preenche default (`inspecao.responsavel`) e o operador
troca depois — mas o campo nunca fica vazio.

**Por quê:** "responsabilidade compartilhada" não existe na prática. SST
exige nome de pessoa para cobrança e responsabilização legal.

**Implicações:**
- Criar ação sem responsável é erro — motor recusa.
- Reatribuir ação exige justificativa (já está em
  `app/acoes/hooks.ts → reatribuirAcao`).
- Validador ≠ responsável quando criticidade é Alta/Crítica (dupla
  checagem). Princípio respaldado pela **R18**.

---

## P4 — Item crítico precisa de prazo

**Todo item carrega prazo absoluto (ISO), não texto livre.** O motor
calcula: criticidade × `prazoPadraoHoras` × data-base = data limite.

**Por quê:** texto livre ("urgente", "logo", "esta semana") é negociação.
Prazo absoluto é compromisso.

**Implicações:**
- SLA por criticidade é tabelado (`Crítica 24h / Alta 72h / Média 7d /
  Baixa 30d`).
- Prazo vence sozinho — `processAutoActions` marca como `Vencida` quando
  passa.
- Follow-up automático (4h sem update em crítica → notifica;
  8h → escalona). Princípio respaldado pela **R13**.

---

## P5 — Item crítico/alto **pode** exigir evidência

**Crítico e Alto exigem.** Médio e Baixo podem ou não exigir, conforme
a regra do checklist. O default é sempre "exige" para Crítico/Alto.

**Por quê:** evidência é o que difere SST executada de SST narrada.
Sem foto, não tem prova; sem prova, não tem defesa documental.

**Implicações:**
- `actionRequiresEvidence` decide na hora da conclusão da ação.
- Sem evidência válida, status permanece `Aguardando Validação` — não
  vai pra `Concluída`.
- V1: aceita string/URL. V2: upload real + hash SHA-256.
- Princípio respaldado pelas **R6 e R11**.

---

## P6 — Triagem antes de execução

**Há uma etapa explícita de triagem.** Não se executa uma inspeção sem
saber a prioridade; não se inicia uma ação sem saber o impacto.

**Por quê:** sem triagem, o usuário gasta tempo no problema errado. Linear
ensinou: a inbox triada é mais importante que a velocidade da execução.

**Implicações:**
- A tela principal (Operação > Inspeções) abre na aba **"Hoje"** —
  inspeções do dia priorizadas.
- "Iniciar inspeção" mostra fila priorizada: Em andamento → Atrasada → Hoje
  → Agendada.
- Ações são exibidas em buckets (Pendentes / Em andamento / Concluídas /
  Histórico) — usuário escolhe a frente, não tudo de uma vez.
- Dashboard agrega; ele **não** é o ponto de partida da operação.

---

## P7 — Dashboard só lê dados

**Dashboard nunca grava. Nunca calcula regra. Nunca decide.** É puramente
um espelho do estado consolidado.

**Por quê:** se a UI de leitura puder mudar o estado, perde-se idempotência
e rastreabilidade. Toda mudança passa pelo motor.

**Implicações:**
- `FlowDashboard.tsx` não chama `addRisco`, `updateAcao` etc.
- KPIs (score, multa evitada/estimada) são **derivações puras** do estado
  — recomputáveis a qualquer momento.
- Filtros no dashboard não alteram dados, só a visão.
- Reset de cache do dashboard nunca afeta dados reais.

---

## P8 — Inteligência recomenda, não inventa

**A L.A.R.I (Gemini) responde com base no estado real.** Não inventa risco
que não existe, não cria multa que não foi calculada pelo `FineEngine`,
não sugere ação fora do catálogo.

**Por quê:** inteligência que alucina em SST mata pessoas. Literalmente.
A IA aqui é copiloto, não autor.

**Implicações:**
- Toda resposta da L.A.R.I é construída sobre `LariContextEngine.getRealtimeContext`
  (estado atual do store).
- Sem `GEMINI_API_KEY` o sistema cai pro fallback offline com **dados
  brutos** — não tenta narrar nada inventado. Respaldado pela **R16**.
- Recomendação da IA aparece como sugestão — usuário confirma para virar
  item operacional.
- Nenhuma ação é criada **automaticamente pela IA**. Criação automática
  vem só do motor determinístico (regras NR).

---

## Aplicação prática

Quando um pedido de feature/PR chegar, passar por este checklist:

1. **Entra pela fonte canônica?** (P1)
2. **Vira item operacional rastreável?** (P2)
3. **Tem dono claro?** (P3)
4. **Tem prazo absoluto?** (P4)
5. **Exige evidência quando crítico?** (P5)
6. **Respeita a fase de triagem?** (P6)
7. **Mantém dashboard só-leitura?** (P7)
8. **Inteligência recomenda, não inventa?** (P8)

Se algum princípio é violado, o pedido vira "decisão arquitetural" e ganha
um ADR em `/decisions/`.

---

## Relação com outros docs

- `REGRAS-DE-NEGOCIO.md` — 30 regras operacionais que **materializam** estes
  princípios em código (R1–R30).
- `PRODUCT_STRATEGY.md` — onde estes princípios se encaixam na estratégia.
- `FLUXO-OPERACIONAL.md` — fluxo único que executa estes princípios.
- `decisions/` — ADRs que registram quando estes princípios foram aplicados
  ou negociados.
