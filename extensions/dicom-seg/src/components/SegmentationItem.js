import React from 'react';
import PropTypes from 'prop-types';

const SegmentationItem = ({ onClick, title, description }) => {
  return (
    <li className="segmentation-item" onClick={onClick}>
      <div className="segmentation-meta">
        <div className="segmentation-meta-title">{title}</div>
        <div className="segmentation-meta-description">{description}</div>
      </div>
    </li>
  );
};

SegmentationItem.propTypes = {
  onClick: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SegmentationItem;
