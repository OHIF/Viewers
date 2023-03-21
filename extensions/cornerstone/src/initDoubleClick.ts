import { eventTarget, EVENTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { CommandsManager, CustomizationService, Types } from '@ohif/core';

const cs3DToolsEvents = Enums.Events;

const DEFAULT_DOUBLE_CLICK_COMMAND: Types.Command = {
  commandName: 'toggleOneUp',
  commandOptions: {},
};

export type initDoubleClickArgs = {
  customizationService: CustomizationService;
  commandsManager: CommandsManager;
};

function initDoubleClick({
  customizationService,
  commandsManager,
}: initDoubleClickArgs): void {
  const cornerstoneViewportHandleDoubleClick = _ => {
    const customizations: Types.Command | Types.CommandCustomization =
      (customizationService.get(
        'cornerstoneViewportDoubleClickCommands'
      ) as Types.CommandCustomization) || DEFAULT_DOUBLE_CLICK_COMMAND;

    commandsManager.run(customizations);
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

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );
}

export default initDoubleClick;
