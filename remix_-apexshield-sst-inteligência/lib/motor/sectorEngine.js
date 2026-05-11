/**
 * sectorEngine
 * ------------
 * Cálculos relacionados a setores: agrupamento, ranking de exposição,
 * setor mais crítico.
 *
 * Hoje a lógica de "setor mais crítico" vive embutida em
 * `LariContextEngine.getRealtimeContext` (lib/engines.ts) e em algumas
 * páginas. Este arquivo extrai os helpers como funções puras pra novo
 * código importar sem depender da função monolítica.
 */

/**
 * Calcula pontuação de criticidade de um setor a partir de uma lista de riscos.
 * Pesos: Crítico=3, Alto=2, Médio=1, Baixo=0.5
 *
 * @param {Array<{setor?: string, nivel?: string, level?: string}>} riscos
 * @returns {Record<string, number>}
 */
export function pontuarSetores(riscos) {
  if (!Array.isArray(riscos)) return {};
  const pontos = {};
  for (const r of riscos) {
    const setor = (r?.setor || 'Geral').trim() || 'Geral';
    const nivel = String(r?.nivel || r?.level || '').toLowerCase();
    let peso = 0.5;
    if (nivel === 'crítico' || nivel === 'critico') peso = 3;
    else if (nivel === 'alto') peso = 2;
    else if (nivel === 'médio' || nivel === 'medio') peso = 1;
    pontos[setor] = (pontos[setor] || 0) + peso;
  }
  return pontos;
}

/**
 * Devolve o setor com maior exposição (mais peso) ou 'Geral' se vazio.
 * Compatível com a lógica usada em `LariContextEngine.getRealtimeContext`.
 *
 * @param {Array<object>} riscos
 * @returns {string}
 */
export function setorMaisCritico(riscos) {
  const pontos = pontuarSetores(riscos);
  const entradas = Object.entries(pontos);
  if (entradas.length === 0) return 'Geral';
  entradas.sort((a, b) => b[1] - a[1]);
  return entradas[0][0];
}

/**
 * Ranking ordenado de setores, do mais exposto pro menos.
 *
 * @param {Array<object>} riscos
 * @returns {Array<{ setor: string, pontos: number }>}
 */
export function rankingSetores(riscos) {
  const pontos = pontuarSetores(riscos);
  return Object.entries(pontos)
    .sort((a, b) => b[1] - a[1])
    .map(([setor, pts]) => ({ setor, pontos: pts }));
}

/**
 * Quantos trabalhadores estão expostos no setor (soma `trabalhadoresExpostos`
 * dos riscos ativos do setor).
 *
 * @param {Array<{setor?: string, status?: string, trabalhadoresExpostos?: number}>} riscos
 * @param {string} setor
 * @returns {number}
 */
export function expostosPorSetor(riscos, setor) {
  if (!Array.isArray(riscos) || !setor) return 0;
  return riscos
    .filter(r =>
      r &&
      (r.setor || '').trim() === setor &&
      r.status !== 'Mitigado' &&
      r.status !== 'Resolvido'
    )
    .reduce((acc, r) => acc + (Number(r.trabalhadoresExpostos) || 0), 0);
}
