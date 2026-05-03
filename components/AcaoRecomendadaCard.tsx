"use client";

import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface AcaoRecomendadaCardProps {
  context?: 'global' | 'inspecoes';
}

export default function AcaoRecomendadaCard({ context = 'global' }: AcaoRecomendadaCardProps) {
  const store = useAppStore();

  const recomendacao = useMemo(() => {
    const riscos = store.riscos || [];
    const acoes = store.acoes || [];
    const inspecoes = store.inspecoes || [];
    const checklists = store.checklists || [];

    const hoje = new Date().toISOString().split('T')[0];

    if (context === 'inspecoes') {
      // Priority 1: Inspeção em atraso P1/P2
      const inspecoesAtrasadasP1P2 = inspecoes.filter(i => {
        const isCompleted = i.status === 'Concluída' || i.situacao === 'Concluída' || i.status === 'Cancelada' || i.situacao === 'Cancelada' || i.status === 'Anulada' || i.situacao === 'Anulada';
        if (isCompleted) return false;
        
        const isAtrasada = i.status === 'Em atraso' || i.situacao === 'Em atraso' || i.isAtrasada || (i.proximaInspecao || i.data) < hoje;
        const isP1P2 = i.prioridade?.includes('P1') || i.prioridade?.includes('P2');
        return isAtrasada && isP1P2;
      });

      if (inspecoesAtrasadasP1P2.length > 0) {
        const item = inspecoesAtrasadasP1P2[0];
        return `Priorize hoje: inspeção atrasada com prioridade alta/crítica (${item.checklist || item.nome}) no setor ${item.ondeUsar || 'não informado'}.`;
      }

      // Priority 2: Inspeção de hoje P1
      const inspecoesHojeP1 = inspecoes.filter(i => {
        const isCompleted = i.status === 'Concluída' || i.situacao === 'Concluída' || i.status === 'Cancelada' || i.situacao === 'Cancelada' || i.status === 'Anulada' || i.situacao === 'Anulada';
        if (isCompleted) return false;
        
        const isToday = (i.proximaInspecao || i.data) === hoje;
        const isP1 = i.prioridade?.includes('P1');
        return isToday && isP1;
      });

      if (inspecoesHojeP1.length > 0) {
        const item = inspecoesHojeP1[0];
        return `Priorize hoje: inspeção de hoje com prioridade crítica (${item.checklist || item.nome}) no setor ${item.ondeUsar || 'não informado'}.`;
      }

      // Priority 3: Checklist vencendo revisão
      const checklistsVencendo = checklists.filter(c => {
        return c.status === 'Revisar' || (c.proximaRevisao && c.proximaRevisao <= hoje);
      });

      if (checklistsVencendo.length > 0) {
        return `Priorize hoje: há ${checklistsVencendo.length} checklist(s) vencendo revisão. Mantenha os modelos atualizados.`;
      }

      // Priority 4: Recorrência de não conformidades (temas)
      const ocorrenciasPorTema: Record<string, number> = {};
      inspecoes.forEach(i => {
        if (i.items && Array.isArray(i.items)) {
           i.items.forEach((item: any) => {
              if (item.status === 'Não conforme') {
                 const tema = item.sectionTitle || i.checklist || 'Geral';
                 ocorrenciasPorTema[tema] = (ocorrenciasPorTema[tema] || 0) + 1;
              }
           });
        }
      });

      const mostCommonIssues = Object.entries(ocorrenciasPorTema)
        .sort((a, b) => b[1] - a[1])
        .filter(entry => entry[1] >= 2); // At least 2 incidents to be considered recurrence

      if (mostCommonIssues.length > 0) {
        const principalTema = mostCommonIssues[0][0];
        return `Atenção à reincidência: o tema/checklist "${principalTema}" já registrou ${mostCommonIssues[0][1]} não conformidades recentes.`;
      }

      // Default Inspecoes
      if (inspecoes.length === 0) {
        return "Sem dados suficientes para recomendação confiável. Cadastre inspeções ou checklists para gerar insights.";
      }

      return "A rotina de inspeções está em dia. Mantenha os cronogramas atualizados.";
    }

    // --- GLOBAL CONTEXT (Applies when context !== 'inspecoes') ---

    // Priority 1: Risco Crítico Aberto
    const riscosCriticosAbertos = riscos.filter(r => 
      (r.nivel === 'Crítico' || r.level === 'Crítico' || r.gravidade === 'Crítico') && 
      (r.status === 'Aberto' || r.status === 'Pendente' || r.status === 'Identificado')
    );

    if (riscosCriticosAbertos.length > 0) {
      const r = riscosCriticosAbertos[0];
      return `Priorize hoje: mitigação de risco crítico (${r.titulo || r.title}). Este risco está aberto e exige atenção imediata no setor ${r.setor || 'Geral'}.`;
    }

    // Priority 2: Ações Vencidas vinculadas a risco Alto/Crítico
    const acoesAtrasadas = acoes.filter(a => {
      const isPending = a.status !== 'Concluído' && a.status !== 'Fechada' && a.status !== 'Concluída';
      const isDue = a.prazo && a.prazo < hoje;
      const isHighOrCrit = a.priority === 'P1' || a.priority === 'P2' || a.prioridade === 'P1' || a.prioridade === 'P2';
      return isPending && isDue && isHighOrCrit;
    });

    if (acoesAtrasadas.length > 0) {
      const a = acoesAtrasadas[0];
      return `Priorize hoje: ${a.title || a.titulo}. Essa ação está vencida, ligada a risco alto/crítico e afeta o setor ${a.setor || a.category || 'Geral'}.`;
    }

    // Priority 3: Inspeções atrasadas e Checklists vencendo revisão
    const inspecoesAtrasadas = inspecoes.filter(i => i.isAtrasada || i.situacao === 'Em atraso' || i.status === 'Em atraso');
    const checklistsVencendo = checklists.filter(c => c.proximaRevisao && c.proximaRevisao < hoje);

    if (inspecoesAtrasadas.length > 0 || checklistsVencendo.length > 0) {
      let setoresPrioridade = [...new Set(inspecoesAtrasadas.map(i => i.ondeUsar))].slice(0, 3).join(', ');
      return `Priorize hoje: ${setoresPrioridade || 'Inspeções pendentes'}. Há ${inspecoesAtrasadas.length} inspeções em atraso e ${checklistsVencendo.length} checklists vencendo revisão.`;
    }

    // Priority 4: Setor concentrando mais riscos/ações
    const alertasAbertos = riscos.filter(r => r.status === 'Aberto' || r.status === 'Pendente');
    const acoesPendentes = acoes.filter(a => a.status === 'Pendente' || a.status === 'Aberta' || a.status === 'Em andamento');
    const occurrencesBySector: Record<string, number> = {};
    const occurrencesByType: Record<string, number> = {};

    alertasAbertos.forEach(r => { 
      if (r.setor) occurrencesBySector[r.setor] = (occurrencesBySector[r.setor] || 0) + 1; 
      if (r.titulo || r.title) {
        const title = r.titulo || r.title;
        occurrencesByType[title] = (occurrencesByType[title] || 0) + 1;
      }
    });

    acoesPendentes.forEach(a => { 
      if(a.setor || a.category) occurrencesBySector[a.setor || a.category] = (occurrencesBySector[a.setor || a.category] || 0) + 1; 
    });
    
    let maxSector = '';
    let maxCount = 0;
    Object.keys(occurrencesBySector).forEach(s => {
      if (s && s !== 'undefined' && occurrencesBySector[s] > maxCount) {
        maxCount = occurrencesBySector[s];
        maxSector = s;
      }
    });

    let maxType = '';
    let maxTypeCount = 0;
    Object.keys(occurrencesByType).forEach(t => {
      if (t && t !== 'undefined' && occurrencesByType[t] > maxTypeCount) {
        maxTypeCount = occurrencesByType[t];
        maxType = t;
      }
    });

    if (maxCount >= 3) {
      return `Priorize hoje: ${maxSector}. Este setor concentra atualmente ${maxCount} ocorrências entre riscos abertos e ações pendentes.`;
    }

    if (maxTypeCount >= 2) {
      return `Priorize hoje: Atenção à reincidência. O risco de "${maxType}" já apareceu ${maxTypeCount} vezes. Averigue a causa raiz.`;
    }

    // Se não houver dados suficientes
    if (riscos.length === 0 && acoes.length === 0 && inspecoes.length === 0) {
      return "Sem dados suficientes para recomendação confiável. Cadastre inspeções, riscos ou ações para gerar insights.";
    }

    return "A operação está estável. Mantenha o monitoramento contínuo das áreas e acompanhe o cronograma de inspeções regulares.";
  }, [store, context]);

  return (
    <div className="bg-[var(--bg-secondary)] border border-indigo-500/20 rounded-xl p-5 mb-6 flex items-start gap-4 shadow-lg shrink-0">
      <div className="p-2 bg-indigo-500/10 rounded-full border border-indigo-500/30">
        <Star className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Ação recomendada</h4>
        <p className="text-sm text-[var(--text-muted)]">{recomendacao}</p>
      </div>
    </div>
  );
}
