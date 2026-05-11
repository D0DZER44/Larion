# ApexOps SST — Direção Estratégica

> Documento-mestre de direção do produto. Tudo que se contradiz com este
> documento perde. Para visão narrativa do SaaS, ver `README-PRODUTO.md`;
> para invariantes operacionais, ver `REGRAS-DE-NEGOCIO.md`. Este aqui é
> a **bússola** — quando houver dúvida sobre o que construir, vem aqui.

---

## Frase central

> **"Nada crítico fica sem dono, prazo e evidência."**

Toda decisão de produto, feature, redesign ou trade-off é avaliada
contra essa frase. Se a feature não ajuda a:

- atribuir **dono** a um item crítico,
- garantir **prazo** com SLA legal,
- exigir **evidência** auditável,

ela é negociável.

---

## O que o ApexOps SST **é**

ApexOps SST é uma **central operacional de SST** que organiza pendências
críticas por contexto real da empresa. Em ordem decrescente de identidade:

1. **Central de pendências críticas de SST.** Risco crítico, ação vencida,
   inspeção atrasada e evidência ausente vivem no mesmo lugar, com a mesma
   prioridade visual.

2. **Inbox operacional.** Tudo entra por uma fonte (a inspeção). Sai como
   item acionável com dono, prazo e SLA. Quem abre o produto pela manhã vê
   o que precisa fazer hoje, não 47 dashboards.

3. **Sistema de execução com evidência.** A operação acontece no campo
   (mobile-friendly), com anexo obrigatório nas ações críticas. A
   conformidade não é narrativa: é foto + hash + assinatura.

4. **Camada de inteligência operacional.** O motor normativo (90 regras NR
   fixas) gera risco e ação automaticamente, calcula multa NR-28, propõe
   o próximo passo. A inteligência **recomenda** — quem decide é o humano.

5. **Produto focado em fazer problemas andarem.** Mede sucesso por ação
   concluída com evidência, não por relatório bonito.

---

## O que o ApexOps SST **não é**

Definir o que não somos vale mais que definir o que somos. Cada item
abaixo é um trade-off explícito, não um descuido.

### Não somos um Trello genérico

Trello é flexível, não opinativo. ApexOps é o oposto: o motor decide o
que vira card, qual prioridade, qual prazo. O usuário não cria categoria
nova "porque quis". A rigidez é o produto.

### Não somos um ClickUp genérico

ClickUp/Monday vendem "construa seu fluxo". ApexOps vende **o fluxo já
construído** — Inspeção → NC → Risco → Ação → Evidência → Dashboard → PGR.
O cliente liga o pacote, não desenha o processo.

### Não somos um app simples de checklist

SafetyCulture (iAuditor) é melhor que nós em checklist puro. Nossa tese
é que **checklist sem motor é só formulário**: nossas perguntas viram
riscos, riscos viram ações, ações viram evidência. Cada pergunta carrega
8 campos do motor (ver `MOTOR.md`).

### Não somos um EHS completo

EHS Insight e EcoOnline cobrem environmental + occupational health +
safety + sustainability + sometimes carbon. ApexOps é **SST com profundidade,
não EHS com superficialidade**. Saúde, segurança e medicina ocupacional —
sim. ESG, carbono, environmental compliance — não no V1/V2.

### Não somos um sistema puramente documental

Quem precisa de PDF arquivado vai pro SharePoint. Quem precisa que o
documento se atualize quando o risco muda, vem pra cá. PGR Vivo, evidência
com hash, histórico imutável de ações — documentos vivos, não estáticos.

---

## Posicionamento competitivo

```
                    Documento                     Operação
                       │                              │
              Microsoft 365                    SafetyCulture
              SharePoint                       (checklist forte)
              ────────────────────────────────────────────────
              EHS Insight                      ApexOps SST
              EcoOnline                        Linear (UX)
              (EHS completo,                   (velocidade + foco)
               processo lento)
                       │                              │
                  Empresa grande                Time enxuto
```

Nosso quadrante: **operação rápida em time enxuto, foco em SST**, não EHS
completo. Cliente-alvo do V1: PME industrial brasileira, 50–500 funcionários,
1–3 pessoas no departamento SST.

---

