import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDrag } from 'react-dnd';
//
import { Icon } from '@ohif/ui';

/**
 *
 */
const Thumbnail = ({
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  // dragData,
  isActive,
  onClick,
}) => {
  // TODO: We should wrap our thumbnail to create a "DraggableThumbnail", as
  // this will still allow for "drag", even if there is no drop target for the
  // specified item.
  /*const [collectedProps, drag, dragPreview] = useDrag({
    item: { ...dragData },
    canDrag: function(monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });*/

  //      ref={drag}
  return (
    <div
      className={classnames(
        className,
        'flex flex-col flex-1 px-3 cursor-pointer outline-none'
      )}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex="0"
    >
      <div
        className={classnames(
          'flex flex-1 items-center justify-center rounded-md bg-black text-base text-white mb-2 min-h-32',
          isActive
            ? 'border-2 border-primary-light'
            : 'border border-secondary-light hover:border-blue-300'
        )}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAltText}
            className="min-h-32 object-none"
          />
        ) : (
          <div>{imageAltText}</div>
        )}
      </div>
      <div className="flex flex-row flex-1 text-blue-300 text-base items-center">
        <div className="mr-4">
          <span className="text-primary-main font-bold">{'S: '}</span>
          {seriesNumber}
        </div>
        <div className="flex flex-row items-center flex-1">
          <Icon name="group-layers" className="w-3 mr-2" /> {numInstances}
        </div>
      </div>
      <div className="text-white text-base">{description}</div>
    </div>
  );
};

Thumbnail.propTypes = {
  className: PropTypes.string,
  imageSrc: PropTypes.string,
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
  imageAltText: PropTypes.string,
  description: PropTypes.string.isRequired,
  seriesNumber: PropTypes.number.isRequired,
  numInstances: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

Thumbnail.defaultProps = {
  dragData: {},
};

export default Thumbnail;
