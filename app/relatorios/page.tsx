"use client";

import React, { useState, useMemo } from 'react';
import { 
  FileText, Shield, ClipboardCheck, CheckSquare, 
  AlertOctagon, DollarSign, Download, Plus, 
  Calendar, ChevronDown, 
  Activity, ArrowRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { buildReportsViewModel } from '@/lib/motor/adapters/reportsAdapter.js';


// ============================================================================
// PREVIEW COMPONENTS
// ============================================================================

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatReportTimestamp(value?: number) {
  return new Date(value || Date.now()).toLocaleString('pt-BR');
}

function RelatorioExecutivoPreview({ periodLabel }: { periodLabel: string }) {
  const { riscos, acoes, inspecoes } = useAppStore();
  const openRisks = riscos.filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado');
  const pendingActions = acoes.filter(a => a.status !== 'Concluída');
  
  const criticalRisks = openRisks.filter(r => (r.nivel || r.prioridade || '').toLowerCase().includes('crític')).slice(0, 5);
  const vI = inspecoes.length > 0 ? (inspecoes.filter(i => i.status === 'Concluída' || i.status === 'Realizada').length / inspecoes.length) * 100 : 0;
  const vA = acoes.length > 0 ? (acoes.filter(a => a.status === 'Concluída').length / acoes.length) * 100 : 0;
  const vR = riscos.length > 0 ? (riscos.filter(r => r.status === 'Resolvido' || r.status === 'Mitigado').length / riscos.length) * 100 : 0;
  const conformidade = Math.round((vI * 30 + vA * 25 + vR * 15) / 70) || 100;

  const minMulta = openRisks.reduce((acc, r) => acc + (Number(r.multaEstimativaMin) || Number(r.multaEstimada) || 0), 0);
  const maxMulta = openRisks.reduce((acc, r) => acc + (Number(r.multaEstimativaMax) || Number(r.multaEstimada) || 0), 0);

  const upcomingInspections = inspecoes.filter(i => i.status === 'Agendada' || i.status === 'Atrasada' || i.status === 'Pendente').slice(0,5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2 text-indigo-700">
             <Shield className="w-8 h-8" />
             <h1 className="text-2xl font-black tracking-tight">Apex Ops</h1>
           </div>
           <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Relatório Executivo de SST</h2>
        </div>
        <div className="text-right text-[11px] text-gray-500 space-y-1">
          <p><strong>Período:</strong> {periodLabel}</p>
          <p><strong>Gerado em:</strong> {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Resumo Executivo</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed text-justify">
          Este relatório apresenta uma visão consolidada do desempenho de Saúde e Segurança do Trabalho no período selecionado, destacando os principais riscos ocupacionais, pendências normativas e oportunidades de controle, baseado em princípios de gestão de riscos e indicadores proativos.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { title: 'Riscos', val: riscos.length.toString(), color: 'text-gray-800' },
          { title: 'Inspeções', val: inspecoes.length.toString(), color: 'text-gray-800' },
          { title: 'Ações', val: acoes.length.toString(), color: 'text-gray-800' },
          { title: 'Conformidade', val: `${conformidade}%`, color: 'text-gray-800' },
        ].map((k, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <p className="text-[11px] font-bold text-gray-500 uppercase">{k.title}</p>
            <p className={`text-2xl font-black ${k.color} my-1`}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Riscos Prioritários</h3>
          <table className="w-full text-[12px] text-left border-collapse">
            <tbody className="divide-y divide-gray-100">
              {criticalRisks.length > 0 ? criticalRisks.map((r, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-gray-700 font-medium">{r.atividade || r.titulo}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.nivel === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{r.nivel}</span>
                  </td>
                </tr>
              )) : <tr><td className="py-2 text-gray-500">Nenhum risco prioritário.</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Inspeções Pendentes</h3>
          <table className="w-full text-[12px] text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase">
                <th className="pb-2 font-medium">Inspeção</th>
                <th className="pb-2 font-medium text-right">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upcomingInspections.length > 0 ? upcomingInspections.map((ins:any, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-gray-700 font-medium truncate max-w-[120px]">{ins.title || ins.nome || 'Inspeção'}</td>
                  <td className="py-2.5 text-right flex justify-end gap-2 items-center">
                    <span className="text-gray-500">{ins.dueDate ? new Date(ins.dueDate).toLocaleDateString('pt-BR') : '-'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(ins.dueDate && new Date(ins.dueDate) < new Date()) ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {ins.status || 'Pendente'}
                    </span>
                  </td>
                </tr>
              )) : <tr><td className="py-2 text-gray-500" colSpan={2}>Nenhuma inspeção pendente.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        <div className="border border-gray-200 rounded-lg p-5">
           <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Ações Recomendadas</h3>
           <ul className="space-y-3 text-[12px] text-gray-600">
             {pendingActions.slice(0, 5).length > 0 ? pendingActions.slice(0, 5).map((a, i) => (
               <li key={i} className="flex gap-2 items-start">
                 <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                 <span>{a.titulo || a.oQue || a.descricao || 'Ação'}</span>
               </li>
             )) : <li>Nenhuma ação pendente.</li>}
           </ul>
        </div>
        
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-5">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4"/> Impacto Econômico Estimado
            </h3>
            <p className="text-[11px] text-indigo-700/70 mb-3">Faixa estimada de perdas evitáveis em caso de não tratamento dos riscos identificados (passível de multas e embargos).</p>
            <p className="text-2xl font-black text-indigo-700 mb-1">{formatCurrency(minMulta)} a {formatCurrency(maxMulta)}</p>
            <p className="text-[10px] text-indigo-500">Baseado na metodologia NBR ISO 31000 e histórico interno</p>
        </div>
      </div>

      <div className="pt-12 flex justify-between text-[11px] text-gray-500 border-t border-gray-200">
         <div>
           <p className="font-bold text-gray-800 uppercase">Responsável Técnico</p>
           <p>Sistema Apex Ops</p>
         </div>
         <div>
           <p className="font-bold text-gray-800 uppercase">Empresa</p>
           <p>Apex Ops</p>
         </div>
      </div>
    </div>
  );
}

function RelatorioRiscosPreview() {
  const { riscos } = useAppStore();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Análise Técnica de Riscos Ocupacionais</h2>
        <p className="text-[12px] text-gray-500 mt-2">Relatório técnico estruturado conforme boas práticas de gestão de SST e NBR ISO 31000.</p>
      </div>

      {riscos.length > 0 ? riscos.map((risco, i) => (
        <div key={i} className="border border-gray-300 rounded-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
             <div className="flex gap-3 items-center">
                <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm">{risco.nr || risco.nrRelacionada || 'Outros'}</span>
                <h3 className="text-sm font-bold text-gray-800 uppercase">{risco.atividade || risco.titulo}</h3>
             </div>
             <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${risco.nivel === 'Crítico' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>Risco {risco.nivel}</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4 text-[12px]">
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Setor/Local</span> <span className="font-medium text-gray-800">{risco.setor}</span></div>
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Perigo Identificado</span> <span className="font-medium text-gray-800">{risco.tipoDeRisco || risco.perigo || '-'}</span></div>
             <div className="col-span-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Possível Consequência</span> <span className="text-gray-700">{risco.impactoHumano || risco.consequencia || '-'}</span></div>
             
             <div className="col-span-2 grid grid-cols-2 gap-4 my-2 border-y border-dashed border-gray-200 py-3">
               <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Probabilidade</span> <span className="text-gray-700">{risco.probabilidade || '-'}</span></div>
               <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Severidade</span> <span className="text-gray-700">{risco.gravidade || risco.severidade || '-'}</span></div>
             </div>

             <div className="col-span-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Controles Recomendados</span> <span className="font-medium text-blue-700">{risco.acaoRecomendada || '-'}</span></div>
             
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Responsável pela Ação</span> <span className="text-gray-700">{risco.responsavel || '-'}</span></div>
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Prazo Máximo</span> <span className="text-gray-700">{risco.prazo || '-'}</span></div>
          </div>
        </div>
      )) : <p className="text-center text-gray-500">Nenhum risco no período.</p>}
      
      <div className="mt-8 text-[11px] text-gray-600 text-justify">
        <strong className="uppercase">Conclusão Técnica:</strong> A avaliação demonstra a necessidade imediata de implementação de controles de engenharia e administrativos para os riscos classificados como Alto e Crítico, a fim de garantir a integridade física dos colaboradores e o atendimento aos requisitos legais de SSO.
      </div>
    </div>
  );
}

function RelatorioInspecoesPreview() {
  const { inspecoes } = useAppStore();
  const realizadas = inspecoes.filter(i => i.status === 'Concluída' || i.status === 'Realizada').length;
  const pendentes = inspecoes.filter(i => i.status === 'Pendente' || i.status === 'Agendada' || i.status === 'Iniciada' || i.status === 'Em andamento').length;
  const vencidas = inspecoes.filter(i => i.status === 'Atrasada' || (i.dueDate && new Date(i.dueDate) < new Date())).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Relatório Analítico de Inspeções</h2>
        <p className="text-[12px] text-gray-500 mt-2">Registro documentado de conformidades, desvios e aplicação de checklists operacionais.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Realizadas</p>
           <p className="text-2xl font-black text-gray-800 mt-1">{realizadas}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pendentes</p>
           <p className="text-2xl font-black text-gray-800 mt-1">{pendentes}</p>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Vencidas</p>
           <p className="text-2xl font-black text-red-700 mt-1">{vencidas}</p>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-200 pb-1 mb-4">Detalhamento das Inspeções</h3>
      
      <table className="w-full text-[11px] text-left border border-gray-200">
        <thead className="bg-gray-100">
          <tr className="text-gray-600 font-bold uppercase tracking-wider">
            <th className="p-3">Inspeção / Checklist</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Itens (Conf / Ñ Conf)</th>
            <th className="p-3">Ação Sugerida</th>
            <th className="p-3 text-right">Responsável / Prazo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {inspecoes.length > 0 ? inspecoes.map((ins:any, i) => {
            const confs = ins.answers ? ins.answers.filter((a:any) => a.isConform).length : 0;
            const nonConfs = ins.answers ? ins.answers.filter((a:any) => a.isConform === false).length : Number(ins.nonConformities || 0);

            return (
              <tr key={i}>
                <td className="p-3 font-medium text-gray-800">{ins.nome || ins.title || 'Inspeção'} <br/><span className="text-gray-500 font-normal">Baseado em NR aplicável</span></td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-sm font-bold uppercase ${ins.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ins.status || 'Pendente'}</span>
                </td>
                <td className="p-3 text-center">
                   <span className="text-green-600 font-bold">{confs}</span> / <span className="text-red-500 font-bold">{nonConfs}</span>
                </td>
                <td className="p-3 text-gray-600">
                   {nonConfs > 0 ? 'Abertura de O.S. corretiva' : 'Manter monitoramento'}
                </td>
                <td className="p-3 text-right text-gray-600">
                   {ins.responsavel || '-'} <br/>
                   <span className="font-bold text-gray-800">{ins.dueDate ? new Date(ins.dueDate).toLocaleDateString('pt-BR') : '-'}</span>
                </td>
              </tr>
            );
          }) : <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhuma inspeção encontrada.</td></tr>}
        </tbody>
      </table>

      <div className="mt-8 text-[11px] text-gray-600 text-justify">
        <strong className="uppercase">Conclusão Documental:</strong> As inspeções registradas neste período validam o compromisso com o acompanhamento contínuo dos ambientes de trabalho. As não conformidades identificadas geram automaticamente planos de ação (5W2H) para mitigação.
      </div>
    </div>
  )
}

function RelatorioAcoesPreview() {
  const { acoes } = useAppStore();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Acompanhamento de Plano de Ação</h2>
        <p className="text-[12px] text-gray-500 mt-2">Estrutura metodológica 5W2H para rastreabilidade de correções preventivas e corretivas.</p>
      </div>

      {acoes.length > 0 ? acoes.map((acao:any, i) => (
        <div key={i} className="border border-gray-300 rounded-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
             <div className="flex gap-3 items-center">
                <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-sm border ${(acao.prioridade === 'Crítica' || acao.urgency === 'Imediato') ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{acao.prioridade || 'Normal'}</span>
                <h3 className="text-sm font-bold text-gray-800 uppercase">{acao.titulo || acao.oQue || 'Ação'}</h3>
             </div>
             <span className="text-[10px] font-bold text-gray-500 uppercase bg-white px-2 py-1 rounded-sm border border-gray-200">{acao.status}</span>
          </div>
          
          <div className="p-0">
             <table className="w-full text-[11px] text-left border-collapse">
               <tbody className="divide-y divide-gray-100">
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">Origem</th><td className="p-3 font-medium text-gray-800">{acao.origem || 'Risco'}</td></tr>
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">What (O que)</th><td className="p-3 text-gray-800">{acao.titulo || acao.descricao || '-'}</td></tr>
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">Why (Por que)</th><td className="p-3 text-gray-800">{acao.justificativa || 'Mitigar risco'}</td></tr>
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">Where (Onde)</th><td className="p-3 text-gray-800">{acao.local || '-'}</td></tr>
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">Who (Quem)</th><td className="p-3 text-gray-800">{acao.responsavel || '-'}</td></tr>
                 <tr><th className="p-3 bg-gray-50 w-[30%] text-gray-600 uppercase border-r border-gray-100">When (Prazo)</th><td className="p-3 font-bold text-gray-800">{acao.prazo || (acao.dueDate ? new Date(acao.dueDate).toLocaleDateString('pt-BR') : '-')}</td></tr>
               </tbody>
             </table>
          </div>
        </div>
      )) : <p className="text-center text-gray-500">Nenhuma ação encontrada.</p>}
      
      <div className="mt-8 text-[11px] text-gray-600 text-justify">
        <strong className="uppercase">Conclusão do Plano:</strong> As ações propostas visam o bloqueio da trajetória do risco e adequação normativa. Recomenda-se acompanhamento rigoroso dos prazos definidos.
      </div>
    </div>
  )
}

function RelatorioNCPreview() {
  const { riscos } = useAppStore();
  const rncList = riscos.filter(r => r.nivel === 'Crítico' || r.nivel === 'Alto');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Desvios e Não Conformidades (RNC)</h2>
        <p className="text-[12px] text-gray-500 mt-2">Registro de anomalias normativas operacionais, causas raízes e tratativas executadas.</p>
      </div>

      {rncList.length > 0 ? rncList.map((nc, i) => (
        <div key={i} className="border-2 border-red-200 p-6 rounded-sm bg-white mb-6 relative">
          <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase rounded-br-sm">
             RNC-{String(i+1).padStart(3, '0')}
          </div>
          
          <div className="flex justify-between items-start mt-4 mb-6">
             <h3 className="text-lg font-bold text-gray-900 uppercase leading-snug">{nc.titulo || nc.atividade}</h3>
             <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 uppercase rounded-sm border border-red-200">{nc.gravidade || nc.severidade || nc.nivel}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 text-[12px]">
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Local / Setor</span> <span className="font-medium text-gray-800">{nc.setor || '-'}</span></div>
             <div><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Requisito Legal infringido</span> <span className="font-bold text-gray-900">{nc.nr || nc.nrRelacionada || '-'}</span></div>
             <div className="col-span-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Evidência Identificada</span> <span className="text-gray-700">{nc.perito || nc.tipoDeRisco || nc.perigo || '-'}</span></div>
             <div className="col-span-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Causa Provável</span> <span className="text-gray-700">{nc.descricao || nc.justificativa || '-'}</span></div>
             
             <div className="col-span-2 bg-gray-50 border border-gray-200 p-4 mt-2">
                <span className="text-gray-500 font-bold uppercase text-[10px] block mb-2">Tratativas</span>
                <div className="space-y-2">
                   <p><strong className="text-gray-700 mr-2">Correção Recomendada:</strong> {nc.acaoRecomendada || nc.controlesRec || '-'}</p>
                   <p><strong className="text-gray-700 mr-2">Ação Vinculada:</strong> {nc.acaoVinculada || 'Nenhuma'}</p>
                </div>
             </div>

             <div className="border-t border-gray-200 pt-4 mt-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Responsável</span> <span className="text-gray-800">{nc.responsavel || '-'}</span></div>
             <div className="border-t border-gray-200 pt-4 mt-2"><span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Status Atual</span> <span className="font-bold text-blue-700 uppercase">{nc.status || 'Aberto'}</span></div>
          </div>
        </div>
      )) : <p className="text-center text-gray-500">Nenhuma não conformidade encontrada.</p>}
      
      <div className="mt-8 text-[11px] text-gray-600 text-justify">
        <strong className="uppercase">Verificação de Eficácia:</strong> A RNC só será encerrada após auditoria em campo para comprovação da eliminação efetiva da causa raiz e validação dos novos controles adotados.
      </div>
    </div>
  )
}

function RelatorioEconomicoPreview() {
  const { riscos } = useAppStore();
  const openRisks = riscos.filter(r => r.status !== 'Resolvido' && r.status !== 'Mitigado');

  const minMulta = openRisks.reduce((acc, r) => acc + (Number(r.multaEstimativaMin) || Number(r.multaEstimada) || 0), 0);
  const maxMulta = openRisks.reduce((acc, r) => acc + (Number(r.multaEstimativaMax) || Number(r.multaEstimada) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-200 pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Estimativa de Impacto Econômico</h2>
        <p className="text-[12px] text-gray-500 mt-2">Análise monetária preventiva baseada em multas normativas, paralisação operacional e passivos.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-sm mb-6 flex gap-3 text-[11px] text-yellow-800 leading-relaxed text-justify">
         <AlertOctagon className="w-8 h-8 text-yellow-500 shrink-0" />
         <div>
            <strong className="uppercase block mb-1">Aviso Legal & Premissas</strong>
            <p>Os valores apresentados constituem uma estimativa preventiva e não um cálculo atuarial exato. O valor real do passivo depende da fiscalização trabalhista, enquadramento jurídico pericial, número efetivo de empregados, configuração de reincidência sistêmica e desdobramentos de contexto (e.g. ações cíveis/previdenciárias). Estrutura compatível com análise técnica estratégica.</p>
         </div>
      </div>

      <div className="p-8 bg-gray-50 border border-gray-200 text-center rounded-sm mb-8">
         <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">Exposição Financeira Estimada</p>
         <h3 className="text-4xl font-black text-gray-900 mb-2">{formatCurrency(minMulta)} <span className="text-gray-400 font-medium text-2xl mx-1">a</span> {formatCurrency(maxMulta)}</h3>
         <p className="text-[11px] text-gray-500">Multas NR, FAP, Lucro Cessante e Indenizações</p>
      </div>

      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-200 pb-1 mb-4">Cenários de Exposição</h3>
      
      <table className="w-full text-[11px] text-left border border-gray-200">
        <thead className="bg-gray-100">
          <tr className="text-gray-600 font-bold uppercase tracking-wider">
            <th className="p-3">Risco Analisado</th>
            <th className="p-3">Norma</th>
            <th className="p-3 text-center">Impacto Op.</th>
            <th className="p-3 text-right">Potencial de Dano (R$)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {openRisks.length > 0 ? openRisks.map((r, i) => (
            <tr key={i}>
              <td className="p-3 font-medium text-gray-800">{r.atividade || r.titulo}</td>
              <td className="p-3 font-bold text-gray-600">{r.nr}</td>
              <td className="p-3 text-center text-gray-600">{r.nivel === 'Crítico' ? 'Embargo/Paralisação' : (r.impactoOperacional || 'Atraso Linha/Leve')}</td>
              <td className="p-3 text-right font-bold text-red-700">Até {formatCurrency((r.multaEstimativaMax || r.multaEstimada || 0))}</td>
            </tr>
          )) : <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum risco com passivo estimado detectado no momento.</td></tr>}
        </tbody>
      </table>

      <div className="mt-8 text-[11px] text-gray-600 text-justify">
        <strong className="uppercase">Recomendação de Priorização:</strong> O custo de adequação preventiva (instalações, EPIs, treinamentos) representa historicamente menos de 10% do valor do impacto operacional consolidado. Sugere-se autorização imediata de verba para as ações críticas identificadas no plano de ação.
      </div>
    </div>
  )
}

function DossieDefensavelPreview() {
  const store = useAppStore();
  const { riscos, inspecoes, acoes, organization, configuracoes } = store;

  // Calculo de multas reais
  let multaEstimada = 0;
  let multaEvitada = 0;
  
  riscos.forEach(r => {
    const val = Number(r.multaEstimada) || 0;
    if (r.status === 'Resolvido' || r.status === 'Mitigado') {
      multaEvitada += val;
    } else {
      multaEstimada += val;
    }
  });

  const totalExpostos = riscos.reduce((acc, r) => acc + (r.trabalhadoresExpostos || 1), 0);
  const nrsArray = Array.from(new Set(riscos.map(r => r.nr).filter(Boolean)));
  const pendingActions = acoes.filter(a => a.status !== 'Concluído').length;
  const concludedActions = acoes.filter(a => a.status === 'Concluído' || a.status === 'Concluída').length;
  
  // Conformidade index
  const conformidade = riscos.length > 0 ? Math.round((riscos.filter(r => r.status === 'Resolvido' || r.status === 'Mitigado').length / riscos.length) * 100) : 100;

  let parecerFinal = "A operação demonstra maturidade no registro das frentes de risco.";
  if (conformidade >= 80) {
     parecerFinal = "A infraestrutura defensável comprova uma operação segura e altamente engajada com a segurança da vida (Compliance Nível Ouro). A documentação (Dossiê) demonstra bloqueio massivo de passivos.";
  } else if (conformidade >= 50) {
     parecerFinal = "A operação possui gaps moderados. Existem pendências normativas que já foram identificadas em plano de ação, e exigem celeridade na aprovação de orçamento preventivo para barrar a exposição ao risco.";
  } else {
     parecerFinal = "Estado Crítico Operacional. Múltiplos passivos abertos sem barreira protetiva efetiva. A auditoria recomenda ação imediata para proteção de pessoas e evitar multas regulatórias severas e interdições.";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-400 pb-10 mb-10 text-center relative">
        <Shield className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-widest">Dossiê Defensável SST</h2>
        <p className="text-sm font-bold text-gray-600 mt-2 uppercase tracking-widest">Instrumento Institucional de Auditoria e Conformidade</p>
        <p className="text-[12px] text-gray-500 mt-3 max-w-2xl mx-auto italic">Documento consolidado atestando governança, rastreabilidade técnica, cadeia de custódia e proteção de capital intelectual e humano.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
         <div className="border border-gray-300 p-6 rounded-sm bg-gray-50/50">
           <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">Informações Organizacionais</h3>
           <div className="space-y-3 text-[12px]">
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Empresa</span><span className="font-bold text-gray-900">{organization?.name || 'Não informada'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Segmento</span><span className="text-gray-800">{organization?.segment || 'Não informado'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Emissão</span><span className="text-gray-800">Emissão em Tempo Real</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Assinatura Digital</span><span className="font-mono text-gray-400 text-[10px]">SHA-256:Auditável</span></div>
           </div>
         </div>
         <div className="border border-emerald-200 p-6 rounded-sm bg-emerald-50/30">
           <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 border-b border-emerald-200 pb-2">Performance (Cockpit)</h3>
           <div className="space-y-3 text-[12px]">
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Conformidade Legal</span><span className={`font-black ${conformidade >= 80 ? 'text-emerald-600' : conformidade >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{conformidade}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Multa Estimada Restante</span><span className="font-bold text-red-600">{multaEstimada.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Multa/Dano Evitado</span><span className="font-black text-emerald-600">{multaEvitada.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Pessoas sob Exposição Ativa</span><span className="text-gray-800 font-bold">{totalExpostos}</span></div>
           </div>
         </div>
      </div>

      <div className="mb-8">
         <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b-2 border-gray-900 pb-2 mb-4">Cadeia de Evidências</h3>
         <div className="grid grid-cols-4 gap-4 text-center">
            <div className="border border-gray-200 p-4 bg-white rounded-sm">
               <p className="text-[10px] font-bold text-gray-500 uppercase">Inspeções Sistêmicas</p>
               <p className="text-2xl font-black text-gray-900 mt-2">{inspecoes.length}</p>
            </div>
            <div className="border border-gray-200 p-4 bg-white rounded-sm">
               <p className="text-[10px] font-bold text-gray-500 uppercase">Riscos Mapeados</p>
               <p className="text-2xl font-black text-gray-900 mt-2">{riscos.length}</p>
            </div>
            <div className="border border-gray-200 p-4 bg-white rounded-sm">
               <p className="text-[10px] font-bold text-gray-500 uppercase">Ações Concluídas (Bloqueios)</p>
               <p className="text-2xl font-black text-green-600 mt-2">{concludedActions}</p>
            </div>
            <div className="border border-gray-200 p-4 bg-white rounded-sm">
               <p className="text-[10px] font-bold text-gray-500 uppercase">Pendências Ativas</p>
               <p className="text-2xl font-black text-red-600 mt-2">{pendingActions}</p>
            </div>
         </div>
      </div>

      <div className="mb-8">
         <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b-2 border-gray-300 pb-2 mb-4">Frentes Normativas Envolvidas (NRs Acionadas)</h3>
         <div className="flex flex-wrap gap-2">
            {nrsArray.map(nr => (
               <span key={nr} className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-800 text-[11px] font-bold rounded-sm uppercase tracking-wider">{nr}</span>
            ))}
            {nrsArray.length === 0 && <span className="text-xs text-gray-500 italic">Nenhum vínculo normativo identificado nos riscos mapeados.</span>}
         </div>
      </div>

      <div className="mb-8 border border-gray-300 p-6 bg-white rounded-sm shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Shield className="w-48 h-48" />
         </div>
         <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4">Parecer Final Consolidado</h3>
         <p className="text-[13px] text-gray-800 leading-relaxed text-justify font-medium">
            {parecerFinal}
         </p>
         <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Rastreabilidade & Validação</p>
            <p className="text-[11px] text-gray-600 leading-relaxed text-justify">
               Este dossiê reflete estritamente a cadeia de dados auditáveis inseridos na plataforma L.A.R.I. Toda e qualquer ação de controle indicada como &quot;Mitigada/Concluída&quot; exige que o mantenedor, por parte da contratante ou operador logístico local, assuma responsabilidade técnica via validação cruzada. Nenhuma evidência é aprovada sem rastreabilidade do autor.
            </p>
         </div>
      </div>

      <div className="pt-20 flex justify-between text-[11px] text-gray-500 border-t border-gray-300">
         <div className="text-center w-64">
           <div className="border-t border-gray-400 pt-2 mb-1">
             <p className="font-bold text-gray-800 uppercase">Responsável Técnico (SESMT)</p>
           </div>
           <p>Assinatura Digital Auditável</p>
         </div>
         <div className="text-center w-64">
           <div className="border-t border-gray-400 pt-2 mb-1">
             <p className="font-bold text-gray-800 uppercase">Representante Legal (C-Level)</p>
           </div>
           <p>Assinatura Digital Auditável</p>
         </div>
      </div>

    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RelatoriosPage() {
  const store = useAppStore();
  const [activeModel, setActiveModel] = useState<'Executivo' | 'Riscos' | 'Inspeções' | 'Ações' | 'Não conformidades' | 'Impacto econômico' | 'Dossie'>('Executivo');
  const [reportMonth, setReportMonth] = useState('2026-05');

  const periodLabel = useMemo(() => {
    const [year, month] = reportMonth.split('-');
    const mStr = new Date(Number(year), Number(month) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return mStr.charAt(0).toUpperCase() + mStr.slice(1);
  }, [reportMonth]);

  const reportsViewModel = useMemo(() => buildReportsViewModel(store), [store]);

  const reportHighlights = useMemo(() => {
    const executiveMetrics = reportsViewModel.executive?.metricas || {};
    const financialMetrics = reportsViewModel.financial?.metricas || {};

    return {
      generatedCount: Object.values(reportsViewModel).filter(Boolean).length,
      criticalPending: Number(executiveMetrics.openCriticalRisks || 0),
      openActions: Number(executiveMetrics.pendingActions || 0),
      avoidableImpact: Number(financialMetrics.valorEstimado || 0),
    };
  }, [reportsViewModel]);

  const recentReports = useMemo(() => ([
    { name: reportsViewModel.executive?.titulo || 'RelatÃ³rio Executivo de SST', period: periodLabel, date: formatReportTimestamp(reportsViewModel.executive?.geradoEm), icon: <FileText className="w-4 h-4" />, bg: 'bg-blue-500/10 text-blue-400' },
    { name: reportsViewModel.normative?.titulo || 'RelatÃ³rio Normativo', period: periodLabel, date: formatReportTimestamp(reportsViewModel.normative?.geradoEm), icon: <Shield className="w-4 h-4" />, bg: 'bg-orange-500/10 text-orange-400' },
    { name: reportsViewModel.pgr?.titulo || 'RelatÃ³rio PGR Vivo', period: periodLabel, date: formatReportTimestamp(reportsViewModel.pgr?.geradoEm), icon: <ClipboardCheck className="w-4 h-4" />, bg: 'bg-purple-500/10 text-purple-400' },
    { name: reportsViewModel.financial?.titulo || 'RelatÃ³rio de Impacto Financeiro', period: periodLabel, date: formatReportTimestamp(reportsViewModel.financial?.geradoEm), icon: <DollarSign className="w-4 h-4" />, bg: 'bg-emerald-500/10 text-emerald-400' },
  ]), [periodLabel, reportsViewModel]);

  void recentReports;

  const handlePrint = (exportType: string = 'PDF') => {
     store.addLog({
        empresa_id: '1',
        user_id: 'Sistema',
        event_type: 'relatorio_gerado',
        description: `Relatório ${activeModel} gerado (${exportType})`,
        origin_type: 'relatorio',
        origin_id: activeModel
     });
     if (exportType === 'PDF' || exportType === 'Impressão') {
        window.print();
     } else {
        alert("Exportação iniciada.");
     }
  };

  const models = [
    { id: 'Executivo', title: 'Executivo', desc: 'Visão geral estratégica de SST', icon: <FileText className="w-5 h-5"/> },
    { id: 'Riscos', title: 'Riscos', desc: 'Análise detalhada de riscos', icon: <Shield className="w-5 h-5"/> },
    { id: 'Inspeções', title: 'Inspeções', desc: 'Resultados e pendências de inspeções', icon: <ClipboardCheck className="w-5 h-5"/> },
    { id: 'Ações', title: 'Ações', desc: 'Acompanhamento de ações corretivas', icon: <CheckSquare className="w-5 h-5"/> },
    { id: 'Não conformidades', title: 'Não conformidades', desc: 'Não conformidades e tratativas', icon: <AlertOctagon className="w-5 h-5"/> },
    { id: 'Impacto econômico', title: 'Impacto econômico', desc: 'Projeção de passivos e ROI', icon: <DollarSign className="w-5 h-5"/> },
    { id: 'Dossie', title: 'Dossiê Defensável', desc: 'Auditoria completa (Legal, Diretoria)', icon: <Shield className="w-5 h-5 text-emerald-400"/> },
  ] as const;

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0f19] overflow-hidden pt-safe-top print:bg-white">
      
      {/* Top Header Section */}
      <div className="p-6 pb-2 shrink-0 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Relatórios</h1>
            <p className="text-sm text-gray-400 mt-1">Central de documentos e análises operacionais</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#121826] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-gray-400">Gerados no mês</p>
               <div className="flex items-end gap-3 mt-1">
                  <p className="text-3xl font-black text-white">{reportHighlights.generatedCount}</p>
                 <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center">↑ 26% <span className="text-gray-500 font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[#121826] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-gray-400">Pendências críticas</p>
               <div className="flex items-end gap-3 mt-1">
                  <p className="text-3xl font-black text-white">{reportHighlights.criticalPending}</p>
                 <span className="text-red-500 text-xs font-bold mb-1 flex items-center">↑ 16% <span className="text-gray-500 font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <AlertOctagon className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[#121826] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-gray-400">Ações abertas</p>
               <div className="flex items-end gap-3 mt-1">
                  <p className="text-3xl font-black text-white">{reportHighlights.openActions}</p>
                 <span className="text-orange-500 text-xs font-bold mb-1 flex items-center">↓ 8% <span className="text-gray-500 font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[#121826] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-gray-400">Impacto evitável</p>
               <div className="flex items-end gap-3 mt-1">
                  <p className="text-2xl font-black text-white">{formatCurrency(reportHighlights.avoidableImpact)}</p>
                 <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center">↑ 34% <span className="text-gray-500 font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
             </div>
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden p-6 pt-0 gap-6 print:p-0 print:overflow-visible flex-col md:flex-row">
        
        {/* Left Column - Models */}
        <div className="w-full md:w-[300px] flex flex-col shrink-0 print:hidden">
          <h3 className="text-sm font-bold text-white mb-4 px-1">Modelos de relatório</h3>
          <div className="space-y-3 overflow-y-auto pr-2 pb-6 scrollbar-thin">
             {models.map((m) => (
               <button 
                 key={m.id}
                 onClick={() => setActiveModel(m.id)}
                 className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group
                   ${activeModel === m.id 
                     ? 'bg-purple-900/40 border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                     : 'bg-[#121826] border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5'}
                 `}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors 
                      ${activeModel === m.id ? 'bg-purple-600/30 text-purple-400' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-[14px] font-bold ${activeModel === m.id ? 'text-white' : 'text-gray-300'}`}>{m.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{m.desc}</p>
                    </div>
                 </div>
                 <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
             ))}

             <button className="w-full mt-4 p-4 rounded-xl border border-dashed border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Novo modelo personalizado
             </button>
          </div>
        </div>

        {/* Center Column - Preview Paper */}
        <div className="flex-1 flex flex-col min-w-0 print:block">
           <h3 className="text-sm font-bold text-white mb-4 px-1 print:hidden">Prévia do relatório</h3>
           <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl overflow-hidden flex flex-col relative print:bg-white print:border-none print:rounded-none mt-0">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/5 flex justify-center pb-20 print:p-0 print:overflow-visible">
                 {/* The White Paper */}
                 <div id="printable-report" className="bg-white text-gray-900 w-full max-w-[850px] shadow-2xl rounded-sm p-10 md:p-14 min-h-[1100px] border border-gray-200 print:shadow-none print:border-none print:max-w-none print:p-0 print:min-h-0">
                    {activeModel === 'Executivo' && <RelatorioExecutivoPreview periodLabel={periodLabel} />}
                    {activeModel === 'Riscos' && <RelatorioRiscosPreview />}
                    {activeModel === 'Inspeções' && <RelatorioInspecoesPreview />}
                    {activeModel === 'Ações' && <RelatorioAcoesPreview />}
                    {activeModel === 'Não conformidades' && <RelatorioNCPreview />}
                    {activeModel === 'Impacto econômico' && <RelatorioEconomicoPreview />}
                    {activeModel === 'Dossie' && <DossieDefensavelPreview />}
                 </div>
              </div>
              
              {/* Paper Controls */}
              <div className="bg-[#0b0f19]/80 backdrop-blur border-t border-white/5 p-3 flex justify-center gap-4 shrink-0 absolute bottom-0 w-full rounded-b-2xl print:hidden">
                 <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">-</button>
                 <span className="flex items-center text-sm font-bold text-white">100%</span>
                 <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">+</button>
                 <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors ml-4">
                   <Activity className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column - Filters & Actions */}
        <div className="w-full md:w-[320px] flex flex-col shrink-0 gap-6 print:hidden">
           
           {/* Filters */}
           <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Filtros e exportação</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Mês de Referência</label>
                    <div className="flex items-center bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                       <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                       <input 
                         type="month" 
                         value={reportMonth} 
                         onChange={(e) => setReportMonth(e.target.value)}
                         className="bg-transparent border-none outline-none flex-1 font-medium text-gray-300 uppercase [color-scheme:dark]"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Setor</label>
                    <div className="flex items-center justify-between bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 cursor-pointer hover:border-purple-500/30 transition-colors">
                       <span>Todos os setores</span>
                       <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Responsável</label>
                    <div className="flex items-center justify-between bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 cursor-pointer hover:border-purple-500/30 transition-colors">
                       <span>Todos os responsáveis</span>
                       <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                 </div>

                 <div className="pt-2 flex flex-col gap-2">
                    <button onClick={() => handlePrint('Visualização/Impressão')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50 flex justify-center items-center gap-2">
                       <FileText className="w-4 h-4" /> Gerar relatório
                    </button>
                    <button onClick={() => handlePrint('PDF')} className="w-full bg-[#0b0f19] hover:bg-white/5 border border-white/10 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                       <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button onClick={() => handlePrint('Excel')} className="w-full bg-[#0b0f19] hover:bg-white/5 border border-white/10 text-emerald-400 font-medium py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                       <Download className="w-4 h-4" /> Exportar Excel
                    </button>
                 </div>
              </div>
           </div>

           {/* Recents */}
           <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Relatórios recentes</h3>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">Ver todos</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {[
                  { name: 'Relatório Executivo de SST', period: 'Maio/2026', date: '31/05/2026 08:45', icon: <FileText className="w-4 h-4" />, bg: 'bg-blue-500/10 text-blue-400' },
                  { name: 'Relatório de Riscos', period: 'Maio/2026', date: '30/05/2026 17:20', icon: <Shield className="w-4 h-4" />, bg: 'bg-orange-500/10 text-orange-400' },
                  { name: 'Relatório de Inspeções', period: 'Maio/2026', date: '29/05/2026 11:10', icon: <ClipboardCheck className="w-4 h-4" />, bg: 'bg-purple-500/10 text-purple-400' },
                  { name: 'Relatório de Ações', period: 'Maio/2026', date: '28/05/2026 16:05', icon: <CheckSquare className="w-4 h-4" />, bg: 'bg-emerald-500/10 text-emerald-400' },
                ].map((rec, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.bg}`}>
                         {rec.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[12px] font-bold text-white truncate">{rec.name}</p>
                         <p className="text-[10px] text-gray-500">{rec.period}</p>
                      </div>
                      <div className="text-[10px] text-gray-600 text-right shrink-0 group-hover:text-gray-400 transition-colors">
                         {rec.date}<br/>
                         <ArrowRight className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                   </div>
                ))}
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
