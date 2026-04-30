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

type ToolBindings = Array<Record<string, unknown>>;
type PersistedToolBindings = Record<string, Record<string, ToolBindings>>;
type ApplyToolBindingsOptions = {
  replaceExisting?: boolean;
};

export default class ToolGroupService {
  public static REGISTRATION = {
    name: 'toolGroupService',
    altName: 'ToolGroupService',
    create: ({ servicesManager }: OhifTypes.Extensions.ExtensionParams): ToolGroupService => {
      return new ToolGroupService(servicesManager);
    },
  };

  servicesManager: AppTypes.ServicesManager;
  cornerstoneViewportService: any;
  viewportGridService: any;
  uiNotificationService: any;
  customizationService: any;
  private toolGroupIds: Set<string> = new Set();
  private toolBindingsMap: Map<string, Map<string, Array<Record<string, unknown>>>> = new Map();
  /**
   * Service-specific
   */
  listeners: { [key: string]: Function[] };
  EVENTS: { [key: string]: string };

  constructor(servicesManager: AppTypes.ServicesManager) {
    const {
      cornerstoneViewportService,
      viewportGridService,
      uiNotificationService,
      customizationService,
    } =
      servicesManager.services;
    this.cornerstoneViewportService = cornerstoneViewportService;
    this.viewportGridService = viewportGridService;
    this.uiNotificationService = uiNotificationService;
    this.customizationService = customizationService;
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
    this.toolBindingsMap.clear();

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
    this._loadPersistedBindings(toolGroupId);
  }

  public createToolGroupAndAddTools(toolGroupId: string, tools: Array<Tool>): Types.IToolGroup {
    const toolGroup = this.createToolGroup(toolGroupId);
    this.addToolsToToolGroup(toolGroupId, tools);
    return toolGroup;
  }
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

  public getToolBindings(
    toolGroupId: string,
    toolName: string
  ): ToolBindings | undefined {
    return this.toolBindingsMap.get(toolGroupId)?.get(toolName);
  }

  public setToolBindings(toolGroupId: string, toolName: string, bindings: ToolBindings): void {
    if (!this.toolBindingsMap.has(toolGroupId)) {
      this.toolBindingsMap.set(toolGroupId, new Map());
    }
    this.toolBindingsMap.get(toolGroupId).set(toolName, bindings);
  }

  public persistToolBindings(toolGroupId: string, toolName: string, bindings: ToolBindings): void {
    const persistedBindings = this._readPersistedToolBindings();
    if (!persistedBindings[toolGroupId]) {
      persistedBindings[toolGroupId] = {};
    }

    persistedBindings[toolGroupId][toolName] = bindings;
    this._writePersistedToolBindings(persistedBindings);
  }

  public removePersistedToolBindings(toolGroupId: string, toolName?: string): void {
    const persistedBindings = this._readPersistedToolBindings();
    if (!persistedBindings[toolGroupId]) {
      return;
    }

    if (toolName) {
      delete persistedBindings[toolGroupId][toolName];
      if (!Object.keys(persistedBindings[toolGroupId]).length) {
        delete persistedBindings[toolGroupId];
      }
    } else {
      delete persistedBindings[toolGroupId];
    }

    this._writePersistedToolBindings(persistedBindings);
  }

  public applyToolBindings(
    toolGroupId: string,
    toolName: string,
    options: ApplyToolBindingsOptions = {}
  ): void {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup || !toolGroup.hasTool(toolName)) {
      return;
    }
    const bindings = this.getToolBindings(toolGroupId, toolName);
    if (!bindings) {
      return;
    }
    const { mode } = toolGroup.getToolOptions(toolName);
    if (
      mode === Enums.ToolModes.Active ||
      mode === Enums.ToolModes.Passive ||
      mode === Enums.ToolModes.Enabled
    ) {
      if (options.replaceExisting) {
        // Opt-in behavior for callers that need replacement semantics.
        toolGroup.setToolDisabled(toolName);
      }
      toolGroup.setToolActive(toolName, { bindings });
    }
  }

  public getAllToolBindings(): Array<{
    toolGroupId: string;
    toolName: string;
    bindings: Array<Record<string, unknown>>;
  }> {
    const result = [];
    for (const [toolGroupId, toolMap] of this.toolBindingsMap) {
      for (const [toolName, bindings] of toolMap) {
        result.push({ toolGroupId, toolName, bindings });
      }
    }
    return result;
  }

  private _setToolsMode(toolGroup, tools) {
    const { active, passive, enabled, disabled } = tools;

    if (active) {
      active.forEach(({ toolName, bindings }) => {
        if (bindings) {
          this.setToolBindings(toolGroup.id, toolName, bindings);
        }
        toolGroup.setToolActive(toolName, { bindings });
      });
    }

    if (passive) {
      passive.forEach(({ toolName, bindings }) => {
        if (bindings) {
          this.setToolBindings(toolGroup.id, toolName, bindings);
        }
        toolGroup.setToolPassive(toolName);
      });
    }

    if (enabled) {
      enabled.forEach(({ toolName, bindings }) => {
        if (bindings) {
          this.setToolBindings(toolGroup.id, toolName, bindings);
        }
        toolGroup.setToolEnabled(toolName);
      });
    }

    if (disabled) {
      disabled.forEach(({ toolName, bindings }) => {
        if (bindings) {
          this.setToolBindings(toolGroup.id, toolName, bindings);
        }
        toolGroup.setToolDisabled(toolName);
      });
    }
  }

  private _addTools(toolGroup, tools) {
    const addTools = tools => {
      tools.forEach(({ toolName, parentTool, configuration }) => {
        if (parentTool) {
          toolGroup.addToolInstance(toolName, parentTool, {
            ...configuration,
          });
        } else {
          toolGroup.addTool(toolName, { ...configuration });
        }
      });
    };

    if (tools.active) {
      addTools(tools.active);
    }

    if (tools.passive) {
      addTools(tools.passive);
    }

    if (tools.enabled) {
      addTools(tools.enabled);
    }

    if (tools.disabled) {
      addTools(tools.disabled);
    }
  }

  private _loadPersistedBindings(toolGroupId: string): void {
    const toolGroupBindings = this._readPersistedToolBindings()[toolGroupId];
    if (!toolGroupBindings) {
      return;
    }

    for (const [toolName, bindings] of Object.entries(toolGroupBindings)) {
      this.setToolBindings(toolGroupId, toolName, bindings as ToolBindings);
    }
  }

  private _readPersistedToolBindings(): PersistedToolBindings {
    try {
      const stored = localStorage.getItem(this._getToolBindingsStorageKey());
      if (!stored) {
        return {};
      }

      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      return parsed as PersistedToolBindings;
    } catch {
      // ignore corrupt localStorage
      return {};
    }
  }

  private _writePersistedToolBindings(bindings: PersistedToolBindings): void {
    const storageKey = this._getToolBindingsStorageKey();
    if (!Object.keys(bindings).length) {
      localStorage.removeItem(storageKey);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(bindings));
  }

  private _getToolBindingsStorageKey(): string {
    const customizationValue = this.customizationService?.getCustomization(
      'ohif.userPreferences.toolBindingsStorageKey'
    );

    return typeof customizationValue === 'string' && customizationValue.length > 0
      ? customizationValue
      : 'user-preferred-tool-bindings';
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
