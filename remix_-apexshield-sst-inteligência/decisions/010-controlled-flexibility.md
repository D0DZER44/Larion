# ADR 010 — Flexibilidade Controlada

**Status:** Aceita
**Data:** 2026-05-11
**Decisores:** Founder + Time de produto
**Relacionada:** ADR 008

---

## Contexto

ClickUp e Monday vendem **flexibilidade como produto**: "construa seu fluxo".
Funciona como vitrine — falham na prática porque o cliente precisa aprender
a desenhar o sistema antes de usá-lo.

Por outro lado, sistemas opinativos demais (alguns ERPs corporativos) viram
camisas-de-força. Cliente precisa ajustar pequenos detalhes do contexto e
não consegue.

O ponto certo pra ApexOps é **flexível onde importa, opinativo onde o
motor decide**.

---

## Decisão

Adotar o que chamamos de **flexibilidade controlada**:

### Onde **somos flexíveis**

- **Filtros e views.** Usuário compõe filtros (setor + NR + criticidade +
  responsável) e salva como view. Inspiração ClickUp.
- **Cadastro de setores e usuários.** Cliente define seus próprios setores
  com nomes próprios.
- **Atribuição de responsável e validador.** Operador escolhe quem executa.
- **Customização do checklist personalizado.** Cliente cria seu pacote de
  checklists adicional (sobre os 90 fixos).
- **Configuração de SLA por organização.** `engineConfig.slas` pode ser
  ajustado dentro de faixas razoáveis.
- **Rótulo de cards e cores em pacotes opcionais.** Cosmético.

### Onde **somos opinativos** (não negociável)

- **Vocabulário.** "Inspeção", "Risco", "Ação", "Evidência" são fixos.
  Cliente não renomeia. Princípio: linguagem de NR é tabelada.
- **Fluxo principal.** Inspeção → NC → Risco → Ação → Evidência → PGR.
  Cliente não desenha fluxo alternativo.
- **Regras fixas NR (90).** Imutáveis. Cliente não edita.
- **SLA por criticidade.** Crítica = 24h, Alta = 72h, etc. Pode ser ajustado
  dentro de bandas, mas não invertido (Baixa nunca < Crítica).
- **Idempotência do motor.** Cliente não escolhe "criar duplicado".
- **Exigência de evidência em Crítica/Alta.** Não desabilitável.
- **Histórico imutável.** Não editável, não deletável.

### Onde **automações são declarativas** (não construíveis)

- Cliente **vê** o que o motor faz: "Inspeção NC → Risco automático →
  Ação automática". Isso é mostrado em `/central/motor`.
- Cliente **não constrói** automações novas tipo "Se X então Y". O motor
  determinístico é o produto.
- No V2: cliente pode **escolher canal** de notificação (WhatsApp/e-mail)
  mas não os triggers.

---

## Consequências

### Positivas

- Onboarding curto. Cliente não precisa "configurar o sistema" antes de
  usar — abre, ativa o pacote do segmento, inicia inspeção.
- Suporte mais simples. Não há configuração quebrada do cliente: o motor é
  o mesmo pra todos.
- Diferencial defensável. Concorrente que tentar copiar terá que reescrever
  o motor — não basta clonar a UI.

### Negativas

- Cliente que vem de ClickUp pode reclamar de rigidez. Mitigação:
  argumentar com tempo até valor (o problema do ClickUp é justamente que
  cliente passa 3 semanas configurando).
- Cliente grande pode pedir customização de workflow. Resposta: dizemos
  não. Se quiser muito, oferecemos pacote de checklists customizados (V2)
  ou marketplace (V3).
- Risco de virarmos rígidos demais com o tempo. Mitigação: revisar este
  ADR anualmente.

### Neutras

- Reforça princípio **P1** (tudo entra por uma fonte) e o aviso anti-feature
  em `PRODUCT_STRATEGY.md`.

---

## Critérios para conceder flexibilidade nova

Quando um pedido de "deixa o cliente customizar X" chegar, responder
afirmativamente apenas se:

1. **X não afeta o motor.** Cores, textos, ordem de campos — sim. Status
   de risco, vocabulário de NR, regras de geração — não.
2. **X não compromete defesa documental.** Cliente não pode "desligar"
   exigência de evidência.
3. **X não cria ambiguidade entre clientes.** "Cliente A chama risco de
   X, cliente B de Y" não — vira pesadelo de suporte.
4. **Custo de implementar < valor entregue.** Customização barata só vale
   se for cosmética.

---

## Implementação

| Capacidade | Tipo | Status | Local |
| --- | --- | --- | --- |
| Filtros compostos | Flexível | V1/V2 | UI de Riscos/Ações |
| Salvar views | Flexível | V2 | A definir |
| Cadastro de setores | Flexível | Feito | `app/organizacao/page.tsx` |
| Pacotes ativáveis | Flexível | Feito | `app/configuracoes/page.tsx` |
| Regras fixas NR | Opinativo | Feito | `lib/normativeRules.ts` |
| SLA por organização | Flexível em faixa | Feito | `engineConfig.slas` |
| Vocabulário | Opinativo | Feito | UI inteira |
| Construir automação | Recusado | Permanente | — |

---

## Validação

- **Métrica:** % de clientes que ativam algum pacote além do "Base SST"
  no primeiro mês (alvo: > 70%).
- **Anti-métrica:** suporte de "como eu mudo o nome de 'Risco' para
  'Ocorrência'?" → resposta padrão linka este ADR.

---

## Referências

- `docs/BENCHMARKS.md` §3 (ClickUp/Monday).
- `docs/WHAT_TO_COPY_AND_AVOID.md` linhas 9–12.
- `docs/PRODUCT_PRINCIPLES.md` P1.
- ADR 008.
