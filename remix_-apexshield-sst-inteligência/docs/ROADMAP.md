# Roadmap

> Visão de longo prazo dividida em três versões. Cada versão tem **escopo fixo**
> (não muda) e **tema central** (o problema principal que resolve).
>
> Status hoje: **V1 em finalização.**

---

## V1 — MVP funcional (em curso)

**Tema:** "O motor normativo prova que funciona."

**Persona:** Engenheiro de Segurança / Técnico SST em PME industrial.

**Promessa:** "Cadastre sua organização, ative os pacotes, execute a primeira
inspeção. O sistema vai gerar riscos, ações e o painel sozinho — sem você precisar
saber qual NR aplicar."

### Já entregue

- ✅ Cadastro completo de organização, setores, usuários, plano (mock).
- ✅ Pacotes de regras: **Base SST** (obrigatório), **Indústria**, **Construção**,
  **Saúde**.
- ✅ **90 regras fixas NR** (NR-01, 06, 07, 10, 11, 12, 17, 18, 20, 23, 26, 33, 35).
- ✅ Checklists vivos — cada item carrega 8 campos do motor.
- ✅ Inspeções com 5 estados (Hoje / Agendada / Em andamento / Atrasada / Concluída)
  e CTA principal "Iniciar inspeção".
- ✅ Riscos auto-gerados por NC.
- ✅ Ações auto-geradas por risco crítico/alto.
- ✅ SLA por criticidade (24h / 72h / 7d / 30d).
- ✅ Cálculo NR-28 — faixa de multa por NR × porte.
- ✅ Dashboard com score operacional, multa evitada/estimada, exposição humana.
- ✅ Matriz de aplicabilidade NR × Segmento × Atividade.
- ✅ Página de transparência do motor (`/central/motor`).
- ✅ L.A.R.I (chat Gemini com contexto real do estado).
- ✅ Persistência em Zustand + localStorage.

### Falta pra fechar o V1

- 🟡 Limpeza arquitetural pendente (ver `ARCHITECTURE.md` — store paralela morta,
  imports órfãos, rotas quebradas, helpers duplicados).
- 🟡 Padronizar tipos com sinônimos (Concluída/Concluído/Fechada → um só).
- 🟡 Documentar fluxos completos em `/docs` (este pacote).
- 🟡 Página de Incidentes — existe sem entrada no Sidebar; decidir se publica ou
  arquiva.
- 🟡 `/central` deixar de ser duplicata do `/`. Decidir conteúdo único.
- 🟡 Página `/ajuda` (linkada no Sidebar mas não existe).
- 🟡 CLI de validação básica (`validar-mocks.js`, `validar-orfaos.js`).

### Não fazer no V1

- ❌ Supabase / backend real.
- ❌ Upload real de evidência.
- ❌ Notificações por WhatsApp/e-mail.
- ❌ PGR Vivo.
- ❌ Maturidade SST.
- ❌ Mobile nativo.
- ❌ Customização total de checklist pelo cliente.
- ❌ Multi-tenant verdadeiro.

---

## V2 — Produto vendável (próximo ciclo)

**Tema:** "Os dados saem do navegador e viram serviço corporativo."

**Persona:** Diretor de Operações + Engenheiro Sênior SST em empresa de médio porte.

**Promessa:** "Toda sua equipe SST trabalha junta, em tempo real, com histórico
permanente. Quando o auditor MTE chegar, o PGR Vivo prova a evolução do programa."

### Escopo

- 🎯 **Supabase** — persistência real, auth, multi-tenant, realtime.
- 🎯 **PGR Vivo** — geração automática, versionamento, exportação PDF/A.
- 🎯 **Maturidade SST** — score evolutivo rolling 180 dias.
- 🎯 **Reincidência formal** — detecção + penalidade em multa + alerta.
- 🎯 **Upload real de evidências** — Supabase Storage ou Google Drive + hash
  SHA-256.
