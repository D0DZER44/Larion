// @ts-nocheck

import { buildNrMatrix, getApplicableNrMatrix } from "./motor/bridge";

export const NR_MATRIX = buildNrMatrix();

export function getNRsAplicaveis(params = {}) {
  return getApplicableNrMatrix(params);
}
