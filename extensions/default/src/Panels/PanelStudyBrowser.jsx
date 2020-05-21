import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
//
import { StudyBrowser, useImageViewer } from '@ohif/ui';
import { dicomMetadataStore } from '@ohif/core';
// This has to import from somewhere else...

function PanelStudyBrowser({
  DisplaySetService,
  getImageSrc,
  getStudiesForPatientByStudyInstanceUID,
  requestDisplaySetCreationForStudy,
  dataSource,
}) {
  const currentDisplaySets = DisplaySetService.activeDisplaySets || [];
  // TODO: Deep copy? Or By IDs?
  // TODO: May need to be mapped to a different shape?
  const [displaySets, setDisplaySets] = useState(currentDisplaySets);
  const [activeTabName, setActiveTabName] = useState('primary');
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState(new Map());
  const [{ StudyInstanceUIDs }, dispatch] = useImageViewer();
  // vv What we want to render
  const [studyDisplayList, setStudyDisplayList] = useState([]);

  useEffect(() => {
    // Fetch all studies for the patient in each primary study
    async function fetchStudiesForPatient(StudyInstanceUID) {
      const qidoStudiesForPatient =
        (await getStudiesForPatientByStudyInstanceUID(StudyInstanceUID)) || [];

      const mappedStudies = _mapDataSourceStudies(qidoStudiesForPatient);

      const updatedStudyDisplayList = _mergeStudyDisplayListAndDataSourceStudies(
        studyDisplayList,
        mappedStudies,
        displaySets
      );

      addDisplaySetsToStudyDisplayList(
        updatedStudyDisplayList,
        displaySets,
        thumbnailImageSrcMap
      );

      setStudyDisplayList(updatedStudyDisplayList);
    }

    StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(sid));
  }, [StudyInstanceUIDs, getStudiesForPatientByStudyInstanceUID]);


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
        dragData: {
          type: 'displayset',
          displaySetInstanceUID: ds.displaySetInstanceUID,
          // .. Any other data to pass
        },
      };
    });

    setDisplaySets(displaySetsUI);
  }

  function addDisplaySetsToStudyDisplayList(
    studies,
    displaySets,
    thumbnailImageSrcMap
  ) {
    displaySets.forEach(displaySet => {
      const study = studies.find(
        s => s.studyInstanceUid === displaySet.StudyInstanceUID
      );

      if (!study) {
        return;
      }

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
  }

  useEffect(() => {
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

  const primaryStudies = studyDisplayList.filter(study =>
    StudyInstanceUIDs.includes(study.studyInstanceUid)
  );

  // TODO: Filter allStudies to dates within one year of current date
  const recentStudies = studyDisplayList.filter(study => {
    return true; // TODO: check study.date
  });

  const tabs = [
    {
      name: 'primary',
      label: 'Primary',
      studies: primaryStudies || [],
    },
    {
      name: 'recent',
      label: 'Recent',
      studies: recentStudies,
    },
    {
      name: 'all',
      label: 'All',
      studies: studyDisplayList,
    },
  ];

  // TODO: Should "expand" appropriate study (already handled by component?)
  // TODO: Should not fire this on "close"
  function _handleStudyClick(StudyInstanceUID) {
    requestDisplaySetCreationForStudy(DisplaySetService, StudyInstanceUID);
  }

  return (
    <StudyBrowser
      activeTabName={activeTabName}
      tabs={tabs}
      onClickStudy={_handleStudyClick}
      onSetTabActive={setActiveTabName}
    />
  );
}

PanelStudyBrowser.propTypes = {
  DisplaySetService: PropTypes.shape({
    EVENTS: PropTypes.object.isRequired,
    hasDisplaySetsForStudy: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired,
  }).isRequired,
  dataSource: PropTypes.shape({
    getImageIdsForDisplaySet: PropTypes.func.isRequired,
  }).isRequired,
  getImageSrc: PropTypes.func.isRequired,
  getStudiesForPatientByStudyInstanceUID: PropTypes.func.isRequired,
  requestDisplaySetCreationForStudy: PropTypes.func.isRequired,
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

function _mergeStudyDisplayListAndDataSourceStudies(
  studyDisplayList,
  mappedQidoStudies
) {
  return mappedQidoStudies.map(qidoStudy => {
    const { StudyInstanceUID } = qidoStudy;
    const existing =
      studyDisplayList.find(a => a.studyInstanceUid === StudyInstanceUID) || {};

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
