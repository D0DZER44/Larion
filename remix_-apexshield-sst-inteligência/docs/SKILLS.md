# Skills — Capacidades Inteligentes do Motor

> Skill = capacidade autônoma do motor. Uma skill recebe entrada, aplica regra,
> devolve saída. Idealmente cada skill é um arquivo `.js` com uma função pura.
>
> Hoje as skills estão **embaralhadas em `lib/engines.ts`** (9 objetos no mesmo
> arquivo). Este documento mapeia cada skill conceitual com onde ela vive hoje.

---

## 1. detectarRisco

**O que faz:** Recebe uma resposta de inspeção marcada como `Não` / `Parcialmente`
e decide se ela vira risco, com qual NR, criticidade e pacote.

**Entrada conceitual:**
```js
{
  perguntaId: "nr-12-04",
  texto: "A máquina possui proteção adequada?",
  resposta: "Não",
  inspecaoId: "ins-2025-001",
  contextoChecklist: { nr: "NR-12", pacote: "Indústria", criticidade: "Crítica" }
}
```

**Saída conceitual:**
```js
{
  geraRisco: true,
  titulo: "Máquina sem proteção adequada",
  nr: "NR-12",
  pacote: "Indústria",
  criticidade: "Crítica",
  exigeEvidencia: true
}
```

**Implementação atual:**
- `lib/engines.ts → AutomationEngine.processInspection()` — varre itens NC.
- `lib/engines.ts → NormativeEngine.detect()` — detecta NR por palavra-chave
  (fallback quando o checklist não carrega NR).
- `lib/normativeChecklists.ts → enrichChecklistQuestion()` — garante os 8 campos.

**Regras:**
- Se `item.geraRisco === false`, **não dispara**.
- Se já existe risco com o mesmo `inspectionId + checklistItemId`, **atualiza** em
  vez de criar duplicado.

---

## 2. gerarNaoConformidade

**O que faz:** Marca uma resposta como NC formal, com rastreabilidade
(quem respondeu, quando, qual evidência foto/comentário).

**Entrada conceitual:**
```js
{ inspecaoId, perguntaId, resposta, comentario, fotoUrl, auditorId, timestamp }
```

**Saída conceitual:**
```js
{ ncId, status: "Aberta", riscoGeradoId, acaoGeradaId }
```

**Implementação atual:**
- Conceito implícito — não existe entidade "NaoConformidade" separada. As respostas
  NC viram items dentro de `inspecao.items[]` com `status: "Não"`. O risco e a ação
  são geradas pelo motor diretamente.

**Gap V2:** criar entidade própria `nao_conformidades[]` no store para permitir
relatório histórico independente da inspeção origem.

---

## 3. gerarAcao

**O que faz:** A partir de um risco recém-criado, gera a ação corretiva com prazo
calculado, responsável sugerido e exigência de evidência.

**Entrada conceitual:**
```js
{ riscoId, criticidade, nr, setor, prazoPadraoHoras, acaoSugerida, exigeEvidencia }
```

**Saída conceitual:**
```js
{
  acaoId,
  titulo: "Mitigação: Máquina sem proteção adequada",
  prazo: "2026-05-12",  // hoje + prazoPadraoHoras
  prioridade: "Crítica",
  responsavel: "Equipe de Manutenção",
  exigeEvidencia: true,
  status: "Pendente"
}
```

**Implementação atual:**
- `lib/engines.ts → AutomationEngine.processInspection()` — bloco "GERAÇÃO DE AÇÃO".
- `lib/store.ts → processAutoActions()` — gera ação para riscos críticos sem ação.
- `lib/engines.ts → ActionEngine.createFromRisk()` — helper.

**Regras:**
- Se `item.geraAcao === false`, não dispara.
- Se já existe ação com o mesmo `actionId` derivado (`act-${riskId}`), **atualiza**.

---

## 4. calcularPrioridade

**O que faz:** Converte criticidade + contexto em prioridade operacional
(Crítica / Alta / Média / Baixa ou P1/P2/P3/P4).

**Entrada conceitual:**
```js
{ criticidade, exposedPeople, overdueInspections, recurrence, criticalActivity }
```

**Saída conceitual:**
```js
{ score: 78, nivel: "Alto", prioridade: "P2" }
```

**Implementação atual:**
- `lib/risk-calculations.ts → calcularPrioridade()` — função síncrona.
- `lib/engines.ts → RiskEngine.calculateRisk()` — versão com mais inputs (modifiers).
- `lib/engines.ts → PriorityEngine.getQueue()` — gera fila ordenada P1→P3.

**Regras:**
- Crítica + 24h vencido = sempre P1.
- Alta + reincidência = sobe pra P1.
- Modifiers somam até 100 pontos.

---

## 5. calcularSLA

**O que faz:** Determina prazo legal para tratativa baseado em criticidade
(e NR específica quando aplicável).

**Entrada conceitual:**
```js
{ criticidade, nr, dataLancamento }
```

**Saída conceitual:**
```js
{ prazoHoras: 24, prazoData: "2026-05-12T08:00:00Z", vencido: false }
```

**Implementação atual:**
- `lib/risk-calculations.ts → calcularPrazo()` — converte criticidade em prazo.
- `lib/store.ts → engineConfig.slas` — config global
  (criticoHoras=24, altoHoras=72, medioDias=15, baixoDias=30).
