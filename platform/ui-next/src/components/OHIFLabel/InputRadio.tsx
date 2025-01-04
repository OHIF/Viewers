import React, { Component } from 'react';
import { LabelInfo } from './types';

interface InputRadioProps {
  value: string;
  label: string;
  itemData: LabelInfo;
  id: string;
  onSelected: Function;
  index: number;
  selectTree: any; // reference to parent SelectTree component
}

export default class InputRadio extends Component<InputRadioProps> {
  render() {
    const { focusedIndex } = this.props.selectTree.state;
    const isFocused = this.props.index === focusedIndex;

    return (
      <label
        className={`block h-10 w-full cursor-pointer overflow-hidden border-b border-b-gray-900 pl-3 leading-10 ${
          isFocused ? 'bg-black' : ''
        }`}
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

  onSelected = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onSelected(evt, this.props.itemData);
  };
}
