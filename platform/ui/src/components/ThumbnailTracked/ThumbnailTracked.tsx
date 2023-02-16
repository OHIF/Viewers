import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, Thumbnail, Tooltip } from '../';
import { StringNumber } from '../../types';

const ThumbnailTracked = ({
  displaySetInstanceUID,
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  countIcon,
  dragData,
  onClick,
  onDoubleClick,
  onClickUntrack,
  viewportIdentificator,
  isTracked,
  isActive,
}) => {
  const trackedIcon = isTracked ? 'circled-checkmark' : 'dotted-circle';
  const viewportIdentificatorLabel = viewportIdentificator.join(', ');
  const renderViewportLabels = () => {
    const MAX_LABELS_PER_COL = 3;
    const shouldShowStack = viewportIdentificator.length > MAX_LABELS_PER_COL;
    if (shouldShowStack) {
      return (
        <div>
          <div>
            {viewportIdentificator.slice(0, MAX_LABELS_PER_COL).map(label => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <Tooltip
            position="right"
            content={
              <div className="text-left max-w-40">
                Series is displayed <br /> in viewport{' '}
                {viewportIdentificatorLabel}
              </div>
            }
          >
            <Icon name="tool-more-menu" className="text-white py-2" />
          </Tooltip>
        </div>
      );
    }

    return viewportIdentificator.map(label => <div key={label}>{label}</div>);
  };

  return (
    <div
      className={classnames(
        'flex flex-row flex-1 px-3 py-2 cursor-pointer outline-none',
        className
      )}
      id={`thumbnail-${displaySetInstanceUID}`}
    >
      <div className="flex flex-col items-center flex-2">
        <div
          className={classnames(
            'flex flex-col items-center justify-start p-2 mb-2 relative cursor-pointer',
            isTracked && 'rounded-sm hover:bg-gray-900'
          )}
        >
          <Tooltip
            position="right"
            content={
              <div className="flex flex-row flex-1">
                <div className="flex items-center justify-center pr-4 flex-2">
                  <Icon name="info-link" className="text-primary-active" />
                </div>
                <div className="flex flex-col flex-1">
                  <span>
                    Series is
                    <span className="text-white">
                      {isTracked ? ' tracked' : ' untracked'}
                    </span>
                  </span>
                  {!!viewportIdentificator.length && (
                    <span>
                      in viewport
                      <span className="ml-1 text-white">
                        {viewportIdentificatorLabel}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            }
          >
            <Icon name={trackedIcon} className="w-4 mb-2 text-primary-light" />
          </Tooltip>

          <div
            className="text-xl leading-tight text-white text-center"
            data-cy={'thumbnail-viewport-labels'}
          >
            {renderViewportLabels()}
          </div>
        </div>
        {isTracked && (
          <div onClick={onClickUntrack}>
            <Icon name="cancel" className="w-4 text-primary-active" />
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
        numInstances={numInstances}
        countIcon={countIcon}
        isActive={isActive}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
};

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
  viewportIdentificator: PropTypes.array,
  isTracked: PropTypes.bool,
  isActive: PropTypes.bool.isRequired,
};

export default ThumbnailTracked;
