# ApexOps SST Engine Architecture

## Objetivo

Consolidar o motor operacional do ApexOps SST no fluxo:

`Entrada -> Triagem -> Operacao -> Evidencia -> Inteligencia -> Relatorio`

Sem alterar visual, sidebar, rotas, dashboard ou persistencia.

O foco desta arquitetura e:

- receber sinal de campo ou execucao de checklist
- determinar contexto operacional, atividade critica e NRs aplicaveis
- aplicar regras SST de forma rastreavel
- transformar desvios em item operacional unico
- bloquear conclusao sem evidencia quando aplicavel
- gerar inteligencia a partir dos itens, e nao mais de entidades soltas

## Principio central

O centro do motor deixa de ser o trio separado `Inspecao -> Risco -> Acao` e passa a ser o `OperationalItem`.

O `OperationalItem` e a unidade operacional canonica do sistema porque concentra:

- origem rastreavel
- contexto
- atividade critica
- NRs aplicaveis
- regras acionadas
- prioridade
- bloqueio operacional
- plano de evidencia
- historico

Inspecao, checklist e entrada de campo continuam existindo, mas agora sao fontes de decisao para o item operacional.

## Camadas

### 1. Types

Arquivos em `src/types` definem o contrato do motor:

- `fieldInput.ts`: entrada bruta de campo
- `inspection.ts`: execucao de checklist em contexto
- `checklist.ts`: checklist como fonte de decisao operacional
- `sstRule.ts`: regra atomica do motor
- `operationalContext.ts`: catalogo de contexto operacional
- `criticalActivity.ts`: catalogo de atividade critica
- `evidence.ts`: prova operacional
- `operationalItem.ts`: entidade canonica do novo motor
- `engineResult.ts`: contrato padrao de retorno

Todas as engines em `src/lib/engines` retornam:

```ts
{
  success: boolean,
  data: ...,
  warnings: string[],
  errors: string[]
}
```

## Fluxo do motor

### 1. Entrada

Fontes aceitas hoje:

- `FieldInput`
- `Inspection`
- `ChecklistAnswer[]`

`fieldInputEngine` limpa texto, detecta contexto/atividade e sugere checklists e NRs.

### 2. Aplicabilidade

`applicabilityEngine` resolve:

- contextos aplicaveis
- atividades criticas aplicaveis
- NRs aplicaveis
- documentos minimos esperados

Essa etapa usa catalogos controlados e evita classificacao solta demais.

### 3. Leitura de checklist

`checklistEngine` identifica respostas criticas:

- `no`
- `partial`
- outros status definidos em `criticalStatuses`

Cada resposta critica vira achado estruturado com severidade, prazo, exigencia de evidencia, bloqueio e eventual vinculo com regra.

### 4. Regras SST

`sstRuleEngine` aplica quatro familias de regras:

- `universalSSTRules`
- `nrRules`
- `contextRules`
- `criticalActivityRules`

Saida:

- regras casadas
- sugestoes de acao
- documentos exigidos
- se ha bloqueio
- se ha exigencia de evidencia

### 5. Triagem

`triageEngine` pega origem + aplicabilidade + achados + regras e monta o primeiro `OperationalItemDraft`.

Ele decide:

- classificacao do item
- prioridade
- papel responsavel sugerido
- prazo sugerido
- plano de evidencia

### 6. Operacao

`operationalItemEngine` valida:

- criacao
- edicao
- transicoes de status
- integridade minima do item

Status canonicos:

- `draft`
- `triaged`
- `ready`
- `inProgress`
- `awaitingEvidence`
- `completed`
- `cancelled`

### 7. Evidencia

`evidenceEngine` e a trava de encerramento.

Ele valida:

- se o item exige evidencia
- quantidade minima
- tipos aceitos
- se ha payload util

Conclusao sem evidencia suficiente deve falhar aqui.

### 8. Inteligencia

`intelligenceEngine` le itens operacionais e produz:

