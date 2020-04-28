import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailNoImage, ThumbnailTracked } from '@ohif/ui';

const ThumbnailList = ({ thumbnails, thumbnailActive, onThumbnailClick }) => {
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
          imageSrc,
        }) => {
          const isActive = thumbnailActive === displaySetInstanceUid;

          switch (componentType) {
            case 'thumbnail':
              return (
                <Thumbnail
                  key={displaySetInstanceUid}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  isActive={isActive}
                  imageSrc={imageSrc}
                  onClick={() => onThumbnailClick(displaySetInstanceUid)}
                />
              );
            case 'thumbnailNoImage':
              return (
                <ThumbnailNoImage
                  key={displaySetInstanceUid}
                  modality={modality}
                  seriesDate={seriesDate}
                  description={description}
                  onClick={() => onThumbnailClick(displaySetInstanceUid)}
                />
              );
            case 'thumbnailTracked':
              return (
                <ThumbnailTracked
                  key={displaySetInstanceUid}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  viewportIdentificator={viewportIdentificator}
                  isTracked={isTracked}
                  isActive={isActive}
                  onClick={() => onThumbnailClick(displaySetInstanceUid)}
                  imageSrc={imageSrc}
                />
              );
            default:
              console.error('unexpected type', componentType);
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
    })
  ),
  thumbnailActive: PropTypes.string,
  onThumbnailClick: PropTypes.func,
};

export default ThumbnailList;
