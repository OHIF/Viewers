import React, { useState } from 'react';

import { RoundedButtonGroup } from '@ohif/ui';

import mockData from './mockData.js';
import { AllStudies } from './AllStudies.js';
import { ViewingStudies } from './ViewingStudies.js';

import './LTStudyBrowser.styl';

const findStudy = ({ studies, studyInstanceUid }) => {
  return studies.find(study => study.studyInstanceUid === studyInstanceUid);
};

const getKeyStimpointStudies = ({ currentStudy, comparisonStudy, studies }) => {
  return [
    findStudy({ studies, currentStudy }),
    findStudy({ studies, comparisonStudy }),
  ];
};

const tabs = [
  {
    name: 'Viewing',
    Component: ViewingStudies,
    getProps: ({ currentStudy, comparisonStudy, studies }) => ({
      studies: getKeyStimpointStudies({
        currentStudy,
        comparisonStudy,
        studies,
      }),
      currentStudy,
      comparisonStudy,
    }),
  },
  {
    name: 'All Studies',
    Component: AllStudies,
    getProps: ({ studies }) => ({
      studies,
    }),
  },
];

const getRoundedButtonsData = tabs => {
  return tabs.map((tabData, index) => {
    return {
      value: index,
      label: tabData.name,
    };
  });
};

function LTStudyBrowser({}) {
  const [currentTab, setCurrentTab] = useState(0);

  const { Component, getProps } = tabs[currentTab];
  const componentProps = getProps({ ...mockData });

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
