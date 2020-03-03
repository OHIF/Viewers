import React, { useState } from 'react';
import { PropTypes } from 'prop-types';

import { StudyItem } from '@ohif/ui';
import { ThumbnailsList } from './ThumbnailsList';
import { getStudyData } from './utils';

import './ViewingStudies.styl';

function ViewingStudies({
  currentStudy,
  comparisonStudy,
  onStudyClick,
  onSeriesClick,
  onSeriesDoubleClick,
}) {
  const [activeStudyUid, setActiveStudyUid] = useState('');

  const handleStudyClick = study => {
    if (study.studyInstanceUid === activeStudyUid) {
      setActiveStudyUid('');
    } else {
      setActiveStudyUid(study.studyInstanceUid);
    }

    if (onStudyClick) {
      onStudyClick(study);
    }
  };

  const handleThumbnailClick = thumbnail => {
    if (onSeriesClick) {
      onSeriesClick(thumbnail);
    }
  };

  const handleThumbnailDoubleClick = thumbnail => {
    if (onSeriesClick) {
      onSeriesDoubleClick(thumbnail);
    }
  };

  const studyContent = study => {
    return (
      <React.Fragment>
        <StudyItem
          onClick={() => handleStudyClick(study)}
          studyData={getStudyData(study)}
          active={activeStudyUid === study.studyInstanceUid}
        />
        {activeStudyUid === study.studyInstanceUid && (
          <ThumbnailsList
            onThumbnailClick={handleThumbnailClick}
            onThumbnailDoubleClick={handleThumbnailDoubleClick}
            studies={[study]}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="ViewingStudies">
      <div className="CurrentStudyWrapper">
        <div className="studyWrapperHeader">Current</div>
        {studyContent(currentStudy)}
      </div>
      <div className="ComparisonStudyWrapper">
        <div className="studyWrapperHeader">Comparison</div>
        {studyContent(comparisonStudy)}
      </div>
    </div>
  );
}

ViewingStudies.propTypes = {
  currentStudy: PropTypes.object,
  comparisonStudy: PropTypes.object,
  onStudyClick: PropTypes.func,
  onSeriesClick: PropTypes.func,
  onSeriesDoubleClick: PropTypes.func,
};

export { ViewingStudies };
