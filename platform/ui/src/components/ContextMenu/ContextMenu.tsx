import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '../';
import ContextMenuController from './ContextMenuController';

const ContextMenu = ({ items, ...props }) => {
  if (!items) {
    console.warn('No items for context menu');
    return null;
  }
  return (
    <div
      className="relative bg-secondary-dark rounded z-50 block w-48"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => item.action(item, props)}
          className="flex px-4 py-3 cursor-pointer items-center transition duration-300 hover:bg-primary-dark border-b border-primary-dark last:border-b-0"
        >
          <Typography>{item.label}</Typography>
        </div>
      ))}
    </div>
  );
};

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ).isRequired,
};

// Static element for managing context menus
ContextMenu.Controller = ContextMenuController;

export default ContextMenu;
