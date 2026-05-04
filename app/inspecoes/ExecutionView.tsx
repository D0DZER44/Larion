import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ClipboardCheck, ShieldAlert, Zap, AlertTriangle, Play,
  CheckCircle2, XCircle, AlertCircle, FileText, Settings, X, Search,
  ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { 
  calcularPrioridade, 
  calcularPrazo, 
  calcularMultaEstimada, 
  calcularChanceIncidente, 
  calcularImpactoOperacional, 
  calcularNivelConformidade,
  formatCurrency,
  RiskInstance,
  applyManualRules
} from '@/lib/risk-calculations';
import { getTodosChecklistsAtivos } from '@/lib/normativeChecklists';

export default function ExecutionView({ inspectionId, onClose }: { inspectionId: string, onClose: () => void }) {
  const store = useAppStore();
  const inspection = store.inspecoes?.find(i => i.id === inspectionId);
  const addRisco = store.addRisco;
  const addAcao = store.addAcao;
  const updateInspecao = store.updateInspecao;

  // Initialize questions if empty
  const checklistsAtivos = useMemo(() => getTodosChecklistsAtivos(store.checklists || []), [store.checklists]);
  const template = checklistsAtivos.find(c => c.name === inspection?.checklist || c.id === inspection?.checklistId);
  
  const [items, setItems] = useState<any[]>(() => {
     if (inspection?.items && inspection.items.length > 0) return JSON.parse(JSON.stringify(inspection.items));
     if (template) {
        return template.sections.flatMap((s: any) => s.questions.map((q: any) => ({
             ...q,
             status: 'Pendente',
             observacao: '',
             sectionId: s.id,
             sectionTitle: s.title
        })));
     }
     return [];
  });
  const [initialItems, setInitialItems] = useState<string>(JSON.stringify(items));
  const [filter, setFilter] = useState('Todas as perguntas');
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    return JSON.stringify(items) !== initialItems;
  }, [items, initialItems]);

  useEffect(() => {
    if (inspection && inspection.status !== 'Em andamento' && inspection.status !== 'Concluída') {
       setTimeout(() => {
          updateInspecao(inspection.id, { status: 'Em andamento', situacao: 'Em andamento' });
       }, 0);
    }
  }, [inspection, updateInspecao]);

  const risks = useMemo(() => {
    return items.filter((i: any) => i.status === 'Não' || i.status === 'Parcialmente').map((nc: any) => {
      const isCritica = nc.riskMap === 'Crítica';
      const isAlta = nc.riskMap === 'Alta';
      const activity = inspection?.tipoInspecao || inspection?.checklist || 'Trabalho em altura';
      const nr = nc.nr || 'NR-35';
      
      const payload: Partial<RiskInstance> = {
        atividade: activity,
        nr: nr,
        severidade: nc.riskMap || 'Média',
        respostaOrigem: nc.status,
        hasEpiEpc: true,
      };

      const calibrated = applyManualRules(payload);
      
      return {
        ...nc,
        nrRef: nr,
        severidade: nc.riskMap,
        prioridade: calibrated.prioridade,
        prazo: calibrated.prazo,
        multa: formatCurrency(calibrated.multaEstimada || 0),
        chance: calibrated.chanceIncidente,
        impactoScore: isCritica ? -15 : isAlta ? -10 : -5,
        acaoSugerida: getAcaoSugerida(nc.text),
        alerta: isCritica ? 'Alerta Crítico: Risco de incidente grave detectado. Recomenda-se paralisação imediata para correção.' : null
      };
    });
  }, [items, inspection?.tipoInspecao, inspection?.checklist]);

  const ncsDetectadasCount = items.filter((i: any) => i.status === 'Não' || i.status === 'Parcialmente').length;
  const acoesGeradasCount = ncsDetectadasCount;

  if (!inspection) return null;

  const progresso = items.length > 0 ? items.filter(i => i.status !== 'Pendente').length / items.length : 0;
  const respostasCertas = items.filter(i => i.status === 'Sim' || i.status === 'N/A').length;
  const itensRespondidos = items.filter(i => i.status !== 'Pendente').length;
  const conformidade = itensRespondidos > 0 ? respostasCertas / itensRespondidos : 0;
  
  const handleAnswer = (index: number, answer: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], status: answer };
    setItems(newItems);
  };

  const handleBack = () => {
    if (hasChanges) {
      setConfirmExitOpen(true);
    } else {
      onClose();
    }
  };

  const handleSalvar = () => {
    setIsSaving(true);
    updateInspecao(inspection.id, { 
      items,
      status: 'Em andamento',
      situacao: 'Em andamento'
    });
    
    syncRisks(items);

    setInitialItems(JSON.stringify(items));
    setSaveMessage("Respostas salvas. A inspeção continua em andamento.");
    setTimeout(() => {
      setSaveMessage(null);
      setIsSaving(false);
    }, 3000);
  };

  const syncRisks = (currentItems: any[]) => {
    let oldItems: any[] = [];
    try {
      oldItems = JSON.parse(initialItems);
    } catch(e) {}

    // Motor v2: Filtering applicable rules
    const pacotesAtivos = store.rulePackages.filter(p => p.isActive).map(p => p.name);
    const segmentoOrg = store.organization.segmento;
    const atividadesOrg = store.organization.atividadesCriticas;

    const regrasAplicaveis = store.riskRules.filter(regra =>
      regra.ativo &&
      pacotesAtivos.includes(regra.pacote) &&
      (
        regra.pacote === "Base SST" ||
        regra.segmentos.includes(segmentoOrg) ||
        regra.atividades.some(a => atividadesOrg.includes(a))
      )
    );

    const calculateScore = (itemsToScore: any[]) => {
      let impactScore = 0;
      itemsToScore.forEach((i: any) => {
        // Only count impact if it matches an applicable rule OR it's a base SST item
        const matchesRule = regrasAplicaveis.some(r => 
          r.nrRelacionada === (i.nrRelacionada || i.nr) && 
          (r.pacote === 'Base SST' || r.atividades.some(a => (i.atividade === a || template?.atividade === a)))
        );

        if ((i.status === 'Não' || i.status === 'Parcialmente') && (i.regraFixa || matchesRule)) {
          const sev = (i.riskMap || i.severidade || '').toLowerCase();
          let p = sev === 'crítica' ? 10 : sev === 'alta' ? 5 : sev === 'média' ? 2 : 1;
          if (i.status === 'Parcialmente') p = p / 2;
          impactScore -= p;
        }
      });
      const validItems = itemsToScore.filter(i => i.status !== 'N/A' && i.status !== 'Pendente');
      const simCount = validItems.filter(i => i.status === 'Sim' || i.status === 'Conforme').length;
      const approval = validItems.length > 0 ? Math.round((simCount / validItems.length) * 100) : 100;
      return Math.max(0, approval + impactScore);
    };

    const scoreAntes = calculateScore(oldItems);
    const scoreDepois = calculateScore(currentItems);

    currentItems.forEach(item => {
      // Find matching risk rule from the new structure
      const matchingRule = regrasAplicaveis.find(r => 
        r.nrRelacionada === (item.nrRelacionada || item.nr) && 
        (r.pacote === 'Base SST' || r.atividades.some(a => (item.atividade === a || template?.atividade === a)))
      );

      // Package filtering: if the item's package is not active, skip
      const itemPacote = item.pacote || template?.pacote || 'Base SST';
      const isPackageActive = pacotesAtivos.includes(itemPacote);

      if (!isPackageActive && !matchingRule) return;

      if (item.regraFixa || matchingRule) {
        const oldItem = oldItems.find(i => i.id === item.id);
        if (!oldItem || oldItem.status !== item.status) {
          const severity = (matchingRule?.criticidade || item.riskMap || item.severidade || '').toLowerCase();
          let penalty = severity === 'crítico' || severity === 'crítica' ? 10 : severity === 'alta' || severity === 'alto' ? 5 : severity === 'médio' || severity === 'média' ? 2 : 1;
          if (item.status === 'Parcialmente') penalty = penalty / 2;
          if (item.status === 'Sim' || item.status === 'N/A' || item.status === 'Pendente') penalty = 0;

          if (penalty > 0) {
            store.addLog({
              user_id: 'system',
              empresa_id: 'default',
              event_type: 'Score impactado por regra ativa',
              description: `O score foi impactado pela regra ${matchingRule?.nome || item.regraTitulo || ('Regra Padrão ' + (item.nrRelacionada || 'NR-01'))} vinculada à ${item.nrRelacionada || 'NR-01'}, após resposta ${item.status} no checklist.`,
              origin_type: 'inspecoes',
              origin_id: inspection.id,
              metadata: { 
                inspecaoId: inspection.id,
                checklistId: inspection.checklist,
                perguntaId: item.id,
                perguntaOrigem: item.text,
                respostaOrigem: item.status,
                nrRelacionada: item.nrRelacionada || 'NR-01',
                regraId: matchingRule?.id || item.regraId || 'sys',
                regraTitulo: matchingRule?.nome || item.regraTitulo || ('Regra Padrão ' + (item.nrRelacionada || 'NR-01')),
                impactoScore: -penalty,
                scoreAntes,
                scoreDepois,
                origem: matchingRule ? 'Motor de Pacotes' : 'Motor normativo'
              }
            });
          }
        }
      }

      const isDeficient = item.status === 'Não' || item.status === 'Parcialmente';
      const geraRiscoVar = item.geraRisco !== false;
      const geraAcaoVar = item.geraAcao !== false;

      if (isDeficient && (matchingRule || item.regraFixa)) {
        const nr = matchingRule?.nrRelacionada || item.nr || item.nrRelacionada || 'NR-01';
        
        // Determinar criticidade baseada na regra combinada
        let severity = matchingRule?.criticidade || item.riskMap || 'Médio';
        let priority = severity;
        
        let prazoHoras = matchingRule?.prazoPadraoHoras || 168; // 7 dias default
        if (severity === 'Crítico' || severity === 'Crítica') prazoHoras = 24;
        else if (severity === 'Alta' || severity === 'Alto') prazoHoras = 72;

        let deadlineDesc = `Até ${Math.floor(prazoHoras / 24)} dias`;
        if (prazoHoras <= 24) deadlineDesc = 'Imediato (24h)';

        const existingRisk = store.riscos?.find(r => 
          r.inspection_id === inspection.id && 
          r.checklist_item_id === item.id &&
          (matchingRule ? r.regraId === matchingRule.id : true)
        );

        const activity = inspection.tipoInspecao || 'Inspeção';
        const sector = inspection.ondeUsar || 'Geral';

        let riskId = existingRisk?.id;

        if (geraRiscoVar) {
          const draftRisk: Partial<RiskInstance> = {
            id: existingRisk?.id || crypto.randomUUID(),
            titulo: matchingRule ? matchingRule.nome : `Não Conformidade: ${item.text.substring(0, 50)}...`,
            atividade: activity,
            setor: sector,
            nr: nr,
            nrRelacionada: item.nrRelacionada || nr,
            severidade: severity as any,
            prioridade: priority,
            prazo: deadlineDesc,
            respostaOrigem: item.status,
            inspection_id: inspection.id,
            inspection_name: inspection.checklist,
            checklist_item_id: item.id,
            perguntaId: item.id,
            perguntaOrigem: item.text,
            checklistId: template?.id || inspection.checklist,
            origem: 'Inspeção',
            regraId: matchingRule?.id || item.regraId,
            regraFixa: item.regraFixa || !!matchingRule,
            regraTitulo: matchingRule ? matchingRule.nome : (item.regraFixa ? `Regra Padrão ${item.nrRelacionada || nr}` : undefined),
            tipoDeRisco: item.tipoRisco || 'Segurança Ocupacional',
            justificativa: matchingRule ? `Regra ${matchingRule.nome} violada: ${matchingRule.condicao}.` : `Desvio identificado durante inspeção: "${item.text}".`,
            hasEpiEpc: true,
            hasTreinamento: true,
            hasProcedimento: true,
            responsavel: inspection.responsavel || 'Supervisor da Área',
            criadoEm: existingRisk?.criadoEm || new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            status: existingRisk?.status || 'Pendente'
          };

          const calibratedRisk = applyManualRules(draftRisk);
          
          if (item.regraFixa || item.nrRelacionada || matchingRule) {
            const { gerarExplicacaoNormativa } = require('@/lib/risk-calculations');
            calibratedRisk.explicacaoNormativa = matchingRule ? `${matchingRule.nome}: ${matchingRule.condicao}` : gerarExplicacaoNormativa(draftRisk.nrRelacionada, draftRisk.respostaOrigem, template?.name);
          }

          riskId = existingRisk?.id || calibratedRisk.id;

          if (existingRisk) {
            store.updateRisco(existingRisk.id, calibratedRisk);
          } else {
            store.addRisco(calibratedRisk);
            store.addLog({
                user_id: 'system',
                empresa_id: 'default',
                event_type: 'Risco gerado por motor de regras',
                description: `Risco criado automaticamente a partir da regra ${matchingRule?.nome || item.regraTitulo || 'Regra Padrão'} vinculada à ${nr}.`,
                origin_type: 'riscos',
                origin_id: calibratedRisk.id,
                metadata: { nr: nr, regraId: matchingRule?.id || item.regraId, perguntaOrigem: item.text }
            });
          }
        }

        if (geraAcaoVar && riskId) {
          // Action generation
          const actionTitle = matchingRule?.acaoSugerida || `Regularizar: ${item.text.substring(0, 30)}...`;
          const existingAcao = store.acoes?.find(a => a.riscoId === riskId || a.item_origem_id === riskId);
          const acaoId = existingAcao?.id || crypto.randomUUID();
          
          let calibratedRiskObj = store.riscos?.find((rs) => rs.id === riskId);

          if (geraRiscoVar && riskId) {
             if (calibratedRiskObj) {
                calibratedRiskObj.acaoVinculada = acaoId;
             }
          }

        const actionStatus = (() => {
          if (existingAcao) return existingAcao.status;
          const sev = (severity || '').toLowerCase();
          if (sev === 'crítico' || sev === 'crítica') return 'Pendente crítico';
          if (sev === 'alta' || sev === 'alto') return 'Pendente';
          return 'Aberta';
        })();

        const actionPayload = {
          id: acaoId,
          titulo: actionTitle,
          descricao: matchingRule ? matchingRule.acaoSugerida : `Regularização obrigatória devido à não conformidade "${item.text}" detectada em inspeção.`,
          setor: sector,
          responsavel: inspection.responsavel || 'SST + Supervisor da área',
          prioridade: priority,
          status: actionStatus,
          prazo: deadlineDesc,
          origem: 'Inspeção',
          riscoId: riskId,
          inspecaoId: inspection.id,
          checklistId: template?.id || inspection.checklist,
          perguntaOrigem: item.text,
          respostaOrigem: item.status,
          nrRelacionada: item.nrRelacionada || nr,
          item_origem_id: riskId, 
          item_origem_tipo: 'risco',
          regraId: matchingRule?.id || item.regraId,
          regraTitulo: matchingRule ? matchingRule.nome : (item.regraFixa ? `Regra Padrão ${item.nrRelacionada || nr}` : undefined),
          regraFixa: item.regraFixa || !!matchingRule,
          exigeEvidencia: matchingRule?.exigeEvidencia || false,
          explicacaoNormativa: calibratedRiskObj?.explicacaoNormativa,
            multaEstimada: calibratedRiskObj?.multaEstimada,
            chanceIncidente: calibratedRiskObj?.chanceIncidente,
            criadoEm: existingAcao?.criadoEm || new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            historico: existingAcao?.historico || []
          };

          if (!existingAcao && (item.regraFixa || matchingRule)) {
             actionPayload.historico.push({
               id: crypto.randomUUID(),
               actionId: acaoId,
               evento: 'Ação criada por motor de regras',
               origem: 'Sistema',
               usuario: 'Motor de Regras',
               dataHora: new Date().toISOString(),
               statusFinal: 'Pendente',
               camposAlterados: [],
               justificativa: `Ação criada automaticamente a partir do risco gerado por regra ${matchingRule?.nome || item.regraTitulo || 'Regra Padrão'}.`,
               hash: 'sys',
               versao: '1',
               integridade: 'ok'
             });
          }
          
          if (existingAcao) {
            store.updateAcao(existingAcao.id, actionPayload);
          } else {
            store.addAcao(actionPayload);
          }
        }
      }
    });
  };

  const handleConfirmarConclusao = () => {
    setConfirmCompleteOpen(true);
  };

  const executeConcluir = () => {
    updateInspecao(inspection.id, { 
      items, 
      status: 'Concluída', 
      situacao: 'Concluída',
      dataConclusao: new Date().toISOString(),
      finalizadaEm: new Date().toISOString()
    });
    
    syncRisks(items);

    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#03060e] flex flex-col overflow-hidden text-gray-200"
    >
      <div className="flex-none h-20 border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <button onClick={handleBack} className="p-2.5 -ml-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                   <ShieldAlert className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                   <div className="flex items-center gap-2.5">
                      <h1 className="text-xl font-bold text-white tracking-tight uppercase">Auditoria de Segurança</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-500/30 text-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse">Live</span>
                   </div>
                   <p className="text-[12px] text-gray-500 font-medium">Protocolo: #{inspection.id.substring(0, 8)} • {inspection.checklist}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-white/5">
              <div className="text-right">
                 <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Responsável</p>
                 <p className="text-sm font-bold text-gray-200">{inspection.responsavel}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative shadow-lg">
                 <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${inspection.responsavel}`} alt="avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
              </div>
           </div>
           <button onClick={handleBack} className="p-3 text-gray-500 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-white/5">
             <X className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#03060e]">
            <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8 pb-32">
               
               {saveMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {saveMessage}
                  </motion.div>
               )}
               
               <div className="relative">
                  <div className="absolute top-8 left-10 right-10 h-[2px] bg-white/5 overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                     />
                  </div>
                  <div className="grid grid-cols-4 gap-4 relative z-10">
                     {[
                        { step: 1, label: 'Planejamento', status: 'Concluído', color: 'emerald' },
                        { step: 2, label: 'Abertura', status: 'Concluído', color: 'emerald' },
                        { step: 3, label: 'Execução', status: 'Em andamento', color: 'blue', pulse: true },
                        { step: 4, label: 'Encerramento', status: 'Pendente', color: 'gray' }
                     ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center group">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-black transition-all border-2 
                              ${s.color === 'emerald' ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                                s.color === 'blue' ? 'bg-black border-blue-500 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.2)]' : 
                                'bg-black border-white/10 text-gray-600'}`}>
                              {s.step}
                           </div>
                           <div className="text-center mt-3">
                              <p className={`text-[12px] font-bold ${s.color === 'gray' ? 'text-gray-600' : 'text-gray-200'}`}>{s.label}</p>
                              <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${s.color === 'emerald' ? 'text-emerald-500' : s.color === 'blue' ? 'text-blue-500' : 'text-gray-700'}`}>
                                 {s.status}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-[#0b0f19] border border-white/5 p-5 rounded-2xl group hover:border-white/20 hover:bg-[#0d121e] transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full"></div>
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                           <ClipboardCheck className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Progresso Real</p>
                           <h3 className="text-2xl font-black text-white tracking-tighter mt-1">{Math.round(progresso * 100)}%</h3>
                           <p className="text-xs text-gray-400 mt-1 font-medium">{itensRespondidos} de {items.length}</p>
                        </div>
                     </div>
                  </div>
                  <div className="bg-[#0b0f19] border border-white/5 p-5 rounded-2xl group hover:border-white/20 hover:bg-[#0d121e] transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full"></div>
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                           <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Conformidade</p>
                           <h3 className="text-2xl font-black text-white tracking-tighter mt-1">{Math.round(conformidade * 100)}%</h3>
                           <p className="text-xs text-gray-400 mt-1 font-medium">{conformidade > 0.7 ? 'Seguro' : 'Auditado'}</p>
                        </div>
                     </div>
                  </div>
                  <div className="bg-[#0b0f19] border border-white/5 p-5 rounded-2xl group hover:border-white/20 hover:bg-[#0d121e] transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[40px] rounded-full"></div>
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                           <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Desvios IA</p>
                           <h3 className="text-2xl font-black text-white tracking-tighter mt-1">{ncsDetectadasCount}</h3>
                           <p className="text-xs text-gray-400 mt-1 font-medium">Riscos Críticos</p>
                        </div>
                     </div>
                  </div>
                  <div className="bg-[#0b0f19] border border-white/5 p-5 rounded-2xl group hover:border-white/20 hover:bg-[#0d121e] transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-[40px] rounded-full"></div>
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                           <Zap className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Ações Sugeridas</p>
                           <h3 className="text-2xl font-black text-white tracking-tighter mt-1">{acoesGeradasCount}</h3>
                           <p className="text-xs text-gray-400 mt-1 font-medium">Prioridade Alta</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-y border-white/5">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                     Processo Auditoria
                     <span className="text-[12px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400 font-bold uppercase tracking-widest">{items.length} ITENS</span>
                  </h2>
                  <div className="flex gap-3 w-full md:w-auto">
                     <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                           type="text" 
                           placeholder="Buscar item..."
                           className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  {items.map((item, idx) => {
                     const isSim = item.status === 'Sim';
                     const isNao = item.status === 'Não';
                     const isParcial = item.status === 'Parcialmente';
                     const isNA = item.status === 'N/A';

                     return (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`bg-[#0b0f19]/40 border rounded-2xl p-5 lg:p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6 transition-all group relative
                            ${isNao ? 'border-red-500/30 bg-red-500/[0.02]' : isParcial ? 'border-orange-500/30 bg-orange-500/[0.02]' : 'border-white/5 hover:border-white/20'}`}
                        >
                           <div className="w-12 h-12 rounded-xl border border-white/5 bg-black flex items-center justify-center shrink-0 text-xl font-black text-gray-700 shadow-inner group-hover:text-purple-500 transition-colors">
                              {idx + 1}
                           </div>
                           
                           <div className="flex-1 space-y-3">
                              <div>
                                 <p className="text-base lg:text-lg font-bold text-white group-hover:text-purple-100 transition-colors leading-tight mb-2">{item.text}</p>
                                 <div className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1.5 bg-blue-500/10 text-xs font-black text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                       <Activity className="w-3.5 h-3.5" /> Normativa: NR-{item.nr || '35.5'}
                                    </span>
                                    <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest
                                       ${item.riskMap === 'Crítica' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                                         item.riskMap === 'Alta' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                         'bg-white/5 text-gray-400 border-white/10'}`}
                                    >
                                       {item.riskMap === 'Crítica' && <ShieldAlert className="w-3.5 h-3.5" />}
                                       Impacto: {item.riskMap}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {[
                                 { label: 'Sim', value: 'Sim', color: 'emerald', icon: CheckCircle2 },
                                 { label: 'Não', value: 'Não', color: 'red', icon: XCircle },
                                 { label: 'Parcial', value: 'Parcialmente', color: 'orange', icon: AlertCircle },
                                 { label: 'N/A', value: 'N/A', color: 'gray', icon: null }
                              ].map((btn) => (
                                 <button 
                                    key={btn.value}
                                    onClick={() => handleAnswer(idx, btn.value)}
                                    className={`h-12 px-5 rounded-xl text-sm font-black transition-all border flex items-center justify-center gap-2 active:scale-95
                                    ${item.status === btn.value ? 
                                       `bg-${btn.color}-500/10 border-${btn.color}-500 text-${btn.color}-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]` : 
                                       'bg-[#03060e] border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                 >
                                    {btn.label} {item.status === btn.value && btn.icon && <btn.icon className="w-4 h-4" />}
                                 </button>
                              ))}
                              
                              <button className="h-12 w-12 flex items-center justify-center text-gray-500 hover:text-purple-400 transition-all hover:bg-purple-500/10 rounded-xl ml-1 active:scale-90 border border-white/5">
                                 <FileText className="w-5 h-5" />
                              </button>
                           </div>
                        </motion.div>
                     );
                  })}
               </div>
            </div>
         </div>

         <div className="w-[450px] bg-[#0b0f19] border-l border-white/5 shrink-0 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-20">
            <div className="p-8 border-b border-white/5 bg-[#0d121e]/80 backdrop-blur-md">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl border border-purple-400/30 shadow-[0_10px_30px_rgba(124,58,237,0.4)]">
                        <Zap className="w-7 h-7" />
                     </div>
                     <div>
                        <h3 className="font-black text-white text-2xl tracking-tighter uppercase">Audit Vision</h3>
                        <p className="text-[11px] text-purple-400 font-black uppercase tracking-[0.2em] mt-1">Análise em tempo real</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-xs font-black text-emerald-500 uppercase">ATIVO</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
                     <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-3">Riscos de Auditoria</p>
                     <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-6xl font-black tracking-tighter ${ncsDetectadasCount > 0 ? 'text-red-500' : 'text-gray-700'}`}>{ncsDetectadasCount}</span>
                        <span className="text-sm text-gray-500 font-bold ml-1">DETECTADOS</span>
                     </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                     <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-3">Health Score</p>
                     <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-6xl font-black tracking-tighter ${conformidade > 0.8 ? 'text-emerald-500' : conformidade > 0.5 ? 'text-orange-400' : 'text-red-500'}`}>
                           {Math.round(conformidade * 100)}
                        </span>
                        <span className="text-sm text-gray-500 font-bold ml-1">PTS</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.25em] pl-1">Matriz de Desvios</h4>
                  <AnimatePresence mode="popLayout">
                     {risks.map((nc, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-[#121826]/80 border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden group hover:border-red-500/20 transition-all shadow-xl"
                        >
                           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] blur-3xl rounded-full"></div>
                           
                           <div className="flex gap-5 relative z-10">
                              <div className="w-1.5 h-auto bg-gradient-to-b from-red-500 to-red-800 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                              <div>
                                 <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Risco Detalhado</p>
                                 <p className="text-xl font-bold text-white mt-1.5 leading-snug tracking-tighter italic">&quot;{nc.text}&quot;</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3 relative z-10">
                              <div className="bg-black/60 p-4 rounded-2xl border border-white/5">
                                 <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1.5">Severidade</p>
                                 <p className={`text-sm font-black uppercase ${nc.severidade === 'Crítica' ? 'text-red-500' : 'text-orange-400'}`}>{nc.severidade}</p>
                              </div>
                              <div className="bg-black/60 p-4 rounded-2xl border border-white/5">
                                 <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1.5">Impacto Financeiro</p>
                                 <p className="text-sm font-black uppercase text-gray-200">{nc.multa}</p>
                              </div>
                           </div>

                           <div className="space-y-4 relative z-10">
                              <div className="flex justify-between items-end">
                                 <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">Probabilidade Incidente</p>
                                 <span className={`text-sm font-black ${nc.chance > 60 ? 'text-red-500' : 'text-orange-400'}`}>{nc.chance}%</span>
                              </div>
                              <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${nc.chance}%` }}
                                    className={`h-full relative shadow-[0_0_10px_rgba(239,68,68,0.5)] ${nc.chance > 60 ? 'bg-red-500' : 'bg-orange-500'}`}
                                 />
                              </div>
                           </div>

                           <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-[14px] leading-relaxed relative z-10 group-hover:bg-red-500/[0.03] transition-colors">
                              <div className="flex items-start gap-4">
                                 <ClipboardCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                 <div className="space-y-2">
                                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Ação Corretiva</p>
                                    <p className="text-gray-300 font-medium italic">&quot;{nc.acaoSugerida}&quot;</p>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>

                  {risks.length === 0 && (
                     <div className="py-24 flex flex-col items-center justify-center text-center px-12 space-y-6 opacity-40">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                           <ShieldCheck className="w-10 h-10 text-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-lg text-gray-400 font-black uppercase tracking-widest">Protocolo Zero Desvio</h4>
                           <p className="text-sm text-gray-600 leading-relaxed font-medium max-w-xs mx-auto">O radar de segurança não detectou inconformidades críticas no momento.</p>
                        </div>
                     </div>
                  )}

                  {/* Ações Geradas Section */}
                  {store.acoes?.filter((a) => a.inspecaoId === inspection.id).length > 0 && (
                     <div className="mt-12 space-y-6">
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.25em] pl-1">Ações Corretivas Geradas</h4>
                        <div className="space-y-4">
                           {store.acoes.filter((a) => a.inspecaoId === inspection.id).map((acao) => (
                              <div key={acao.id} className="bg-[#121826]/80 border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                                 <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-1"
                                      style={{
                                        backgroundColor: acao.status === 'Concluída' ? 'rgba(16, 185, 129, 0.1)' : acao.status === 'Vencida' ? 'rgba(239, 68, 68, 0.1)' : acao.status === 'Em andamento' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                        borderColor: acao.status === 'Concluída' ? 'rgba(16, 185, 129, 0.2)' : acao.status === 'Vencida' ? 'rgba(239, 68, 68, 0.2)' : acao.status === 'Em andamento' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                        color: acao.status === 'Concluída' ? '#10b981' : acao.status === 'Vencida' ? '#ef4444' : acao.status === 'Em andamento' ? '#3b82f6' : '#f97316'
                                      }}>
                                    {acao.status === 'Concluída' ? <CheckCircle2 className="w-5 h-5" /> : acao.status === 'Vencida' ? <AlertCircle className="w-5 h-5" /> : acao.status === 'Em andamento' ? <Play className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                       <h5 className="text-sm font-bold text-white leading-snug">{acao.titulo}</h5>
                                       <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                                             style={{
                                                backgroundColor: acao.status === 'Concluída' ? 'rgba(16, 185, 129, 0.1)' : acao.status === 'Vencida' ? 'rgba(239, 68, 68, 0.1)' : acao.status === 'Em andamento' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                                borderColor: acao.status === 'Concluída' ? 'rgba(16, 185, 129, 0.2)' : acao.status === 'Vencida' ? 'rgba(239, 68, 68, 0.2)' : acao.status === 'Em andamento' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                                color: acao.status === 'Concluída' ? '#10b981' : acao.status === 'Vencida' ? '#ef4444' : acao.status === 'Em andamento' ? '#3b82f6' : '#f97316'
                                             }}>
                                          {acao.status}
                                       </span>
                                    </div>
                                    <div className="text-[12px] text-gray-400 space-y-1">
                                       <p className="truncate"><span className="text-gray-500">Responsável:</span> {acao.responsavel}</p>
                                       <p><span className="text-gray-500">Prazo:</span> {acao.prazo} <span className="text-gray-600 mx-2">|</span> <span className="text-gray-500">Prioridade:</span> <span className={acao.prioridade === 'Crítica' ? 'text-red-400' : acao.prioridade === 'Alta' ? 'text-orange-400' : 'text-emerald-400'}>{acao.prioridade}</span></p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-[#0b0f19] space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative z-30">
               <div className="flex gap-3">
                  <button 
                     onClick={handleSalvar}
                     disabled={isSaving}
                     className="flex-1 py-5 rounded-3xl border border-white/10 text-gray-400 font-black text-[12px] uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {isSaving ? 'Salvando...' : 'Salvar Respostas'}
                  </button>
                  <button 
                     onClick={handleConfirmarConclusao}
                     className="flex-[2] py-5 rounded-3xl border border-purple-500/50 text-white font-black text-[12px] uppercase tracking-[0.2em] bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 transition-all shadow-[0_15px_40px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 active:scale-95 group"
                  >
                     Concluir Inspeção <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {confirmExitOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setConfirmExitOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0f19] border border-white/10 rounded-[32px] p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Sair sem salvar?</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Existem respostas não salvas. Se você sair agora, as alterações temporárias serão descartadas.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setConfirmExitOpen(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                >
                  Continuar respondendo
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
                >
                  Sair sem salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Completion Confirmation Modal */}
      <AnimatePresence>
        {confirmCompleteOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setConfirmCompleteOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0f19] border border-white/10 rounded-[40px] p-10 max-w-lg w-full relative z-10 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">Confirmar conclusão</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Tem certeza que esta inspeção foi concluída? O status será alterado e ela será enviada para o histórico de Realizadas.</p>
              
              <div className="w-full bg-black/40 rounded-3xl p-6 mb-10 text-left space-y-4 border border-white/5">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Itens Respondidos</span>
                  <span className="text-white font-bold">{itensRespondidos} de {items.length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Conformidade Final</span>
                  <span className={`font-black ${conformidade > 0.7 ? 'text-emerald-400' : 'text-orange-400'}`}>{Math.round(conformidade * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Riscos/Ações Geradas</span>
                  <span className="text-red-400 font-bold">{ncsDetectadasCount}</span>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setConfirmCompleteOpen(false)}
                  className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeConcluir}
                  className="flex-[1.5] py-5 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"
                >
                  Confirmar Conclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getAcaoSugerida(text: string) {
  const t = text.toLowerCase();
  if (t.includes('cinto')) return 'Treinar colaborador no uso correto do cinto paraquedista e talabarte duplo, garantindo ancoragem adequada acima da cabeça.';
  if (t.includes('linha de vida')) return 'Interromper atividade até que a linha de vida seja inspecionada, testada e certificada por profissional habilitado.';
  if (t.includes('isolada') || t.includes('sinalizada')) return 'Instalar barreiras físicas e sinalização de advertência conforme NR-35.4.6 para evitar acidentes com queda de objetos.';
  if (t.includes('permissão') || t.includes('pt')) return 'Paralisar frentes de serviço até emissão e assinatura da Permissão de Trabalho (PT) por todos os envolvidos.';
  if (t.includes('ancoragem')) return 'Avaliar integridade estrutural do ponto de ancoragem e validar resistência mínima exigida pelas normas técnicas.';
  if (t.includes('ferramentas')) return 'Implementar o uso de alças de segurança (leashes) em todas as ferramentas manuais e equipamentos portáteis.';
  if (t.includes('climáticas')) return 'Suspender trabalhos em altura em caso de ventos fortes, chuvas ou descargas elétricas conforme análise de risco local.';
  return 'Realizar correção imediata do desvio identificado e registrar evidência fotográfica da conformidade restabelecida.';
}

function getAcaoTitulo(text: string) {
  const t = text.toLowerCase();
  if (t.includes('linha de vida')) return 'Regularizar linha de vida';
  if (t.includes('epi')) return 'Regularizar EPI obrigatório';
  if (t.includes('bloqueio elétrico') || t.includes('bloqueio eletrico')) return 'Regularizar bloqueio e etiquetagem';
  if (t.includes('espaço confinado') || t.includes('espaco confinado')) return 'Regularizar procedimento de entrada em espaço confinado';
  if (t.includes('máquina') || t.includes('maquina') || t.includes('proteção') || t.includes('protecao')) return 'Regularizar proteção de máquina/equipamento';
  if (t.includes('químico') || t.includes('quimico')) return 'Regularizar controle de produto químico';
  return 'Tratar não conformidade identificada na inspeção';
}
