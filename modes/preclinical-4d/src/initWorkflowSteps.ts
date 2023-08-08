import workflowSettings from './workflowSettings';

export default function initWorkflowSteps(servicesManager): void {
  const { workflowStepsService } = servicesManager.services;
  const initialStageId = workflowSettings.steps[0].id;

  workflowStepsService.addWorkflowSteps(workflowSettings.steps);
  workflowStepsService.setActiveWorkflowStep(initialStageId);
}
