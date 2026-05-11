# ADR 009 — Triagem Rápida + Execução em Campo

**Status:** Aceita
**Data:** 2026-05-11
**Decisores:** Founder + Time de produto
**Relacionada:** ADR 008

---

## Contexto

ApexOps SST tem dois momentos críticos de uso:

1. **Manhã, no escritório do técnico SST.** Ele abre o app e precisa saber
   **em 10 segundos** o que fazer hoje.
2. **Tarde, no chão de fábrica, no celular.** Ele executa a inspeção,
   responde checklist, tira foto, anexa evidência.

Esses dois momentos têm exigências opostas. O primeiro pede **triagem
densa** (muita informação resumida). O segundo pede **execução simples**
(foco em uma tarefa, gestos largos para polegar).

Ferramentas EHS tradicionais tratam os dois como o mesmo problema — UI
densa em ambos. Resultado: técnico não usa no celular. SafetyCulture acerta
o segundo mas falha no primeiro — quem opera no desktop fica com inbox
gigante e sem prioridade.

---

## Decisão

Vamos cobrir os dois momentos com **dois ancorajes de UX explícitos**:

### Para triagem (manhã, desktop)

- Inspiração: **Linear**.
- Página inicial da Operação abre na aba **"Hoje"** já filtrada por prazo
  + criticidade.
- Botão primário de toda tela é **"Iniciar inspeção"** — mostra uma fila
  priorizada (Em andamento → Atrasada → Hoje → Agendada).
- Card de item é **enxuto** — 10 campos (R1) visíveis na tabela. Resto
  no drawer.
- Toda interação salva em < 100ms; sem reloads.

### Para execução em campo (tarde, mobile)

- Inspiração: **SafetyCulture**.
- Botão "Iniciar inspeção" alcançável com o polegar (CTA principal roxo
  em todas as telas).
- Pergunta de checklist usa gestos largos (Sim/Não/N-A com toque único).
- Foto = botão primário no mesmo nível de "Salvar".
- V2: PWA com offline-first, sync quando voltar online.

Já implementado parcialmente em:
- `app/operacao/inspecoes/page.tsx` — 5 status + CTA "Iniciar inspeção" +
  fila priorizada (etapa da Iteração 2).
- `app/inspecoes/ExecutionView.tsx` — view fullscreen otimizada para
  execução.

---

## Consequências

### Positivas

- Cliente vê valor em < 2 minutos no onboarding (triagem óbvia).
- Adoção no campo melhora — auditor não precisa pensar onde clicar.
- Métrica "tempo até primeira ação concluída com evidência" desce.

### Negativas

- Duas UIs significam dois pontos de mudança quando o motor evolui. Mitigação:
  drawer compartilhado entre desktop e mobile usa o **mesmo** componente
  React (`ExecutionView`).
- Tentação de adicionar atalhos avançados que confundem usuário casual.
  Mitigação: atalhos só no V2, escondidos no `?` (já é padrão Linear).

### Neutras

- Reforça regra **R2** (5 estados de inspeção) e princípio **P6**
  (triagem antes de execução).

---

## Implementação

| Tarefa | Status | Onde |
| --- | --- | --- |
| 5 status de inspeção (Hoje/Agendada/EmAndamento/Atrasada/Concluída) | Feito | `app/operacao/inspecoes/page.tsx` |
| CTA "Iniciar inspeção" primário | Feito | idem |
| Fila priorizada no picker | Feito | idem |
| Tabela com 10 campos obrigatórios | Feito | idem |
| Drawer "Identidade da inspeção" | Feito | idem |
| Mobile responsivo / PWA offline | V2 | A definir |
| Atalhos de teclado | V2 | A definir |
| Câmera nativa otimizada | V2 | Drive integrado |

---

## Validação

- **Métrica 1:** Tempo médio até primeira ação concluída com evidência
  (alvo: < 48h V1, < 24h V2).
- **Métrica 2:** % de inspeções executadas no celular (alvo: > 60% V2).
- **Métrica 3:** Cliente consegue explicar a aba "Hoje" sem ajuda
  (qualitativo na demo).

---

## Referências

- `docs/BENCHMARKS.md` §1 (Linear) e §2 (SafetyCulture).
- `docs/PRODUCT_PRINCIPLES.md` P6 (triagem antes de execução).
- `docs/REGRAS-DE-NEGOCIO.md` R1, R2.
- ADR 008 (benchmark-driven).
