import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { utils } from '@ohif/core';
import { StudyBrowser, useImageViewer, useViewportGrid } from '@ohif/ui';
import { useTrackedMeasurements } from '../../getContextModule';

const { formatDate } = utils;

/**
 *
 * @param {*} param0
 */
function PanelStudyBrowserTracking({
  MeasurementService,
  DisplaySetService,
  getImageSrc,
  getStudiesForPatientByStudyInstanceUID,
  requestDisplaySetCreationForStudy,
  dataSource,
}) {
  // Normally you nest the components so the tree isn't so deep, and the data
  // doesn't have to have such an intense shape. This works well enough for now.
  // Tabs --> Studies --> DisplaySets --> Thumbnails
  const [{ StudyInstanceUIDs }, dispatchImageViewer] = useImageViewer();
  const [
    { activeViewportIndex, viewports },
    dispatchViewportGrid,
  ] = useViewportGrid();
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
  ] = useTrackedMeasurements();
  const [activeTabName, setActiveTabName] = useState('primary');
  const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState(
    []
  );
  const [studyDisplayList, setStudyDisplayList] = useState([]);
  const [displaySets, setDisplaySets] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});

  // TODO: Should this be somewhere else? Feels more like a mode "lifecycle" setup/destroy?
  useEffect(() => {
    const { unsubscribe } = MeasurementService.subscribe(
      MeasurementService.EVENTS.MEASUREMENT_ADDED,
      ({ source, measurement }) => {
        const {
          referenceSeriesUID: SeriesInstanceUID,
          referenceStudyUID: StudyInstanceUID,
        } = measurement;

        sendTrackedMeasurementsEvent('TRACK_SERIES', {
          viewportIndex: activeViewportIndex,
          StudyInstanceUID,
          SeriesInstanceUID,
        });
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MeasurementService, activeViewportIndex, sendTrackedMeasurementsEvent]);

  const { trackedStudy, trackedSeries } = trackedMeasurements.context;

  // ~~ studyDisplayList
  useEffect(() => {
    // Fetch all studies for the patient in each primary study
    async function fetchStudiesForPatient(StudyInstanceUID) {
      const qidoStudiesForPatient =
        (await getStudiesForPatientByStudyInstanceUID(StudyInstanceUID)) || [];

      // TODO: This should be "naturalized DICOM JSON" studies
      const mappedStudies = _mapDataSourceStudies(qidoStudiesForPatient);
      const actuallyMappedStudies = mappedStudies.map(qidoStudy => {
        return {
          studyInstanceUid: qidoStudy.StudyInstanceUID,
          date: formatDate(qidoStudy.StudyDate),
          description: qidoStudy.StudyDescription,
          modalities: qidoStudy.ModalitiesInStudy,
          numInstances: qidoStudy.NumInstances,
          // displaySets: []
        };
      });

      setStudyDisplayList(actuallyMappedStudies);
    }

    StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(sid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [StudyInstanceUIDs, getStudiesForPatientByStudyInstanceUID]);

  // ~~ Initial Thumbnails
  useEffect(() => {
    const currentDisplaySets = DisplaySetService.activeDisplaySets;
    currentDisplaySets.forEach(async dSet => {
      const newImageSrcEntry = {};
      const displaySet = DisplaySetService.getDisplaySetByUID(
        dSet.displaySetInstanceUID
      );
      const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
      const imageId = imageIds[Math.floor(imageIds.length / 2)];

      // TODO: Is it okay that imageIds are not returned here for SR displaysets?
      if (imageId) {
        // When the image arrives, render it and store the result in the thumbnailImgSrcMap
        newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(
          imageId
        );
        setThumbnailImageSrcMap(prevState => {
          return { ...prevState, ...newImageSrcEntry };
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DisplaySetService, dataSource, getImageSrc]);

  // ~~ displaySets
  useEffect(() => {
    // TODO: Are we sure `activeDisplaySets` will always be accurate?
    const currentDisplaySets = DisplaySetService.activeDisplaySets;
    const mappedDisplaySets = _mapDisplaySets(
      currentDisplaySets,
      thumbnailImageSrcMap,
      trackedSeries,
      viewports
    );

    setDisplaySets(mappedDisplaySets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    DisplaySetService.activeDisplaySets,
    trackedSeries,
    thumbnailImageSrcMap,
    viewports,
  ]);

  // ~~ subscriptions --> displaySets
  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      newDisplaySets => {
        newDisplaySets.forEach(async dSet => {
          const newImageSrcEntry = {};
          const displaySet = DisplaySetService.getDisplaySetByUID(
            dSet.displaySetInstanceUID
          );
          const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          const imageId = imageIds[Math.floor(imageIds.length / 2)];
          // TODO: Is it okay that imageIds are not returned here for SR displaysets?
          if (imageId) {
            // When the image arrives, render it and store the result in the thumbnailImgSrcMap
            newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(
              imageId
            );
            setThumbnailImageSrcMap(prevState => {
              return { ...prevState, ...newImageSrcEntry };
            });
          }
        });
      }
    );

    // TODO: Will this always hold _all_ the displaySets we care about?
    // DISPLAY_SETS_CHANGED returns `DisplaySerService.activeDisplaySets`
    const SubscriptionDisplaySetsChanged = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      changedDisplaySets => {
        const mappedDisplaySets = _mapDisplaySets(
          changedDisplaySets,
          thumbnailImageSrcMap,
          trackedSeries,
          viewports
        );

        setDisplaySets(mappedDisplaySets);
      }
    );

    return () => {
      SubscriptionDisplaySetsAdded.unsubscribe();
      SubscriptionDisplaySetsChanged.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    DisplaySetService,
    dataSource,
    getImageSrc,
    thumbnailImageSrcMap,
    trackedSeries,
    viewports,
  ]);

  const tabs = _createStudyBrowserTabs(
    StudyInstanceUIDs,
    studyDisplayList,
    displaySets
  );

  // TODO: Should not fire this on "close"
  function _handleStudyClick(StudyInstanceUID) {
    const shouldCollapseStudy = expandedStudyInstanceUIDs.includes(
      StudyInstanceUID
    );
    const updatedExpandedStudyInstanceUIDs = shouldCollapseStudy
      ? [
          ...expandedStudyInstanceUIDs.filter(
            stdyUid => stdyUid !== StudyInstanceUID
          ),
        ]
      : [...expandedStudyInstanceUIDs, StudyInstanceUID];

    setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);

    if (!shouldCollapseStudy) {
      requestDisplaySetCreationForStudy(DisplaySetService, StudyInstanceUID);
    }
  }

  return (
    <StudyBrowser
      tabs={tabs}
      activeTabName={activeTabName}
      expandedStudyInstanceUIDs={expandedStudyInstanceUIDs}
      onClickStudy={_handleStudyClick}
      onClickTab={clickedTabName => {
        setActiveTabName(clickedTabName);
      }}
      onClickUntrack={displaySetInstanceUID => {
        const displaySet = DisplaySetService.getDisplaySetByUID(
          displaySetInstanceUID
        );
        // TODO: shift this somewhere else where we're centralizing this logic?
        // Potentially a helper from displaySetInstanceUID to this
        sendTrackedMeasurementsEvent('UNTRACK_SERIES', {
          SeriesInstanceUID: displaySet.SeriesInstanceUID,
        });
      }}
    />
  );
}

PanelStudyBrowserTracking.propTypes = {
  DisplaySetService: PropTypes.shape({
    EVENTS: PropTypes.object.isRequired,
    activeDisplaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
    getDisplaySetByUID: PropTypes.func.isRequired,
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

export default PanelStudyBrowserTracking;

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

function _mapDisplaySets(
  displaySets,
  thumbnailImageSrcMap,
  trackedSeriesInstanceUIDs,
  viewports // TODO: make array of `displaySetInstanceUIDs`?
) {
  const thumbnailDisplaySets = [];
  const thumbnailNoImageDisplaySets = [];
  displaySets.forEach(ds => {
    const imageSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];
    const componentType = _getComponentType(ds.Modality);
    const firstViewportIndexWithMatchingDisplaySetUid = viewports.findIndex(
      vp => vp.displaySetInstanceUID === ds.displaySetInstanceUID
    );
    const viewportIdentificator =
      _viewportLabels[firstViewportIndexWithMatchingDisplaySetUid] || '';

    const array =
      componentType === 'thumbnailTracked'
        ? thumbnailDisplaySets
        : thumbnailNoImageDisplaySets;

    array.push({
      displaySetInstanceUID: ds.displaySetInstanceUID,
      description: ds.SeriesDescription,
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      seriesDate: ds.SeriesDate,
      numInstances: ds.numImageFrames,
      StudyInstanceUID: ds.StudyInstanceUID,
      componentType,
      imageSrc,
      dragData: {
        type: 'displayset',
        displaySetInstanceUID: ds.displaySetInstanceUID,
        // .. Any other data to pass
      },
      isTracked: trackedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID),
      viewportIdentificator,
    });
  });

  return [...thumbnailDisplaySets, ...thumbnailNoImageDisplaySets];
}

const thumbnailNoImageModalities = [
  'SR',
  'SEG',
  'RTSTRUCT',
  'RTPLAN',
  'RTDOSE',
];

function _getComponentType(Modality) {
  if (thumbnailNoImageModalities.includes(Modality)) {
    return 'thumbnailNoImage';
  }

  return 'thumbnailTracked';
}

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

/**
 *
 * @param {string[]} primaryStudyInstanceUIDs
 * @param {object[]} studyDisplayList
 * @param {string} studyDisplayList.studyInstanceUid
 * @param {string} studyDisplayList.date
 * @param {string} studyDisplayList.description
 * @param {string} studyDisplayList.modalities
 * @param {number} studyDisplayList.numInstances
 * @param {object[]} displaySets
 * @returns tabs - The prop object expected by the StudyBrowser component
 */
function _createStudyBrowserTabs(
  primaryStudyInstanceUIDs,
  studyDisplayList,
  displaySets
) {
  const primaryStudies = [];
  const recentStudies = [];
  const allStudies = [];

  studyDisplayList.forEach(study => {
    const displaySetsForStudy = displaySets.filter(
      ds => ds.StudyInstanceUID === study.studyInstanceUid
    );
    const tabStudy = Object.assign({}, study, {
      displaySets: displaySetsForStudy,
    });

    if (primaryStudyInstanceUIDs.includes(study.studyInstanceUid)) {
      primaryStudies.push(tabStudy);
    } else {
      // TODO: Filter allStudies to dates within one year of current date
      recentStudies.push(tabStudy);
      allStudies.push(tabStudy);
    }
  });

  const tabs = [
    {
      name: 'primary',
      label: 'Primary',
      studies: primaryStudies,
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
