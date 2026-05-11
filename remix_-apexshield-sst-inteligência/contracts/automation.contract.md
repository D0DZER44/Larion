# Automation Contract

## Escopo

Automacoes do ApexOps SST sao limitadas ao dominio operacional.

## Entradas

- `OperationalItem` ou `OperationalItemDraft`
- contexto de automacao
  - `evidences`
  - `targetStatus`
  - `justification`
  - `fromTriage`
- regras de automacao seguras

## Saida

```ts
{
  success: boolean,
  data: {
    item,
    blocked,
    alerts,
    events
  },
  warnings: string[],
  errors: string[]
}
```

## Automacoes permitidas

1. item critico sem responsavel -> `mark_alert`
2. prazo vencido -> `set_status_vencido`
3. conclusao sem evidencia obrigatoria -> `block_transition`
4. item enviado da Triagem -> `set_status_a_fazer`
5. evidencia suficiente adicionada -> `set_status_em_validacao`
6. item reaberto -> `require_justification`

## Automacoes proibidas

- deletar item
- concluir item critico sem evidencia
- remover historico
- criar multa definitiva
- enviar item direto para concluido

## Invariantes

- automacao nunca exclui definitivamente um item
- automacao nunca remove historico
- automacao nunca substitui decisao humana de conclusao critica
- automacao nunca cria valor juridico definitivo
