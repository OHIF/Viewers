import React from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';

import { Icon } from '@ohif/ui';

const ThumbnailNoImage = ({
  description,
  seriesDate,
  modality,
  onClick,
  dragData,
}) => {
  const [collectedProps, drag, dragPreview] = useDrag({
    item: { ...dragData },
    canDrag: function(monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });

  return (
    <div
      ref={drag}
      className="flex flex-row flex-1 px-4 py-3 cursor-pointer"
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex="0"
    >
      <div className="flex flex-col flex-1">
        <div className="flex flex-row items-center flex-1 mb-2">
          <Icon name="list-bullets" className="w-12 text-secondary-light" />
          <div className="px-3 mr-4 text-lg text-white rounded-sm bg-primary-main">
            {modality}
          </div>
          <span className="text-base text-blue-300">{seriesDate}</span>
        </div>
        <div className="ml-12 text-base text-white break-all">
          {description}
        </div>
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
