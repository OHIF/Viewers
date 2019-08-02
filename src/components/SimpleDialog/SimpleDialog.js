import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';

import './SimpleDialog.css';

class SimpleDialog extends Component {
  static defaultProps = {
    componentStyle: {},
    rootClass: '',
  };

  render() {
    return (
      <div
        className={`simpleDialog ${this.props.rootClass}`}
        ref={this.props.componentRef}
        style={this.props.componentStyle}
      >
        <form onSubmit={this.props.onConfirm}>
          <div className="header">
            <span className="closeBtn" onClick={this.props.onClose}>
              <span className="closeIcon">x</span>
            </span>
            <h4 className="title">{this.props.headerTitle}</h4>
          </div>
          <div className="content">{this.props.children}</div>
          <div className="footer">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={this.props.onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-confirm"
              onClick={this.props.onConfirm}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    );
  }
}

SimpleDialog.propTypes = {
  headerTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default SimpleDialog;
