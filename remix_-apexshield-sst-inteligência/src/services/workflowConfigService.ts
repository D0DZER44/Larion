import { ok, fail, type EngineResult } from '@/src/types/engineResult';
import type { WorkflowConfig } from '@/src/types/workflowConfig';
import type { AutomationRule } from '@/src/types/automationRule';
import { workflowConfigEngine } from '@/src/lib/engines/workflowConfigEngine';
import { automationEngine } from '@/src/lib/engines/automationEngine';

export interface WorkflowConfigEnvelope {
  config: WorkflowConfig;
  automationRules: AutomationRule[];
}

export function createSafeWorkflowConfig(): EngineResult<WorkflowConfigEnvelope> {
  const config = workflowConfigEngine.createDefault();
  const automationRules = automationEngine.defaults;

  return ok({
    config,
    automationRules,
  });
}

export function validateSafeWorkflowConfig(
  config: WorkflowConfig,
  automationRules: AutomationRule[] = automationEngine.defaults
): EngineResult<WorkflowConfigEnvelope> {
  const configValidation = workflowConfigEngine.validate(config);
  const automationValidation = automationEngine.validateRules(automationRules);

  const warnings = [...configValidation.warnings, ...automationValidation.warnings];
  const errors = [...configValidation.errors, ...automationValidation.errors];

  if (errors.length > 0) {
    return fail(errors, {
      config,
      automationRules,
    }, warnings);
  }

  return ok({
    config,
    automationRules,
  }, warnings);
}

export const workflowConfigService = {
  createSafeConfig: createSafeWorkflowConfig,
  validateSafeConfig: validateSafeWorkflowConfig,
};
