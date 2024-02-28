import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { RunCommand } from '../../types/Command';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

export type EvaluatePublic = string | EvaluateFunction;

export type EvaluateFunction = (props: Record<string, unknown>) => {
  disabled: boolean;
  className: string;
};

export interface ButtonProps {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  commands?: RunCommand;
  disabled?: boolean;
  className?: string;
  evaluate?: EvaluatePublic;
}

export interface NestedButtonProps {
  groupId: string;
  // group evaluate which is different
  // from the evaluate function for the primary and items
  evaluate?: EvaluatePublic;
  items: ButtonProps[];
  primary: ButtonProps & {
    // Todo: this is really ugly but really we don't have any other option
    // the ui design requires this since the button should be rounded if
    // active otherwise it should not be rounded
    isActive?: boolean;
  };
  secondary: ButtonProps;
}

export interface Button {
  id: string;
  props: ButtonProps | NestedButtonProps;
  // button ui type (e.g. 'ohif.splitButton', 'ohif.radioGroup')
  // extensions can provide custom components for these types
  uiType: string;
}

export default class ToolbarService extends PubSubService {
  public static REGISTRATION = {
    name: 'toolbarService',
    altName: 'ToolBarService',
    create: ({ commandsManager, extensionManager }) => {
      return new ToolbarService(commandsManager, extensionManager);
    },
  };

  public static createButton(options: {
    id: string;
    icon: string;
    label: string;
    commands: RunCommand;
    tooltip?: string;
    evaluate?: EvaluatePublic;
  }): ButtonProps {
    const { id, icon, label, commands, tooltip, evaluate } = options;
    return {
      id,
      icon,
      label,
      commands,
      tooltip: tooltip || label,
      evaluate,
    };
  }

  state: {
    // all buttons in the toolbar with their props
    buttons: Record<string, Button>;
    // the buttons in the toolbar, grouped by section, with their ids
    buttonSections: Record<string, string[]>;
  } = {
    buttons: {},
    buttonSections: {},
  };

  _commandsManager: CommandsManager;
  _extensionManager: ExtensionManager;
  _evaluateFunction: Record<string, EvaluateFunction> = {};

  defaultTool: Record<string, unknown>;

  constructor(commandsManager: CommandsManager, extensionManager: ExtensionManager) {
    super(EVENTS);
    this._commandsManager = commandsManager;
    this._extensionManager = extensionManager;
  }

  public reset(): void {
    this.unsubscriptions.forEach(unsub => unsub());
    this.state = {
      buttons: {},
      buttonSections: {},
    };
    this.unsubscriptions = [];
  }

  public onModeEnter(): void {
    this.reset();
  }

