import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailNoImage, ThumbnailTracked } from '@ohif/ui';

const ThumbnailList = ({ thumbnails }) => {
  return (
    <div className="bg-black py-3">
      {thumbnails.map(
        ({
          displaySetInstanceUid,
          description,
          seriesNumber,
          numInstances,
          modality,
          componentType,
          seriesDate,
          viewportIdentificator,
          isTracked,
          isActive,
          imageSrc,
          imageAltText,
        }) => {
          switch (componentType) {
            case 'thumbnail':
              return (
                <Thumbnail
                  key={displaySetInstanceUid}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isActive={isActive}
                  onClick={() => {}}
                />
              );
            case 'thumbnailNoImage':
              return (
                <ThumbnailNoImage
                  key={displaySetInstanceUid}
                  modality={modality}
                  seriesDate={seriesDate}
                  description={description}
                  onClick={() => {}}
                />
              );
            case 'thumbnailTracked':
              return (
                <ThumbnailTracked
                  key={displaySetInstanceUid}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isTracked={isTracked}
                  isActive={isActive}
                  onClick={() => {}}
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
      displaySetInstanceUid: PropTypes.string.isRequired,
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
      isActive: PropTypes.bool,
    })
  ),
};

export default ThumbnailList;
