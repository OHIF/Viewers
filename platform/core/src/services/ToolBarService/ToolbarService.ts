import merge from 'lodash.merge';
import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { RunCommand, Commands, Command } from '../../types/Command';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

enum ButtonInteractionType {
  ACTION = 'action',
  TOGGLE = 'toggle',
  TOOL = 'tool',
}

export interface ButtonProps {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  commands?: Command | Commands;
  type?: ButtonInteractionType;
  isActive?: boolean;
  listeners?: Record<string, RunCommand>;
}

export interface NestedButtonProps {
  groupId: string;
  items: ButtonProps[];
  primary: ButtonProps;
  secondary: ButtonProps;
}

export interface Button {
  id: string;
  props: ButtonProps | NestedButtonProps;
  // button ui type (e.g. 'ohif.splitButton', 'ohif.radioGroup')
  // extensions can provide custom components for these types
  type: string;
}

export default class ToolbarService extends PubSubService {
  public static REGISTRATION = {
    name: 'toolbarService',
    // Note the old name is ToolBarService, with an upper B
    altName: 'ToolBarService',
    create: ({ commandsManager, extensionManager }) => {
      return new ToolbarService(commandsManager, extensionManager);
    },
  };

  public static ButtonInteractionType = ButtonInteractionType;

  public static _createButton(
    type: ButtonInteractionType,
    id: string,
    icon: string,
    label: string,
    commands: Command | Commands,
    tooltip?: string,
    extraOptions?: Record<string, unknown>
  ): ButtonProps {
    return {
      id,
      icon,
      label,
      type,
      commands,
      tooltip,
      ...extraOptions,
    };
  }

  public static _createActionButton = ToolbarService._createButton.bind(
    null,
    ButtonInteractionType.ACTION
  );
  public static _createToggleButton = ToolbarService._createButton.bind(
    null,
    ButtonInteractionType.TOGGLE
  );
  public static _createToolButton = ToolbarService._createButton.bind(
    null,
    ButtonInteractionType.TOOL
  );

  state: {
    primaryToolId: string;
    toggles: Record<string, boolean>;
    buttons: Record<string, Button>;
  } = { primaryToolId: '', toggles: {}, buttons: {} };

  buttonSections: Record<string, unknown> = {
    /**
     * primary: ['Zoom', 'Wwwc'],
     * secondary: ['Length', 'RectangleRoi']
     */
  };
  _commandsManager: CommandsManager;
  _extensionManager: ExtensionManager;

  defaultTool: Record<string, unknown>;

  constructor(commandsManager: CommandsManager, extensionManager: ExtensionManager) {
    super(EVENTS);
    this._commandsManager = commandsManager;
    this._extensionManager = extensionManager;
  }

  public reset(): void {
    this.unsubscriptions.forEach(unsub => unsub());
    this.state = {
      primaryToolId: 'WindowLevel',
      toggles: {},
      buttons: {},
    };
    this.unsubscriptions = [];
    this.buttonSections = {};
  }

  public onModeEnter(): void {
    this.reset();
  }

  /**
   * Sets the default tool that will be activated whenever the primary tool is
   * deactivated without activating another/different tool.
   * @param interaction the interaction command that will set the default tool active
   */
  public setDefaultTool(interaction) {
    this.defaultTool = interaction;
  }

