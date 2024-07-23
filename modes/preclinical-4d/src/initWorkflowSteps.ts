import getWorkflowSettings from './getWorkflowSettings';

export default function initWorkflowSteps({ servicesManager }): void {
  const { workflowStepsService } = servicesManager.services;
  const workflowSettings = getWorkflowSettings({ servicesManager });

  workflowStepsService.addWorkflowSteps(workflowSettings.steps);
  workflowStepsService.setActiveWorkflowStep(workflowSettings.steps[0].id);
}
