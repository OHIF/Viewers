import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { HangingProtocolService, utils } from '@ohif/core';
import {
  StudyBrowser,
  useImageViewer,
  useViewportGrid,
  Dialog,
} from '@ohif/ui';
import { useTrackedMeasurements } from '../../getContextModule';

const { formatDate } = utils;

/**
 *
 * @param {*} param0
 */
function PanelStudyBrowserTracking({
  servicesManager,
  getImageSrc,
  getStudiesForPatientByStudyInstanceUID,
  requestDisplaySetCreationForStudy,
  dataSource,
}) {
  const {
    MeasurementService,
    DisplaySetService,
    UIDialogService,
    HangingProtocolService,
    UINotificationService,
  } = servicesManager.services;

  // Normally you nest the components so the tree isn't so deep, and the data
  // doesn't have to have such an intense shape. This works well enough for now.
  // Tabs --> Studies --> DisplaySets --> Thumbnails
  const { StudyInstanceUIDs } = useImageViewer();
  const [
    { activeViewportIndex, viewports, numCols, numRows },
    viewportGridService,
  ] = useViewportGrid();
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
  ] = useTrackedMeasurements();
  const [activeTabName, setActiveTabName] = useState('primary');
  const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState([
    ...StudyInstanceUIDs,
  ]);
  const [studyDisplayList, setStudyDisplayList] = useState([]);
  const [displaySets, setDisplaySets] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});
  const [jumpToDisplaySet, setJumpToDisplaySet] = useState(null);

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

  const activeViewportDisplaySetInstanceUIDs =
    viewports[activeViewportIndex]?.displaySetInstanceUIDs;

  const isSingleViewport = numCols === 1 && numRows === 1;

  useEffect(() => {
    const added = MeasurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = MeasurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const subscriptions = [];

    [added, addedRaw].forEach(evt => {
      subscriptions.push(
        MeasurementService.subscribe(evt, ({ source, measurement }) => {
          const {
            referenceSeriesUID: SeriesInstanceUID,
            referenceStudyUID: StudyInstanceUID,
          } = measurement;

          sendTrackedMeasurementsEvent('SET_DIRTY', { SeriesInstanceUID });
          sendTrackedMeasurementsEvent('TRACK_SERIES', {
            viewportIndex: activeViewportIndex,
            StudyInstanceUID,
            SeriesInstanceUID,
          });
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
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
      viewports,
      isSingleViewport,
      dataSource,
      DisplaySetService,
      UIDialogService,
      UINotificationService
    );

    setDisplaySets(mappedDisplaySets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    DisplaySetService.activeDisplaySets,
    trackedSeries,
    thumbnailImageSrcMap,
    viewports,
    dataSource,
  ]);

  // ~~ subscriptions --> displaySets
  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      data => {
        const { displaySetsAdded, options } = data;
        displaySetsAdded.forEach(async dSet => {
          const displaySetInstanceUID = dSet.displaySetInstanceUID;

          const newImageSrcEntry = {};
          const displaySet = DisplaySetService.getDisplaySetByUID(
            displaySetInstanceUID
          );

          if (options.madeInClient) {
            setJumpToDisplaySet(displaySetInstanceUID);
          }

          const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          const imageId = imageIds[Math.floor(imageIds.length / 2)];

          // TODO: Is it okay that imageIds are not returned here for SR displaysets?
          if (imageId) {
            // When the image arrives, render it and store the result in the thumbnailImgSrcMap
            newImageSrcEntry[displaySetInstanceUID] = await getImageSrc(
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
          viewports,
          isSingleViewport,
          dataSource,
          DisplaySetService,
          UIDialogService,
          UINotificationService
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
      const madeInClient = true;
      requestDisplaySetCreationForStudy(
        DisplaySetService,
        StudyInstanceUID,
        madeInClient
      );
    }
  }

  useEffect(() => {
    if (jumpToDisplaySet) {
      // Get element by displaySetInstanceUID
      const displaySetInstanceUID = jumpToDisplaySet;
      const element = document.getElementById(
        `thumbnail-${displaySetInstanceUID}`
      );

      if (element && typeof element.scrollIntoView === 'function') {
        // TODO: Any way to support IE here?
        element.scrollIntoView({ behavior: 'smooth' });

        setJumpToDisplaySet(null);
      }
    }
  }, [jumpToDisplaySet, expandedStudyInstanceUIDs, activeTabName]);

  useEffect(() => {
    if (!jumpToDisplaySet) {
      return;
    }

    const displaySetInstanceUID = jumpToDisplaySet;
    // Set the activeTabName and expand the study
    const thumbnailLocation = _findTabAndStudyOfDisplaySet(
      displaySetInstanceUID,
      tabs
    );
    if (!thumbnailLocation) {
      console.warn('jumpToThumbnail: displaySet thumbnail not found.');

      return;
    }
    const { tabName, StudyInstanceUID } = thumbnailLocation;
    setActiveTabName(tabName);
    const studyExpanded = expandedStudyInstanceUIDs.includes(StudyInstanceUID);
    if (!studyExpanded) {
      const updatedExpandedStudyInstanceUIDs = [
        ...expandedStudyInstanceUIDs,
        StudyInstanceUID,
      ];
      setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);
    }
  }, [expandedStudyInstanceUIDs, jumpToDisplaySet, tabs]);

  return (
    <StudyBrowser
      tabs={tabs}
      servicesManager={servicesManager}
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
      onClickThumbnail={() => {}}
      onDoubleClickThumbnail={onDoubleClickThumbnailHandler}
      activeDisplaySetInstanceUIDs={activeViewportDisplaySetInstanceUIDs}
    />
  );
}

PanelStudyBrowserTracking.propTypes = {
  servicesManager: PropTypes.object.isRequired,
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
  viewports, // TODO: make array of `displaySetInstanceUIDs`?
  isSingleViewport,
  dataSource,
  DisplaySetService,
  UIDialogService,
  UINotificationService
) {
  const thumbnailDisplaySets = [];
  const thumbnailNoImageDisplaySets = [];
  displaySets.forEach(ds => {
    const imageSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];
    const componentType = _getComponentType(ds.Modality);
    const viewportIdentificator = isSingleViewport
      ? []
      : viewports.reduce((acc, viewportData, index) => {
          if (
            viewportData?.displaySetInstanceUIDs?.includes(
              ds.displaySetInstanceUID
            )
          ) {
            acc.push(viewportData.viewportLabel);
          }
          return acc;
        }, []);

    const array =
      componentType === 'thumbnailTracked'
        ? thumbnailDisplaySets
        : thumbnailNoImageDisplaySets;

    const { displaySetInstanceUID } = ds;

    const thumbnailProps = {
      displaySetInstanceUID,
      description: ds.SeriesDescription,
      seriesNumber: ds.SeriesNumber,
      modality: ds.Modality,
      seriesDate: formatDate(ds.SeriesDate),
      numInstances: ds.numImageFrames,
      StudyInstanceUID: ds.StudyInstanceUID,
      componentType,
      imageSrc,
      dragData: {
        type: 'displayset',
        displaySetInstanceUID,
        // .. Any other data to pass
      },
      isTracked: trackedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID),
      viewportIdentificator,
    };

    if (componentType === 'thumbnailNoImage') {
      if (dataSource.reject && dataSource.reject.series) {
        thumbnailProps.canReject = true;
        thumbnailProps.onReject = () => {
          UIDialogService.create({
            id: 'ds-reject-sr',
            centralize: true,
            isDraggable: false,
            showOverlay: true,
            content: Dialog,
            contentProps: {
              title: 'Delete Report',
              body: () => (
                <div className="p-4 text-white bg-primary-dark">
                  <p>Are you sure you want to delete this report?</p>
                  <p>This action cannot be undone.</p>
                </div>
              ),
              actions: [
                { id: 'cancel', text: 'Cancel', type: 'secondary' },
                {
                  id: 'yes',
                  text: 'Yes',
                  type: 'primary',
                  classes: ['reject-yes-button'],
                },
              ],
              onClose: () => UIDialogService.dismiss({ id: 'ds-reject-sr' }),
              onShow: () => {
                const yesButton = document.querySelector('.reject-yes-button');

                yesButton.focus();
              },
              onSubmit: async ({ action }) => {
                switch (action.id) {
                  case 'yes':
                    try {
                      await dataSource.reject.series(
                        ds.StudyInstanceUID,
                        ds.SeriesInstanceUID
                      );
                      DisplaySetService.deleteDisplaySet(displaySetInstanceUID);
                      UIDialogService.dismiss({ id: 'ds-reject-sr' });
                      UINotificationService.show({
                        title: 'Delete Report',
                        message: 'Report deleted successfully',
                        type: 'success',
                      });
                    } catch (error) {
                      UIDialogService.dismiss({ id: 'ds-reject-sr' });
                      UINotificationService.show({
                        title: 'Delete Report',
                        message: 'Failed to delete report',
                        type: 'error',
                      });
                    }
                    break;
                  case 'cancel':
                    UIDialogService.dismiss({ id: 'ds-reject-sr' });
                    break;
                }
              },
            },
          });
        };
      } else {
        thumbnailProps.canReject = false;
      }
    }

    array.push(thumbnailProps);
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

  // Iterate over each study...
  studyDisplayList.forEach(study => {
    // Find it's display sets
    const displaySetsForStudy = displaySets.filter(
      ds => ds.StudyInstanceUID === study.studyInstanceUid
    );

    // Sort them
    const sortedDisplaySetsForStudy = utils.sortBySeriesDate(
      displaySetsForStudy
    );

    /* Sort by series number, then by series date
      displaySetsForStudy.sort((a, b) => {
        if (a.seriesNumber !== b.seriesNumber) {
          return a.seriesNumber - b.seriesNumber;
        }

        const seriesDateA = Date.parse(a.seriesDate);
        const seriesDateB = Date.parse(b.seriesDate);

        return seriesDateA - seriesDateB;
      });
    */

    // Map the study to it's tab/view representation
    const tabStudy = Object.assign({}, study, {
      displaySets: displaySetsForStudy,
    });

    // Add the "tab study" to the 'primary', 'recent', and/or 'all' tab group(s)
    if (primaryStudyInstanceUIDs.includes(study.studyInstanceUid)) {
      primaryStudies.push(tabStudy);
      allStudies.push(tabStudy);
    } else {
      // TODO: Filter allStudies to dates within one year of current date
      recentStudies.push(tabStudy);
      allStudies.push(tabStudy);
    }
  });

  // Newest first
  const _byDate = (a, b) => {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);

    return dateB - dateA;
  };

  const tabs = [
    {
      name: 'primary',
      label: 'Primary',
      studies: primaryStudies.sort((studyA, studyB) =>
        _byDate(studyA.date, studyB.date)
      ),
    },
    {
      name: 'recent',
      label: 'Recent',
      studies: recentStudies.sort((studyA, studyB) =>
        _byDate(studyA.date, studyB.date)
      ),
    },
    {
      name: 'all',
      label: 'All',
      studies: allStudies.sort((studyA, studyB) =>
        _byDate(studyA.date, studyB.date)
      ),
    },
  ];

  return tabs;
}

function _findTabAndStudyOfDisplaySet(displaySetInstanceUID, tabs) {
  for (let t = 0; t < tabs.length; t++) {
    const { studies } = tabs[t];

    for (let s = 0; s < studies.length; s++) {
      const { displaySets } = studies[s];

      for (let d = 0; d < displaySets.length; d++) {
        const displaySet = displaySets[d];

        if (displaySet.displaySetInstanceUID === displaySetInstanceUID) {
          return {
            tabName: tabs[t].name,
            StudyInstanceUID: studies[s].studyInstanceUid,
          };
        }
      }
    }
  }
}
