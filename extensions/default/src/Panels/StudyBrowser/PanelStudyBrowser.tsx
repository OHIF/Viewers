import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useImageViewer } from '@ohif/ui-next';
import { useSystem, utils, DicomMetadataStore } from '@ohif/core';
import { useNavigate } from 'react-router-dom';
import { useViewportGrid, StudyBrowser, Separator } from '@ohif/ui-next';
import { PanelStudyBrowserHeader } from './PanelStudyBrowserHeader';
import { defaultActionIcons } from './constants';
import MoreDropdownMenu from '../../Components/MoreDropdownMenu';
import { CallbackCustomization } from 'platform/core/src/types';
import { BlobReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';
import filesToStudies from '../../../../../platform/app/src/routes/Local/filesToStudies.js';
const { sortStudyInstances, formatDate, createStudyBrowserTabs } = utils;

const thumbnailNoImageModalities = ['SR', 'RTSTRUCT', 'RTPLAN', 'RTDOSE', 'DOC', 'PMAP'];
const hiddenModalities = ['SEG'];

/**
 * Retry utility function that attempts an async operation up to maxRetries times
 * with a delay between attempts
 */
async function retryWithDelay<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 3000,
  suppressWarnings: boolean = true
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!suppressWarnings || attempt === maxRetries) {
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      }

      if (attempt < maxRetries) {
        if (!suppressWarnings) {
          console.log(`Retrying in ${delayMs / 1000} seconds...`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Study Browser component that displays and manages studies and their display sets
 */
function PanelStudyBrowser({
  getImageSrc,
  getStudiesForPatientByMRN,
  requestDisplaySetCreationForStudy,
  dataSource,
  customMapDisplaySets,
  onClickUntrack,
  onDoubleClickThumbnailHandlerCallBack,
}) {
  const { servicesManager, commandsManager, extensionManager } = useSystem();
  const { displaySetService, customizationService } = servicesManager.services;
  const navigate = useNavigate();
  const studyMode = customizationService.getCustomization('studyBrowser.studyMode') || 'all';

  const internalImageViewer = useImageViewer();
  const StudyInstanceUIDs = internalImageViewer?.StudyInstanceUIDs || [];
  const fetchedStudiesRef = useRef(new Set());

  const [{ activeViewportId, viewports, isHangingProtocolLayout }] = useViewportGrid();
  const [activeTabName, setActiveTabName] = useState(studyMode);
  const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState(
    studyMode === 'primary' && StudyInstanceUIDs.length > 0
      ? [StudyInstanceUIDs[0]]
      : [...StudyInstanceUIDs]
  );
  const [hasLoadedViewports, setHasLoadedViewports] = useState(false);
  const [studyDisplayList, setStudyDisplayList] = useState([]);
  const [displaySets, setDisplaySets] = useState([]);
  const [displaySetsLoadingState, setDisplaySetsLoadingState] = useState({});
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});
  const [jumpToDisplaySet, setJumpToDisplaySet] = useState(null);

  const [viewPresets, setViewPresets] = useState(
    customizationService.getCustomization('studyBrowser.viewPresets')
  );

  const [actionIcons, setActionIcons] = useState(defaultActionIcons);

  // Use primary StudyInstanceUID for tracking instead of sessionID
  const primaryStudyInstanceUID = StudyInstanceUIDs?.length > 0 ? StudyInstanceUIDs[0] : null;

  // Memoize keys to avoid recalculating on every render
  const uploadKey = primaryStudyInstanceUID ? `dicom_uploaded_${primaryStudyInstanceUID}` : null;
  const conversionKey = primaryStudyInstanceUID
    ? `nifti_converted_${primaryStudyInstanceUID}`
    : null;
  const segmentationKey = primaryStudyInstanceUID
    ? `dicom_segmented_${primaryStudyInstanceUID}`
    : null;

  const [isUploadingDicom, setIsUploadingDicom] = useState(true);
  const [isConversionComplete, setIsConversionComplete] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [isSegmented, setIsSegmented] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [segmentationProgress, setSegmentationProgress] = useState<number>(0);
  const [segmentationStage, setSegmentationStage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');

  // Cache for generated reports (studyUID -> blob URL)
  const reportCacheRef = useRef<Map<string, string>>(new Map());

  // Track which study is currently being processed
  const [processingStudyUID, setProcessingStudyUID] = useState<string | null>(null);

  // Track which studies have reports available
  const [studiesWithReports, setStudiesWithReports] = useState<Set<string>>(new Set());

  const segmentationMap = React.useMemo(() => {
    const map = new Map<string, string>();
    const allDisplaySets = displaySetService.activeDisplaySets;
    allDisplaySets
      .filter(ds => ds.Modality === 'SEG' && ds.referencedSeriesInstanceUID)
      .forEach(segDs => {
        map.set(segDs.referencedSeriesInstanceUID, segDs.displaySetInstanceUID);
      });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySets]);

  const mapDisplaySetsWithState = useCallback(
    (dsSets, loadingState, thumbMap, vps) => {
      const baseFn = customMapDisplaySets || _mapDisplaySets;
      return baseFn(dsSets, loadingState, thumbMap, vps, segmentationMap);
    },
    [customMapDisplaySets, segmentationMap]
  );

  // Check if segmentation files exist on backend
  const checkSegmentationStatus = useCallback(
    async (
      studyInstanceUID: string
    ): Promise<{ exists: boolean; bodyPart?: string; fileCount?: number }> => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return { exists: false };
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/check_segmentation_status/${studyInstanceUID}`);

        if (!response.ok) {
          console.warn(`Failed to check segmentation status: ${response.status}`);
          return { exists: false };
        }

        const data = await response.json();
        return {
          exists: data.segmentation_exists || false,
          bodyPart: data.body_part,
          fileCount: data.segmentation_files_found || 0,
        };
      } catch (error) {
        console.error('Error checking segmentation status:', error);
        return { exists: false };
      }
    },
    []
  );

  const fetchSegmentationFromBackend = useCallback(
    async (studyInstanceUID: string): Promise<boolean> => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return false;
      }

      const { uiNotificationService } = servicesManager.services;

      setIsSegmenting(true);
      setProcessingStudyUID(studyInstanceUID);
      setSegmentationProgress(0);
      setSegmentationStage('Requesting segmentation from backend...');
      try {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Fetching segmentation files from backend...',
          type: 'info',
        });

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

        const response = await retryWithDelay(
          async () => {
            const res = await fetch(
              `${backendUrl}/segmentation?studyInstanceUIDs=${studyInstanceUID}`
            );
            if (!res.ok) {
              throw new Error(`Backend responded with status: ${res.status}`);
            }
            return res;
          },
          3,
          3000,
          true
        );

        setSegmentationStage('Downloading segmentation archive...');
        setSegmentationProgress(25);

        const blob = await response.blob();
        const zipReader = new ZipReader(new BlobReader(blob));
        const entries = await zipReader.getEntries();

        const files = [];
        for (const entry of entries) {
          if (!entry.directory) {
            // @ts-expect-error - getData exists on Entry but TypeScript typing may be incomplete
            const uint8Array = await entry.getData(new Uint8ArrayWriter());
            // Extract just the filename without any directory path
            const filename = entry.filename.split('/').pop() || entry.filename;
            console.log(`Extracted file: ${filename}, size: ${uint8Array.byteLength} bytes`);
            // Create a blob from the Uint8Array to ensure proper binary data handling
            const blob = new Blob([uint8Array], { type: 'application/dicom' });
            const file = new File([blob], filename, { type: 'application/dicom' });
            files.push(file);
          }
        }

        await zipReader.close();

        if (files.length === 0) {
          uiNotificationService.show({
            title: 'Segmentation',
            message: 'No segmentation files found in the archive',
            type: 'warning',
          });
          return false;
        }

        setSegmentationStage('Integrating segmentation into viewer...');
        setSegmentationProgress(60);

        const existingSeriesMap = new Map();
        DicomMetadataStore.getStudyInstanceUIDs().forEach(studyUID => {
          const study = DicomMetadataStore.getStudy(studyUID);
          if (study?.series) {
            study.series.forEach(series => {
              existingSeriesMap.set(`${studyUID}_${series.SeriesInstanceUID}`, true);
            });
          }
        });

        // Process the segmentation files and add them to the study list
        const studies = await filesToStudies(files);

        if (studies?.length) {
          setSegmentationStage('Creating display sets...');
          setSegmentationProgress(75);

          // First, create display sets for new series
          studies.forEach(studyInstanceUID => {
            const studyMetadata = DicomMetadataStore.getStudy(studyInstanceUID);
            if (studyMetadata?.series) {
              studyMetadata.series.forEach(series => {
                const seriesKey = `${studyInstanceUID}_${series.SeriesInstanceUID}`;
                // Only process series that didn't exist before
                if (!existingSeriesMap.has(seriesKey)) {
                  // Trigger display set creation for new series
                  displaySetService.makeDisplaySets(series.instances, { madeInClient: true });
                }
              });
            }
          });

          // Wait a bit for display sets to be created, then update UI
          setTimeout(() => {
            // Update study display list for all affected studies
            studies.forEach(studyInstanceUID => {
              const studyMetadata = DicomMetadataStore.getStudy(studyInstanceUID);

              if (studyMetadata) {
                setStudyDisplayList(prevArray => {
                  const existingIndex = prevArray.findIndex(
                    s => s.studyInstanceUid === studyInstanceUID
                  );

                  if (existingIndex !== -1) {
                    // Study exists - update only modalities and numInstances
                    const updated = [...prevArray];
                    const existingStudy = updated[existingIndex];

                    // Collect all modalities including new ones
                    // existingStudy.modalities might be a string (e.g., "CT/MR"), so split it first
                    const existingModalities =
                      typeof existingStudy.modalities === 'string'
                        ? existingStudy.modalities.split('/').filter(Boolean)
                        : existingStudy.modalities || [];

                    const modalitiesSet = new Set(existingModalities);

                    // Extract modalities from series
                    studyMetadata.series?.forEach(series => {
                      if (series.Modality) {
                        modalitiesSet.add(series.Modality);
                      }
                    });

                    updated[existingIndex] = {
                      ...existingStudy,
                      modalities: Array.from(modalitiesSet).join('/'),
                      numInstances:
                        studyMetadata.series?.reduce(
                          (sum, s) => sum + (s.instances?.length || 0),
                          0
                        ) || existingStudy.numInstances,
                    };
                    return updated;
                  } else {
                    // New study - add it
                    // Extract modalities from series
                    const modalitiesSet = new Set();
                    let studyDate = studyMetadata.StudyDate;

                    // If study-level data is missing, extract from series/instances
                    studyMetadata.series?.forEach(series => {
                      if (series.Modality) {
                        modalitiesSet.add(series.Modality);
                      }
                      // Try to get date from series if not available at study level
                      if (!studyDate && series.instances?.[0]) {
                        studyDate = series.instances[0].StudyDate;
                      }
                    });

                    return [
                      ...prevArray,
                      {
                        studyInstanceUid: studyMetadata.StudyInstanceUID,
                        date: formatDate(studyDate) || '',
                        description: studyMetadata.StudyDescription || '',
                        modalities: Array.from(modalitiesSet).join('/'),
                        numInstances:
                          studyMetadata.series?.reduce(
                            (sum, s) => sum + (s.instances?.length || 0),
                            0
                          ) || 0,
                        patientName: studyMetadata.PatientName || '',
                      },
                    ];
                  }
                });
              }

              // Expand the study to show the new series
              setExpandedStudyInstanceUIDs(prev => {
                if (!prev.includes(studyInstanceUID)) {
                  return [...prev, studyInstanceUID];
                }
                return prev;
              });
            });

            // Force refresh of display sets to update UI
            const currentDisplaySets = displaySetService.activeDisplaySets;
            const mappedDisplaySets = mapDisplaySetsWithState(
              currentDisplaySets,
              displaySetsLoadingState,
              thumbnailImageSrcMap,
              viewports
            );

            if (!customMapDisplaySets) {
              sortStudyInstances(mappedDisplaySets);
            }

            setDisplaySets(mappedDisplaySets);

            setSegmentationStage('Segmentation ready');
            setSegmentationProgress(100);

            // Automatically load SEG display sets into different viewports
            setTimeout(async () => {
              const { viewportGridService } = servicesManager.services;
              const gridState = viewportGridService.getState();

              // Get all available viewport IDs from the Map
              const allViewportIds = Array.from(gridState.viewports.keys());

              if (allViewportIds.length === 0) {
                console.warn('No viewports available for segmentation loading');
                return;
              }

              console.log('Available viewports:', allViewportIds);

              // Find newly created SEG display sets
              const currentDisplaySets = displaySetService.activeDisplaySets;
              const segDisplaySets = currentDisplaySets.filter(
                ds =>
                  ds.Modality === 'SEG' &&
                  !existingSeriesMap.has(`${ds.StudyInstanceUID}_${ds.SeriesInstanceUID}`)
              );

              console.log(`Found ${segDisplaySets.length} new segmentation(s) to load`);

              // Load each segmentation into a different viewport
              for (let i = 0; i < segDisplaySets.length; i++) {
                const segDisplaySet = segDisplaySets[i];
                // Cycle through viewports if there are more segmentations than viewports
                const viewportId = allViewportIds[i % allViewportIds.length];

                try {
                  await commandsManager.run('hydrateSecondaryDisplaySet', {
                    displaySet: segDisplaySet,
                    viewportId: viewportId,
                  });
                  console.log(
                    `✓ Auto-loaded segmentation ${i + 1}/${segDisplaySets.length}: ${segDisplaySet.SeriesInstanceUID} into viewport ${viewportId}`
                  );
                } catch (error) {
                  console.warn(
                    `Failed to auto-load segmentation ${segDisplaySet.SeriesInstanceUID}:`,
                    error
                  );
                }
              }
            }, 500);
          }, 200);
        }

        uiNotificationService.show({
          title: 'Segmentation',
          message: `Successfully loaded ${files.length} segmentation file(s) from ${studies?.length || 0} study(ies)`,
          type: 'success',
        });

        // Mark segmentation as completed
        setIsSegmented(true);
        if (studyInstanceUID) {
          const key = `dicom_segmented_${studyInstanceUID}`;
          sessionStorage.setItem(key, 'true');

          // Mark all loaded segmentations as visible
          setTimeout(() => {
            const segDisplaySets = displaySetService.activeDisplaySets.filter(
              ds => ds.Modality === 'SEG' && ds.StudyInstanceUID === studyInstanceUID
            );
            segDisplaySets.forEach(segDS => {
              setSegmentationVisibility(prev =>
                new Map(prev).set(segDS.displaySetInstanceUID, true)
              );
            });
          }, 1000);
        }
        return true;
      } catch (error) {
        console.error('Failed to fetch segmentation from backend:', error);
        uiNotificationService.show({
          title: 'Segmentation',
          message: `Failed to fetch segmentation: ${error.message || error.toString()}`,
          type: 'error',
        });
        return false;
      } finally {
        setIsSegmenting(false);
        setProcessingStudyUID(null);
        setSegmentationProgress(0);
        setSegmentationStage('');
      }
    },
    [
      servicesManager,
      displaySetService,
      mapDisplaySetsWithState,
      displaySetsLoadingState,
      thumbnailImageSrcMap,
      viewports,
      customMapDisplaySets,
      commandsManager,
    ]
  );

  useEffect(() => {
    sessionStorage.removeItem('chat_session_id');
    sessionStorage.removeItem('chat_messages');
    console.log('[Chat] Cleared chat session and messages from sessionStorage on mount');
  }, []);

  useEffect(() => {
    if (primaryStudyInstanceUID) {
      sessionStorage.removeItem('chat_session_id');
      sessionStorage.removeItem('chat_messages');
      console.log(
        '[Chat] Cleared chat session and messages for new study:',
        primaryStudyInstanceUID
      );
    }
  }, [primaryStudyInstanceUID]);

  // Update states when primaryStudyInstanceUID becomes available
  useEffect(() => {
    if (primaryStudyInstanceUID) {
      const hasSentDicom =
        sessionStorage.getItem(`dicom_uploaded_${primaryStudyInstanceUID}`) === 'true';
      const hasConverted =
        sessionStorage.getItem(`nifti_converted_${primaryStudyInstanceUID}`) === 'true';
      const hasSegmented =
        sessionStorage.getItem(`dicom_segmented_${primaryStudyInstanceUID}`) === 'true';

      setIsUploadingDicom(!hasSentDicom);
      setIsConversionComplete(hasConverted);
      setIsSegmented(hasSegmented);

      // Check backend for existing segmentation files and load them if they exist
      // Also check if segmentation is actually in the viewer (might be missing after reload)
      if (hasConverted) {
        // Check if segmentation is actually loaded in the viewer
        const currentDisplaySets = displaySetService.activeDisplaySets;
        const hasSegmentationInViewer = currentDisplaySets.some(
          ds => ds.Modality === 'SEG' && ds.StudyInstanceUID === primaryStudyInstanceUID
        );

        // Load if: not marked as segmented OR marked but not in viewer
        if (!hasSegmented || (hasSegmented && !hasSegmentationInViewer)) {
          checkSegmentationStatus(primaryStudyInstanceUID)
            .then(status => {
              if (status.exists) {
                // Segmentation files exist on backend - load them automatically
                console.log(
                  `Found existing segmentation files for study ${primaryStudyInstanceUID}, loading...`
                );
                fetchSegmentationFromBackend(primaryStudyInstanceUID).catch(error => {
                  console.error('Failed to auto-load segmentation:', error);
                });
              }
            })
            .catch(error => {
              console.error('Failed to check segmentation status:', error);
            });
        }
      }
    }
  }, [
    primaryStudyInstanceUID,
    checkSegmentationStatus,
    fetchSegmentationFromBackend,
    displaySetService,
  ]);

  // Cleanup cached blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Revoke all cached blob URLs
      reportCacheRef.current.forEach((blobUrl, studyUID) => {
        URL.revokeObjectURL(blobUrl);
        console.log(`Cleaned up cached report for study ${studyUID}`);
      });
      reportCacheRef.current.clear();
    };
  }, []);

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
    const newViewPresets = viewPresets.map(preset => {
      preset.selected = preset.id === viewPreset.id;
      return preset;
    });
    setViewPresets(newViewPresets);
  };

  const uploadInProgressRef = useRef(false);

  useEffect(() => {
    const sendStudiesToBackend = async () => {
      if (StudyInstanceUIDs.length === 0) {
        return;
      }

      // Check if all studies are already uploaded
      const allUploaded = StudyInstanceUIDs.every(
        uid => sessionStorage.getItem(`dicom_uploaded_${uid}`) === 'true'
      );

      if (allUploaded) {
        setIsUploadingDicom(false);
        return;
      }

      // Prevent concurrent uploads
      if (uploadInProgressRef.current) {
        console.log('Upload already in progress, skipping...');
        return;
      }

      uploadInProgressRef.current = true;
      setIsUploadingDicom(true);
      setUploadProgress(0);

      try {
        // Upload each study separately
        for (let i = 0; i < StudyInstanceUIDs.length; i++) {
          const studyUID = StudyInstanceUIDs[i];
          const uploadKey = `dicom_uploaded_${studyUID}`;

          // Skip if already uploaded
          if (sessionStorage.getItem(uploadKey) === 'true') {
            console.log(`Study ${studyUID} already uploaded, skipping...`);
            continue;
          }

          setUploadStage(`Uploading study ${i + 1} of ${StudyInstanceUIDs.length}...`);

          try {
            await commandsManager.runCommand('sendDicomZipToBackend', {
              studyInstanceUIDs: [studyUID], // Send single study
              onProgress: (progress: number, stage: string) => {
                // Adjust progress to account for multiple studies
                const baseProgress = (i / StudyInstanceUIDs.length) * 100;
                const studyProgress = (progress / 100) * (100 / StudyInstanceUIDs.length);
                setUploadProgress(baseProgress + studyProgress);
                setUploadStage(`Study ${i + 1}/${StudyInstanceUIDs.length}: ${stage}`);
              },
            });
            sessionStorage.setItem(uploadKey, 'true');
            console.log(`✓ Study ${studyUID} uploaded successfully`);
          } catch (error) {
            console.error(`Failed to upload study ${studyUID}:`, error);
          }
        }
      } finally {
        setIsUploadingDicom(false);
        setUploadProgress(0);
        setUploadStage('');
        uploadInProgressRef.current = false;
      }
    };

    const timeoutId = setTimeout(() => {
      sendStudiesToBackend();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [StudyInstanceUIDs, commandsManager]);

  // Poll conversion status for each study after DICOM upload
  useEffect(() => {
    if (StudyInstanceUIDs.length === 0 || isUploadingDicom) {
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const pollCountRef: Record<string, number> = {};
    const maxPolls = 60;

    const checkConversionStatusForStudy = async (studyUID: string) => {
      const convKey = `nifti_converted_${studyUID}`;

      // Skip if already converted
      if (sessionStorage.getItem(convKey) === 'true') {
        // Update UI if this is the primary study
        if (studyUID === primaryStudyInstanceUID) {
          setIsConversionComplete(true);
        }
        return;
      }

      // Initialize poll count
      if (!pollCountRef[studyUID]) {
        pollCountRef[studyUID] = 0;
      }

      try {
        const response = await fetch(`${backendUrl}/check_conversion_status/${studyUID}`);
        const data = await response.json();

        console.log(`Conversion status for ${studyUID}:`, data);

        if (data.conversion_complete) {
          sessionStorage.setItem(convKey, 'true');
          console.log(`✓ NIfTI conversion complete for study ${studyUID}`);

          // Update UI if this is the primary study
          if (studyUID === primaryStudyInstanceUID) {
            setIsConversionComplete(true);
            setConversionStatus(data.message || '');
          }
        } else {
          pollCountRef[studyUID]++;
          if (pollCountRef[studyUID] < maxPolls) {
            setTimeout(() => checkConversionStatusForStudy(studyUID), 1000);
          } else {
            console.error(`Conversion status polling timed out for study ${studyUID}`);
            if (studyUID === primaryStudyInstanceUID) {
              setConversionStatus('Conversion taking longer than expected. Please try refreshing.');
            }
          }
        }
      } catch (error) {
        console.error(`Error checking conversion status for ${studyUID}:`, error);
        pollCountRef[studyUID]++;
        if (pollCountRef[studyUID] < maxPolls) {
          setTimeout(() => checkConversionStatusForStudy(studyUID), 1000);
        }
      }
    };

    // Start polling for each study
    const timeoutId = setTimeout(() => {
      StudyInstanceUIDs.forEach(studyUID => {
        // Only poll for studies that have been uploaded
        if (sessionStorage.getItem(`dicom_uploaded_${studyUID}`) === 'true') {
          checkConversionStatusForStudy(studyUID);
        }
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [StudyInstanceUIDs, isUploadingDicom, primaryStudyInstanceUID]);

  const onDoubleClickThumbnailHandler = useCallback(
    async displaySetInstanceUID => {
      const customHandler = customizationService.getCustomization(
        'studyBrowser.thumbnailDoubleClickCallback'
      ) as CallbackCustomization;

      const setupArgs = {
        activeViewportId,
        commandsManager,
        servicesManager,
        isHangingProtocolLayout,
        appConfig: extensionManager._appConfig,
      };

      const handlers = customHandler?.callbacks.map(callback => callback(setupArgs));

      for (const handler of handlers) {
        await handler(displaySetInstanceUID);
      }
      onDoubleClickThumbnailHandlerCallBack?.(displaySetInstanceUID);
    },
    [
      activeViewportId,
      commandsManager,
      servicesManager,
      isHangingProtocolLayout,
      customizationService,
      extensionManager,
      onDoubleClickThumbnailHandlerCallBack,
    ]
  );

  // Track visibility state for segmentations
  const [segmentationVisibility, setSegmentationVisibility] = useState<Map<string, boolean>>(
    new Map()
  );

  const handleSegmentationClick = useCallback(
    (segDisplaySetInstanceUID: string) => {
      if (!segDisplaySetInstanceUID) {
        return;
      }

      const { viewportGridService, segmentationService } = servicesManager.services;

      // Check if segmentation is already loaded/hydrated
      const segmentation = segmentationService.getSegmentation(segDisplaySetInstanceUID);

      if (!segmentation) {
        // If not loaded, load it first (original behavior)
        onDoubleClickThumbnailHandler(segDisplaySetInstanceUID);
        // Assume it will be visible after loading
        setSegmentationVisibility(prev => new Map(prev).set(segDisplaySetInstanceUID, true));
        return;
      }

      // Get all viewports that have this segmentation
      const viewportIds =
        segmentationService.getViewportIdsWithSegmentation(segDisplaySetInstanceUID);

      if (viewportIds.length === 0) {
        // No viewports have this segmentation, load it
        onDoubleClickThumbnailHandler(segDisplaySetInstanceUID);
        setSegmentationVisibility(prev => new Map(prev).set(segDisplaySetInstanceUID, true));
        return;
      }

      // Toggle visibility in all viewports that have this segmentation
      const currentVisibility = segmentationVisibility.get(segDisplaySetInstanceUID) ?? true;
      const newVisibility = !currentVisibility;

      // Toggle visibility for each viewport that has this segmentation
      // Add error handling to prevent errors if segmentation data isn't fully loaded
      try {
        viewportIds.forEach(viewportId => {
          try {
            // Get all representations for this segmentation in this viewport
            const representations = segmentationService.getSegmentationRepresentations(viewportId, {
              segmentationId: segDisplaySetInstanceUID,
            });

            if (representations && representations.length > 0) {
              // Use the type from the actual representation (like AddSegmentRow does)
              const representation = representations[0];
              if (representation?.type) {
                segmentationService.toggleSegmentationRepresentationVisibility(viewportId, {
                  segmentationId: segDisplaySetInstanceUID,
                  type: representation.type,
                });
              }
            }
          } catch (error) {
            console.warn(
              `Failed to toggle segmentation visibility for viewport ${viewportId}:`,
              error
            );
          }
        });

        setSegmentationVisibility(prev =>
          new Map(prev).set(segDisplaySetInstanceUID, newVisibility)
        );
      } catch (error) {
        console.error('Error toggling segmentation visibility:', error);
        // Fallback to original behavior if toggle fails
        onDoubleClickThumbnailHandler(segDisplaySetInstanceUID);
      }
    },
    [onDoubleClickThumbnailHandler, servicesManager, commandsManager, segmentationVisibility]
  );

  // Handler for running segmentation on a specific study (per-study button)
  const handleRunSegmentation = useCallback(
    async (studyInstanceUID: string) => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return;
      }

      const { uiNotificationService } = servicesManager.services;

      // Check if conversion is complete for this study
      const convKey = `nifti_converted_${studyInstanceUID}`;
      if (sessionStorage.getItem(convKey) !== 'true') {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Please wait for DICOM to NIfTI conversion to complete',
          type: 'warning',
        });
        return;
      }

      // Check if segmentation files exist on backend
      const segStatus = await checkSegmentationStatus(studyInstanceUID);
      const segKey = `dicom_segmented_${studyInstanceUID}`;
      const isStudySegmented = sessionStorage.getItem(segKey) === 'true';

      // Check if segmentation is actually loaded in the viewer
      const currentDisplaySets = displaySetService.activeDisplaySets;
      const hasSegmentationInViewer = currentDisplaySets.some(
        ds => ds.Modality === 'SEG' && ds.StudyInstanceUID === studyInstanceUID
      );

      if (segStatus.exists && !isStudySegmented) {
        // Files exist but haven't been loaded - load them
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Loading existing segmentation files...',
          type: 'info',
        });
        await fetchSegmentationFromBackend(studyInstanceUID);
      } else if (isStudySegmented && !hasSegmentationInViewer) {
        // SessionStorage says segmented but not in viewer (e.g., after reload) - load them
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Reloading segmentation files...',
          type: 'info',
        });
        await fetchSegmentationFromBackend(studyInstanceUID);
      } else if (isStudySegmented && hasSegmentationInViewer) {
        // Already segmented and loaded in viewer
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'This study has already been segmented and is displayed',
          type: 'info',
        });
        return;
      } else if (segStatus.exists) {
        // Files exist on backend but not marked as segmented - load them
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Loading existing segmentation files...',
          type: 'info',
        });
        await fetchSegmentationFromBackend(studyInstanceUID);
      } else {
        // No files exist - run segmentation
        await fetchSegmentationFromBackend(studyInstanceUID);
      }
    },
    [servicesManager, fetchSegmentationFromBackend, checkSegmentationStatus, displaySetService]
  );

  const handleReportClick = useCallback(
    async (studyInstanceUID: string) => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return;
      }

      const { uiNotificationService, uiModalService } = servicesManager.services;

      // Check if we have a cached report for this study
      const cachedBlobUrl = reportCacheRef.current.get(studyInstanceUID);

      if (cachedBlobUrl) {
        // Ensure this study is marked as having a report
        setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
        console.log(`Using cached report for study ${studyInstanceUID}`);

        // Open cached PDF in modal immediately
        uiModalService.show({
          title: 'MRI Report',
          content: () => {
            return React.createElement(
              'div',
              {
                style: {
                  width: '100%',
                  height: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '0',
                  padding: '0',
                },
              },
              [
                React.createElement(
                  'object',
                  {
                    key: 'pdf-viewer',
                    data: cachedBlobUrl,
                    type: 'application/pdf',
                    style: { width: '100%', height: '100%', border: 'none' },
                  },
                  React.createElement(
                    'div',
                    {
                      key: 'fallback',
                      style: { padding: '20px', textAlign: 'center' },
                    },
                    [
                      React.createElement('p', { key: 'msg' }, 'Unable to display PDF. '),
                      React.createElement(
                        'a',
                        {
                          key: 'link',
                          href: cachedBlobUrl,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          style: { color: '#5acce6', textDecoration: 'underline' },
                        },
                        'Click here to download the PDF.'
                      ),
                    ]
                  )
                ),
              ]
            );
          },
          contentProps: {
            className: 'pdf-modal-content',
            style: { maxWidth: '90vw', width: '90vw', margin: '0 auto' },
          },
          customClassName: 'pdf-report-modal-full-width',
          onClose: () => {
            // Note: We don't revoke the cached blob URL here
            // It will be cleaned up when the component unmounts
          },
        });

        uiNotificationService.show({
          title: 'Report',
          message: 'Report opened from cache',
          type: 'success',
        });

        return;
      }

      // No cached report, proceed with generation
      // Check if segmentation files exist on backend
      const segStatus = await checkSegmentationStatus(studyInstanceUID);
      const segKey = `dicom_segmented_${studyInstanceUID}`;
      const isStudySegmented = sessionStorage.getItem(segKey) === 'true';

      if (!segStatus.exists && !isStudySegmented) {
        uiNotificationService.show({
          title: 'Report',
          message: 'Segmentation required. Running segmentation first...',
          type: 'info',
        });

        // Run segmentation first and wait for it to complete
        const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);

        if (!segmentationSuccess) {
          uiNotificationService.show({
            title: 'Report',
            message: 'Cannot generate report: Segmentation failed',
            type: 'error',
          });
          return;
        }

        uiNotificationService.show({
          title: 'Report',
          message: 'Segmentation complete. Now generating report...',
          type: 'info',
        });
      } else if (segStatus.exists && !isStudySegmented) {
        // Segmentation files exist but haven't been loaded yet - load them
        uiNotificationService.show({
          title: 'Report',
          message: 'Loading existing segmentation files...',
          type: 'info',
        });

        const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);

        if (!segmentationSuccess) {
          uiNotificationService.show({
            title: 'Report',
            message: 'Cannot generate report: Failed to load segmentation',
            type: 'error',
          });
          return;
        }

        uiNotificationService.show({
          title: 'Report',
          message: 'Segmentation loaded. Now generating report...',
          type: 'info',
        });
      }

      setIsGeneratingReport(true);
      setProcessingStudyUID(studyInstanceUID);

      uiNotificationService.show({
        title: 'Report',
        message: `Generating report for study...`,
        type: 'info',
      });

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

        const response = await retryWithDelay(
          async () => {
            const res = await fetch(
              `${backendUrl}/generate_report?studyInstanceUIDs=${studyInstanceUID}`
            );
            if (!res.ok) {
              throw new Error(`Backend responded with status: ${res.status}`);
            }
            return res;
          },
          3,
          3000,
          true
        );

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Cache the blob URL for this study
        reportCacheRef.current.set(studyInstanceUID, blobUrl);
        setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
        console.log(`Cached report for study ${studyInstanceUID}`);

        // Open PDF in a modal dialog
        uiModalService.show({
          title: 'MRI Report',
          content: () => {
            return React.createElement(
              'div',
              {
                style: {
                  width: '100%',
                  height: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '0',
                  padding: '0',
                },
              },
              [
                React.createElement(
                  'object',
                  {
                    key: 'pdf-viewer',
                    data: blobUrl,
                    type: 'application/pdf',
                    style: { width: '100%', height: '100%', border: 'none' },
                  },
                  React.createElement(
                    'div',
                    {
                      key: 'fallback',
                      style: { padding: '20px', textAlign: 'center' },
                    },
                    [
                      React.createElement('p', { key: 'msg' }, 'Unable to display PDF. '),
                      React.createElement(
                        'a',
                        {
                          key: 'link',
                          href: blobUrl,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          style: { color: '#5acce6', textDecoration: 'underline' },
                        },
                        'Click here to download the PDF.'
                      ),
                    ]
                  )
                ),
              ]
            );
          },
          contentProps: {
            className: 'pdf-modal-content',
            style: { maxWidth: '90vw', width: '90vw', margin: '0 auto' },
          },
          customClassName: 'pdf-report-modal-full-width',
          onClose: () => {
            // Note: We don't revoke the cached blob URL here
            // It will be cleaned up when the component unmounts
          },
        });

        uiNotificationService.show({
          title: 'Report',
          message: 'Report generated and opened',
          type: 'success',
        });
      } catch (error) {
        console.error('Failed to fetch report from backend:', error);
        uiNotificationService.show({
          title: 'Report',
          message: `Failed to fetch report: ${error.message || error.toString()}`,
          type: 'error',
        });
      } finally {
        setIsGeneratingReport(false);
        setProcessingStudyUID(null);
      }
    },
    [servicesManager, fetchSegmentationFromBackend, checkSegmentationStatus]
  );

  // Handler for "Chat with Report" - generates report and uploads to chat
  const handleChatWithReport = useCallback(
    async (studyInstanceUID: string) => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return;
      }

      const { uiNotificationService, panelService } = servicesManager.services;

      // Check if segmentation files exist on backend
      const segStatus = await checkSegmentationStatus(studyInstanceUID);
      const segKey = `dicom_segmented_${studyInstanceUID}`;
      const isStudySegmented = sessionStorage.getItem(segKey) === 'true';

      if (!segStatus.exists && !isStudySegmented) {
        uiNotificationService.show({
          title: 'Chat',
          message: 'Segmentation required. Running segmentation first...',
          type: 'info',
        });

        // Run segmentation first and wait for it to complete
        const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);

        if (!segmentationSuccess) {
          uiNotificationService.show({
            title: 'Chat',
            message: 'Cannot generate report: Segmentation failed',
            type: 'error',
          });
          return;
        }
      } else if (segStatus.exists && !isStudySegmented) {
        // Segmentation files exist but haven't been loaded yet - load them
        uiNotificationService.show({
          title: 'Chat',
          message: 'Loading existing segmentation files...',
          type: 'info',
        });

        const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);

        if (!segmentationSuccess) {
          uiNotificationService.show({
            title: 'Chat',
            message: 'Cannot generate report: Failed to load segmentation',
            type: 'error',
          });
          return;
        }
      }

      setIsGeneratingReport(true);
      setProcessingStudyUID(studyInstanceUID);

      try {
        let pdfBlob: Blob;

        // Check if we have a cached report
        const cachedBlobUrl = reportCacheRef.current.get(studyInstanceUID);

        if (cachedBlobUrl) {
          // Ensure this study is marked as having a report
          setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
          console.log(`Using cached report for chat (study ${studyInstanceUID})`);
          uiNotificationService.show({
            title: 'Chat',
            message: 'Using cached report for chat...',
            type: 'info',
          });

          // Fetch the blob from the cached URL
          const response = await fetch(cachedBlobUrl);
          pdfBlob = await response.blob();
        } else {
          // No cache, fetch from backend
          uiNotificationService.show({
            title: 'Chat',
            message: 'Generating report for chat...',
            type: 'info',
          });

          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

          // Step 1: Fetch the PDF report from backend
          const response = await retryWithDelay(
            async () => {
              const res = await fetch(
                `${backendUrl}/generate_report?studyInstanceUIDs=${studyInstanceUID}`
              );
              if (!res.ok) {
                throw new Error(`Backend responded with status: ${res.status}`);
              }
              return res;
            },
            3,
            3000,
            true
          );

          pdfBlob = await response.blob();

          // Cache the blob URL for future use
          const blobUrl = URL.createObjectURL(pdfBlob);
          reportCacheRef.current.set(studyInstanceUID, blobUrl);
          setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
          console.log(`Cached report for study ${studyInstanceUID}`);
        }

        // Step 2: Upload PDF to /api/upload to parse text for chat
        uiNotificationService.show({
          title: 'Chat',
          message: 'Parsing report for chat...',
          type: 'info',
        });

        const pdfFile = new File([pdfBlob], `report_${studyInstanceUID}.pdf`, {
          type: 'application/pdf',
        });
        const formData = new FormData();
        formData.append('file', pdfFile);

        // Store which study this chat session is for
        sessionStorage.setItem('current_chat_study_uid', studyInstanceUID);

        const chatApiUrl = process.env.REACT_APP_CHAT_API_URL || '';
        const uploadUrl = chatApiUrl ? `${chatApiUrl}/api/upload` : '/api/upload';
        // console.log('[Chat] Upload URL:', uploadUrl);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        const chatSessionId = uploadData.sessionId;

        // Store chat session ID in sessionStorage for ChatSection to use
        if (chatSessionId) {
          sessionStorage.setItem('chat_session_id', chatSessionId);
          console.log('[Chat] Chat session ID stored:', chatSessionId);
          console.log('[Chat] Study UID:', studyInstanceUID);
        }

        // Focus user on Chat panel
        if (panelService) {
          const chatPanelId = '@semenoflabs/extension-side-chat.panelModule.sideChat';
          panelService.activatePanel(chatPanelId, true);
        }

        uiNotificationService.show({
          title: 'Chat',
          message: 'Report ready! You can now chat about it.',
          type: 'success',
        });
      } catch (error) {
        console.error('Failed to generate report for chat:', error);
        uiNotificationService.show({
          title: 'Chat',
          message: `Failed to generate report: ${error.message || error.toString()}`,
          type: 'error',
        });
      } finally {
        setIsGeneratingReport(false);
        setProcessingStudyUID(null);
      }
    },
    [servicesManager, fetchSegmentationFromBackend, checkSegmentationStatus]
  );

  // Combined handler for "Process" button - runs segmentation, processes report, then opens chat
  const handleProcess = useCallback(
    async (studyInstanceUID: string) => {
      if (!studyInstanceUID) {
        console.warn('No StudyInstanceUID available');
        return;
      }

      const { uiNotificationService, uiModalService, panelService } = servicesManager.services;

      try {
        // Step 1: Run segmentation (if needed)
        uiNotificationService.show({
          title: 'Process',
          message: 'Starting segmentation...',
          type: 'info',
        });

        // Check if conversion is complete for this study
        const convKey = `nifti_converted_${studyInstanceUID}`;
        if (sessionStorage.getItem(convKey) !== 'true') {
          uiNotificationService.show({
            title: 'Process',
            message: 'Please wait for DICOM to NIfTI conversion to complete',
            type: 'warning',
          });
          return;
        }

        // Check if segmentation files exist on backend
        const segStatus = await checkSegmentationStatus(studyInstanceUID);
        const segKey = `dicom_segmented_${studyInstanceUID}`;
        const isStudySegmented = sessionStorage.getItem(segKey) === 'true';

        // Check if segmentation is actually loaded in the viewer
        const currentDisplaySets = displaySetService.activeDisplaySets;
        const hasSegmentationInViewer = currentDisplaySets.some(
          ds => ds.Modality === 'SEG' && ds.StudyInstanceUID === studyInstanceUID
        );

        if (!segStatus.exists && !isStudySegmented) {
          // No files exist - run segmentation
          const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);
          if (!segmentationSuccess) {
            uiNotificationService.show({
              title: 'Process',
              message: 'Segmentation failed',
              type: 'error',
            });
            return;
          }
        } else if (segStatus.exists && !isStudySegmented) {
          // Files exist but haven't been loaded - load them
          const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);
          if (!segmentationSuccess) {
            uiNotificationService.show({
              title: 'Process',
              message: 'Failed to load segmentation',
              type: 'error',
            });
            return;
          }
        } else if (isStudySegmented && !hasSegmentationInViewer) {
          // SessionStorage says segmented but not in viewer - load them
          const segmentationSuccess = await fetchSegmentationFromBackend(studyInstanceUID);
          if (!segmentationSuccess) {
            uiNotificationService.show({
              title: 'Process',
              message: 'Failed to reload segmentation',
              type: 'error',
            });
            return;
          }
        } else if (isStudySegmented && hasSegmentationInViewer) {
          // Already segmented and loaded - skip
          uiNotificationService.show({
            title: 'Process',
            message: 'Segmentation already loaded',
            type: 'info',
          });
        }

        // Step 2: Process report
        uiNotificationService.show({
          title: 'Process',
          message: 'Processing report...',
          type: 'info',
        });

        setIsGeneratingReport(true);
        setProcessingStudyUID(studyInstanceUID);

        let pdfBlob: Blob;
        let blobUrl: string;

        // Check if we have a cached report
        const cachedBlobUrl = reportCacheRef.current.get(studyInstanceUID);

        if (cachedBlobUrl) {
          // Ensure this study is marked as having a report
          setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
          console.log(`Using cached report for study ${studyInstanceUID}`);
          // Fetch the blob from the cached URL
          const response = await fetch(cachedBlobUrl);
          pdfBlob = await response.blob();
          blobUrl = cachedBlobUrl;

          // Show the report modal
          uiModalService.show({
            title: 'MRI Report',
            content: () => {
              return React.createElement(
                'div',
                {
                  style: {
                    width: '100%',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0',
                    padding: '0',
                  },
                },
                [
                  React.createElement(
                    'object',
                    {
                      key: 'pdf-viewer',
                      data: cachedBlobUrl,
                      type: 'application/pdf',
                      style: { width: '100%', height: '100%', border: 'none' },
                    },
                    React.createElement(
                      'div',
                      {
                        key: 'fallback',
                        style: { padding: '20px', textAlign: 'center' },
                      },
                      [
                        React.createElement('p', { key: 'msg' }, 'Unable to display PDF. '),
                        React.createElement(
                          'a',
                          {
                            key: 'link',
                            href: cachedBlobUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            style: { color: '#5acce6', textDecoration: 'underline' },
                          },
                          'Click here to download the PDF.'
                        ),
                      ]
                    )
                  ),
                ]
              );
            },
            contentProps: {
              className: 'pdf-modal-content',
              style: { maxWidth: '90vw', width: '90vw', margin: '0 auto' },
            },
            customClassName: 'pdf-report-modal-full-width',
            onClose: () => {},
          });

          uiNotificationService.show({
            title: 'Process',
            message: 'Report opened from cache',
            type: 'success',
          });
        } else {
          // No cached report, generate it
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

          const response = await retryWithDelay(
            async () => {
              const res = await fetch(
                `${backendUrl}/generate_report?studyInstanceUIDs=${studyInstanceUID}`
              );
              if (!res.ok) {
                throw new Error(`Backend responded with status: ${res.status}`);
              }
              return res;
            },
            3,
            3000,
            true
          );

          pdfBlob = await response.blob();
          blobUrl = URL.createObjectURL(pdfBlob);

          // Cache the blob URL for this study
          reportCacheRef.current.set(studyInstanceUID, blobUrl);
          setStudiesWithReports(prev => new Set(prev).add(studyInstanceUID));
          console.log(`Cached report for study ${studyInstanceUID}`);

          // Open PDF in a modal dialog
          uiModalService.show({
            title: 'MRI Report',
            content: () => {
              return React.createElement(
                'div',
                {
                  style: {
                    width: '100%',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0',
                    padding: '0',
                  },
                },
                [
                  React.createElement(
                    'object',
                    {
                      key: 'pdf-viewer',
                      data: blobUrl,
                      type: 'application/pdf',
                      style: { width: '100%', height: '100%', border: 'none' },
                    },
                    React.createElement(
                      'div',
                      {
                        key: 'fallback',
                        style: { padding: '20px', textAlign: 'center' },
                      },
                      [
                        React.createElement('p', { key: 'msg' }, 'Unable to display PDF. '),
                        React.createElement(
                          'a',
                          {
                            key: 'link',
                            href: blobUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            style: { color: '#5acce6', textDecoration: 'underline' },
                          },
                          'Click here to download the PDF.'
                        ),
                      ]
                    )
                  ),
                ]
              );
            },
            contentProps: {
              className: 'pdf-modal-content',
              style: { maxWidth: '90vw', width: '90vw', margin: '0 auto' },
            },
            customClassName: 'pdf-report-modal-full-width',
            onClose: () => {},
          });

          uiNotificationService.show({
            title: 'Process',
            message: 'Report generated and opened',
            type: 'success',
          });
        }

        // Step 3: Open chat
        uiNotificationService.show({
          title: 'Process',
          message: 'Preparing chat...',
          type: 'info',
        });

        // Upload PDF to /api/upload to parse text for chat
        const pdfFile = new File([pdfBlob], `report_${studyInstanceUID}.pdf`, {
          type: 'application/pdf',
        });
        const formData = new FormData();
        formData.append('file', pdfFile);

        // Store which study this chat session is for
        sessionStorage.setItem('current_chat_study_uid', studyInstanceUID);

        const chatApiUrl = process.env.REACT_APP_CHAT_API_URL || '';
        const uploadUrl = chatApiUrl ? `${chatApiUrl}/api/upload` : '/api/upload';

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        const chatSessionId = uploadData.sessionId;

        // Store chat session ID in sessionStorage for ChatSection to use
        if (chatSessionId) {
          sessionStorage.setItem('chat_session_id', chatSessionId);
          console.log('[Chat] Chat session ID stored:', chatSessionId);
          console.log('[Chat] Study UID:', studyInstanceUID);
        }

        // Focus user on Chat panel
        if (panelService) {
          const chatPanelId = '@semenoflabs/extension-side-chat.panelModule.sideChat';
          panelService.activatePanel(chatPanelId, true);
        }

        uiNotificationService.show({
          title: 'Process',
          message: 'Process complete! Report ready and chat opened.',
          type: 'success',
        });
      } catch (error) {
        console.error('Failed to process:', error);
        uiNotificationService.show({
          title: 'Process',
          message: `Failed to process: ${error.message || error.toString()}`,
          type: 'error',
        });
      } finally {
        setIsGeneratingReport(false);
        setProcessingStudyUID(null);
      }
    },
    [servicesManager, fetchSegmentationFromBackend, checkSegmentationStatus, displaySetService]
  );

  // ~~ studyDisplayList
  useEffect(() => {
    // Fetch all studies for the patient in each primary study
    async function fetchStudiesForPatient(StudyInstanceUID) {
      // Skip fetching if we've already fetched this study
      if (fetchedStudiesRef.current.has(StudyInstanceUID)) {
        return;
      }

      fetchedStudiesRef.current.add(StudyInstanceUID);
      // current study qido
      const qidoForStudyUID = await dataSource.query.studies.search({
        studyInstanceUid: StudyInstanceUID,
      });

      if (!qidoForStudyUID?.length) {
        navigate('/notfoundstudy', '_self');
        throw new Error('Invalid study URL');
      }

      let qidoStudiesForPatient = qidoForStudyUID;

      // try to fetch the prior studies based on the patientID if the
      // server can respond.
      try {
        qidoStudiesForPatient = await getStudiesForPatientByMRN(qidoForStudyUID);
      } catch (error) {
        console.warn(error);
      }

      const mappedStudies = _mapDataSourceStudies(qidoStudiesForPatient);
      const actuallyMappedStudies = mappedStudies.map(qidoStudy => {
        return {
          studyInstanceUid: qidoStudy.StudyInstanceUID,
          date: formatDate(qidoStudy.StudyDate) || '',
          description: qidoStudy.StudyDescription,
          modalities: qidoStudy.ModalitiesInStudy,
          numInstances: Number(qidoStudy.NumInstances),
          patientName: qidoStudy.PatientName || '',
        };
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
    }

    StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(sid));
  }, [StudyInstanceUIDs, dataSource, getStudiesForPatientByMRN, navigate]);

  // ~~ Initial Thumbnails
  useEffect(() => {
    if (!hasLoadedViewports) {
      if (activeViewportId) {
        // Once there is an active viewport id, it means the layout is ready
        // so wait a bit of time to allow the viewports preferential loading
        // which improves user experience of responsiveness significantly on slower
        // systems.
        const delayMs = 250 + displaySetService.getActiveDisplaySets().length * 10;
        window.setTimeout(() => setHasLoadedViewports(true), delayMs);
      }

      return;
    }

    let currentDisplaySets = displaySetService.activeDisplaySets;
    // filter non based on the list of modalities that are supported by cornerstone
    currentDisplaySets = currentDisplaySets.filter(
      ds => !thumbnailNoImageModalities.includes(ds.Modality) || ds.thumbnailSrc === null
    );

    if (!currentDisplaySets.length) {
      return;
    }

    currentDisplaySets.forEach(async dSet => {
      const newImageSrcEntry = {};
      const displaySet = displaySetService.getDisplaySetByUID(dSet.displaySetInstanceUID);
      const imageIds = dataSource.getImageIdsForDisplaySet(dSet);

      const imageId = getImageIdForThumbnail(displaySet, imageIds);

      // TODO: Is it okay that imageIds are not returned here for SR displaySets?
      if (displaySet?.unsupported) {
        return;
      }
      // When the image arrives, render it and store the result in the thumbnailImgSrcMap
      let { thumbnailSrc } = displaySet;
      if (!thumbnailSrc && displaySet.getThumbnailSrc) {
        thumbnailSrc = await displaySet.getThumbnailSrc({ getImageSrc });
      }
      if (!thumbnailSrc && imageId) {
        const thumbnailSrc = await getImageSrc(imageId);
        displaySet.thumbnailSrc = thumbnailSrc;
      }
      newImageSrcEntry[dSet.displaySetInstanceUID] = thumbnailSrc;

      setThumbnailImageSrcMap(prevState => {
        return { ...prevState, ...newImageSrcEntry };
      });
    });
  }, [displaySetService, dataSource, getImageSrc, activeViewportId, hasLoadedViewports]);

  // ~~ displaySets
  useEffect(() => {
    const currentDisplaySets = displaySetService.activeDisplaySets;

    if (!currentDisplaySets.length) {
      return;
    }

    const mappedDisplaySets = mapDisplaySetsWithState(
      currentDisplaySets,
      displaySetsLoadingState,
      thumbnailImageSrcMap,
      viewports
    );

    if (!customMapDisplaySets) {
      sortStudyInstances(mappedDisplaySets);
    }

    setDisplaySets(mappedDisplaySets);
  }, [
    displaySetService.activeDisplaySets,
    displaySetsLoadingState,
    viewports,
    thumbnailImageSrcMap,
    customMapDisplaySets,
  ]);

  // ~~ subscriptions --> displaySets
  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      data => {
        if (!hasLoadedViewports) {
          return;
        }
        const { displaySetsAdded, options } = data;
        displaySetsAdded.forEach(async dSet => {
          const displaySetInstanceUID = dSet.displaySetInstanceUID;
          const newImageSrcEntry = {};
          const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
          if (displaySet?.unsupported) {
            return;
          }
          if (options?.madeInClient) {
            setJumpToDisplaySet(displaySetInstanceUID);
          }

          const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          const imageId = getImageIdForThumbnail(displaySet, imageIds);

          // TODO: Is it okay that imageIds are not returned here for SR displaysets?
          if (!imageId) {
            return;
          }

          // When the image arrives, render it and store the result in the thumbnailImgSrcMap
          let { thumbnailSrc } = displaySet;
          if (!thumbnailSrc && displaySet.getThumbnailSrc) {
            thumbnailSrc = await displaySet.getThumbnailSrc({ getImageSrc });
          }
          if (!thumbnailSrc) {
            thumbnailSrc = await getImageSrc(imageId);
            displaySet.thumbnailSrc = thumbnailSrc;
          }
          newImageSrcEntry[displaySetInstanceUID] = thumbnailSrc;

          setThumbnailImageSrcMap(prevState => {
            return { ...prevState, ...newImageSrcEntry };
          });
        });
      }
    );

    return () => {
      SubscriptionDisplaySetsAdded.unsubscribe();
    };
  }, [displaySetService, dataSource, getImageSrc, hasLoadedViewports]);

  useEffect(() => {
    // TODO: Will this always hold _all_ the displaySets we care about?
    // DISPLAY_SETS_CHANGED returns `DisplaySerService.activeDisplaySets`
    const SubscriptionDisplaySetsChanged = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      changedDisplaySets => {
        const mappedDisplaySets = mapDisplaySetsWithState(
          changedDisplaySets,
          displaySetsLoadingState,
          thumbnailImageSrcMap,
          viewports
        );

        if (!customMapDisplaySets) {
          sortStudyInstances(mappedDisplaySets);
        }

        setDisplaySets(mappedDisplaySets);
      }
    );

    const SubscriptionDisplaySetMetaDataInvalidated = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      () => {
        const mappedDisplaySets = mapDisplaySetsWithState(
          displaySetService.getActiveDisplaySets(),
          displaySetsLoadingState,
          thumbnailImageSrcMap,
          viewports
        );

        if (!customMapDisplaySets) {
          sortStudyInstances(mappedDisplaySets);
        }

        setDisplaySets(mappedDisplaySets);
      }
    );

    return () => {
      SubscriptionDisplaySetsChanged.unsubscribe();
      SubscriptionDisplaySetMetaDataInvalidated.unsubscribe();
    };
  }, [
    displaySetsLoadingState,
    thumbnailImageSrcMap,
    viewports,
    displaySetService,
    customMapDisplaySets,
  ]);

  const tabs = createStudyBrowserTabs(StudyInstanceUIDs, studyDisplayList, displaySets);

  // TODO: Should not fire this on "close"
  function _handleStudyClick(StudyInstanceUID) {
    const shouldCollapseStudy = expandedStudyInstanceUIDs.includes(StudyInstanceUID);
    const updatedExpandedStudyInstanceUIDs = shouldCollapseStudy
      ? [...expandedStudyInstanceUIDs.filter(stdyUid => stdyUid !== StudyInstanceUID)]
      : [...expandedStudyInstanceUIDs, StudyInstanceUID];

    setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);

    if (!shouldCollapseStudy) {
      const madeInClient = true;
      requestDisplaySetCreationForStudy(displaySetService, StudyInstanceUID, madeInClient);
    }
  }

  useEffect(() => {
    if (jumpToDisplaySet) {
      // Get element by displaySetInstanceUID
      const displaySetInstanceUID = jumpToDisplaySet;
      const element = document.getElementById(`thumbnail-${displaySetInstanceUID}`);

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
    const thumbnailLocation = _findTabAndStudyOfDisplaySet(displaySetInstanceUID, tabs);
    if (!thumbnailLocation) {
      return;
    }
    const { tabName, StudyInstanceUID } = thumbnailLocation;
    setActiveTabName(tabName);
    const studyExpanded = expandedStudyInstanceUIDs.includes(StudyInstanceUID);
    if (!studyExpanded) {
      const updatedExpandedStudyInstanceUIDs = [...expandedStudyInstanceUIDs, StudyInstanceUID];
      setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);
    }
  }, [expandedStudyInstanceUIDs, jumpToDisplaySet, tabs]);

  const activeDisplaySetInstanceUIDs = viewports.get(activeViewportId)?.displaySetInstanceUIDs;

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
        <div className="flex flex-col gap-2 p-2">
          {isUploadingDicom && uploadProgress > 0 && (
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center justify-between text-xs text-white">
                <span>{uploadStage}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="bg-background h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {conversionStatus && !isConversionComplete && (
            <div className="text-primary-light px-2 text-xs">{conversionStatus}</div>
          )}
          {isSegmenting && (
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center justify-between text-xs text-white">
                <span>Preparing segmentation...</span>
              </div>
              <div className="bg-background h-2 w-full overflow-hidden rounded-full">
                <div className="bg-primary h-full w-full animate-pulse" />
              </div>
            </div>
          )}
          {isGeneratingReport && (
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center justify-between text-xs text-white">
                <span>Generating report...</span>
              </div>
              <div className="bg-background h-2 w-full overflow-hidden rounded-full">
                <div className="bg-primary h-full w-full animate-pulse" />
              </div>
            </div>
          )}
          {isSegmenting && segmentationProgress > 0 && (
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center justify-between text-xs text-white">
                <span>{segmentationStage}</span>
                <span>{Math.round(segmentationProgress)}%</span>
              </div>
              <div className="bg-background h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${segmentationProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
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
        onClickUntrack={onClickUntrack}
        onClickThumbnail={() => {}}
        onDoubleClickThumbnail={onDoubleClickThumbnailHandler}
        onSegmentationClick={handleSegmentationClick}
        segmentationVisibility={segmentationVisibility}
        onRunSegmentation={handleRunSegmentation}
        onReportClick={handleReportClick}
        onChatWithReportClick={handleChatWithReport}
        onProcessClick={handleProcess}
        studiesWithReports={studiesWithReports}
        activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
        showSettings={actionIcons.find(icon => icon.id === 'settings')?.value}
        viewPresets={viewPresets}
        processingStudyUID={processingStudyUID}
        isUploadingDicom={isUploadingDicom}
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
  displaySetLoadingState,
  thumbnailImageSrcMap,
  viewports,
  segmentationMap?: Map<string, string>
) {
  const thumbnailDisplaySets = [];
  const thumbnailNoImageDisplaySets = [];
  displaySets
    .filter(ds => !ds.excludeFromThumbnailBrowser && !hiddenModalities.includes(ds.Modality))
    .forEach(ds => {
      const { thumbnailSrc, displaySetInstanceUID } = ds;
      const componentType = _getComponentType(ds);

      const array =
        componentType === 'thumbnail' ? thumbnailDisplaySets : thumbnailNoImageDisplaySets;

      const loadingProgress = displaySetLoadingState?.[displaySetInstanceUID];
      const segDisplaySetUID = segmentationMap?.get(ds.SeriesInstanceUID);

      array.push({
        displaySetInstanceUID,
        description: ds.SeriesDescription || '',
        seriesNumber: ds.SeriesNumber,
        seriesInstanceUID: ds.SeriesInstanceUID,
        modality: ds.Modality,
        seriesDate: formatDate(ds.SeriesDate),
        numInstances: ds.numImageFrames,
        loadingProgress,
        countIcon: ds.countIcon,
        messages: ds.messages,
        StudyInstanceUID: ds.StudyInstanceUID,
        componentType,
        imageSrc: thumbnailSrc || thumbnailImageSrcMap[displaySetInstanceUID],
        dragData: {
          type: 'displayset',
          displaySetInstanceUID,
        },
        isHydratedForDerivedDisplaySet: ds.isHydrated,
        segDisplaySetInstanceUID: segDisplaySetUID || null,
      });
    });

  return [...thumbnailDisplaySets, ...thumbnailNoImageDisplaySets];
}

function _getComponentType(ds) {
  if (
    thumbnailNoImageModalities.includes(ds.Modality) ||
    ds?.unsupported ||
    ds.thumbnailSrc === null
  ) {
    return 'thumbnailNoImage';
  }

  return 'thumbnail';
}

function getImageIdForThumbnail(displaySet, imageIds) {
  let imageId;
  if (displaySet.isDynamicVolume) {
    const timePoints = displaySet.dynamicVolumeInfo.timePoints;
    const middleIndex = Math.floor(timePoints.length / 2);
    const middleTimePointImageIds = timePoints[middleIndex];
    imageId = middleTimePointImageIds[Math.floor(middleTimePointImageIds.length / 2)];
  } else {
    imageId = imageIds[Math.floor(imageIds.length / 2)];
  }
  return imageId;
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
