import React, { Component } from 'react';
import cloneDeep from 'lodash.clonedeep';

import EditDescriptionDialog from './../EditDescriptionDialog/EditDescriptionDialog.js';
import LabellingFlow from './LabellingFlow.js';
import './LabellingManager.css';

export default class LabellingManager extends Component {
  constructor(props) {
    super(props);

    const newMeasurementData = cloneDeep(props.measurementData);
    this.treatMeasurementData(newMeasurementData);

    let newEditLocation = props.editLocation;
    if (!props.editDescription && !props.editLocation) {
      newEditLocation = true;
    }

    this.state = {
      editLocation: newEditLocation,
      measurementData: newMeasurementData,
    };
  }

  render() {
    const { editLocation, measurementData } = this.state;

    if (this.props.editDescriptionOnDialog) {
      return (
        <EditDescriptionDialog
          onCancel={this.props.labellingDoneCallback}
          onUpdate={this.descriptionDialogUpdate}
          measurementData={measurementData}
        />
      );
    }

    if (editLocation || this.props.editDescription) {
      return <LabellingFlow {...this.props} />;
    }
  }

  treatMeasurementData = measurementData => {
    const { editDescription, editLocation } = this.props;

    if (editDescription) {
      measurementData.description = undefined;
    }

    if (editLocation) {
      measurementData.location = undefined;
    }
  };

  descriptionDialogUpdate = description => {
    this.props.updateLabelling({ description });
    this.props.labellingDoneCallback();
  };
}
