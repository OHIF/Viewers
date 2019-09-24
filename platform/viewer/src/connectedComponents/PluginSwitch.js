import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import './PluginSwitch.css';

class PluginSwitch extends Component {
  static propTypes = {
    button: PropTypes.any,
  };

  static defaultProps = {};

  render() {
    return (
      <div className="PluginSwitch">
        <ToolbarButton       label = "2D MPR"
                             icon = "cube"
                             onClick = {this.props.button.onClick} />
      </div>
    );
  }
}

export default PluginSwitch;
