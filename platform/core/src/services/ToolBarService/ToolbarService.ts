import merge from 'lodash.merge';
import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { RunCommand, Commands } from '../../types/Command';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

export type ButtonListeners = Record<string, RunCommand>;

export interface ButtonProps {
  primary?: Button;
  secondary?: Button;
  items?: Button[];
}

export interface Button extends Commands {
  id: string;
  icon?: string;
  label?: string;
  type?: string;
  tooltip?: string;
  isActive?: boolean;
  listeners?: ButtonListeners;
  props?: ButtonProps;
}

export interface ExtraButtonOptions {
  listeners?: ButtonListeners;
  isActive?: boolean;
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

  public static _createButton(
    type: string,
    id: string,
    icon: string,
    label: string,
    commands: Command | Commands,
    tooltip?: string,
    extraOptions?: ExtraButtonOptions
  ): Button {
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

  buttons: Record<string, Button> = {};
  state: {
    primaryToolId: string;
    toggles: Record<string, boolean>;
    groups: Record<string, unknown>;
  } = { primaryToolId: 'WindowLevel', toggles: {}, groups: {} };
  buttonSections: Record<string, unknown> = {
    /**
     * primary: ['Zoom', 'Wwwc'],
     * secondary: ['Length', 'RectangleRoi']
     */
  };
  _commandsManager: CommandsManager;
  extensionManager: ExtensionManager;

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
    };
    this.unsubscriptions = [];
    this.buttonSections = {};
    this.buttons = {};
  }

  public onModeEnter(): void {
    this.reset();
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
    const { groupId, itemId, interactionType, commands } = interaction;

    switch (interactionType) {
      case 'action': {
        commands.forEach(({ commandName, commandOptions, context }) => {
          if (commandName) {
            commandsManager.runCommand(
              commandName,
              {
                ...commandOptions,
                ...options,
              },
              context
            );
          }
        });
        break;
      }
      case 'tool': {
        try {
          commands.forEach(({ commandName = 'setToolActive', commandOptions, context }) => {
            commandsManager.runCommand(commandName, commandOptions, context);
          });

          // only set the primary tool if no error was thrown.
          // if the itemId is not undefined use it; otherwise, set the first tool in
          // the commands as the primary tool
          this.state.primaryToolId = itemId || commands[0].commandOptions?.toolName;
        } catch (error) {
          console.warn(error);
        }

        break;
      }
      case 'toggle': {
        const { commands } = interaction;
        let commandExecuted;

        // only toggle if a command was executed
        this.state.toggles[itemId] =
          this.state.toggles[itemId] === undefined ? true : !this.state.toggles[itemId];

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
    return this.buttons;
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

  /** Sets the toggle state of a button to the isToggled state */
  public setToggled(id: string, isToggled: boolean): void {
    if (isToggled) {
      this.state.toggles[id] = true;
    } else {
      delete this.state.toggles[id];
    }
  }

  setButton(id, button) {
    if (this.buttons[id]) {
      this.buttons[id] = merge(this.buttons[id], button);
      this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
        buttons: this.buttons,
        button: this.buttons[id],
        buttonSections: this.buttonSections,
      });
    }
  }

  public getButton(id: string): Button {
    return this.buttons[id];
  }

  /** Gets a nested button, found in the items/props for the children */
  public getNestedButton(id: string): Button {
    if (this.buttons[id]) {
      return this.buttons[id];
    }
    for (const buttonId of Object.keys(this.buttons)) {
      const { primary, items } = this.buttons[buttonId].props || {};
      if (primary?.id === id) { return primary; }
      const found = items?.find(childButton => childButton.id === id);
      if (found) {
        return found;
      }
    }
  }

  setButtons(buttons) {
    this.buttons = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      buttons: this.buttons,
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
   * Finds a button section by it's name, then maps the list of string name
   * identifiers to schema/values that can be used to render the buttons.
   *
   * @param {string} key
   * @param {*} props
   */
  getButtonSection(key, props) {
    const buttonSectionIds = this.buttonSections[key];
    const buttonsInSection = [];

    if (buttonSectionIds && buttonSectionIds.length !== 0) {
      buttonSectionIds.forEach(btnId => {
        const btn = this.buttons[btnId];
        const metadata = {};
        const mappedBtn = this._mapButtonToDisplay(btn, key, metadata, props);

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
      if (!this.buttons[button.id]) {
        this.buttons[button.id] = button;
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
      if (buttonItem.type === 'toggle') {
        this.setToggled(buttonItem.id, buttonItem.isActive);
      }
      this._setTogglesForButtonItems(buttonItem.props?.items);
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
