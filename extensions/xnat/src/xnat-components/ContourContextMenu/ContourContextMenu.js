import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import React from 'react';

const modules = csTools.store.modules;

const ContourContextMenu = ({
  eventData,
  callbackData,
  onClose,
  onDelete,
  onCopy,
  onPaste,
  onEmpty,
}) => {
  const contourDropdownItems = [
    {
      label: 'Delete contour',
      actionType: 'Delete',
      action: () => onDelete(),
    },
    {
      label: 'Copy contour',
      actionType: 'Copy',
      action: () => onCopy(),
    },
    {
      label: 'Cancel',
      actionType: 'Cancel',
      action: () => onClose(),
    },
  ];

  const nonContourDropdownItems = [
    {
      label: 'Paste contour',
      actionType: 'Paste',
      action: () => onPaste(),
    },
    {
      label: 'Empty clipboard',
      actionType: 'Empty',
      action: () => onEmpty(),
    },
    {
      label: 'Cancel',
      actionType: 'Cancel',
      action: () => onClose(),
    },
  ];

  const getDropdownItems = eventData => {
    let dropdownItems = [];

    if (callbackData.nearbyToolData) {
      contourDropdownItems.forEach(item => {
        item.params = {};
        dropdownItems.push(item);
      });
    } else {
      const module = modules.freehand3D;
      if (module.clipboard.data) {
        nonContourDropdownItems.forEach(item => {
          item.params = {};
          dropdownItems.push(item);
        });
      }
    }

    return dropdownItems;
  };

  const onClickHandler = ({ action, params }) => {
    action(params);
    if (onClose) {
      onClose();
    }
  };

  const dropdownItems = getDropdownItems(eventData);

  return (
    <div className="ToolContextMenu">
      <ContextMenu items={dropdownItems} onClick={onClickHandler} />
    </div>
  );
};

ContourContextMenu.propTypes = {
  eventData: PropTypes.object,
  callbackData: PropTypes.object,
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
  onPaste: PropTypes.func,
  onEmpty: PropTypes.func,
};

export default ContourContextMenu;
