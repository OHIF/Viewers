import React from 'react';
import { PropTypes } from 'prop-types';
import moment from 'moment';

import { StudyItem } from '@ohif/ui';

import { getStudyData } from './utils';

function AllStudies({ studies }) {
  return (
    <div className="ViewingStudies">
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

AllStudies.propTypes;

export { AllStudies };
