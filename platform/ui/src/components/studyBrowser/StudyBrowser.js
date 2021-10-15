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
    showThumbnailProgressBar,
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
                active,
                altImageText,
                displaySetInstanceUID,
                imageId,
                derivedDisplaySetsNumber,
                numImageFrames,
                SeriesDescription,
                SeriesNumber,
                hasWarnings,
                hasDerivedDisplaySets,
              } = thumb;

              return (
                <div
                  key={thumb.displaySetInstanceUID}
                  className="thumbnail-container"
                  data-cy="thumbnail-list"
                >
                  <Thumbnail
                    active={active}
                    supportsDrag={supportsDrag}
                    key={`${studyIndex}_${thumbIndex}`}
                    id={`${studyIndex}_${thumbIndex}`} // Unused?
                    // Study
                    StudyInstanceUID={StudyInstanceUID} // used by drop
                    // Thumb
                    altImageText={altImageText}
                    imageId={imageId}
                    derivedDisplaySetsNumber={derivedDisplaySetsNumber}
                    displaySetInstanceUID={displaySetInstanceUID} // used by drop
                    numImageFrames={numImageFrames}
                    SeriesDescription={SeriesDescription}
                    SeriesNumber={SeriesNumber}
                    hasWarnings={hasWarnings}
                    hasDerivedDisplaySets={hasDerivedDisplaySets}
                    // Events
                    onClick={onThumbnailClick.bind(
                      undefined,
                      displaySetInstanceUID
                    )}
                    onDoubleClick={onThumbnailDoubleClick}
                    showProgressBar={showThumbnailProgressBar}
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
          derivedDisplaySetsNumber: PropTypes.number,
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
  showThumbnailProgressBar: PropTypes.bool,
};

StudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
  showThumbnailProgressBar: true,
};

export { StudyBrowser };
