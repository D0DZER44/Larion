# ADR 008 — Produto Dirigido por Benchmarks

**Status:** Aceita
**Data:** 2026-05-11
**Decisores:** Founder + Time de produto
**Substitui:** —
**Substituída por:** —

---

## Contexto

ApexOps SST entra num espaço com **dois extremos historicamente ruins**:

- Lado A: ferramentas EHS corporativas (EHS Insight, EcoOnline, Cority,
  Intelex). Cobrem tudo, processo lento, vocabulário pesado, vendido pra
  comprador de TI. Cliente PME brasileiro não consegue usar.
- Lado B: ferramentas genéricas (Trello, ClickUp, planilha). Flexíveis,
  baratas, sem motor de SST. Cliente "encaixa" SST em workflow que não foi
  feito pra isso.

A tentação natural seria construir copiando uma das duas pontas. Decidimos
não — vamos copiar **capacidades específicas** de cinco produtos diferentes,
recusando explicitamente virar qualquer um deles.

---

## Decisão

Adotamos uma estratégia **benchmark-driven** com cinco referências, cada
uma fornecendo uma capacidade específica e uma armadilha clara:

| Benchmark | Copiamos | Recusamos |
| --- | --- | --- |
| Linear | velocidade, triagem, item enxuto, foco | linguagem só-tech |
| SafetyCulture | campo, checklist, foto, inspeção rápida | virar só app de checklist |
| ClickUp/Monday | flexibilidade, filtros, automações | virar ferramenta genérica |
| EHS Insight/EcoOnline | mercado validado, ações, compliance, rastreabilidade | virar EHS completo |
| Ramp/Retool | linguagem de valor, eficiência, operação | ficar abstrato |

Documentos vivos:

- `/docs/BENCHMARKS.md` — análise completa de cada benchmark.
- `/docs/WHAT_TO_COPY_AND_AVOID.md` — matriz operacional.
- `/docs/PRODUCT_STRATEGY.md` — onde se encaixa na bússola maior.

---

## Consequências

### Positivas

- Cada feature pode ser justificada citando o benchmark de origem.
- Reuniões de produto têm vocabulário comum ("isso é mais Linear ou mais
  ClickUp?").
- Recusas a pedidos de cliente ficam objetivas — apontamos pra "evitar"
  da tabela.
- Onboarding de novo dev fica curto — leitura de `BENCHMARKS.md` já
  ancora a tese.

### Negativas

- Demanda manutenção: se um benchmark mudar de rota, precisamos revisar.
- Risco de "copiar tudo" virar incoerente — daí a obrigatoriedade da
  coluna "Recusar" em cada benchmark.
- Cliente pode pedir "por que não fazem X que o EHS Insight tem?". Resposta
  padrão: porque escolhemos a profundidade SST sobre largura EHS — link
  pra ADR-011.

### Neutras

- Fica claro que **não vendemos o produto como "alternativa ao Monday"**
  nem como "EHS pra PME". Vendemos como **central operacional de SST**.
  Posicionamento próprio.

---

## Alternativas consideradas

1. **Posicionamento puro vs concorrente único** (ex: "ApexOps é o EHS
   Insight brasileiro"). Recusada — herda os defeitos do concorrente.
2. **Construir sem referência** ("nosso jeito"). Recusada — vira reinventar
   roda em UI básica (atalhos, filtros, etc.).
3. **Benchmark único** (ex: só Linear). Recusada — Linear não resolve
   campo (mobile/foto) nem compliance (rastreabilidade NR).

---

## Validação

A decisão é considerada bem-sucedida se, em revisão trimestral, conseguirmos
responder estas três perguntas afirmativamente:

1. Toda feature shippada referencia o benchmark de origem.
2. Pelo menos uma feature foi recusada citando a coluna "evitar".
3. Vocabulário interno do time menciona pelo menos um benchmark por
   semana.

---

## Referências

- `docs/BENCHMARKS.md`
- `docs/WHAT_TO_COPY_AND_AVOID.md`
- `docs/PRODUCT_STRATEGY.md`
- ADRs derivadas: 009, 010, 011, 012.
