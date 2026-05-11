# Field Input Flow

## Objetivo

Criar a porta de entrada de campo do ApexOps SST sem reduzir o produto a um app de checklist.

No ApexOps:

- checklist e uma fonte de entrada
- inspeção e outra fonte de entrada
- registro manual ou L.A.R.I tambem entram no mesmo funil
- nada vai direto para Operacao
- tudo passa antes por Triagem

Fluxo alvo:

`Campo -> Entrada estruturada -> Triagem -> Operacao`

## O que entra como FieldInput

Qualquer sinal relevante de campo pode virar `FieldInput`:

- registro manual
- resposta critica de checklist
- achado de inspeção
- observação de auditoria
- relato da L.A.R.I

O `FieldInput` nao e o item operacional final.

Ele e um envelope de entrada para Triagem com:

- titulo
- descricao
- origem
- setor
- contexto operacional sugerido
- atividade critica sugerida
- anexos e fotos
- NR sugerida
- prioridade e severidade sugeridas

## Papel do checklist

Checklist no ApexOps nao e o produto inteiro.

Ele serve para:

- capturar observacoes estruturadas
- disparar leitura de resposta critica
- anexar evidencia
- gerar sugestao de entrada para Triagem

Quando uma resposta critica aparece, o `checklistEngine`:

1. identifica a resposta critica
2. monta um `ChecklistFinding`
3. gera uma sugestao de `FieldInput`
4. resolve aplicabilidade
5. chama `sstRuleEngine` quando houver contexto suficiente
6. opcionalmente gera um `OperationalItemDraft` apenas como sugestao de Triagem

Nada e salvo ou enviado diretamente para Operacao.

## Papel da inspeção

A inspeção continua existindo, mas seu papel aqui e:

- carregar um checklist executado em contexto real
- fornecer setor, contexto, atividade e notas
- servir como fonte para criar entradas de Triagem

O `inspectionInputService` pega:

- `Inspection`
- `Checklist`
- `ChecklistAnswer[]`

e devolve:

- achados criticos
- sugestoes de `FieldInput`
- sugestoes de `OperationalItemDraft`
- leitura de regras aplicaveis

## Papel do fieldInputEngine

O `fieldInputEngine`:

- valida se a entrada e minima e utilizavel
- normaliza titulo e descricao
- sugere tipo de item
- sugere prioridade
- sugere severidade
- sugere contexto operacional
- sugere atividade critica
- sugere NRs e checklists relacionados
- prepara o `FieldInputTriagePayload`

Esse payload ja sai com `routeTo: 'triage'`.

## Papel dos services

### `fieldInputService`

Entrada:

- `FieldInput`

Saida:

- `fieldInput`
- `preparation`
- `applicability`

Uso:

- formularios manuais
- importacao futura de L.A.R.I
- registro livre de auditoria

### `inspectionInputService`

Entrada:

- `Inspection`
- `Checklist`

Saida:

- `analysis`
- `fieldInputSuggestions`
- `operationalItemDraftSuggestions`

Uso:

- execucao de checklist em campo
- leitura rapida de inspeções

## SafetyCulture x ApexOps

O benchmark da SafetyCulture inspira:

- inspeção rapida
- checklist simples
- foto e anexo
- registro de campo
- acao corretiva

Mas o ApexOps nao para nisso.

O diferencial aqui e que:

- checklist nao e destino final
- o sistema nao trata tudo como mera lista de perguntas
- a entrada vira contexto para Triagem
- Triagem conecta regras SST, severidade, prioridade e rastreabilidade

## Reaproveitamento

Foi reaproveitado:

- `Inspection`
- `Checklist`
- `applicabilityEngine`
- `sstRuleEngine`
- `triageEngine`

Foi descartado deste fluxo:

- envio direto para Operacao
- persistencia automatica
- qualquer tentativa de transformar checklist em entidade final do produto

## Como testar isoladamente

### Entrada manual

1. montar um `FieldInput`
2. chamar `fieldInputService.prepareForTriage(fieldInput, checklists)`
3. validar:
   - `success`
   - `preparation.suggestedPriority`
   - `preparation.suggestedContextId`
   - `preparation.triagePayload.routeTo === 'triage'`

### Entrada por inspeção

1. montar `Inspection`
2. montar `Checklist`
3. preencher `answers` com resposta critica
4. chamar `inspectionInputService.prepareForTriage(inspection, checklist)`
5. validar:
   - `analysis.criticalFindings.length > 0`
   - `analysis.fieldInputSuggestions.length > 0`
   - `analysis.operationalItemDraftSuggestions.length >= 0`
   - nenhuma gravacao acontece automaticamente

## Garantias desta camada

- nenhuma tela foi alterada
- nenhum mock visual foi criado
- nenhum banco foi conectado
- nenhum item foi enviado direto para Operacao
- tudo foi preparado apenas como entrada para Triagem
