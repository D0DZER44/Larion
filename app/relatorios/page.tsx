"use client";

import React, { useState } from 'react';
import { 
  FileText, Shield, ClipboardCheck, CheckSquare, 
  AlertOctagon, DollarSign, Download, Plus, 
  Calendar, ChevronDown, 
  Activity, ArrowRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';


// ============================================================================
// DATA HELPERS & MOCKS (Para preencher onde o store não tem dados específicos)
// ============================================================================

const mockRiscos = [
  { id: 1, atividade: 'Trabalho em altura na fachada', setor: 'Manutenção', nr: 'NR-35', perigo: 'Queda de nível diferente', consequencia: 'Lesões graves ou fatais', prob: 'Alta', sev: 'Crítica', nivel: 'Crítico', controlesAtuais: 'Nenhum', controlesRec: 'Instalação de linha de vida', resp: 'Eng. Segurança', prazo: '15/06/2026' },
  { id: 2, atividade: 'Operação de prensa', setor: 'Produção (Linha 1)', nr: 'NR-12', perigo: 'Esmagamento de membros', consequencia: 'Amputação', prob: 'Média', sev: 'Alta', nivel: 'Alto', controlesAtuais: 'Sensor óptico defeituoso', controlesRec: 'Manutenção/troca do sensor', resp: 'Equipe Manutenção', prazo: '20/06/2026' },
];

const mockInspeções = [
  { id: 1, nome: 'Inspeção de Andaimes', status: 'Pendente', vencimento: '02/06/2026', risco: 'Crítico', itensConf: 0, itensNaoConf: 0, resp: 'João Silva' },
  { id: 2, nome: 'Inspeção de Extintores', status: 'Concluída', vencimento: '05/05/2026', risco: 'Alto', itensConf: 12, itensNaoConf: 2, resp: 'Marcos Antônio' },
];

const mockAcoes = [
  { id: 1, oQue: 'Adequar quadros elétricos', origem: 'Inspeção', porQue: 'Risco de choque/incêndio (NR-10)', onde: 'Galpão Principal', quem: 'Equipe Elétrica', quando: '07/06/2026', status: 'Em andamento', prioridade: 'Crítica' },
  { id: 2, oQue: 'Revisar sinalização', origem: 'Risco', porQue: 'Adequação NR-26', onde: 'Áreas comuns', quem: 'Segurança', quando: '15/06/2026', status: 'Pendente', prioridade: 'Média' },
];

const mockNaoConformidades = [
  { id: 1, desc: 'Falta de EPI (Cinto de Segurança)', local: 'Telhado Galpão B', nr: 'NR-35', evid: 'Foto do empregado sem cinto', gravidade: 'Crítica', causa: 'Falta de treinamento/fiscalização', correcaoVal: 'Trabalho paralisado imediatamente', acaoCorretiva: 'Reciclagem NR-35 e advertência', resp: 'João Silva', status: 'Em tratamento' },
];

// ============================================================================
// PREVIEW COMPONENTS
// ============================================================================

function RelatorioExecutivoPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start border-b border-[var(--border)] pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2 text-indigo-700">
             <Shield className="w-8 h-8" />
             <h1 className="text-2xl font-black tracking-tight">Apex Ops</h1>
           </div>
           <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Relatório Executivo de SST</h2>
        </div>
        <div className="text-right text-[11px] text-[var(--text-muted)] space-y-1">
          <p><strong>Período:</strong> 01/05/2026 a 31/05/2026</p>
          <p><strong>Gerado em:</strong> {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Resumo Executivo</h3>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed text-justify">
          Este relatório apresenta uma visão consolidada do desempenho de Saúde e Segurança do Trabalho no período selecionado, destacando os principais riscos ocupacionais, pendências normativas e oportunidades de controle, baseado em princípios de gestão de riscos e indicadores proativos.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { title: 'Riscos', val: '28', trend: '+12%', color: 'text-[var(--text-primary)]' },
          { title: 'Inspeções', val: '46', trend: '+18%', color: 'text-[var(--text-primary)]' },
          { title: 'Ações', val: '132', trend: '-8%', color: 'text-[var(--text-primary)]' },
          { title: 'Conformidade', val: '87%', trend: '+5p.p.', color: 'text-[var(--text-primary)]' },
        ].map((k, i) => (
          <div key={i} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-card)]">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{k.title}</p>
            <p className={`text-2xl font-black ${k.color} my-1`}>{k.val}</p>
            <p className="text-[10px] text-green-600 font-medium">{k.trend} vs período anterior</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Riscos Prioritários</h3>
          <table className="w-full text-[12px] text-left border-collapse">
            <tbody className="divide-y divide-gray-100">
              {mockRiscos.map((r, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-[var(--text-primary)] font-medium">{r.atividade}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.nivel === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{r.nivel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-indigo-100 pb-1 mb-4">Inspeções Pendentes</h3>
          <table className="w-full text-[12px] text-left border-collapse">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] uppercase">
                <th className="pb-2 font-medium">Inspeção</th>
                <th className="pb-2 font-medium text-right">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockInspeções.filter(i => i.status === 'Pendente').map((ins, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-[var(--text-primary)] font-medium">{ins.nome}</td>
                  <td className="py-2.5 text-right flex justify-end gap-2 items-center">
                    <span className="text-[var(--text-muted)]">{ins.vencimento}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ins.risco === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{ins.risco}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        <div className="border border-[var(--border)] rounded-lg p-5">
           <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Ações Recomendadas</h3>
           <ul className="space-y-3 text-[12px] text-[var(--text-secondary)]">
             {mockAcoes.map((a, i) => (
               <li key={i} className="flex gap-2 items-start">
                 <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                 <span>{a.oQue} ({a.origem})</span>
               </li>
             ))}
           </ul>
        </div>
        
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-5">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4"/> Impacto Econômico Estimado
            </h3>
            <p className="text-[11px] text-indigo-700/70 mb-3">Faixa estimada de perdas evitáveis em caso de não tratamento dos riscos identificados (passível de multas e embargos).</p>
            <p className="text-2xl font-black text-indigo-700 mb-1">R$ 12.000 a R$ 41.000</p>
            <p className="text-[10px] text-indigo-500">Baseado na metodologia NBR ISO 31000 e histórico interno</p>
        </div>
      </div>

      <div className="pt-12 flex justify-between text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]">
         <div>
           <p className="font-bold text-[var(--text-primary)] uppercase">Responsável Técnico</p>
           <p>André Fernandes</p>
           <p>Téc. Seg. do Trabalho - MTE 12.345</p>
         </div>
         <div>
           <p className="font-bold text-[var(--text-primary)] uppercase">Empresa</p>
           <p>Apex Ops Indústria Ltda.</p>
           <p>CNPJ 12.345.678/0001-90</p>
         </div>
      </div>
    </div>
  );
}

function RelatorioRiscosPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-[var(--border)] pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Análise Técnica de Riscos Ocupacionais</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-2">Relatório técnico estruturado conforme boas práticas de gestão de SST e NBR ISO 31000.</p>
      </div>

      {mockRiscos.map((risco, i) => (
        <div key={i} className="border border-[var(--border)] rounded-sm mb-6 overflow-hidden">
          <div className="bg-[var(--bg-primary)] px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
             <div className="flex gap-3 items-center">
                <span className="bg-gray-800 text-[var(--text-primary)] text-[10px] font-bold px-2 py-1 uppercase rounded-sm">{risco.nr}</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase">{risco.atividade}</h3>
             </div>
             <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${risco.nivel === 'Crítico' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>Risco {risco.nivel}</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4 text-[12px]">
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Setor/Local</span> <span className="font-medium text-[var(--text-primary)]">{risco.setor}</span></div>
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Perigo Identificado</span> <span className="font-medium text-[var(--text-primary)]">{risco.perigo}</span></div>
             <div className="col-span-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Possível Consequência</span> <span className="text-[var(--text-primary)]">{risco.consequencia}</span></div>
             
             <div className="col-span-2 grid grid-cols-2 gap-4 my-2 border-y border-dashed border-[var(--border)] py-3">
               <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Probabilidade</span> <span className="text-[var(--text-primary)]">{risco.prob}</span></div>
               <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Severidade</span> <span className="text-[var(--text-primary)]">{risco.sev}</span></div>
             </div>

             <div className="col-span-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Controles Existentes</span> <span className="text-[var(--text-primary)]">{risco.controlesAtuais}</span></div>
             <div className="col-span-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Controles Recomendados</span> <span className="font-medium text-blue-700">{risco.controlesRec}</span></div>
             
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Responsável pela Ação</span> <span className="text-[var(--text-primary)]">{risco.resp}</span></div>
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Prazo Máximo</span> <span className="text-[var(--text-primary)]">{risco.prazo}</span></div>
          </div>
        </div>
      ))}
      
      <div className="mt-8 text-[11px] text-[var(--text-secondary)] text-justify">
        <strong className="uppercase">Conclusão Técnica:</strong> A avaliação demonstra a necessidade imediata de implementação de controles de engenharia e administrativos para os riscos classificados como Alto e Crítico, a fim de garantir a integridade física dos colaboradores e o atendimento aos requisitos legais de SSO.
      </div>
    </div>
  );
}

function RelatorioInspecoesPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-[var(--border)] pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Relatório Analítico de Inspeções</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-2">Registro documentado de conformidades, desvios e aplicação de checklists operacionais.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Realizadas</p>
           <p className="text-2xl font-black text-[var(--text-primary)] mt-1">12</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pendentes</p>
           <p className="text-2xl font-black text-[var(--text-primary)] mt-1">4</p>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 text-center rounded-sm">
           <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Vencidas</p>
           <p className="text-2xl font-black text-red-700 mt-1">2</p>
        </div>
      </div>

      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border)] pb-1 mb-4">Detalhamento das Inspeções</h3>
      
      <table className="w-full text-[11px] text-left border border-[var(--border)]">
        <thead className="bg-[var(--bg-primary)]">
          <tr className="text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            <th className="p-3">Inspeção / Checklist</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Itens (Conf / Ñ Conf)</th>
            <th className="p-3">Ação Sugerida</th>
            <th className="p-3 text-right">Responsável / Prazo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {mockInspeções.map((ins, i) => (
            <tr key={i}>
              <td className="p-3 font-medium text-[var(--text-primary)]">{ins.nome} <br/><span className="text-[var(--text-muted)] font-normal">Baseado em NR aplicável</span></td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-sm font-bold uppercase ${ins.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ins.status}</span>
              </td>
              <td className="p-3 text-center">
                 <span className="text-green-600 font-bold">{ins.itensConf}</span> / <span className="text-red-500 font-bold">{ins.itensNaoConf}</span>
              </td>
              <td className="p-3 text-[var(--text-secondary)]">
                 {ins.itensNaoConf > 0 ? 'Abertura de O.S. corretiva' : 'Manter monitoramento'}
              </td>
              <td className="p-3 text-right text-[var(--text-secondary)]">
                 {ins.resp} <br/>
                 <span className="font-bold text-[var(--text-primary)]">{ins.vencimento}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-[11px] text-[var(--text-secondary)] text-justify">
        <strong className="uppercase">Conclusão Documental:</strong> As inspeções registradas neste período validam o compromisso com o acompanhamento contínuo dos ambientes de trabalho. As não conformidades identificadas geram automaticamente planos de ação (5W2H) para mitigação.
      </div>
    </div>
  )
}

function RelatorioAcoesPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-[var(--border)] pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Acompanhamento de Plano de Ação</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-2">Estrutura metodológica 5W2H para rastreabilidade de correções preventivas e corretivas.</p>
      </div>

      {mockAcoes.map((acao, i) => (
        <div key={i} className="border border-[var(--border)] rounded-sm mb-6 overflow-hidden">
          <div className="bg-[var(--bg-primary)] px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
             <div className="flex gap-3 items-center">
                <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-sm border ${acao.prioridade === 'Crítica' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{acao.prioridade}</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase">{acao.oQue}</h3>
             </div>
             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase bg-white px-2 py-1 rounded-sm border border-[var(--border)]">{acao.status}</span>
          </div>
          
          <div className="p-0">
             <table className="w-full text-[11px] text-left border-collapse">
               <tbody className="divide-y divide-gray-100">
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">Origem</th><td className="p-3 font-medium text-[var(--text-primary)]">{acao.origem}</td></tr>
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">What (O que)</th><td className="p-3 text-[var(--text-primary)]">{acao.oQue}</td></tr>
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">Why (Por que)</th><td className="p-3 text-[var(--text-primary)]">{acao.porQue}</td></tr>
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">Where (Onde)</th><td className="p-3 text-[var(--text-primary)]">{acao.onde}</td></tr>
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">Who (Quem)</th><td className="p-3 text-[var(--text-primary)]">{acao.quem}</td></tr>
                 <tr><th className="p-3 bg-[var(--bg-card)] w-[30%] text-[var(--text-secondary)] uppercase border-r border-[var(--border)]">When (Prazo)</th><td className="p-3 font-bold text-[var(--text-primary)]">{acao.quando}</td></tr>
               </tbody>
             </table>
          </div>
        </div>
      ))}
      
      <div className="mt-8 text-[11px] text-[var(--text-secondary)] text-justify">
        <strong className="uppercase">Conclusão do Plano:</strong> As ações propostas visam o bloqueio da trajetória do risco e adequação normativa. Recomenda-se acompanhamento rigoroso dos prazos definidos.
      </div>
    </div>
  )
}

function RelatorioNCPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-[var(--border)] pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Desvios e Não Conformidades (RNC)</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-2">Registro de anomalias normativas operacionais, causas raízes e tratativas executadas.</p>
      </div>

      {mockNaoConformidades.map((nc, i) => (
        <div key={i} className="border-2 border-red-200 p-6 rounded-sm bg-white mb-6 relative">
          <div className="absolute top-0 left-0 bg-red-600 text-[var(--text-primary)] text-[10px] font-bold px-3 py-1 uppercase rounded-br-sm">
             RNC-{String(i+1).padStart(3, '0')}
          </div>
          
          <div className="flex justify-between items-start mt-4 mb-6">
             <h3 className="text-lg font-bold text-gray-900 uppercase leading-snug">{nc.desc}</h3>
             <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 uppercase rounded-sm border border-red-200">{nc.gravidade}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 text-[12px]">
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Local / Setor</span> <span className="font-medium text-[var(--text-primary)]">{nc.local}</span></div>
             <div><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Requisito Legal infringido</span> <span className="font-bold text-gray-900">{nc.nr}</span></div>
             <div className="col-span-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Evidência Identificada</span> <span className="text-[var(--text-primary)]">{nc.evid}</span></div>
             <div className="col-span-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Causa Provável</span> <span className="text-[var(--text-primary)]">{nc.causa}</span></div>
             
             <div className="col-span-2 bg-[var(--bg-card)] border border-[var(--border)] p-4 mt-2">
                <span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-2">Tratativas</span>
                <div className="space-y-2">
                   <p><strong className="text-[var(--text-primary)] mr-2">Correção Imediata:</strong> {nc.correcaoVal}</p>
                   <p><strong className="text-[var(--text-primary)] mr-2">Ação Corretiva/Preventiva:</strong> {nc.acaoCorretiva}</p>
                </div>
             </div>

             <div className="border-t border-[var(--border)] pt-4 mt-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Responsável</span> <span className="text-[var(--text-primary)]">{nc.resp}</span></div>
             <div className="border-t border-[var(--border)] pt-4 mt-2"><span className="text-[var(--text-muted)] font-bold uppercase text-[10px] block mb-1">Status Atual</span> <span className="font-bold text-blue-700 uppercase">{nc.status}</span></div>
          </div>
        </div>
      ))}
      
      <div className="mt-8 text-[11px] text-[var(--text-secondary)] text-justify">
        <strong className="uppercase">Verificação de Eficácia:</strong> A RNC só será encerrada após auditoria em campo para comprovação da eliminação efetiva da causa raiz e validação dos novos controles adotados.
      </div>
    </div>
  )
}

