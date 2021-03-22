import React from 'react';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import './StudyBrowser.styl';

function StudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
  } = props;

  return (
    <div className="study-browser">
      <div className="scrollable-study-thumbnails">
        {studies
          .map((study, studyIndex) => {
            const { StudyInstanceUID } = study;
            return study.thumbnails.map((thumb, thumbIndex) => {
              // TODO: Thumb has more props than we care about?
              const {
                altImageText,
                displaySetInstanceUID,
                imageId,
                InstanceNumber,
                numImageFrames,
                SeriesDescription,
                SeriesNumber,
                stackPercentComplete,
                hasWarnings,
              } = thumb;

              return (
                <div
                  key={thumb.displaySetInstanceUID}
                  className="thumbnail-container"
                  data-cy="thumbnail-list"
                >
                  <Thumbnail
                    supportsDrag={supportsDrag}
                    key={`${studyIndex}_${thumbIndex}`}
                    id={`${studyIndex}_${thumbIndex}`} // Unused?
                    // Study
                    StudyInstanceUID={StudyInstanceUID} // used by drop
                    // Thumb
                    altImageText={altImageText}
                    imageId={imageId}
                    InstanceNumber={InstanceNumber}
                    displaySetInstanceUID={displaySetInstanceUID} // used by drop
                    numImageFrames={numImageFrames}
                    SeriesDescription={SeriesDescription}
                    SeriesNumber={SeriesNumber}
                    hasWarnings={hasWarnings}
                    stackPercentComplete={stackPercentComplete}
                    // Events
                    onClick={onThumbnailClick.bind(
                      undefined,
                      displaySetInstanceUID
                    )}
                    onDoubleClick={onThumbnailDoubleClick}
                  />
                </div>
              );
            });
          })
          .flat()}
      </div>
    </div>
  );
}

const noop = () => {};

StudyBrowser.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      StudyInstanceUID: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUID: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          InstanceNumber: PropTypes.number,
          numImageFrames: PropTypes.number,
          SeriesDescription: PropTypes.string,
          SeriesNumber: PropTypes.number,
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

StudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
};

export { StudyBrowser };
