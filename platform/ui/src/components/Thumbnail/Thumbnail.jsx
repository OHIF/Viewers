import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@ohif/ui';

const Thumbnail = ({
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  isActive,
  onClick,
}) => {
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
            className="h-32"
            style={{ 'object-fit': 'cover', height: '7.9rem' }}
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
  imageAltText: PropTypes.string,
  description: PropTypes.string.isRequired,
  seriesNumber: PropTypes.number.isRequired,
  numInstances: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Thumbnail;
