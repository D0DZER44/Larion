import { NR_CATALOG } from "./nrCatalog.js";
import { getSectorsByPackage } from "./nrSegments.js";

export const NR_PACKAGES = [
  {
    id: "Base SST",
    nome: "Base SST",
    descricao: "Base normativa obrigatoria para qualquer operacao SST.",
    nrs: ["NR-01", "NR-06", "NR-17", "NR-23", "NR-26"],
    segmentIds: ["Base SST"],
    locked: true,
    alwaysActive: true,
  },
  {
    id: "Construcao Civil",
    nome: "Construcao Civil",
    descricao: "Pacote voltado para obra, altura, escavacao e protecoes coletivas.",
    nrs: ["NR-01", "NR-06", "NR-10", "NR-11", "NR-18", "NR-23", "NR-26", "NR-33", "NR-35"],
    segmentIds: ["Construcao Civil"],
    locked: false,
    alwaysActive: false,
  },
  {
    id: "Industria",
    nome: "Industria",
    descricao: "Pacote para manufatura, manutencao, maquinas, quimicos e eletricidade industrial.",
    nrs: ["NR-01", "NR-06", "NR-10", "NR-12", "NR-17", "NR-20", "NR-23", "NR-26", "NR-33", "NR-35"],
    segmentIds: ["Industria"],
    locked: false,
    alwaysActive: false,
  },
  {
    id: "Saude/Hospitalar",
    nome: "Saude/Hospitalar",
    descricao: "Pacote para servicos assistenciais, biologicos e higienizacao em saude.",
    nrs: ["NR-01", "NR-06", "NR-07", "NR-17", "NR-23", "NR-26", "NR-32", "NR-33"],
    segmentIds: ["Saude/Hospitalar"],
    locked: false,
    alwaysActive: false,
  },
  {
    id: "Logistica",
    nome: "Logistica",
    descricao: "Pacote para movimentacao, armazenagem, docas e frota interna.",
    nrs: ["NR-01", "NR-06", "NR-11", "NR-17", "NR-20", "NR-23", "NR-26", "NR-35"],
    segmentIds: ["Logistica"],
    locked: false,
    alwaysActive: false,
  },
  {
    id: "Portuario",
    nome: "Portuario",
    descricao: "Pacote para cais, patios portuarios, carga pesada e riscos maritimos.",
    nrs: ["NR-01", "NR-06", "NR-10", "NR-11", "NR-20", "NR-23", "NR-26", "NR-29", "NR-33", "NR-35"],
    segmentIds: ["Portuario"],
    locked: false,
    alwaysActive: false,
  },
  {
    id: "Escritorio/Administrativo",
    nome: "Escritorio/Administrativo",
    descricao: "Pacote para rotina administrativa, ergonomia e prontidao basica.",
    nrs: ["NR-01", "NR-17", "NR-23", "NR-26"],
    segmentIds: ["Escritorio/Administrativo"],
    locked: false,
    alwaysActive: false,
  },
];

export const NR_PACKAGES_BY_ID = NR_PACKAGES.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveRulePackages(config) {
  if (!config) return [];
  if (Array.isArray(config.rulePackages)) return config.rulePackages;
  if (Array.isArray(config.packages)) return config.packages;
  return [];
}

function isPackageActiveInConfig(packageId, config) {
  const normalizedPackageId = normalizeValue(packageId);
  const packageConfig = resolveRulePackages(config).find(
    (item) => normalizeValue(item?.id) === normalizedPackageId || normalizeValue(item?.name) === normalizedPackageId,
  );
  if (!packageConfig) {
    return normalizedPackageId === normalizeValue("Base SST");
  }
  if (typeof packageConfig.isActive === "boolean") return packageConfig.isActive || normalizedPackageId === normalizeValue("Base SST");
  if (typeof packageConfig.active === "boolean") return packageConfig.active || normalizedPackageId === normalizeValue("Base SST");
  return normalizedPackageId === normalizeValue("Base SST");
}

function inferKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  return [String(value).toLowerCase()];
}

export function findPackageById(id) {
  const normalized = normalizeValue(id);
  return NR_PACKAGES.find((item) => normalizeValue(item.id) === normalized || normalizeValue(item.nome) === normalized);
}

export function listNRsInPackage(id) {
  const selected = findPackageById(id);
  if (!selected) return [];
  const allowed = new Set(selected.nrs);
  return NR_CATALOG.filter((item) => allowed.has(item.codigo));
}

