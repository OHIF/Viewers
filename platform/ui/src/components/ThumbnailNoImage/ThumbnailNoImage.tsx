import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import Icon from '../Icon';
import Tooltip from '../Tooltip';
import Typography from '../Typography';
import DisplaySetMessageListTooltip from '../DisplaySetMessageListTooltip';

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
  messages,
  dragData,
  isActive,
  isHydratedForDerivedDisplaySet,
}) => {
  const [collectedProps, drag, dragPreview] = useDrag({
    type: 'displayset',
    item: { ...dragData },
    canDrag: function (monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });

  const [lastTap, setLastTap] = useState(0);

  const handleTouchEnd = e => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      onDoubleClick(e);
    } else {
      onClick(e);
    }
    setLastTap(currentTime);
  };

  return (
    <div
      className={classnames(
        'flex flex-1 cursor-pointer select-none flex-row rounded outline-none hover:border-blue-300 focus:border-blue-300',
        isActive ? 'border-primary-light border-2' : 'border border-transparent'
      )}
      style={{
        padding: isActive ? '11px' : '12px',
      }}
      id={`thumbnail-${displaySetInstanceUID}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex="0"
      data-cy={`study-browser-thumbnail-no-image`}
    >
      <div ref={drag}>
        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-1 flex-row items-center">
            <Icon
              name="list-bullets"
              className={classnames(
                'w-12',
                isHydratedForDerivedDisplaySet ? 'text-primary-light' : 'text-secondary-light'
              )}
            />
            <Tooltip
              position="bottom"
              content={<Typography>{modalityTooltip}</Typography>}
            >
              <div
                className={classnames(
                  'rounded-sm px-3  text-lg',
                  isHydratedForDerivedDisplaySet
                    ? 'bg-primary-light text-black'
                    : 'bg-primary-main text-white'
                )}
              >
                {modality}
              </div>
            </Tooltip>
            <span className="ml-4 text-base text-blue-300">{seriesDate}</span>
            <DisplaySetMessageListTooltip
              messages={messages}
              id={`display-set-tooltip-${displaySetInstanceUID}`}
            />
          </div>
          <div className="flex flex-row">
            {canReject && (
              <Icon
                name="old-trash"
                style={{ minWidth: '12px' }}
                className="ml-4 w-3 text-red-500"
                onClick={onReject}
              />
            )}
            <div className="ml-4 break-all text-base text-white">{description}</div>
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
  description: PropTypes.string,
  modality: PropTypes.string.isRequired,
  /* Tooltip message to display when modality text is hovered */
  modalityTooltip: PropTypes.string.isRequired,
  seriesDate: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  messages: PropTypes.object,
  isActive: PropTypes.bool.isRequired,
  isHydratedForDerivedDisplaySet: PropTypes.bool,
};

export default ThumbnailNoImage;
