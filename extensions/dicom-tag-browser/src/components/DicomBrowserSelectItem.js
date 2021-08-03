import React from 'react';
import PropTypes from 'prop-types';

import './DicomBrowserSelectItem.css';

const DicomBrowserSelectItem = ({ onClick, title, description }) => {
  return (
    <li className="dcmseg-segmentation-item" onClick={onClick}>
      <div className="segmentation-meta">
        <div className="segmentation-meta-title">{title}</div>
        <div className="segmentation-meta-description">{description}</div>
      </div>
    </li>
  );
};

DicomBrowserSelectItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

DicomBrowserSelectItem.defaultProps = {
  description: '',
};

export default DicomBrowserSelectItem;
