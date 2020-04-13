import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailSR } from '@ohif/ui';

const ThumbnailList = ({ thumbnails }) => {
  const [thumbnailActive, setThumbnailActive] = useState(null);

  return (
    <div className="bg-black py-3">
      {thumbnails.map(
        ({
          displaySetInstanceUid,
          seriesDescription,
          seriesNumber,
          instanceNumber,
          modality,
          seriesDate,
          viewportIdentificator,
          isTracked,
        }) => {
          const isSR = modality && modality.toLowerCase() === 'sr';
          const isActive = thumbnailActive === displaySetInstanceUid;

          if (isSR) {
            return (
              <ThumbnailSR
                key={displaySetInstanceUid}
                modality={modality}
                seriesDate={seriesDate}
                seriesDescription={seriesDescription}
                onClick={() => {}}
              />
            );
          } else {
            return (
              <Thumbnail
                key={displaySetInstanceUid}
                seriesDescription={seriesDescription}
                seriesNumber={seriesNumber}
                instanceNumber={instanceNumber}
                viewportIdentificator={viewportIdentificator}
                isTracked={isTracked}
                isActive={isActive}
                onClick={() => {
                  setThumbnailActive(
                    thumbnailActive === displaySetInstanceUid
                      ? null
                      : displaySetInstanceUid
                  );
                }}
              />
            );
          }
        }
      )}
    </div>
  );
};

ThumbnailList.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      displaySetInstanceUid: PropTypes.string,
      seriesDescription: PropTypes.string,
      seriesNumber: PropTypes.number,
      instanceNumber: PropTypes.number,
      modality: PropTypes.string,
      seriesDate: PropTypes.string,
    })
  ),
};

export default ThumbnailList;
