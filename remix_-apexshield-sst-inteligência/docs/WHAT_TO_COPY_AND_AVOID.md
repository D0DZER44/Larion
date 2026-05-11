# O que Copiar e o que Evitar

> Operacionalização concreta do `BENCHMARKS.md`. Cada item abaixo é uma
> **decisão acionável** ligada a um benchmark — o que importar e que
> armadilha não cair.
>
> Quando uma feature gerar dúvida, achar a linha correspondente e seguir.

---

## Tabela mestre

| # | Capacidade | Vem de | Forma concreta no ApexOps | Anti-padrão a evitar |
| - | --- | --- | --- | --- |
| 1 | Velocidade percebida | Linear | Toda interação salva < 100 ms. Drawer abre sem reload. | Tela com spinner pra ação rotineira. |
| 2 | Inbox triada | Linear | Aba "Hoje" como default em Operação > Inspeções. CTA "Iniciar inspeção" mostra fila priorizada. | Página inicial = dashboard de números (já existe — mover ênfase pra Operação no V2). |
| 3 | Card enxuto | Linear | Tabela mostra só os 10 campos da R1. Resto vai pro drawer. | Card com 25 campos visíveis (típico de EHS Insight). |
| 4 | Foco no escopo | Linear | Inspeção, Risco, Ação, Evidência, PGR. Ponto. | Adicionar módulo de RH/Treinamento/ESG no V1. |
| 5 | Otimização mobile | SafetyCulture | Inspeção otimizada pra polegar. PWA com offline (V2). | Forçar uso desktop para responder checklist. |
| 6 | Anexar foto como gesto primário | SafetyCulture | Botão Câmera no mesmo nível do "Salvar". | Foto escondida em "+ mais opções". |
| 7 | Inspeção rápida | SafetyCulture | "Iniciar inspeção" mostra fila imediata, não força wizard de cadastro. | Exigir 7 campos antes de poder começar. |
| 8 | Geolocalização da evidência | SafetyCulture | V2: foto carrega `{ lat, lng, timestamp, hash }`. | Foto avulsa sem metadata. |
| 9 | Filtros compostos | ClickUp/Monday | Filtros por setor, NR, criticidade, responsável + salvar views. | Forçar usuário a criar fórmula. |
| 10 | Automações declarativas | ClickUp/Monday | Mostrar ao usuário o que o motor faz ("Inspeção NC → Risco → Ação"). | Permitir usuário "construir automação". |
| 11 | Views personalizáveis | ClickUp/Monday | "Minhas ações desta semana", "Riscos da NR-12". | "Crie sua tabela do zero". |
| 12 | Vocabulário customizável | ClickUp/Monday | **NÃO copiar.** "Inspeção", "Risco", "Ação" são fixos. | Permitir renomear entidades. |
| 13 | Compliance rastreável | EHS Insight | Cada risco/ação carrega `regraId` → NR fixa → texto legal. | Compliance só como rótulo. |
| 14 | Histórico imutável | EHS Insight | `historico[]` append-only. V2: hash SHA-256 + chain. | Editar evento antigo. |
| 15 | Exportação pra fiscal | EHS Insight | V2: PDF/A com hash + assinatura. | PDF que o cliente pode editar antes. |
| 16 | Cobertura ampla EHS | EHS Insight | **NÃO copiar.** Cobertura: SST com profundidade. | Adicionar carbono/ESG/sustainability. |
| 17 | Linguagem de valor | Ramp/Retool | "Vida humana protegida + multa evitada em R$". | "Plataforma de gestão de SST". |
| 18 | Eficiência mensurável | Ramp/Retool | Métricas: tempo até primeira ação concluída, % com evidência. | Métrica de vaidade ("47 features novas"). |
| 19 | Foco no operador, não comprador | Ramp/Retool | Copy fala pro técnico SST, não pro CFO. | Material focado em ROI executivo. |
| 20 | Abstração corporativa | Ramp/Retool | **NÃO copiar.** Concretude obrigatória — números reais. | "Aumente sua maturidade SST com nossa plataforma." |

---

## Decisões derivadas

### Copiar agressivamente

- **Atalhos de teclado** (Linear) — V2: `n` cria nova, `i` cria inspeção,
  `/` busca.
- **Estados visuais com cor coerente** (Linear) — vermelho = crítico,
  laranja = alto, amarelo = médio, verde = controlado. Mantido em toda
  a UI hoje.
- **Câmera nativa otimizada** (SafetyCulture) — V2.
- **Filtros por NR + criticidade** (ClickUp) — implementar na tela de
  Riscos no V1/V2.
- **Cada ação tem trail de auditoria** (EHS Insight) — já é R23 + R29.
- **Copy operacional curta** (Ramp) — revisar todos os textos da UI pra
  cortar enterprise-speak no V1.

### Adotar com modificação

- **Inbox como tela inicial** (Linear) — adaptar: nossa "inbox" é a aba
  "Hoje" de Inspeções, não uma lista global.
- **Visualização Kanban** (ClickUp) — já temos em Ações; **não** estender
  pra outras entidades sem motivo claro.
- **Multi-tenant** (EHS Insight) — sim, mas só no V2 com Supabase. Modelo
  é uma organização por workspace, não dezenas.

### **Recusar** (mesmo se cliente pedir)

- **Editor de workflow customizado** — viola P1 e P6. ApexOps é opinativo.
- **Renomear "Risco" para "Ocorrência"** — viola P2 e a R26. Vocabulário
  é tabelado em NR.
- **Módulo de carbono / emissões / ESG** — fora do escopo SST.
- **Permitir concluir ação crítica sem evidência** — viola P5, R6, R11.
- **Editar histórico de uma ação antiga** — viola P2, R8, R21.
- **PDF editável pelo cliente antes de enviar ao MTE** — quebra defesa
  documental (P5).
- **Recomendação automática da IA que vira ação sem confirmação** — viola
  P8, R29.

---

## Regra de bolso para PMs e devs

Quando um pedido de feature chega, escolher **uma palavra** que descreve
o pedido e procurar nas tabelas acima:

- Se a palavra aparece em "**Copiar**" → seguir adiante, ver implementação
  análoga em Linear/SafetyCulture/EHS/Ramp.
- Se aparece em "**Evitar**" → recusar com link pra esta tabela.
- Se **não aparece** → escrever um ADR em `/decisions/` defendendo a
  posição antes de codar.

---

## Documentos relacionados

- `BENCHMARKS.md` — análise completa dos 5 produtos.
- `PRODUCT_PRINCIPLES.md` — P1–P8 que sustentam as decisões aqui.
- `PRODUCT_STRATEGY.md` — bússola estratégica.
- `decisions/008-benchmark-driven-product.md` a `012-operational-value-language.md`.
