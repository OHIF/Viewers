import React from 'react';
import PropTypes from 'prop-types';
import { XNATStudyItem } from './XNATStudyItem';
import './XNATStudyBrowser.styl';

function XNATStudyBrowser(props) {
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
            return (
              <XNATStudyItem
                key={studyIndex}
                study={study}
                studyIndex={studyIndex}
                onThumbnailClick={onThumbnailClick}
                onThumbnailDoubleClick={onThumbnailDoubleClick}
                supportsDrag={supportsDrag}
              />
            );
          })
          .flat()}
      </div>
    </div>
  );
}

const noop = () => {};

XNATStudyBrowser.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      StudyInstanceUID: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUID: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          InstanceNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          numImageFrames: PropTypes.number,
          SeriesDescription: PropTypes.string,
          SeriesNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

XNATStudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
};

export { XNATStudyBrowser };
