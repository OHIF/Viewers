import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { StudyBrowser, useImageViewer, useViewportGrid } from '@ohif/ui';
import { utils } from '@ohif/core';

const { sortStudyInstances, formatDate } = utils;

/**
 *
 * @param {*} param0
 */
function PanelStudyBrowser({
  servicesManager,
  getImageSrc,
  getStudiesForPatientByStudyInstanceUID,
  requestDisplaySetCreationForStudy,
  dataSource,
}) {
  const {
    HangingProtocolService,
    DisplaySetService,
    UINotificationService,
  } = servicesManager.services;
  // Normally you nest the components so the tree isn't so deep, and the data
  // doesn't have to have such an intense shape. This works well enough for now.
  // Tabs --> Studies --> DisplaySets --> Thumbnails
  const { StudyInstanceUIDs } = useImageViewer();
  const [
    { activeViewportIndex, viewports },
    viewportGridService,
  ] = useViewportGrid();
  const [activeTabName, setActiveTabName] = useState('primary');
  const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState([
    ...StudyInstanceUIDs,
  ]);
  const [studyDisplayList, setStudyDisplayList] = useState([]);
  const [displaySets, setDisplaySets] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});
  const isMounted = useRef(true);

  const onDoubleClickThumbnailHandler = displaySetInstanceUID => {
    let updatedViewports = [];
    const viewportIndex = activeViewportIndex;
    try {
      updatedViewports = HangingProtocolService.getViewportsRequireUpdate(
        viewportIndex,
        displaySetInstanceUID
      );
    } catch (error) {
      console.warn(error);
      UINotificationService.show({
        title: 'Thumbnail Double Click',
        message:
          'The selected display sets could not be added to the viewport due to a mismatch in the Hanging Protocol rules.',
        type: 'info',
        duration: 3000,
      });
    }

    viewportGridService.setDisplaySetsForViewports(updatedViewports);
  };

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
      if (isMounted.current) {
        setStudyDisplayList(prevArray => {
          const ret = [...prevArray];
          for (const study of actuallyMappedStudies) {
            if (
              !prevArray.find(
                it => it.studyInstanceUid === study.studyInstanceUid
              )
            ) {
              ret.push(study);
            }
          }
          return ret;
        });
      }
    }

    StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(sid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [StudyInstanceUIDs, getStudiesForPatientByStudyInstanceUID]);

  // // ~~ Initial Thumbnails
  useEffect(() => {
    const currentDisplaySets = DisplaySetService.activeDisplaySets;
    currentDisplaySets.forEach(async dSet => {
      const newImageSrcEntry = {};
      const displaySet = DisplaySetService.getDisplaySetByUID(
        dSet.displaySetInstanceUID
      );
      const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
      const imageId = imageIds[Math.floor(imageIds.length / 2)];

      // TODO: Is it okay that imageIds are not returned here for SR displaySets?
      if (imageId) {
        // When the image arrives, render it and store the result in the thumbnailImgSrcMap
        newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(
          imageId
        );
        if (isMounted.current) {
          setThumbnailImageSrcMap(prevState => {
            return { ...prevState, ...newImageSrcEntry };
          });
        }
      }
    });
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ~~ displaySets
  useEffect(() => {
    // TODO: Are we sure `activeDisplaySets` will always be accurate?
    const currentDisplaySets = DisplaySetService.activeDisplaySets;
    const mappedDisplaySets = _mapDisplaySets(
      currentDisplaySets,
      thumbnailImageSrcMap
    );
    sortStudyInstances(mappedDisplaySets);

    setDisplaySets(mappedDisplaySets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnailImageSrcMap]);

  // ~~ subscriptions --> displaySets
  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      data => {
        const { displaySetsAdded } = data;
        displaySetsAdded.forEach(async dSet => {
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
              imageId,
              dSet.initialViewport
            );
            if (isMounted.current) {
              setThumbnailImageSrcMap(prevState => {
                return { ...prevState, ...newImageSrcEntry };
              });
            }
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
          thumbnailImageSrcMap
        );
        setDisplaySets(mappedDisplaySets);
      }
    );

    return () => {
      SubscriptionDisplaySetsAdded.unsubscribe();
      SubscriptionDisplaySetsChanged.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      ? // eslint-disable-next-line prettier/prettier
        [
          ...expandedStudyInstanceUIDs.filter(
            stdyUid => stdyUid !== StudyInstanceUID
          ),
        ]
      : [...expandedStudyInstanceUIDs, StudyInstanceUID];

    setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);

    if (!shouldCollapseStudy) {
      const madeInClient = true;
      requestDisplaySetCreationForStudy(
        DisplaySetService,
        StudyInstanceUID,
        madeInClient
      );
    }
  }

  const activeDisplaySetInstanceUIDs =
    viewports[activeViewportIndex]?.displaySetInstanceUIDs;

  return (
    <StudyBrowser
      tabs={tabs}
      servicesManager={servicesManager}
      activeTabName={activeTabName}
      onDoubleClickThumbnail={onDoubleClickThumbnailHandler}
      activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
      expandedStudyInstanceUIDs={expandedStudyInstanceUIDs}
      onClickStudy={_handleStudyClick}
      onClickTab={clickedTabName => {
        setActiveTabName(clickedTabName);
      }}
    />
  );
}

PanelStudyBrowser.propTypes = {
  servicesManager: PropTypes.object.isRequired,
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

function _mapDisplaySets(displaySets, thumbnailImageSrcMap) {
  const thumbnailDisplaySets = [];
  const thumbnailNoImageDisplaySets = [];

  displaySets.forEach(ds => {
    const imageSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];
    const componentType = _getComponentType(ds.Modality);

    const array =
      componentType === 'thumbnail'
        ? thumbnailDisplaySets
        : thumbnailNoImageDisplaySets;

    array.push({
      displaySetInstanceUID: ds.displaySetInstanceUID,
      description: ds.SeriesDescription || '',
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      seriesDate: ds.SeriesDate,
      seriesTime: ds.SeriesTime,
      numInstances: ds.numImageFrames,
      StudyInstanceUID: ds.StudyInstanceUID,
      componentType,
      imageSrc,
      dragData: {
        type: 'displayset',
        displaySetInstanceUID: ds.displaySetInstanceUID,
        // .. Any other data to pass
      },
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
    // TODO probably others.
    return 'thumbnailNoImage';
  }

  return 'thumbnail';
}

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
