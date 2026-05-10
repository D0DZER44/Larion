function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function dedupeStrings(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function findRelatedStandardRisk(nonConformity = {}, inspection = {}) {
  const risks = Array.isArray(inspection?.standardRisks) ? inspection.standardRisks : [];
  const targetNr = nonConformity?.nrCode || nonConformity?.nr || "";
  return (
    risks.find((risk) => Array.isArray(risk?.nrs) && risk.nrs.includes(targetNr)) ||
    risks.find((risk) => normalizeText(risk?.nome) === normalizeText(nonConformity?.titulo)) ||
    risks[0] ||
    null
  );
}

export function buildAutomaticRisksFromInspections(state = {}, options = {}) {
  const activePackages = new Set(options.activePackages || []);
  const includeInactivePackages = Boolean(options.includeInactivePackages);
  const existingKeys = new Set(
    (state.riscos || []).map((risk) =>
      [
        risk?.inspection_id || risk?.inspecaoId || "",
        risk?.ruleId || "",
        normalizeText(risk?.origem || ""),
        normalizeText(risk?.titulo || risk?.tipoDeRisco || ""),
      ].join("|"),
    ),
  );

  return (state.inspecoes || []).flatMap((inspection) => {
    const packageName = inspection?.pacote || inspection?.package || "Base SST";
    if (!includeInactivePackages && packageName !== "Base SST" && !activePackages.has(packageName)) {
      return [];
    }

    const nonConformities = Array.isArray(inspection?.nonConformityItems)
      ? inspection.nonConformityItems
      : [];

    return nonConformities
      .filter((item) => normalizeText(item?.origem) === "checklist_padrao")
      .map((item) => {
        const relatedStandardRisk = findRelatedStandardRisk(item, inspection);
        const riskKey = [
          item?.inspectionId || inspection?.id || "",
          item?.ruleId || "",
          "checklist_padrao",
          normalizeText(item?.titulo || relatedStandardRisk?.nome || ""),
        ].join("|");

        if (existingKeys.has(riskKey)) return null;

        const expectedEvidence = dedupeStrings([
          ...(Array.isArray(relatedStandardRisk?.evidenciasEsperadas)
            ? relatedStandardRisk.evidenciasEsperadas
            : []),
          ...(Array.isArray(inspection?.expectedEvidence) ? inspection.expectedEvidence : []),
        ]);
        const recommendedActions = dedupeStrings([
          item?.acaoRecomendada,
          ...(Array.isArray(relatedStandardRisk?.acoesRecomendadas)
            ? relatedStandardRisk.acoesRecomendadas
            : []),
          ...(Array.isArray(inspection?.recommendedActions) ? inspection.recommendedActions : []),
        ]);

        return {
          id: `auto-risk-${inspection?.id || "inspection"}-${item?.id || item?.ruleId || crypto.randomUUID()}`,
          titulo: item?.titulo || relatedStandardRisk?.nome || item?.pergunta || "Risco operacional",
          title: item?.titulo || relatedStandardRisk?.nome || item?.pergunta || "Risco operacional",
          descricao:
            item?.descricao ||
            `Não conformidade detectada na inspeção ${inspection?.titulo || inspection?.checklist || inspection?.id || ""}.`,
          atividade: inspection?.tipoInspecao || inspection?.activityLabel || inspection?.atividade || "",
          activityId: item?.activityId || inspection?.activityId || "",
          setor: inspection?.ondeUsar || inspection?.setor || item?.setor || "Geral",
          sectorId: item?.sectorId || inspection?.sectorId || "",
          nr: item?.nrCode || item?.nr || "",
          nrCode: item?.nrCode || item?.nr || "",
          inspection_id: item?.inspectionId || inspection?.id || "",
          inspecaoId: item?.inspectionId || inspection?.id || "",
          ruleId: item?.ruleId || "",
          severidade: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          nivel: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          gravidade: item?.severidade || relatedStandardRisk?.severidadeSugerida || "Média",
          prioridade: item?.prioridade || relatedStandardRisk?.prioridadeSugerida || "Alta",
          status: "Aberto",
          pacote: packageName,
          package: packageName,
          origem: "checklist_padrao",
          tipoDeRisco: relatedStandardRisk?.nome || item?.titulo || item?.pergunta || "Risco operacional",
          riscoPadraoRelacionado: relatedStandardRisk || null,
          acaoRecomendada: recommendedActions[0] || "",
          acoesRecomendadas: recommendedActions,
          evidenciasEsperadas: expectedEvidence,
          expectedEvidence,
          recommendedAction: recommendedActions[0] || "",
          checklistId: inspection?.checklistId || inspection?.standardChecklistTemplate?.id || "",
          checklist: inspection?.checklist || inspection?.standardChecklistTemplate?.titulo || "",
          responsavel: inspection?.responsavel || "",
          created_at: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          updated_at: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          criadoEm: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
          atualizadoEm: inspection?.updated_at || inspection?.atualizadoEm || inspection?.created_at || new Date().toISOString(),
        };
      })
      .filter(Boolean);
  });
}
