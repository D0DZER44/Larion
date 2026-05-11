import { normalizeInspection } from "../core/normalizeEngine.js";
import { generateNonConformitiesFromInspection, generateRisksFromNonConformities, generateActionsFromRisks } from "../engine/operationalEngine.js";
import { getHumanActivityLabel, mapHumanActivityToCode, synchronizeInspectionWithMotor } from "../bridge";
import { getActivePackages } from "../nrs/nrPackages.js";
import {
  ACTIVITY_TEMPLATES,
  SECTORS,
  getActivitiesBySector,
  getActivityById,
  getChecklistByActivity,
  getExpectedEvidenceForActivity,
  getRecommendedActionsForActivity,
  getRisksByActivity,
} from "../nrs/activityTemplates.js";
import { listRulesByActivity } from "../nrs/nrRules.js";

function normalizeValue(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDisplayLabel(value = "") {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function resolveActivePackageIds(references = {}) {
  return getActivePackages({ rulePackages: references.rulePackages || [] }).map((item) => item.id);
}

function resolveStoreSector(sectorInput, references = {}) {
  const normalized = normalizeValue(sectorInput);
  return (references.sectors || []).find((sector) => {
    return (
      normalizeValue(sector?.id) === normalized ||
      normalizeValue(sector?.name) === normalized
    );
  }) || null;
}

const SECTOR_HINTS = [
  { id: "eletrica", tokens: ["eletric"] },
  { id: "manutencao", tokens: ["manut"] },
  { id: "producao", tokens: ["produc", "linha", "fabrica"] },
  { id: "almoxarifado", tokens: ["almox", "estoque", "armazen"] },
  { id: "obra", tokens: ["obra", "canteiro", "constr"] },
  { id: "limpeza", tokens: ["limpez", "higien"] },
  { id: "solda", tokens: ["sold"] },
  { id: "maquinas", tokens: ["maquin", "usinag"] },
  { id: "espaco-confinado", tokens: ["confin"] },
  { id: "altura", tokens: ["altura", "andaim"] },
  { id: "quimicos", tokens: ["quimic", "pintura", "solvente"] },
  { id: "incendio-emergencia", tokens: ["incend", "emerg", "brigad"] },
  { id: "ergonomia", tokens: ["ergonom"] },
  { id: "administrativo", tokens: ["admin", "escritor"] },
  { id: "logistica-movimentacao", tokens: ["logist", "moviment", "doca"] },
  { id: "saude-hospitalar", tokens: ["hospital", "saude", "clinica"] },
];

function getAvailableSectorTemplates(activePackageIds = []) {
  return SECTORS.filter((sector) => {
    const packageIds = Array.isArray(sector.packageIds) ? sector.packageIds : [];
    if (packageIds.length === 0) return true;
    return packageIds.some((packageId) => packageId === "Base SST" || activePackageIds.includes(packageId));
  });
}

function resolveTemplateSector(sectorInput, references = {}) {
  const activePackageIds = resolveActivePackageIds(references);
  const availableSectors = getAvailableSectorTemplates(activePackageIds);
  const storeSector = resolveStoreSector(sectorInput, references);
  const normalizedCandidates = [
    normalizeValue(sectorInput),
    normalizeValue(storeSector?.id),
    normalizeValue(storeSector?.name),
  ].filter(Boolean);

  const exactMatch = availableSectors.find((sector) =>
    normalizedCandidates.some(
      (candidate) =>
        normalizeValue(sector.id) === candidate || normalizeValue(sector.nome) === candidate,
    ),
  );

  if (exactMatch) return exactMatch;

  const rawTokens = [String(sectorInput || ""), String(storeSector?.name || "")]
    .map((value) => value.toLowerCase())
    .join(" ");

  const hinted = SECTOR_HINTS.find((entry) => entry.tokens.some((token) => rawTokens.includes(token)));
  if (!hinted) return null;

  return availableSectors.find((sector) => normalizeValue(sector.id) === normalizeValue(hinted.id)) || null;
}

function isActivityEnabledForPackages(activity, activePackageIds = []) {
  const packageIds = [
    ...(Array.isArray(activity?.packageIds) ? activity.packageIds : []),
    ...(Array.isArray(activity?.inheritedPackageIds) ? activity.inheritedPackageIds : []),
  ];
  if (packageIds.length === 0) return true;
  return packageIds.some((packageId) => packageId === "Base SST" || activePackageIds.includes(packageId));
}

function getAvailableActivitiesForSector(sectorInput, references = {}) {
  const templateSector = resolveTemplateSector(sectorInput, references);
  const activePackageIds = resolveActivePackageIds(references);
  if (!templateSector) return [];

  return getActivitiesBySector(templateSector.id).filter((activity) =>
    isActivityEnabledForPackages(activity, activePackageIds),
  );
}

function resolveSelectedActivity(formData = {}, availableActivities = [], options = {}) {
  const requestedValues = [
    formData.activityId,
    formData.tipoInspecao,
    formData.title,
    formData.titulo,
  ]
    .map((value) => normalizeValue(value))
    .filter(Boolean);

  const matchedActivity = availableActivities.find((activity) => {
    const aliases = Array.isArray(activity.aliases) ? activity.aliases : [];
    const candidates = [activity.id, activity.nome, ...aliases].map((value) => normalizeValue(value));
    return requestedValues.some((value) => candidates.includes(value));
  });

  if (matchedActivity) return matchedActivity;
  if (options.autoSelectFirstActivity && availableActivities.length > 0) return availableActivities[0];
  return null;
}

function toInspectionPriorityLabel(activity) {
  const normalizedPriority = normalizeValue(
    activity?.prioridadeSugerida || activity?.severidadeSugerida || "",
  );

  if (normalizedPriority.includes("p1") || normalizedPriority.includes("crit")) return "Alta";
  if (normalizedPriority.includes("p2") || normalizedPriority.includes("alta")) return "Média";
  if (normalizedPriority.includes("p3") || normalizedPriority.includes("media")) return "Baixa";
  return "Baixa";
}

function buildStandardChecklistTemplate(activity, activePackageIds = []) {
  if (!activity) return null;

  const checklistItems = getChecklistByActivity(activity.id);
  const risks = getRisksByActivity(activity.id);
  const rules = listRulesByActivity(activity.id);
  const primaryPackageId =
    (activity.packageIds || []).find((packageId) => activePackageIds.includes(packageId)) ||
    activity.inheritedPackageIds?.[0] ||
    "Base SST";
  const activityLabel = toDisplayLabel(activity.nome || activity.id);

  return {
    id: `std-${activity.id}`,
    titulo: `Checklist padrão - ${activityLabel}`,
    title: `Checklist padrão - ${activityLabel}`,
    name: `Checklist padrão - ${activityLabel}`,
    pacote: primaryPackageId,
    package: primaryPackageId,
    atividade: activityLabel,
    atividades: [activity.id, activityLabel],
    nr: activity.relatedNrs?.[0] || "",
    ativo: true,
    status: "Ativo",
    regraFixa: true,
    sections: [
      {
        id: `${activity.id}-section-0`,
        title: "Itens de verificação",
        questions: checklistItems.map((item, index) => {
          const normalizedLabel = normalizeValue(item?.label);
          const matchedRule =
            rules.find((rule) => {
              const normalizedQuestion = normalizeValue(rule?.perguntaChecklist);
              return (
                normalizedQuestion === normalizedLabel ||
                normalizedQuestion.includes(normalizedLabel) ||
                normalizedLabel.includes(normalizedQuestion)
              );
            }) || rules[index] || null;
          const relatedRisk = risks[index] || risks[0] || null;

          return {
            id: matchedRule?.id || item.id,
            perguntaId: matchedRule?.id || item.id,
            text: item.label,
            label: item.label,
            type: "boolean",
            nr: matchedRule?.nr || relatedRisk?.nrs?.[0] || activity.relatedNrs?.[0] || "",
            nrRelacionada: matchedRule?.nr || relatedRisk?.nrs?.[0] || activity.relatedNrs?.[0] || "",
            regraId: matchedRule?.id || "",
            riskMap:
              matchedRule?.severidadePadrao ||
              relatedRisk?.severidadeSugerida ||
              activity.severidadeSugerida ||
              "Media",
            tipoRisco: matchedRule?.titulo || relatedRisk?.nome || item.label,
            acaoSugerida:
              matchedRule?.acaoRecomendada ||
              getRecommendedActionsForActivity(activity.id)[index] ||
              "",
          };
        }),
      },
    ],
  };
}

export function buildInspectionCreationBinding(formData = {}, references = {}, options = {}) {
  const activePackageIds = resolveActivePackageIds(references);
  const storeSector = resolveStoreSector(formData.setor || formData.ondeUsar, references);
  const templateSector = resolveTemplateSector(formData.setor || formData.ondeUsar, references);
  const availableActivities = getAvailableActivitiesForSector(formData.setor || formData.ondeUsar, references);
  const selectedActivity = resolveSelectedActivity(formData, availableActivities, options);
  const standardChecklistTemplate = buildStandardChecklistTemplate(selectedActivity, activePackageIds);
  const standardRisks = selectedActivity ? getRisksByActivity(selectedActivity.id) : [];
  const recommendedActions = selectedActivity
    ? getRecommendedActionsForActivity(selectedActivity.id)
    : [];
  const expectedEvidence = selectedActivity
    ? getExpectedEvidenceForActivity(selectedActivity.id)
    : [];
  const primaryPackageId =
    (selectedActivity?.packageIds || []).find((packageId) => activePackageIds.includes(packageId)) ||
    selectedActivity?.inheritedPackageIds?.[0] ||
    "Base SST";

  return {
    activePackageIds,
    activePackages: activePackageIds,
    storeSector,
    templateSector,
    availableActivities: availableActivities.map((activity) => ({
      id: activity.id,
      activityId: activity.id,
      activity: toDisplayLabel(activity.nome || activity.id),
      label: toDisplayLabel(activity.nome || activity.id),
      packageIds: activity.packageIds || [],
      pacote: (activity.packageIds || [])[0] || "Base SST",
      priority: toInspectionPriorityLabel(activity),
      nrCodes: activity.relatedNrs || [],
    })),
    selectedActivity: selectedActivity
      ? {
          ...selectedActivity,
          label: toDisplayLabel(selectedActivity.nome || selectedActivity.id),
        }
      : null,
    checklistOptions: standardChecklistTemplate ? [standardChecklistTemplate] : [],
    standardChecklistTemplate,
    standardRisks,
    nrCodes: selectedActivity?.relatedNrs || [],
    recommendedActions,
    expectedEvidence,
    priorityLabel: selectedActivity ? toInspectionPriorityLabel(selectedActivity) : "Baixa",
    primaryPackageId,
    hasMappedActivity: Boolean(selectedActivity),
    hasMappedActivities: availableActivities.length > 0,
    isManualInspection: availableActivities.length === 0 || !selectedActivity,
  };
}

export function adaptInspectionCreationPayload(formData = {}, references = {}) {
  return normalizeInspection({
    titulo: formData.titulo || formData.title,
    setor: references.sectorName || formData.setor,
    responsavel: references.responsibleName || formData.responsavel,
    atividades: formData.atividades || formData.activities || [],
    data: formData.data,
  });
}

export function adaptInspectionResult(inspection = {}, checklistAnswers = [], context = {}) {
  const normalizedInspection = normalizeInspection(inspection);
  const nonConformities = generateNonConformitiesFromInspection(normalizedInspection, checklistAnswers, context);
  const risks = generateRisksFromNonConformities(nonConformities, context);
  const actions = generateActionsFromRisks(risks, context);

  return {
    inspection: normalizedInspection,
    nonConformities,
    risks,
    actions,
  };
}

export function adaptTargetInspectionPayload(formData = {}, references = {}) {
  const binding = buildInspectionCreationBinding(formData, references, {
    autoSelectFirstActivity: references.autoSelectFirstActivity,
  });
  const baseInspection = adaptInspectionCreationPayload(formData, references);
  const activityCode =
    binding.selectedActivity?.id ||
    baseInspection.atividades?.[0] ||
    (formData.tipoInspecao || formData.titulo || formData.title
      ? mapHumanActivityToCode(formData.tipoInspecao || formData.titulo || formData.title || "")
      : "");
  const activityLabel =
    binding.selectedActivity?.label ||
    (activityCode ? getHumanActivityLabel(activityCode) : formData.tipoInspecao || "");
  const standardChecklistTemplate = binding.standardChecklistTemplate;
  const checklistLabel =
    standardChecklistTemplate?.titulo ||
    standardChecklistTemplate?.title ||
    standardChecklistTemplate?.name ||
    "";

  return {
    titulo: baseInspection.titulo,
    title: baseInspection.titulo,
    tipoInspecao: formData.tipoInspecao || activityLabel,
    activityId: binding.selectedActivity?.id || "",
    setor: baseInspection.setor,
    sectorId: binding.storeSector?.id || formData.sectorId || "",
    templateSectorId: binding.templateSector?.id || "",
    ondeUsar: baseInspection.setor,
    responsavel: baseInspection.responsavel,
    data: baseInspection.data,
    proximaInspecao: baseInspection.data,
    atividades:
      binding.selectedActivity?.id
        ? [binding.selectedActivity.id]
        : baseInspection.atividades?.filter(Boolean) || [],
    checklistId: standardChecklistTemplate?.id || formData.checklistId || "",
    checklist: checklistLabel,
    pacote: binding.primaryPackageId,
    package: binding.primaryPackageId,
    pacoteIds: binding.activePackageIds,
    pacotesAtivos: binding.activePackageIds,
    nrCodes: binding.nrCodes,
    standardRisks: binding.standardRisks,
    recommendedActions: binding.recommendedActions,
    expectedEvidence: binding.expectedEvidence,
    standardChecklistTemplate,
    mappedActivityAvailable: binding.hasMappedActivities,
    isManualInspection: binding.isManualInspection,
  };
}

export function buildInspectionExecutionPreview(inspection = {}, items = [], state = {}) {
  return synchronizeInspectionWithMotor(
    {
      ...inspection,
      items,
    },
    state,
  );
}
