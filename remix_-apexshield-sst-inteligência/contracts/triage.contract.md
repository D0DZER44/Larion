# Triage Contract

## Entrada

O motor de Triagem aceita:

- `FieldInput`
- `OperationalItemDraft`
- `operationalContextId`
- `criticalActivityId`
- `severity`
- `origin`
- `sector`
- `attachments`
- `photos`
- `ruleData`
- `status`
- `responsible`
- `responsibleRole`
- `dueAt`
- `dueHours`
- `cancellationJustification`

## Saida

```ts
{
  success: boolean,
  data: {
    suggestedType,
    suggestedPriority,
    suggestedSeverity,
    suggestedDueDate,
    suggestedDueHours,
    suggestedResponsibleRole,
    requiresEvidence,
    triageWarnings,
    readyToSendToOperation
  },
  warnings: string[],
  errors: string[]
}
```

## Regras obrigatorias

- item critico nao pode sair da Triagem sem responsavel
- item critico nao pode sair da Triagem sem prazo
- item critico ou alto pode exigir evidencia
- item sem contexto usa `base_sst` e gera warning
- item sem origem gera erro
- item cancelado exige justificativa
- item enviado para Operacao muda status para `a_fazer`
- Triagem nunca exclui definitivamente um item

## Contrato de servico

### `triageService.review(input)`

Revisa um item e devolve a decisao sugerida.

### `triageService.sendToOperation(draft, decision)`

Exige decisao pronta e devolve um `OperationalItemDraft` com:

- `status: 'a_fazer'`

Sem persistencia automatica.
