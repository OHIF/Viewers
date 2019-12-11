import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';

import SimpleDialog from '../SimpleDialog/SimpleDialog.js';
import './EditDescriptionDialog.css';

export default class EditDescriptionDialog extends Component {
  static propTypes = {
    description: PropTypes.string,
    measurementData: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      description: props.measurementData.description || '',
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.description !== prevProps.description) {
      this.setState({
        description: this.props.description,
      });
    }
  }

  render() {
    return (
      <SimpleDialog
        headerTitle="Edit Description"
        onClose={this.onClose}
        onConfirm={this.onConfirm}
        rootClass="editDescriptionDialog"
      >
        <input
          value={this.state.description}
          className="simpleDialogInput"
          id="description"
          autoComplete="off"
          autoFocus
          onChange={this.handleChange}
        />
      </SimpleDialog>
    );
  }

  onClose = () => {
    this.props.onCancel();
  };

  onConfirm = e => {
    e.preventDefault();
    this.props.onUpdate(this.state.description);
  };

  handleChange = event => {
    this.setState({ description: event.target.value });
  };
}
