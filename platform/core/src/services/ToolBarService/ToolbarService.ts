import { CommandsManager } from '../../classes';
import { ExtensionManager } from '../../extensions';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { RunCommand } from '../../types/Command';
import { Button, ButtonProps, EvaluateFunction, EvaluatePublic, NestedButtonProps } from './types';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
  TOOL_BAR_STATE_MODIFIED: 'event::toolBarService:toolBarStateModified',
};

export default class ToolbarService extends PubSubService {
  public static REGISTRATION = {
    name: 'toolbarService',
    altName: 'ToolBarService',
    create: ({ commandsManager, extensionManager, servicesManager }) => {
      return new ToolbarService(commandsManager, extensionManager, servicesManager);
    },
  };

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
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      ...this.state,
    });
  }

  /**
   * Adds buttons to the toolbar.
   * @param buttons - The buttons to be added.
   * @param replace - Flag indicating if any existing button with the same id as one being added should be replaced
   */
  public addButtons(buttons: Button[], replace: boolean = false): void {
    buttons.forEach(button => {
      if (replace || !this.state.buttons[button.id]) {
        if (!button.props) {
          button.props = {} as ButtonProps;
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
    const buttons = this.state.buttons;
    const evaluationResults = new Map();

    const evaluateButtonProps = (button, props, refreshProps) => {
      if (evaluationResults.has(button.id)) {
        const { disabled, disabledText, className, isActive } = evaluationResults.get(button.id);
        return { ...props, disabled, disabledText, className, isActive };
      } else {
        const evaluated = props.evaluate?.({ ...refreshProps, button });
        const updatedProps = {
          ...props,
          ...evaluated,
          disabled: evaluated?.disabled || false,
          className: evaluated?.className || '',
          isActive: evaluated?.isActive, // isActive will be undefined for buttons without this prop
        };
        evaluationResults.set(button.id, updatedProps);
        return updatedProps;
      }
    };

    Object.values(buttons).forEach(button => {
      const hasSection = (button.props as NestedButtonProps)?.buttonSection;

      if (!hasSection) {
        this.handleEvaluate(button.props);
        const buttonProps = button.props as ButtonProps;

        const updatedProps = evaluateButtonProps(button, buttonProps, refreshProps);
        buttons[button.id] = {
          ...button,
          props: updatedProps,
        };
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
          const button = buttons[buttonId];
          if (button?.props) {
            const updatedProps = evaluateButtonProps(button, button?.props, refreshProps);
            buttons[buttonId] = {
              ...button,
              props: updatedProps,
            };
          }
        });
      }
    });

    this.setButtons(buttons);
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
  createButtonSection(key, buttons) {
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
    const { groupId } = btn.props as NestedButtonProps;

    const buttonTypes = this._getButtonUITypes();

    const buttonType = buttonTypes[uiType];

    if (!btn.component) {
      btn.component = buttonType.defaultComponent;
    }

    if (!buttonType) {
      return;
    }

    !groupId ? this.handleEvaluate(btn.props) : this.handleEvaluateNested(btn.props);

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
        props.evaluate = args => evaluateFunction({ ...args, ...options });
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
}
