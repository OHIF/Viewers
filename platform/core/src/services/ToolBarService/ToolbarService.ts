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
    create: ({ commandsManager }) => {
      return new ToolbarService(commandsManager);
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
    groups: Record<string, unknown>;
    buttons: Record<string, Button>;
  } = { primaryToolId: '', toggles: {}, groups: {}, buttons: {} };

  buttonSections: Record<string, unknown> = {
    /**
     * primary: ['Zoom', 'Wwwc'],
     * secondary: ['Length', 'RectangleRoi']
     */
  };
  _commandsManager: CommandsManager;
  extensionManager: ExtensionManager;

  defaultTool: Record<string, unknown>;

  constructor(commandsManager: CommandsManager) {
    super(EVENTS);
    this._commandsManager = commandsManager;
  }

  public init(extensionManager: ExtensionManager): void {
    this.extensionManager = extensionManager;
  }

  public reset(): void {
    this.unsubscriptions.forEach(unsub => unsub());
    this.state = {
      primaryToolId: 'WindowLevel',
      toggles: {},
      groups: {},
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
    const { groupId, commands, type, id } = interaction;

    const itemId = interaction.itemId || id;

    const buttonProps = this.getNestedButtonProps(itemId as string);

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

          // update isActive state for the button

          // find the other active button of type tools and set it to false
          const currentActiveButton = this.getNestedButtonProps(prevPrimaryToolId);
          if (currentActiveButton) {
            currentActiveButton.isActive = false;
          }

          buttonProps.isActive = true;
        } catch (error) {
          console.warn(error);
        }

        break;
      }
      case ButtonInteractionType.TOGGLE: {
        const { commands } = interaction;
        let commandExecuted;

        // only toggle if a command was executed
        this._setToggleForButton(interaction);

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

    // Todo: comment out for now
    // Run command if there's one associated
    //
    // NOTE: Should probably just do this for tools as well?
    // But would be nice if we could enforce at least the command name?
    // let unsubscribe;
    // if (commandName) {
    //   unsubscribe = commandsManager.runCommand(commandName, commandOptions);
    // }

    // // Storing the unsubscribe for later resetting
    // if (unsubscribe && typeof unsubscribe === 'function') {
    //   if (this.unsubscriptions.indexOf(unsubscribe) === -1) {
    //     this.unsubscriptions.push(unsubscribe);
    //   }
    // }

    // Track last touched id for each group
    if (groupId) {
      this.state.groups[groupId] = itemId;
    }

    this._broadcastEvent(this.EVENTS.TOOL_BAR_STATE_MODIFIED, { ...this.state });
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
  public setToggled(id: string, isToggled: boolean): void {
    if (isToggled) {
      this.state.toggles[id] = true;
    } else {
      delete this.state.toggles[id];
    }
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
  public getNestedButtonProps(id: string): ButtonProps {
    if (this.state.buttons[id]) {
      return this.state.buttons[id].props as ButtonProps;
    }
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
    const registeredToolbarModules = this.extensionManager.modules['toolbarModule'];

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
    this._setTogglesForButtonItems(buttons);

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  _setTogglesForButtonItems(buttons) {
    if (!buttons) {
      return;
    }

    buttons.forEach(buttonItem => {
      if (buttonItem.type === ButtonInteractionType.TOGGLE) {
        this._setToggleForButton(buttonItem);
      }

      this._setTogglesForButtonItems(buttonItem.props?.items);
    });
  }

  _setToggleForButton(button) {
    this.setToggled(button.id, button.isActive);
    button.isActive = this.state.toggles[button.id];
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
