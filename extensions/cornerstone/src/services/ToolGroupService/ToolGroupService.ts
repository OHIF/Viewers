import { ToolGroupManager, Enums, Types } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';

import { Types as OhifTypes, pubSubServiceInterface } from '@ohif/core';
import getActiveViewportEnabledElement from '../../utils/getActiveViewportEnabledElement';

const EVENTS = {
  VIEWPORT_ADDED: 'event::cornerstone::toolgroupservice:viewportadded',
  TOOLGROUP_CREATED: 'event::cornerstone::toolgroupservice:toolgroupcreated',
  TOOL_ACTIVATED: 'event::cornerstone::toolgroupservice:toolactivated',
  PRIMARY_TOOL_ACTIVATED: 'event::cornerstone::toolgroupservice:primarytoolactivated',
};

type Tool = {
  toolName: string;
  bindings?: typeof Enums.MouseBindings | Enums.KeyboardBindings;
};

type Tools = {
  active: Tool[];
  passive?: Tool[];
  enabled?: Tool[];
  disabled?: Tool[];
};

export default class ToolGroupService {
  public static REGISTRATION = {
    name: 'toolGroupService',
    altName: 'ToolGroupService',
    create: ({ servicesManager }: OhifTypes.Extensions.ExtensionParams): ToolGroupService => {
      return new ToolGroupService(servicesManager);
    },
  };

  serviceManager: any;
  private toolGroupIds: Set<string> = new Set();
  /**
   * Service-specific
   */
  listeners: { [key: string]: Function[] };
  EVENTS: { [key: string]: string };

  constructor(serviceManager) {
    const { cornerstoneViewportService, viewportGridService, uiNotificationService } =
      serviceManager.services;
    this.cornerstoneViewportService = cornerstoneViewportService;
    this.viewportGridService = viewportGridService;
    this.uiNotificationService = uiNotificationService;
    this.listeners = {};
    this.EVENTS = EVENTS;
    Object.assign(this, pubSubServiceInterface);

    this._init();
  }

  onModeExit() {
    this.destroy();
  }

  private _init() {
    eventTarget.addEventListener(Enums.Events.TOOL_ACTIVATED, this._onToolActivated);
  }

  /**
   * Retrieves a tool group from the ToolGroupManager by tool group ID.
   * If no tool group ID is provided, it retrieves the tool group of the active viewport.
   * @param toolGroupId - Optional ID of the tool group to retrieve.
   * @returns The tool group or undefined if it is not found.
   */
  public getToolGroup(toolGroupId?: string): Types.IToolGroup | void {
    let toolGroupIdToUse = toolGroupId;

    if (!toolGroupIdToUse) {
      // Use the active viewport's tool group if no tool group id is provided
      const enabledElement = getActiveViewportEnabledElement(this.viewportGridService);

      if (!enabledElement) {
        return;
      }

      const { renderingEngineId, viewportId } = enabledElement;
      const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId, renderingEngineId);

      if (!toolGroup) {
        console.warn(
          'No tool group found for viewportId:',
          viewportId,
          'and renderingEngineId:',
          renderingEngineId
        );
        return;
      }

      toolGroupIdToUse = toolGroup.id;
    }

