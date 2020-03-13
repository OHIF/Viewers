import React from 'react';
import { StudyList } from '@ohif/ui';

// TEMPORARY MOCKING DATA FOR VISUALIZATION PURPOSES
import { utils } from '@ohif/ui';

const ConnectedStudyList = () => {
  const studies = utils.getMockedStudies();
  return <StudyList studies={studies} />;
};

export default ConnectedStudyList;
