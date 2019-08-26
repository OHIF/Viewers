import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ExpandableToolMenu } from '@ohif/ui';
import './PluginSwitch.css';

class PluginSwitch extends Component {
  static propTypes = {
    buttons: PropTypes.array,
  };

  static defaultProps = {};

  render() {
    return (
      <div className="PluginSwitch">
        <ExpandableToolMenu buttons={this.props.buttons} label={'View'} />
      </div>
    );
  }
}

export default PluginSwitch;
