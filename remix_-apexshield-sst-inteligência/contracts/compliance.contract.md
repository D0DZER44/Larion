# Compliance Contract

## Escopo

Compliance no ApexOps SST e organizacao operacional.

Nao e:

- multa final
- parecer juridico
- laudo tecnico

## OperationalItem

Pode carregar:

- `nrIds`
- `primaryNr`
- `primaryRuleId`
- `complianceStatus`
- `evidenceRequired`

## complianceStatus permitido

- `nao_avaliado`
- `conforme`
- `nao_conforme`
- `em_correcao`
- `aguardando_evidencia`
- `validado`

## Saida do engine

```ts
{
  success: boolean,
  data: {
    itemId,
    nrIds,
    ruleId,
    complianceStatus,
    evidenceRequired,
    evidenceCount,
    auditable,
    warnings
  },
  warnings: string[],
  errors: string[]
}
```