export function findPackageOfNR(code) {
  const catalogItem = NR_CATALOG.find((item) => item.codigo === code);
  if (catalogItem) return findPackageById(catalogItem.pacote);
  return NR_PACKAGES.find((item) => item.nrs.includes(code));
}

export function getActivePackages(config = {}) {
  return NR_PACKAGES.filter((item) => item.alwaysActive || isPackageActiveInConfig(item.id, config));
}

export function getRecommendedPackages(companyProfile = {}) {
  const keywords = [
    ...inferKeywords(companyProfile.segmento),
    ...inferKeywords(companyProfile.segment),
    ...inferKeywords(companyProfile.industry),
    ...inferKeywords(companyProfile.setores),
    ...inferKeywords(companyProfile.sectors),
    ...inferKeywords(companyProfile.atividades),
    ...inferKeywords(companyProfile.activities),
    ...inferKeywords(companyProfile.cnae),
  ];

  const recommendations = new Set(["Base SST"]);

  keywords.forEach((keyword) => {
    if (keyword.includes("obra") || keyword.includes("canteiro") || keyword.includes("constr")) recommendations.add("Construcao Civil");
    if (keyword.includes("fabrica") || keyword.includes("industr") || keyword.includes("manutencao") || keyword.includes("maquina")) recommendations.add("Industria");
    if (keyword.includes("hospital") || keyword.includes("clinica") || keyword.includes("saude") || keyword.includes("biolog")) recommendations.add("Saude/Hospitalar");
    if (keyword.includes("logistica") || keyword.includes("armazen") || keyword.includes("empilhadeira") || keyword.includes("doca")) recommendations.add("Logistica");
    if (keyword.includes("porto") || keyword.includes("cais") || keyword.includes("container") || keyword.includes("embarc")) recommendations.add("Portuario");
    if (keyword.includes("escritorio") || keyword.includes("administr")) recommendations.add("Escritorio/Administrativo");
  });

  return NR_PACKAGES.filter((item) => recommendations.has(item.id));
}

export function canDeactivatePackage(packageId) {
  const selected = findPackageById(packageId);
  if (!selected) return false;
  return !selected.locked && !selected.alwaysActive;
}

export function activatePackage(packageId, config = {}) {
  const selected = findPackageById(packageId);
  if (!selected) return config;

  const nextPackages = [...resolveRulePackages(config)];
  const normalizedPackageId = normalizeValue(packageId);
  const existingIndex = nextPackages.findIndex(
    (item) => normalizeValue(item?.id) === normalizedPackageId || normalizeValue(item?.name) === normalizedPackageId,
  );

  if (existingIndex >= 0) {
    nextPackages[existingIndex] = {
      ...nextPackages[existingIndex],
      id: selected.id,
      name: selected.id,
      isActive: true,
    };
  } else {
    nextPackages.push({
      id: selected.id,
      name: selected.id,
      isActive: true,
    });
  }

  if (!nextPackages.some((item) => item?.id === "Base SST" || item?.name === "Base SST")) {
    nextPackages.unshift({ id: "Base SST", name: "Base SST", isActive: true });
  }

  return {
    ...config,
    rulePackages: nextPackages,
  };
}

export function deactivatePackage(packageId, config = {}) {
  if (!canDeactivatePackage(packageId)) return activatePackage("Base SST", config);

  const nextPackages = [...resolveRulePackages(config)];
  const normalizedPackageId = normalizeValue(packageId);
  const existingIndex = nextPackages.findIndex(
    (item) => normalizeValue(item?.id) === normalizedPackageId || normalizeValue(item?.name) === normalizedPackageId,
  );

  if (existingIndex >= 0) {
    nextPackages[existingIndex] = {
      ...nextPackages[existingIndex],
      id: packageId,
      name: packageId,
      isActive: false,
    };
  } else {
    nextPackages.push({
      id: packageId,
      name: packageId,
      isActive: false,
    });
  }

  if (!nextPackages.some((item) => (item?.id === "Base SST" || item?.name === "Base SST") && item?.isActive !== false)) {
    nextPackages.unshift({ id: "Base SST", name: "Base SST", isActive: true });
  }

  return {
    ...config,
    rulePackages: nextPackages,
  };
}

export { getSectorsByPackage };
