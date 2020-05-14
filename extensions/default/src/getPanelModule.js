import React from 'react';
import { StudyBrowser } from '@ohif/ui';

import { useViewModel, displaySetManager } from '@ohif/core';

function displaySetsToStudyPanelInfo(
  displaySets,
  viewportData = [],
  seriesTracking = {}
) {
  console.log(displaySets);

  const studies = {};
  displaySets.forEach(displaySet => {
    const displaySetViewportData = viewportData.find(
      a => a.displaySetInstanceUid === displaySet.displaySetInstanceUid
    );

    if (displaySetViewportData) {
      displaySet.viewportIdentificator = displaySetViewportData.identifier;
    }

    const trackingInfo = seriesTracking[displaySet.SeriesInstanceUID];
    if (trackingInfo) {
      displaySet.viewportIdentificator = trackingInfo.isTracked;

      displaySet.componentType = trackingInfo.isTracked
        ? 'thumbnailTracked'
        : 'thumbnail';
    }

    if (!Object.keys(studies).includes(displaySet.StudyInstanceUID)) {
      studies[displaySet.StudyInstanceUID] = {
        date: displaySet.SeriesDate,
        description: displaySet.SeriesDescription,
        seriesNumber: displaySet.SeriesNumber,
        modalities: displaySet.modalities,
        displaySets: [],
        numInstances: 0,
      };
    }

    studies[displaySet.StudyInstanceUID].displaySets.push(displaySet);
    studies[displaySet.StudyInstanceUID].numInstances +=
      displaySet.numImageFrames;
  });

  const allStudies = Object.keys(studies).map(StudyInstanceUID => {
    const study = studies[StudyInstanceUID];
    return {
      studyInstanceUid: StudyInstanceUID,
      ...study,
    };
  });

  const primary = allStudies.find(study => {
    return true; // TODO: check study.StudyInstanceUID matches queryparam?
  });

  console.log(primary);

  const recentStudies = allStudies.filter(study => {
    return true; // TODO: check study.date
  });

  /*const primary = {
    studyInstanceUid: '1',
    date: '07-Sept-2010',
    description: 'CHEST/ABD/PELVIS W/CONTRAST',
    numInstances: 902,
    modalities: 'CT,SR',
    displaySets: [
      {
        displaySetInstanceUid: 'f69f6asdasd48c-223e-db7f-c4af-b8906641a66e',
        description: 'Multiple line image series description lorem sit',
        seriesNumber: 1,
        numInstances: 68,
        componentType: 'thumbnailTracked',
        viewportIdentificator: 'A',
        isTracked: true,
      },
    ],
  };*/

  const tabs = [
    {
      name: 'primary',
      label: 'Primary',
      studies: [primary],
    },
    {
      name: 'recent',
      label: 'Recent',
      studies: recentStudies,
    },
    {
      name: 'all',
      label: 'All',
      studies: allStudies,
    },
  ];

  return tabs;
}

function StudyBrowserPanel({}) {
  const viewModel = useViewModel();

  // TODO
  const viewportData = []; //useViewportGrid();
  const seriesTracking = {}; //useSeriesTracking();

  console.log(viewModel);

  const displaySets = viewModel.displaySetInstanceUids.map(
    displaySetManager.getDisplaySetByUID
  );

  let tabs;

  if (displaySets.length) {
    tabs = displaySetsToStudyPanelInfo(
      displaySets,
      viewportData,
      seriesTracking
    );
  } else {
    tabs = [
      {
        name: 'primary',
        label: 'Primary',
        studies: [],
      },
      {
        name: 'recent',
        label: 'Recent',
        studies: [],
      },
      {
        name: 'all',
        label: 'All',
        studies: [],
      },
    ];
  }

  return <StudyBrowser tabs={tabs} />;
}

function getPanelModule() {
  return [
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: StudyBrowserPanel,
    },
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: StudyBrowserPanel,
    },
  ];
}

export default getPanelModule;
