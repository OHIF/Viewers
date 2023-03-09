import { eventTarget, Types, EVENTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { setEnabledElement } from './state';

const cs3DToolsEvents = Enums.Events;

const showContextMenuDefault: Types.CommandCustomization = {
  commands: [
    {
      commandName: 'showViewerContextMenu',
      commandOptions: {
        menuName: 'cornerstoneContextMenu',
      },
      context: 'CORNERSTONE',
    },
  ],
};

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

  /**
   * Shows the context menu by calling the showContextMenu customization commands.
   * This allows configuring what data is available to the context menu for the
   * selector props, as well as completely replacing the type of context menu,
   * or replacing the context menu with an alternate view entirely such as a dialog.
   *
   * Looks up CustomizationService `showContextMenu` and retrieves the value
   * as a Command[] object, and then runs it with the nearby tool data.
   * The default is to run the command showViewerContextMenu in the CORNERSTONE
   * context.
   */
  const showContextMenu = event => {
    const nearbyToolData = findNearbyToolData(event);
    commandsManager.run(
      customizationService.get('showContextMenu') || showContextMenuDefault,
      { event, nearbyToolData }
    );
  };

  // TODO No CS3D support yet
  // const onTouchPress = event => {
  //   showContextMenu({
  //     event,
  //     nearbyToolData: undefined,
  //     isTouchEvent: true,
  //   });
  // };

  const resetContextMenu = () => {
    commandsManager.runCommand('closeContextMenu');
  };

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
  const contextMenuHandleClick = evt => {
    const mouseUpEvent = evt.detail.event;
    const isRightClick = mouseUpEvent.which === 3;

    const clickMethodHandler = isRightClick
      ? showContextMenu
      : resetContextMenu;
    clickMethodHandler(evt);
  };

  // const cancelContextMenuIfOpen = evt => {
  //   if (CONTEXT_MENU_OPEN) {
  //     resetContextMenu();
  //   }
  // };

  function elementEnabledHandler(evt) {
    const { viewportId, element } = evt.detail;
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    if (!viewportInfo) return;
    const viewportIndex = viewportInfo.getViewportIndex();
    // TODO check update upstream
    setEnabledElement(viewportIndex, element);

    element.addEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );
  }

  function elementDisabledHandler(evt) {
    const { element } = evt.detail;

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
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
