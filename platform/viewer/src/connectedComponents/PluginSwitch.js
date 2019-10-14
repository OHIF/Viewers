import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import './PluginSwitch.css';

class PluginSwitch extends Component {
  static propTypes = {
    mpr: PropTypes.func,
    exitMpr: PropTypes.func
  };

  static defaultProps = {};
  constructor(props) {
    super(props);
    this.state = {
      isPlugSwitchOn: false,
      label: "2D MPR",
      icon: "cube"
    };
  }

  handleClick = () => {
    if (this.state.isPlugSwitchOn) {
      this.setState({
        isPlugSwitchOn: false,
        label: "2D MPR",
        icon: "cube"
      });
      this.props.exitMpr();
    } else {
      this.setState({
        isPlugSwitchOn: true,
        label: "Exit 2D MPR",
        icon: "times"
      });
      this.props.mpr();
    }
  };

  render() {
    const { label, icon } = this.state;

    return (
      <div className="PluginSwitch">
        <ToolbarButton label={label} icon={icon} onClick={this.handleClick} />
      </div>
    );
  }
}

export default PluginSwitch;