- `lib/normativeChecklists.ts → defaultPrazoPorCriticidade()` — fallback.

**Regras:**
- Crítica = 24h
- Alta = 72h
- Média = 7 dias (168h)
- Baixa = 30 dias (720h)

---

## 6. exigirEvidencia

**O que faz:** Decide se uma ação requer anexo (foto/PDF) para ser concluída.

**Entrada conceitual:**
```js
{ acao }
```

**Saída conceitual:**
```js
{ exigeEvidencia: true, motivo: "Ação corretiva de risco crítico" }
```

**Implementação atual:**
- `lib/action-rules.ts → actionRequiresEvidence()` — função pura.
- `lib/normativeChecklists.ts → defaultExigeEvidencia()` — derivação por criticidade.

**Regras:**
- Toda ação derivada de risco **Crítico** ou **Alto** exige evidência.
- Pode ser sobrescrita pelo item de checklist (`exigeEvidencia: false`).
- Ação concluída sem evidência mantém status `Aguardando Validação`.

---

## 7. gerarInsight

**O que faz:** Lê o estado consolidado e devolve frases conversacionais para a
L.A.R.I (chat) ou cards de recomendação.

**Entrada conceitual:**
```js
{ stateSnapshot }
```

**Saída conceitual:**
```js
{
  titulo: "Intervenção crítica necessária",
  decisao: "Paralisar atividades com risco crítico não mitigado",
  motivo: "3 riscos críticos abertos + 4 ações vencidas",
  confianca: "92%",
  proximosPassos: ["Isolar áreas", "Notificar responsáveis", "Revisar EPIs"]
}
```

**Implementação atual:**
- `lib/engines.ts → LariContextEngine.getRealtimeContext()` — agrega métricas.
- `lib/engines.ts → LariContextEngine.respond()` — gera resposta por intent.
- `lib/engines.ts → DecisionEngine.getMainDecision()` — decisão executiva.

**Intents reconhecidos:** Check_Applicable_NRS, Check_Applicable_Checklists,
Check_Top_Recommendations, Check_Fines, Check_Today, Check_Sectors, Check_Score,
Check_Actions, Check_Inspections, Check_Risks, Calculate_Impact, Get_Decision,
Get_Report, Check_Exposed_Workers, Doubt_Normative, General.

---

## 8. gerarRelatorio

**O que faz:** Compila um snapshot do programa SST em formato visual (web).
Idealmente também PDF.

**Entrada conceitual:**
```js
{ periodoStart, periodoEnd, filtros }
```

**Saída conceitual:**
```js
{
  periodo: "2026-04-01 / 2026-05-01",
  riscosAbertos: 12,
  acoesConcluidas: 47,
  multaEvitada: 138000,
  setorMaisCritico: "Manutenção",
  graficoBarras: [...],
  graficoPizza: [...]
}
```

**Implementação atual:**
- `components/reports/FlowReportsPage.tsx` — relatório executivo renderizado.
- `lib/dashboardMetrics.ts → calculateDashboardMetrics()` — função utilitária
  pronta porém **sem consumidor** (oportunidade pra ser usada aqui).

**Gap V2:** export PDF, agendamento de envio por e-mail.

---

## 9. atualizarPGRVivo

**O que faz:** Mantém o PGR (Programa de Gerenciamento de Riscos) sincronizado
com o estado real de riscos e ações.

**Entrada conceitual:**
```js
{ riscosAtuais, acoesAtuais, organizacao }
```

**Saída conceitual:**
```js
{
  versao: "2026-05-11.001",
  riscosInventariados: 27,
  riscosControlados: 18,
  riscosTratamento: 9,
  documento: "...markdown ou PDF..."
}
```

**Implementação atual:** **Inexistente.** Não há código para PGR Vivo.

**Quando implementar (V2):**
1. Definir schema do `pgr_versions[]` no store.
2. Trigger: toda vez que `risco.status === "Mitigado"` ou novo risco aparece, marcar
   PGR como "desatualizado".
3. Botão "Gerar nova versão" → snapshot do estado + assinatura digital.
4. Exportar para PDF/A para arquivamento legal.

---

## Skills planejadas (V2/V3)

| Skill | Descrição |
| --- | --- |
| `calcularMaturidade` | Score 0-100 da evolução do programa SST (180-day rolling). |
| `detectarReincidencia` | Identifica quando o mesmo risco volta no mesmo setor em <90d. |
| `preverIncidente` | Modelo que estima probabilidade de incidente por setor/atividade. |
| `recomendarEPI` | Cruza atividade × NR × histórico para sugerir EPI específico. |
| `gerarTreinamentoSugerido` | Baseado em NCs recorrentes, sugere matriz de treinamento. |

---

## Princípios das skills

1. **Pureza.** Skill recebe entrada, devolve saída. Não toca store diretamente.
2. **Idempotência.** Rodar a mesma skill duas vezes com a mesma entrada dá o mesmo
   resultado.
3. **Composabilidade.** `detectarRisco` chama `calcularPrioridade` chama `calcularSLA`.
4. **Rastreabilidade.** Toda saída de skill carrega `motivo` ou `regraOrigem` para
   auditoria.

Hoje essas regras **não estão respeitadas** — o motor escreve direto no store. Reorg
para skills puras é tema do V2.
