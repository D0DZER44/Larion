# Benchmarks Estratégicos

> Cinco produtos que nos ensinam — cada um por uma razão diferente. A regra é
> **copiar uma capacidade específica**, não tentar virar o produto inteiro.
> Matriz consolidada em `WHAT_TO_COPY_AND_AVOID.md`.

---

## 1. Linear (linear.app)

**O que é:** ferramenta de issue tracking para times de software. Conhecida
pela velocidade absurda da interface, atalhos de teclado, opinatividade.

### O que copiar

- **Velocidade.** Toda interação é instantânea. Sem spinners desnecessários,
  sem reloads. Aplicar: salvar inspeção, criar ação, mudar status — tudo < 100ms.
- **Triagem.** A inbox do Linear é a coluna mais importante. Cada item é
  pequeno, com prioridade clara (P0/P1/P2/P3). Aplicar: nossa "Operação"
  é uma inbox de pendências SST com mesma lógica.
- **Item enxuto.** Card do Linear tem 5 campos visíveis. O resto é colapsado.
  Aplicar: card de inspeção/risco/ação mostra apenas os 10 campos da R1, o
  resto fica no drawer.
- **Foco.** Linear não tenta ser Jira. É **issues + sprints + roadmap**, e
  para. Aplicar: ApexOps é **inspeção + risco + ação + evidência + PGR**,
  e para.

### O que evitar

- **Virar ferramenta só para tech.** Linear é lindo para devs — vocabulário
  ("issue", "sprint", "cycle") é técnico. Nosso usuário é técnico SST de
  fábrica, fala "inspeção", "risco", "ação corretiva". Não traduzir literal,
  traduzir o **comportamento**.

---

## 2. SafetyCulture (iAuditor)

**O que é:** maior plataforma global de checklists de inspeção. Forte em
mobile, fotos, geolocalização.

### O que copiar

- **Campo.** Otimização brutal pra celular. Auditor não tira o celular do
  bolso e o app já tá pronto. Aplicar: nossa inspeção mobile precisa ter
  CTA "Iniciar inspeção" alcançável com o polegar.
- **Checklist.** UX de responder pergunta é a melhor do mercado — Sim/Não/N-A
  + foto + nota. Aplicar: copiar a sequência de gesto (toque na resposta,
  toque na foto, próxima pergunta).
- **Foto.** Anexo de evidência é primeira classe, não escondido em formulário.
  Aplicar: botão "Foto" no mesmo nível do botão "Salvar" na ação.
- **Inspeção rápida.** Auditor pode rodar inspeção sem cadastrar nada
  antes — só responde. Aplicar: permitir "inspeção rápida" baseada em
  checklist + setor + responsável, sem outras burocracias.

### O que evitar

- **Virar só app de checklist.** SafetyCulture vende formulários. ApexOps
  vende **execução até a evidência**. Checklist é a porta de entrada, não o
  produto. Quem só quer checklist usa SafetyCulture; quem quer fazer o
  problema andar até virar evidência arquivada usa ApexOps.

---

## 3. ClickUp / Monday

**O que é:** ferramentas "construa seu fluxo de trabalho". Tudo é
customizável: status, campo, automação, visualização.

### O que copiar

- **Flexibilidade.** Filtros poderosos, agrupamentos, salvar views. Aplicar:
  permitir filtros por setor, NR, criticidade, responsável; salvar views
  ("Minhas ações desta semana", "Riscos abertos da NR-12").
- **Filtros.** Composição de filtros sem precisar criar fórmula. Aplicar:
  multi-select + range de data + busca de texto.
- **Automações.** "Quando X acontecer, faça Y". Aplicar: a base já existe
  (motor faz inspeção NC → risco → ação). Documentar isso ao usuário como
  automação configurável, mesmo sendo determinística.

### O que evitar

- **Virar ferramenta genérica.** ClickUp/Monday fracassam quando o cliente
  precisa "construir o sistema" antes de usar. Nosso cliente abre o app e
  já encontra Inspeção, Risco, Ação, Evidência prontos. Cliente não escolhe
  vocabulário, não cria status novo, não desenha workflow. **Opinatividade
  é o produto.**

