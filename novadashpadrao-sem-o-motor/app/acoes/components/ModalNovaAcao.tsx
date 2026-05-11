"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useAppStore } from "@/lib/store";
import {
  ACTION_ORIGIN_OPTIONS,
  ACTION_TYPE_OPTIONS,
  ACTION_EVIDENCE_OPTIONS,
  buildActionCreationBinding,
  prepareActionCreationPayload,
} from "@/lib/motor/adapters/actionsAdapter.js";

const DEFAULT_FORM_DATA = {
  origemAcao: "Ação manual",
  riskId: "",
  tipoAcao: "Ação corretiva",
  correcaoNecessaria: "",
  descricao: "",
  prioridade: "Média",
  prazo: "",
  setor: "",
  responsavel: "",
  executor: "",
  trabalhadoresExpostos: 0,
  perfilExposto: "",
  impactoHumano: "",
  evidenciaNecessariaConcluir: "",
  evidenciaNecessariaOutro: "",
  justificativaOrigem: "",
  justificativaAjusteManual: "",
};

export default function ModalNovaAcao({ onClose, onCreate }: { onClose: () => void; onCreate: (acao: any) => void }) {
  const sectors = useAppStore((state) => state.sectors);
  const users = useAppStore((state) => state.users);
  const riscos = useAppStore((state) => state.riscos);
  const inspecoes = useAppStore((state) => state.inspecoes);
  const rulePackages = useAppStore((state) => state.rulePackages);
  const sectorOptions = sectors.map((sector: any) => sector?.name).filter(Boolean);
  const responsibleOptions = users
    .filter((user: any) => user?.status !== "Inativo")
    .map((user: any) => user?.name)
    .filter(Boolean);
  const activePackageNames = useMemo(
    () => rulePackages.filter((pkg: any) => pkg?.isActive).map((pkg: any) => pkg?.name),
    [rulePackages],
  );
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const binding = useMemo(
    () =>
      buildActionCreationBinding(
        formData,
        {
          riscos,
          inspecoes,
          sectors,
          users,
        },
        {
          activePackages: activePackageNames,
          includeInactivePackages: true,
        },
      ),
    [formData, riscos, inspecoes, sectors, users, activePackageNames],
  );

  const linkedRisk = binding.linkedRisk;
  const manualPriorityOverride = Boolean(
    binding.prioridadeSugerida && formData.prioridade && formData.prioridade !== binding.prioridadeSugerida,
  );
  const manualDueOverride = Boolean(
    binding.prazoSugerido && formData.prazo && formData.prazo !== binding.prazoSugerido,
  );
  const requiresOriginJustification = formData.origemAcao === "Ação manual";
  const showsLinkedRisk = formData.origemAcao === "Gerada por risco";

  const updateField = (key: string, value: any) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOriginChange = (origin: string) => {
    setFormData((current) => ({
      ...current,
      origemAcao: origin,
      riskId: origin === "Gerada por risco" ? current.riskId : "",
      justificativaOrigem: origin === "Ação manual" ? current.justificativaOrigem : "",
    }));
  };

  const handleRiskSelection = (riskId: string) => {
    const selectedRisk = binding.availableRisks.find((risk: any) => risk.id === riskId);
    setFormData((current) => ({
      ...current,
      riskId,
      setor: selectedRisk?.setor || current.setor,
      prioridade: selectedRisk?.prioridadeSugerida || current.prioridade,
      prazo: selectedRisk?.prazoSugerido || current.prazo,
      correcaoNecessaria: current.correcaoNecessaria || selectedRisk?.acaoInicial || "",
      responsavel: current.responsavel || selectedRisk?.responsavelSugerido || "",
      executor: current.executor || selectedRisk?.responsavelSugerido || "",
      trabalhadoresExpostos: current.trabalhadoresExpostos || selectedRisk?.trabalhadoresExpostos || 0,
      perfilExposto: current.perfilExposto || selectedRisk?.perfilExposto || "",
      impactoHumano: current.impactoHumano || selectedRisk?.impactoHumano || "",
      evidenciaNecessariaConcluir:
        current.evidenciaNecessariaConcluir || selectedRisk?.evidenciaEsperada?.[0] || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.correcaoNecessaria ||
      !formData.descricao ||
      !formData.setor ||
      !formData.executor ||
      !formData.responsavel
    ) {
      return;
    }

    if (showsLinkedRisk && !formData.riskId) return;
    if (requiresOriginJustification && !formData.justificativaOrigem.trim()) return;
    if ((manualPriorityOverride || manualDueOverride) && !formData.justificativaAjusteManual.trim()) return;
    if (formData.evidenciaNecessariaConcluir === "Outro" && !formData.evidenciaNecessariaOutro.trim()) return;

    const payload = prepareActionCreationPayload(formData, binding, {
      referenceDate: new Date().toISOString(),
    });

    onCreate(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#121826] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-bold text-white">Nova Ação Centrada em Pessoas</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
          <form id="action-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">
                1. COMO ESTA AÇÃO NASCE?
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Origem da ação
                </label>
                <select
                  value={formData.origemAcao}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                >
                  {ACTION_ORIGIN_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {showsLinkedRisk && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Risco vinculado
                    </label>
                    <select
                      value={formData.riskId}
                      onChange={(e) => handleRiskSelection(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      <option value="">Selecione um risco</option>
                      {binding.availableRisks.map((risk: any) => (
                        <option key={risk.id} value={risk.id}>
                          {risk.titulo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {linkedRisk && (
                    <div className="bg-[#1a2332]/60 border border-purple-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
                            Risco vinculado
                          </p>
                          <p className="text-sm font-semibold text-white truncate">{linkedRisk.titulo}</p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full border border-orange-500/30 text-orange-300 bg-orange-500/10">
                          {linkedRisk.criticidade}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">NR relacionada</p>
                          <p className="text-white font-medium">{linkedRisk.nrCode || "Não informada"}</p>
                        </div>
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">Setor</p>
                          <p className="text-white font-medium">{linkedRisk.setor || "Não informado"}</p>
                        </div>
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">Atividade</p>
                          <p className="text-white font-medium">{linkedRisk.atividade || "Não informada"}</p>
                        </div>
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">Prioridade sugerida</p>
                          <p className="text-white font-medium">{linkedRisk.prioridadeSugerida}</p>
                        </div>
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">Prazo sugerido</p>
                          <p className="text-white font-medium">{linkedRisk.prazoSugerido || "Não informado"}</p>
                        </div>
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                          <p className="text-gray-400 uppercase tracking-wide mb-1">Evidência esperada</p>
                          <p className="text-white font-medium">
                            {linkedRisk.evidenciaEsperada?.[0] || "Sem evidência definida"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {requiresOriginJustification && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Justificativa da origem
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.justificativaOrigem}
                    onChange={(e) => updateField("justificativaOrigem", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="Explique por que esta ação foi criada manualmente."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Tipo de ação
                </label>
                <select
                  value={formData.tipoAcao}
                  onChange={(e) => updateField("tipoAcao", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                >
                  {ACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Correção necessária
                </label>
                <input
                  type="text"
                  required
                  value={formData.correcaoNecessaria}
                  onChange={(e) => updateField("correcaoNecessaria", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Isolar área e instalar guarda-corpo definitivo"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Descrição detalhada
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => updateField("descricao", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="Detalhes técnicos da execução..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Setor / local
                </label>
                <select
                  value={formData.setor}
                  onChange={(e) => updateField("setor", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                >
                  <option value="">Selecione um setor</option>
                  {sectorOptions.map((sectorName: string) => (
                    <option key={sectorName} value={sectorName}>
                      {sectorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => updateField("prioridade", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    {["Crítica", "Alta", "Média", "Baixa"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  {binding.prioridadeSugerida && (
                    <p className="text-[11px] text-gray-500 mt-1">Sugerida pelo motor: {binding.prioridadeSugerida}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Prazo máximo
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.prazo}
                    onChange={(e) => updateField("prazo", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    style={{ colorScheme: "dark" }}
                  />
                  {binding.prazoSugerido && (
                    <p className="text-[11px] text-gray-500 mt-1">Prazo sugerido: {binding.prazoSugerido}</p>
                  )}
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Status sugerido
                  </label>
                  <div className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white">
                    {binding.statusSugerido || "Aberta"}
                  </div>
                </div>
              </div>

              {(manualPriorityOverride || manualDueOverride) && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Justificativa da alteração manual
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.justificativaAjusteManual}
                    onChange={(e) => updateField("justificativaAjusteManual", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="Explique por que a prioridade ou o prazo foram ajustados manualmente."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-white/5 pb-2">
                2. QUEM ESTAMOS PROTEGENDO?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Qtd. trabalhadores expostos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.trabalhadoresExpostos}
                    onChange={(e) =>
                      updateField("trabalhadoresExpostos", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Perfil exposto (função/cargo)
                  </label>
                  <input
                    type="text"
                    value={formData.perfilExposto}
                    onChange={(e) => updateField("perfilExposto", e.target.value)}
                    placeholder="Ex: Operadores de Empilhadeira"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Dano evitado (impacto humano estimado)
                </label>
                <input
                  type="text"
                  value={formData.impactoHumano}
                  onChange={(e) => updateField("impactoHumano", e.target.value)}
                  placeholder="Ex: Risco de amputação por esmagamento"
                  className="w-full bg-black/20 border border-white/10 text-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2">
                3. QUEM EXECUTA E QUEM VALIDA?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider gap-2 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Executor da correção
                  </label>
                  <select
                    value={formData.executor}
                    onChange={(e) => updateField("executor", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="">Selecione quem executa</option>
                    {responsibleOptions.map((responsibleName: string) => (
                      <option key={responsibleName} value={responsibleName}>
                        {responsibleName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                    A pessoa física ou terceiro que irá executar o reparo ou a implementação.
                  </p>
                </div>
                <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Validador de segurança
                  </label>
                  <select
                    required
                    value={formData.responsavel}
                    onChange={(e) => updateField("responsavel", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option value="">Selecione quem valida</option>
                    {responsibleOptions.map((responsibleName: string) => (
                      <option key={responsibleName} value={responsibleName}>
                        {responsibleName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                    Responsável por confirmar se a intervenção garantiu a integridade humana.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-white/5 pb-2">
                4. EVIDÊNCIA E CONCLUSÃO
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Evidência necessária para concluir
                </label>
                <select
                  value={formData.evidenciaNecessariaConcluir}
                  onChange={(e) => updateField("evidenciaNecessariaConcluir", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                >
                  <option value="">Selecione a evidência principal</option>
                  {ACTION_EVIDENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {formData.evidenciaNecessariaConcluir === "Outro" && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Outra evidência necessária
                  </label>
                  <input
                    type="text"
                    value={formData.evidenciaNecessariaOutro}
                    onChange={(e) => updateField("evidenciaNecessariaOutro", e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Descreva a evidência adicional."
                  />
                </div>
              )}

              {binding.evidenciasEsperadas?.length > 0 && (
                <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-3">
                    Evidências esperadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {binding.evidenciasEsperadas.map((item: string) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-full text-[11px] border border-purple-500/20 bg-purple-500/10 text-purple-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#1a2332]/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-2">
                  Regra de conclusão
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {binding.requiresEvidence
                    ? "Esta ação exigirá evidência anexada para sair de Aguardando evidência e seguir para validação."
                    : "Esta ação pode seguir o fluxo normal de execução e validação."}
                </p>
                <p className="text-[11px] text-gray-500 mt-2">
                  Status operacionais previstos: {binding.statusOptions?.join(", ")}
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-white/5 shrink-0 bg-[#0b0f19] flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="action-form"
            className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            Registrar Ação
          </button>
        </div>
      </motion.div>
    </div>
  );
}
