import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-viewerbase';

class PluginSwitch extends Component {
  static propTypes = {
    options: PropTypes.array,
  };

  static defaultProps = {
  };

  render() {
    return (
      <div className="PluginSwitch">
        {this.props.options && <Dropdown title={"View"} list={this.props.options}/>}
      </div>
    );
  }
}

export default PluginSwitch;
