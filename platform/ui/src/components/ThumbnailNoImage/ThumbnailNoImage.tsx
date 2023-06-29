import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import Icon from '../Icon';
import Tooltip from '../Tooltip';
import Typography from '../Typography';

const ThumbnailNoImage = ({
  displaySetInstanceUID,
  description,
  seriesDate,
  modality,
  modalityTooltip,
  onClick,
  onDoubleClick,
  canReject,
  onReject,
  dragData,
  isActive,
}) => {
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
        'flex flex-row flex-1 cursor-pointer outline-none border-transparent hover:border-blue-300 focus:border-blue-300 rounded select-none',
        isActive ? 'border-2 border-primary-light' : 'border'
      )}
      style={{
        padding: isActive ? '11px' : '12px',
      }}
      id={`thumbnail-${displaySetInstanceUID}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex="0"
      data-cy={`study-browser-thumbnail-no-image`}
    >
      <div ref={drag}>
        <div className="flex flex-col flex-1">
          <div className="flex flex-row items-center flex-1 mb-2">
            <Icon name="list-bullets" className="w-12 text-secondary-light" />
            <Tooltip
              position="bottom"
              content={<Typography>{modalityTooltip}</Typography>}
            >
              <div className="px-3 text-lg text-white rounded-sm bg-primary-main">
                {modality}
              </div>
            </Tooltip>
            <span className="ml-4 text-base text-blue-300">{seriesDate}</span>
          </div>
          <div className="flex flex-row">
            {canReject && (
              <Icon
                name="old-trash"
                style={{ minWidth: '12px' }}
                className="w-3 ml-4 text-red-500"
                onClick={onReject}
              />
            )}
            <div className="ml-4 text-base text-white break-all">
              {description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ThumbnailNoImage.propTypes = {
  displaySetInstanceUID: PropTypes.string.isRequired,
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
  /* Tooltip message to display when modality text is hovered */
  modalityTooltip: PropTypes.string.isRequired,
  seriesDate: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default ThumbnailNoImage;
