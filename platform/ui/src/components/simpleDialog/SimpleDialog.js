import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@ohif/ui';

import './SimpleDialog.styl';

class SimpleDialog extends Component {
  static propTypes = {
    children: PropTypes.node,
    componentRef: PropTypes.any,
    componentStyle: PropTypes.object,
    rootClass: PropTypes.string,
    isOpen: PropTypes.bool,
    headerTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isOpen: true,
    componentStyle: {},
    rootClass: '',
  };

  static InputDialog = ({ onSubmit, defaultValue, title, label, onClose }) => {
    const [value, setValue] = useState(defaultValue);

    const onSubmitHandler = () => {
      onSubmit(value);
    };

    return (
      <div className="InputDialog">
        <SimpleDialog
          headerTitle={title}
          onClose={onClose}
          onConfirm={onSubmitHandler}
        >
          <TextInput
            type="text"
            value={value}
            onChange={event => setValue(event.target.value)}
            label={label}
          />
        </SimpleDialog>
      </div>
    );
  };

  render() {
    return (
      <React.Fragment>
        {this.props.isOpen && (
          <div
            className={`simpleDialog ${this.props.rootClass} `}
            ref={this.props.componentRef}
            style={this.props.componentStyle}
          >
            <form>
              <div className="header">
                <span className="closeBtn" onClick={this.onClose}>
                  <span className="closeIcon">x</span>
                </span>
                <h4 className="title">{this.props.headerTitle}</h4>
              </div>
              <div className="content">{this.props.children}</div>
              <div className="footer">
                <button className="btn btn-default" onClick={this.onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={this.onConfirm}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        )}
      </React.Fragment>
    );
  }

  onClose = event => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onClose();
  };

  onConfirm = event => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onConfirm();
  };
}

export { SimpleDialog };
