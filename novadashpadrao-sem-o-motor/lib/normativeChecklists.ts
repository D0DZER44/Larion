// @ts-nocheck

import { buildFixedNrChecklists } from "./motor/bridge";

export const fixedNrChecklists = buildFixedNrChecklists();

export function getTodosChecklistsAtivos(customChecklists = []) {
  const merged = [...fixedNrChecklists, ...(customChecklists || [])];
  const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values());

  return deduped.filter((item) => item.ativo !== false && item.status !== "Inativo");
}