- volume aberto
- gargalo de evidencia
- itens bloqueantes
- concentracao por contexto
- concentracao por atividade
- recorrencia por NR

Isso vira a base da camada futura de relatorio, sem depender diretamente do modelo legado.

## Responsabilidade de cada engine

### `fieldInputEngine`

Recebe entrada de campo e prepara sugestao para Triagem.

### `checklistEngine`

Recebe checklist respondido e identifica respostas criticas.

### `sstRuleEngine`

Aplica regras SST, NR, contexto e atividade critica.

### `triageEngine`

Classifica item e sugere prioridade, prazo, responsavel e evidencia.

### `operationalItemEngine`

Valida criacao, edicao, status e transicoes do item.

### `evidenceEngine`

Impede conclusao sem evidencia quando necessario.

### `intelligenceEngine`

Le itens e gera insights internos.

### `applicabilityEngine`

Define contextos, atividades criticas e NRs aplicaveis.

## Catalogos

### `src/lib/catalogs/operationalContexts.ts`

Lista controlada de contextos operacionais com:

- palavras-chave
- classes de perigo
- NRs normalmente aplicaveis
- documentos minimos

### `src/lib/catalogs/criticalActivities.ts`

Lista controlada de atividades criticas com:

- palavras-chave
- NRs relacionadas
- severidade base
- EPIs e documentos minimos
- exigencia de bloqueio

### `src/lib/catalogs/nrCatalog.ts`

Catalogo normativo tipado a partir da matriz existente em `lib/nrMatrix.ts`, enriquecido com contagem de regras fixas de `lib/normativeRules.ts`.

## Regras

### `universalSSTRules.ts`

Regras transversais do motor que independem de NR especifica.

Exemplos:

- item sem responsavel
- atividade critica sem permissao
- tentativa de concluir sem evidencia
- desvio recorrente no mesmo contexto

### `nrRules.ts`

Adapter tipado das regras fixas existentes em `lib/normativeRules.ts`.

Essa camada permite reaproveitar o patrimonio normativo atual sem manter o schema antigo no novo motor.

### `contextRules.ts`

Regras ligadas ao ambiente operacional.

### `criticalActivityRules.ts`

Regras ligadas a atividade critica executada.

## Reaproveitamento planejado

Foi mantido e reaproveitado:

- `lib/normativeRules.ts` como fonte normativa legada convertida em `nrRules.ts`
- `lib/nrMatrix.ts` como base para `src/lib/catalogs/nrCatalog.ts`
- `lib/store.ts -> getPackageFromNr` como fonte atual de mapeamento NR -> pacote
- `lib/action-rules.ts -> actionRequiresEvidence` como apoio para o novo `evidenceEngine`

Foi intencionalmente evitado:

- acoplamento direto do novo motor ao Zustand
- acoplamento a rotas ou componentes
- criacao de mocks visuais
- conexao com banco

## Fronteira de legado

Arquivos baseados no fluxo antigo continuam existindo, mas passam a ser considerados camada legada ou de transicao:

- `lib/types.ts`
- `lib/engines.ts`
- `lib/motor/index.js`
- fluxos que dependem de `Inspecao -> Risco -> Acao` como centro do motor

Esses arquivos nao devem receber expansao estrutural nova. A evolucao deve acontecer em `src/types`, `src/lib/catalogs`, `src/lib/rules` e `src/lib/engines`.

## O que esta fora deste passo

Nao foi feito nesta consolidacao:

- alteracao de telas
- alteracao de rotas
- persistencia em banco
- remocao de arquivos legados
- migracao de consumo da UI para o motor novo
- adaptadores de leitura/escrita entre Zustand e `OperationalItem`

## Resultado arquitetural

O ApexOps SST passa a ter um motor final com:

- uma entidade operacional unica
- regras tipadas e rastreaveis
- pipeline puro e sem dependencia de UI
- base pronta para migrar gradualmente o produto do modelo antigo para o novo
