import React, { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Clock, ShieldCheck, AlertTriangle, CheckCircle2, User, FileText, Activity } from 'lucide-react';

export default function TimelineHistory({ itemId, relatedInspectionId, relatedRiskId }: { itemId: string, relatedInspectionId?: string, relatedRiskId?: string }) {
  const logs = useAppStore(state => state.logs);

  const itemLogs = useMemo(() => {
    // We want logs that belong to THIS item, OR related origins (e.g. if this is an action, we want its risk logs and inspection logs).
    const relevantIds = [itemId];
    if (relatedInspectionId) relevantIds.push(relatedInspectionId);
    if (relatedRiskId) relevantIds.push(relatedRiskId);

    const filtered = logs.filter(log => relevantIds.includes(log.origin_id || '') || relevantIds.includes(log.id || ''));
    
    // sort by created_at asc
    return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [logs, itemId, relatedInspectionId, relatedRiskId]);

  if (!itemLogs || itemLogs.length === 0) {
    return (
      <div className="mt-8 space-y-3">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          Linha do Tempo
        </h4>
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-6 text-center">
           <p className="text-xs text-[var(--text-muted)]">Histórico insuficiente.</p>
        </div>
      </div>
    );
  }

  const getIconForEvent = (eventType: string) => {
    switch(eventType) {
      case 'inspecao_criada':
      case 'inspecao_editada': return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'item_nao_conforme_identificado': return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case 'risco_gerado': return <Activity className="w-3.5 h-3.5 text-orange-400" />;
      case 'acao_gerada': return <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'acao_concluida': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'relatorio_gerado': return <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
      default: return <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Linha do Tempo do Item
      </h4>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <div className="relative border-l border-[var(--border)] ml-3 space-y-6">
          {itemLogs.map((log, index) => (
            <div key={log.id || index} className="relative pl-6">
               <span className="absolute -left-3 top-0.5 w-6 h-6 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] flex items-center justify-center">
                  {getIconForEvent(log.event_type)}
               </span>
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{log.description}</span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString('pt-BR')}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.user_id}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
