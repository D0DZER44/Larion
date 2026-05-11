# Motor — Regras de Negócio

> O Motor é o coração do produto: o que transforma uma resposta `Não` num plano de
> ação com prazo legal. Tudo aqui é **regra**, não UI.
>
> Implementação principal: `lib/engines.ts`, `lib/store.ts → processAutoActions()`,
> `lib/normativeRules.ts`, `lib/normativeChecklists.ts`, `lib/fineEngine.ts`.

---

## 1. NRs (Normas Regulamentadoras)

### Cobertura atual

13 NRs com regras fixas embutidas:

| NR | Tema | Qtd regras fixas | Arquivo |
| --- | --- | --- | --- |
| NR-01 | Disposições gerais / GRO | 6 | `lib/normativeRules.ts` |
| NR-06 | EPI | 6 | idem |
| NR-07 | PCMSO | 5 | idem |
| NR-10 | Eletricidade | 7 | idem |
| NR-11 | Movimentação de cargas | 7 | idem |
| NR-12 | Máquinas e equipamentos | 9 | idem |
| NR-17 | Ergonomia | 6 | idem |
| NR-18 | Construção civil | 7 | idem |
| NR-20 | Inflamáveis | 7 | idem |
| NR-23 | Proteção contra incêndios | 7 | idem |
| NR-26 | Sinalização | 6 | idem |
| NR-33 | Espaço confinado | 9 | idem |
| NR-35 | Trabalho em altura | 8 | idem |

**Total:** 90 regras fixas. Cada uma carrega:
- `id`, `nr`, `titulo`, `descricao`, `perigo`, `tipoRisco`
- `severidadeBase`, `prioridadeBase`, `prazoBase` (dias)
- `multaBaseEstimativa`, `chanceIncidenteBase`
- `acaoRecomendada`
- Flags: `bloqueante`, `geraRisco`, `geraAcao`, `impactaScore`, `regraFixa`

### NRs mapeadas em `NR_MATRIX` (mas sem regras fixas)

NR-03, NR-04, NR-05, NR-09, NR-13, NR-15, NR-16, NR-24, NR-28, NR-32, NR-34.

### Mapeamento NR → Pacote

```
NR-01, NR-03 a NR-09, NR-17, NR-23, NR-24, NR-26, NR-28   → Base SST
NR-10, NR-11, NR-12, NR-13, NR-15, NR-16, NR-20, NR-33, NR-34 → Indústria
NR-18, NR-35                                              → Construção Civil
NR-32                                                     → Saúde/Hospitalar
```

### Regras

- **NR-01 e Base SST sempre ativas.** Não há como desativar.
- **Pacotes setoriais opcionais.** Cliente ativa em
  `/configuracoes → Regras → Pacotes`.
- **Regras fixas NR não são editáveis.** UI bloqueia (`canEditRule` retorna false).
- **NRs aplicáveis** = `Base SST ∪ pacotesAtivos ∪ NRs do segmento ∪
  NRs das atividades críticas` (em `getNRsAplicaveis`).

---

## 2. Setores

### Modelo

```js
Sector { id: string, name: string }
```

### Sementes do V1

`Manutenção`, `Produção (Linha 1)`, `Logística`, `Usinagem`, `Pintura`, `Administrativo`.

### Regras

- Setor é referência livre — não tem hierarquia.
- Inspeção, Risco e Ação carregam `setor` como string (não FK rígida hoje).
- Setor pode ser reordenado (`reorderSectors` no store).
- Setor não pode ser apagado se houver inspeção/risco/ação vinculada (regra do V2 —
  hoje permite).

---

## 3. Atividades

### Modelo

`organization.atividadesCriticas: string[]` — lista de atividades que a operação
realiza com risco elevado.

### Sementes

`Trabalho em altura`, `Máquinas e equipamentos`, `Ruído`.

### Como o motor usa

1. **Filtra regras aplicáveis:** uma `RiskRule` só é considerada se uma de suas
   `atividades[]` estiver em `organization.atividadesCriticas` (ou se for `Base SST`).
