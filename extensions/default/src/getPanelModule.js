import React, { useState, useEffect, useCallback } from 'react';
import { StudyBrowser } from '@ohif/ui';

import {
  dicomMetadataStore,
  useViewModel,
  displaySetManager,
} from '@ohif/core';

function StudyBrowserPanel({ extensionManager }) {
  // TODO: need to check how this is intended to be passed in
  const dataSource = extensionManager.dataSourceMap.dicomweb[0];

  const viewModel = useViewModel();

  // TODO
  const viewportData = []; //useViewportGrid();
  const seriesTracking = {}; //useSeriesTracking();

  const [studyData, setStudyData] = useState([]);

  console.log(viewModel);

  const displaySets = viewModel.displaySetInstanceUids.map(
    displaySetManager.getDisplaySetByUID
  );

  console.log(displaySets);

  if (!displaySets.length) {
    return;
  }

  // TODO:
  // - Put this in something so it only runs once
  // - Have update the query update the dicom data store at the study level and then have this component use the data in the view model
  useEffect(() => {
    const dSets = viewModel.displaySetInstanceUids.map(
      displaySetManager.getDisplaySetByUID
    );
    const aDisplaySet = dSets[0];
    const firstStudy = dicomMetadataStore.getStudy(
      aDisplaySet.StudyInstanceUID
    );
    const firstInstance = firstStudy.series[0].instances[0];
    const PatientID = firstInstance.PatientID;

    dataSource.query.studies.search({ patientId: PatientID }).then(results => {
      const studies = results.map(study => {
        // TODO: Why does the data source return in this format?
        return {
          AccessionNumber: study.accession,
          StudyDate: study.date,
          StudyDescription: study.description,
          NumInstances: study.instances,
          ModalitiesInStudy: study.modalities,
          PatientID: study.mrn,
          PatientName: study.patientName,
          StudyInstanceUID: study.studyInstanceUid,
          StudyTime: study.time,
        };
      });

      setStudyData(studies);
    });
  }, [viewModel.displaySetInstanceUids]);

  const studiesFromInstanceData = {};
  displaySets.forEach(ds => {
    const displaySet = {
      displaySetInstanceUid: ds.displaySetInstanceUid,
      description: ds.SeriesDescription,
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      date: ds.SeriesDate,
      numInstances: ds.numImageFrames,
    };

    const displaySetViewportData = viewportData.find(
      a => a.displaySetInstanceUid === ds.displaySetInstanceUid
    );

    if (displaySetViewportData) {
      displaySet.viewportIdentificator = displaySetViewportData.identifier;
    }

    const trackingInfo = seriesTracking[ds.SeriesInstanceUID];
    if (trackingInfo) {
      displaySet.isTracked = trackingInfo.isTracked;

      displaySet.componentType = trackingInfo.isTracked
        ? 'thumbnailTracked'
        : 'thumbnail';
    } else {
      displaySet.isTracked = false;
      displaySet.componentType = 'thumbnail';
    }

    if (!Object.keys(studiesFromInstanceData).includes(ds.StudyInstanceUID)) {
      const study = dicomMetadataStore.getStudy(ds.StudyInstanceUID);
      const anInstance = study.series[0].instances[0];

      studiesFromInstanceData[ds.StudyInstanceUID] = {
        date: anInstance.StudyDate, // TODO: Format this date to DD-MMM-YYYY
        description: anInstance.StudyDescription,
        displaySets: [],
        numInstances: 0,
        modalitiesSet: new Set(),
      };
    }

    studiesFromInstanceData[ds.StudyInstanceUID].displaySets.push(displaySet);
    studiesFromInstanceData[ds.StudyInstanceUID].numInstances +=
      displaySet.numInstances;

    studiesFromInstanceData[ds.StudyInstanceUID].modalitiesSet.add(
      displaySet.modality
    );

    const modalitiesSet =
      studiesFromInstanceData[ds.StudyInstanceUID].modalitiesSet;
    studiesFromInstanceData[ds.StudyInstanceUID].modalities = Array.from(
      modalitiesSet
    ).join(', ');
  });

  // QIDO for all by MRN
  const allStudies = studyData.map(studyLevelData => {
    const studyFromInstanceData =
      studiesFromInstanceData[studyLevelData.StudyInstanceUID];

    if (!studyFromInstanceData) {
      return {
        studyInstanceUid: studyLevelData.StudyInstanceUID,
        date: studyLevelData.StudyDate,
        description: studyLevelData.StudyDescription,
        modalities: studyLevelData.ModalitiesInStudy,
        numInstances: studyLevelData.NumInstances,
        displaySets: [],
      };
    }

    return {
      studyInstanceUid: studyLevelData.StudyInstanceUID,
      date: studyLevelData.StudyDate || studyFromInstanceData.date,
      description:
        studyLevelData.StudyDescription || studyFromInstanceData.description,
      modalities:
        studyFromInstanceData.modalities || studyLevelData.ModalitiesInStudy,
      numInstances:
        studyLevelData.NumInstances || studyFromInstanceData.numInstances,
      displaySets: studyFromInstanceData.displaySets,
    };
  });

  const primary = allStudies.find(study => {
    return true; // TODO: check study.StudyInstanceUID matches queryparam?
  });

  // TODO: Filter allStudies to dates within one year of current date
  const recentStudies = allStudies.filter(study => {
    return true; // TODO: check study.date
  });

  const tabs = [
    {
      name: 'primary',
      label: 'Primary',
      studies: primary ? [primary] : [],
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

  function onClickStudy(StudyInstanceUID) {
    if (studiesFromInstanceData[StudyInstanceUID]) {
      return;
    }

    console.warn(`onClickStudy: ${StudyInstanceUID}`);
    // TODO: This is weird, why can't the data source just be used as
    // as function that doesn't expect a query string?
    const queryParams = `?StudyInstanceUIDs=${StudyInstanceUID}`;

    dataSource.retrieve.series.metadata(
      queryParams,
      displaySetManager.makeDisplaySets
    );
  }

  const memoOnClickStudy = useCallback(StudyInstanceUID => {
    onClickStudy(StudyInstanceUID);
  });

  return <StudyBrowser tabs={tabs} onClickStudy={memoOnClickStudy} />;
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
