import './ToolbarRow.css';

import React, { Component } from 'react';
import {
  ExpandableToolMenu,
  RoundedButtonGroup,
  ToolbarButton,
} from '@ohif/ui';
import { commandsManager, extensionManager } from './../App.js';

import ConnectedCineDialog from './ConnectedCineDialog';
import ConnectedLayoutButton from './ConnectedLayoutButton';
import ConnectedPluginSwitch from './ConnectedPluginSwitch.js';
import { MODULE_TYPES } from '@ohif/core';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

class ToolbarRow extends Component {
  // TODO: Simplify these? isOpen can be computed if we say "any" value for selected,
  // closed if selected is null/undefined
  static propTypes = {
    isLeftSidePanelOpen: PropTypes.bool.isRequired,
    isRightSidePanelOpen: PropTypes.bool.isRequired,
    selectedLeftSidePanel: PropTypes.string.isRequired,
    selectedRightSidePanel: PropTypes.string.isRequired,
    handleSidePanelChange: PropTypes.func,
    activeContexts: PropTypes.arrayOf(PropTypes.string).isRequired,
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
      isCineDialogOpen: false,
    };

    this._handleBuiltIn = _handleBuiltIn.bind(this);

    const panelModules = extensionManager.modules[MODULE_TYPES.PANEL];
    this.buttonGroups = {
      left: [
        // TODO: This should come from extensions, instead of being baked in
        {
          value: 'studies',
          icon: 'th-large',
          bottomLabel: this.props.t('Series'),
        },
      ],
      right: [],
    };

    panelModules.forEach(panelExtension => {
      const panelModule = panelExtension.module;
      const defaultContexts = Array.from(panelModule.defaultContext);

      // MENU OPTIONS
      panelModule.menuOptions.forEach(menuOption => {
        const contexts = Array.from(menuOption.context || defaultContexts);

        const activeContextIncludesAnyPanelContexts = this.props.activeContexts.some(
          actx => contexts.includes(actx)
        );
        if (activeContextIncludesAnyPanelContexts) {
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
  }

  componentDidUpdate(prevProps) {
    const activeContextsChanged =
      prevProps.activeContexts !== this.props.activeContexts;

    if (activeContextsChanged) {
      this.setState({
        toolbarButtons: _getVisibleToolbarButtons.call(this),
      });
    }
  }

  render() {
    const buttonComponents = _getButtonComponents.call(
      this,
      this.state.toolbarButtons,
      this.state.activeButtons
    );

    const cineDialogContainerStyle = {
      display: this.state.isCineDialogOpen ? 'block' : 'none',
      position: 'absolute',
      top: '82px',
      zIndex: 999,
    };

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
          <ConnectedPluginSwitch />
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
        <div className="CineDialogContainer" style={cineDialogContainerStyle}>
          <ConnectedCineDialog />
        </div>
      </>
    );
  }
}

/**
 * Determine which extension buttons should be showing, if they're
 * active, and what their onClick behavior should be.
 */
function _getButtonComponents(toolbarButtons, activeButtons) {
  return toolbarButtons.map((button, index) => {
    let activeCommand = undefined;

    if (button.buttons && button.buttons.length) {
      // Iterate over button definitions and update `onClick` behavior
      const childButtons = button.buttons.map(childButton => {
        childButton.onClick = _handleToolbarButtonClick.bind(this, childButton);

        if (activeButtons.indexOf(childButton.id) > -1) {
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
    return (
      <ToolbarButton
        key={button.id}
        label={button.label}
        icon={button.icon}
        onClick={_handleToolbarButtonClick.bind(this, button)}
        isActive={activeButtons.includes(button.id)}
      />
    );
  });
}

/**
 * A handy way for us to handle different button types. IE. firing commands for
 * buttons, or initiation built in behavior.
 *
 * @param {*} button
 * @param {*} evt
 * @param {*} props
 */
function _handleToolbarButtonClick(button, evt, props) {
  if (button.commandName) {
    const options = Object.assign({ evt }, button.commandOptions);
    commandsManager.runCommand(button.commandName, options);
  }

  // TODO: Use Types ENUM
  // TODO: We can update this to be a `getter` on the extension to query
  //       For the active tools after we apply our updates?
  if (button.type === 'setToolActive') {
    this.setState({
      activeButtons: [button.id],
    });
  } else if (button.type === 'builtIn') {
    this._handleBuiltIn(button.options);
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

function _handleBuiltIn({ behavior } = {}) {
  if (behavior === 'CINE') {
    this.setState({
      isCineDialogOpen: !this.state.isCineDialogOpen,
    });
  }
}

export default withTranslation('Common')(ToolbarRow);
