import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailNoImage, ThumbnailTracked } from '@ohif/ui';

const ThumbnailList = ({ thumbnails, thumbnailActive, onThumbnailClick }) => {
  return (
    <div className="bg-black py-3">
      {thumbnails.map(
        ({
          displaySetInstanceUID,
          description,
          seriesNumber,
          numInstances,
          modality,
          componentType,
          seriesDate,
          viewportIdentificator,
          isTracked,
          imageSrc,
          imageAltText,
        }) => {
          const isActive = thumbnailActive === displaySetInstanceUID;

          switch (componentType) {
            case 'thumbnail':
              return (
                <Thumbnail
                  key={displaySetInstanceUID}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isActive={isActive}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                />
              );
            case 'thumbnailNoImage':
              return (
                <ThumbnailNoImage
                  key={displaySetInstanceUID}
                  modality={modality}
                  seriesDate={seriesDate}
                  description={description}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                />
              );
            case 'thumbnailTracked':
              return (
                <ThumbnailTracked
                  key={displaySetInstanceUID}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isTracked={isTracked}
                  isActive={isActive}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                />
              );
            default:
              return <></>;
          }
        }
      )}
    </div>
  );
};

ThumbnailList.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      displaySetInstanceUID: PropTypes.string.isRequired,
      imageSrc: PropTypes.string,
      imageAltText: PropTypes.string,
      seriesDate: PropTypes.string,
      seriesNumber: PropTypes.number,
      numInstances: PropTypes.number,
      description: PropTypes.string,
      componentType: PropTypes.oneOf([
        'thumbnail',
        'thumbnailTracked',
        'thumbnailNoImage',
      ]).isRequired,
      viewportIdentificator: PropTypes.string,
      isTracked: PropTypes.bool,
    })
  ),
  thumbnailActive: PropTypes.string,
  onThumbnailClick: PropTypes.func,
};

export default ThumbnailList;
