import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '../';

const ContextMenu = ({ items }) => {
  return (
    <div
      className="relative bg-secondary-dark rounded z-50 block w-48"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => item.action(item)}
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
      actionType: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ).isRequired,
};

export default ContextMenu;
