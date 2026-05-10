import { normalizeInspection } from "../core/normalizeEngine.js";
import { generateNonConformitiesFromInspection, generateRisksFromNonConformities, generateActionsFromRisks } from "../engine/operationalEngine.js";
import { getHumanActivityLabel, mapHumanActivityToCode, synchronizeInspectionWithMotor } from "../bridge";

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
  const baseInspection = adaptInspectionCreationPayload(formData, references);
  const activityCode =
    baseInspection.atividades?.[0] ||
    mapHumanActivityToCode(formData.tipoInspecao || formData.titulo || formData.title || "");
  const activityLabel = getHumanActivityLabel(activityCode);

  return {
    titulo: baseInspection.titulo,
    title: baseInspection.titulo,
    tipoInspecao: formData.tipoInspecao || activityLabel,
    setor: baseInspection.setor,
    ondeUsar: baseInspection.setor,
    responsavel: baseInspection.responsavel,
    data: baseInspection.data,
    proximaInspecao: baseInspection.data,
    atividades: baseInspection.atividades?.length ? baseInspection.atividades : [activityCode],
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
