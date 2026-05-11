# Evidence and Validation

## Objetivo

O ApexOps SST trata evidencia como prova operacional do que foi tratado,
validado ou reaberto. O foco nao e acumular anexo: e impedir que item
critico seja encerrado sem respaldo rastreavel.

## O que conta como evidencia

O contrato inicial aceita:

- `foto`
- `arquivo`
- `observacao`
- `assinatura`
- `registro`
- `checklist`

Cada evidencia pertence a um `OperationalItem`, carrega autor, data,
status de validacao e historico append-only.

## Regras principais

### 1. Conclusao exige prova suficiente quando necessario

Se o item:

- tiver `requiresEvidence=true`, ou
- for `alta` ou `critica` e cair na exigencia padrao,

ele nao pode ir para `completed` sem evidencia aprovada suficiente.

### 2. Evidencia rejeitada nao encerra item

Evidencia com `validationStatus=rejeitada` continua registrada no historico,
mas nao conta como prova valida para conclusao.

### 3. Em validacao exige evidencia real

Um item so pode ir para `em_validacao` se tiver ao menos uma evidencia
`pendente` ou `aprovada`.

### 4. Reabertura precisa ser explicada

Quando um item concluido voltar para `inProgress`, a justificativa e
obrigatoria para preservar rastreabilidade.

### 5. Evidencia de item concluido nao pode sumir

Depois que o item chega a `completed`, a evidencia fica protegida contra
remocao logica na camada operacional.

### 6. Historico e permanente

Cada evidencia mantem trilha de eventos como criacao, aprovacao, rejeicao
ou tentativa bloqueada de remocao.

## Fluxo resumido

1. Evidencia e criada com status `pendente`.
2. O item pode seguir para `em_validacao` se houver pelo menos uma
   evidencia pendente ou aprovada.
3. A validacao operacional aprova ou rejeita a evidencia.
4. O item so fecha de forma segura quando a exigencia de evidencia estiver
   satisfeita por evidencias aprovadas.

## O que esta fora do escopo

- assinatura juridica definitiva;
- cadeia probatoria forense completa;
- retencao legal de documentos;
- workflow corporativo amplo de GED;
- arbitragem juridica sobre suficiencia documental.
