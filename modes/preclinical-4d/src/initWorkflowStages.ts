import workflowSettings from './workflowSettings';

export default function initWorkflowStages(servicesManager): void {
  const { workflowStagesService } = servicesManager.services;
  const initialStageId = workflowSettings.stages[0].id;

  workflowStagesService.addWorkflowStages(workflowSettings.stages);
  workflowStagesService.setActiveWorkflowStage(initialStageId);
}