- 🎯 **E-mail** — digest semanal, PGR publicado, convite de usuário.
- 🎯 **WhatsApp** — risco crítico, ação atribuída, escalonamento de SLA.
- 🎯 **Mobile web responsivo** — execução de inspeção otimizada pra celular
  com modo offline (PWA com IndexedDB + sync).
- 🎯 **Relatórios exportáveis** — PDF + Excel agendados.
- 🎯 **Permissões granulares** — papéis (Admin / Gestor / Auditor / Operário).
- 🎯 **Logs de auditoria** completos (quem fez o quê e quando, imutável).
- 🎯 **CLIs de validação** completas (mocks, regras, dashboard, órfãos, NRs,
  evidências).

### Reorganização arquitetural

- Migrar regras espalhadas pra `src/skills/`, `src/motor/`, `src/apis/`,
  `src/mcps/`.
- Quebrar `lib/engines.ts` (9 objetos) em arquivos por skill.
- Mover `processAutoActions` do store pra `src/skills/`.
- Unificar tipos PT/EN, status com sinônimos, helpers de NR.
- Apagar código morto identificado em `ARCHITECTURE.md`.

### Métricas de sucesso do V2

- 100% das ações concluídas têm evidência válida.
- < 5% de inspeções vencidas sem follow-up.
- PGR sempre < 30 dias da última geração.
- Tempo médio até primeira ação concluída < 48h.

---

## V3 — Plataforma (visão de longo prazo)

**Tema:** "Apex Ops vira ecossistema."

**Persona:** Diretor SST / CFO + parceiros do ecossistema (consultores, marketplace).

**Promessa:** "Não é uma ferramenta SST. É a infraestrutura de SST que conecta sua
empresa ao MTE, aos consultores certificados, ao mercado de checklists e à
inteligência preditiva."

### Escopo

- 🚀 **Inteligência preditiva** — modelo (regressão / árvore) que estima
  probabilidade de incidente por setor × atividade × condição.
- 🚀 **eSocial** — envio automático de eventos S-2240 / S-2210.
- 🚀 **Mobile app nativo** (iOS/Android) — câmera com geolocalização, sync offline
  robusto, push notification.
- 🚀 **Marketplace de checklists** — operadoras publicam, outras empresas compram.
  Receita compartilhada.
- 🚀 **API pública REST + Webhooks** — terceiros consomem riscos/ações/relatórios
  via OpenAPI documentado.
- 🚀 **CIPA + SESMT digitalizado** — agenda de reuniões, eleição online, atas
  digitais.
- 🚀 **SSO corporativo** — Azure AD, Google Workspace, Okta.
- 🚀 **Integrações nativas** — Power BI / Looker / Tableau via OData.
- 🚀 **Slack / Teams** — canais de alerta + comandos slash.
- 🚀 **Treinamento gerado** — baseado em NCs recorrentes, gera matriz de
  treinamento sugerida.
- 🚀 **Recomendação de EPI** — cruza atividade × NR × histórico do colaborador.
- 🚀 **Auditoria automatizada** — bot que simula fiscalização e dá relatório de
  prontidão.

### Modelo de negócio expandido

- SaaS por funcionário/mês (modelo atual).
- Marketplace — comissão sobre checklists vendidos.
- API — tier pago por consumo.
- Consultoria certificada — match com parceiros.

### Métricas de sucesso do V3

- > 80% dos clientes integrados via eSocial.
- > 30% dos checklists novos vêm do marketplace.
- Indicador preditivo com precisão > 70%.

---

## Princípios do roadmap

1. **Não pular versão.** V1 não fecha = V2 não começa.
2. **Não vender V2 pra cliente V1.** Cada cliente vê só o que foi entregue.
3. **Cada feature precisa de razão clara.** "Cliente pediu" não basta — tem que
   resolver a promessa central da versão.
4. **Performance > recursos.** Se uma feature degrada o tempo de geração de risco,
   é negociada.
5. **Compliance NR-28 / LGPD sempre.** Nenhuma feature passa sem checagem legal.
6. **Documentação obrigatória.** Toda nova feature atualiza `/docs`.
