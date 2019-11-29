import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

import './ToolContextMenu.css';

const toolTypes = [
  'Angle',
  'Bidirectional',
  'Length',
  'FreehandMouse',
  'EllipticalRoi',
  'CircleRoi',
  'RectangleRoi',
];

class ToolContextMenu extends Component {
  static propTypes = {
    isTouchEvent: PropTypes.bool.isRequired,
    eventData: PropTypes.object,
    onClose: PropTypes.func,
  };

  static defaultProps = {
    isTouchEvent: false,
  };

  constructor(props) {
    super(props);

    this.mainElement = React.createRef();
    this.defaultDropdownItems = [
      {
        actionType: 'Delete',
        action: ({ nearbyToolData, eventData }) => {
          const element = eventData.element;

          cornerstoneTools.removeToolState(
            element,
            nearbyToolData.toolType,
            nearbyToolData.tool
          );

          cornerstone.updateImage(element);
        },
      },
      {
        actionType: 'setLabel',
        action: ({ nearbyToolData, eventData }) => {
          const { tool: measurementData } = nearbyToolData;
          this.props.onSetLabel(eventData, measurementData);
        },
      },
      {
        actionType: 'setDescription',
        action: ({ nearbyToolData, eventData }) => {
          const { tool: measurementData } = nearbyToolData;
          this.props.onSetDescription(eventData, measurementData);
        },
      },
    ];
  }

  getNearbyToolData(element, coords, toolTypes) {
    const nearbyTool = {};
    let pointNearTool = false;

    toolTypes.forEach(toolType => {
      const toolData = cornerstoneTools.getToolState(element, toolType);
      if (!toolData) {
        return;
      }

      toolData.data.forEach(function(data, index) {
        // TODO: Fix this, it's ugly
        let toolInterface = cornerstoneTools.getToolForElement(
          element,
          toolType
        );
        if (!toolInterface) {
          toolInterface = cornerstoneTools.getToolForElement(
            element,
            `${toolType}Tool`
          );
        }

        if (!toolInterface) {
          throw new Error('Tool not found.');
        }

        if (toolInterface.pointNearTool(element, data, coords)) {
          pointNearTool = true;
          nearbyTool.tool = data;
          nearbyTool.index = index;
          nearbyTool.toolType = toolType;
        }
      });

      if (pointNearTool) {
        return false;
      }
    });

    return pointNearTool ? nearbyTool : undefined;
  }

  getDropdownItems(eventData, isTouchEvent = false) {
    const nearbyToolData = this.getNearbyToolData(
      eventData.element,
      eventData.currentPoints.canvas,
      toolTypes
    );

    // Annotate tools for touch events already have a press handle to edit it, has a better UX for deleting it
    if (
      isTouchEvent &&
      nearbyToolData &&
      nearbyToolData.toolType === 'arrowAnnotate'
    ) {
      return;
    }

    let dropdownItems = [];
    if (nearbyToolData) {
      this.defaultDropdownItems.forEach(function(item) {
        item.params = {
          eventData,
          nearbyToolData,
        };

        if (item.actionType === 'Delete') {
          item.text = 'Delete measurement';
        }

        if (item.actionType === 'setLabel') {
          item.text = 'Relabel';
        }

        if (item.actionType === 'setDescription') {
          item.text = `${
            nearbyToolData.tool.description ? 'Edit' : 'Add'
          } Description`;
        }

        dropdownItems.push(item);
      });
    }

    return dropdownItems;
  }

  render() {
    if (!this.props.eventData) {
      return null;
    }

    const { isTouchEvent, eventData } = this.props;
    const dropdownItems = this.getDropdownItems(eventData, isTouchEvent);

    // Skip if there is no dropdown item
    if (!dropdownItems.length) {
      return '';
    }

    const dropdownComponents = dropdownItems.map(item => {
      const itemOnClick = event => {
        item.action(item.params);
        if (this.props.onClose) {
          this.props.onClose();
        }
      };

      return (
        <li key={item.actionType}>
          <button className="form-action" onClick={itemOnClick}>
            <span key={item.actionType}>{item.text}</span>
          </button>
        </li>
      );
    });

    return (
      <div className="ToolContextMenu" ref={this.mainElement}>
        <ul className="bounded">{dropdownComponents}</ul>
      </div>
    );
  }
}

export default ToolContextMenu;