2. **Filtra NRs aplicáveis:** uma NR vira "aplicável" se uma das atividades cruzar
   com `atividadesRelacionadas` no `NR_MATRIX`.
3. **Detecção semântica:** `NormativeEngine.detect(textoAtividade)` faz match por
   palavra-chave (ex: "trabalho em altura" → NR-35).

### Opções fixas (UI)

`Trabalho em altura`, `Manutenção elétrica`, `Operação de máquinas`,
`Espaço confinado`, `Trabalho a quente`, `Movimentação de cargas`,
`Outras atividades`.

---

## 4. Riscos padrão

### Três sistemas coexistem hoje

| Sistema | Onde | O quê |
| --- | --- | --- |
| `rules` | `useAppStore().rules` | Regras customizadas pelo cliente (poucas) |
| `riskRules` | `useAppStore().riskRules` ← `INITIAL_RISK_RULES` | Regras por pacote, schema rico |
| `fixedNrRules` | `lib/normativeRules.ts` | 90 regras fixas NR |

### Schema `RiskRule` (riskRules)

```js
RiskRule {
  id, titulo, pacote,
  segmentos: string[],
  atividades: string[],
  nrRelacionada: string,
  criticidade: "Baixo"|"Médio"|"Alto"|"Crítico",
  condicao: string,
  acaoSugerida: string,
  prazoPadraoHoras: number,
  exigeEvidencia: boolean,
  ativo: boolean,
  geraMultaEstimativa: boolean,
  faixaMultaPadrao: string
}
```

### Quando o motor cria risco

Em `AutomationEngine.processInspection()`:
1. Varre `inspection.items` com `status: "Não" | "Parcialmente"`.
2. Enriquece o item com `enrichChecklistQuestion` (garante 8 campos).
3. Se `item.geraRisco === false`, pula.
4. Cria/atualiza risco com `id: risk-${inspectionId}-${item.id}` (idempotente).
5. Hierarquia de campos: **item → regra fixa NR → regra de segmento**.

### Quando o risco vira "Mitigado"

- Quando todas as ações vinculadas estão `Concluída` + `Validada` (cascata em
  `app/acoes/hooks.ts → updateActionStatus`).
- Quando o mesmo item é re-respondido como `Sim` em nova inspeção (em
  `AutomationEngine.processInspection → conformingItems`).

---

## 5. Checklists padrão

### Duas fontes

| Fonte | Arquivo | Edição |
| --- | --- | --- |
| `INITIAL_CHECKLISTS` | `lib/checklists.ts` | Sementes editáveis pelo cliente |
| `fixedNrChecklists` | `lib/normativeChecklists.ts` | Rígidos, vinculados a regras fixas NR |

Unificação em runtime: `getTodosChecklistsAtivos(custom)` retorna lista combinada
(custom tem preferência, fixos preenchem o que faltar), sempre ordenada por NR e
título.

### Schema `ChecklistTemplate`

```js
ChecklistTemplate {
  id, titulo, category, status,
  pacote, segmentos, atividades, nr,
  criticidadePadrao,
  geraRiscoSeNaoConforme,
  ativo,
  regraFixa,
  sections: [
    {
      id, title,
      questions: ChecklistQuestion[]
    }
  ]
}
```

### Schema `ChecklistQuestion` (cada item = uma micro-regra)

```js
ChecklistQuestion {
  id, text, type,                     // pergunta
  nrRelacionada,                      // NR vinculada
  pacote,                             // pacote
  criticidade,                        // criticidade se não conforme
  acaoSugerida,                       // ação sugerida
  exigeEvidencia,                     // exige evidência?
  geraRisco,                          // gera risco?
  geraAcao,                           // gera ação?
  prazoPadraoHoras,                   // prazo padrão
  bloqueante,                         // paralisa operação?
  tipoRisco,
  regraId,                            // FK pra regra fixa NR
  regraFixa, editavel, removivel
}
```

