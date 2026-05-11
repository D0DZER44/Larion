# CLIs — Validação e Limpeza

> **Estado atual:** **nenhuma CLI existe** no projeto. `package.json` só tem os
> scripts padrão do Next (`dev / build / start / lint / clean`).
>
> Este documento define os comandos `node cli/*.js` que devem ser criados pra
> automatizar verificações que hoje só são feitas manualmente (ou nem são).

---

## Estrutura proposta

```
/cli
  ├─ validar-mocks.js
  ├─ validar-regras.js
  ├─ validar-dashboard.js
  ├─ validar-orfaos.js
  ├─ validar-nrs.js
  └─ validar-evidencias.js
```

Cada arquivo é um script Node standalone (`.js`, sem TS) que:
1. Lê o sistema de arquivos do projeto (sem subir o app).
2. Aplica a regra de validação.
3. Imprime relatório formatado no stdout.
4. Sai com `process.exit(0)` (ok) ou `1` (achou problema).

Scripts adicionados ao `package.json`:

```json
"scripts": {
  "validate": "node cli/validar-mocks.js && node cli/validar-regras.js && ...",
  "validate:mocks": "node cli/validar-mocks.js",
  "validate:rules": "node cli/validar-regras.js",
  "validate:dashboard": "node cli/validar-dashboard.js",
  "validate:orphans": "node cli/validar-orfaos.js",
  "validate:nrs": "node cli/validar-nrs.js",
  "validate:evidences": "node cli/validar-evidencias.js"
}
```

---

## 1. `validar-mocks.js`

**O que faz:** detecta dados de teste vazados (`"dasda"`, `"teste"`, `"foo"`, etc.)
em fixtures e mocks.

**Hoje:** lógica espalhada como função inline `filterJunk` em
`app/operacao/riscos/page.tsx` e `app/operacao/inspecoes/page.tsx`, e
`BLOCKED_GENERIC_TERMS` em `lib/action-rules.ts`.

**Spec:**
- Varre `lib/checklists.ts`, `lib/normativeChecklists.ts`, `lib/riskRules.ts`,
  `lib/normativeRules.ts`.
- Procura termos: `dasda`, `dasd`, `teste`, `lorem`, `foo`, `bar`, `xxx`, `tbd`.
- Procura títulos vazios ou < 3 caracteres.
- Procura IDs duplicados.

**Output:**
```
✗ lib/checklists.ts:127  → título "teste" (linha 127)
✗ lib/riskRules.ts:441   → id duplicado "rr-ind-nr12-03"
✓ lib/normativeRules.ts  (sem problemas)
✓ lib/normativeChecklists.ts (sem problemas)

Total: 2 problemas em 4 arquivos. Exit 1.
```

---

## 2. `validar-regras.js`

**O que faz:** garante consistência semântica das regras do motor.

**Spec:**
- Cada `fixedNrRule` tem `nr` válida (formato `NR-XX`).
- Cada `nr` da regra existe em `NR_MATRIX`.
- Cada `riskRule` referencia `pacote` válido (Base SST | Indústria | Construção Civil
  | Saúde/Hospitalar).
- Cada `riskRule.nrRelacionada` existe em `fixedNrRules` ou `NR_MATRIX`.
- Não há regras com `prazoBase < 0`.
- Não há `multaBaseEstimativa < 0`.
- Não há `criticidade` fora do vocabulário (Baixo|Médio|Alto|Crítico).

**Output:**
```
✗ riskRule "rr-ind-nr99-01" → NR-99 não existe em NR_MATRIX
✗ fixedNrRule "nr-12-08"    → criticidade "Critica" sem acento (esperado "Crítica")
✓ 89 regras OK em fixedNrRules
✓ 47 regras OK em riskRules

Total: 2 problemas. Exit 1.
```

---

## 3. `validar-dashboard.js`

**O que faz:** verifica que os KPIs do dashboard são deriváveis do estado
e não estão mockados em código.

**Spec:**
- Varre `components/dashboard/FlowDashboard.tsx`.
- Detecta números hard-coded em JSX (regex `>{0-9]+%?<`).
- Verifica que toda métrica vem de `useAppStore()` ou helper deterministico.
- Confirma que `lib/dashboardMetrics.ts` tem ao menos um consumidor (hoje não tem).

**Output:**
```
✗ FlowDashboard.tsx:412 → "87%" hard-coded (esperado: derivar de score)
✗ lib/dashboardMetrics.ts → função calculateDashboardMetrics sem consumidor

Total: 2 problemas. Exit 1.
```

---

## 4. `validar-orfaos.js`

**O que faz:** identifica imports, exports, variáveis e arquivos sem consumidores.

**Hoje:** problemas conhecidos (de `ARCHITECTURE.md`):
- `contexts/AppContext.tsx` montado mas sem consumidores.
- `lib/dashboardMetrics.ts`, `lib/utils.ts`, `hooks/use-mobile.ts` sem imports.
- `compareNRs`, `getTodasRegrasAtivas`, `AcaoRecomendadaCard`, `normativeDetection`,
  `addRisco/addAcao`, `rules`, `activeRulePackages` órfãos em telas.

**Spec:**
- Para cada arquivo em `lib/`, `components/`, `hooks/`, `contexts/`:
  - Grep por `from ['"]@/<caminho>['"]`. Se zero matches → arquivo órfão.
