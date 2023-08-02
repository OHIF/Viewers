// import cloneDeep from 'lodash.clonedeep';
import { Types as OhifTypes, ServicesManager, PubSubService } from '@ohif/core';
import {
  // cache,
  // Enums as csEnums,
  // geometryLoader,
  eventTarget,
  // getEnabledElementByIds,
  // metaData,
  // utilities as csUtils,
  // volumeLoader,
} from '@cornerstonejs/core';
import {
  // CONSTANTS as cstConstants,
  Enums as cstEnums,
  // segmentation as cstSegmentation,
  // Types as cstTypes,
  // utilities as cstUtils,
} from '@cornerstonejs/tools';
import { CornerstoneServices } from '../../types';
// import isEqual from 'lodash.isequal';
// import { Types as ohifTypes } from '@ohif/core';
// import { easeInOutBell, reverseEaseInOutBell } from '../../utils/transitions';
// import {
//   Segment,
//   Segmentation,
//   SegmentationConfig,
// } from './ToolServiceTypes';
// import { mapROIContoursToRTStructData } from './RTSTRUCT/mapROIContoursToRTStructData';

const EVENTS = {
  TOOL_ACTIVATED: 'event::cornerstone::toolservice:toolActivated',
  PRIMARY_TOOL_ACTIVATED:
    'event::cornerstone::toolservice:primaryToolActivated',
};

class ToolService extends PubSubService {
  static REGISTRATION = {
    name: 'toolService',
    altName: 'ToolService',
    create: ({
      servicesManager,
    }: OhifTypes.Extensions.ExtensionParams): ToolService => {
      return new ToolService({ servicesManager });
    },
  };

  readonly servicesManager: ServicesManager;
  readonly EVENTS = EVENTS;

  constructor({ servicesManager }) {
    super(EVENTS);

    this.servicesManager = servicesManager;
    this._initToolService();
  }

  private _initToolService() {
    eventTarget.addEventListener(
      cstEnums.Events.TOOL_ACTIVATED,
      this._onToolActivated
    );
  }

  public destroy = () => {
    eventTarget.removeEventListener(
      cstEnums.Events.TOOL_ACTIVATED,
      this._onToolActivated
    );
  };

  private _onToolActivated = evt => {
    const { toolName, toolBindingsOptions } = evt.detail;
    const isPrimaryTool = toolBindingsOptions.bindings?.some(
      binding => binding.mouseButton === cstEnums.MouseBindings.Primary
    );

    this._broadcastEvent(EVENTS.TOOL_ACTIVATED, {
      toolName,
      toolBindingsOptions,
    });

    if (isPrimaryTool) {
      this._broadcastEvent(EVENTS.PRIMARY_TOOL_ACTIVATED, { toolName });
    }
  };

  public getActivePrimaryMouseButtonTool(toolGroupId?: string): string {
    const { toolGroupService } = this.servicesManager
      .services as CornerstoneServices;

    const toolGroup = toolGroupService.getToolGroup(toolGroupId);

    return toolGroup?.getActivePrimaryMouseButtonTool();
  }

  public setPrimaryToolActive(toolName: string, toolGroupId?: string): void {
    const {
      toolGroupService,
      viewportGridService,
      uiNotificationService,
    } = this.servicesManager.services as CornerstoneServices;

    if (toolName === 'Crosshairs') {
      const activeViewportToolGroup = toolGroupService.getToolGroup(null);

      if (!activeViewportToolGroup._toolInstances.Crosshairs) {
        uiNotificationService.show({
          title: 'Crosshairs',
          message:
            'You need to be in a MPR view to use Crosshairs. Click on MPR button in the toolbar to activate it.',
          type: 'info',
          duration: 3000,
        });

        throw new Error('Crosshairs tool is not available in this viewport');
      }
    }

    const { viewports } = viewportGridService.getState() || {
      viewports: [],
    };

    const toolGroup = toolGroupService.getToolGroup(toolGroupId);
    const toolGroupViewportIds = toolGroup?.getViewportIds?.();

    // if toolGroup has been destroyed, or its viewports have been removed
    if (!toolGroupViewportIds || !toolGroupViewportIds.length) {
      return;
    }

    const filteredViewports = viewports.filter(viewport => {
      if (!viewport.viewportOptions) {
        return false;
      }

      return toolGroupViewportIds.includes(viewport.viewportOptions.viewportId);
    });

    if (!filteredViewports.length) {
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
    // Set the new toolName to be active
    toolGroup.setToolActive(toolName, {
      bindings: [
        {
          mouseButton: cstEnums.MouseBindings.Primary,
        },
      ],
    });
  }
}

export { ToolService as default, ToolService, EVENTS };
