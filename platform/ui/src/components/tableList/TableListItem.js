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
    itemMeta: PropTypes.node,
    itemMetaClass: PropTypes.string,
    itemKey: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    onItemClick: PropTypes.func.isRequired,
  };

  static defaultProps = {
    itemMeta: null,
    itemMetaClass: ''
  };

  render() {
    return (
      <div
        className={`tableListItem ${this.props.itemClass}`}
        onClick={this.onItemClick}
      >
        <div className={`itemIndex ${this.props.itemMetaClass}`}>
          {this.props.itemIndex}
          {this.props.itemMeta}
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
