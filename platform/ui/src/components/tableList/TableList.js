import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './TableList.styl';

export class TableList extends Component {
  static propTypes = {
    customHeader: PropTypes.node,
    defaultItems: PropTypes.object,
    children: PropTypes.node.isRequired,
    headerTitle: PropTypes.string,
    headless: PropTypes.bool,
  };

  static defaultProps = {
    headless: false,
  };

  render() {
    return (
      <div className="tableList">
        {!this.props.headless && (
          <div className="tableListHeader" onClick={this.onHeaderClick}>
            {this.getHeader()}
          </div>
        )}
        <div className="tableListContent">{this.props.children}</div>
      </div>
    );
  }

  getHeader = () => {
    if (this.props.customHeader) {
      return this.props.customHeader;
    } else {
      return (
        <React.Fragment>
          <div className="tableListHeaderTitle">{this.props.headerTitle}</div>
          <div className="numberOfItems">{this.props.children.length}</div>
        </React.Fragment>
      );
    }
  };
}
