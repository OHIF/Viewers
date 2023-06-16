import { CommandsManager } from '../../classes';
import { ServicesManager } from '../../services';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVE_STAGE_CHANGED: 'event::workflowStagesService:activateStageChanged',
  STAGES_CHANGED: 'event::workflowStagesService:stagesChanged',
};

/*
  A mode may define a workflow and each workflow may have one or more stages.
  Each stage may define a different set of tools, hanging protocol and panels
  layout that will be applied to the viewer once it gets activated making the
  viewer work in a more dynamic way.

  Example:
    All keys inside brackets are optionals.

    workflow: {
      [initialStageId]: 'stage1',
      stages: [
        {
          id: 'firstStage',
          name: 'First Stage',
          [toolbar]: {
            buttons: firstStageToolbarButtons,
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
            [stageId]: 'firstStage',
          },
        },
        {
          id: 'secondStage',
          name: 'Second Stage',
          ...
        },
      ]
    }

  If workflow stages are defined but `initialStageId` is not set then the first
  stage is set as active during mode initialization.
*/

export type WorkflowStage = {
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

class WorkflowStagesService extends PubSubService {
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;
  private _workflowStages: WorkflowStage[];
  private _activeWorkflowStage: WorkflowStage;

  constructor(
    commandsManager: CommandsManager,
    servicesManager: ServicesManager
  ) {
    super(EVENTS);
    this._workflowStages = [];
    this._activeWorkflowStage = null;
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
  }

  public get workflowStages(): WorkflowStage[] {
    return [...this._workflowStages];
  }

  public get activeWorkflowStage(): WorkflowStage {
    return this._activeWorkflowStage;
  }

  public addWorkflowStages(workflowStages: WorkflowStage[]): void {
    let workflowStageAdded = false;

    workflowStages.forEach(newWorkflowStage => {
      const workflowStageExists = this._workflowStages.some(
        workflowStage => workflowStage.id === newWorkflowStage.id
      );

      if (workflowStageExists) {
        throw new Error(
          `Duplicated workflow stage id (${newWorkflowStage.id})`
        );
      }

      this._workflowStages.push(newWorkflowStage);
      workflowStageAdded = true;
    });

    if (workflowStageAdded) {
      this._broadcastEvent(EVENTS.STAGES_CHANGED, {});
    }
  }

  private _updateToolBar(workflowStage: WorkflowStage) {
    const { toolbarService } = this._servicesManager.services;
    const { toolbar } = workflowStage;
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

  private _updatePanels(workflowStage: WorkflowStage) {
    const { panelService } = this._servicesManager.services;
    const panels = workflowStage?.layout?.panels;

    if (!panels) {
      return;
    }

    panelService.setPanels(panels);
  }

  private _updateHangingProtocol(workflowStage: WorkflowStage) {
    const { hangingProtocol } = workflowStage;

    if (!hangingProtocol) {
      return;
    }

    this._commandsManager.runCommand('setHangingProtocol', {
      protocolId: hangingProtocol.protocolId,
      stageId: hangingProtocol.stageId,
      stageIndex: hangingProtocol.stageIndex,
    });
  }

  public setActiveWorkflowStage(workflowStageId: string): void {
    if (workflowStageId === this._activeWorkflowStage?.id) {
      return;
    }

    const activeWorkflowStage = this._workflowStages.find(
      stage => stage.id === workflowStageId
    );

    if (!activeWorkflowStage) {
      throw new Error(`Invalid workflowStageId (${workflowStageId})`);
    }

    this._activeWorkflowStage = activeWorkflowStage;
    this._updateToolBar(activeWorkflowStage);
    this._updatePanels(activeWorkflowStage);
    this._updateHangingProtocol(activeWorkflowStage);
    this._broadcastEvent(EVENTS.ACTIVE_STAGE_CHANGED, { activeWorkflowStage });
  }

  public reset(): void {
    this._activeWorkflowStage = null;
    this._workflowStages = [];
  }

  public onModeEnter(): void {
    this.reset();
  }

  public static REGISTRATION = {
    name: 'workflowStagesService',
    create: ({ commandsManager, servicesManager }): WorkflowStagesService => {
      return new WorkflowStagesService(commandsManager, servicesManager);
    },
  };
}

export { WorkflowStagesService as default, WorkflowStagesService };
