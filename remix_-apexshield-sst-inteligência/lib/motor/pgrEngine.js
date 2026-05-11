/**
 * pgrEngine
 * ---------
 * Motor do **PGR Vivo** (Programa de Gerenciamento de Riscos dinâmico).
 *
 * STATUS: stub. A geração/versionamento do PGR é escopo de V2
 * (ver /docs/MOTOR.md §9 e /docs/ROADMAP.md). Esta API existe pra:
 *   1) reservar o ponto de entrada estável (`@/lib/motor/pgrEngine`).
 *   2) permitir compor dashboards mostrando "última versão do PGR".
 *   3) deixar pronto o gatilho que marca o PGR como "desatualizado".
 *
 * Nada aqui escreve no store hoje — só leitura defensiva.
 */

/**
 * Estados do PGR Vivo.
 * @typedef {'rascunho' | 'vigente' | 'arquivado' | 'desatualizado'} StatusPGR
 */

/**
 * Snapshot do PGR (formato planejado).
 * @typedef {Object} PGRVersao
 * @property {string} id
 * @property {string} versao
 * @property {string} geradoEm
 * @property {string} geradoPor
 * @property {number} riscosControlados
 * @property {number} riscosEmTratamento
 * @property {number} acoesPendentes
 * @property {string} [hashIntegridade]
 * @property {string} [pdfUrl]
 * @property {StatusPGR} status
 */

/**
 * Decide se o PGR vigente está "desatualizado" baseado em riscos abertos.
 * Critério provisório: existe risco Crítico/Alto criado depois da última versão.
 *
 * @param {{ riscos?: Array<{ nivel?: string, criadoEm?: string, status?: string }>, ultimaVersao?: PGRVersao | null }} input
 * @returns {boolean}
 */
export function pgrPrecisaAtualizar(input) {
  const ultima = input?.ultimaVersao;
  if (!ultima) return Array.isArray(input?.riscos) && input.riscos.length > 0;
  const corte = new Date(ultima.geradoEm).getTime();
  if (Number.isNaN(corte)) return true;
  return (input?.riscos || []).some(r => {
    const nivel = String(r?.nivel || '').toLowerCase();
    if (nivel !== 'crítico' && nivel !== 'critico' && nivel !== 'alto') return false;
    if (r?.status === 'Mitigado' || r?.status === 'Resolvido') return false;
    const t = new Date(r?.criadoEm || 0).getTime();
    return !Number.isNaN(t) && t > corte;
  });
}

/**
 * Monta um snapshot mínimo a partir do estado atual.
 * **NÃO persiste.** Apenas estrutura o payload — persistência será adicionada no V2
 * com versionamento, hash e PDF/A.
 *
 * @param {{
 *   organizacao?: object,
 *   riscos?: Array<object>,
 *   acoes?: Array<object>,
 *   usuario?: string,
 * }} state
 * @returns {PGRVersao}
 */
export function snapshotPGR(state) {
  const riscos = Array.isArray(state?.riscos) ? state.riscos : [];
  const acoes = Array.isArray(state?.acoes) ? state.acoes : [];
  const controlados = riscos.filter(r => r?.status === 'Mitigado' || r?.status === 'Resolvido').length;
  const emTratamento = riscos.filter(r => r?.status !== 'Mitigado' && r?.status !== 'Resolvido').length;
  const pendentes = acoes.filter(a => a?.status !== 'Concluída' && a?.status !== 'Cancelada').length;
  const agora = new Date();
  const versao = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}.draft`;

  return {
    id: `pgr-${agora.getTime()}`,
    versao,
    geradoEm: agora.toISOString(),
    geradoPor: state?.usuario || 'Sistema',
    riscosControlados: controlados,
    riscosEmTratamento: emTratamento,
    acoesPendentes: pendentes,
    status: 'rascunho',
  };
}

/**
 * Quando a regra de pgrPrecisaAtualizar bater, o adapter de PGR pode chamar
 * este helper para gerar payload de alerta. O motor de alertas aceita objetos
 * com `severity` e `link`.
 *
 * @returns {{ type: 'pgr_desatualizado', title: string, severity: 'Alto' }}
 */
export function alertaPgrDesatualizado() {
  return {
    type: 'pgr_desatualizado',
    title: 'PGR Vivo desatualizado — revisar e republicar',
    severity: 'Alto',
  };
}
