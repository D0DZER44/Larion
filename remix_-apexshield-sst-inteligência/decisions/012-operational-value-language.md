# ADR 012 — Linguagem de Valor Operacional

**Status:** Aceita
**Data:** 2026-05-11
**Decisores:** Founder + Time de produto
**Relacionada:** ADR 008

---

## Contexto

A indústria de software corporativo brasileiro adora **abstração**:

> "Plataforma de gestão integrada de SST que potencializa a maturidade
> compliance da sua operação."

Frase morta. Não diz quem usa, o que faz, qual problema resolve. Ramp
(US fintech) e Retool (US dev tools) provaram que existe um caminho
diferente: **falar valor operacional concreto** pro operador do dia-a-dia.

- Ramp: "Spend less time on expenses, more time growing."
- Retool: "Build internal tools that work, in hours."

Ambos:
- usam verbos concretos,
- citam tempo,
- falam pra quem **opera** (não pro comprador),
- tem números mensuráveis embutidos.

Decidimos copiar esse jeito.

---

## Decisão

Toda comunicação do produto — copy de UI, landing page, email, vendas,
doc — segue a **regra dos 4 testes de linguagem**:

### Teste 1 — Concretude

A frase tem **substantivo concreto** (foto, prazo, risco, ação,
trabalhador, multa)? Se só tem abstração ("compliance, maturidade,
performance"), reescrever.

❌ "Aumente sua maturidade SST."
✅ "Toda ação crítica concluída com foto, em 24h."

### Teste 2 — Operador, não comprador

A frase fala com o **técnico SST que abre o app de manhã**? Se fala com
o "CEO interessado em redução de risco corporativo", reescrever (a menos
que seja material específico pra venda enterprise).

❌ "Nossa solução é estratégica para sua jornada digital."
✅ "Você abre o app e vê o que fazer hoje."

### Teste 3 — Tempo / Quantidade

Tem **número ou tempo** mensurável? Se não, adicionar.

❌ "Aja rápido em riscos críticos."
✅ "Risco crítico: 24h pra dono, prazo e evidência."

### Teste 4 — Vida humana

Quando o tema for SST especificamente, **a frase menciona vida ou pessoa**?
"Vidas protegidas", "trabalhadores expostos", "operário", "auditor de
campo" — sim. Só "risco" ou "ação" — frio demais.

❌ "12 riscos críticos abertos."
✅ "42 vidas expostas a 12 riscos críticos."

---

## Frase central (já adotada)

> **"Nada crítico fica sem dono, prazo e evidência."**

Passa nos 4 testes:
- Concretude: "dono", "prazo", "evidência".
- Operador: fala com quem cuida.
- Tempo: implícito em "prazo".
- Vida: "crítico" só significa algo se houver alguém em risco.

---

## Vocabulário recomendado

### Verbos preferidos

`tratar` · `mitigar` · `responder` · `iniciar` · `concluir` · `validar` ·
`anexar` · `escalar` · `bloquear`.

### Verbos a evitar

`gerenciar` (vago) · `potencializar` (vazio) · `otimizar` (corporativo) ·
`empoderar` (clichê) · `solucionar` (genérico) · `entregar valor` (anti-padrão).

### Substantivos preferidos

`risco crítico` · `ação` · `evidência` · `prazo` · `dono` · `setor` ·
`vidas expostas` · `multa estimada` · `inspeção do dia`.

### Substantivos a evitar (sem traduzir pra concreto)

`compliance` · `maturidade` · `governança` · `performance` ·
`sustentabilidade` (esse fora do escopo SST, ver ADR-011) ·
`transformação digital`.

---

## Consequências

### Positivas

- Copy diferenciado em landing/material vs concorrência (todo concorrente
  fala "compliance suite").
- Onboarding rápido — UI fala a língua do operador.
- Recusas mais fáceis: marketing/sales tem teste objetivo pra rejeitar
  texto.

### Negativas

- Pessoa que vem de marketing corporativo precisa desaprender. Pode gerar
  atrito interno.
- Cliente enterprise pode esperar "linguagem corporativa" no contrato.
  Tudo bem — contrato segue padrão jurídico; produto e marketing
  externos seguem este ADR.

### Neutras

- Reforça princípio **P3** (item crítico tem dono) e **P4** (prazo
  absoluto) — porque o vocabulário valida.

---

## Exemplos de reescrita

| Antes | Depois |
| --- | --- |
| "Visualize a maturidade do seu programa." | "Veja quantas ações foram concluídas com evidência este mês." |
| "Garanta compliance regulatório." | "Defesa documental pronta pra MTE." |
| "Solução EHS de classe mundial." | "Software de SST com motor brasileiro embutido." |
| "Empower your team." | "Cada técnico SST sabe o que fazer hoje pela manhã." |
| "Optimize your safety operations." | "Risco crítico vira ação com prazo de 24h, automaticamente." |

---

## Aplicação

Esta regra se aplica a:

- **UI in-app** — labels de botão, headers, empty states, tooltips,
  mensagens de erro.
- **Documentação de produto** — `/docs`, `/decisions`.
- **Material de marketing** — landing, blog, posts em redes sociais.
- **Sales decks** — sempre que houver concretude possível.
- **E-mails transacionais** — notificações, follow-ups, digest semanal.

Não se aplica a:

- **Texto jurídico** (TOS, política de privacidade, contratos).
- **Material legal exigido por LGPD/MTE** (mantém vocabulário oficial).

---

## Validação

- Auditoria trimestral de copy. Toda string de UI passa nos 4 testes.
- A/B testing em landing — versão "frase central + concretude" vs
  versão "compliance suite". Esperamos > 2x conversão.

---

## Referências

- `docs/BENCHMARKS.md` §5 (Ramp/Retool).
- `docs/PRODUCT_STRATEGY.md` "Frase central".
- `docs/REGRAS-DE-NEGOCIO.md` R26 (linguagem da UI é português
  operacional).
- `docs/PRODUCT_PRINCIPLES.md` P3, P4, P5 (dono, prazo, evidência).
- ADR 008.
