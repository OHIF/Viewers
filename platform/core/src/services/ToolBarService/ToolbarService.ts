import merge from 'lodash.merge';
import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

export default class ToolbarService extends PubSubService {
  public static REGISTRATION = {
    name: 'toolbarService',
    // Note the old name is ToolBarService, with an upper B
    altName: 'ToolBarService',
    create: ({ commandsManager }) => {
      return new ToolbarService(commandsManager);
    },
  };

  buttons: Record<string, unknown> = {};
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

  onModeEnter() {
    this.reset();
  }

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} options is an optional set of extra commandOptions
   *    used for calling the specified interaction.  That is, the command is
   *    called with {...commandOptions,...options}
   */
  recordInteraction(interaction, options?: Record<string, unknown>) {
    if (!interaction) return;
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
          commands.forEach(
            ({ commandName = 'setToolActive', commandOptions, context }) => {
              commandsManager.runCommand(commandName, commandOptions, context);
            }
          );

          // only set the primary tool if no error was thrown
          this.state.primaryToolId = itemId;
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
          this.state.toggles[itemId] === undefined
            ? true
            : !this.state.toggles[itemId];

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

    // // Storing the unsubscribe for later reseting
    // if (unsubscribe && typeof unsubscribe === 'function') {
    //   if (this.unsubscriptions.indexOf(unsubscribe) === -1) {
    //     this.unsubscriptions.push(unsubscribe);
    //   }
    // }

    // Track last touched id for each group
    if (groupId) {
      this.state.groups[groupId] = itemId;
    }

    this._broadcastEvent(this.EVENTS.TOOL_BAR_STATE_MODIFIED, {});
  }

  getButtons() {
    return this.buttons;
  }

  getActiveTools() {
    return [this.state.primaryToolId, ...Object.keys(this.state.toggles)];
  }

  /** Sets the toggle state of a button to the isActive state */
  public setActive(id: string, isActive: boolean): void {
    if (isActive) {
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

  getButton(id) {
    return this.buttons[id];
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
    const registeredToolbarModules = this.extensionManager.modules[
      'toolbarModule'
    ];

    if (
      Array.isArray(registeredToolbarModules) &&
      registeredToolbarModules.length
    ) {
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

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  /**
   *
   * @param {*} btn
   * @param {*} btnSection
   * @param {*} metadata
   * @param {*} props - Props set by the Viewer layer
   */
  _mapButtonToDisplay(btn, btnSection, metadata, props) {
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
    return uiType
      ? this._buttonTypes()[uiType]?.defaultComponent ?? null
      : null;
  }
}
