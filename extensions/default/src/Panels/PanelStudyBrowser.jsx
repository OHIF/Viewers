import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { StudyBrowser } from '@ohif/ui';
import { dicomMetadataStore } from '@ohif/core';
//

function PanelStudyBrowser({ servicesManager, getImageSrc, getStudiesByPatientId, dataSource }) {
  console.warn('StudyBrowserPanel rerender');
  const [activeTabName, setActiveTabName] = useState('primary');

  const { DisplaySetService } = servicesManager.services;

  const _createInitialState = (displaySets) => {
    // If no study data exists yet (i.e. this is initial load):
    // - Use the current DisplaySetService state to create the initial StudyData
    // - Launch a QIDO request for related studies
    const currentDisplaySets = DisplaySetService.activeDisplaySets;
    if (!currentDisplaySets || !currentDisplaySets.length) {
      return;
    }

    const mappedStudiesFromInstances = _getMappedStudiesFromDisplaySets(
      currentDisplaySets
    );

    setStudyData(mappedStudiesFromInstances);

    const displaySet = displaySets[0];
    const study = dicomMetadataStore.getStudy(
      displaySet.StudyInstanceUID
    );
    const instance = study.series[0].instances[0];
    const PatientID = instance.PatientID;
    getStudiesByPatientId(PatientID).then(studiesForPatient => {
      const mappedStudiesFromDataSource = _mapDataSourceStudies(
        studiesForPatient
      );
      const merged = _mergeStudyDataAndDataSourceStudies(
        studyData,
        mappedStudiesFromDataSource,
      );

      setStudyData(merged);
    });
  }

  // In case display sets were added before the component was created,
  // initialize the state from the current state of the DisplaySetService
  const currentDisplaySets = DisplaySetService.activeDisplaySets;
  const mappedStudiesFromInstances = _getMappedStudiesFromDisplaySets(
    currentDisplaySets
  );
  const [studyData, setStudyData] = useState(mappedStudiesFromInstances);

  if (!studyData.length) {
    _createInitialState(currentDisplaySets);
  }

  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState(new Map());
  const updateThumbnailMap = (k, v) => {
    setThumbnailImageSrcMap(thumbnailImageSrcMap.set(k, v));
  };

  const handleDisplaySetsAdded = displaySets => {
    // On initial load
    // 1. DisplaySets are added for the primary studies, which are used to create
    //    the initial 'StudyData' to be displayed in the browser
    // 2. Requests for thumbnails are made for each display set, which
    //    resolve asynchronously and update thumbnailImageSrcMap
    // 3. QIDO-RS call is made to retrieve StudyData for related studies, which
    //    resolves later and is merged into StudyData
    //
    // Later, if another study is loaded
    // 1. Display sets are added again, triggering requests for thumbnails
    // 2. StudyData is updated from any new information provided by the series-level requests

    // First, launch requests for a thumbnail for the new display sets
    displaySets.forEach(dset => {
      const uid = dset.displaySetInstanceUID;
      const imageIds = dataSource.getImageIdsForDisplaySet(dset);
      const imageId = imageIds[Math.floor(imageIds.length / 2)];

      // When the image arrives, render it and store the result in the thumbnailImgSrcMap
      getImageSrc(imageId).then(imageSrc => updateThumbnailMap(uid, imageSrc));
    });

    // Does any studyData already exist?
    if (studyData.length) {
      // If it does, map the new display set data and merge it into the local state
      // for display
      const mappedStudiesFromInstances = _getMappedStudiesFromDisplaySets(
        displaySets
      );

      const merged = _mergeStudyDataAndInstanceStudies(
        studyData,
        mappedStudiesFromInstances,
      );

      setStudyData(merged);
    } else {
      _createInitialState(displaySets)
    }
  };

  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      handleDisplaySetsAdded
    );

    return unsubscribe;
  }, []);

  const viewportData = []; //useViewportGrid();
  const seriesTracking = {}; //useSeriesTracking();

  studyData.forEach(study => {
    study.displaySets.forEach(ds => {
      ds.imageSrc = thumbnailImageSrcMap.get(ds.displaySetInstanceUID);
    });
  });

  const primary = studyData.find(study => {
    return true; // TODO: check study.StudyInstanceUID matches queryparam?
  });

  // TODO: Filter allStudies to dates within one year of current date
  const recentStudies = studyData.filter(study => {
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
      studies: studyData,
    },
  ];

  function onClickStudy(StudyInstanceUID) {
    const study = studyData.find(a => a.studyInstanceUid === StudyInstanceUID);
    if (study && study.displaySets && study.displaySets.length) {
      return;
    }

    console.warn(`onClickStudy: ${StudyInstanceUID}`);
    // TODO: This is weird, why can't the data source just be used as
    // as function that doesn't expect a query string?
    const queryParams = `?StudyInstanceUIDs=${StudyInstanceUID}`;

    dataSource.retrieve.series.metadata(
      queryParams,
      DisplaySetService.makeDisplaySets
    );
  }

  const memoOnClickStudy = useCallback(
    StudyInstanceUID => {
      onClickStudy(StudyInstanceUID);
    },
    [studyData]
  );

  return (
    <StudyBrowser
      activeTabName={activeTabName}
      tabs={tabs}
      onClickStudy={memoOnClickStudy}
      onSetTabActive={setActiveTabName}
    />
  );
}

