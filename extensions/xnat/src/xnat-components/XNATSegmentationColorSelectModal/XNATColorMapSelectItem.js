import React from 'react';
import PropTypes from 'prop-types';

import './XNATColorMapSelectItem.css';

const XNATColorMapSelectItem = ({ onClick, title, description }) => {
  return (
    <li className="xnat-color-map-item" onClick={onClick}>
      <div className="colormap-meta">
        <div className="colormap-meta-title">{title}</div>
        <div className="colormap-meta-description">{description}</div>
      </div>
    </li>
  );
};

XNATColorMapSelectItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

XNATColorMapSelectItem.defaultProps = {
  description: '',
};

export default XNATColorMapSelectItem;
