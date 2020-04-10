import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailSR } from '@ohif/ui';

const ThumbnailList = ({ thumbnails }) => {
  return (
    <React.Fragment>
      {thumbnails.map(
        ({
          imageId,
          displaySetInstanceUid,
          seriesDescription,
          seriesNumber,
          instanceNumber,
          numImageFrames,
          modality,
          seriesDate,
          viewportIdentificator,
          isTracked,
        }) => {
          const isSR = modality && modality.toLowerCase() === 'sr';

          if (isSR) {
            return (
              <ThumbnailSR
                key={displaySetInstanceUid}
                modality={modality}
                seriesDate={seriesDate}
                seriesDescription={seriesDescription}
              />
            );
          } else {
            return (
              <Thumbnail
                key={displaySetInstanceUid}
                imageId={imageId}
                displaySetInstanceUid={displaySetInstanceUid}
                seriesDescription={seriesDescription}
                seriesNumber={seriesNumber}
                instanceNumber={instanceNumber}
                numImageFrames={numImageFrames}
                viewportIdentificator={viewportIdentificator}
                isTracked={isTracked}
              />
            );
          }
        }
      )}
    </React.Fragment>
  );
};

ThumbnailList.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      imageId: PropTypes.string,
      displaySetInstanceUid: PropTypes.string,
      seriesDescription: PropTypes.string,
      seriesNumber: PropTypes.number,
      instanceNumber: PropTypes.number,
      numImageFrames: PropTypes.number,
      modality: PropTypes.string,
      seriesDate: PropTypes.string,
    })
  ),
};

export default ThumbnailList;
