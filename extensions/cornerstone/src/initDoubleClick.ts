import { eventTarget, EVENTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { CommandsManager, CustomizationService, ToolbarService, Types } from '@ohif/core';
import { findNearbyToolData } from './utils/findNearbyToolData';

const cs3DToolsEvents = Enums.Events;

const DEFAULT_DOUBLE_CLICK = {
  doubleClick: {
    commandName: 'toggleOneUp',
    commandOptions: {},
  },
};

/**
 * Generates a double click event name, consisting of:
 *    * alt when the alt key is down
 *    * ctrl when the cctrl key is down
 *    * shift when the shift key is down
 *    * 'doubleClick'
 */
function getDoubleClickEventName(evt: CustomEvent) {
  const nameArr = [];
  if (evt.detail.event.altKey) {
    nameArr.push('alt');
  }
  if (evt.detail.event.ctrlKey) {
    nameArr.push('ctrl');
  }
  if (evt.detail.event.shiftKey) {
    nameArr.push('shift');
  }
  nameArr.push('doubleClick');
  return nameArr.join('');
}

export type initDoubleClickArgs = {
  customizationService: CustomizationService;
  toolbarService: ToolbarService;
  commandsManager: CommandsManager;
};

function initDoubleClick({
  customizationService,
  toolbarService,
  commandsManager,
}: initDoubleClickArgs): void {
  const cornerstoneViewportHandleDoubleClick = (evt: CustomEvent) => {
    const activeTools = toolbarService.getActiveTools();
    const nearbyToolData = findNearbyToolData(commandsManager, evt);

    // Do not allow double click on a tool or while magic ROI is active
    if (nearbyToolData || activeTools.includes('MagicROI')) {
      return;
    }

    const eventName = getDoubleClickEventName(evt);

    // Allows for the customization of the double click on a viewport.
    const customizations =
      customizationService.get('cornerstoneViewportClickCommands') || DEFAULT_DOUBLE_CLICK;

    const toRun = customizations[eventName];

    if (!toRun) {
      return;
    }

    commandsManager.run(toRun);
  };

  function elementEnabledHandler(evt: CustomEvent) {
    const { element } = evt.detail;

    element.addEventListener(
      cs3DToolsEvents.MOUSE_DOUBLE_CLICK,
      cornerstoneViewportHandleDoubleClick
    );
  }

  function elementDisabledHandler(evt: CustomEvent) {
    const { element } = evt.detail;

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_DOUBLE_CLICK,
      cornerstoneViewportHandleDoubleClick
    );
  }

  eventTarget.addEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler.bind(null));

  eventTarget.addEventListener(EVENTS.ELEMENT_DISABLED, elementDisabledHandler.bind(null));
}

export default initDoubleClick;
