import './TableListItem.styl';

import { Component } from 'react';
import { Icon } from './../../elements/Icon';
import PropTypes from 'prop-types';
import React from 'react';

export class TableListItem extends Component {
  static propTypes = {
    children: PropTypes.node,
    itemClass: PropTypes.string,
    itemIndex: PropTypes.number,
    itemKey: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    onItemClick: PropTypes.func.isRequired,
  };

  render() {
    return (
      <div
        className={`tableListItem ${this.props.itemClass}`}
        onClick={this.onItemClick}
      >
        <div className="itemIndex">
          {this.props.itemIndex}
          <span className="warning-icon">
            <Icon name="exclamation-triangle" />
          </span>
        </div>
        <div className="itemContent">{this.props.children}</div>
      </div>
    );
  }

  onItemClick = event => {
    if (this.props.onItemClick) {
      event.preventDefault();
      event.stopPropagation();

      this.props.onItemClick(event, this.props.itemKey);
    }
  };
}
