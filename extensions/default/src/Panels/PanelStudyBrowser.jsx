import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { StudyBrowser } from '@ohif/ui';
import { dicomMetadataStore } from '@ohif/core';

function PanelStudyBrowser({
  servicesManager,
  getImageSrc,
  getStudiesByPatientId,
  dataSource,
}) {
  const { DisplaySetService } = servicesManager.services;
  const currentDisplaySets = DisplaySetService.activeDisplaySets || [];
  // TODO: Deep copy? Or By IDs?
  // TODO: May need to be mapped to a different shape?

  const [displaySets, setDisplaySets] = useState(currentDisplaySets);
  // TODO: Grab from URL, or pass in as part of contract to panels
  const [primaryStudyInstanceUID, setPrimaryStudyInstanceUID] = useState();
  const [activeTabName, setActiveTabName] = useState('primary');
  const [studyData, setStudyData] = useState([]);
  const [studiesForPatient, setStudiesForPatient] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState(new Map());

  useEffect(() => {
    const mappedStudiesFromDataSource = _mapDataSourceStudies(
      studiesForPatient
    );

    const newStudyData = _mergeStudyDataAndDataSourceStudies(
      studyData,
      mappedStudiesFromDataSource,
      displaySets
    );

    addDisplaySetsToStudyData(newStudyData, displaySets, thumbnailImageSrcMap);

    setStudyData(newStudyData);
  }, [studiesForPatient, thumbnailImageSrcMap]);

  const updateThumbnailMap = (displaySetInstanceUID, imageSrc) => {
    setThumbnailImageSrcMap(
      thumbnailImageSrcMap.set(displaySetInstanceUID, imageSrc)
    );
  };

  function setLocalDisplaySetsState(displaySets) {
    const displaySetsUI = displaySets.map(ds => {
      const imageSrc = thumbnailImageSrcMap.get(ds.displaySetInstanceUID);
      return {
        displaySetInstanceUID: ds.displaySetInstanceUID,
        description: ds.SeriesDescription,
        seriesNumber: ds.SeriesNumber,
        modality: ds.Modality,
        date: ds.SeriesDate,
        numInstances: ds.numImageFrames,
        StudyInstanceUID: ds.StudyInstanceUID,
        componentType: 'thumbnail', // 'thumbnailNoImage' || 'thumbnailTracked' // TODO: PUT THIS SOMEWHERE ELSE
        imageSrc,
      };
    });

    setDisplaySets(displaySetsUI);
  }

  function addDisplaySetsToStudyData(
    studies,
    displaySets,
    thumbnailImageSrcMap
  ) {
    displaySets.forEach(displaySet => {
      const study = studies.find(
        s => s.studyInstanceUid === displaySet.StudyInstanceUID
      );

      displaySet.imageSrc = thumbnailImageSrcMap.get(
        displaySet.displaySetInstanceUID
      );

      study.displaySets.push(displaySet);
    });
  }

  async function handleDisplaySetsAdded(newDisplaySets) {
    // First, launch requests for a thumbnail for the new display sets
    newDisplaySets.forEach(async dset => {
      const uid = dset.displaySetInstanceUID;
      const imageIds = dataSource.getImageIdsForDisplaySet(dset);
      const imageId = imageIds[Math.floor(imageIds.length / 2)];

      // When the image arrives, render it and store the result in the thumbnailImgSrcMap
      const imageSrc = await getImageSrc(imageId);
      updateThumbnailMap(uid, imageSrc);
    });

    const firstDisplaySet = newDisplaySets[0];
    if (!studiesForPatient.length && firstDisplaySet) {
      async function doAsyncStuff() {
        const qidoStuff = await _getStudiesByPatientId(
          firstDisplaySet,
          getStudiesByPatientId
        );

        setStudiesForPatient(qidoStuff);
        setPrimaryStudyInstanceUID(firstDisplaySet.StudyInstanceUID);
      }

      doAsyncStuff();
    }
  }

  useEffect(() => {
    // TODO: IF WE HAVE OUR FIRST DISPLAY SET...
    // QIDO AWAY
    // IF WE DO NOT, WAIT FOR FIRST DISPLAY_SETS_ADDED
    const firstDisplaySet = displaySets[0];
    if (firstDisplaySet) {
      async function doAsyncStuff() {
        const qidoStuff = await _getStudiesByPatientId(
          firstDisplaySet,
          getStudiesByPatientId
        );
        setPrimaryStudyInstanceUID(firstDisplaySet.StudyInstanceUID);
        setStudiesForPatient(qidoStuff);
      }
      doAsyncStuff();
    }

    const subscriptions = [
      DisplaySetService.subscribe(
        DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
        handleDisplaySetsAdded
      ),
      DisplaySetService.subscribe(
        DisplaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        setLocalDisplaySetsState
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe);
    };
  }, []);

  const primary = studyData.find(
    study => study.studyInstanceUid === primaryStudyInstanceUID
  );

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

async function _getStudiesByPatientId(displaySet, getStudiesByPatientId) {
  const study = dicomMetadataStore.getStudy(displaySet.StudyInstanceUID);
  const instance = study.series[0].instances[0];
  const PatientID = instance.PatientID;
  const studiesByPatientId = await getStudiesByPatientId(PatientID);

  return studiesByPatientId;
}

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

function _mergeStudyDataAndDataSourceStudies(studyData, mappedQidoStudies) {
  return mappedQidoStudies.map(qidoStudy => {
    const { StudyInstanceUID } = qidoStudy;
    const existing =
      studyData.find(a => a.studyInstanceUid === StudyInstanceUID) || {};

    return Object.assign(
      {},
      existing,
      {
        displaySets: [],
      },
      {
        studyInstanceUid: StudyInstanceUID,
        date: qidoStudy.StudyDate,
        description: qidoStudy.StudyDescription,
        modalities: qidoStudy.ModalitiesInStudy,
        numInstances: qidoStudy.NumInstances,
      }
    );
  });
}

function _mergeStudyDataAndInstanceStudies(studyData, mappedInstanceStudies) {
  const merged = [];
  mappedInstanceStudies.map(studyFromInstances => {
    const existing = studyData.find(
      a => a.studyInstanceUid === studyFromInstances.studyInstanceUid
    );

    if (existing) {
      merged.push(
        Object.assign({}, existing, {
          displaySets: studyFromInstances.displaySets,
          modalities: studyFromInstances.modalities,
        })
      );
    } else {
      merged.push(studyFromInstances);
    }
  });

  return merged;
}

function _mapStudyFromInstance(StudyInstanceUID) {
  const study = dicomMetadataStore.getStudy(StudyInstanceUID);
  const anInstance = study.series[0].instances[0];

  return {
    studyInstanceUid: StudyInstanceUID,
    date: anInstance.StudyDate, // TODO: Format this date to DD-MMM-YYYY
    description: anInstance.StudyDescription,
    displaySets: [],
    numInstances: 0,
    modalitiesSet: new Set(),
  };
}
