# ADR 011 — SST Focado, não EHS Completo

**Status:** Aceita
**Data:** 2026-05-11
**Decisores:** Founder + Time de produto
**Relacionada:** ADR 008

---

## Contexto

EHS é uma categoria estabelecida (Environment + Health + Safety) com
players grandes:

- EHS Insight, EcoOnline, Cority, Intelex, Ecesis, Quentic — todos cobrem
  módulos de **environmental compliance**, **carbono / emissões**,
  **sustainability**, **occupational health**, **occupational safety**,
  **industrial hygiene**, **incident management**, **contractor management**,
  **chemical/MSDS management**, **training**, **audits**, e mais.

O mercado EHS existe e paga (USD 30k–200k/ano por organização). Mas há
duas verdades dolorosas pra um novo entrante:

1. **EHS completo é caro de construir.** São 40+ módulos. Levaria
   anos para cobrir todos.
2. **EHS completo é caro de vender.** Cliente PME brasileiro não compra
   plataforma genérica de USD 50k/ano. Compra ferramenta que **resolve
   meu problema específico de SST** com ROI claro.

Conclusão: tentar competir como "EHS completo" é suicídio.

---

## Decisão

**ApexOps SST cobre Saúde e Segurança do Trabalho com profundidade.
Não cobre Environmental, ESG nem carbono.**

### O que está dentro do escopo

- **Inspeções operacionais.** NR-aware (90 regras fixas hoje).
- **Riscos ocupacionais.** Físicos, químicos, biológicos, ergonômicos,
  acidentes.
- **Ações corretivas.** Com SLA, evidência, validação.
- **EPI.** Cadastro, controle, validade de CA. (V1 parcial → V2 completo)
- **PGR Vivo.** Documento vivo de gerenciamento de riscos. (V2)
- **PCMSO.** Programa de controle médico ocupacional. (V2/V3 — espelhamento
  de ASO, exames periódicos)
- **Treinamentos NR.** Cadastro + validade + matriz. (V2)
- **CIPA.** Comissão, reuniões, eleição online. (V3)
- **Acidentes e incidentes.** Comunicação CAT, near-miss. (V2)
- **Maturidade SST.** Score evolutivo. (V2)
- **eSocial.** Envio S-2240 + S-2210. (V3)

### O que **não está** no escopo (e por quê)

- **Carbon accounting / emissões.** Categoria à parte (Carbonyte, Persefoni).
- **Environmental compliance** (água, resíduos, ar). Mercado MEIO ambiente,
  não SST.
- **ESG reporting.** Categoria à parte (Watershed, Sweep).
- **Sustainability strategy.** Categoria à parte (consultoria de
  sustentabilidade).
- **Quality management.** Categoria à parte (QMS — ISO 9001).
- **Asset management / EAM.** Categoria à parte (Fiix, Maintainx).
- **MSDS / chemical inventory.** Compliance químico — escopo maior, V3+
  se vier.
- **Contractor management completo** (RAV / pré-qualificação financeira).
  V3+ se vier.

---

## Consequências

### Positivas

- Mensagem clara no marketing: "Software de SST. Não é EHS, não é ESG, não
  é quality. É SST."
- Sales cycle mais curto. Comprador entende em 2 minutos o que o produto
  faz.
- Profundidade vira diferencial. 90 regras NR é mais NR do que qualquer
  EHS internacional tem.
- Time de produto consegue mover. Não há "deve fazer carbono no V2?" pra
  decidir.

### Negativas

- Perdemos clientes que querem "tudo num lugar só". Tudo bem — não somos
  pra eles.
- Risco de parecer "limitado" pra comprador grande. Mitigação: ADR-008
  (benchmark-driven) + posicionamento como ferramenta de **execução**, não
  de **reporting corporativo**.
- Cliente que cresce e quer ESG depois vai migrar. Aceitável — virou outra
  categoria de produto.

### Neutras

- Estabelece um corte limpo entre "feature dentro do escopo" e "feature
  fora". Toda nova ideia passa pelo teste.

---

## Teste para feature nova

Antes de aprovar uma feature, perguntar:

1. **Tem NR ou regulamento MTE associado?** Se sim, provavelmente está
   dentro do escopo.
2. **Reduz risco de incidente / acidente de trabalho?** Se sim, dentro.
3. **É sobre meio ambiente / sustentabilidade / carbono?** Fora.
4. **É sobre qualidade de produto ou ativo físico?** Fora.
5. **É sobre processo de RH / cultura organizacional?** Fora (mesmo que
   relacionado a treinamento — treinamento NR específico está dentro).

---

## Exemplos práticos

| Pedido | Dentro? | Por quê |
| --- | --- | --- |
| Módulo de ASO + exames periódicos | Sim | PCMSO (NR-07) |
| Módulo de carbono escopo 1/2/3 | Não | Environmental, não SST |
| Inventário de produtos químicos com FISPQ | Sim, parcial V3 | NR-26 + comunicação de perigo |
| Auditoria de fornecedor ESG | Não | Sustentabilidade |
| Eleição online da CIPA | Sim V3 | NR-05 |
| Calculadora de pegada hídrica | Não | Environmental |
| Treinamento NR-35 (cadastro + validade) | Sim V2 | NR específica |
| LMS genérico (treinamento corporativo) | Não | RH/L&D |

---

## Validação

- **Métrica:** Nenhuma feature shippada que viole o teste acima. Auditoria
  anual.
- **Sinal positivo:** Em 12 meses, ouvimos clientes dizendo "ApexOps é o
  software de SST que eu queria — não é mais um EHS bagunçado".
- **Sinal negativo:** Se cliente pede e a gente cede em "só uma feature
  fora do escopo", abre porta. Mitigação: este ADR aplica-se em todos
  os reviews de feature.

---

## Referências

- `docs/BENCHMARKS.md` §4 (EHS Insight/EcoOnline).
- `docs/PRODUCT_STRATEGY.md` "O que ApexOps SST não é".
- `docs/ROADMAP.md` V1/V2/V3 — escopo versionado.
- ADR 008.
