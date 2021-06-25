import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { MODULE_TYPES } from '@ohif/core';
import {
  ExpandableToolMenu,
  RoundedButtonGroup,
  ToolbarButton,
  withModal,
  withDialog,
} from '@ohif/ui';

import './ToolbarRow.css';
import { commandsManager, extensionManager } from './../App.js';

import ConnectedCineDialog from './ConnectedCineDialog';
import ConnectedLayoutButton from './ConnectedLayoutButton';
import { withAppContext } from '../context/AppContext';

class ToolbarRow extends Component {
  // TODO: Simplify these? isOpen can be computed if we say "any" value for selected,
  // closed if selected is null/undefined
  static propTypes = {
    isLeftSidePanelOpen: PropTypes.bool.isRequired,
    isRightSidePanelOpen: PropTypes.bool.isRequired,
    selectedLeftSidePanel: PropTypes.string.isRequired,
    selectedRightSidePanel: PropTypes.string.isRequired,
    handleSidePanelChange: PropTypes.func.isRequired,
    activeContexts: PropTypes.arrayOf(PropTypes.string).isRequired,
    studies: PropTypes.array,
    t: PropTypes.func.isRequired,
    // NOTE: withDialog, withModal HOCs
    dialog: PropTypes.any,
    modal: PropTypes.any,
  };

  static defaultProps = {
    studies: [],
  };

  constructor(props) {
    super(props);

    const toolbarButtonDefinitions = _getVisibleToolbarButtons.call(this);
    // TODO:
    // If it's a tool that can be active... Mark it as active?
    // - Tools that are on/off?
    // - Tools that can be bound to multiple buttons?

    // Normal ToolbarButtons...
    // Just how high do we need to hoist this state?
    // Why ToolbarRow instead of just Toolbar? Do we have any others?
    this.state = {
      toolbarButtons: toolbarButtonDefinitions,
      activeButtons: [],
    };

    this.seriesPerStudyCount = [];

    this._handleBuiltIn = _handleBuiltIn.bind(this);
    this._onDerivedDisplaySetsLoadedAndCached = this._onDerivedDisplaySetsLoadedAndCached.bind(
      this
    );

    this.updateButtonGroups();
  }

  updateButtonGroups() {
    const panelModules = extensionManager.modules[MODULE_TYPES.PANEL];

    this.buttonGroups = {
      left: [],
      right: [],
    };

    // ~ FIND MENU OPTIONS
    panelModules.forEach(panelExtension => {
      const panelModule = panelExtension.module;
      const defaultContexts = Array.from(panelModule.defaultContext);

      panelModule.menuOptions.forEach(menuOption => {
        const contexts = Array.from(menuOption.context || defaultContexts);
        const hasActiveContext = this.props.activeContexts.some(actx =>
          contexts.includes(actx)
        );

        // It's a bit beefy to pass studies; probably only need to be reactive on `studyInstanceUIDs` and activeViewport?
        // Note: This does not cleanly handle `studies` prop updating with panel open
        const isDisabled =
          typeof menuOption.isDisabled === 'function' &&
          menuOption.isDisabled(this.props.studies, this.props.activeViewport);

        if (hasActiveContext && !isDisabled) {
          const menuOptionEntry = {
            value: menuOption.target,
            icon: menuOption.icon,
            bottomLabel: menuOption.label,
          };
          const from = menuOption.from || 'right';

          this.buttonGroups[from].push(menuOptionEntry);
        }
      });
    });

    // TODO: This should come from extensions, instead of being baked in
    this.buttonGroups.left.unshift({
      value: 'studies',
      icon: 'th-large',
      bottomLabel: this.props.t('Series'),
    });
  }

  componentDidMount() {
    /*
     * TODO: Improve the way we notify parts of the app
     * that depends on derived display sets to be loaded.
     * (Implement pubsub for better tracking of derived display sets)
     */
    document.addEventListener(
      'deriveddisplaysetsloadedandcached',
      this._onDerivedDisplaySetsLoadedAndCached
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'deriveddisplaysetsloadedandcached',
      this._onDerivedDisplaySetsLoadedAndCached
    );
  }

