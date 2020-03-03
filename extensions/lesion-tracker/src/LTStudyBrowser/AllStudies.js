import React, { useState } from 'react';
import { PropTypes } from 'prop-types';

import { StudyItem } from '@ohif/ui';
import { getStudyData } from './utils';

import { ThumbnailsList } from './ThumbnailsList';

function AllStudies({
  studies,
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
    <div className="AllStudies">
      {studies.map((study, index) => {
        return (
          <React.Fragment key={index}>
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
      })}
    </div>
  );
}

AllStudies.propTypes = {
  studies: PropTypes.array,
  onStudyClick: PropTypes.func,
  onSeriesClick: PropTypes.func,
  onSeriesDoubleClick: PropTypes.func,
};

export { AllStudies };
