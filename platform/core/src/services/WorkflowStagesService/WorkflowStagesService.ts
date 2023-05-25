import React, { useState } from 'react';
import { CommandsManager } from '../../classes';
import { ServicesManager, ToolbarService } from '../../services';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVE_STAGE_CHANGED: 'event::workflowStagesService:activateStageChanged',
  STAGES_CHANGED: 'event::workflowStagesService:stagesChanged',
};

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
      leftPanels?: unknown[];
      rightPanels?: unknown[];
      rightPanelDefaultClosed?: boolean;
    };
  };
};

class WorkflowStagesService extends PubSubService {
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;
  private _stages: WorkflowStage[];
  private _activeStage: WorkflowStage;

  constructor(
    commandsManager: CommandsManager,
    servicesManager: ServicesManager
  ) {
    super(EVENTS);
    this._stages = [];
    this._activeStage = null;
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
  }

  public get stages(): WorkflowStage[] {
    return this._stages;
  }

  public get activeStage(): WorkflowStage {
    return this._activeStage;
  }

  public addStages(stages: WorkflowStage[]): void {
    let stageAdded = false;

    stages.forEach(newStage => {
      const stageExists = this._stages.some(stage => stage.id === newStage.id);

      if (stageExists) {
        throw new Error(`Duplicated stage id (${newStage.id})`);
      }

      this._stages.push(newStage);
      stageAdded = true;
    });

    if (stageAdded) {
      this._broadcastEvent(EVENTS.STAGES_CHANGED, {});
    }
  }

  private _updateToolBar(stage: WorkflowStage) {
    const { toolbarService } = this._servicesManager.services;
    const { toolbar } = stage;
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

  private _updatePanels(stage: WorkflowStage) {
    const { panelService } = this._servicesManager.services;
    const panels = stage?.layout?.panels;

    if (!panels) {
      return;
    }

    panelService.reset();

    Object.keys(panels).forEach(position => {
      panelService.addPanels(position, panels[position]);
    });
  }

  private _updateHangingProtocol(stage: WorkflowStage) {
    const { hangingProtocol } = stage;

    if (!hangingProtocol) {
      return;
    }

    this._commandsManager.runCommand('setHangingProtocol', {
      protocolId: hangingProtocol.protocolId,
      stageId: hangingProtocol.stageId,
      stageIndex: hangingProtocol.stageIndex,
    });
  }

  private _activateStage(stage: WorkflowStage): void {
    this._updateToolBar(stage);
    this._updatePanels(stage);
    this._updateHangingProtocol(stage);
  }

  public setActiveStage(stageId: string): void {
    const activeStage = this._stages.find(stage => stage.id === stageId);

    if (!activeStage) {
      throw new Error(`Invalid stageId (${stageId})`);
    }

    this._activeStage = activeStage;
    this._activateStage(activeStage);
    this._broadcastEvent(EVENTS.ACTIVE_STAGE_CHANGED, { activeStage });
  }

  public reset(): void {
    this._activeStage = null;
    this._stages = [];
  }

  public onModeEnter(): void {
    this.reset();
  }

  public static REGISTRATION = {
    name: 'workflowStagesService',
    create: ({
      // configuration = {},
      commandsManager,
      servicesManager,
    }): WorkflowStagesService => {
      return new WorkflowStagesService(commandsManager, servicesManager);
    },
  };
}

export { WorkflowStagesService as default, WorkflowStagesService };
