import React, { useState, useEffect } from 'react';
import { useImageViewer } from '@ohif/ui';
import { useViewportGrid } from '@ohif/ui-next';
import { StudyBrowser } from '@ohif/ui-next';
import { utils } from '@ohif/core';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@ohif/ui-next';
import { PanelStudyBrowserHeader } from './PanelStudyBrowserHeader';
import { defaultActionIcons } from './constants';
import MoreDropdownMenu from '../../Components/MoreDropdownMenu';
import { DicomMetadataStore } from '@ohif/core';
import { viewPreset } from './types/viewPreset';

const { sortStudyInstances, formatDate, createStudyBrowserTabs } = utils;

// Define interface for component props
interface withAppTypes {
  servicesManager: any;
  getImageSrc: (imageId: string, options?: any) => Promise<string>;
  getStudiesForPatientByMRN: (studies: any) => Promise<any>;
  requestDisplaySetCreationForStudy: (displaySetService: any, StudyInstanceUID: string, madeInClient: boolean) => void;
  dataSource: any;
  commandsManager: any;
}

/**
 *
 * @param {*} param0
 */
function PanelStudyBrowser({
  servicesManager,
  getImageSrc,
  getStudiesForPatientByMRN,
  requestDisplaySetCreationForStudy,
  dataSource,
  commandsManager,
}: withAppTypes) {
  const { hangingProtocolService, displaySetService, uiNotificationService, customizationService } =
    servicesManager.services;
  const navigate = useNavigate();

  // Normally you nest the components so the tree isn't so deep, and the data
  // doesn't have to have such an intense shape. This works well enough for now.
  // Tabs --> Studies --> DisplaySets --> Thumbnails
  const { StudyInstanceUIDs } = useImageViewer();
  const [{ activeViewportId, viewports, isHangingProtocolLayout }, viewportGridService] =
    useViewportGrid();
  const [activeTabName, setActiveTabName] = useState('all');
  const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState([
    ...StudyInstanceUIDs,
  ]);
  const [hasLoadedViewports, setHasLoadedViewports] = useState(false);
  const [studyDisplayList, setStudyDisplayList] = useState([]);
  const [displaySets, setDisplaySets] = useState([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});

  const [viewPresets, setViewPresets] = useState<viewPreset[]>(
    customizationService.getCustomization('studyBrowser.viewPresets') || []
  );

  const [actionIcons, setActionIcons] = useState(defaultActionIcons);

  // Add a state for storing XNAT series metadata
  const [xnatSeriesMetadata, setXnatSeriesMetadata] = useState({});

  // multiple can be true or false
  const updateActionIconValue = actionIcon => {
    actionIcon.value = !actionIcon.value;
    const newActionIcons = [...actionIcons];
    setActionIcons(newActionIcons);
  };

  // only one is true at a time
  const updateViewPresetValue = viewPreset => {
    if (!viewPreset) {
      return;
    }
    
    if (Array.isArray(viewPresets)) {
      const newViewPresets = viewPresets.map(preset => {
        preset.selected = preset.id === viewPreset.id;
        return preset;
      });
      setViewPresets(newViewPresets);
    } else {
      console.warn('XNAT: viewPresets is not an array. Cannot update preset values.');
    }
  };

  const onDoubleClickThumbnailHandler = displaySetInstanceUID => {
    let updatedViewports = [];
    const viewportId = activeViewportId;
    try {
      updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        viewportId,
        displaySetInstanceUID,
        isHangingProtocolLayout
      );
    } catch (error) {
      console.warn(error);
      uiNotificationService.show({
        title: 'Thumbnail Double Click',
        message: 'The selected display sets could not be added to the viewport.',
        type: 'error',
        duration: 3000,
      });
    }

    viewportGridService.setDisplaySetsForViewports(updatedViewports);
  };

  // ~~ studyDisplayList
  useEffect(() => {
    // Fetch all studies for the patient in each primary study
    async function fetchStudiesForPatient(StudyInstanceUID) {
      // current study qido
      try {
        let qidoForStudyUID = [];
        if (dataSource && dataSource.query && typeof dataSource.query.studies?.search === 'function') {
          qidoForStudyUID = await dataSource.query.studies.search({
            studyInstanceUid: StudyInstanceUID,
          });
        } else {
          console.error('XNAT: dataSource.query.studies.search is not available');
          qidoForStudyUID = [];
        }

        if (!qidoForStudyUID?.length) {
          console.error('XNAT: Invalid study URL or no data returned for', StudyInstanceUID);
          navigate('/notfoundstudy');
          throw new Error('Invalid study URL');
        }

        let qidoStudiesForPatient = qidoForStudyUID;

        // try to fetch the prior studies based on the patientID if the
        // server can respond.
        try {
          if (typeof getStudiesForPatientByMRN === 'function') {
            qidoStudiesForPatient = await getStudiesForPatientByMRN(qidoForStudyUID);
          } else {
            console.warn('XNAT: getStudiesForPatientByMRN is not a function');
          }
        } catch (error) {
          console.warn('XNAT: Failed to get studies for patient by MRN:', error);
        }

        console.log('XNAT: Fetched studies for patient:', qidoStudiesForPatient);

        const mappedStudies = await _mapDataSourceStudies(qidoStudiesForPatient);
        console.log('XNAT: Mapped studies:', mappedStudies);

        // Force expand StudyInstanceUIDs when studies are loaded
        setExpandedStudyInstanceUIDs(prevExpanded => {
          const updated = [...prevExpanded];
          mappedStudies.forEach(study => {
            if (study.StudyInstanceUID && !updated.includes(study.StudyInstanceUID)) {
              updated.push(study.StudyInstanceUID);
              console.log('XNAT: Auto-expanding study', study.StudyInstanceUID);
            }
          });
          return updated;
        });

        const actuallyMappedStudies = mappedStudies.map(qidoStudy => {
          const study = {
            studyInstanceUid: qidoStudy.StudyInstanceUID,
            date: qidoStudy.StudyDate,
            description: qidoStudy.StudyDescription,
            modalities: qidoStudy.ModalitiesInStudy,
            numInstances: qidoStudy.NumInstances,
            // Add display fields
            displayStudyDate: qidoStudy.displayStudyDate || formatDate(qidoStudy.StudyDate),
            displayPatientName: qidoStudy.displayPatientName || qidoStudy.PatientName,
            displayStudyDescription: qidoStudy.displayStudyDescription || qidoStudy.StudyDescription
          };
          console.log('XNAT: Mapped study for display:', study);
          return study;
        });

        setStudyDisplayList(prevArray => {
          const ret = [...prevArray];
          for (const study of actuallyMappedStudies) {
            if (!prevArray.find(it => it.studyInstanceUid === study.studyInstanceUid)) {
              ret.push(study);
            }
          }
          return ret;
        });
      } catch (error) {
        console.error('XNAT: Error fetching study data:', error);
      }
    }

    StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(sid));
  }, [StudyInstanceUIDs, dataSource, getStudiesForPatientByMRN, navigate]);

  // // ~~ Initial Thumbnails
  useEffect(() => {
    if (!hasLoadedViewports) {
      if (activeViewportId) {
        // Once there is an active viewport id, it means the layout is ready
        // so wait a bit of time to allow the viewports preferential loading
        // which improves user experience of responsiveness significantly on slower
        // systems.
        window.setTimeout(() => setHasLoadedViewports(true), 250);
      }

      return;
    }

    const currentDisplaySets = displaySetService.activeDisplaySets;
    currentDisplaySets.forEach(async dSet => {
      const newImageSrcEntry = {};
      const displaySet = displaySetService.getDisplaySetByUID(dSet.displaySetInstanceUID);
      
      // Check if dataSource has getImageIdsForDisplaySet method
      let imageIds = [];
      if (dataSource && typeof dataSource.getImageIdsForDisplaySet === 'function') {
        imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
      } else {
        console.warn('XNAT: dataSource.getImageIdsForDisplaySet is not a function');
      }
      
      const imageId = imageIds && imageIds.length > 0 ? imageIds[Math.floor(imageIds.length / 2)] : null;

      // TODO: Is it okay that imageIds are not returned here for SR displaySets?
      if (!imageId || displaySet?.unsupported) {
        return;
      }

      // When the image arrives, render it and store the result in the thumbnailImgSrcMap
      try {
        if (typeof getImageSrc === 'function') {
          newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(imageId);
        } else {
          console.warn('XNAT: getImageSrc is not a function');
          newImageSrcEntry[dSet.displaySetInstanceUID] = '';
        }

        setThumbnailImageSrcMap(prevState => {
          return { ...prevState, ...newImageSrcEntry };
        });
      } catch (error) {
        console.error('XNAT: Error loading image for thumbnail', error);
      }
    });
  }, [
    StudyInstanceUIDs,
    dataSource,
    displaySetService,
    getImageSrc,
    hasLoadedViewports,
    activeViewportId,
  ]);

  // ~~ displaySets
  useEffect(() => {
    // TODO: Are we sure `activeDisplaySets` will always be accurate?
    const currentDisplaySets = displaySetService.activeDisplaySets;
    const mappedDisplaySets = _mapDisplaySets(currentDisplaySets, thumbnailImageSrcMap, xnatSeriesMetadata);
    sortStudyInstances(mappedDisplaySets);

    setDisplaySets(mappedDisplaySets);
  }, [StudyInstanceUIDs, thumbnailImageSrcMap, displaySetService, xnatSeriesMetadata]);

  // ~~ subscriptions --> displaySets
  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      data => {
        // for some reason this breaks thumbnail loading
        // if (!hasLoadedViewports) {
        //   return;
        // }
        const { displaySetsAdded } = data;
        
        // Log display sets added for debugging
        console.log('XNAT: Display sets added to service:', displaySetsAdded.length);
        
        displaySetsAdded.forEach(async dSet => {
          const newImageSrcEntry = {};
          const displaySet = displaySetService.getDisplaySetByUID(dSet.displaySetInstanceUID);
          
          if (displaySet?.unsupported) {
            console.log('XNAT: Skipping unsupported display set', displaySet);
            return;
          }

          // Ensure StudyInstanceUID is set on the display set
          if (!displaySet.StudyInstanceUID && sessionStorage.getItem('xnat_studyInstanceUID')) {
            displaySet.StudyInstanceUID = sessionStorage.getItem('xnat_studyInstanceUID');
            console.log('XNAT: Added missing StudyInstanceUID to display set', displaySet.displaySetInstanceUID);
          }

          // Check if dataSource has getImageIdsForDisplaySet method
          let imageIds = [];
          if (dataSource && typeof dataSource.getImageIdsForDisplaySet === 'function') {
            imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          } else {
            console.warn('XNAT: dataSource.getImageIdsForDisplaySet is not a function');
          }
          
          // If no imageIds, try another approach or skip
          if (!imageIds || imageIds.length === 0) {
            console.log('XNAT: No imageIds for display set', displaySet);
            return;
          }
          
          const imageId = imageIds[Math.floor(imageIds.length / 2)];

          // TODO: Is it okay that imageIds are not returned here for SR displaySets?
          if (!imageId) {
            console.log('XNAT: No image ID selected for display set', displaySet);
            return;
          }
          
          // When the image arrives, render it and store the result in the thumbnailImgSrcMap
          try {
            if (typeof getImageSrc === 'function') {
              newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(
                imageId,
                dSet.initialViewport
              );
            } else {
              console.warn('XNAT: getImageSrc is not a function');
              newImageSrcEntry[dSet.displaySetInstanceUID] = '';
            }
            
            setThumbnailImageSrcMap(prevState => {
              return { ...prevState, ...newImageSrcEntry };
            });
          } catch (error) {
            console.error('XNAT: Error loading image for thumbnail', error);
          }
        });
      }
    );

    return () => {
      SubscriptionDisplaySetsAdded.unsubscribe();
    };
  }, [getImageSrc, dataSource, displaySetService]);

  useEffect(() => {
    // TODO: Will this always hold _all_ the displaySets we care about?
    // DISPLAY_SETS_CHANGED returns `DisplaySerService.activeDisplaySets`
    const SubscriptionDisplaySetsChanged = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      changedDisplaySets => {
        const mappedDisplaySets = _mapDisplaySets(changedDisplaySets, thumbnailImageSrcMap, xnatSeriesMetadata);
        setDisplaySets(mappedDisplaySets);
      }
    );

    const SubscriptionDisplaySetMetaDataInvalidated = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      () => {
        const mappedDisplaySets = _mapDisplaySets(
          displaySetService.getActiveDisplaySets(),
          thumbnailImageSrcMap,
          xnatSeriesMetadata
        );

        setDisplaySets(mappedDisplaySets);
      }
    );

    return () => {
      SubscriptionDisplaySetsChanged.unsubscribe();
      SubscriptionDisplaySetMetaDataInvalidated.unsubscribe();
    };
  }, [StudyInstanceUIDs, thumbnailImageSrcMap, displaySetService, xnatSeriesMetadata]);

  // Add this useEffect to directly capture series metadata from the XNAT API response
  useEffect(() => {
    // Define a handler function to intercept and process XNAT API responses
    function processXNATResponse(event) {
      try {
        if (typeof event.data !== 'string') return;
        
        // Try to parse response as JSON
        const data = JSON.parse(event.data);
        
        // Check if this looks like an XNAT response
        if (data.transactionId && data.transactionId.startsWith('XNAT_') && Array.isArray(data.studies)) {
          console.log('XNAT: Captured direct API response with transaction ID:', data.transactionId);
          
          // Process each study in the response
          data.studies.forEach(study => {
            if (Array.isArray(study.series)) {
              const seriesMap = {};
              
              // Extract series metadata
              study.series.forEach(series => {
                if (series.SeriesInstanceUID) {
                  seriesMap[series.SeriesInstanceUID] = {
                    SeriesDescription: series.SeriesDescription,
                    SeriesNumber: series.SeriesNumber,
                    Modality: series.Modality,
                    SeriesDate: series.SeriesDate,
                    SeriesTime: series.SeriesTime
                  };
                  
                  // Also store any instance metadata if available
                  if (Array.isArray(series.instances) && series.instances.length > 0) {
                    const instance = series.instances[0];
                    if (instance.metadata) {
                      seriesMap[series.SeriesInstanceUID].instanceMetadata = instance.metadata;
                    }
                  }
                }
              });
              
              console.log(`XNAT: Extracted metadata for ${Object.keys(seriesMap).length} series from direct API response`);
              
              // Update the series metadata state
              if (Object.keys(seriesMap).length > 0) {
                setXnatSeriesMetadata(prevState => ({
                  ...prevState,
                  ...seriesMap
                }));
              }
            }
          });
        }
      } catch (error) {
        // Ignore parsing errors, not all messages will be valid JSON
      }
    }
    
    // Add the event listener
    window.addEventListener('message', processXNATResponse);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('message', processXNATResponse);
    };
  }, []);
  
  // Add a function to extract series metadata from the dataSource
  async function extractSeriesMetadataFromDataSource() {
    if (!dataSource || !StudyInstanceUIDs || StudyInstanceUIDs.length === 0) return;
    
    console.log('XNAT: Attempting to extract series metadata from dataSource');
    
    try {
      // Try to access the raw data in the dataSource if available
      if (typeof dataSource.getRawStudyData === 'function') {
        for (const studyUID of StudyInstanceUIDs) {
          const rawData = await dataSource.getRawStudyData(studyUID);
          if (rawData) {
            console.log('XNAT: Found raw study data:', rawData);
            
            // Check for series data in different possible formats
            const seriesData = 
              rawData.series || 
              (rawData.studies && rawData.studies[0] && rawData.studies[0].series) ||
              [];
              
            if (Array.isArray(seriesData) && seriesData.length > 0) {
              const seriesMap = {};
              
              seriesData.forEach(series => {
                if (series.SeriesInstanceUID) {
                  seriesMap[series.SeriesInstanceUID] = {
                    SeriesDescription: series.SeriesDescription,
                    SeriesNumber: series.SeriesNumber,
                    Modality: series.Modality
                  };
                }
              });
              
              console.log(`XNAT: Extracted metadata for ${Object.keys(seriesMap).length} series from raw data`);
              
              // Update the state with the new metadata
              if (Object.keys(seriesMap).length > 0) {
                setXnatSeriesMetadata(prevState => ({
                  ...prevState,
                  ...seriesMap
                }));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('XNAT: Error extracting series metadata from dataSource:', error);
    }
  }

  // Add this useEffect to fetch XNAT series metadata using multiple methods
  useEffect(() => {
    // Function to fetch series metadata from XNAT
    async function fetchXNATSeriesMetadata() {
      if (!StudyInstanceUIDs || StudyInstanceUIDs.length === 0) {
        return;
      }

      console.log('XNAT: Fetching series metadata from XNAT API');
      
      try {
        // Try our data source extraction function first
        await extractSeriesMetadataFromDataSource();
        
        // Check if dataSource has the getSeriesMetadata method
        if (dataSource && typeof dataSource.getSeriesMetadata === 'function') {
          // Call dataSource method to get metadata for each study
          for (const studyUID of StudyInstanceUIDs) {
            const metadata = await dataSource.getSeriesMetadata(studyUID);
            if (metadata && Array.isArray(metadata.series)) {
              const seriesMap = {};
              
              // Map series by SeriesInstanceUID
              metadata.series.forEach(series => {
                if (series.SeriesInstanceUID) {
                  seriesMap[series.SeriesInstanceUID] = series;
                }
              });
              
              console.log(`XNAT: Retrieved metadata for ${Object.keys(seriesMap).length} series from XNAT API`);
              
              // Update the state with the new metadata
              setXnatSeriesMetadata(prevState => ({
                ...prevState,
                ...seriesMap
              }));
            }
          }
        } else if (dataSource && dataSource.query && typeof dataSource.query.series?.search === 'function') {
          // Alternative approach using the search API
          for (const studyUID of StudyInstanceUIDs) {
            const series = await dataSource.query.series.search({
              studyInstanceUid: studyUID
            });
            
            if (series && Array.isArray(series)) {
              const seriesMap = {};
              
              // Map series by SeriesInstanceUID
              series.forEach(s => {
                if (s.SeriesInstanceUID) {
                  seriesMap[s.SeriesInstanceUID] = s;
                }
              });
              
              console.log(`XNAT: Retrieved metadata for ${Object.keys(seriesMap).length} series from query API`);
              
              // Update the state with the new metadata
              setXnatSeriesMetadata(prevState => ({
                ...prevState,
                ...seriesMap
              }));
            }
          }
        }
      } catch (error) {
        console.error('XNAT: Error fetching series metadata:', error);
      }
    }

    // Call the function to fetch metadata
    fetchXNATSeriesMetadata();
  }, [StudyInstanceUIDs, dataSource]);

  const tabs = createStudyBrowserTabs(StudyInstanceUIDs, studyDisplayList, displaySets);

  // TODO: Should not fire this on "close"
  function _handleStudyClick(StudyInstanceUID) {
    // Debug the click
    console.log('XNAT: Study clicked:', StudyInstanceUID);
    
    // Guard against undefined StudyInstanceUID
    if (!StudyInstanceUID) {
      console.warn('XNAT: Attempted to click on study with undefined StudyInstanceUID');
      return;
    }

    const shouldCollapseStudy = expandedStudyInstanceUIDs.includes(StudyInstanceUID);
    const updatedExpandedStudyInstanceUIDs = shouldCollapseStudy
      ? [...expandedStudyInstanceUIDs.filter(stdyUid => stdyUid !== StudyInstanceUID)]
      : [...expandedStudyInstanceUIDs, StudyInstanceUID];

    setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);
    console.log('XNAT: Expanded studies:', updatedExpandedStudyInstanceUIDs);

    // Always request display sets for the study, regardless of collapse state
    // Store the StudyInstanceUID in sessionStorage for later use
    try {
      sessionStorage.setItem('xnat_studyInstanceUID', StudyInstanceUID);
      console.log(`XNAT: Stored StudyInstanceUID in sessionStorage: ${StudyInstanceUID}`);
    } catch (e) {
      console.warn('XNAT: Failed to store StudyInstanceUID in sessionStorage:', e);
    }

    const madeInClient = true;
    
    // Check if requestDisplaySetCreationForStudy is actually a function
    if (typeof requestDisplaySetCreationForStudy === 'function') {
      // Always create display sets when study is clicked
      console.log('XNAT: Calling requestDisplaySetCreationForStudy with:', {
        StudyInstanceUID, 
        madeInClient
      });
      
      requestDisplaySetCreationForStudy(displaySetService, StudyInstanceUID, madeInClient);
    } else {
      console.error('XNAT: requestDisplaySetCreationForStudy is not a function:', requestDisplaySetCreationForStudy);
    }
  }

  const activeDisplaySetInstanceUIDs = viewports.get(activeViewportId)?.displaySetInstanceUIDs;

  const getStudyDisplayDate = (studyData) => {
    // Debug study data to identify the issue
    console.log('XNAT: getStudyDisplayDate called for study:', {
      StudyInstanceUID: studyData.StudyInstanceUID || studyData.studyInstanceUid,
      StudyDate: studyData.StudyDate || studyData.date,
      hasInstancesArray: !!studyData.instances
    });
    
    // First try getting it from study metadata directly
    if (studyData && (studyData.StudyDate || studyData.date)) {
      const dateStr = studyData.StudyDate || studyData.date;
      console.log('XNAT: Using study date from studyData:', dateStr);
      return formatDate(dateStr);
    }
    
    // Check instances if they have the date
    if (studyData.instances && studyData.instances.length > 0) {
      const instance = studyData.instances[0];
      if (instance.metadata && instance.metadata.StudyDate) {
        console.log('XNAT: Using study date from instance metadata:', instance.metadata.StudyDate);
        return formatDate(instance.metadata.StudyDate);
      }
    }
    
    // Try to extract from DicomMetadataStore if available
    const studyMetadata = DicomMetadataStore.getStudy(studyData.StudyInstanceUID || studyData.studyInstanceUid);
    if (studyMetadata && studyMetadata.StudyDate) {
      console.log('XNAT: Using study date from DicomMetadataStore:', studyMetadata.StudyDate);
      return formatDate(studyMetadata.StudyDate);
    }
    
    // Try from sessionStorage as last resort
    const storedDate = sessionStorage.getItem('xnat_studyDate');
    if (storedDate) {
      console.log('XNAT: Using study date from sessionStorage:', storedDate);
      return formatDate(storedDate);
    }
    
    // If we reach here, we couldn't find a date
    console.warn('XNAT: No study date found for study', studyData.StudyInstanceUID || studyData.studyInstanceUid);
    return 'No Study Date';
  };

  return (
    <>
      <>
        <PanelStudyBrowserHeader
          viewPresets={viewPresets}
          updateViewPresetValue={updateViewPresetValue}
          actionIcons={actionIcons}
          updateActionIconValue={updateActionIconValue}
        />
        <Separator
          orientation="horizontal"
          className="bg-black"
          thickness="2px"
        />
      </>

      <StudyBrowser
        tabs={tabs}
        servicesManager={servicesManager}
        activeTabName={activeTabName}
        expandedStudyInstanceUIDs={expandedStudyInstanceUIDs}
        onClickStudy={_handleStudyClick}
        onClickTab={clickedTabName => {
          setActiveTabName(clickedTabName);
        }}
        onClickThumbnail={() => {}}
        onDoubleClickThumbnail={onDoubleClickThumbnailHandler}
        activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
        showSettings={actionIcons.find(icon => icon.id === 'settings').value}
        viewPresets={viewPresets}
        ThumbnailMenuItems={MoreDropdownMenu({
          commandsManager,
          servicesManager,
          menuItemsKey: 'studyBrowser.thumbnailMenuItems',
        })}
        StudyMenuItems={MoreDropdownMenu({
          commandsManager,
          servicesManager,
          menuItemsKey: 'studyBrowser.studyMenuItems',
        })}
        getStudyDisplayDate={getStudyDisplayDate}
        getStudyDisplayName={study => study.displayPatientName || study.PatientName}
        getStudyDisplayDescription={study => study.displayStudyDescription || study.StudyDescription}
      />
    </>
  );
}

export default PanelStudyBrowser;

/**
 * Maps from the DataSource's format to a naturalized object
 *
 * @param {*} studies
 */
async function _mapDataSourceStudies(studies) {
  const mappedStudies = await Promise.all(studies.map(async study => {
    // Get current date/time as fallback
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const defaultTime = now.toTimeString().slice(0, 8).replace(/:/g, '');

    // Try to get study date from sessionStorage if not in study object
    const storedDate = sessionStorage.getItem('xnat_studyDate');
    const storedTime = sessionStorage.getItem('xnat_studyTime');

    console.log('XNAT: Mapping study data:', {
      study,
      storedDate,
      storedTime,
      defaultDate,
      defaultTime
    });

    const studyDate = study.date || study.StudyDate || storedDate || defaultDate;
    const studyTime = study.time || study.StudyTime || storedTime || defaultTime;
    
    // Ensure we have a valid StudyInstanceUID and store it for future use
    const studyInstanceUID = study.studyInstanceUid || study.StudyInstanceUID;
    if (studyInstanceUID) {
      try {
        sessionStorage.setItem('xnat_studyInstanceUID', studyInstanceUID);
        console.log('XNAT: Stored StudyInstanceUID during mapping:', studyInstanceUID);
      } catch (e) {
        console.warn('XNAT: Failed to store StudyInstanceUID in sessionStorage:', e);
      }
    }
    
    // If we have a study date, store it for future reference
    if (studyDate) {
      try {
        sessionStorage.setItem('xnat_studyDate', studyDate);
        console.log('XNAT: Stored study date:', studyDate);
      } catch (e) {
        console.warn('XNAT: Failed to store study date in sessionStorage:', e);
      }
    }
    
    // Format the date for display
    let displayStudyDate;
    try {
      displayStudyDate = formatDate(studyDate);
      console.log('XNAT: Formatted study date:', studyDate, 'to', displayStudyDate);
    } catch (error) {
      console.error('XNAT: Error formatting study date:', error);
      displayStudyDate = 'Invalid Date';
    }

    return {
      AccessionNumber: study.accession || study.AccessionNumber || '',
      StudyDate: studyDate,
      StudyDescription: study.description || study.StudyDescription || '',
      NumInstances: study.instances || study.NumInstances || 0,
      ModalitiesInStudy: study.modalities || study.ModalitiesInStudy || [],
      PatientID: study.mrn || study.PatientID || '',
      PatientName: study.patientName || study.PatientName || '',
      StudyInstanceUID: studyInstanceUID,
      StudyTime: studyTime,
      // Add display fields for the UI
      displayStudyDate: displayStudyDate,
      displayPatientName: study.patientName || study.PatientName || '',
      displayStudyDescription: study.description || study.StudyDescription || '',
    };
  }));

  return mappedStudies;
}

/**
 * Deeply inspects an instance object to find DICOM tags in various locations
 * @param {Object} instance - The DICOM instance object
 * @param {string} tagName - The DICOM tag name to look for (e.g., 'SeriesDescription')
 * @param {string} tagId - The DICOM tag ID as string (e.g., '0008103E' for SeriesDescription)
 * @returns {string|null} - The found value or null
 */
function findDicomTag(instance, tagName, tagId) {
  if (!instance) return null;
  
  // Common tag IDs for reference
  const tagIds = {
    'SeriesDescription': '0008103E',
    'SeriesNumber': '00200011',
    'Modality': '00080060',
    'ProtocolName': '00181030',
    'SequenceName': '00180024'
  };
  
  // Use provided tagId or lookup from map
  const actualTagId = tagId || tagIds[tagName] || '';
  
  // A value to return if found
  let foundValue = null;
  
  // Direct property access
  if (instance[tagName] !== undefined) {
    return instance[tagName];
  }
  
  // Check metadata
  if (instance.metadata) {
    // Direct property on metadata
    if (instance.metadata[tagName] !== undefined) {
      return instance.metadata[tagName];
    }
    
    // Try lowercase version
    if (instance.metadata[tagName.toLowerCase()] !== undefined) {
      return instance.metadata[tagName.toLowerCase()];
    }
    
    // Check if it's in a metadata.elements structure (common in OHIF)
    if (instance.metadata.elements && instance.metadata.elements[actualTagId]) {
      const element = instance.metadata.elements[actualTagId];
      if (element.Value) return element.Value[0];
    }
  }
  
  // Check _instance
  if (instance._instance) {
    if (instance._instance[tagName] !== undefined) {
      return instance._instance[tagName];
    }
    
    // Try lowercase version
    if (instance._instance[tagName.toLowerCase()] !== undefined) {
      return instance._instance[tagName.toLowerCase()];
    }
  }
  
  // Check DICOM dataset if available
  if (instance.dataset) {
    if (typeof instance.dataset.string === 'function') {
      try {
        if (actualTagId) {
          foundValue = instance.dataset.string('x' + actualTagId);
          if (foundValue) return foundValue;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Direct property on dataset
    if (instance.dataset[tagName] !== undefined) {
      return instance.dataset[tagName];
    }
  }
  
  // Check any data property
  if (instance.data) {
    if (instance.data[tagName] !== undefined) {
      return instance.data[tagName];
    }
    
    // Some implementations nest it deeper
    if (instance.data.elements && instance.data.elements[actualTagId]) {
      const element = instance.data.elements[actualTagId];
      if (element.Value) return element.Value[0];
    }
  }
  
  // Check for raw DICOM tags object
  if (instance.tags) {
    if (instance.tags[actualTagId] !== undefined) {
      const tag = instance.tags[actualTagId];
      return tag.Value ? tag.Value[0] : tag;
    }
  }
  
  // Look at all dicomJSON style objects
  const possibleTagContainers = [
    instance, 
    instance.metadata, 
    instance._instance, 
    instance.dataset,
    instance.data
  ];
  
  for (const container of possibleTagContainers) {
    if (!container) continue;
    
    // Check dicomElements structure
    if (container.dicomElements) {
      const element = container.dicomElements[actualTagId] || container.dicomElements[tagName];
      if (element) {
        if (element.Value) return element.Value[0];
        return element;
      }
    }
    
    // Check for 00080103E style DICOM tag access
    if (actualTagId && container[actualTagId] !== undefined) {
      return container[actualTagId];
    }
  }
  
  return null;
}

/**
 * Attempts to extract DICOM tags directly from cornerstone metadata
 * This is a more direct approach that might work when other methods fail
 * @param {Object} instance - The instance object
 * @param {string} tagName - Name of the tag to find (e.g. SeriesDescription)
 * @returns {string|null} - The value or null if not found
 */
function extractTagFromCornerstone(instance, tagName) {
  if (!instance) return null;
  
  // Tag mappings for cornerstone
  const tagMappings = {
    'SeriesDescription': { tag: '0008,103E', keyword: 'SeriesDescription' },
    'SeriesNumber': { tag: '0020,0011', keyword: 'SeriesNumber' },
    'Modality': { tag: '0008,0060', keyword: 'Modality' },
    'StudyDescription': { tag: '0008,1030', keyword: 'StudyDescription' },
    'PatientName': { tag: '0010,0010', keyword: 'PatientName' },
    'PatientID': { tag: '0010,0020', keyword: 'PatientID' },
    'SeriesInstanceUID': { tag: '0020,000E', keyword: 'SeriesInstanceUID' },
    'SOPInstanceUID': { tag: '0008,0018', keyword: 'SOPInstanceUID' },
    'StudyInstanceUID': { tag: '0020,000D', keyword: 'StudyInstanceUID' }
  };
  
  // If we don't have a mapping for this tag, return null
  if (!tagMappings[tagName]) return null;
  
  const tagInfo = tagMappings[tagName];
  
  // Try various paths where cornerstone metadata might be found
  const paths = [
    'metadata',
    '_instance',
    'data',
    'dataset',
    ''  // instance itself
  ];
  
  for (const path of paths) {
    const obj = path ? instance[path] : instance;
    if (!obj) continue;
    
    // Explicit cornerstone metadata format
    if (obj.Elements) {
      const tagKey = tagInfo.tag.replace(',', '');
      if (obj.Elements[tagKey]) {
        return obj.Elements[tagKey].Value;
      }
    }
    
    // Standard DICOM JSON format
    if (obj[tagInfo.tag]) {
      const element = obj[tagInfo.tag];
      if (typeof element === 'string') return element;
      if (element.Value) return element.Value[0];
      if (element.value) return element.value;
    }
    
    // Try the keyword directly
    if (obj[tagInfo.keyword]) {
      return obj[tagInfo.keyword];
    }
    
    // Try alternative formats that might be used
    if (obj.elements && obj.elements[tagInfo.tag.replace(',', '')]) {
      const element = obj.elements[tagInfo.tag.replace(',', '')];
      if (element.Value) return element.Value[0];
    }
    
    // Some cornerstone implementations use a parsedDicomData structure
    if (obj.parsedDicomData) {
      const tagKey = tagInfo.tag.replace(',', '');
      if (obj.parsedDicomData[tagKey]) {
        const element = obj.parsedDicomData[tagKey];
        if (element.Value) return element.Value[0];
      }
    }
  }
  
  return null;
}

function _mapDisplaySets(displaySets, thumbnailImageSrcMap, xnatSeriesMetadataMap = {}) {
  const thumbnailDisplaySets = [];
  const thumbnailNoImageDisplaySets = [];

  // Log the number of display sets for debugging
  console.log('XNAT: Mapping display sets to UI. Count:', displaySets.length);

  // If first time, dump full info for first display set to help debugging
  if (displaySets.length > 0) {
    const firstDs = displaySets[0];
    console.log('XNAT: First display set keys:', Object.keys(firstDs));
    console.log('XNAT: First display set:', firstDs);
    
    // Add more detailed logging of the display set fields we're interested in
    console.log('XNAT: Detailed display set fields:', {
      SeriesDate: firstDs.SeriesDate,
      SeriesTime: firstDs.SeriesTime,
      SeriesDescription: firstDs.SeriesDescription,
      SeriesNumber: firstDs.SeriesNumber,
      Modality: firstDs.Modality,
      StudyDate: firstDs.StudyDate,
      PatientID: firstDs.PatientID,
      PatientName: firstDs.PatientName
    });
    
    if (firstDs.images && firstDs.images.length > 0) {
      console.log('XNAT: Display set has images array with length:', firstDs.images.length);
    }
    if (firstDs.instances && firstDs.instances.length > 0) {
      console.log('XNAT: First instance keys:', Object.keys(firstDs.instances[0]));
      if (firstDs.instances[0].metadata) {
        console.log('XNAT: First instance metadata keys:', Object.keys(firstDs.instances[0].metadata));
      }
    }
  }
  
  displaySets
    .filter(ds => !ds.excludeFromThumbnailBrowser)
    .forEach(ds => {
      const imageSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];
      const componentType = _getComponentType(ds);

      // Debug any missing fields
      if (!ds.StudyInstanceUID) {
        console.warn('XNAT: Display set missing StudyInstanceUID', ds);
      }
      
      // Try to extract SeriesDescription from multiple possible locations
      let seriesDescription = ds.SeriesDescription;
      let seriesNumber = ds.SeriesNumber || '';
      let modality = ds.Modality || '';
      const displaySetUID = ds.displaySetInstanceUID || 'unknown';
      const seriesInstanceUID = ds.SeriesInstanceUID;
      
      // Debug output full display set for first one to see structure
      if (displaySets.indexOf(ds) === 0) {
        safeLog(`XNAT: Example display set structure for ${displaySetUID}`, ds);
      }
      
      // Check if we have metadata from XNAT API
      if (!seriesDescription && seriesInstanceUID && xnatSeriesMetadataMap[seriesInstanceUID]) {
        const xnatMetadata = xnatSeriesMetadataMap[seriesInstanceUID];
        if (typeof xnatMetadata === 'object') {
          seriesDescription = xnatMetadata.SeriesDescription;
          if (!seriesNumber) seriesNumber = xnatMetadata.SeriesNumber;
          if (!modality) modality = xnatMetadata.Modality;
          
          if (seriesDescription) {
            console.log(`XNAT: Using SeriesDescription "${seriesDescription}" from XNAT API metadata for ${displaySetUID}`);
          }
        }
      }
      
      // Debug output to see what we're working with
      console.log(`XNAT: Finding SeriesDescription for set ${displaySetUID}. Direct property:`, seriesDescription);
      
      // Try the direct cornerstone metadata format if available
      if (!seriesDescription) {
        // For SeriesDescription - tag is 0008103E
        seriesDescription = getCornerstoneMetadata(ds, '0008103E');
        if (seriesDescription) {
          console.log(`XNAT: Found SeriesDescription "${seriesDescription}" from cornerstone format metadata for ${displaySetUID}`);
        }
        
        // Also get series number and modality if available
        if (!seriesNumber) {
          seriesNumber = getCornerstoneMetadata(ds, '00200011') || '';
        }
        
        if (!modality) {
          modality = getCornerstoneMetadata(ds, '00080060') || '';
        }
      }
      
      // If not in the main object, try to extract from instances
      if ((!seriesDescription || !seriesNumber || !modality) && ds.instances && ds.instances.length > 0) {
        const firstInstance = ds.instances[0];
        
        // Log key properties of the first instance in a structured way
        const instanceMetadata = extractDebugMetadata(firstInstance);
        safeLog(`XNAT: First instance metadata for ${displaySetUID}`, instanceMetadata);
        
        // Use our deep inspection function
        const deepMetadata = inspectMetadataDeep(firstInstance);
        if (deepMetadata.found && deepMetadata.SeriesDescription) {
          seriesDescription = deepMetadata.SeriesDescription;
          console.log(`XNAT: Found SeriesDescription "${seriesDescription}" using deep inspection from ${deepMetadata.source} for ${displaySetUID}`);
          
          // Also use the other metadata if available
          if (!seriesNumber && deepMetadata.SeriesNumber) {
            seriesNumber = deepMetadata.SeriesNumber;
          }
          
          if (!modality && deepMetadata.Modality) {
            modality = deepMetadata.Modality;
          }
        } else {
          // Try a more aggressive approach - look at all properties recursively
          if (firstInstance.metadata) {
            // Stringify and then parse to deal with potential circular references
            try {
              const metadataStr = JSON.stringify(firstInstance.metadata);
              if (metadataStr.includes('SeriesDescription')) {
                console.log('XNAT: Found SeriesDescription in stringified metadata, but unable to extract properly');
                
                // Try to find it with a regex
                const match = metadataStr.match(/"SeriesDescription":"([^"]+)"/);
                if (match && match[1]) {
                  seriesDescription = match[1];
                  console.log(`XNAT: Extracted SeriesDescription "${seriesDescription}" using regex for ${displaySetUID}`);
                }
              }
            } catch (e) {
              console.warn('XNAT: Error stringifying metadata:', e);
            }
          }
          
          // If we still don't have it, continue with previous methods
          if (!seriesDescription) {
            // First try our cornerstone extractor
            seriesDescription = extractTagFromCornerstone(firstInstance, 'SeriesDescription');
            if (seriesDescription) {
              console.log(`XNAT: Found SeriesDescription "${seriesDescription}" using cornerstone extractor for ${displaySetUID}`);
            }
          }
          
          // If that failed, use our generic helper
          if (!seriesDescription) {
            seriesDescription = findDicomTag(firstInstance, 'SeriesDescription', '0008103E');
            if (seriesDescription) {
              console.log(`XNAT: Found SeriesDescription "${seriesDescription}" using tag finder for ${displaySetUID}`);
            }
          }
          
          // Also get SeriesNumber and Modality if missing
          if (!seriesNumber) {
            seriesNumber = extractTagFromCornerstone(firstInstance, 'SeriesNumber') || 
                          findDicomTag(firstInstance, 'SeriesNumber', '00200011') || '';
          }
          
          if (!modality) {
            modality = extractTagFromCornerstone(firstInstance, 'Modality') || 
                      findDicomTag(firstInstance, 'Modality', '00080060') || '';
          }
        }
      }
      
      // If still no SeriesDescription, try to use descriptive fields from DicomMetadataStore
      if (!seriesDescription && seriesInstanceUID) {
        try {
          const seriesMetadata = DicomMetadataStore.getSeries(ds.StudyInstanceUID, seriesInstanceUID);
          if (seriesMetadata) {
            seriesDescription = seriesMetadata.SeriesDescription;
            if (!seriesNumber) seriesNumber = seriesMetadata.SeriesNumber || '';
            if (!modality) modality = seriesMetadata.Modality || '';
            
            if (seriesDescription) {
              console.log(`XNAT: Using SeriesDescription "${seriesDescription}" from DicomMetadataStore for ${displaySetUID}`);
            }
          }
        } catch (error) {
          console.warn('XNAT: Error getting series metadata from DicomMetadataStore:', error);
        }
      }
      
      // Try to look up directly from the DicomMetadataStore at the instance level
      if (!seriesDescription && seriesInstanceUID && ds.StudyInstanceUID) {
        try {
          // Get all instances for this series
          // DicomMetadataStore.getInstances doesn't exist, trying alternative methods
          const series = DicomMetadataStore.getSeries(ds.StudyInstanceUID, seriesInstanceUID);
          if (series && series.instances && series.instances.length > 0) {
            // Check if we have SeriesDescription directly in the series
            if (series.SeriesDescription) {
              seriesDescription = series.SeriesDescription;
              console.log(`XNAT: Found SeriesDescription "${seriesDescription}" in DicomMetadataStore series for ${displaySetUID}`);
            }
            
            // Check the first instance
            const firstInst = series.instances[0];
            if (firstInst && firstInst.SeriesDescription) {
              seriesDescription = firstInst.SeriesDescription;
              console.log(`XNAT: Found SeriesDescription "${seriesDescription}" in DicomMetadataStore instance for ${displaySetUID}`);
            }
            
            // Also get SeriesNumber and Modality if missing
            if (!seriesNumber) {
              seriesNumber = series.SeriesNumber || (firstInst && firstInst.SeriesNumber) || '';
            }
            
            if (!modality) {
              modality = series.Modality || (firstInst && firstInst.Modality) || '';
            }
          }
        } catch (error) {
          console.warn('XNAT: Error accessing DicomMetadataStore series:', error);
        }
      }
      
      // If still no SeriesDescription, try to build one from SeriesNumber and Modality
      if (!seriesDescription) {
        if (seriesNumber && modality) {
          seriesDescription = `${modality} - Series ${seriesNumber}`;
          console.log(`XNAT: Created SeriesDescription "${seriesDescription}" from series tags for ${displaySetUID}`);
        } else {
          // Last resort - try to get protocol name or any identifying information
          if (ds.instances && ds.instances.length > 0) {
            const instance = ds.instances[0];
            const protocolName = extractTagFromCornerstone(instance, 'ProtocolName') || 
                                findDicomTag(instance, 'ProtocolName', '00181030');
            const sequenceName = findDicomTag(instance, 'SequenceName', '00180024');
            const seriesType = findDicomTag(instance, 'SeriesType', '00400011');
            
            if (protocolName) {
              seriesDescription = protocolName;
              console.log(`XNAT: Using ProtocolName "${seriesDescription}" for ${displaySetUID}`);
            } else if (sequenceName) {
              seriesDescription = sequenceName;
              console.log(`XNAT: Using SequenceName "${seriesDescription}" for ${displaySetUID}`);
            } else if (seriesType) {
              seriesDescription = seriesType;
              console.log(`XNAT: Using SeriesType "${seriesDescription}" for ${displaySetUID}`);
            } else {
              console.log(`XNAT: Display set ${displaySetUID} missing all descriptive tags. Using default with SeriesInstanceUID.`);
              // Use the last part of the SeriesInstanceUID as an identifier
              if (seriesInstanceUID) {
                const lastSection = seriesInstanceUID.split('.').pop();
                seriesDescription = `Series ${lastSection}`;
              } else {
                seriesDescription = 'Unknown Series';
              }
            }
          } else {
            console.log(`XNAT: Display set ${displaySetUID} missing SeriesDescription. Using default.`);
            seriesDescription = 'Unknown Series';
          }
        }
      }

      const array =
        componentType === 'thumbnail' ? thumbnailDisplaySets : thumbnailNoImageDisplaySets;

      array.push({
        displaySetInstanceUID: ds.displaySetInstanceUID,
        description: seriesDescription,
        seriesNumber: seriesNumber || '',
        modality: modality || '',
        seriesDate: ds.SeriesDate || '',
        seriesTime: ds.SeriesTime || '',
        numInstances: ds.numImageFrames || 0,
        countIcon: ds.countIcon,
        StudyInstanceUID: ds.StudyInstanceUID,
        messages: ds.messages,
        componentType,
        imageSrc,
        dragData: {
          type: 'displayset',
          displaySetInstanceUID: ds.displaySetInstanceUID,
          // .. Any other data to pass
        },
        isHydratedForDerivedDisplaySet: ds.isHydrated,
      });
    });

  console.log('XNAT: Mapped displaySets for UI:', thumbnailDisplaySets.length + thumbnailNoImageDisplaySets.length);
  return [...thumbnailDisplaySets, ...thumbnailNoImageDisplaySets];
}

const thumbnailNoImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

function _getComponentType(ds) {
  if (thumbnailNoImageModalities.includes(ds.Modality) || ds?.unsupported) {
    // TODO probably others.
    return 'thumbnailNoImage';
  }

  return 'thumbnail';
}

// Add utility functions

/**
 * Safely logs objects, handling circular references and large arrays
 * @param {string} prefix - Log prefix
 * @param {any} obj - Object to log
 */
function safeLog(prefix: string, obj: any): void {
  try {
    const cache = new WeakSet();
    const safeObj = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Handle circular references
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
        
        // Handle large arrays
        if (Array.isArray(value) && value.length > 10) {
          return `[Array with ${value.length} items]`;
        }
      }
      return value;
    }, 2);
    
    if (safeObj.length > 500) {
      console.log(`${prefix} (truncated):`, safeObj.substring(0, 500) + '...');
    } else {
      console.log(`${prefix}:`, safeObj);
    }
  } catch (error) {
    console.log(`${prefix} (not serializable):`, Object.keys(obj));
  }
}

/**
 * Extracts important DICOM metadata from an instance for debugging
 * @param {Object} instance - DICOM instance
 * @returns {Record<string, any>} - Simplified metadata object
 */
function extractDebugMetadata(instance: any): Record<string, any> {
  if (!instance) return {};
  
  // Extract key fields
  const metadata: Record<string, any> = {};
  
  // Common DICOM fields to extract for debugging
  const fieldsToExtract = [
    'SeriesDescription', 'SeriesNumber', 'Modality', 'ProtocolName',
    'SeriesInstanceUID', 'SOPInstanceUID', 'StudyInstanceUID',
    'PatientName', 'PatientID', 'StudyDescription', 'StudyDate',
    'SequenceName', 'ImageType'
  ];
  
  // First try standard access
  fieldsToExtract.forEach(field => {
    const value = findDicomTag(instance, field, '');
    if (value) {
      metadata[field] = value;
    }
  });

  // Then check for metadata in instance
  if (instance.metadata) {
    metadata.hasMetadata = true;
    
    // Direct access to metadata fields
    fieldsToExtract.forEach(field => {
      if (!metadata[field] && instance.metadata[field] !== undefined) {
        metadata[field] = instance.metadata[field];
      }
    });
    
    // Record available keys for debugging
    metadata.metadataKeys = Object.keys(instance.metadata).slice(0, 10);
  }
  
  // Also look in _instance if available
  if (instance._instance) {
    metadata.has_instance = true;
    
    // Direct access to _instance fields
    fieldsToExtract.forEach(field => {
      if (!metadata[field] && instance._instance[field] !== undefined) {
        metadata[field] = instance._instance[field];
      }
    });
    
    metadata._instanceKeys = Object.keys(instance._instance).slice(0, 10);
  }
  
  // Check dataset if available
  if (instance.dataset) {
    metadata.hasDataset = true;
    
    // Try dataset access for any missing fields
    fieldsToExtract.forEach(field => {
      if (!metadata[field] && instance.dataset[field] !== undefined) {
        metadata[field] = instance.dataset[field];
      }
    });
  }
  
  return metadata;
}

/**
 * Deeply inspects metadata object for DICOM tags
 * @param {Object} instance - The DICOM instance to inspect
 * @returns {Object} - Extracted metadata
 */
function inspectMetadataDeep(instance) {
  const result = {
    SeriesDescription: null,
    SeriesNumber: null,
    Modality: null,
    found: false,
    source: null
  };
  
  // Skip if no instance
  if (!instance) return result;
  
  // Try direct properties on instance
  if (instance.SeriesDescription) {
    result.SeriesDescription = instance.SeriesDescription;
    result.found = true;
    result.source = 'instance.direct';
  }
  
  // Check if instance has metadata property
  if (instance.metadata) {
    // Try direct properties on metadata
    if (instance.metadata.SeriesDescription) {
      result.SeriesDescription = instance.metadata.SeriesDescription;
      result.found = true;
      result.source = 'instance.metadata.direct';
    }
    
    // XNAT specific: Check for tags property
    if (instance.metadata.tags) {
      if (instance.metadata.tags['0008,103E']) {
        result.SeriesDescription = instance.metadata.tags['0008,103E'].Value?.[0] || instance.metadata.tags['0008,103E'].value;
        result.found = true;
        result.source = 'instance.metadata.tags';
      }
    }
    
    // Check for nested elements property
    if (instance.metadata.elements) {
      if (instance.metadata.elements['0008103E']) {
        result.SeriesDescription = instance.metadata.elements['0008103E'].Value?.[0];
        result.found = true;
        result.source = 'instance.metadata.elements';
      }
    }
    
    // Check for PatientStudyModule
    if (instance.metadata.PatientStudyModule) {
      if (instance.metadata.PatientStudyModule.SeriesDescription) {
        result.SeriesDescription = instance.metadata.PatientStudyModule.SeriesDescription;
        result.found = true;
        result.source = 'instance.metadata.PatientStudyModule';
      }
    }
    
    // Check for GeneralSeriesModule
    if (instance.metadata.GeneralSeriesModule) {
      if (instance.metadata.GeneralSeriesModule.SeriesDescription) {
        result.SeriesDescription = instance.metadata.GeneralSeriesModule.SeriesDescription;
        result.found = true;
        result.source = 'instance.metadata.GeneralSeriesModule';
      }
    }
    
    // Check for SeriesDescriptionCodeSequence
    if (instance.metadata.SeriesDescriptionCodeSequence) {
      if (instance.metadata.SeriesDescriptionCodeSequence.CodeMeaning) {
        result.SeriesDescription = instance.metadata.SeriesDescriptionCodeSequence.CodeMeaning;
        result.found = true;
        result.source = 'instance.metadata.SeriesDescriptionCodeSequence';
      }
    }
  }
  
  // Try _instance if available
  if (instance._instance) {
    if (instance._instance.SeriesDescription) {
      result.SeriesDescription = instance._instance.SeriesDescription;
      result.found = true;
      result.source = 'instance._instance';
    }
    
    // Try inside the data property
    if (instance._instance.data) {
      if (instance._instance.data.SeriesDescription) {
        result.SeriesDescription = instance._instance.data.SeriesDescription;
        result.found = true;
        result.source = 'instance._instance.data';
      }
      
      // Try elements
      if (instance._instance.data.elements) {
        if (instance._instance.data.elements['0008103E']) {
          result.SeriesDescription = instance._instance.data.elements['0008103E'].Value?.[0];
          result.found = true;
          result.source = 'instance._instance.data.elements';
        }
      }
    }
  }
  
  // Also get series number and modality if available using similar approach
  // For brevity, checking only the most common locations
  result.SeriesNumber = 
    instance.SeriesNumber || 
    (instance.metadata && instance.metadata.SeriesNumber) ||
    (instance.metadata && instance.metadata.tags && instance.metadata.tags['0020,0011']?.Value?.[0]) ||
    (instance._instance && instance._instance.SeriesNumber) ||
    '';
    
  result.Modality = 
    instance.Modality || 
    (instance.metadata && instance.metadata.Modality) ||
    (instance.metadata && instance.metadata.tags && instance.metadata.tags['0008,0060']?.Value?.[0]) ||
    (instance._instance && instance._instance.Modality) ||
    '';
  
  return result;
}

/**
 * Directly access Cornerstone dicom parser format metadata
 * This is a special format sometimes used in OHIF for cornerstone images
 * @param {Object} displaySet - The display set
 * @param {string} tag - The DICOM tag like '0008103E' for SeriesDescription
 * @returns {string|null} - The extracted value or null if not found
 */
function getCornerstoneMetadata(displaySet, tag) {
  if (!displaySet || !tag) return null;
  
  // Make sure we have the right format
  if (!displaySet.images || !Array.isArray(displaySet.images) || displaySet.images.length === 0) {
    return null;
  }
  
  // Try to find the tag in the first image's metadata
  const firstImage = displaySet.images[0];
  if (!firstImage) return null;
  
  // Try to access using the Cornerstone method if available
  if (firstImage.data && typeof firstImage.data.string === 'function') {
    try {
      return firstImage.data.string(tag);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Try to get it from the image object directly
  if (firstImage.data && firstImage.data[tag]) {
    const value = firstImage.data[tag];
    if (typeof value === 'string') return value;
    if (value.Value) return value.Value[0];
  }
  
  // Try to access dicom metadata object
  if (firstImage.metadata) {
    const metadata = firstImage.metadata;
    
    // Try standard DICOM JSON format
    if (metadata[tag]) {
      const value = metadata[tag];
      if (typeof value === 'string') return value;
      if (value.Value) return value.Value[0];
    }
    
    // Try elements format
    if (metadata.elements && metadata.elements[tag]) {
      const element = metadata.elements[tag];
      if (element.Value) return element.Value[0];
    }
  }
  
  return null;
}
