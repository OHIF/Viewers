import { ContextMenu } from '../';
import PropTypes from 'prop-types';
import React from 'react';

const ContextMenuMeasurements = ({
  onGetMenuItems,
  onSetLabel,
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
      value: {},
    },
    {
      label: 'Add Label',
      actionType: 'setLabel',
      action: item => {
        onSetLabel(item);
        onClose();
      },
      value: {},
    },
  ];

  const menuItems = onGetMenuItems(defaultMenuItems);

  return <ContextMenu items={menuItems} />;
};

ContextMenuMeasurements.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSetLabel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGetMenuItems: PropTypes.func.isRequired,
};

export default ContextMenuMeasurements;
