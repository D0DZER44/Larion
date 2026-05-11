# Controlled Flexibility

## Objetivo

Dar flexibilidade operacional ao ApexOps SST sem transformar o produto em uma ferramenta generica.

O que a camada permite:

- filtros operacionais
- campos configuraveis seguros
- automacoes simples e previsiveis

O que ela nao permite:

- configuracao infinita
- automacoes destrutivas
- perda do dominio SST

## O que e flexivel

### 1. Filtros

Filtros permitidos:

- status
- prioridade
- severidade
- responsavel
- setor
- contexto operacional
- atividade critica
- NR
- vencidos
- sem responsavel
- aguardando evidencia
- origem

### 2. Campos configuraveis seguros

Campos adicionais podem existir, mas com limite e tipagem controlada:

- `select`
- `text`
- `number`
- `date`
- `boolean`

Limite atual:

- maximo de 8 campos configuraveis

### 3. Presets de filtro

Presets padrao:

- criticos
- sem responsavel
- aguardando evidencia
- vencidos

### 4. Automacoes simples

Automacoes suportadas:

1. item critico sem responsavel -> alerta
2. prazo venceu -> status `vencido`
3. `requiresEvidence=true` e tentativa de `completed` sem evidencia -> bloquear
4. item enviado da Triagem -> status `a_fazer`
5. evidencia adicionada -> `em_validacao`
6. item reaberto -> justificativa obrigatoria

## O que e fixo

### Status oficiais

Os status oficiais permanecem e nao podem ser removidos:

- `draft`
- `triaged`
- `a_fazer`
- `ready`
- `inProgress`
- `awaitingEvidence`
- `em_validacao`
- `vencido`
- `completed`
- `cancelled`

### Restricoes de automacao

Nao e permitido:

- apagar item
- concluir item critico sem evidencia
- remover historico
- criar multa definitiva
- mandar item direto para concluido

### Dominio SST

A configuracao nao pode:

- trocar o significado do motor
- inventar status fora do dominio operacional
- transformar o sistema em gestor generico de tarefas

## Engines

### `filterEngine`

Filtra `OperationalItem[]` por criterios operacionais do dominio SST.

### `automationEngine`

Aplica automacoes seguras e previsiveis, sempre retornando eventos e bloqueios claros.

### `workflowConfigEngine`

Cria e valida a configuracao segura de workflow.

## Service

### `workflowConfigService`

Cria e valida um envelope seguro de:

- configuracao
- automacoes permitidas

## Como testar

### Configuracao

```ts
workflowConfigService.createSafeConfig()
workflowConfigService.validateSafeConfig(config)
```

### Filtros

```ts
filterEngine.filter(items, {
  status: ['a_fazer', 'vencido'],
  unassigned: true,
})
```

### Automacoes

```ts
automationEngine.apply(item, {
  targetStatus: 'completed',
  evidences: [],
})
```

Casos principais:

- item critico sem responsavel -> alerta
- item com prazo passado -> `vencido`
- tentativa de concluir sem evidencia -> bloqueio
- evidencia suficiente adicionada -> `em_validacao`
- reabertura sem justificativa -> bloqueio

## Garantias desta entrega

- nenhuma tela foi alterada
- nenhum mock visual foi criado
- nenhum banco foi conectado
- nenhum dashboard foi alterado
