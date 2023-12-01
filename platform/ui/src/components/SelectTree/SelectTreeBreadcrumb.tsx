import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

export default class SelectTreeBreadcrumb extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onSelected: PropTypes.func.isRequired,
  };

  render() {
    return (
      <div className="selectTreeBreadcrumb">
        <label
          className="wrapperLabel radioLabel cursor-pointer	pr-3 h-10 w-full leading-10 block"
          htmlFor="selectTreeBreadcrumb"
        >
          <input
            type="radio"
            id="selectTreeBreadcrumb"
            className="block overflow-hidden shadow-[0_0_0_200px_transparent] p-3 h-10 bt leading-10"
            value={this.props.value}
            onChange={this.props.onSelected}
          />
          <span className="whitespace-nowrap cursor-pointer	">
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
