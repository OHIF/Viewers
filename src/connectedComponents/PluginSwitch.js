import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {ExpandableToolMenu, ToolbarButton} from 'react-viewerbase';
import './PluginSwitch.css';
import {commandsManager} from "../App";

class PluginSwitch extends Component {
  static propTypes = {
    buttons: PropTypes.array,
  };

  static defaultProps = {};

  render() {
    return (

        <ToolbarButton
            key= "2dmpr"
            label= '2D MPR'
            icon= 'cube'
            onClick= {() => { commandsManager.runCommand('mpr2d'); }}
        />
    );
  }
}

export default PluginSwitch;
