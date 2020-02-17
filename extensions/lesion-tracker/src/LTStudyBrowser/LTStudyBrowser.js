import React, { useState } from 'react';

import { RoundedButtonGroup } from '@ohif/ui';

import mockData from './mockData.js';
import { AllStudies } from './AllStudies.js';
import { ViewingStudies } from './ViewingStudies.js';

import './LTStudyBrowser.styl';

const findStudy = (studies, studyInstanceUid) => {
  return studies.find(study => study.studyInstanceUid === studyInstanceUid);
};

const filterStudies = (studies, filteredStudiesUids = []) => {
  return studies.filter(
    study => !filteredStudiesUids.includes(study.studyInstanceUid)
  );
};

const tabs = [
  {
    name: 'Viewing',
    Component: ViewingStudies,
    getProps: ({ currentStudyUid, comparisonStudyUid, studies }) => ({
      currentStudy: findStudy(studies, currentStudyUid),
      comparisonStudy: findStudy(studies, comparisonStudyUid),
    }),
  },
  {
    name: 'All Studies',
    Component: AllStudies,
    getProps: ({ currentStudyUid, comparisonStudyUid, studies }) => ({
      studies: filterStudies(studies, [currentStudyUid, comparisonStudyUid]),
    }),
  },
];

const getRoundedButtonsData = tabs => {
  return tabs.map((tabData, index) => {
    return {
      value: `${index}`,
      label: tabData.name,
    };
  });
};

function LTStudyBrowser({}) {
  const [currentTab, setCurrentTab] = useState('0');

  const { Component, getProps } = tabs[currentTab];
  const componentProps = getProps(mockData);

  return (
    <div className="LTStudyBrowser">
      <div className="tabButtons">
        <RoundedButtonGroup
          value={currentTab}
          options={getRoundedButtonsData(tabs)}
          onValueChanged={value => setCurrentTab(value)}
        />
      </div>
      <div>
        <Component {...componentProps} />
      </div>
    </div>
  );
}

export { LTStudyBrowser };
