import { Icon, SelectTree } from '@ohif/ui';
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';

import LabellingTransition from './LabellingTransition.js';
import OHIFLabellingData from './OHIFLabellingData.js';
import EditDescriptionDialog from './../EditDescriptionDialog/EditDescriptionDialog.js';
import './LabellingFlow.css';

const LabellingFlow = ({
  measurementData,
  editLocation,
  editDescription,
  skipAddLabelButton,
  updateLabelling,
  labellingDoneCallback,
  editDescriptionOnDialog,
}) => {
  const [fadeOutTimer, setFadeOutTimer] = useState();
  const [showComponent, setShowComponent] = useState(true);
  const descriptionInput = useRef();
  const [state, setState] = useState({
    measurementData,
    editLocation,
    editDescription,
    skipAddLabelButton,
  });

  useEffect(() => {
    const newMeasurementData = cloneDeep(measurementData);

    if (editDescription) {
      newMeasurementData.description = undefined;
    }

    if (editLocation) {
      newMeasurementData.location = undefined;
    }

    let newEditLocation = editLocation;
    if (!editDescription && !editLocation) {
      newEditLocation = true;
    }

    setState(state => ({
      ...state,
      editLocation: newEditLocation,
      measurementData: newMeasurementData,
    }));
  }, [editDescription, editLocation, measurementData]);

  useEffect(() => {
    if (descriptionInput.current) {
      descriptionInput.current.focus();
    }
  }, [state]);

  const relabel = event =>
    setState(state => ({ ...state, editLocation: true }));

  const setDescriptionUpdateMode = () => {
    descriptionInput.current.focus();
    setState(state => ({ ...state, editDescription: true }));
  };

  const descriptionCancel = () => {
    const { description = '' } = cloneDeep(state);
    descriptionInput.current.value = description;
    setState(state => ({ ...state, editDescription: false }));
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      descriptionSave();
    }
  };

  const descriptionSave = () => {
    const description = descriptionInput.current.value;
    updateLabelling({ description });

    setState(state => ({
      ...state,
      description,
      editDescription: false,
    }));
  };

  const selectTreeSelectCallback = (event, itemSelected) => {
    const location = itemSelected.value;
    const locationLabel = itemSelected.label;
    updateLabelling({ location });

    setState(state => ({
      ...state,
      editLocation: false,
      measurementData: {
        ...state.measurementData,
        location,
        locationLabel,
      },
    }));
  };

  const showLabelling = () => {
    setState(state => ({
      ...state,
      skipAddLabelButton: true,
      editLocation: false,
    }));
  };

  /*
   * Waits for 1 sec to dismiss the labelling component.
   *
   */
  const fadeOutAndLeave = () =>
    setFadeOutTimer(setTimeout(fadeOutAndLeaveFast, 1000));

  const fadeOutAndLeaveFast = () => setShowComponent(false);

  const clearFadeOutTimer = () => {
    if (fadeOutTimer) {
      clearTimeout(fadeOutTimer);
      setFadeOutTimer(null);
    }
  };

  const descriptionDialogUpdate = description => {
    updateLabelling({ description });
    labellingDoneCallback();
  };

  const labellingStateFragment = () => {
    const { skipAddLabelButton, editLocation, measurementData } = state;
    const { description, locationLabel, location } = measurementData;

    if (!skipAddLabelButton) {
      return (
        <button
          type="button"
          className="addLabelButton"
          onClick={showLabelling}
        >
          {location ? 'Edit' : 'Add'} Label
        </button>
      );
    } else {
      if (editLocation) {
        return (
          <SelectTree
            items={OHIFLabellingData}
            columns={1}
            onSelected={selectTreeSelectCallback}
            selectTreeFirstTitle="Assign Label"
          />
        );
      } else {
        return (
          <>
            <div className="checkIconWrapper" onClick={fadeOutAndLeaveFast}>
              <Icon name="check" className="checkIcon" />
            </div>
            <div className="locationDescriptionWrapper">
              <div className="location">{locationLabel}</div>
              <div className="description">
                <input
                  id="descriptionInput"
                  ref={descriptionInput}
                  defaultValue={description || ''}
                  autoComplete="off"
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            <div className="commonButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={relabel}
              >
                Relabel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={setDescriptionUpdateMode}
              >
                {description ? 'Edit ' : 'Add '}
                Description
              </button>
            </div>
            <div className="editDescriptionButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={descriptionCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={descriptionSave}
              >
                Save
              </button>
            </div>
          </>
        );
      }
    }
  };

  if (editDescriptionOnDialog) {
    return (
      <EditDescriptionDialog
        onCancel={labellingDoneCallback}
        onUpdate={descriptionDialogUpdate}
        measurementData={state.measurementData}
      />
    );
  }

  return (
    <LabellingTransition
      displayComponent={showComponent}
      onTransitionExit={labellingDoneCallback}
    >
      <>
        <div
          className={`labellingComponent ${state.editDescription &&
            'editDescription'}`}
          onMouseLeave={fadeOutAndLeave}
          onMouseEnter={clearFadeOutTimer}
        >
          {labellingStateFragment()}
        </div>
      </>
    </LabellingTransition>
  );
};

LabellingFlow.propTypes = {
  measurementData: PropTypes.object.isRequired,
  labellingDoneCallback: PropTypes.func.isRequired,
  updateLabelling: PropTypes.func.isRequired,
  initialTopDistance: PropTypes.number,
  skipAddLabelButton: PropTypes.bool,
  editLocation: PropTypes.bool,
  editDescription: PropTypes.bool,
  editDescriptionOnDialog: PropTypes.bool,
};

LabellingFlow.defaultProps = {
  skipAddLabelButton: false,
  editLocation: false,
  editDescription: false,
  editDescriptionOnDialog: false,
};

export default LabellingFlow;
