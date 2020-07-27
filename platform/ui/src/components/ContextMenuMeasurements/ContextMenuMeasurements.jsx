import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import React from 'react';

const ContextMenuMeasurements = ({
  onGetMenuItems,
  onSetLabel,
  onSetDescription,
  onClose,
  onDelete,
}) => {
  const defaultMenuItems = [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: item => {
        onDelete(item);
        onClose();
      },
      value: {}
    },
    {
      label: 'Relabel',
      actionType: 'setLabel',
      action: item => {
        onSetLabel(item);
        onClose();
      },
      value: {}
    },
    /* TODO: Add this back if needed. {
      label: 'Add Description',
      actionType: 'setDescription',
      action: item => {
        onSetDescription(item);
        onClose();
      },
      value: {}
    }, */
  ];

  const menuItems = onGetMenuItems(defaultMenuItems);

  return <ContextMenu items={menuItems} />;
};

ContextMenuMeasurements.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSetDescription: PropTypes.func,
  onSetLabel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGetMenuItems: PropTypes.func.isRequired,
};

export default ContextMenuMeasurements;