## Vantagem competitiva sustentável

Três fossos que outros não copiam fácil:

1. **Motor normativo brasileiro embutido.** 90 regras NR são curadoria
   especialista — não algoritmo. Concorrente internacional não tem.
   Concorrente nacional não tem profundidade.

2. **Inbox de pendências críticas (não dashboard de números).** O Linear
   ensinou que velocidade vem de tirar atrito. Aplicamos isso a SST.
   Concorrente EHS gasta o dia em formulários; nosso usuário gasta 5min
   na inspeção e o sistema faz o resto.

3. **Defesa documental embutida.** Evidência com hash + histórico imutável
   + PGR Vivo dão ao cliente prova jurídica que SharePoint não tem.

---

## Estratégia por horizonte

(detalhe versionado em `ROADMAP.md`; aqui só a linha estratégica)

### V1 — provar o motor

Demonstrar que **inspeção rápida + motor normativo + execução com evidência**
funciona. PME industrial. Tudo no localStorage. Motor brasileiro completo.

### V2 — escalar o produto

Tirar do localStorage (Supabase), abrir multi-tenant, PGR Vivo gerando
documento legal, notificações WhatsApp/e-mail, mobile-first real.
Manter foco SST, ainda longe de EHS completo.

### V3 — virar plataforma

eSocial, marketplace de checklists, API pública, módulo CIPA digitalizado.
Continuar opinativo sobre **como fazer SST**; nunca virar genérico.

---

## Diferenciais frente a cada benchmark

(detalhe em `BENCHMARKS.md` e `WHAT_TO_COPY_AND_AVOID.md`)

| Benchmark | Nossa diferença |
| --- | --- |
| **Linear** | Mesma velocidade + foco — mas para SST, não para tech. |
| **SafetyCulture** | Mesma força em campo — mas com motor normativo brasileiro e ações automáticas. |
| **ClickUp/Monday** | Mesma flexibilidade de filtros — mas sem deixar o usuário desenhar o processo. |
| **EHS Insight/EcoOnline** | Mesmo rigor de compliance — mas em time enxuto, não SaaS de mil features. |
| **Ramp/Retool** | Mesma linguagem de valor operacional — mas concreta sobre vida humana protegida e multa evitada. |

---

## Métricas de sucesso da estratégia

Indicadores que dizem se a direção tá funcionando (não OKRs de feature):

1. **Tempo médio até a primeira ação concluída com evidência** (alvo: < 48h
   no V1, < 24h no V2).
2. **% de ações concluídas que têm evidência válida anexada** (alvo: 100%
   no V2 quando upload real for habilitado).
3. **% de inspeções concluídas sem nenhuma intervenção manual no motor**
   (alvo: > 95% — o motor decide).
4. **NPS específico da pergunta "o produto fez seu trabalho de SST andar?"**
   (alvo: > 50 no V1).
5. **Tempo até cliente entender o produto** (alvo: < 10 min na demo —
   triagem deve ser óbvia).

---

## O que **não fazer agora** (anti-feature list)

- Não construir gerador de fluxo customizado pelo cliente.
- Não construir editor de checklist totalmente livre.
- Não adicionar módulos fora de SST (carbono, ESG, treinamento, RH).
- Não copiar o visual do EHS Insight (overload de campos).
- Não criar versão "simples" sem motor (o motor é o produto).
- Não cobrar por NR avulsa (venda é por pacote).
- Não tornar o app multi-empresa antes do Supabase (V2).
- Não exportar relatório que o cliente possa "limpar" antes de mandar
  pro MTE (compromete defesa documental).

---

## Documentos relacionados

- `README-PRODUTO.md` — visão narrativa do SaaS, módulos existentes
- `ROADMAP.md` — V1/V2/V3 detalhados
- `REGRAS-DE-NEGOCIO.md` — 30 invariantes operacionais
- `FLUXO-OPERACIONAL.md` — fluxo único de inspeção → PGR
- `PRODUCT_PRINCIPLES.md` — princípios técnicos do motor
- `BENCHMARKS.md` — análise dos 5 produtos de referência
- `WHAT_TO_COPY_AND_AVOID.md` — matriz de comportamento
- `decisions/` — ADRs que materializam esta direção em código
