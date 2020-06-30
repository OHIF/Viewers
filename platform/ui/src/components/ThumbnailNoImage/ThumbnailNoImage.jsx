import React, { useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';

import { Icon } from '@ohif/ui';
import blurHandlerListener from '../../utils/blurHandlerListener';

const ThumbnailNoImage = ({
  description,
  seriesDate,
  modality,
  onClick,
  dragData,
  isActive,
}) => {
  const [collectedProps, drag, dragPreview] = useDrag({
    item: { ...dragData },
    canDrag: function(monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });

  const thumbnailElement = useRef(null);

  return (
    <div
      ref={thumbnailElement}
      onFocus={() => blurHandlerListener(thumbnailElement)}
      className={classnames(
        'flex flex-row flex-1 px-4 py-3 cursor-pointer outline-none border-transparent hover:border-blue-300 focus:border-blue-300 rounded',
        isActive ? 'border-2 border-primary-light' : 'border'
      )}
      onDoubleClick={onClick}
      role="button"
      tabIndex="0"
    >
      <div ref={drag}>
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
    </div>
  );
};

ThumbnailNoImage.propTypes = {
  /**
   * Data the thumbnail should expose to a receiving drop target. Use a matching
   * `dragData.type` to identify which targets can receive this draggable item.
   * If this is not set, drag-n-drop will be disabled for this thumbnail.
   *
   * Ref: https://react-dnd.github.io/react-dnd/docs/api/use-drag#specification-object-members
   */
  dragData: PropTypes.shape({
    /** Must match the "type" a dropTarget expects */
    type: PropTypes.string.isRequired,
  }),
  description: PropTypes.string.isRequired,
  modality: PropTypes.string.isRequired,
  seriesDate: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default ThumbnailNoImage;