Enriquecimento automático: campos faltantes são derivados em
`enrichChecklistQuestion` (com fallback por criticidade).

---

## 6. Ações padrão

### Origens

| Origem | Quem gera | Quando |
| --- | --- | --- |
| Automática (Inspeção) | `AutomationEngine.processInspection` | Item NC com `geraAcao === true` |
| Automática (Risco) | `processAutoActions` | Risco Crítico/Alto sem ação |
| Manual | `useAcoes().createAction` | Operador cria via modal |

### Template

```js
Acao {
  titulo: `Mitigação: ${riscoTitulo}`,
  descricao: acaoSugerida,
  acaoSugerida,                       // mesma da regra
  prazo: hoje + prazoPadraoHoras,
  prioridade: derivada de criticidade,
  responsavel: inspecao.responsavel || "Operação / SSO",
  validador: idem,
  executor: "Pendente designação",
  exigeEvidencia: derivada de criticidade,
  bloqueante: derivada do checklist item,
  status: "Pendente"
}
```

### Estados

`Pendente → Em andamento → Concluída → (Validada | Rejeitada)` ou `Cancelada`.
Estado paralelo `Vencida` se prazo expira sem conclusão.

### Cascata

| Evento na Ação | Efeito no Risco |
| --- | --- |
| Conclusão + Validada (todas relevantes) | Risco → `Mitigado` |
| Conclusão sem validação | Risco → `Em análise` |
| Reabertura | Risco → `Aberto` |

---

## 7. Evidências esperadas

### Regra geral

| Criticidade da ação | Exige evidência? |
| --- | --- |
| Crítica | **Sempre** |
| Alta | **Sempre** |
| Média | Depende (config do checklist) |
| Baixa | Opcional |

Pode ser sobrescrita pelo `exigeEvidencia` do item de checklist.

### Tipos aceitos (V1)

- String/URL no campo `acao.evidencia[]` (sem upload real).
- Texto livre como observação não conta como evidência válida.

### Tipos aceitos (V2)

- Foto (com geolocalização e timestamp).
- PDF assinado.
- Vídeo curto (até 30s).
- Hash SHA-256 calculado no upload pra detectar adulteração.

### Validação

`lib/action-rules.ts → actionRequiresEvidence(acao)`:
- Retorna `true` se ação é crítica/alta e ainda não tem evidência válida.
- Bloqueia status `Concluída` enquanto sem evidência (mantém em
  `Aguardando Validação`).

---

## 8. SLA

### Tabela padrão

| Criticidade | Prazo legal (motor) | Config `engineConfig.slas` |
| --- | --- | --- |
| Crítica | 24 horas | `criticoHoras: 24` |
| Alta | 72 horas | `altoHoras: 72` |
| Média | 15 dias | `medioDias: 15` |
| Baixa | 30 dias | `baixoDias: 30` |

### Cálculo de prazo

`prazoData = dataCriacaoAcao + prazoPadraoHoras`

`prazoPadraoHoras` vem nessa ordem de prioridade:
1. Campo do item de checklist (`item.prazoPadraoHoras`).
2. `prazoBase` da regra fixa NR vinculada (em dias × 24).
3. Default por criticidade
   (`defaultPrazoPorCriticidade` em `lib/normativeChecklists.ts`).

### Vencimento

`processAutoActions` (em `lib/store.ts`) marca risco como `Vencido` quando:
- `r.prazo` é data ISO e `hoje > prazoDate`, OR
- `r.prazo` é texto ("Até 3 dias") e `dataLancamento + dias < hoje`.

Ações vencem em `useAcoes()` quando `new Date() > prazoDate` e ainda não concluídas.

### Escalonamento

`useAcoes() → executarFollowUps()` roda a cada 60s:
- Crítica sem update em 4h → follow-up.
- Crítica sem update em 8h → escalonamento (para Gestor/SST).
- Alta sem update em 24h → follow-up; em 48h → escalonamento.
- Média sem update em 48h → follow-up; em 96h → escalonamento.
- Baixa sem update em 168h (7d) → follow-up + escalonamento.

