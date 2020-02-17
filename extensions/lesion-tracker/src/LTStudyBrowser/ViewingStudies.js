import React, { useState } from 'react';
import { PropTypes } from 'prop-types';

import { StudyItem } from '@ohif/ui';
import { ThumbnailsList } from './ThumbnailsList';
import { getStudyData } from './utils';

import './ViewingStudies.styl';

function ViewingStudies({ currentStudy, comparisonStudy }) {
  const [activeStudyUid, setActiveStudyUid] = useState('');

  return (
    <div className="ViewingStudies">
      <div className="CurrentStudyWrapper">
        <div className="studyWrapperHeader">Current</div>
        <StudyItem
          onClick={() => {
            setActiveStudyUid(currentStudy.studyInstanceUid);
          }}
          studyData={getStudyData(currentStudy)}
          active={activeStudyUid === currentStudy.studyInstanceUid}
        />
        {activeStudyUid === currentStudy.studyInstanceUid && (
          <ThumbnailsList
            onThumbnailClick={() => {}}
            onThumbnailDoubleClick={() => {}}
            studies={[currentStudy]}
          />
        )}
      </div>
      <div className="ComparisonStudyWrapper">
        <div className="studyWrapperHeader">Comparison</div>
        <StudyItem
          onClick={() => {
            setActiveStudyUid(comparisonStudy.studyInstanceUid);
          }}
          studyData={getStudyData(comparisonStudy)}
          active={activeStudyUid === comparisonStudy.studyInstanceUid}
        />
        {activeStudyUid === comparisonStudy.studyInstanceUid && (
          <ThumbnailsList
            onThumbnailClick={() => {}}
            onThumbnailDoubleClick={() => {}}
            studies={[comparisonStudy]}
          />
        )}
      </div>
    </div>
  );
}

ViewingStudies.propTypes = {
  currentStudy: PropTypes.object,
  comparisonStudy: PropTypes.object,
};

export { ViewingStudies };
