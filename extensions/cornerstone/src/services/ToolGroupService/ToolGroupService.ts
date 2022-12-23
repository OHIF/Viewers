import { ToolGroupManager, Enums, Types } from '@cornerstonejs/tools';

import { pubSubServiceInterface } from '@ohif/core';

const EVENTS = {
  VIEWPORT_ADDED: 'event::cornerstone::toolgroupservice:viewportadded',
  TOOLGROUP_CREATED: 'event::cornerstone::toolgroupservice:toolgroupcreated',
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
  serviceManager: any;
  private toolGroupIds: Set<string> = new Set();
  /**
   * Service-specific
   */
  listeners: { [key: string]: Function[] };
  EVENTS: { [key: string]: string };

  constructor(serviceManager) {
    const { CornerstoneViewportService } = serviceManager.services;
    this.CornerstoneViewportService = CornerstoneViewportService;
    this.listeners = {};
    this.EVENTS = EVENTS;
    Object.assign(this, pubSubServiceInterface);
  }

  /**
   * Returns the cornerstone ToolGroup for a given toolGroup UID
   * @param {string} toolGroupId - The toolGroup uid
   * @returns {IToolGroup} - The toolGroup
   */
  public getToolGroup(toolGroupId: string): Types.IToolGroup | void {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    return toolGroup;
  }

  public getToolGroupIds(): string[] {
    return Array.from(this.toolGroupIds);
  }

  public getToolGroupForViewport(viewportId: string): Types.IToolGroup | void {
    const renderingEngine = this.CornerstoneViewportService.getRenderingEngine();
    return ToolGroupManager.getToolGroupForViewport(
      viewportId,
      renderingEngine.id
    );
  }

  public getActiveToolForViewport(viewportId: string): string {
    const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId);
    if (!toolGroup) {
      return null;
    }

    return toolGroup.getActivePrimaryMouseButtonTool();
  }

  public destroy() {
    ToolGroupManager.destroy();
    this.toolGroupIds = new Set();
  }

  public destroyToolGroup(toolGroupId: string) {
    ToolGroupManager.destroyToolGroup(toolGroupId);
    this.toolGroupIds.delete(toolGroupId);
  }

  public removeViewportFromToolGroup(
    viewportId: string,
    renderingEngineId: string,
    deleteToolGroupIfEmpty?: boolean
  ): void {
    const toolGroup = ToolGroupManager.getToolGroupForViewport(
      viewportId,
      renderingEngineId
    );

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

  public addToolsToToolGroup(
    toolGroupId: string,
    tools: Array<Tool>,
    configs: any = {}
  ): void {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    // this.changeConfigurationIfNecessary(toolGroup, volumeId);
    this._addTools(toolGroup, tools, configs);
    this._setToolsMode(toolGroup, tools);
  }

  public createToolGroupAndAddTools(
    toolGroupId: string,
    tools: Array<Tool>,
    configs: any = {}
  ): Types.IToolGroup {
    const toolGroup = this.createToolGroup(toolGroupId);
    this.addToolsToToolGroup(toolGroupId, tools, configs);
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

  private _getToolNames(toolGroupTools: Tools): string[] {
    const toolNames = [];
    if (toolGroupTools.active) {
      toolGroupTools.active.forEach(tool => {
        toolNames.push(tool.toolName);
      });
    }
    if (toolGroupTools.passive) {
      toolGroupTools.passive.forEach(tool => {
        toolNames.push(tool.toolName);
      });
    }

    if (toolGroupTools.enabled) {
      toolGroupTools.enabled.forEach(tool => {
        toolNames.push(tool.toolName);
      });
    }

    if (toolGroupTools.disabled) {
      toolGroupTools.disabled.forEach(tool => {
        toolNames.push(tool.toolName);
      });
    }

    return toolNames;
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
    const toolNames = this._getToolNames(tools);
    toolNames.forEach(toolName => {
      // Initialize the toolConfig if no configuration is provided
      const toolConfig = configs[toolName] ?? {};

      // if (volumeUID) {
      //   toolConfig.volumeUID = volumeUID;
      // }

      toolGroup.addTool(toolName, { ...toolConfig });
    });
  }
}