  /**
   * Registers an evaluate function with the specified name.
   *
   * @param name - The name of the evaluate function.
   * @param handler - The evaluate function handler.
   */
  public registerEvaluateFunction(name: string, handler: EvaluateFunction) {
    this._evaluateFunction[name] = handler;
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

  getActiveTools() {
    return ['WindowLevel'];
  }

  /**
   * Adds buttons to the toolbar.
   * @param buttons - The buttons to be added.
   */
  public addButtons(buttons: Button[]): void {
    buttons.forEach(button => {
      if (!this.state.buttons[button.id]) {
        this.state.buttons[button.id] = button;
      }
    });

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      ...this.state,
    });
  }

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} options is an optional set of extra commandOptions
   *    used for calling the specified interaction.  That is, the command is
   *    called with {...commandOptions,...options}
   */
  public recordInteraction(
    interaction,
    options?: {
      refreshProps: Record<string, unknown>;
      [key: string]: unknown;
    }
  ) {
    // if interaction is a string, we can assume it is the itemId
    // and get the props to get the other properties
    if (typeof interaction === 'string') {
      interaction = this.getButtonProps(interaction);
    }

    const { commands, id } = interaction;

    const itemId = interaction.itemId || id;

    const buttonProps = this.getButtonProps(itemId as string);

    if (!buttonProps) {
      throw new Error(`Button not found for id: ${itemId}`);
    }

    if (commands) {
      commands.forEach(({ commandName, commandOptions = { ...options }, context }) => {
        this._commandsManager.runCommand(commandName, commandOptions, context);
      });
    }

    this.refreshToolbarState(options?.refreshProps);
  }

  /**
   * Consolidates the state of the toolbar after an interaction, it accepts
   * props that get passed to the buttons
   *
   * @param refreshProps - The props that buttons need to get evaluated, they can be
   * { viewportId, toolGroup} for cornerstoneTools.
   *
   * Todo: right now refreshToolbarState should be used in the context where
   * we have access to the toolGroup and viewportId, but we should be able to
   * pass the props to the toolbar service and it should be able to decide
   * which buttons to evaluate based on the props
   */
  public refreshToolbarState(refreshProps) {
    const buttons = this.state.buttons;
    const refreshedButtons = Object.values(buttons).reduce((acc, button: Button) => {
      const isNested = (button.props as NestedButtonProps)?.groupId;

      if (!isNested) {
        const buttonProps = button.props as ButtonProps;
        const evaluated = buttonProps?.evaluate?.({
          ...refreshProps,
          button,
        });
        buttonProps.disabled = evaluated?.disabled || false;
        buttonProps.className = evaluated?.className || '';

        acc[button.id] = button;
      } else {
        let buttonProps = button.props as NestedButtonProps;
        // if it is nested we should perform evaluate on each item in the group
        const { evaluate: groupEvaluate } = buttonProps;

        const groupEvaluated = groupEvaluate?.({ ...refreshProps, button });
        // handle group evaluate function which might switch the primary
        // item in the group
        buttonProps = {
          ...buttonProps,
          primary: groupEvaluated?.primary || buttonProps.primary,
        };

        const { primary, items } = buttonProps;

        const primaryEvaluated = primary.evaluate?.({ ...refreshProps, button: primary });
        primary.disabled = primaryEvaluated?.disabled || false;
        primary.className = primaryEvaluated?.className || '';
        primary.isActive = primaryEvaluated?.isActive || false;

        items.forEach(item => {
          const evaluated = item.evaluate?.({ ...refreshProps, button: item });
          item.disabled = evaluated?.disabled || false;
          item.className = evaluated?.className || '';
        });

        acc[button.id] = {
          ...button,
          props: {
            ...button.props,
            primary,
            items,
          },
        };
      }

      return acc;
    }, {});

    this.setButtons(refreshedButtons);
    return this.state;
  }

  /**
   * Consolidates the state of the toolbar after an interaction
   *
   * Basically if the interaction was done on a button that was just a regular
   * button (not nested), the we can set the isActive state of the button to true
   */
  // refreshToolbarState({ itemId, interactionType, prevPrimaryToolId = null }) {
  //   // check the id of the button that was interacted with, and see if it is part
  //   // of a group of buttons
  //   const groupId = this.findGroupIdByItemId(itemId);

  //   if (interactionType === ButtonInteractionType.TOOL) {
  //     // we should find the previous primary tool and set it to be inactive
  //     this._updateButtonActiveState(prevPrimaryToolId, false);
  //   }

  //   if (!groupId) {
  //     if (interactionType === ButtonInteractionType.TOGGLE) {
  //       // if it is a toggle, we need to check the toggled state to decide if
  //       // the button should be active or not
  //       const isToggled = this.state.toggles[itemId];
  //       this._updateButtonActiveState(itemId, isToggled);
  //     } else if (interactionType === ButtonInteractionType.TOOL) {
  //       // regular button, we can certainly say it is active now and the UI can
  //       // decide to show it as such
  //       this._updateButtonActiveState(itemId, true);
  //     }
  //   } else {
  //     // if it is a nested button, we have to check if the item was the primary
  //     // item or the nested items that were interacted with, it they were
  //     // nested item, we have to move that item to be the primary item now
  //     // and set the primary item to be active
  //     const { primary, items } = this.state.buttons[groupId].props as NestedButtonProps;
  //     const isPrimary = primary.id === itemId;
  //     const item = items.find(({ id }) => id === itemId);

  //     if (isPrimary && interactionType === ButtonInteractionType.TOOL) {
  //       this._updateButtonActiveState(itemId, true);
  //     } else if (isPrimary && interactionType === ButtonInteractionType.TOGGLE) {
  //       // we need to check the toggled state to decide if the primary item
  //       // should be active or not
  //       const isToggled = this.state.toggles[itemId];
  //       this._updateButtonActiveState(itemId, isToggled);
  //     } else {
  //       // if it was not primary item that was clicked, we need to
  //       // move the item to be the primary item, however, we need to actually
  //       // decide based on the interaction type.
  //       if (interactionType === ButtonInteractionType.TOOL) {
  //         (this.state.buttons[groupId].props as NestedButtonProps).primary = item;
  //         this._updateButtonActiveState(itemId, true);
  //       } else {
  //         // if it was a toggle or action, we need to check if there was an already
  //         // active TOOL inside the group, if there was, we CANT change the
  //         // primary item, we can only change the active state of the button
  //         // that was toggled
  //         const activeTool = items.find(({ id }) => {
  //           const props = this.getButtonProps(id);
  //           return props?.type === ButtonInteractionType.TOOL && props.isActive;
  //         });

  //         if (!activeTool) {
  //           (this.state.buttons[groupId].props as NestedButtonProps).primary = item;
  //         }

  //         // if it is not action, make it active too, since we need to show it
  //         // for toggle state, Actions don't have active state
  //         if (interactionType === ButtonInteractionType.TOGGLE) {
  //           const isToggled = this.state.toggles[itemId];
  //           this._updateButtonActiveState(itemId, isToggled);
  //         }
  //       }
  //     }
  //   }

  //   this._broadcastEvent(this.EVENTS.TOOL_BAR_STATE_MODIFIED, { ...this.state });
  // }

  // findGroupIdByItemId(itemId) {
  //   const { buttons } = this.state;
  //   const buttonKeys = Object.keys(buttons);

  //   for (const buttonId of buttonKeys) {
  //     const { groupId, items } = buttons[buttonId].props as NestedButtonProps;
  //     if (groupId && items) {
  //       const found = items.some(({ id }) => id === itemId);
  //       if (found) {
  //         return groupId;
  //       }
  //     }
  //   }
  // }

  /**
   * Sets the buttons for the toolbar, don't use this method to record an
   * interaction, since it doesn't update the state of the buttons, use
   * this if you know the buttons you want to set and you want to set them
   * all at once.
   * @param buttons - The buttons to set.
   */
  public setButtons(buttons) {
    this.state.buttons = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      buttons: this.state.buttons,
      buttonSections: this.state.buttonSections,
    });
  }

  /**
   * Retrieves a button by its ID.
   * @param id - The ID of the button to retrieve.
   * @returns The button with the specified ID.
   */
  public getButton(id: string): Button {
    return this.state.buttons[id];
  }

  /**
   * Retrieves the buttons from the toolbar service.
   * @returns An array of buttons.
   */
  public getButtons() {
    return this.state.buttons;
  }

  /**
   * Retrieves the button properties for the specified button ID.
   * It prioritizes nested buttons over regular buttons if the ID is found
   * in both.
   *
   * @param id - The ID of the button.
   * @returns The button properties.
   */
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

  _getButtonUITypes() {
    const registeredToolbarModules = this._extensionManager.modules['toolbarModule'];

    if (!Array.isArray(registeredToolbarModules)) {
      return {};
    }

    return registeredToolbarModules.reduce((buttonTypes, toolbarModule) => {
      toolbarModule.module.forEach(def => {
        buttonTypes[def.name] = def;
      });

      return buttonTypes;
    }, {});
  }

  /**
   * Creates a button section with the specified key and buttons.
   * @param {string} key - The key of the button section.
   * @param {Array} buttons - The buttons to be added to the section.
   */
  createButtonSection(key, buttons) {
    this.state.buttonSections[key] = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, { ...this.state });
  }

  /**
   * Retrieves the button section with the specified sectionId.
   *
   * @param sectionId - The ID of the button section to retrieve.
   * @param props - Optional additional properties for mapping the button to display.
   * @returns An array of buttons in the specified section, mapped to their display representation.
   */
  getButtonSection(sectionId: string, props?: Record<string, unknown>) {
    const buttonSectionIds = this.state.buttonSections[sectionId];

    return (
      buttonSectionIds?.map(btnId => {
        const btn = this.state.buttons[btnId];
        return this._mapButtonToDisplay(btn, props);
      }) || []
    );
  }

  /**
   *
   * @param {*} btn
   * @param {*} btnSection
   * @param {*} metadata
   * @param {*} props - Props set by the Viewer layer
   */
  _mapButtonToDisplay(btn, props) {
    if (!btn) {
      return;
    }

    const { id, uiType, component } = btn;
    const { groupId } = btn.props;

    const buttonType = this._getButtonUITypes()[uiType];

    if (!buttonType) {
      return;
    }

    if (!groupId) {
      this.handleEvaluate(btn.props);
    } else {
      // nested
      const { primary, items } = btn.props;

      // handle group evaluate function
      this.handleEvaluate(btn.props);

      // primary and items evaluate functions
      this.handleEvaluate(primary);
      items.forEach(item => this.handleEvaluate(item));
    }

    return {
      id,
      Component: component || buttonType.defaultComponent,
      componentProps: Object.assign({}, btn.props, props),
    };
  }

  handleEvaluate = props => {
    const { evaluate } = props;
    // handle evaluate functions that are registered
    if (evaluate && typeof evaluate === 'string') {
      const evaluateFunction = this._evaluateFunction[evaluate];

      if (!evaluateFunction) {
        throw new Error(
          `Evaluate function not found for name: ${evaluate}, you can  register an evaluate function with the getToolbarModule in your extensions`
        );
      }

      if (evaluateFunction) {
        props.evaluate = evaluateFunction;
      }
    }
  };

  getButtonComponentForUIType(uiType: string) {
    return uiType ? this._getButtonUITypes()[uiType]?.defaultComponent ?? null : null;
  }
}
