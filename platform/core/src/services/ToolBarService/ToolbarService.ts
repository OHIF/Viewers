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

  public static _createActionButton = ToolbarService._createButton.bind(null, 'action');
  public static _createToggleButton = ToolbarService._createButton.bind(null, 'toggle');
  public static _createToolButton = ToolbarService._createButton.bind(null, 'tool');

  buttons: Record<string, Button> = {};
  state: {
    primaryToolId: string;
    toggles: Record<string, boolean>;
    groups: Record<string, unknown>;
  } = { primaryToolId: '', toggles: {}, groups: {} };

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
    };
    this.unsubscriptions = [];
    this.buttonSections = {};
    this.buttons = {};
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
    const { groupId, itemId, commands, type } = interaction;
    let { interactionType } = interaction;

    // if not interaction type, assume the type can be used
    if (!interactionType) {
      interactionType = type;
    }

    switch (interactionType) {
      case 'action': {
        commandsManager.run(commands, options);
        break;
      }
      case 'tool': {
        try {
          const alternateInteraction =
            this.state.primaryToolId === itemId &&
            this.defaultTool?.itemId !== itemId &&
            this.getDefaultTool();
          if (alternateInteraction) {
            // Allow toggling the mode off
            return this.recordInteraction(alternateInteraction, options);
          }
          commandsManager.run(commands, options);

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
        const btn = this.buttons[btnId];
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
