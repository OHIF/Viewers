import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import SimpleDialog from '../SimpleDialog/SimpleDialog.js';

import bounding from '../../lib/utils/bounding.js';
import { getDialogStyle } from './../Labelling/labellingPositionUtils.js';

import './EditDescriptionDialog.css';

export default class EditDescriptionDialog extends Component {
  static defaultProps = {
    componentRef: React.createRef(),
    componentStyle: {},
  };

  static propTypes = {
    measurementData: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    componentRef: PropTypes.object,
    componentStyle: PropTypes.object,
    onUpdate: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      description: props.measurementData.description || '',
    };

    this.mainElement = React.createRef();
  }

  componentDidMount = () => {
    bounding(this.mainElement);
  };

  componentDidUpdate(prevProps) {
    if (this.props.description !== prevProps.description) {
      this.setState({
        description: this.props.description,
      });
    }
  }

  render() {
    const style = getDialogStyle(this.props.componentStyle);

    return (
      <SimpleDialog
        headerTitle="Edit Description"
        onClose={this.onClose}
        onConfirm={this.onConfirm}
        rootClass="editDescriptionDialog"
        componentRef={this.mainElement}
        componentStyle={style}
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