    const toolGroup = ToolGroupManager.getToolGroup(toolGroupIdToUse);
    return toolGroup;
  }

  public getToolGroupIds(): string[] {
    return Array.from(this.toolGroupIds);
  }

  public getToolGroupForViewport(viewportId: string): Types.IToolGroup | void {
    const renderingEngine = this.cornerstoneViewportService.getRenderingEngine();
    return ToolGroupManager.getToolGroupForViewport(viewportId, renderingEngine.id);
  }

  public getActiveToolForViewport(viewportId: string): string {
    const toolGroup = this.getToolGroupForViewport(viewportId);
    if (!toolGroup) {
      return;
    }

    return toolGroup.getActivePrimaryMouseButtonTool();
  }

  public destroy(): void {
    ToolGroupManager.destroy();
    this.toolGroupIds = new Set();

    eventTarget.removeEventListener(Enums.Events.TOOL_ACTIVATED, this._onToolActivated);
  }

  public destroyToolGroup(toolGroupId: string): void {
    ToolGroupManager.destroyToolGroup(toolGroupId);
    this.toolGroupIds.delete(toolGroupId);
  }

  public removeViewportFromToolGroup(
    viewportId: string,
    renderingEngineId: string,
    deleteToolGroupIfEmpty?: boolean
  ): void {
    const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId, renderingEngineId);

    if (!toolGroup) {
      return;
    }

    toolGroup.removeViewports(renderingEngineId, viewportId);

    const viewportIds = toolGroup.getViewportIds();

    if (viewportIds.length === 0 && deleteToolGroupIfEmpty) {
      ToolGroupManager.destroyToolGroup(toolGroup.id);
    }
  }

  public addViewportToToolGroup(
    viewportId: string,
    renderingEngineId: string,
    toolGroupId?: string
  ): void {
    if (!toolGroupId) {
      // If toolGroupId is not provided, add the viewport to all toolGroups
      const toolGroups = ToolGroupManager.getAllToolGroups();
      toolGroups.forEach(toolGroup => {
        toolGroup.addViewport(viewportId, renderingEngineId);
      });
    } else {
      let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) {
        toolGroup = this.createToolGroup(toolGroupId);
      }

      toolGroup.addViewport(viewportId, renderingEngineId);
    }

    this._broadcastEvent(EVENTS.VIEWPORT_ADDED, {
      viewportId,
      toolGroupId,
    });
  }

  public createToolGroup(toolGroupId: string): Types.IToolGroup {
    if (this.getToolGroup(toolGroupId)) {
      throw new Error(`ToolGroup ${toolGroupId} already exists`);
    }

    // if the toolGroup doesn't exist, create it
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
    this.toolGroupIds.add(toolGroupId);

    this._broadcastEvent(EVENTS.TOOLGROUP_CREATED, {
      toolGroupId,
    });

    return toolGroup;
  }

  public addToolsToToolGroup(toolGroupId: string, tools: Array<Tool>, configs: any = {}): void {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    // this.changeConfigurationIfNecessary(toolGroup, volumeId);
    this._addTools(toolGroup, tools, configs);
    this._setToolsMode(toolGroup, tools);
  }

  public createToolGroupAndAddTools(toolGroupId: string, tools: Array<Tool>): Types.IToolGroup {
    const toolGroup = this.createToolGroup(toolGroupId);
    this.addToolsToToolGroup(toolGroupId, tools);
    return toolGroup;
  }

  /**
  private changeConfigurationIfNecessary(toolGroup, volumeUID) {
    // handle specific assignment for volumeUID (e.g., fusion)
    const toolInstances = toolGroup._toolInstances;
    // Object.values(toolInstances).forEach(toolInstance => {
    //   if (toolInstance.configuration) {
    //     toolInstance.configuration.volumeUID = volumeUID;
    //   }
    // });
  }
  */

  /**
   * Get the tool's configuration based on the tool name and tool group id
   * @param toolGroupId - The id of the tool group that the tool instance belongs to.
   * @param toolName - The name of the tool
   * @returns The configuration of the tool.
   */
  public getToolConfiguration(toolGroupId: string, toolName: string) {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) {
      return null;
    }

    const tool = toolGroup.getToolInstance(toolName);
    if (!tool) {
      return null;
    }

    return tool.configuration;
  }

  /**
   * Set the tool instance configuration. This will update the tool instance configuration
   * on the toolGroup
   * @param toolGroupId - The id of the tool group that the tool instance belongs to.
   * @param toolName - The name of the tool
   * @param config - The configuration object that you want to set.
   */
  public setToolConfiguration(toolGroupId, toolName, config) {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    const toolInstance = toolGroup.getToolInstance(toolName);
    toolInstance.configuration = config;
  }

  public getActivePrimaryMouseButtonTool(toolGroupId?: string): string {
    return this.getToolGroup(toolGroupId)?.getActivePrimaryMouseButtonTool();
  }

  public setPrimaryToolActive(
    toolName: string,
    toolGroupId?: string,
    toggledState?: boolean
  ): void {
    if (toolName === 'Crosshairs') {
      const activeViewportToolGroup = this.getToolGroup(null);

      if (!activeViewportToolGroup._toolInstances.Crosshairs) {
        this.uiNotificationService.show({
          title: 'Crosshairs',
          message:
            'You need to be in a MPR view to use Crosshairs. Click on MPR button in the toolbar to activate it.',
          type: 'info',
          duration: 3000,
        });

        throw new Error('Crosshairs tool is not available in this viewport');
      }
    }

    const { viewports } = viewportGridService.getState();

    if (!viewports.size) {
      return;
    }

    const toolGroup = toolGroupService.getToolGroup(toolGroupId);

    if (!toolGroup) {
      return;
    }

    if (!toolGroup.getToolInstance(toolName)) {
      uiNotificationService.show({
        title: `${toolName} tool`,
        message: `The ${toolName} tool is not available in this viewport.`,
        type: 'info',
        duration: 3000,
      });

      throw new Error(`ToolGroup ${toolGroup.id} does not have this tool.`);
    }

    const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

    if (activeToolName) {
      // Todo: this is a hack to prevent the crosshairs to stick around
      // after another tool is selected. We should find a better way to do this
      if (activeToolName === 'Crosshairs') {
        toolGroup.setToolDisabled(activeToolName);
      } else {
        toolGroup.setToolPassive(activeToolName);
      }
    }

    // If there is a toggle state, then simply set the enabled/disabled state without
    // setting the tool active.
    if (toggledState != null) {
      toggledState ? toolGroup.setToolEnabled(toolName) : toolGroup.setToolDisabled(toolName);
      return;
    }

    // Set the new toolName to be active
    toolGroup.setToolActive(toolName, {
      bindings: [
        {
          mouseButton: Enums.MouseBindings.Primary,
        },
      ],
    });
  }

  private _setToolsMode(toolGroup, tools) {
    const { active, passive, enabled, disabled } = tools;

    if (active) {
      active.forEach(({ toolName, bindings }) => {
        toolGroup.setToolActive(toolName, { bindings });
      });
    }

    if (passive) {
      passive.forEach(({ toolName }) => {
        toolGroup.setToolPassive(toolName);
      });
    }

    if (enabled) {
      enabled.forEach(({ toolName }) => {
        toolGroup.setToolEnabled(toolName);
      });
    }

    if (disabled) {
      disabled.forEach(({ toolName }) => {
        toolGroup.setToolDisabled(toolName);
      });
    }
  }

  private _addTools(toolGroup, tools, configs) {
    const toolModes = Object.values(Enums.ToolModes).map(toolMode => toolMode.toLowerCase());

    toolModes.forEach(toolMode => {
      (tools[toolMode] ?? []).forEach(tool => {
        const { toolName, parentClassName } = tool;
        const toolConfig = { ...(configs[toolName] ?? {}) };

        if (parentClassName) {
          toolGroup.addToolInstance(toolName, parentClassName, toolConfig);
        } else {
          toolGroup.addTool(toolName, toolConfig);
        }
      });
    });
  }

  private _onToolActivated = (evt: Types.EventTypes.ToolActivatedEventType) => {
    const { toolGroupId, toolName, toolBindingsOptions } = evt.detail;
    const isPrimaryTool = toolBindingsOptions.bindings?.some(
      binding => binding.mouseButton === Enums.MouseBindings.Primary
    );

    const callbackProps = {
      toolGroupId,
      toolName,
      toolBindingsOptions,
    };

    this._broadcastEvent(EVENTS.TOOL_ACTIVATED, callbackProps);

    if (isPrimaryTool) {
      this._broadcastEvent(EVENTS.PRIMARY_TOOL_ACTIVATED, callbackProps);
    }
  };
}
