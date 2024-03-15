import { Component } from 'react';
import React from 'react';

interface PropsType {
  value: string;
  label: string;
  itemData: { label: string; value: string };
  id: string;
  onSelected: Function;
}

export default class InputRadio extends Component<PropsType> {
  render() {
    return (
      <label
        className={
          'overflow-hidden border-b-gray-900 block h-10 w-full cursor-pointer border-b pl-3 leading-10 '
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
