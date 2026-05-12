import { actionWorkflowEngine } from '@/src/lib/engines/actionWorkflowEngine';

type GenericRecord = Record<string, any>;

export function prepareActionsForView(actions: GenericRecord[], risks: GenericRecord[]) {
  return (actions || [])
    .filter((action) => {
      if (!action) return false;
      const textFields = [action.title, action.titulo, action.description, action.descricao, action.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (textFields.includes('dasda') || textFields.includes('dasd') || textFields.includes('teste')) return false;
      if (!action.title && !action.titulo && !action.description && !action.descricao && !action.category) return false;
      return true;
    })
    .map((action) => {
      const linkedRisk = risks.find((risk) => risk.id === (action.risk_id || action.riscoId || action.item_origem_id));
      return actionWorkflowEngine.normalize(action, linkedRisk);
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export function filterVisibleActions(actions: GenericRecord[], activePackageNames: string[], showInactive: boolean) {
  if (showInactive) return actions;
  return actions.filter((action) => {
    const pacote = action.pacote || 'Base SST';
    return pacote === 'Base SST' || activePackageNames.includes(pacote);
  });
}

export const actionWorkflowService = {
  prepareActionsForView,
  filterVisibleActions,
  evaluateFollowUp: actionWorkflowEngine.evaluateFollowUp,
  validateTransition: actionWorkflowEngine.validateTransition,
  deriveRiskStatusFromActions: actionWorkflowEngine.deriveRiskStatusFromActions,
  buildAutomaticActionDraft: actionWorkflowEngine.buildAutomaticActionDraft,
};