  public getDefaultTool() {
    return this.defaultTool;
  }

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} options is an optional set of extra commandOptions
   *    used for calling the specified interaction.  That is, the command is
   *    called with {...commandOptions,...options}
   */
  public recordInteraction(interaction, options?: Record<string, unknown>) {
    if (!interaction) {
      return;
    }
    const commandsManager = this._commandsManager;
    const { commands, type, id } = interaction;

    const itemId = interaction.itemId || id;

    const buttonProps = this.getButtonProps(itemId as string);

    if (!buttonProps) {
      throw new Error(`Button not found for id: ${itemId}`);
    }

    // if not interaction type, assume the type can be used
    const { interactionType = type } = interaction;

    const prevPrimaryToolId = this.state.primaryToolId;

    switch (interactionType) {
      case ButtonInteractionType.ACTION: {
        commandsManager.run(commands, options);
        break;
      }
      case ButtonInteractionType.TOOL: {
        try {
          commandsManager.run(commands, options);

          const toolName = commands[0].commandOptions?.toolName;

          // only set the primary tool if no error was thrown.
          // if the itemId is not undefined use it; otherwise, set the first tool in
          // the commands as the primary tool
          this.state.primaryToolId = itemId || toolName;
        } catch (error) {
          console.warn(error);
        }

        break;
      }
      case ButtonInteractionType.TOGGLE: {
        const { commands } = interaction;
        let commandExecuted;
        // only toggle if a command was executed
        this._setToggled(itemId);

        if (!commands) {
          break;
        }

        commands.forEach(({ commandName, commandOptions, context }) => {
          if (!commandOptions) {
            commandOptions = {};
          }

          if (commandName) {
            commandOptions.toggledState = this.state.toggles[itemId];

            try {
              commandsManager.runCommand(commandName, commandOptions, context);
              commandExecuted = true;
            } catch (error) {
              console.warn(error);
            }
          }
        });

        if (!commandExecuted) {
          // If no command was executed, we need to toggle the state back
          this.state.toggles[itemId] = !this.state.toggles[itemId];
        }

        break;
      }
      default:
        throw new Error(`Invalid interaction type: ${interactionType}`);
    }

    this.updateToolbarStateAfterInteraction({
      itemId,
      interactionType,
      prevPrimaryToolId,
    });
  }

  /**
   * Consolidates the state of the toolbar after an interaction
   *
   * Basically if the interaction was done on a button that was just a regular
   * button (not nested), the we can set the isActive state of the button to true
   */
  updateToolbarStateAfterInteraction({ itemId, interactionType, prevPrimaryToolId = null }) {
    // check the id of the button that was interacted with, and see if it is part
    // of a group of buttons
    const groupId = this.findGroupIdByItemId(itemId);

    if (interactionType === ButtonInteractionType.TOOL) {
      // we should find the previous primary tool and set it to be inactive
      this._updateButtonActiveState(prevPrimaryToolId, false);
    }

    if (!groupId) {
      if (interactionType === ButtonInteractionType.TOGGLE) {
        // if it is a toggle, we need to check the toggled state to decide if
        // the button should be active or not
        const isToggled = this.state.toggles[itemId];
        this._updateButtonActiveState(itemId, isToggled);
      } else if (interactionType === ButtonInteractionType.TOOL) {
        // regular button, we can certainly say it is active now and the UI can
        // decide to show it as such
        this._updateButtonActiveState(itemId, true);
      }
    } else {
      // if it is a nested button, we have to check if the item was the primary
      // item or the nested items that were interacted with, it they were
      // nested item, we have to move that item to be the primary item now
      // and set the primary item to be active
      const { primary, items } = this.state.buttons[groupId].props as NestedButtonProps;
      const isPrimary = primary.id === itemId;
      const item = items.find(({ id }) => id === itemId);

      if (isPrimary && interactionType === ButtonInteractionType.TOOL) {
        this._updateButtonActiveState(itemId, true);
      } else if (isPrimary && interactionType === ButtonInteractionType.TOGGLE) {
        // we need to check the toggled state to decide if the primary item
        // should be active or not
        const isToggled = this.state.toggles[itemId];
        this._updateButtonActiveState(itemId, isToggled);
      } else {
        // if it was not primary item that was clicked, we need to
        // move the item to be the primary item, however, we need to actually
        // decide based on the interaction type.
        if (interactionType === ButtonInteractionType.TOOL) {
          (this.state.buttons[groupId].props as NestedButtonProps).primary = item;
          this._updateButtonActiveState(itemId, true);
        } else {
          // if it was a toggle or action, we need to check if there was an already
          // active TOOL inside the group, if there was, we CANT change the
          // primary item, we can only change the active state of the button
          // that was toggled
          const activeTool = items.find(({ id }) => {
            const props = this.getButtonProps(id);
            return props?.type === ButtonInteractionType.TOOL && props.isActive;
          });

          if (!activeTool) {
            (this.state.buttons[groupId].props as NestedButtonProps).primary = item;
          }

          // if it is not action, make it active too, since we need to show it
          // for toggle state, Actions don't have active state
          if (interactionType === ButtonInteractionType.TOGGLE) {
            const isToggled = this.state.toggles[itemId];
            this._updateButtonActiveState(itemId, isToggled);
          }
        }
      }
    }

    this._broadcastEvent(this.EVENTS.TOOL_BAR_STATE_MODIFIED, { ...this.state });
  }

  private _updateButtonActiveState(itemId, isActive) {
    const buttonProps = this.getButtonProps(itemId);
    if (buttonProps) {
      buttonProps.isActive = isActive;
    }
  }

  findGroupIdByItemId(itemId) {
    const { buttons } = this.state;
    const buttonKeys = Object.keys(buttons);

    for (const buttonId of buttonKeys) {
      const { groupId, items } = buttons[buttonId].props as NestedButtonProps;
      if (groupId && items) {
        const found = items.some(({ id }) => id === itemId);
        if (found) {
          return groupId;
        }
      }
    }
  }

  getButtons() {
    return this.state.buttons;
  }

  getActiveTools() {
    const activeTools = [this.state.primaryToolId];
    Object.keys(this.state.toggles).forEach(key => {
      if (this.state.toggles[key]) {
        activeTools.push(key);
      }
    });
    return activeTools;
  }

  getActivePrimaryTool() {
    return this.state.primaryToolId;
  }

  /** Sets the toggle state of a button to the isToggled state */
  private _setToggled(itemId: string): void {
    this.state.toggles[itemId] = !this.state.toggles[itemId];
  }

  public setToggled(itemId: string): void {
    debugger;
    this._setToggled(itemId);
    this.updateToolbarStateAfterInteraction({
      itemId,
      interactionType: ButtonInteractionType.TOGGLE,
    });

    this._broadcastEvent(this.EVENTS.TOOL_BAR_STATE_MODIFIED, { ...this.state });
  }

  setButton(id, button) {
    if (!this.state.buttons[id]) {
      return;
    }

    this.state.buttons[id] = merge(this.state.buttons[id], button);

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      buttons: this.state.buttons,
      button: this.state.buttons[id],
      buttonSections: this.buttonSections,
    });
  }

  public getButton(id: string): Button {
    return this.state.buttons[id];
  }

  /** Gets a nested button, found in the items/props for the children */
  public getButtonProps(id: string): ButtonProps {
    for (const buttonId of Object.keys(this.state.buttons)) {
      const { primary, items } = (this.state.buttons[buttonId].props as NestedButtonProps) || {};
      if (primary?.id === id) {
        return primary;
      }
      const found = items?.find(childButton => childButton.id === id);
      if (found) {
        return found;
      }
    }

    // This should be checked after we checked the nested buttons, since
    // we are checking based on the ids, the nested objects are higher priority
    // and more specific
    if (this.state.buttons[id]) {
      return this.state.buttons[id].props as ButtonProps;
    }
  }

  setButtons(buttons) {
    this.state.buttons = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      buttons: this.state.buttons,
      buttonSections: this.buttonSections,
    });
  }

  _buttonTypes() {
    const buttonTypes = {};
    const registeredToolbarModules = this._extensionManager.modules['toolbarModule'];

    if (Array.isArray(registeredToolbarModules) && registeredToolbarModules.length) {
      registeredToolbarModules.forEach(toolbarModule =>
        toolbarModule.module.forEach(def => {
          buttonTypes[def.name] = def;
        })
      );
    }

    return buttonTypes;
  }

  createButtonSection(key, buttons) {
    // Maybe do this mapping at time of return, instead of time of create
    // Props check important for validation here...

    this.buttonSections[key] = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  /**
   *
   * Finds a button section by it's name/tool group id, then maps the list of string name
   * identifiers to schema/values that can be used to render the buttons.
   *
   * @param toolGroupId - the tool group id
   * @param props - optional properties to apply to every button of the section
   * @param defaultToolGroupId - the fallback section to return if the given toolGroupId section is not available
   */
  getButtonSection(
    toolGroupId: string,
    props?: Record<string, unknown>,
    defaultToolGroupId = 'primary'
  ) {
    const buttonSectionIds =
      this.buttonSections[toolGroupId] || this.buttonSections[defaultToolGroupId];
    const buttonsInSection = [];

    if (buttonSectionIds && buttonSectionIds.length !== 0) {
      buttonSectionIds.forEach(btnId => {
        const btn = this.state.buttons[btnId];
        const metadata = {};
        const mappedBtn = this._mapButtonToDisplay(btn, toolGroupId, metadata, props);

        buttonsInSection.push(mappedBtn);
      });
    }

    return buttonsInSection;
  }

  /**
   *
   * @param {object[]} buttons
   * @param {string} buttons[].id
   */
  addButtons(buttons) {
    buttons.forEach(button => {
      if (!this.state.buttons[button.id]) {
        this.state.buttons[button.id] = button;
      }
    });
    this._initToggledButtons(buttons);

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  _initToggledButtons(buttons) {
    if (!buttons) {
      return;
    }

    buttons.forEach(({ id, isActive, props, type }) => {
      const isToggleButton =
        type === ButtonInteractionType.TOGGLE || props?.type === ButtonInteractionType.TOGGLE;

      // if the button does not have a toggle state, set it to false
      if (isToggleButton && this.state.toggles[id] === undefined) {
        this.state.toggles[id] = isActive || false;
      }

      props?.items && this._initToggledButtons(props.items);
    });
  }

  /**
   *
   * @param {*} btn
   * @param {*} btnSection
   * @param {*} metadata
   * @param {*} props - Props set by the Viewer layer
   */
  _mapButtonToDisplay(btn, btnSection, metadata, props) {
    if (!btn) {
      return;
    }

    const { id, type, component } = btn;
    const buttonType = this._buttonTypes()[type];

    if (!buttonType) {
      return;
    }

    return {
      id,
      Component: component || buttonType.defaultComponent,
      componentProps: Object.assign({}, btn.props, props),
    };
  }

  getButtonComponentForUIType(uiType: string) {
    return uiType ? this._buttonTypes()[uiType]?.defaultComponent ?? null : null;
  }
}