---

## 4. EHS Insight / EcoOnline

**O que é:** plataformas EHS (Environment + Health + Safety) corporativas.
Cobertura ampla, mercado validado de SaaS B2B, processo lento.

### O que copiar

- **Mercado EHS validado.** Existem clientes pagantes (USD 30k–200k/ano)
  para softwares de EHS. Confirma que SST/EHS é categoria viável.
- **Ações.** Sistema de tasks corretivas com SLA é padrão da categoria.
  Aplicar: nosso módulo de Ações segue convenção do mercado (Pendente →
  Em andamento → Concluída).
- **Compliance.** Rastreabilidade até NR/OSHA/ISO é diferencial pago.
  Aplicar: cada risco/ação carrega `regraId` que aponta pra NR fixa.
- **Rastreabilidade.** Histórico imutável + relatórios pra fiscalização
  é tabela-base. Aplicar: nossa R8 e R21 (histórico imutável + hash).

### O que evitar

- **Tentar ser EHS completo.** EHS Insight tem 40+ módulos: emissões,
  carbono, sustentabilidade, treinamento, hazcom, MSDS, contractor
  management, audits, near misses, ergonomia, industrial hygiene...
  Nosso V1/V2 cobre **SST com profundidade**: inspeção, risco, ação,
  evidência, PGR, EPI, treinamento (V2). Não cobre environmental,
  carbono, ESG. Esse é o trade-off.

---

## 5. Ramp / Retool

**O que é:** Ramp = expense management; Retool = internal tools builder.
Diferentes produtos, mesma escola de copy/posicionamento: linguagem de
**valor operacional concreto**, não enterprise buzz.

### O que copiar

- **Linguagem de valor.** Ramp não diz "expense management platform". Diz
  "spend less time on expenses, more time growing". Aplicar: ApexOps não
  diz "SST compliance suite". Diz **"Nada crítico fica sem dono, prazo e
  evidência."**.
- **Eficiência.** Ramp vende "x horas economizadas / mês". Retool vende
  "construa em horas o que levava semanas". Aplicar: ApexOps vende
  "ação corretiva concluída em 48h, não em 30 dias".
- **Operação.** Ambos falam pra quem **opera** a área (CFO operacional,
  Eng de Software fazendo dashboard interno), não pra comprador de TI.
  Aplicar: nosso copy fala pro técnico SST que abre o app de manhã, não
  pro diretor que assina contrato.

### O que evitar

- **Ficar abstrato demais.** Ramp consegue ser concreto porque tem números
  fáceis (USD economizado). Retool consegue porque mostra a tela que
  construiu. Cuidado nosso: SST é abstrato por natureza — "risco gerenciado"
  é vago. **Concretizar sempre em vida humana protegida + multa evitada
  em R$.**

---

## Matriz consolidada

| Benchmark | Capacidade principal a copiar | Armadilha a evitar |
| --- | --- | --- |
| Linear | Velocidade + triagem em inbox | Linguagem só-tech |
| SafetyCulture | Mobile + foto + inspeção rápida | Virar formulário |
| ClickUp/Monday | Filtros + automação | Virar genérico |
| EHS Insight | Compliance + rastreabilidade | Virar 40-módulos |
| Ramp/Retool | Copy operacional concreto | Ficar abstrato |

---

## Como usar este documento

1. Toda decisão de UX/feature passa pela pergunta: **"Qual benchmark a gente
   tá copiando aqui e qual armadilha tá evitando?"**.
2. Quando um pedido de cliente cai numa "armadilha", a resposta é não.
3. Atualizações deste doc são raras — só quando entra um benchmark novo
   ou sai um.
4. Ver também: `WHAT_TO_COPY_AND_AVOID.md` (matriz com ações concretas) e
   `decisions/008-benchmark-driven-product.md` (ADR que oficializa esta
   escolha).
