import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import { RoundedButtonGroup } from 'react-viewerbase';
import ConnectedLayoutButton from './ConnectedLayoutButton';
import ConnectedPluginSwitch from './ConnectedPluginSwitch.js';
import './ToolbarRow.css';

const Icons = 'icons.svg';

class ToolbarRow extends Component {
  static propTypes = {
    leftSidebarOpen: PropTypes.bool.isRequired,
    rightSidebarOpen: PropTypes.bool.isRequired,
    setLeftSidebarOpen: PropTypes.func,
    setRightSidebarOpen: PropTypes.func,
    pluginId: PropTypes.string
  };

  static defaultProps = {
    leftSidebarOpen: false,
    rightSidebarOpen: false
  };

  onLeftSidebarValueChanged = value => {
    this.props.setLeftSidebarOpen(!!value);
  };

  onRightSidebarValueChanged = value => {
    this.props.setRightSidebarOpen(!!value);
  };

  render() {
    const leftSidebarToggle = [
      {
        value: 'studies',
        svgLink: `${Icons}#icon-studies`,
        svgWidth: 15,
        svgHeight: 13,
        bottomLabel: 'Series'
      }
    ];

    const rightSidebarToggle = [
      {
        value: 'measurements',
        svgLink: `${Icons}#icon-measurements-lesions`,
        svgWidth: 15,
        svgHeight: 13,
        bottomLabel: 'Measurements'
      }
    ];

    const leftSidebarValue = this.props.leftSidebarOpen
      ? leftSidebarToggle[0].value
      : null;

    const rightSidebarValue = this.props.rightSidebarOpen
      ? rightSidebarToggle[0].value
      : null;

    const currentPluginId = this.props.pluginId;

    const { PLUGIN_TYPES, availablePlugins } = OHIF.plugins;
    const plugin = availablePlugins.find(entry => {
      return (
        entry.type === PLUGIN_TYPES.TOOLBAR && entry.id === currentPluginId
      );
    });

    let pluginComp;
    if (plugin) {
      const PluginComponent = plugin.component;

      pluginComp = <PluginComponent />;
    }

    return (
      <div className="ToolbarRow">
        <div className="pull-left m-t-1 p-y-1" style={{ padding: '10px' }}>
          <RoundedButtonGroup
            options={leftSidebarToggle}
            value={leftSidebarValue}
            onValueChanged={this.onLeftSidebarValueChanged}
          />
        </div>
        {pluginComp}
        <ConnectedLayoutButton />
        <ConnectedPluginSwitch />
        <div className="pull-right m-t-1 rm-x-1" style={{ marginLeft: 'auto' }}>
          <RoundedButtonGroup
            options={rightSidebarToggle}
            value={rightSidebarValue}
            onValueChanged={this.onRightSidebarValueChanged}
          />
        </div>
      </div>
    );
  }
}

export default ToolbarRow;
