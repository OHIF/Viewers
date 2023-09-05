import getWorkflowSettings from './getWorkflowSettings';

export default function initWorkflowSteps(appContext): void {
  const { workflowStepsService } = appContext.servicesManager.services;
  const workflowSettings = getWorkflowSettings(appContext);
  const initialStageId = workflowSettings.steps[0].id;

  workflowStepsService.addWorkflowSteps(workflowSettings.steps);
  workflowStepsService.setActiveWorkflowStep(initialStageId);
}
