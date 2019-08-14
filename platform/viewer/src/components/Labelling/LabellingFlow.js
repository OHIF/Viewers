import { Icon, SelectTree } from '@ohif/ui';
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

    initialTopDistance: PropTypes.number,
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
    if (this.state.editDescription) {
      this.descriptionInput.current.focus();
    }
  };

  render() {
    let mainElementClassName = 'labellingComponent';
    if (this.state.editDescription) {
      mainElementClassName += ' editDescription';
    }

    const style = Object.assign({}, this.state.componentStyle);
    if (this.state.skipAddLabelButton) {
      if (style.left - 160 < 0) {
        style.left = 0;
      } else {
        style.left -= 160;
      }
    }

    if (this.state.editLocation) {
      style.maxHeight = '70vh';
      if (!this.initialTopDistance) {
        this.initialTopDistance = window.innerHeight - window.innerHeight * 0.3;
        style.top = `${this.state.componentStyle.top -
          this.initialTopDistance / 2}px`;
      } else {
        style.top = `${this.state.componentStyle.top}px`;
      }
    }

    return (
      <LabellingTransition
        displayComponent={this.state.displayComponent}
        onTransitionExit={this.props.labellingDoneCallback}
      >
        <>
          <div className="labellingComponent-overlay"></div>
          <div
            className={mainElementClassName}
            style={style}
            ref={this.mainElement}
            onMouseLeave={this.fadeOutAndLeave}
            onMouseEnter={this.clearFadeOutTimer}
          >
            {this.labellingStateFragment()}
          </div>
        </>
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

  relabel = event => {
    const viewportTopPosition = this.mainElement.current.offsetParent.offsetTop;
    const componentStyle = {
      top: event.nativeEvent.y - viewportTopPosition - 55,
      left: event.nativeEvent.x,
    };
    this.setState({
      editLocation: true,
      componentStyle,
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
      left: event.nativeEvent.x,
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

  calculateTopDistance = () => {
    const height = window.innerHeight - window.innerHeight * 0.3;
    let top = this.state.componentStyle.top - height / 2 + 55;
    if (top < 0) {
      top = 0;
    } else {
      if (top + height > window.innerHeight) {
        top -= top + height - window.innerHeight;
      }
    }
    return top;
  };

  repositionComponent = () => {
    // SetTimeout for the css animation to end.
    setTimeout(() => {
      bounding(this.mainElement);
      if (this.state.editLocation) {
        this.mainElement.current.style.maxHeight = '70vh';
        const top = this.calculateTopDistance();
        this.mainElement.current.style.top = `${top}px`;
      }
    }, 200);
  };
}
