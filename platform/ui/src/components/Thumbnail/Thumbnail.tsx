import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDrag } from 'react-dnd';
import Icon from '../Icon';
import { StringNumber } from '../../types';

/**
 * Display a thumbnail for a display set.
 */
const Thumbnail = ({
  displaySetInstanceUID,
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  countIcon,
  dragData,
  isActive,
  onClick,
  onDoubleClick,
}): React.ReactNode => {
  // TODO: We should wrap our thumbnail to create a "DraggableThumbnail", as
  // this will still allow for "drag", even if there is no drop target for the
  // specified item.
  const [collectedProps, drag, dragPreview] = useDrag({
    type: 'displayset',
    item: { ...dragData },
    canDrag: function(monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });

  return (
    <div
      className={classnames(
        className,
        'flex flex-col flex-1 px-3 mb-8 cursor-pointer outline-none select-none group'
      )}
      id={`thumbnail-${displaySetInstanceUID}`}
      data-cy={`study-browser-thumbnail`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex="0"
    >
      <div ref={drag}>
        <div
          className={classnames(
            'flex flex-1 items-center justify-center rounded-md bg-black text-base text-white overflow-hidden min-h-32',
            isActive
              ? 'border-2 border-primary-light'
              : 'border border-secondary-light hover:border-blue-300'
          )}
          style={{
            margin: isActive ? '0' : '1px',
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAltText}
              className="object-none min-h-32"
              crossOrigin="anonymous"
            />
          ) : (
            <div>{imageAltText}</div>
          )}
        </div>
        <div className="flex flex-row items-center flex-1 pt-2 text-base text-blue-300">
          <div className="mr-4">
            <span className="font-bold text-primary-main">{'S: '}</span>
            {seriesNumber}
          </div>
          <div className="flex flex-row items-center flex-1">
            <Icon name={countIcon || 'group-layers'} className="w-3 mr-2" />
            {` ${numInstances}`}
          </div>
        </div>
        <div className="text-base text-white break-all">{description}</div>
      </div>
    </div>
  );
};

Thumbnail.propTypes = {
  displaySetInstanceUID: PropTypes.string.isRequired,
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
  seriesNumber: StringNumber.isRequired,
  numInstances: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
};

Thumbnail.defaultProps = {
  dragData: {},
};

export default Thumbnail;
