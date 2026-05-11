# Triage Flow

## Objetivo

A Triagem do ApexOps SST e a inbox operacional de pendencias criticas de SST.

Ela nao e backlog tecnico, nao e quadro de desenvolvimento e nao usa linguagem de software.

Seu papel e:

- receber sinais de campo e rascunhos operacionais
- reduzir ruido
- explicitar prioridade
- exigir dono e prazo quando necessario
- decidir o que pode seguir para Operacao

Fluxo alvo:

`Campo -> Triagem -> Operacao`

## Principios

- item enxuto
- leitura rapida
- prioridade clara
- dono sugerido
- minimo de ruido
- nenhuma saida para Operacao sem decisao

## Entradas aceitas

O `triageEngine` recebe:

- `FieldInput`
- `OperationalItemDraft`
- contexto operacional
- atividade critica
- severidade
- origem
- setor
- anexos e evidencias
- dados de regra, quando houver

## Saida da Triagem

O engine retorna:

- `suggestedType`
- `suggestedPriority`
- `suggestedSeverity`
- `suggestedDueDate`
- `suggestedDueHours`
- `suggestedResponsibleRole`
- `requiresEvidence`
- `triageWarnings`
- `readyToSendToOperation`

Isso ainda nao envia nada para Operacao.

## Regras do motor

### 1. Origem obrigatoria

Item sem origem gera erro.

### 2. Contexto ausente

Item sem contexto cai para `base_sst` e gera warning.

### 3. Item critico sem responsavel

Nao pode sair da Triagem.

### 4. Item critico sem prazo

Nao pode sair da Triagem.

### 5. Evidencia

Item critico ou alto pode exigir evidencia, conforme regra ou severidade.

### 6. Cancelamento

Item cancelado exige justificativa.

### 7. Envio para Operacao

Quando aprovado explicitamente pelo `triageService.sendToOperation`, o status muda para `a_fazer`.

### 8. Exclusao definitiva

Triagem nunca exclui definitivamente um item.

O maximo permitido e:

- manter em Triagem
- enviar para Operacao
- marcar como cancelado com justificativa

## Camadas

### `triageEngine`

Faz a leitura operacional da pendencia e devolve a decisao sugerida.

### `triageService.review`

Orquestra a revisao de um item de Triagem.

### `triageService.sendToOperation`

Exige decisao pronta e so entao converte o rascunho para `a_fazer`.

## Como testar isoladamente

### Revisao simples

1. montar um `FieldInput` com `origin`
2. chamar `triageService.review(input)`
3. validar:
   - `success`
   - `decision.suggestedPriority`
   - `decision.readyToSendToOperation`

### Item critico sem dono

1. montar `OperationalItemDraft` com prioridade ou severidade critica
2. deixar sem `responsible`
3. revisar
4. validar `readyToSendToOperation === false`

### Item sem contexto

1. revisar item sem `operationalContextId`
2. validar warning para `base_sst`

### Envio para Operacao

1. obter decisao pronta via `triageService.review`
2. chamar `triageService.sendToOperation(draft, decision)`
3. validar:
   - `operationDraft.status === 'a_fazer'`
   - nada foi persistido automaticamente

## Limites desta entrega

- nenhuma tela foi alterada
- nenhum banco foi conectado
- nenhum dashboard foi alterado
- nenhum item foi enviado automaticamente para Operacao