  _onDerivedDisplaySetsLoadedAndCached() {
    this.updateButtonGroups();
    this.setState({
      toolbarButtons: _getVisibleToolbarButtons.call(this),
    });
  }

  componentDidUpdate(prevProps) {
    const activeContextsChanged =
      prevProps.activeContexts !== this.props.activeContexts;

    const prevStudies = prevProps.studies;
    const prevActiveViewport = prevProps.activeViewport;
    const activeViewport = this.props.activeViewport;
    const studies = this.props.studies;
    const seriesPerStudyCount = this.seriesPerStudyCount;

    let shouldUpdate = false;

    if (
      prevStudies.length !== studies.length ||
      prevActiveViewport !== activeViewport
    ) {
      shouldUpdate = true;
    } else {
      for (let i = 0; i < studies.length; i++) {
        if (studies[i].series.length !== seriesPerStudyCount[i]) {
          seriesPerStudyCount[i] = studies[i].series.length;

          shouldUpdate = true;
          break;
        }
      }
    }

    if (shouldUpdate) {
      this.updateButtonGroups();
    }

    if (activeContextsChanged) {
      this.setState(
        {
          toolbarButtons: _getVisibleToolbarButtons.call(this),
        },
        this.closeCineDialogIfNotApplicable
      );
    }
  }

  closeCineDialogIfNotApplicable = () => {
    const { dialog } = this.props;
    let { dialogId, activeButtons, toolbarButtons } = this.state;
    if (dialogId) {
      const cineButtonPresent = toolbarButtons.find(
        button => button.options && button.options.behavior === 'CINE'
      );
      if (!cineButtonPresent) {
        dialog.dismiss({ id: dialogId });
        activeButtons = activeButtons.filter(
          button => button.options && button.options.behavior !== 'CINE'
        );
        this.setState({ dialogId: null, activeButtons });
      }
    }
  };

  render() {
    const buttonComponents = _getButtonComponents.call(
      this,
      this.state.toolbarButtons,
      this.state.activeButtons
    );

    const onPress = (side, value) => {
      this.props.handleSidePanelChange(side, value);
    };
    const onPressLeft = onPress.bind(this, 'left');
    const onPressRight = onPress.bind(this, 'right');

    return (
      <>
        <div className="ToolbarRow">
          <div className="pull-left m-t-1 p-y-1" style={{ padding: '10px' }}>
            <RoundedButtonGroup
              options={this.buttonGroups.left}
              value={this.props.selectedLeftSidePanel || ''}
              onValueChanged={onPressLeft}
            />
          </div>
          {buttonComponents}
          <ConnectedLayoutButton />
          <div
            className="pull-right m-t-1 rm-x-1"
            style={{ marginLeft: 'auto' }}
          >
            {this.buttonGroups.right.length && (
              <RoundedButtonGroup
                options={this.buttonGroups.right}
                value={this.props.selectedRightSidePanel || ''}
                onValueChanged={onPressRight}
              />
            )}
          </div>
        </div>
      </>
    );
  }
}

function _getCustomButtonComponent(button, activeButtons) {
  const CustomComponent = button.CustomComponent;
  const isValidComponent = typeof CustomComponent === 'function';

  // Check if its a valid customComponent. Later on an CustomToolbarComponent interface could be implemented.
  if (isValidComponent) {
    const parentContext = this;
    const activeButtonsIds = activeButtons.map(button => button.id);
    const isActive = activeButtonsIds.includes(button.id);

    return (
      <CustomComponent
        parentContext={parentContext}
        toolbarClickCallback={_handleToolbarButtonClick.bind(this)}
        button={button}
        key={button.id}
        activeButtons={activeButtonsIds}
        isActive={isActive}
      />
    );
  }
}

function _getExpandableButtonComponent(button, activeButtons) {
  // Iterate over button definitions and update `onClick` behavior
  let activeCommand;
  const childButtons = button.buttons.map(childButton => {
    childButton.onClick = _handleToolbarButtonClick.bind(this, childButton);

    if (activeButtons.map(button => button.id).indexOf(childButton.id) > -1) {
      activeCommand = childButton.id;
    }

    return childButton;
  });

  return (
    <ExpandableToolMenu
      key={button.id}
      label={button.label}
      icon={button.icon}
      buttons={childButtons}
      activeCommand={activeCommand}
    />
  );
}

