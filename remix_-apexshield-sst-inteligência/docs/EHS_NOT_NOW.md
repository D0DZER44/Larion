# EHS Not Now

## Fora do escopo nesta etapa

O ApexOps SST nao vai implementar agora:

- PGR completo
- PCMSO completo
- ASO
- eSocial
- ESG
- gestao quimica completa
- gestao de terceiros completa
- EHS corporativo completo

## Motivo

O produto ainda esta consolidando o motor operacional.

Abrir esses modulos agora aumentaria complexidade e tiraria foco de:

- Triagem
- Operacao
- Evidencia
- Compliance operacional
- Auditoria

## Como tratar isso por enquanto

- usar `OperationalItem` como unidade operacional
- usar `complianceStatus` para organizar o estado do item
- usar `auditTrail` para preservar historico
- usar evidencias e documentos apenas como rastreabilidade de campo

## O que fica para depois

- modelos documentais completos por NR
- programa completo de PGR
- trilhas medicas e ocupacionais completas
- integracoes legais e governamentais
- camadas corporativas amplas de EHS
