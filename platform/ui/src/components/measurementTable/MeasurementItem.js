import React from 'react';
import PropTypes from 'prop-types';

import './MeasurementItem.css';

const MeasurementItem = ({ onClick, title, description }) => {
  return (
    <li className="measurement-item" onClick={onClick}>
      <div className="measurement-meta">
        <div className="measurement-meta-title">{title}</div>
        <div className="measurement-meta-description">{description}</div>
      </div>
    </li>
  );
};

MeasurementItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};

MeasurementItem.defaultProps = {
  description: '',
};

export default MeasurementItem;
