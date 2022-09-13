import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../';

const SegmentationConfig = ({ onConfigChange }) => {
  return (
    <div className="flex flex-column px-2 py-1">
      <label className="w-2/4 text-primary-light">Segmentation Config</label>
    </div>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
