# Full Operational Flow

## Objetivo

Conectar o fluxo completo do ApexOps SST em nivel de service e engine,
sem tocar em telas:

`Campo / Inspecao / Checklist -> sstRuleEngine -> fieldInputEngine -> triageEngine -> operationalItemEngine -> evidenceEngine -> intelligenceEngine`

## Papel de cada camada

### 1. Entrada de campo, inspecao e checklist

- `fieldInputService` prepara entrada manual para Triagem.
- `inspectionInputService` transforma checklist respondido em leitura
  operacional, com findings e sugestoes.

### 2. `sstRuleEngine`

Aplica regras SST a partir de:

- texto livre;
- contexto operacional aplicavel;
- atividade critica aplicavel;
- NRs aplicaveis;
- findings de checklist.

## 3. `fieldInputEngine`

Normaliza a entrada e sugere:

- prioridade;
- severidade;
- contexto;
- atividade critica;
- possivel tipo de item;
- payload de Triagem.

## 4. `triageEngine`

Transforma a entrada em decisao operacional:

- classifica o item;
- sugere prazo;
- sugere papel responsavel;
- define se exige evidencia;
- mantem o item em `triaged` ate decisao explicita.

## 5. `operationalItemEngine`

Cria o `OperationalItem` canonico do dominio, preservando:

- origem;
- regras relacionadas;
- bloqueios;
- historico;
- plano de evidencia.

## 6. `evidenceEngine`

Valida a etapa de prova operacional:

- impede conclusao sem evidencia aprovada quando obrigatoria;
- exige evidencia minima para `em_validacao`;
- protege evidencia de item concluido;
- exige justificativa para reabertura.

## 7. `intelligenceEngine`

Le o conjunto de itens e gera:

- contagem por prioridade;
- concentracao por contexto;
- concentracao por NR;
- gargalos de evidencia;
- sinais de bloqueio operacional.

## Services de integracao

### `src/services/apexOpsFlowService.ts`

Entrega a orquestracao pronta para uso:

- `processManualEntry(fieldInput)`
- `processFieldInput({ fieldInput, checklists? })`
- `processInspectionChecklist({ inspection, checklist })`
- `releaseFromTriage(draft)`
- `validateCompletion(item, evidences, justification?)`

### `src/lib/engines/apexOpsFlowEngine.ts`

Entrega a orquestracao pura:

- `runFieldInputFlow(...)`
- `runChecklistFlow(...)`
- `attemptTriageToOperation(...)`
- `attemptCompletionWithEvidence(...)`

## Demo isolada

`src/lib/engines/apexOpsFlowEngine.demo.ts` cobre 4 cenarios:

1. Entrada manual: rota de fuga obstruida em producao.
2. Checklist: maquina sem protecao.
3. Item critico sem responsavel tentando sair da Triagem.
4. Item com evidencia obrigatoria tentando concluir sem evidencia.

## Como rodar o demo

O demo foi deixado como funcao TypeScript exportada:

- importar `runApexOpsFlowDemo()` de `src/lib/engines/apexOpsFlowEngine.demo.ts`
- executar em um harness TS do projeto, teste futuro ou REPL com suporte a TypeScript

Exemplo de uso:

```ts
import { runApexOpsFlowDemo } from '@/src/lib/engines/apexOpsFlowEngine.demo'

const result = runApexOpsFlowDemo()
console.log(result.case1.success, result.case2.success)
```

## Observacoes importantes

- Nada segue direto para Operacao sem decisao.
- A demo nao cria dado visivel em tela.
- Nenhum arquivo legado foi apagado.
- O fluxo aceita aliases canonicos como `facilities`, `industria`,
  `incendio` e `maquinas` na camada de integracao, mesmo quando o catalogo
  interno atual usa IDs mais especificos.
