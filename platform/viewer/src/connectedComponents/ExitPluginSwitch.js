import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import './PluginSwitch.css';

class ExitPluginSwitch extends Component {
  static propTypes = {
    exitMpr: PropTypes.func,
  };

  static defaultProps = {};

  render() {
    return (
      <div className="PluginSwitch">
        <ToolbarButton       label = "Exit 2D MPR"
                             icon = "times"
                             onClick = {this.props.exitMpr} />
      </div>
    );
  }
}

export default ExitPluginSwitch;
