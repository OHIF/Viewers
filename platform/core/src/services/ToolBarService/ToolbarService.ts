import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { RunCommand } from '../../types/Command';
import { Button, ButtonProps, EvaluateFunction, EvaluatePublic } from './types';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

/**
 * Predefined toolbar sections used throughout the application
 */
export const TOOLBAR_SECTIONS = {
  /**
   * Main toolbar
   */
  primary: 'primary',

  /**
   * Secondary toolbar
   */
  secondary: 'secondary',

  /**
   * Viewport action menu sections
   */
  viewportActionMenu: {
    topLeft: 'viewportActionMenu.topLeft',
    topRight: 'viewportActionMenu.topRight',
    bottomLeft: 'viewportActionMenu.bottomLeft',
    bottomRight: 'viewportActionMenu.bottomRight',
    topMiddle: 'viewportActionMenu.topMiddle',
    bottomMiddle: 'viewportActionMenu.bottomMiddle',
    leftMiddle: 'viewportActionMenu.leftMiddle',
    rightMiddle: 'viewportActionMenu.rightMiddle',
  },

  // mode specific
  segmentationToolbox: 'segmentationToolbox',
  dynamicToolbox: 'dynamic-toolbox',
  roiThresholdToolbox: 'ROIThresholdToolbox',
};

export enum ButtonLocation {
  TopLeft = 0,
  TopMiddle = 1,
  TopRight = 2,
  LeftMiddle = 3,
  RightMiddle = 4,
  BottomLeft = 5,
  BottomMiddle = 6,
  BottomRight = 7,
}

export default class ToolbarService extends PubSubService {
  public static REGISTRATION = {
    name: 'toolbarService',
    altName: 'ToolBarService',
    create: ({ commandsManager, extensionManager, servicesManager }) => {
      return new ToolbarService(commandsManager, extensionManager, servicesManager);
    },
  };

  /**
   * Access to predefined toolbar sections for autocomplete support
   */
  public get sections() {
    return TOOLBAR_SECTIONS;
  }

