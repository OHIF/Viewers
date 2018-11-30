import { Component } from 'react';
import React from 'react';
import './ViewportOverlay.css';
/*import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';*/
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import PropTypes from 'prop-types';
import './ToolContextMenu.css';

const toolTypes = ['Bidirectional'];

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
    }
  },
  {
    actionType: 'bidirectionalLabel',
    action: ({ nearbyToolData, eventData }) => {
      const element = eventData.element;
      const { tool, toolType } = nearbyToolData;

      const doneCallback = () => {
        cornerstone.updateImage(element);
      };

      const options = {
        skipButton: true
      };

      const ToolInstance = cornerstoneTools.getToolForElement(
        element,
        toolType
      );
      ToolInstance.configuration.getMeasurementLocationCallback(
        tool,
        eventData,
        doneCallback,
        options
      );
    }
  },
  {
    actionType: 'bidirectionalDescription',
    action: ({ nearbyToolData, eventData }) => {
      const element = eventData.element;
      const { tool, toolType } = nearbyToolData;

      const doneCallback = () => {
        cornerstone.updateImage(element);
      };

      const options = {
        skipButton: true,
        editDescription: true
      };

      const ToolInstance = cornerstoneTools.getToolForElement(
        element,
        toolType
      );
      ToolInstance.configuration.getMeasurementLocationCallback(
        tool,
        eventData,
        doneCallback,
        options
      );
    }
  }
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
      const toolInterface = cornerstoneTools[`${toolType}Tool`];

      // TODO: vNext wants me to do this?
      // Switch to cornerstoneTools.store.state.tools
      const t = new toolInterface();

      if (t.pointNearTool(element, data, coords)) {
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

function getDropdownItems(eventData, isTouchEvent = false) {
  const nearbyToolData = getNearbyToolData(
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
    defaultDropdownItems.forEach(function(item) {
      item.params = {
        eventData,
        nearbyToolData
      };

      if (item.actionType === 'Delete') {
        item.text = 'Delete measurement';
      }

      if (item.actionType === 'bidirectionalLabel') {
        if (nearbyToolData.toolType !== 'Bidirectional') {
          return;
        }
        item.text = `${nearbyToolData.tool.location ? 'Edit' : 'Add'} Label`;
      }

      if (item.actionType === 'bidirectionalDescription') {
        if (
          nearbyToolData.toolType !== 'Bidirectional' ||
          !nearbyToolData.tool.location
        ) {
          return;
        }
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
  constructor(props) {
    super(props);

    this.mainElement = React.createRef();
  }

  render() {
    if (!this.props.toolContextMenuData) {
      return '';
    }

    const { eventData, isTouchEvent } = this.props.toolContextMenuData;
    const dropdownItems = getDropdownItems(eventData, isTouchEvent);

    // Skip if there is no dropdown item
    if (!dropdownItems.length) {
      return '';
    }

    const dropdownComponents = dropdownItems.map(item => {
      const itemOnClick = event => {
        item.action(item.params);
        this.props.onClose();
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
      left: `${eventData.currentPoints.canvas.x}px`
    };

    return (
      <div
        className="ToolContextMenu dropdown"
        style={position}
        ref={this.mainElement}
      >
        <ul className="dropdown-menu dropdown-menu-left bounded">
          {dropdownComponents}
        </ul>
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
      offsetLeft
    } = this.mainElement.current;
    const { eventData } = this.props.toolContextMenuData;
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

ToolContextMenu.propTypes = {
  toolContextMenuData: PropTypes.object, // or null
  onClose: PropTypes.func.isRequired
};

export default ToolContextMenu;
