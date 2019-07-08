import { Icon, SelectTree } from 'react-viewerbase';
import React, { Component } from 'react';

import LabellingTransition from './LabellingTransition.js';
import OHIFLabellingData from './OHIFLabellingData.js';
import PropTypes from 'prop-types';
import bounding from '../../lib/utils/bounding.js';
import cloneDeep from 'lodash.clonedeep';
import { getAddLabelButtonStyle } from './labellingPositionUtils.js';

export default class LabellingFlow extends Component {
  static propTypes = {
    eventData: PropTypes.object.isRequired,
    measurementData: PropTypes.object.isRequired,

    labellingDoneCallback: PropTypes.func.isRequired,
    updateLabelling: PropTypes.func.isRequired,

    skipAddLabelButton: PropTypes.bool,
    editLocation: PropTypes.bool,
    editDescription: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    const { location, locationLabel, description } = props.measurementData;

    let style = props.componentStyle;
    if (!props.skipAddLabelButton) {
      style = getAddLabelButtonStyle(props.measurementData, props.eventData);
    }

    this.state = {
      location,
      locationLabel,
      description,
      skipAddLabelButton: props.skipAddLabelButton,
      editDescription: props.editDescription,
      editLocation: props.editLocation,
      componentStyle: style,
      confirmationState: false,
      displayComponent: true,
    };

    this.mainElement = React.createRef();
    this.descriptionInput = React.createRef();

    this.initialItems = OHIFLabellingData;
    this.currentItems = cloneDeep(this.initialItems);
  }

  componentDidUpdate = () => {
    this.repositionComponent();
  };

  render() {
    let mainElementClassName = 'labellingComponent';
    if (this.state.editDescription) {
      mainElementClassName += ' editDescription';
    }

    const style = Object.assign({}, this.state.componentStyle);
    if (this.state.skipAddLabelButton) {
      style.left -= 160;
    }

    return (
      <LabellingTransition
        displayComponent={this.state.displayComponent}
        onTransitionExit={this.props.labellingDoneCallback}
      >
        <div
          className={mainElementClassName}
          style={style}
          ref={this.mainElement}
          onMouseLeave={this.fadeOutAndLeave}
          onMouseEnter={this.clearFadeOutTimer}
        >
          {this.labellingStateFragment()}
        </div>
      </LabellingTransition>
    );
  }

  labellingStateFragment = () => {
    const {
      skipAddLabelButton,
      editLocation,
      description,
      locationLabel,
    } = this.state;

    if (!skipAddLabelButton) {
      return (
        <>
          <button
            type="button"
            className="addLabelButton"
            onClick={this.showLabelling}
          >
            {this.state.location ? 'Edit' : 'Add'} Label
          </button>
        </>
      );
    } else {
      if (editLocation) {
        return (
          <SelectTree
            items={this.currentItems}
            columns={1}
            onSelected={this.selectTreeSelectCalback}
            selectTreeFirstTitle="Assign Label"
            onComponentChange={this.repositionComponent}
          />
        );
      } else {
        return (
          <>
            <div
              className="checkIconWrapper"
              onClick={this.fadeOutAndLeaveFast}
            >
              <Icon name="check" className="checkIcon" />
            </div>
            <div className="locationDescriptionWrapper">
              <div className="location">{locationLabel}</div>
              <div className="description">
                <input
                  id="descriptionInput"
                  ref={this.descriptionInput}
                  defaultValue={description || ''}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="commonButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={this.relabel}
              >
                Relabel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={this.setDescriptionUpdateMode}
              >
                {description ? 'Edit ' : 'Add '}
                Description
              </button>
            </div>
            <div className="editDescriptionButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={this.descriptionCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={this.descriptionSave}
              >
                Save
              </button>
            </div>
          </>
        );
      }
    }
  };

  relabel = () => {
    this.setState({
      editLocation: true,
    });
  };

  setDescriptionUpdateMode = () => {
    this.descriptionInput.current.focus();

    this.setState({
      editDescription: true,
    });
  };

  descriptionCancel = () => {
    const { description = '' } = cloneDeep(this.state);
    this.descriptionInput.current.value = description;

    this.setState({
      editDescription: false,
    });
  };

  descriptionSave = () => {
    const description = this.descriptionInput.current.value;
    this.props.updateLabelling({ description });

    this.setState({
      description,
      editDescription: false,
    });
  };

  selectTreeSelectCalback = (event, itemSelected) => {
    const location = itemSelected.value;
    this.props.updateLabelling({ location });

    const viewportTopPosition = this.mainElement.current.offsetParent.offsetTop;
    const componentStyle = {
      top: event.nativeEvent.y - viewportTopPosition - 25,
      left: this.state.componentStyle.left,
    };

    this.setState({
      editLocation: false,
      confirmationState: true,
      location: itemSelected.value,
      locationLabel: itemSelected.label,
      componentStyle,
    });

    if (this.isTouchScreen) {
      this.setTimeout = setTimeout(() => {
        this.setState({
          displayComponent: false,
        });
      }, 2000);
    }
  };

  showLabelling = () => {
    this.setState({
      skipAddLabelButton: true,
      editLocation: false,
    });
  };

  fadeOutAndLeave = () => {
    // Wait for 1 sec to dismiss the labelling component
    this.fadeOutTimer = setTimeout(() => {
      this.setState({
        displayComponent: false,
      });
    }, 1000);
  };

  fadeOutAndLeaveFast = () => {
    this.setState({
      displayComponent: false,
    });
  };

  clearFadeOutTimer = () => {
    if (!this.fadeOutTimer) {
      return;
    }

    clearTimeout(this.fadeOutTimer);
  };

  repositionComponent = () => {
    // SetTimeout for the css animation to end.
    setTimeout(() => {
      bounding(this.mainElement);
    }, 200);
  };
}
