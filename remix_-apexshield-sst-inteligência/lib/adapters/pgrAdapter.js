/**
 * pgrAdapter
 * ----------
 * Adapter do PGR Vivo. Hoje **não há entidade `pgr_versions` no store** —
 * este adapter expõe a API mínima (snapshot + flag de "desatualizado") usando
 * o estado atual.
 *
 * Quando o V2 chegar com tabela `pgr_versions` no Supabase, basta plugar
 * a persistência aqui sem mudar quem consome.
 */

import { useAppStore } from '../store';
import {
  pgrPrecisaAtualizar,
  snapshotPGR,
  alertaPgrDesatualizado,
} from '../motor/pgrEngine';

export { useAppStore, pgrPrecisaAtualizar, snapshotPGR, alertaPgrDesatualizado };

/**
 * Estado provisório de "última versão". V1 não persiste — retorna `null`.
 * V2 lerá de `state.pgr_versions[].find(v => v.status === 'vigente')`.
 *
 * @returns {object | null}
 */
export function ultimaVersaoPGR() {
  if (typeof window === 'undefined') return null;
  const st = useAppStore.getState();
  // @ts-ignore — pgr_versions ainda não existe oficialmente no schema do store.
  const versoes = Array.isArray(st.pgr_versions) ? st.pgr_versions : [];
  if (!versoes.length) return null;
  return versoes.find(v => v?.status === 'vigente') || versoes[versoes.length - 1];
}

/**
 * @returns {boolean}
 */
export function pgrDesatualizado() {
  if (typeof window === 'undefined') return false;
  return pgrPrecisaAtualizar({
    riscos: useAppStore.getState().riscos || [],
    ultimaVersao: ultimaVersaoPGR(),
  });
}

/**
 * Monta um rascunho do PGR a partir do estado atual. **Não persiste.**
 * @returns {object}
 */
export function gerarRascunho() {
  if (typeof window === 'undefined') {
    return snapshotPGR({});
  }
  const st = useAppStore.getState();
  return snapshotPGR({
    organizacao: st.organization,
    riscos: st.riscos || [],
    acoes: st.acoes || [],
    usuario: 'Sistema',
  });
}