- Para cada `import { X }`:
  - Se `X` não aparece em outro lugar no mesmo arquivo → import órfão.
- Para cada `const X = useMemo(...)` ou `const X = ...`:
  - Se `X` não é referenciado depois → variável órfã.
- Para cada rota `app/<path>/page.tsx`:
  - Se `<path>` não aparece em `components/Sidebar.tsx` nem em `<Link href=>` no
    código → rota órfã.

**Output:**
```
ARQUIVOS ÓRFÃOS (4):
  lib/dashboardMetrics.ts
  lib/utils.ts
  hooks/use-mobile.ts
  contexts/AppContext.tsx (montado em layout.tsx mas useAppStore não consumido)

IMPORTS ÓRFÃOS (5):
  app/operacao/inspecoes/page.tsx:7   → getTodasRegrasAtivas
  app/operacao/inspecoes/page.tsx:23  → AcaoRecomendadaCard
  app/operacao/matriz/page.tsx:5      → compareNRs
  ...

VARIÁVEIS ÓRFÃS (4):
  app/operacao/inspecoes/page.tsx:154 → normativeDetection
  app/central/motor/page.tsx:20       → rules
  app/central/motor/page.tsx:22       → activeRulePackages
  app/operacao/inspecoes/page.tsx:55  → addRisco, addAcao (destruturados)

ROTAS ÓRFÃS (1):
  app/operacao/incidentes/page.tsx (sem entrada no Sidebar)

LINKS QUEBRADOS (1):
  components/Sidebar.tsx:283 → /ajuda (sem app/ajuda/page.tsx)

Total: 15 problemas. Exit 1.
```

---

## 5. `validar-nrs.js`

**O que faz:** garante que NRs apareçam em ordem numérica e regras em ordem
alfabética em todos os pontos onde são exibidas.

**Spec:**
- Lê `fixedNrRules` (em `lib/normativeRules.ts`).
- Verifica que IDs estão no formato `nr-XX-NN`.
- Verifica que NRs estão sequenciais (sem buracos não intencionais).
- Confirma que `NR_MATRIX` cobre toda NR presente em regras/checklists.
- Verifica que `getTodasRegrasAtivas` realmente devolve ordenado (rodando a
  função e validando).
- Detecta NRs referenciadas em código mas ausentes em `NR_MATRIX`.

**Output:**
```
✓ fixedNrRules: 90 regras, todas em ordem
✓ NR_MATRIX: 24 NRs cobertas
✗ NR-99 referenciada em app/operacao/riscos/page.tsx:312 mas ausente em NR_MATRIX

Total: 1 problema. Exit 1.
```

---

## 6. `validar-evidencias.js`

**O que faz:** lista ações que deveriam ter evidência mas não têm.

**Spec:**
- Carrega snapshot de `localStorage app-storage` (ou arquivo JSON de teste).
- Para cada ação com `status === "Concluída"`:
  - Se `actionRequiresEvidence(acao) === true` e `acao.evidencia.length === 0` →
    flag de violação.
- Para cada ação `Em andamento` com `criticidade: Crítica` e prazo vencido sem
  evidência → flag.

**Output:**
```
AÇÕES CONCLUÍDAS SEM EVIDÊNCIA (3):
  act-risk-ins-007-q2 → "Mitigação: Rotas de fuga desobstruídas"
  act-risk-ins-012-q5 → "Mitigação: EPI obrigatório ausente"
  act-risk-ins-019-q1 → "Mitigação: Máquina sem proteção adequada"

AÇÕES CRÍTICAS VENCIDAS SEM EVIDÊNCIA (1):
  act-risk-ins-022-q3 → vence em 2026-05-10 (1d atrás)

Total: 4 problemas. Exit 1.
```

---

## Comandos extras úteis (V2)

| Comando | Função |
| --- | --- |
| `validate:store` | Verifica integridade do `localStorage app-storage` (schema migrações). |
| `validate:i18n` | Detecta strings em PT misturadas com EN em campos críticos. |
| `validate:types` | Roda `tsc --noEmit` e devolve erros agrupados por camada. |
| `migrate:store` | Aplica migrações de schema quando os tipos mudam. |
| `seed:demo` | Popula localStorage com dados de demo realistas (tira o filtro `seed_demo`). |
| `report:audit` | Gera `ARCHITECTURE.md` automaticamente (re-roda inventário). |
| `report:coverage` | % de NRs com checklist + regras vs total. |

---

## Princípios das CLIs

1. **Sem dependência do Next.** Rodam em Node puro, sem subir o app.
2. **Sem efeitos colaterais.** Só leem o sistema de arquivos / localStorage de teste.
3. **Exit code coerente.** `0` = limpo, `1` = encontrou problema. Pra CI.
4. **Saída legível e parseável.** Texto humano + bloco JSON opcional com `--json`.
5. **Modular.** Cada validação em um arquivo. Composição via `npm run validate`.
6. **Documentadas no `--help`.** Toda CLI responde `--help` listando opções.

---

## Integração com CI/CD (V2)

```yaml
# .github/workflows/validate.yml
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run validate
      - run: npm run lint
      - run: npm run build
```

PR só passa se todas as CLIs saírem com exit 0.