function _getDefaultButtonComponent(button, activeButtons) {
  return (
    <ToolbarButton
      key={button.id}
      label={button.label}
      icon={button.icon}
      onClick={_handleToolbarButtonClick.bind(this, button)}
      isActive={activeButtons.map(button => button.id).includes(button.id)}
    />
  );
}
/**
 * Determine which extension buttons should be showing, if they're
 * active, and what their onClick behavior should be.
 */
function _getButtonComponents(toolbarButtons, activeButtons) {
  const _this = this;
  return toolbarButtons.map(button => {
    const hasCustomComponent = button.CustomComponent;
    const hasNestedButtonDefinitions = button.buttons && button.buttons.length;

    if (hasCustomComponent) {
      return _getCustomButtonComponent.call(_this, button, activeButtons);
    }

    if (hasNestedButtonDefinitions) {
      return _getExpandableButtonComponent.call(_this, button, activeButtons);
    }

    return _getDefaultButtonComponent.call(_this, button, activeButtons);
  });
}

/**
 * TODO: DEPRECATE
 * This is used exclusively in `extensions/cornerstone/src`
 * We have better ways with new UI Services to trigger "builtin" behaviors
 *
 * A handy way for us to handle different button types. IE. firing commands for
 * buttons, or initiation built in behavior.
 *
 * @param {*} button
 * @param {*} evt
 * @param {*} props
 */
function _handleToolbarButtonClick(button, evt, props) {
  const { activeButtons } = this.state;

  if (button.commandName) {
    const options = Object.assign({ evt }, button.commandOptions);
    commandsManager.runCommand(button.commandName, options);
  }

  // TODO: Use Types ENUM
  // TODO: We can update this to be a `getter` on the extension to query
  //       For the active tools after we apply our updates?
  if (button.type === 'setToolActive') {
    const toggables = activeButtons.filter(
      ({ options }) => options && !options.togglable
    );
    this.setState({ activeButtons: [...toggables, button] });
  } else if (button.type === 'builtIn') {
    this._handleBuiltIn(button);
  }
}

/**
 *
 */
function _getVisibleToolbarButtons() {
  const toolbarModules = extensionManager.modules[MODULE_TYPES.TOOLBAR];
  const toolbarButtonDefinitions = [];

  toolbarModules.forEach(extension => {
    const { definitions, defaultContext } = extension.module;
    definitions.forEach(definition => {
      const context = definition.context || defaultContext;

      if (this.props.activeContexts.includes(context)) {
        toolbarButtonDefinitions.push(definition);
      }
    });
  });

  return toolbarButtonDefinitions;
}

function _handleBuiltIn(button) {
  /* TODO: Keep cine button active until its unselected. */
  const { dialog, t } = this.props;
  const { dialogId } = this.state;
  const { id, options } = button;

  if (options.behavior === 'CINE') {
    if (dialogId) {
      dialog.dismiss({ id: dialogId });
      this.setState(state => ({
        dialogId: null,
        activeButtons: [
          ...state.activeButtons.filter(button => button.id !== id),
        ],
      }));
    } else {
      const spacing = 20;
      const { x, y } = document
        .querySelector(`.ViewerMain`)
        .getBoundingClientRect();
      const newDialogId = dialog.create({
        content: ConnectedCineDialog,
        defaultPosition: {
          x: x + spacing || 0,
          y: y + spacing || 0,
        },
      });
      this.setState(state => ({
        dialogId: newDialogId,
        activeButtons: [...state.activeButtons, button],
      }));
    }
  }

  if (options.behavior === 'DOWNLOAD_SCREEN_SHOT') {
    commandsManager.runCommand('showDownloadViewportModal', {
      title: t('Download High Quality Image'),
    });
  }
}

export default withTranslation(['Common', 'ViewportDownloadForm'])(
  withModal(withDialog(withAppContext(ToolbarRow)))
);