function RelatorioEconomicoPreview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-[var(--border)] pb-6 mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Estimativa de Impacto Econômico</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-2">Análise monetária preventiva baseada em multas normativas, paralisação operacional e passivos.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-sm mb-6 flex gap-3 text-[11px] text-yellow-800 leading-relaxed text-justify">
         <AlertOctagon className="w-8 h-8 text-yellow-500 shrink-0" />
         <div>
            <strong className="uppercase block mb-1">Aviso Legal & Premissas</strong>
            <p>Os valores apresentados constituem uma estimativa preventiva e não um cálculo atuarial exato. O valor real do passivo depende da fiscalização trabalhista, enquadramento jurídico pericial, número efetivo de empregados, configuração de reincidência sistêmica e desdobramentos de contexto (e.g. ações cíveis/previdenciárias). Estrutura compatível com análise técnica estratégica.</p>
         </div>
      </div>

      <div className="p-8 bg-[var(--bg-card)] border border-[var(--border)] text-center rounded-sm mb-8">
         <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Exposição Financeira (Riscos Críticos + Altos)</p>
         <h3 className="text-4xl font-black text-gray-900 mb-2">R$ 12.000 <span className="text-[var(--text-muted)] font-medium text-2xl mx-1">a</span> R$ 41.000</h3>
         <p className="text-[11px] text-[var(--text-muted)]">Multas NR, FAP, Lucro Cessante e Indenizações</p>
      </div>

      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border)] pb-1 mb-4">Cenários de Exposição</h3>
      
      <table className="w-full text-[11px] text-left border border-[var(--border)]">
        <thead className="bg-[var(--bg-primary)]">
          <tr className="text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            <th className="p-3">Risco Analisado</th>
            <th className="p-3">Norma</th>
            <th className="p-3 text-center">Impacto Op.</th>
            <th className="p-3 text-right">Potencial de Dano (R$)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {mockRiscos.map((r, i) => (
            <tr key={i}>
              <td className="p-3 font-medium text-[var(--text-primary)]">{r.atividade}</td>
              <td className="p-3 font-bold text-[var(--text-secondary)]">{r.nr}</td>
              <td className="p-3 text-center text-[var(--text-secondary)]">{r.nivel === 'Crítico' ? 'Embargo Obras' : 'Atraso Linha'}</td>
              <td className="p-3 text-right font-bold text-red-700">Até R$ 25.000</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-[11px] text-[var(--text-secondary)] text-justify">
        <strong className="uppercase">Recomendação de Priorização:</strong> O custo de adequação preventiva (instalações, EPIs, treinamentos) representa historicamente menos de 10% do valor do impacto operacional consolidado. Sugere-se autorização imediata de verba para as ações críticas identificadas no plano de ação.
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RelatoriosPage() {
  const store = useAppStore();
  const [activeModel, setActiveModel] = useState<'Executivo' | 'Riscos' | 'Inspeções' | 'Ações' | 'Não conformidades' | 'Impacto econômico'>('Executivo');

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
  ] as const;

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-primary)] overflow-hidden pt-safe-top print:bg-white">
      
      {/* Top Header Section */}
      <div className="p-6 pb-2 shrink-0 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Relatórios</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Central de documentos e análises operacionais</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-[var(--text-muted)]">Gerados no mês</p>
               <div className="flex items-end gap-3 mt-1">
                 <p className="text-3xl font-black text-[var(--text-primary)]">24</p>
                 <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center">↑ 26% <span className="text-[var(--text-muted)] font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-[var(--text-muted)]">Pendências críticas</p>
               <div className="flex items-end gap-3 mt-1">
                 <p className="text-3xl font-black text-[var(--text-primary)]">7</p>
                 <span className="text-red-500 text-xs font-bold mb-1 flex items-center">↑ 16% <span className="text-[var(--text-muted)] font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <AlertOctagon className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-[var(--text-muted)]">Ações abertas</p>
               <div className="flex items-end gap-3 mt-1">
                 <p className="text-3xl font-black text-[var(--text-primary)]">132</p>
                 <span className="text-orange-500 text-xs font-bold mb-1 flex items-center">↓ 8% <span className="text-[var(--text-muted)] font-normal ml-1">vs mês anterior</span></span>
               </div>
             </div>
             <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
             </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between group">
             <div>
               <p className="text-sm font-semibold text-[var(--text-muted)]">Impacto evitável</p>
               <div className="flex items-end gap-3 mt-1">
                 <p className="text-2xl font-black text-[var(--text-primary)]">R$ 41.000</p>
                 <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center">↑ 34% <span className="text-[var(--text-muted)] font-normal ml-1">vs mês anterior</span></span>
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
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 px-1">Modelos de relatório</h3>
          <div className="space-y-3 overflow-y-auto pr-2 pb-6 scrollbar-thin">
             {models.map((m) => (
               <button 
                 key={m.id}
                 onClick={() => setActiveModel(m.id)}
                 className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group
                   ${activeModel === m.id 
                     ? 'bg-purple-900/40 border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                     : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--bg-active-group)]'}
                 `}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors 
                      ${activeModel === m.id ? 'bg-purple-600/30 text-purple-400' : 'bg-[var(--bg-active-group)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-[14px] font-bold ${activeModel === m.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{m.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">{m.desc}</p>
                    </div>
                 </div>
                 <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
             ))}

             <button className="w-full mt-4 p-4 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-purple-500/50 hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Novo modelo personalizado
             </button>
          </div>
        </div>

        {/* Center Column - Preview Paper */}
        <div className="flex-1 flex flex-col min-w-0 print:block">
           <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 px-1 print:hidden">Prévia do relatório</h3>
           <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col relative print:bg-white print:border-none print:rounded-none mt-0">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--bg-primary)] flex justify-center pb-20 print:p-0 print:overflow-visible">
                 {/* The White Paper */}
                 <div id="printable-report" className="bg-white text-gray-900 w-full max-w-[850px] shadow-2xl rounded-sm p-10 md:p-14 min-h-[1100px] border border-[var(--border)] print:shadow-none print:border-none print:max-w-none print:p-0 print:min-h-0">
                    {activeModel === 'Executivo' && <RelatorioExecutivoPreview />}
                    {activeModel === 'Riscos' && <RelatorioRiscosPreview />}
                    {activeModel === 'Inspeções' && <RelatorioInspecoesPreview />}
                    {activeModel === 'Ações' && <RelatorioAcoesPreview />}
                    {activeModel === 'Não conformidades' && <RelatorioNCPreview />}
                    {activeModel === 'Impacto econômico' && <RelatorioEconomicoPreview />}
                 </div>
              </div>
              
              {/* Paper Controls */}
              <div className="bg-[var(--bg-primary)]/80 backdrop-blur border-t border-[var(--border)] p-3 flex justify-center gap-4 shrink-0 absolute bottom-0 w-full rounded-b-2xl print:hidden">
                 <button className="p-2 hover:bg-[var(--bg-active-group)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">-</button>
                 <span className="flex items-center text-sm font-bold text-[var(--text-primary)]">100%</span>
                 <button className="p-2 hover:bg-[var(--bg-active-group)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">+</button>
                 <button className="p-2 hover:bg-[var(--bg-active-group)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-4">
                   <Activity className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column - Filters & Actions */}
        <div className="w-full md:w-[320px] flex flex-col shrink-0 gap-6 print:hidden">
           
           {/* Filters */}
           <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Filtros e exportação</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Período</label>
                    <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)]">
                       <Calendar className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                       <span>01/05/2026 – 31/05/2026</span>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Setor</label>
                    <div className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] cursor-pointer hover:border-purple-500/30 transition-colors">
                       <span>Todos os setores</span>
                       <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Responsável</label>
                    <div className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] cursor-pointer hover:border-purple-500/30 transition-colors">
                       <span>Todos os responsáveis</span>
                       <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                 </div>

                 <div className="pt-2 flex flex-col gap-2">
                    <button onClick={() => handlePrint('Visualização/Impressão')} className="w-full bg-blue-600 hover:bg-blue-700 text-[var(--text-primary)] font-bold py-2.5 rounded-xl text-sm transition-colors shadow-[var(--shadow-glow-blue)] border border-blue-500/50 flex justify-center items-center gap-2">
                       <FileText className="w-4 h-4" /> Gerar relatório
                    </button>
                    <button onClick={() => handlePrint('PDF')} className="w-full bg-[var(--bg-primary)] hover:bg-[var(--bg-active-group)] border border-[var(--border)] text-[var(--text-primary)] font-medium py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                       <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button onClick={() => handlePrint('Excel')} className="w-full bg-[var(--bg-primary)] hover:bg-[var(--bg-active-group)] border border-[var(--border)] text-emerald-600 dark:text-emerald-400 font-medium py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                       <Download className="w-4 h-4" /> Exportar Excel
                    </button>
                 </div>
              </div>
           </div>

           {/* Recents */}
           <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Relatórios recentes</h3>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">Ver todos</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {[
                  { name: 'Relatório Executivo de SST', period: 'Maio/2026', date: '31/05/2026 08:45', icon: <FileText className="w-4 h-4" />, bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                  { name: 'Relatório de Riscos', period: 'Maio/2026', date: '30/05/2026 17:20', icon: <Shield className="w-4 h-4" />, bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                  { name: 'Relatório de Inspeções', period: 'Maio/2026', date: '29/05/2026 11:10', icon: <ClipboardCheck className="w-4 h-4" />, bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
                  { name: 'Relatório de Ações', period: 'Maio/2026', date: '28/05/2026 16:05', icon: <CheckSquare className="w-4 h-4" />, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                ].map((rec, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-active-group)] cursor-pointer transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.bg}`}>
                         {rec.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{rec.name}</p>
                         <p className="text-[10px] text-[var(--text-muted)]">{rec.period}</p>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] text-right shrink-0 group-hover:text-[var(--text-muted)] transition-colors">
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
