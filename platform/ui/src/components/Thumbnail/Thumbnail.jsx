import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@ohif/ui';

const Thumbnail = ({
  seriesDescription,
  seriesNumber,
  instanceNumber,
  viewportIdentificator = 'A',
  isTracked = true,
}) => {
  const trackedIcon = isTracked ? 'circled-checkmark' : 'dotted-circle';

  return (
    <div className="flex flex-row flex-1 px-4 py-5">
      <div className="flex flex-col flex-2 px-2 items-center">
        <div
          className={classnames(
            'flex flex-col items-center justify-center mb-2',
            isTracked && 'rounded-sm hover:bg-gray-900'
          )}
        >
          <Icon
            name={trackedIcon}
            className="text-primary-light mb-2"
            style={{ width: '19px' }}
          />
          <span className="text-white text-xl leading-tight">
            {viewportIdentificator}
          </span>
        </div>
        {isTracked && <Icon name="cancel" className="text-primary-active" />}
      </div>
      <div className="flex flex-col flex-1 px-4">
        <div
          className="flex flex-1 items-center justify-center border rounded-md border-secondary-light bg-black text-white"
          style={{ minHeight: '120px' }}
        >
          {'Thumbnail img'}
        </div>
        <div className="flex flex-row flex-1">
          <div>
            <span className="text-primary-main font-bold">{'S: '}</span>
            {seriesNumber}
          </div>
          <div>
            <Icon name="group-layers" /> {instanceNumber}
          </div>
        </div>
        <div>{seriesDescription}</div>
      </div>
    </div>
  );
};

Thumbnail.propTypes = {
  seriesDescription: PropTypes.string,
  seriesNumber: PropTypes.number,
  instanceNumber: PropTypes.number,
  viewportIdentificator: PropTypes.bool,
  isTracked: PropTypes.bool,
};

export default Thumbnail;
