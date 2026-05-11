# Migration From Old Engine

## Resumo

O modelo antigo tinha o fluxo dominante:

`Inspecao -> Risco -> Acao`

Esse desenho ainda funciona como legado operacional, mas nao representa mais a arquitetura alvo.

A arquitetura alvo passa a ser:

`Entrada -> Triagem -> Operacao -> Evidencia -> Inteligencia -> Relatorio`

Com `OperationalItem` como unidade central.

## O que muda conceitualmente

### Antes

- inspeção era a principal porta de entrada
- risco era a entidade intermediaria de decisao
- acao era a unidade de execucao
- regras estavam espalhadas entre store, motor, rules e types antigos

### Agora

- entrada de campo tambem e porta principal
- checklist vira fonte de achado estruturado
- regra SST passa a ser contrato unico
- triagem vira etapa explicita
- item operacional substitui a fragmentacao risco/acao
- evidencia e inteligencia deixam de ser anexos secundarios e viram partes nativas do fluxo

## Mapeamento de entidades

### `FieldInput`

Novo papel:

- capturar sinal de campo antes da triagem

No motor antigo:

- praticamente inexistente como entidade formal

### `Inspection`

Novo papel:

- execucao de checklist em contexto operacional
- fonte de achados

No motor antigo:

- era tambem disparador indireto de risco e acao

### `Checklist`

Novo papel:

- instrumento de captura de conformidade
- cada pergunta pode disparar achado operacional

### `SSTRule`

Novo papel:

- unidade unica de regra do motor

Substitui estruturalmente a dispersao entre:

- `fixedNrRules`
- `riskRules`
- `rules`

### `OperationalItem`

Novo papel:

- entidade canonica de operacao
- concentra prioridade, bloqueio, regra, origem, evidencia e historico

Substitui a fragmentacao logica entre:

- risco aberto
- acao corretiva
- parte da semantica de status da inspecao

## Arquivos reaproveitados

### Reaproveitados diretamente

- `lib/normativeRules.ts`
  - agora convertido em `src/lib/rules/nrRules.ts`
- `lib/nrMatrix.ts`
  - agora convertido em `src/lib/catalogs/nrCatalog.ts`
- `lib/store.ts -> getPackageFromNr`
  - mantido como fonte do mapeamento atual
- `lib/action-rules.ts -> actionRequiresEvidence`
  - reaproveitado pelo novo `evidenceEngine`

### Reaproveitados como referencia historica

- `docs/MOTOR.md`
- `docs/REGRAS-DE-NEGOCIO.md`
- `lib/rules/activityTemplates.js`
- `lib/rules/evidenceTemplates.js`

## Arquivos rebaixados para legado

Os seguintes arquivos permanecem no projeto, mas devem ser tratados como legado:

- `lib/types.ts`
- `lib/engines.ts`
- `lib/motor/index.js`

Motivo:

- foram modelados em torno de `Inspecao -> Risco -> Acao`
- misturam regra, estado operacional, adaptacao de UI e semantica antiga
- nao devem ser a base de evolucao do motor final

## O que nao foi apagado

Nada foi removido sem necessidade.

Isso foi proposital porque:

- a UI atual ainda consome partes do modelo antigo
- o produto ainda nao esta conectado a banco
- ainda nao foi feito adapter completo do estado legado para `OperationalItem`

## Estrategia de migracao recomendada

### Fase 1 - Dominio novo pronto

Status: concluida neste passo.

Entregue:

- tipos novos
- catalogos novos
- regras novas
- engines novas
- documentacao de arquitetura e migracao

### Fase 2 - Adapter de leitura

Proximo passo recomendado:

- ler dados antigos de inspecao, risco e acao
- projetar isso em `OperationalItem` para inteligencia e relatorio

### Fase 3 - Adapter de escrita

Proximo passo recomendado:

- fazer fluxos novos gravarem primeiro em `OperationalItem`
- manter compatibilidade com estado antigo apenas enquanto a UI ainda depender dele

### Fase 4 - Substituicao de consumo da UI

Proximo passo recomendado:

- trocar telas internas para ler o novo motor
- sem mudar layout, rotas ou navegacao

### Fase 5 - Desligamento do modelo antigo

So depois de migrar consumo e escrita:

- parar de expandir `lib/engines.ts`
- parar de expandir `lib/types.ts`
- manter apenas adapters necessarios

## Regras para a transicao

- nao criar feature nova diretamente no modelo `Inspecao -> Risco -> Acao`
- toda regra nova deve nascer em `src/lib/rules`
- todo comportamento novo deve nascer em `src/lib/engines`
- toda entidade nova deve nascer em `src/types`
- arquivos legados podem ser adaptados, mas nao devem voltar a ser a fonte principal da arquitetura

## Ganhos desta migracao

- uma unidade operacional unica
- triagem explicita
- rastreabilidade mais simples
- melhor encaixe com entrada de campo
- melhor encaixe com evidencia obrigatoria
- melhor base para inteligencia e relatorio
- menor acoplamento com UI e store atual

## Riscos ainda em aberto

- a UI atual ainda nao consome `OperationalItem`
- ainda nao existe persistencia oficial do novo motor
- ainda nao existe adapter entre risco/acao antigos e item novo
- parte da linguagem normativa antiga ainda esta em schemas legados

## Decisao pratica

A arquitetura final do motor agora esta consolidada em `src/`.

O modelo antigo continua apenas como compatibilidade de transicao e nao deve ser tratado como destino arquitetural.
