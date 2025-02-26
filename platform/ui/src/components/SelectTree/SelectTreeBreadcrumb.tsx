import { Component } from 'react';
import React from 'react';
import Icon from '../Icon';

interface PropType {
  value: string;
  label: string;
  onSelected: (event: any) => void;
}

export default class SelectTreeBreadcrumb extends Component<PropType> {
  render() {
    return (
      <div>
        <label
          className="block h-10 w-full cursor-pointer pr-3 leading-10"
          htmlFor="selectTreeBreadcrumb"
        >
          <input
            type="radio"
            id="selectTreeBreadcrumb"
            className="bt block h-10 overflow-hidden p-3 leading-10 shadow-[0_0_0_200px_transparent]"
            value={this.props.value}
            onChange={this.props.onSelected}
          />
          <span className="cursor-pointer whitespace-nowrap	">
            <span className="pr-2.5">
              <Icon name="fast-backward" />
            </span>
            {this.props.label}
          </span>
        </label>
      </div>
    );
  }
}
