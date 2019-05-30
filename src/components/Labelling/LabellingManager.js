import React, { Component } from 'react';
import PropTypes from 'prop-types';

import cloneDeep from 'lodash.clonedeep';

import EditDescriptionDialog from './../EditDescriptionDialog/EditDescriptionDialog.js';
import LabellingFlow from './LabellingFlow.js';

import './LabellingManager.css';

export default class LabellingManager extends Component {
  static propTypes = {
    eventData: PropTypes.object.isRequired,
    measurementData: PropTypes.object.isRequired,

    labellingDoneCallback: PropTypes.func.isRequired,
    updateLabelling: PropTypes.func.isRequired,

    skipAddLabelButton: PropTypes.bool,
    editLocation: PropTypes.bool,
    editDescription: PropTypes.bool,
    editDescriptionOnDialog: PropTypes.bool,
  };

  static defaultProps = {
    skipAddLabelButton: false,
    editLocation: false,
    editDescription: false,
    editDescriptionOnDialog: false,
  };

  constructor(props) {
    super(props);

    const measurementData = cloneDeep(props.measurementData);
    this.treatMeasurementData(measurementData);

    let editLocation = props.editLocation;
    if (!props.editDescription && !props.editLocation) {
      editLocation = true;
    }

    this.state = {
      componentStyle: getComponentPosition(props.eventData),
      skipAddLabelButton: props.skipAddLabelButton,
      editLocation: editLocation,
      editDescription: props.editDescription,
      editDescriptionOnDialog: props.editDescriptionOnDialog,
      measurementData: measurementData,
    };
  }

  componentDidMount = () => {
    document.addEventListener('touchstart', this.onTouchStart);
  };

  componentWillUnmount = () => {
    document.removeEventListener('touchstart', this.onTouchStart);
  };

  render() {
    return this.getRenderComponent();
  }

  getRenderComponent = () => {
    const {
      editLocation,
      editDescription,
      editDescriptionOnDialog,
      measurementData,
    } = this.state;

    if (editDescriptionOnDialog) {
      return (
        <EditDescriptionDialog
          onCancel={this.props.labellingDoneCallback}
          onUpdate={this.descriptionDialogUpdate}
          componentRef={this.editDescriptionDialog}
          componentStyle={this.state.componentStyle}
          measurementData={measurementData}
        />
      );
    }

    if (editLocation || editDescription) {
      return (
        <LabellingFlow
          {...this.props}
          componentStyle={this.state.componentStyle}
        />
      );
    }
  };

  treatMeasurementData = measurementData => {
    const { editDescription, editLocation } = this.props;

    if (editDescription) {
      measurementData.description = undefined;
    }
    if (editLocation) {
      measurementData.location = undefined;
    }
  };

  responseDialogUpdate = response => {
    this.props.updateLabelling({
      response,
    });
    this.props.labellingDoneCallback();
  };

  descriptionDialogUpdate = description => {
    this.props.updateLabelling({
      description,
    });
    this.props.labellingDoneCallback();
  };
}

function getComponentPosition(eventData) {
  const {
    event: { clientX: left, clientY: top },
  } = eventData;

  return {
    left,
    top,
  };
}
