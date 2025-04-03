import React from 'react';
import PropTypes from 'prop-types';

import './DicomBrowserSelectItem.css';

const DicomBrowserSelectItem = ({ title, description }) => {
  return (
    <div className="dicom-browser-item">
      <div className="dicom-browser-meta">
        <div className="dicom-browser-title">{title}</div>
        {description && (
          <div className="dicom-browser-description">{description}</div>
        )}
      </div>
    </div>
  );
};

DicomBrowserSelectItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string
};

DicomBrowserSelectItem.defaultProps = {
  description: '',
};

export default DicomBrowserSelectItem;
