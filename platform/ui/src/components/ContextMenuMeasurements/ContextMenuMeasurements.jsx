import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import React from 'react';

const ContextMenuMeasurements = ({
  onSetLabel,
  onSetDescription,
  isTouchEvent,
  eventData,
  onClose,
  onDelete,
}) => {
  const dropdownItems = [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: item => {
        onDelete(item);
        onClose();
      },
    },
    {
      label: 'Relabel',
      actionType: 'setLabel',
      action: item => {
        onSetLabel(item);
        onClose();
      },
    },
    {
      label: 'Add Description',
      actionType: 'setDescription',
      action: item => {
        onSetDescription(item);
        onClose();
      },
    },
  ];

  return <ContextMenu items={dropdownItems} />;
};

ContextMenuMeasurements.propTypes = {
  isTouchEvent: PropTypes.bool,
  eventData: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSetDescription: PropTypes.func.isRequired,
  onSetLabel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

ContextMenuMeasurements.defaultProps = {
  isTouchEvent: false,
};

export default ContextMenuMeasurements;
