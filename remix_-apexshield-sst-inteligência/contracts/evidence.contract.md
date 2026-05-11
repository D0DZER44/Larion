# Evidence Contract

## Papel

Evidencia no ApexOps SST serve para:

- comprovar execucao de tratamento;
- sustentar rastreabilidade;
- apoiar validacao operacional;
- fortalecer leitura de compliance sem prometer valor juridico definitivo.

## Estrutura canonica

Cada evidencia deve conter:

- `id`
- `itemId`
- `type`: `foto | arquivo | observacao | assinatura | registro | checklist`
- `description`
- `url` opcional
- `createdBy`
- `createdAt`
- `validatedBy` opcional
- `validatedAt` opcional
- `validationStatus`: `pendente | aprovada | rejeitada`
- `history[]` append-only

## Limites

- evidencia nao gera multa final;
- evidencia nao substitui laudo tecnico;
- evidencia nao valida juridicamente um item sozinha;
- evidencia organiza prova operacional, nao parecer definitivo.

## Regras operacionais

- `OperationalItem` com `requiresEvidence=true` nao pode ir para `completed` sem evidencia aprovada suficiente;
- item `alta` ou `critica` pode exigir evidencia por padrao;
- evidencia `rejeitada` nao conta como valida;
- item em `em_validacao` precisa de pelo menos uma evidencia `pendente` ou `aprovada`;
- reabertura de item concluido exige justificativa;
- item concluido nao permite apagar evidencia;
- historico de evidencia nunca deve ser apagado.
