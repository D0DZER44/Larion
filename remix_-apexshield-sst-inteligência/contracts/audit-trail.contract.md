# Audit Trail Contract

## Principio

Auditoria no ApexOps SST e append-only.

Historico:

- nunca apaga
- nunca substitui eventos antigos
- permanece mesmo apos conclusao ou cancelamento

## Eventos suportados

- `item_criado`
- `item_triado`
- `responsavel_atribuido`
- `prazo_alterado`
- `status_alterado`
- `evidencia_adicionada`
- `item_enviado_para_validacao`
- `item_concluido`
- `item_reaberto`
- `item_cancelado`

## Garantias

- item concluido mantem registro
- auditoria nao remove historico
- trilha de auditoria nao calcula penalidade definitiva
