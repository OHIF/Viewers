import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, Thumbnail } from '@ohif/ui';

const ThumbnailTracked = ({
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  onClick,
  viewportIdentificator,
  isTracked,
  isActive,
}) => {
  const trackedIcon = isTracked ? 'circled-checkmark' : 'dotted-circle';

  return (
    <div
      className={classnames(
        'flex flex-row flex-1 px-3 py-2 showExcludeButtonOnHover cursor-pointer outline-none',
        className
      )}
    >
      <div className="flex flex-col flex-2 items-center">
        <div
          className={classnames(
            'flex flex-col items-center justify-start p-2 mb-2 relative cursor-pointer',
            isTracked && 'rounded-sm hover:bg-gray-900 showTooltipOnHover'
          )}
        >
          <Icon name={trackedIcon} className="text-primary-light mb-2 w-4" />
          <div className="text-white text-xl leading-tight h-5">
            {viewportIdentificator}
          </div>
          <div
            className={classnames(
              'tooltip tooltip-right bg-black border border-secondary-main text-common-light text-base rounded py-2 px-4 top-0 w-max-content hidden'
            )}
          >
            <div className="flex flex-row flex-1">
              <div className="flex flex-col flex-1 pr-4">
                <span>
                  Series is <span className="text-white">tracked</span>
                </span>
                {viewportIdentificator && (
                  <span>
                    in viewport
                    <span className="ml-1 text-white">
                      {viewportIdentificator}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex flex-2 items-center justify-center">
                <Icon name="info-link" className="text-primary-active" />
              </div>
            </div>
            <svg
              className="absolute text-black stroke-secondary-main stroke-2"
              style={{
                top: 'calc(50% - 8px)',
                left: -15,
                transform: 'rotate(270deg)',
              }}
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M24 22h-24l12-20z" />
            </svg>
          </div>
        </div>
        {isTracked && (
          <Icon
            name="cancel"
            className="text-primary-active excludeButton w-4"
          />
        )}
      </div>
      <Thumbnail
        imageSrc={imageSrc}
        imageAltText={imageAltText}
        description={description}
        seriesNumber={seriesNumber}
        numInstances={numInstances}
        isActive={isActive}
        onClick={onClick}
      />
    </div>
  );
};

ThumbnailTracked.propTypes = {
  className: PropTypes.string,
  imageSrc: PropTypes.string,
  imageAltText: PropTypes.string,
  description: PropTypes.string.isRequired,
  seriesNumber: PropTypes.number.isRequired,
  numInstances: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  viewportIdentificator: PropTypes.string,
  isTracked: PropTypes.bool,
  isActive: PropTypes.bool.isRequired,
};

export default ThumbnailTracked;
