import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail } from '@ohif/ui';

function ThumbnailsList({
  studies,
  onThumbnailClick,
  onThumbnailDoubleClick,
  supportsDrag,
}) {
  return (
    <React.Fragment>
      {studies
        .map((study, studyIndex) => {
          const { studyInstanceUid } = study;
          return study.thumbnails.map((thumb, thumbIndex) => {
            return (
              <div
                key={thumb.displaySetInstanceUid}
                className="thumbnail-container"
                data-cy="thumbnail-list"
              >
                <Thumbnail
                  supportsDrag={supportsDrag}
                  key={`${studyIndex}_${thumbIndex}`}
                  id={`${studyIndex}_${thumbIndex}`}
                  studyInstanceUid={studyInstanceUid}
                  {...thumb}
                  onClick={onThumbnailClick.bind(
                    undefined,
                    thumb.displaySetInstanceUid
                  )}
                  onDoubleClick={onThumbnailDoubleClick}
                />
              </div>
            );
          });
        })
        .flat()}
    </React.Fragment>
  );
}

ThumbnailsList.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      studyInstanceUid: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUid: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          instanceNumber: PropTypes.number,
          numImageFrames: PropTypes.number,
          seriesDescription: PropTypes.string,
          seriesNumber: PropTypes.number,
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

export { ThumbnailsList };
