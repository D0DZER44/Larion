# EHS Scope

## Objetivo

Criar uma camada EHS operacional no ApexOps SST sem transformar o produto em um EHS corporativo completo.

Nesta camada, EHS significa:

- organizar acoes
- organizar compliance operacional
- garantir rastreabilidade
- suportar inspecoes
- suportar nao conformidades
- suportar evidencias
- suportar relatorios futuros

O centro continua sendo o `OperationalItem`.

## O que esta dentro do escopo agora

- `OperationalItem` com `nr`, `ruleId`, `complianceStatus` e `evidenceRequired`
- motor de compliance para organizar status e evidencias
- motor de trilha de auditoria imutavel
- contratos de compliance, evidencia e auditoria
- base para relatorios operacionais futuros

## O que a camada de compliance faz

- organiza vinculo entre item, NR e regra
- marca estado operacional de compliance
- entende se evidencia e exigida
- prepara o item para auditoria

## O que ela nao faz

- nao calcula multa final
- nao substitui laudo tecnico
- nao emite parecer juridico
- nao substitui engenheiro, medico ou higienista

## O que a trilha de auditoria faz

Registra eventos como:

- item criado
- item triado
- responsavel atribuido
- prazo alterado
- status alterado
- evidencia adicionada
- item enviado para validacao
- item concluido
- item reaberto
- item cancelado

## Principio

Compliance aqui nao e um produto juridico.

E uma camada de:

- organizacao
- evidencia
- rastreabilidade
- disciplina operacional
