import { eventTarget, Types, EVENTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { setEnabledElement } from './state';

const cs3DToolsEvents = Enums.Events;

const DEFAULT_CONTEXT_MENU_CLICKS = {
  button1: {
    commands: [
      {
        commandName: 'closeContextMenu',
      },
    ],
  },
  button3: {
    commands: [
      {
        commandName: 'showViewerContextMenu',
        commandOptions: {
          menuName: 'cornerstoneContextMenu',
        },
        context: 'CORNERSTONE',
      },
    ],
  },
};

/**
 * Generates a name, consisting of:
 *    * alt when the alt key is down
 *    * ctrl when the cctrl key is down
 *    * shift when the shift key is down
 *    * 'button' followed by the button number (1 left, 3 right etc)
 */
function getEventName(evt) {
  const button = evt.detail.event.which;
  const nameArr = [];
  if (evt.detail.event.altKey) nameArr.push('alt');
  if (evt.detail.event.ctrlKey) nameArr.push('ctrl');
  if (evt.detail.event.shiftKey) nameArr.push('shift');
  nameArr.push('button');
  nameArr.push(button);
  return nameArr.join('');
}

function initContextMenu({
  cornerstoneViewportService,
  customizationService,
  commandsManager,
}): void {
  /**
   * Finds tool nearby event position triggered.
   *
   * @param {Object} commandsManager mannager of commands
   * @param {Object} event that has being triggered
   * @returns cs toolData or undefined if not found.
   */
  const findNearbyToolData = evt => {
    if (!evt?.detail) {
      return;
    }
    const { element, currentPoints } = evt.detail;
    return commandsManager.runCommand(
      'getNearbyToolData',
      {
        element,
        canvasCoordinates: currentPoints?.canvas,
      },
      'CORNERSTONE'
    );
  };

  /*
   * Run the commands associated with the given button press,
   * defaults on button1 and button2
   */
  const cornerstoneViewportHandleEvent = (name, evt) => {
    const customizations =
      customizationService.get('cornerstoneViewportClickCommands') ||
      DEFAULT_CONTEXT_MENU_CLICKS;
    const toRun = customizations[name];
    console.log('initContextMenu::cornerstoneViewportHandleEvent', name, toRun);
    const options = {
      nearbyToolData: findNearbyToolData(evt),
      event: evt,
    };
    commandsManager.run(toRun, options);
  };

  const cornerstoneViewportHandleClick = evt => {
    const name = getEventName(evt);
    cornerstoneViewportHandleEvent(name, evt);
  };

  function elementEnabledHandler(evt) {
    const { viewportId, element } = evt.detail;
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    if (!viewportInfo) return;
    const viewportIndex = viewportInfo.getViewportIndex();
    // TODO check update upstream
    setEnabledElement(viewportIndex, element);

    element.addEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      cornerstoneViewportHandleClick
    );
  }

  function elementDisabledHandler(evt) {
    const { element } = evt.detail;

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      cornerstoneViewportHandleClick
    );
  }

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );
}

export default initContextMenu;
