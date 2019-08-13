import { Component } from 'react';
import PropTypes from 'prop-types';
import React from 'react';
import ToolbarButton from './ToolbarButton.js';

const wLPresetIDs = [
  'setWLPresetSoftTissue',
  'setWLPresetLung',
  'setWLPresetLiver',
  'setWLPresetBrain',
];

export default class PresetToggle extends Component {
  static propTypes = {
    buttons: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        icon: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          }),
        ]),
      })
    ).isRequired,
    setToolActive: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      presetSelected: null,
    };
  }
  render() {
    /*const items = this.props.buttons.map((item, index) => {
      return <ToolbarButton key={index} {...item} click={this.onClick} />;
    });*/

    const wlPresetItems = this.props.buttons.map((button, index) => {
      if (wLPresetIDs.includes(button.command)) {
        return <ToolbarButton key={index} {...button} click={this.onClick} />;
      }
      return '';
    });

    const toolItems = this.props.buttons.map((button, index) => {
      if (!wLPresetIDs.includes(button.command)) {
        return <ToolbarButton key={index} {...button} click={this.onClick} />;
      }
      return '';
    });

    const selectedButton = this.props.buttons.find(button => {
      return button.id === this.state.selected;
    });

    return (
      <div className="PresetToggle">
        <div className="wlPresets">{wlPresetItems}</div>
        <div className="tools">{toolItems}</div>
        <span className="presetSelected">
          LEVELS:
          {selectedButton ? selectedButton.label : 'Manual'}
        </span>
      </div>
    );
  }

  onClick = id => {
    const buttonItem = this.props.buttons.find(button => button.command === id);

    this.setState({
      selected: buttonItem.id,
    });
  };
}
