import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';

export default class InputRadio extends Component {
  static propTypes = {
    value: PropTypes.string,
    label: PropTypes.string.isRequired,
    itemData: PropTypes.object.isRequired,
    labelClass: PropTypes.string,
    id: PropTypes.string.isRequired,
    onSelected: PropTypes.func.isRequired,
  };

  render() {
    const labelClass = this.props.labelClass ? this.props.labelClass : '';
    return (
      <label
        className={
          'wrapperLabel radioLabel overflow-hidden ' +
          labelClass +
          ' block cursor-pointer	pl-3 w-full h-10 border-b border-b-gray-450 h-10 leading-10 '
        }
        htmlFor={this.props.id}
      >
        <input
          type="radio"
          id={this.props.id}
          className="hidden"
          value={this.props.value}
          onChange={this.onSelected}
        />
        <span className="font-labels">{this.props.label}</span>
      </label>
    );
  }

  onSelected = evt => {
    this.props.onSelected(evt, this.props.itemData);
  };
}
