# ApexShield SST Inteligência — Visão do Produto

## O que é

Plataforma SaaS de **Saúde e Segurança do Trabalho** que transforma inspeções de campo
em ação proativa. O usuário responde checklists, o motor inteligente detecta riscos,
gera ações corretivas, calcula prazos legais (NR-28) e mantém o PGR vivo — sem o
operador precisar pensar em "qual NR" ou "qual prazo".

## Proposta de valor

> **"A primeira plataforma de SST onde a regra normativa é o motor, não um anexo PDF."**

Três promessas concretas pro cliente:

1. **Conformidade automática.** Cada item de checklist já carrega NR, criticidade,
   prazo e ação sugerida. Quando o auditor marca "Não", o sistema já gera o risco e
   a ação corretiva com prazo legal embutido.
2. **Pessoa no centro.** Toda inspeção/risco/ação carrega *trabalhadores expostos* e
   *perfil exposto*. O painel não é "5 riscos críticos", é "**42 vidas** expostas a
   5 riscos críticos".
3. **Defesa documental.** Cada ação concluída exige evidência (foto/anexo). O sistema
   monta automaticamente o histórico para auditoria do MTE.

## Fluxo principal

```
Inspeção agendada
    │
    ▼
Auditor executa checklist (mobile/web)
    │
    ▼
Resposta "Não" / "Parcialmente"
    │
    ▼
Motor detecta Não Conformidade
    │
    ├──► Gera Risco (com NR, criticidade, pacote)
    │       │
    │       └──► Gera Ação corretiva (com prazo, responsável, exigência de evidência)
    │
    ▼
Operador executa a ação no campo → anexa evidência
    │
    ▼
Validador aprova → Risco vira "Mitigado" → Ação vira "Concluída"
    │
    ▼
Dashboard atualiza score / multa evitada / PGR vivo
```

Detalhe técnico em [`FLUXO-OPERACIONAL.md`](FLUXO-OPERACIONAL.md).

## Módulos do sistema

### Existentes (renderizados no Sidebar)

| Módulo | Rota | Função |
| --- | --- | --- |
| Dashboard | `/` | KPIs operacionais, score, multa evitada/estimada |
| Operação > Inspeções | `/operacao/inspecoes` | Planejar, iniciar, executar inspeções |
| Operação > Riscos | `/operacao/riscos` | Cadastro manual + visualização de riscos auto-gerados |
| Operação > Ações | `/operacao/acoes` | Kanban de ações corretivas |
| Operação > Matriz | `/operacao/matriz` | Matriz de aplicabilidade NR × segmento |
| Inteligência > Visão Geral | `/central` | Atualmente espelha o Dashboard |
| Inteligência > Motor | `/central/motor` | Transparência da memória de cálculo NR-28 |
| Relatórios | `/relatorios` | Relatórios executivos |
| Organização | `/organizacao` | Empresa, usuários, setores, plano |
| Configurações | `/configuracoes` | Regras, SLAs, alertas, indicadores |
| L.A.R.I (chat) | `/chat` | Copiloto SST baseado em Gemini |
| Perfil | `/perfil` | Dados do usuário logado |

### Existentes mas órfãos

- **Incidentes** (`/operacao/incidentes`) — página construída, sem entrada no Sidebar.
- **Central** (`/central`) — re-exporta o Dashboard. Conceitualmente deveria ser uma
  visão diferente (executiva/agregada).

### A construir (escopo do roadmap)

- **PGR Vivo** — documento dinâmico que se atualiza a cada inspeção.
- **Maturidade SST** — score de evolução do programa ao longo do tempo.
- **Reincidência** — tracking de risco que volta após mitigação.

## V1 — Escopo do MVP atual

Tudo abaixo já existe ou está parcialmente entregue:

- Cadastro completo de **organização, setores, usuários**.
- **Pacotes de regras** ativáveis (Base SST, Indústria, Construção, Saúde).
- **90 regras fixas NR** (NR-01, 06, 07, 10, 11, 12, 17, 18, 20, 23, 26, 33, 35).
- **Checklists como motor de risco** — cada item carrega 8 campos
  (pergunta, NR, pacote, criticidade, ação sugerida, exige evidência, gera risco, prazo).
- **Motor automático** — inspeção NC → risco → ação, em cascata, com SLA por
  criticidade (24h / 72h / 7d / 30d).
- **Estimativa NR-28** (`lib/fineEngine.ts`) — faixa de multa por NR × porte × infração.
- **Dashboard** com score operacional, riscos críticos, ações vencidas, multa evitada.
- **L.A.R.I (Gemini)** — chat conversacional com contexto real do estado.
- **Persistência local** via Zustand + localStorage.

## V2 — Próximo ciclo

- **Supabase** — auth real + sincronia multi-usuário + histórico permanente.
- **PGR Vivo** — geração + versionamento automático.
- **Maturidade SST** — score evolutivo (180-day rolling).
- **Reincidência** — cálculo formal + alerta quando risco volta no mesmo setor.
- **Mobile app** — execução offline-first de inspeções.
- **Anexos reais** — upload de fotos via Supabase Storage ou Google Drive.
- **Notificações** — WhatsApp/e-mail por SLA estourado.

## V3 — Visão de longo prazo

- **Inteligência preditiva** — modelo que antecipa incidente baseado em padrão
  setor × atividade × condição.
- **Integrações** — eSocial, ASO, prontuário ocupacional.
- **Marketplace de checklists** — operadoras podem publicar/comprar checklists
  customizados.
- **API pública** — terceiros consomem riscos/ações via REST.

## O que NÃO fazer agora

Decisões explícitas pra manter foco no V1:

- **Não construir backend** antes de validar fluxo no localStorage.
- **Não criar mobile nativo** — mobile web responsivo já é suficiente pro MVP.
- **Não integrar eSocial** — escopo de V3.
- **Não permitir customização total de checklist** pelo cliente — as 90 regras fixas
  são o diferencial. Cliente edita só o pacote customizado.
- **Não fazer multi-tenant verdadeiro** — uma organização por instância no V1.
- **Não vender por NR avulsa** — venda é por pacote (Base + setoriais).
- **Não substituir o consultor SST humano** — somos copiloto, não substituto.
- **Não automatizar conclusão de ação sem evidência** — quebra a tese de defesa
  documental.

## Para onde olhar no código

- Motor: [`lib/engines.ts`](../lib/engines.ts), [`lib/store.ts`](../lib/store.ts)
- Regras NR: [`lib/normativeRules.ts`](../lib/normativeRules.ts)
- Checklists vivos: [`lib/normativeChecklists.ts`](../lib/normativeChecklists.ts)
- Cálculo NR-28: [`lib/fineEngine.ts`](../lib/fineEngine.ts)
- Inventário completo: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
