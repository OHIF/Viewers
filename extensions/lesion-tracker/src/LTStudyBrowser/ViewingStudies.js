import React, { useState } from 'react';
import { PropTypes } from 'prop-types';
import moment from 'moment';

import { StudyItem } from '@ohif/ui';

import './ViewingStudies.styl';

const formatDate = date => {
  return moment(date).format('DD-MMM-YY');
};

const getStudyData = study => {
  return {
    studyDate: formatDate(study.studyDate),
    studyDescription: study.studyDescription,
    modalities: study.studyDescription,
    studyAvailable: study.studyAvailable,
  };
};

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
      </div>
    </div>
  );
}

ViewingStudies.propTypes = {
  currentStudy: PropTypes.object,
  comparisonStudy: PropTypes.object,
};

export { ViewingStudies };