  public static createButton(options: {
    id: string;
    label: string;
    commands: RunCommand;
    icon?: string;
    tooltip?: string;
    evaluate?: EvaluatePublic;
    listeners?: Record<string, RunCommand>;
  }): ButtonProps {
    const { id, icon, label, commands, tooltip, evaluate, listeners } = options;
    return {
      id,
      icon,
      label,
      commands,
      tooltip: tooltip || label,
      evaluate,
      listeners,
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
  _servicesManager: AppTypes.ServicesManager;
  _evaluateFunction: Record<string, EvaluateFunction> = {};
  _serviceSubscriptions = [];

  constructor(
    commandsManager: CommandsManager,
    extensionManager: ExtensionManager,
    servicesManager: AppTypes.ServicesManager
  ) {
    super(EVENTS);
    this._commandsManager = commandsManager;
    this._extensionManager = extensionManager;
    this._servicesManager = servicesManager;
  }

  public reset(): void {
    // this.unsubscriptions.forEach(unsub => unsub());
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
   * Registers a service and its event to listen for updates and refreshes the toolbar state when the event is triggered.
   * @param service - The service to register.
   * @param event - The event to listen for.
   */
  public registerEventForToolbarUpdate(service, events) {
    const { viewportGridService } = this._servicesManager.services;
    const callback = () => {
      const viewportId = viewportGridService.getActiveViewportId();
      this.refreshToolbarState({ viewportId });
    };

    const unsubscriptions = events.map(event => {
      if (service.subscribe) {
        return service.subscribe(event, callback);
      } else if (service.addEventListener) {
        return service.addEventListener(event, callback);
      }
    });

    unsubscriptions.forEach(unsub => this._serviceSubscriptions.push(unsub));
  }

  /**
   * Removes buttons from the toolbar.
   * @param buttonId - The button to be removed.
   */
  public removeButton(buttonId: string) {
    if (this.state.buttons[buttonId]) {
      delete this.state.buttons[buttonId];
    }

    // Remove button from all sections
    Object.keys(this.state.buttonSections).forEach(sectionKey => {
      this.state.buttonSections[sectionKey] = this.state.buttonSections[sectionKey].filter(
        id => id !== buttonId
      );
    });

    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      ...this.state,
    });
  }

  /**
   * Adds buttons to the toolbar.
   * @param buttons - The buttons to be added.
   * @param replace - Flag indicating if any existing button with the same id as one being added should be replaced
   */
  public register(buttons: Button[], replace: boolean = false): void {
    buttons.forEach(button => {
      if (replace || !this.state.buttons[button.id]) {
        if (!button.props) {
          button.props = {} as ButtonProps;
        }

        // if button section is true as boolean, we assign the id of the button to the buttonSection
        if (button.props.buttonSection === true) {
          button.props.buttonSection = button.id;
        }

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

    const itemId = interaction.itemId ?? interaction.id;
    interaction.itemId = itemId;

    let commands = Array.isArray(interaction.commands)
      ? interaction.commands
      : [interaction.commands];

    commands = commands.filter(Boolean);

    if (!commands?.length) {
      this.refreshToolbarState({
        ...options?.refreshProps,
        itemId,
        interaction,
      });

      return;
    }

    const commandOptions = { ...options, ...interaction };

    commands = commands.map(command => {
      if (typeof command === 'function') {
        return () => {
          command({
            ...commandOptions,
            commandsManager: this._commandsManager,
            servicesManager: this._servicesManager,
          });
        };
      }

      return command;
    });

    // if still no commands, return
    commands = commands.filter(Boolean);

    if (!commands.length) {
      return;
    }

    // Loop through commands and run them with the combined options
    this._commandsManager.run(commands, commandOptions);

    this.refreshToolbarState({
      ...options?.refreshProps,
      itemId,
      interaction,
    });
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
    const originalButtons = this.state.buttons;
    const updatedButtons = { ...originalButtons };
    const evaluationResults = new Map();

    const evaluateButtonProps = (button, props, refreshProps) => {
      if (evaluationResults.has(button.id)) {
        const { disabled, disabledText, className, isActive } = evaluationResults.get(button.id);
        return { ...props, disabled, disabledText, className, isActive };
      } else {
        const evaluateProps = props.evaluateProps;
        const evaluated =
          typeof props.evaluate === 'function'
            ? props.evaluate({ ...refreshProps, button })
            : undefined;
        // Check hideWhenDisabled at both evaluateProps level and props level
        const hideWhenDisabled = evaluateProps?.hideWhenDisabled || props.hideWhenDisabled;
        const updatedProps = {
          ...props,
          ...evaluated,
          disabled: evaluated?.disabled || false,
          visible: hideWhenDisabled && evaluated?.disabled ? false : true,
          className: evaluated?.className || '',
          isActive: evaluated?.isActive, // isActive will be undefined for buttons without this prop
        };
        evaluationResults.set(button.id, updatedProps);
        return updatedProps;
      }
    };

    const updatedIds = new Set();
    Object.values(originalButtons).forEach(button => {
      // Note: do not re-evaluate buttons that have already been evaluated
      // this will result in inconsistencies in the toolbar state
      if (updatedIds.has(button.id)) {
        return;
      }

      const hasSection = (button.props as NestedButtonProps)?.buttonSection;

      if (!hasSection) {
        this.handleEvaluate(button.props);
        const buttonProps = button.props as ButtonProps;

        const updatedProps = evaluateButtonProps(button, buttonProps, refreshProps);
        updatedButtons[button.id] = {
          ...button,
          props: updatedProps,
        };

        updatedIds.add(button.id);
      } else {
        let buttonProps = button.props as NestedButtonProps;
        const { evaluate: groupEvaluate } = buttonProps;
        const groupEvaluated =
          typeof groupEvaluate === 'function'
            ? groupEvaluate({ ...refreshProps, button })
            : undefined;

        buttonProps = {
          ...buttonProps,
          disabled: groupEvaluated?.disabled ?? buttonProps.disabled,
          disabledText: groupEvaluated?.disabledText ?? buttonProps.disabledText,
        };

        const toolButtonIds = this.state.buttonSections[buttonProps.buttonSection];

        if (!toolButtonIds) {
          return;
        }

        toolButtonIds.forEach(buttonId => {
          const button = originalButtons[buttonId];
          if (!button) {
            return;
          }

          if (updatedIds.has(buttonId)) {
            return;
          }

          const updatedProps = evaluateButtonProps(button, button.props, refreshProps);
          updatedButtons[buttonId] = {
            ...button,
            props: updatedProps,
          };

          updatedIds.add(buttonId);
        });
      }
    });

    this.setButtons(updatedButtons);
    return this.state;
  }

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
   * @deprecated Use register() instead. This method will be removed in a future version.
   * Adds buttons to the toolbar.
   * @param buttons - The buttons to be added.
   * @param replace - Flag indicating if any existing button with the same id as one being added should be replaced
   */
  public addButtons(buttons: Button[], replace: boolean = false): void {
    console.warn(
      'ToolbarService.addButtons() is deprecated. Use ToolbarService.register() instead.'
    );
    this.register(buttons, replace);
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
   * Buttons already in the section (i.e. with the same ids) will NOT be added twice.
   * @param {string} key - The key of the button section.
   * @param {Array} buttons - The buttons to be added to the section.
   */
  updateSection(key, buttons) {
    if (this.state.buttonSections[key]) {
      this.state.buttonSections[key].push(
        ...buttons.filter(
          button => !this.state.buttonSections[key].find(sectionButton => sectionButton === button)
        )
      );
    } else {
      this.state.buttonSections[key] = buttons;
    }
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, { ...this.state });
  }

  /**
   * @deprecated Use updateSection() instead. This method will be removed in a future version.
   * Creates a button section with the specified key and buttons.
   * @param {string} key - The key of the button section.
   * @param {Array} buttons - The buttons to be added to the section.
   */
  createButtonSection(key, buttons) {
    console.warn(
      'ToolbarService.createButtonSection() is deprecated. Use ToolbarService.updateSection() instead.'
    );
    this.updateSection(key, buttons);
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

  getButtonPropsInButtonSection(sectionId: string) {
    const buttonSectionIds = this.state.buttonSections[sectionId];

    return buttonSectionIds?.map(btnId => this.getButtonProps(btnId)) || [];
  }

  /**
   * Retrieves the tool name for a given button.
   * @param button - The button object.
   * @returns The tool name associated with the button.
   */
  getToolNameForButton(button) {
    const { props } = button;

    const commands = props?.commands || button.commands;
    const commandsArray = Array.isArray(commands) ? commands : [commands];
    const firstCommand = commandsArray[0];

    if (firstCommand?.commandOptions) {
      return firstCommand.commandOptions.toolName ?? props?.id ?? button.id;
    }

    // use id as a fallback for toolName
    return props?.id ?? button.id;
  }

  /**
   *
   * @param {*} btn
   * @param {*} btnSection
   * @param {*} metadata
   * @param {*} props - Props set by the Viewer layer
   */
  _mapButtonToDisplay(btn: Button, props: Record<string, unknown>) {
    if (!btn) {
      return;
    }

    const { id, uiType } = btn;
    const { buttonSection } = btn.props;

    const buttonTypes = this._getButtonUITypes();

    const buttonType = buttonTypes[uiType];

    if (!btn.component) {
      btn.component = buttonType.defaultComponent;
    }

    if (!buttonType) {
      return;
    }

    !buttonSection ? this.handleEvaluate(btn.props) : this.handleEvaluateNested(btn.props);

    const { id: buttonId, props: componentProps } = btn;

    const createEnhancedOptions = (options, itemId) => {
      const optionsToUse = Array.isArray(options) ? options : [options];
      const toolProps = this.getButtonProps(itemId);

      return optionsToUse.map(option => {
        if (typeof option.optionComponent === 'function') {
          return option;
        }

        return {
          ...option,
          onChange: value => {
            // Update the option's value for UI
            option.value = value;

            const cmds = Array.isArray(option.commands) ? option.commands : [option.commands];

            // Find the parent button and update its options
            if (toolProps && toolProps.options) {
              // Find the option in the button's options array and update its value
              const optionIndex = toolProps.options.findIndex(opt => opt.id === option.id);
              if (optionIndex !== -1) {
                toolProps.options[optionIndex].value = value;
              }
            }

            cmds.forEach(command => {
              const commandOptions = {
                ...option,
                value,
                options: toolProps.options,
                servicesManager: this._servicesManager,
                commandsManager: this._commandsManager,
              };

              this._commandsManager.run(command, commandOptions);
            });

            // Notify that toolbar state has been modified
            this._broadcastEvent(EVENTS.TOOL_BAR_STATE_MODIFIED, {
              buttons: this.state.buttons,
              buttonSections: this.state.buttonSections,
            });
          },
        };
      });
    };

    if ((componentProps as NestedButtonProps)?.items?.length) {
      const { items = [] } = componentProps as NestedButtonProps;

      items.forEach(item => {
        if (!item.options) {
          return;
        }
        item.options = createEnhancedOptions(item.options, item.id);
      });
    } else if ((componentProps as ButtonProps).options?.length) {
      (componentProps as ButtonProps).options = createEnhancedOptions(
        (componentProps as ButtonProps).options,
        buttonId
      );
    } else if ((componentProps as ButtonProps).optionComponent) {
      (componentProps as ButtonProps).optionComponent = options.optionComponent;
    }

    return {
      id,
      Component: btn.component,
      componentProps: Object.assign({ id }, btn.props, props),
    };
  }

  handleEvaluateNested = props => {
    const { buttonSection } = props;

    if (!buttonSection) {
      return;
    }

    const toolbarButtons = this.getButtonSection(buttonSection);

    if (!toolbarButtons?.length) {
      return;
    }

    toolbarButtons.forEach(button => {
      this.handleEvaluate(button.componentProps);
    });
  };

  handleEvaluate = props => {
    const { evaluate, options } = props;

    if (typeof options === 'string') {
      // get the custom option component from the extension manager and set it as the optionComponent
      const buttonTypes = this._getButtonUITypes();
      const optionComponent = buttonTypes[options]?.defaultComponent;
      props.options = optionComponent;
    }

    if (typeof evaluate === 'function') {
      return;
    }

    if (Array.isArray(evaluate)) {
      const evaluators = evaluate.map(evaluator => {
        const isObject = typeof evaluator === 'object';

        const evaluatorName = isObject ? evaluator.name : evaluator;

        const evaluateFunction = this._evaluateFunction[evaluatorName];

        if (!evaluateFunction) {
          throw new Error(
            `Evaluate function not found for name: ${evaluatorName}, you can register an evaluate function with the getToolbarModule in your extensions`
          );
        }

        if (isObject) {
          return args => evaluateFunction({ ...args, ...evaluator });
        }

        return evaluateFunction;
      });

      const evaluateProps = props.evaluate;
      props.evaluate = args => {
        const results = evaluators.map(evaluator => evaluator(args)).filter(Boolean);

        // had at least one disabled button, so we need to disable the button
        const hasDisabledButton = results?.some(result => result.disabled);

        const mergedResult = results.reduce((acc, result) => {
          return {
            ...acc,
            ...result,
          };
        }, {});

        if (hasDisabledButton) {
          mergedResult.disabled = true;
        }

        return mergedResult;
      };

      props.evaluateProps = evaluateProps;

      return;
    }

    if (typeof evaluate === 'string') {
      const evaluateFunction = this._evaluateFunction[evaluate];

      if (evaluateFunction) {
        props.evaluate = evaluateFunction;
        return;
      }

      throw new Error(
        `Evaluate function not found for name: ${evaluate}, you can register an evaluate function with the getToolbarModule in your extensions`
      );
    }

    if (typeof evaluate === 'object') {
      const { name, ...options } = evaluate;
      const evaluateFunction = this._evaluateFunction[name];
      if (evaluateFunction) {
        const evaluateProps = props.evaluate;
        props.evaluate = args => evaluateFunction({ ...args, ...options });
        props.evaluateProps = evaluateProps;
        return;
      }

      throw new Error(
        `Evaluate function not found for name: ${name}, you can register an evaluate function with the getToolbarModule in your extensions`
      );
    }
  };

  getButtonComponentForUIType(uiType: string) {
    return uiType ? (this._getButtonUITypes()[uiType]?.defaultComponent ?? null) : null;
  }

  clearButtonSection(buttonSection: string) {
    this.state.buttonSections[buttonSection] = [];
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, { ...this.state });
  }

  /**
   * Checks if a button exists in any toolbar section.
   *
   * @param buttonId - The button ID to check for
   * @returns True if the button exists in any section, false otherwise
   */
  isInAnySection(buttonId: string): boolean {
    if (!buttonId) {
      return false;
    }

    // Check all sections to see if the button ID exists in any of them
    return Object.values(this.state.buttonSections).some(
      section => Array.isArray(section) && section.includes(buttonId)
    );
  }

  /**
   * Returns the alignment and side for a specific viewport corner location.
   * Used for menu positioning based on the corner location.
   *
   * @param location - The viewport corner location
   * @returns An object with align and side properties
   */
  public getAlignAndSide(location: ButtonLocation | string): {
    align: 'start' | 'end' | 'center';
    side: 'top' | 'bottom' | 'left' | 'right';
  } {
    const locationNumber = Number(location);
    switch (locationNumber) {
      case ButtonLocation.TopLeft: // Enum 0, Original 0 (topLeft)
        return { align: 'start', side: 'bottom' };
      case ButtonLocation.TopMiddle: // Enum 1, Original 4 (topMiddle)
        return { align: 'center', side: 'bottom' };
      case ButtonLocation.TopRight: // Enum 2, Original 1 (topRight)
        return { align: 'end', side: 'bottom' };
      case ButtonLocation.LeftMiddle: // Enum 3, Original 6 (leftMiddle)
        return { align: 'start', side: 'right' };
      case ButtonLocation.RightMiddle: // Enum 4, Original 7 (rightMiddle)
        return { align: 'end', side: 'left' };
      case ButtonLocation.BottomLeft: // Enum 5, Original 2 (bottomLeft)
        return { align: 'start', side: 'top' };
      case ButtonLocation.BottomMiddle: // Enum 6, Original 5 (bottomMiddle)
        return { align: 'center', side: 'top' };
      case ButtonLocation.BottomRight: // Enum 7, Original 3 (bottomRight)
        return { align: 'end', side: 'top' };
      default:
        // Default to TopLeft behavior if an unexpected value is passed.
        return { align: 'start', side: 'bottom' };
    }
  }
}