---

## 9. PGR Vivo

**Status atual:** não implementado.

### Conceito

PGR Vivo = Programa de Gerenciamento de Riscos que se atualiza sozinho a cada
inspeção/risco/ação, em vez de ser um PDF estático revisado anualmente.

### Schema futuro

```js
PGRVersao {
  id: string,
  versao: string,                     // "2026-05-11.001"
  geradoEm: string,
  geradoPor: string,
  organizacaoSnapshot: object,        // estado da empresa no momento
  riscosInventariados: Risco[],
  riscosControlados: number,
  riscosEmTratamento: number,
  acoesPendentes: number,
  hashIntegridade: string,            // SHA-256 do conteúdo
  pdfUrl?: string,
  status: "rascunho"|"vigente"|"arquivado"
}
```

### Trigger de atualização

- Novo risco crítico identificado → marca PGR como "desatualizado".
- Risco mitigado → idem.
- Mudança em pacotes de regras → idem.
- Operador clica em "Gerar nova versão" → snapshot + PDF + hash.

### Conformidade NR-01

PGR é obrigatório pela NR-01. Versão vigente fica disponível em
`/configuracoes → PGR` (rota futura).

### Quando implementar

Início do V2 (depois do Supabase, antes da Maturidade).

---

## 10. Maturidade (V2)

**Status atual:** não implementado.

### Conceito

Score 0–100 de evolução do programa SST ao longo do tempo (rolling 180 dias).

### Fatores positivos

- Ações concluídas no prazo (+).
- Inspeções realizadas em dia (+).
- Riscos críticos mitigados (+).
- Cobertura de EPIs (+).
- Treinamentos atualizados (+).

### Fatores negativos

- Ações vencidas (−).
- Reincidência (mesmo risco voltando) (−−).
- Inspeções atrasadas (−).
- Risco crítico em aberto há > 30d (−−).

---

## 11. Reincidência (V2)

**Status atual:** apenas o multiplicador `engineConfig.economia.fatorReincidencia`
(default 1.2) usado em cálculo de multa.

### Detecção formal (V2)

```
reincidente = exists risco anterior com mesma (regraId, setor) mitigado há < 90 dias
```

### Efeito

- Multa estimada × 1.5.
- Prioridade sobe um nível (Médio → Alto).
- Alerta especial pro setor.
- Score de maturidade penalizado.

---

## 12. Impacto estimado

### NR-28 (multa)

`lib/fineEngine.ts → calcularFaixaMulta()`:
- Entrada: `nr`, `criticidade`, `numeroEmpregados`, `reincidencia?`, `tipoInfracao?`,
  `nivelInfracao?`.
- Tabela de portes (1-10, 11-25, ..., 1000+).
- Saída: `{ minimoEstimado, maximoEstimado, faixaLabel, baseLegal, disclaimer }`.

### Impacto econômico amplo

`lib/engines.ts → EconomicImpactEngine.estimate()`:
- Combina multa + paralisação (custo/hora) + afastamento.
- Multiplicador por pessoas expostas (× 1 + 0.1 × pessoas).
- Penalidade de reincidência adicional.

### Multa evitada (KPI)

`riscos com status === "Mitigado" || "Resolvido" → soma de multaEstimada`.
Exibido em `/central/motor` e no Dashboard.

---

## Princípios do Motor

1. **Idempotência.** Rodar `AutomationEngine.processInspection(id)` duas vezes não
   duplica risco nem ação.
2. **Hierarquia de fonte.** Item de checklist > regra fixa NR > regra de segmento.
3. **Bloqueio de inativo.** Pacote desativado → suas regras não disparam (filtro em
   `regrasAplicaveis`).
4. **Defesa documental.** Toda ação concluída deixa histórico imutável
   (`historico[]` com hash).
5. **Pessoa no centro.** Todo risco/ação carrega `trabalhadoresExpostos` e
   `perfilExposto`.
6. **Transparência.** `/central/motor` mostra a memória de cálculo NR por NR.
