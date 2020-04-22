import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '@ohif/ui';

const ThumbnailNoImage = ({ description, seriesDate, modality, onClick }) => {
  return (
    <div
      className="flex flex-row flex-1 px-4 py-3 cursor-pointer"
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex="0"
    >
      <div className="flex flex-col flex-1">
        <div className="flex flex-row flex-1 items-center mb-2">
          <Icon name="list-bullets" className="text-secondary-light w-12" />
          <div className="px-3 bg-primary-main rounded-sm mr-4 text-lg text-white">
            {modality}
          </div>
          <span className="text-blue-300 text-base">{seriesDate}</span>
        </div>
        <div className="text-white text-base ml-12">{description}</div>
      </div>
    </div>
  );
};

ThumbnailNoImage.propTypes = {
  description: PropTypes.string.isRequired,
  modality: PropTypes.string.isRequired,
  seriesDate: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ThumbnailNoImage;
