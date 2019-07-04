import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import getMeasurementLocationCallback from '../lib/getMeasurementLocationCallback';

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

let defaultDropdownItems = [
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
      const { tool } = nearbyToolData;

      const options = {
        skipAddLabelButton: true,
        editLocation: true,
      };

      getMeasurementLocationCallback(eventData, tool, options);
    },
  },
  {
    actionType: 'setDescription',
    action: ({ nearbyToolData, eventData }) => {
      const { tool } = nearbyToolData;

      const options = {
        editDescriptionOnDialog: true,
      };

      getMeasurementLocationCallback(eventData, tool, options);
    },
  },
];

function getNearbyToolData(element, coords, toolTypes) {
  const nearbyTool = {};
  let pointNearTool = false;

  toolTypes.forEach(toolType => {
    const toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
      return;
    }

    toolData.data.forEach(function(data, index) {
      // TODO: Fix this, it's ugly
      let toolInterface = cornerstoneTools.getToolForElement(element, toolType);
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

function getDropdownItems(eventData, isTouchEvent = false, availableTools) {
  const nearbyToolData = getNearbyToolData(
    eventData.element,
    eventData.currentPoints.canvas,
    toolTypes,
    availableTools
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
    defaultDropdownItems.forEach(function(item) {
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

class ToolContextMenu extends Component {
  static propTypes = {
    isTouchEvent: PropTypes.bool.isRequired,
    eventData: PropTypes.object,
    onClose: PropTypes.func,
    availableTools: PropTypes.array,
    visible: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    visible: true,
    isTouchEvent: false,
  };

  constructor(props) {
    super(props);

    this.mainElement = React.createRef();
  }

  render() {
    if (!this.props.eventData) {
      return null;
    }

    const { isTouchEvent, eventData, availableTools } = this.props;
    const dropdownItems = getDropdownItems(
      eventData,
      isTouchEvent,
      availableTools
    );

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

    const position = {
      top: `${eventData.currentPoints.canvas.y}px`,
      left: `${eventData.currentPoints.canvas.x}px`,
    };

    return (
      <div className="ToolContextMenu" style={position} ref={this.mainElement}>
        <ul className="bounded">{dropdownComponents}</ul>
      </div>
    );
  }

  componentDidMount = () => {
    if (this.mainElement.current) {
      this.updateElementPosition();
    }
  };

  componentDidUpdate = () => {
    if (this.mainElement.current) {
      this.updateElementPosition();
    }
  };

  updateElementPosition = () => {
    const {
      offsetParent,
      offsetTop,
      offsetHeight,
      offsetWidth,
      offsetLeft,
    } = this.mainElement.current;

    const { eventData } = this.props;

    if (offsetTop + offsetHeight > offsetParent.offsetHeight) {
      const offBoundPixels =
        offsetTop + offsetHeight - offsetParent.offsetHeight;
      const top = eventData.currentPoints.canvas.y - offBoundPixels;

      this.mainElement.current.style.top = `${top > 0 ? top : 0}px`;
    }

    if (offsetLeft + offsetWidth > offsetParent.offsetWidth) {
      const offBoundPixels =
        offsetLeft + offsetWidth - offsetParent.offsetWidth;
      const left = eventData.currentPoints.canvas.x - offBoundPixels;

      this.mainElement.current.style.left = `${left > 0 ? left : 0}px`;
    }
  };
}

export default ToolContextMenu;
