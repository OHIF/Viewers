import React from 'react';
import { PropTypes } from 'prop-types';

import { StudyItem } from '@ohif/ui';
import { getStudyData } from './utils';

function AllStudies({ studies }) {
  return (
    <div className="AllStudies" style={{ 'magin-bottom': '10px' }}>
      {studies.map((study, index) => (
        <StudyItem
          key={index}
          studyData={getStudyData(study)}
          onClick={() => {}}
          active={false}
        />
      ))}
    </div>
  );
}

AllStudies.propTypes = {
  studies: PropTypes.array,
};

export { AllStudies };
