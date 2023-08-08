import { CommandsManager } from '../../classes';
import { ServicesManager } from '../../services';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVE_STEP_CHANGED: 'event::workflowStepsService:activateStepChanged',
  STEPS_CHANGED: 'event::workflowStepsService:stepsChanged',
};

/*
  A mode may define a workflow and each workflow may have one or more steps.
  Each step may define a different set of tools, hanging protocol and panels
  layout that will be applied to the viewer once it gets activated making the
  viewer work in a more dynamic way.

  Example:
    All keys inside brackets are optionals.

    workflow: {
      [initialStepId]: 'step1',
      steps: [
        {
          id: 'firstStep',
          name: 'First Step',
          [toolbar]: {
            buttons: firstStepToolbarButtons,
            sections: [
              {
                key: 'primary',
                buttons: [ 'MeasurementTools', 'Zoom', ... ],
              },
            ],
          },
          [layout]: {
            [panels]: {
              left: ['firstLeftPanelId', 'secondLeftPanelId'],
              right: ['firstRightPanelId'],
            },
          },
          [hangingProtocol]: {
            protocolId: 'default',
            [stepId]: 'firstStep',
          },
        },
        {
          id: 'secondStep',
          name: 'Second Step',
          ...
        },
      ]
    }

  If workflow steps are defined but `initialStepId` is not set then the first
  step is set as active during mode initialization.
*/

export type WorkflowStep = {
  id: string;
  name: string;
  toolbar?: {
    buttons: unknown[];
    sections: {
      key: string;
      buttons: string[];
    }[];
  };
  hangingProtocol?: {
    protocolId: string;
    stageId?: string;
  };
  layout?: {
    panels: {
      left?: string[];
      right?: string[];
    };
  };
};

class WorkflowStepsService extends PubSubService {
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;
  private _workflowSteps: WorkflowStep[];
  private _activeWorkflowStep: WorkflowStep;

  constructor(
    commandsManager: CommandsManager,
    servicesManager: ServicesManager
  ) {
    super(EVENTS);
    this._workflowSteps = [];
    this._activeWorkflowStep = null;
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
  }

  public get workflowSteps(): WorkflowStep[] {
    return [...this._workflowSteps];
  }

  public get activeWorkflowStep(): WorkflowStep {
    return this._activeWorkflowStep;
  }

  public addWorkflowSteps(workflowSteps: WorkflowStep[]): void {
    let workflowStepAdded = false;

    workflowSteps.forEach(newWorkflowStep => {
      const workflowStepExists = this._workflowSteps.some(
        workflowStep => workflowStep.id === newWorkflowStep.id
      );

      if (workflowStepExists) {
        throw new Error(`Duplicated workflow step id (${newWorkflowStep.id})`);
      }

      this._workflowSteps.push(newWorkflowStep);
      workflowStepAdded = true;
    });

    if (workflowStepAdded) {
      this._broadcastEvent(EVENTS.STEPS_CHANGED, {});
    }
  }

  private _updateToolBar(workflowStep: WorkflowStep) {
    const { toolbarService } = this._servicesManager.services;
    const { toolbar } = workflowStep;
    const shouldUpdate = !!toolbar?.buttons && !!toolbar?.sections;

    if (!shouldUpdate) {
      return;
    }

    toolbarService.reset();
    toolbarService.addButtons(toolbar.buttons);

    toolbar.sections.forEach(section => {
      toolbarService.createButtonSection(section.key, section.buttons);
    });
  }

  private _updatePanels(workflowStep: WorkflowStep) {
    const { panelService } = this._servicesManager.services;
    const panels = workflowStep?.layout?.panels;

    if (!panels) {
      return;
    }

    panelService.setPanels(panels);
  }

  private _updateHangingProtocol(workflowStep: WorkflowStep) {
    const { hangingProtocol } = workflowStep;

    if (!hangingProtocol) {
      return;
    }

    this._commandsManager.runCommand('setHangingProtocol', {
      protocolId: hangingProtocol.protocolId,
      stageId: hangingProtocol.stageId,
      stageIndex: hangingProtocol.stageIndex,
    });
  }

  public setActiveWorkflowStep(workflowStepId: string): void {
    if (workflowStepId === this._activeWorkflowStep?.id) {
      return;
    }

    const activeWorkflowStep = this._workflowSteps.find(
      step => step.id === workflowStepId
    );

    if (!activeWorkflowStep) {
      throw new Error(`Invalid workflowStepId (${workflowStepId})`);
    }

    this._activeWorkflowStep = activeWorkflowStep;
    this._updateToolBar(activeWorkflowStep);
    this._updatePanels(activeWorkflowStep);
    this._updateHangingProtocol(activeWorkflowStep);
    this._broadcastEvent(EVENTS.ACTIVE_STEP_CHANGED, { activeWorkflowStep });
  }

  public reset(): void {
    this._activeWorkflowStep = null;
    this._workflowSteps = [];
  }

  public onModeEnter(): void {
    this.reset();
  }

  public static REGISTRATION = {
    name: 'workflowStepsService',
    create: ({ commandsManager, servicesManager }): WorkflowStepsService => {
      return new WorkflowStepsService(commandsManager, servicesManager);
    },
  };
}

export { WorkflowStepsService as default, WorkflowStepsService };
