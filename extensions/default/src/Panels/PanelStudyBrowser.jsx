import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { StudyBrowser } from '@ohif/ui';
import { dicomMetadataStore, useViewModel } from '@ohif/core';
//

function PanelStudyBrowser({ getImageSrc, getStudiesByPatientId, dataSource }) {
  console.warn('StudyBrowserPanel rerender');
  const [activeTabName, setActiveTabName] = useState('primary');
  const [studyData, setStudyData] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState(new Map());
  const updateThumbnailMap = (k, v) => {
    setThumbnailImageSrcMap(thumbnailImageSrcMap.set(k, v));
  };

  const isSubscribed = true;
  const viewModel = useViewModel();
  const viewportData = []; //useViewportGrid();
  const seriesTracking = {}; //useSeriesTracking();

  // This effect
  useEffect(() => {
    if (!viewModel.displaySetInstanceUIDs.length) {
      return;
    }

    if (getImageSrc) {
      viewModel.displaySetInstanceUIDs.forEach(async uid => {
        const imageIds = dataSource.getImageIdsForDisplaySet(uid);
        const imageId = imageIds[Math.floor(imageIds.length / 2)];
        const imageSrc = await getImageSrc(imageId);

        updateThumbnailMap(uid, imageSrc);
      });
    }

    const displaySets = viewModel.displaySetInstanceUIDs.map(
      displaySetManager.getDisplaySetByUID
    );

    const aDisplaySet = displaySets[0];
    const firstStudy = dicomMetadataStore.getStudy(
      aDisplaySet.StudyInstanceUID
    );
    const firstInstance = firstStudy.series[0].instances[0];
    const PatientID = firstInstance.PatientID;
    //
    async function getData() {
      const studiesForPatient = await getStudiesByPatientId(PatientID);
      const mappedStudiesFromDataSource = _mapDataSourceStudies(
        studiesForPatient
      );
      const mappedStudiesFromInstances = _getMappedStudiesFromDisplaySets(
        displaySets
      );
      const ourFinalFormIGuess = _mergeDataSourceAndInstanceStudies(
        mappedStudiesFromDataSource,
        mappedStudiesFromInstances
      );

      setStudyData(ourFinalFormIGuess);
    }

    getData();

    return () => (isSubscribed = false);
  }, [viewModel.displaySetInstanceUIDs]);

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
      displaySetManager.makeDisplaySets
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
  const studiesFromInstanceData = {};

  displaySets.forEach(ds => {
    const displaySet = {
      displaySetInstanceUID: ds.displaySetInstanceUID,
      description: ds.SeriesDescription,
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      date: ds.SeriesDate,
      numInstances: ds.numImageFrames,
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

  return studiesFromInstanceData;
}

function _mergeDataSourceAndInstanceStudies(mappedQidoStudies, mappedInstanceStudies) {
  const allStudies = mappedQidoStudies.map(qidoStudy => {
    const studyFromInstances =
      mappedInstanceStudies[qidoStudy.StudyInstanceUID];

    if (!studyFromInstances) {
      return {
        studyInstanceUid: qidoStudy.StudyInstanceUID,
        date: qidoStudy.StudyDate,
        description: qidoStudy.StudyDescription,
        modalities: qidoStudy.ModalitiesInStudy,
        numInstances: qidoStudy.NumInstances,
        displaySets: [],
      };
    }

    return {
      studyInstanceUid: qidoStudy.StudyInstanceUID,
      date: qidoStudy.StudyDate || studyFromInstances.date,
      description: qidoStudy.StudyDescription || studyFromInstances.description,
      modalities: studyFromInstances.modalities || qidoStudy.ModalitiesInStudy,
      numInstances: qidoStudy.NumInstances || studyFromInstances.numInstances,
      displaySets: studyFromInstances.displaySets,
    };
  });

  return allStudies;
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
