import { normalizeDataset } from "../core/normalizeEngine.js";
import { mapStoreStateToMotorDataset } from "../bridge";
import {
  calculatePGRStatus,
  generatePGRInventory,
  generatePGRRiskMap,
  generateRiskControlPlan,
  getPGRCriticalItems,
} from "../engine/pgrEngine.js";

function adaptPGRDataset(state = {}) {
  if (state.inspecoes || state.riscos || state.acoes) {
    return mapStoreStateToMotorDataset(state);
  }

  return normalizeDataset(state);
}

export function buildPGRViewModel(state = {}) {
  const dataset = adaptPGRDataset(state);
  return {
    status: calculatePGRStatus(dataset),
    riskMap: generatePGRRiskMap(dataset),
    inventory: generatePGRInventory(dataset),
    controlPlan: generateRiskControlPlan(dataset),
    criticalItems: getPGRCriticalItems(dataset),
  };
}
