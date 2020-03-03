import React, { useState } from 'react';

import { RoundedButtonGroup } from '@ohif/ui';

import mockData from './mockData.js';
import { AllStudies } from './AllStudies.js';
import { ViewingStudies } from './ViewingStudies.js';
import { findStudy, filterStudies } from './utils';

import './LTStudyBrowser.styl';

const tabs = [
  {
    name: 'Viewing',
    Component: ViewingStudies,
    getProps: ({ currentStudyUid, comparisonStudyUid, studies }) => ({
      currentStudy: findStudy(studies, currentStudyUid),
      comparisonStudy: findStudy(studies, comparisonStudyUid),
      onStudyClick: () => {},
      onSeriesClick: () => {},
      onSeriesDoubleClick: () => {},
    }),
  },
  {
    name: 'All Studies',
    Component: AllStudies,
    getProps: ({ currentStudyUid, comparisonStudyUid, studies }) => ({
      studies: filterStudies(studies, [currentStudyUid, comparisonStudyUid]),
      onStudyClick: () => {},
      onSeriesClick: () => {},
      onSeriesDoubleClick: () => {},
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

function LTStudyBrowser() {
  const [currentTab, setCurrentTab] = useState('0');

  const { Component, getProps } = tabs[currentTab];
  const componentProps = getProps(mockData);

  const handleValueChanged = value => {
    if (value) {
      setCurrentTab(value);
    }
  };

  return (
    <div className="LTStudyBrowser">
      <div className="tabButtons">
        <RoundedButtonGroup
          value={currentTab}
          options={getRoundedButtonsData(tabs)}
          onValueChanged={handleValueChanged}
        />
      </div>
      <div className="tabContents">
        <Component {...componentProps} />
      </div>
    </div>
  );
}

export { LTStudyBrowser };
