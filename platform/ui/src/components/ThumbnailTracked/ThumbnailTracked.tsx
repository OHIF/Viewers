import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';
import Thumbnail from '../Thumbnail';
import Tooltip from '../Tooltip';
import { StringNumber } from '../../types';
import { useTranslation } from 'react-i18next';

// Todo: This class to me feels like it belongs in an extension, not in platform/ui
// because it is dealing with mode specific components/information
function ThumbnailTracked({
  displaySetInstanceUID,
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  countIcon,
  messages,
  dragData,
  onClick,
  onDoubleClick,
  onClickUntrack,
  isTracked,
  isActive,
}) {
  const { t } = useTranslation('ThumbnailTracked');
  const trackedIcon = isTracked ? 'circled-checkmark' : 'dotted-circle';

  return (
    <div
      className={classnames('flex flex-1 cursor-pointer flex-row px-3 outline-none', className)}
      id={`thumbnail-${displaySetInstanceUID}`}
    >
      <div className="flex-2 flex flex-col items-center">
        <div
          className={classnames(
            'relative mb-2 flex cursor-pointer flex-col items-center justify-start p-2',
            isTracked && 'rounded-sm hover:bg-gray-900'
          )}
        >
          <Tooltip
            position="right"
            content={
              <div className="flex flex-1 flex-row">
                <div className="flex-2 flex items-center justify-center pr-4">
                  <Icon
                    name="info-link"
                    className="text-primary-active"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span>
                    <span className="text-white">
                      {isTracked ? t('Series is tracked') : t('Series is untracked')}
                    </span>
                  </span>
                </div>
              </div>
            }
          >
            <Icon
              name={trackedIcon}
              className="text-primary-light mb-2 w-4"
            />
          </Tooltip>
        </div>
        {isTracked && (
          <div onClick={onClickUntrack}>
            <Icon
              name="cancel"
              className="text-primary-active w-4"
            />
          </div>
        )}
      </div>
      <Thumbnail
        displaySetInstanceUID={displaySetInstanceUID}
        imageSrc={imageSrc}
        imageAltText={imageAltText}
        dragData={dragData}
        description={description}
        seriesNumber={seriesNumber}
        messages={messages}
        numInstances={numInstances}
        countIcon={countIcon}
        isActive={isActive}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}

ThumbnailTracked.propTypes = {
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
  displaySetInstanceUID: PropTypes.string.isRequired,
  className: PropTypes.string,
  imageSrc: PropTypes.string,
  imageAltText: PropTypes.string,
  description: PropTypes.string.isRequired,
  seriesNumber: StringNumber.isRequired,
  numInstances: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  onClickUntrack: PropTypes.func.isRequired,
  isTracked: PropTypes.bool,
  messages: PropTypes.object,
  isActive: PropTypes.bool.isRequired,
};

export default ThumbnailTracked;
