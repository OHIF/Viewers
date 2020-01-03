import React from 'react';
import PropTypes from 'prop-types';

import './ContextMenu.css';

const ContextMenu = ({ items, onClick }) => {
  return (
    <div className="ContextMenu">
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <button className="form-action" onClick={() => onClick(item)}>
              <span key={index}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

ContextMenu.propTypes = {
  items: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ContextMenu;
