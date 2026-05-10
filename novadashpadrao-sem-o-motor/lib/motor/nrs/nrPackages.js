import { NR_CATALOG } from "./nrCatalog.js";

export const NR_PACKAGES = [
  { id: "Base SST", nome: "Base SST", nrs: ["NR-01", "NR-06", "NR-17", "NR-23", "NR-26"] },
  { id: "Construção Civil", nome: "Construção Civil", nrs: ["NR-18", "NR-35"] },
  { id: "Indústria", nome: "Indústria", nrs: ["NR-10", "NR-12", "NR-20", "NR-33"] },
  { id: "Logística", nome: "Logística", nrs: ["NR-11"] },
  { id: "Saúde", nome: "Saúde", nrs: ["NR-07"] },
];

export const NR_PACKAGES_BY_ID = NR_PACKAGES.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export function findPackageById(id) {
  return NR_PACKAGES_BY_ID[id];
}

export function listNRsInPackage(id) {
  const selected = findPackageById(id);
  if (!selected) return [];
  const allowed = new Set(selected.nrs);
  return NR_CATALOG.filter((item) => allowed.has(item.codigo));
}

export function findPackageOfNR(code) {
  return NR_PACKAGES.find((item) => item.nrs.includes(code));
}
