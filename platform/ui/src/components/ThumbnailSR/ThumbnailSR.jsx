import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '@ohif/ui';

const ThumbnailSR = ({ seriesDescription, seriesDate }) => {
  return (
    <div className="flex flex-row flex-1">
      <div>
        <Icon name="list-bullets" />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row flex-1">
          <div className="px-6 py-1 bg-primary-main rounded-sm mr-4">SR</div>
          <span className="text-blue-300">{seriesDate}</span>
        </div>
        <div className="text-white">{seriesDescription}</div>
      </div>
      <div></div>
    </div>
  );
};

ThumbnailSR.propTypes = {
  seriesDescription: PropTypes.string,
  seriesDate: PropTypes.string,
};

export default ThumbnailSR;
