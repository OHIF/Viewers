import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@ohif/ui';

const Thumbnail = ({
  seriesDescription,
  seriesNumber,
  instanceNumber,
  viewportIdentificator,
  isTracked,
  isActive,
  onClick,
}) => {
  const trackedIcon = isTracked ? 'circled-checkmark' : 'dotted-circle';

  return (
    <div
      className="flex flex-row flex-1 px-4 py-2 showExcludeButtonOnHover cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col flex-2 px-2 items-center">
        <div
          className={classnames(
            'flex flex-col items-center justify-start p-2 mb-2 relative cursor-pointer',
            isTracked && 'rounded-sm hover:bg-gray-900 showTooltipOnHover'
          )}
        >
          <Icon name={trackedIcon} className="text-primary-light mb-2 w-5" />
          <div className="text-white text-xl leading-tight h-5">
            {viewportIdentificator}
          </div>
          <div
            className={classnames(
              'tooltip tooltip-right absolute bg-black border border-secondary-main text-common-light text-base rounded py-2 px-4 top-0 w-max-content hidden'
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
          <Icon name="cancel" className="text-primary-active excludeButton" />
        )}
      </div>
      <div className="flex flex-col flex-1 px-4">
        <div
          className={classnames(
            'flex flex-1 items-center justify-center rounded-md bg-black text-white mb-2',
            isActive
              ? 'border-2 border-primary-light'
              : 'border border-secondary-light hover:border-blue-300'
          )}
          style={{ minHeight: '120px' }}
        >
          {'Thumbnail img'}
        </div>
        <div className="flex flex-row flex-1 text-blue-300 text-base">
          <div className="mr-4">
            <span className="text-primary-main font-bold">{'S: '}</span>
            {seriesNumber}
          </div>
          <div className="flex flex-row items-centerflex-1">
            <Icon name="group-layers" className="w-3 mr-2" /> {instanceNumber}
          </div>
        </div>
        <div className="text-white text-base">{seriesDescription}</div>
      </div>
    </div>
  );
};

Thumbnail.propTypes = {
  seriesDescription: PropTypes.string.isRequired,
  seriesNumber: PropTypes.number.isRequired,
  instanceNumber: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  isTracked: PropTypes.bool,
  viewportIdentificator: PropTypes.string,
};

export default Thumbnail;
