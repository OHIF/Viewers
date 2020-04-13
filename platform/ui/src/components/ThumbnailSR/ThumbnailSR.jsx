import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '@ohif/ui';

const ThumbnailSR = ({ seriesDescription, seriesDate, onClick }) => {
  return (
    <div
      className="flex flex-row flex-1 px-4 py-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-2 pl-2 pr-3">
        <Icon name="list-bullets" className="text-secondary-light" />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row flex-1 items-center mb-2">
          <div className="px-4 bg-primary-main rounded-sm mr-4 text-xl text-white">
            SR
          </div>
          <span className="text-blue-300 text-base">{seriesDate}</span>
        </div>
        <div className="text-white text-base">{seriesDescription}</div>
      </div>
      <div></div>
    </div>
  );
};

ThumbnailSR.propTypes = {
  seriesDescription: PropTypes.string,
  seriesDate: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default ThumbnailSR;