PanelStudyBrowser.propTypes = {
  dataSource: PropTypes.shape({
    getImageIdsForDisplaySet: PropTypes.func.isRequired,
  }).isRequired,
  getImageSrc: PropTypes.func.isRequired,
  getStudiesByPatientId: PropTypes.func.isRequired,
};

export default PanelStudyBrowser;

/**
 * Maps from the DataSource's format to a naturalized object
 *
 * @param {*} studies
 */
function _mapDataSourceStudies(studies) {
  return studies.map(study => {
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
}

/**
 * Iterates over displaysets and creates mapped studies from
 * instance metadata.
 *
 * @param {*} displaySets
 */
function _getMappedStudiesFromDisplaySets(displaySets) {
  if (!displaySets) {
    return [];
  }

  const studiesFromInstanceData = {};

  displaySets.forEach(ds => {
    const displaySet = {
      displaySetInstanceUID: ds.displaySetInstanceUID,
      description: ds.SeriesDescription,
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      date: ds.SeriesDate,
      numInstances: ds.numImageFrames,
      componentType: 'thumbnailTracked' // TODO: PUT THIS SOMEWHERE ELSE
    };

    studiesFromInstanceData[ds.StudyInstanceUID] =
      studiesFromInstanceData[ds.StudyInstanceUID] ||
      _mapStudyFromInstance(ds.StudyInstanceUID);

    const mappedStudy = studiesFromInstanceData[ds.StudyInstanceUID];

    mappedStudy.displaySets.push(displaySet);
    mappedStudy.numInstances += displaySet.numInstances;
    mappedStudy.modalitiesSet.add(displaySet.modality);

    const modalitiesSet = mappedStudy.modalitiesSet;
    mappedStudy.modalities = Array.from(modalitiesSet).join(', ');
  });

  return Object.values(studiesFromInstanceData);
}

function _mergeStudyDataAndDataSourceStudies(studyData, mappedQidoStudies) {
  return mappedQidoStudies.map(qidoStudy => {
    const { StudyInstanceUID } = qidoStudy;
    const existing = studyData.find(a => a.studyInstanceUid === StudyInstanceUID) || {};

    return Object.assign({
      displaySets: []
    }, existing, {
      studyInstanceUid: StudyInstanceUID,
      date: qidoStudy.StudyDate,
      description: qidoStudy.StudyDescription,
      modalities: qidoStudy.ModalitiesInStudy,
      numInstances: qidoStudy.NumInstances,
    });
  });
}

function _mergeStudyDataAndInstanceStudies(studyData, mappedInstanceStudies) {
  return studyData.map(study => {
    const studyFromInstances =
      mappedInstanceStudies.find(a => a.StudyInstanceUID === study.studyInstanceUid);

    return Object.assign({}, study, {
      displaySets: studyFromInstances.displaySets,
      modalities: studyFromInstances.modalities
    })
  });
}

function _mapStudyFromInstance(StudyInstanceUID) {
  const study = dicomMetadataStore.getStudy(StudyInstanceUID);
  const anInstance = study.series[0].instances[0];

  return {
    date: anInstance.StudyDate, // TODO: Format this date to DD-MMM-YYYY
    description: anInstance.StudyDescription,
    displaySets: [],
    numInstances: 0,
    modalitiesSet: new Set(),
  };
}
