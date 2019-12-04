import React from 'react';
import PropTypes from 'prop-types';
import { commandsManager } from './../App.js';

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

const ToolContextMenu = ({
  onSetLabel,
  onSetDescription,
  isTouchEvent,
  eventData,
  onClose,
  onDelete,
}) => {
  const defaultDropdownItems = [
    {
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
    {
      actionType: 'setLabel',
      action: ({ nearbyToolData, eventData }) => {
        const { tool: measurementData } = nearbyToolData;
        onSetLabel(eventData, measurementData);
      },
    },
    {
      actionType: 'setDescription',
      action: ({ nearbyToolData, eventData }) => {
        const { tool: measurementData } = nearbyToolData;
        onSetDescription(eventData, measurementData);
      },
    },
  ];

  const getDropdownItems = (eventData, isTouchEvent = false) => {
    const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
      element: eventData.element,
      canvasCoordinates: eventData.currentPoints.canvas,
      availableToolTypes: toolTypes,
    });

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
      defaultDropdownItems.forEach(item => {
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
  };

  const itemOnClickHandler = (action, params, onClose) => {
    action(params);
    if (onClose) {
      onClose();
    }
  };

  const dropdownItems = getDropdownItems(eventData, isTouchEvent);

  return (
    dropdownItems.length &&
    eventData && (
      <div className="ToolContextMenu">
        <ul className="bounded">
          {dropdownItems.map(({ params, action, text, actionType }) => (
            <li key={actionType}>
              <button
                className="form-action"
                onClick={() => itemOnClickHandler(action, params, onClose)}
              >
                <span key={actionType}>{text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  );
};

ToolContextMenu.propTypes = {
  isTouchEvent: PropTypes.bool.isRequired,
  eventData: PropTypes.object,
  onClose: PropTypes.func,
};

ToolContextMenu.defaultProps = {
  isTouchEvent: false,
};

export default ToolContextMenu;
