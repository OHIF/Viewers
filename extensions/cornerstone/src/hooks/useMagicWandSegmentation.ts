import { useState, useEffect, useCallback, useRef } from 'react';
import { useSystem } from '@ohif/core';
import { EVENTS, eventTarget, utilities, Enums, StackViewport } from '@cornerstonejs/core';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';
import { vec3 } from 'gl-matrix';

const cs3DToolsEvents = csToolsEnums.Events;

type MagicWandMode = 'idle' | 'pickingSeed' | 'loading' | 'error';

interface MagicWandOptions {
  tolerance?: number;
  connectivity?: 6 | 18 | 26;
  maxRegionVoxels?: number;
  maxRadiusVoxels?: number;
}

interface SeedPoint {
  z: number;
  y: number;
  x: number;
}

interface SeedMarker {
  viewportId: string;
  worldPoint: number[];
  canvasPoint: number[];
}

export function useMagicWandSegmentation() {
  const { servicesManager, commandsManager, extensionManager } = useSystem();
  const { cornerstoneViewportService, viewportGridService, displaySetService, uiNotificationService, segmentationService, panelService } =
    servicesManager.services;

  const [mode, setMode] = useState<MagicWandMode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [seedMarker, setSeedMarker] = useState<SeedMarker | null>(null);
  const [options, setOptions] = useState<MagicWandOptions>({
    tolerance: 30,
    connectivity: 6,
    maxRegionVoxels: 500000,
    maxRadiusVoxels: 200,
  });

  const clickHandlerRef = useRef<((evt: CustomEvent) => void) | null>(null);
  const keyHandlerRef = useRef<((evt: KeyboardEvent) => void) | null>(null);
  const enabledElementsRef = useRef<Set<string>>(new Set());
  const modeRef = useRef<MagicWandMode>('idle');

  // Keep modeRef in sync with mode state
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Remove click handlers from all enabled elements
    enabledElementsRef.current.forEach(viewportId => {
      const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
      if (viewportInfo?.element && clickHandlerRef.current) {
        viewportInfo.element.removeEventListener(
          cs3DToolsEvents.MOUSE_CLICK,
          clickHandlerRef.current,
          true // Must match the capture phase used in addEventListener
        );
      }
    });
    enabledElementsRef.current.clear();

    // Remove key handler
    if (keyHandlerRef.current) {
      document.removeEventListener('keydown', keyHandlerRef.current);
      keyHandlerRef.current = null;
    }

    clickHandlerRef.current = null;
    setSeedMarker(null);
  }, [cornerstoneViewportService]);

  // Convert canvas coordinates to world coordinates, then to voxel indices
  const getVoxelFromClick = useCallback(
    (viewportId: string, canvasPoint: number[]): SeedPoint | null => {
      try {
        const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        if (!csViewport) {
          console.log('No cornerstone viewport found');
          return null;
        }

        // Convert canvas to world coordinates
        const worldPoint = csViewport.canvasToWorld(canvasPoint);
        console.log('World point:', worldPoint);

        // Check if this is a stack viewport or volume viewport
        const isStackViewport = csViewport instanceof StackViewport;

        if (isStackViewport) {
          // Handle stack viewport
          const currentImageId = csViewport.getCurrentImageId();
          if (!currentImageId) {
            console.log('No current image ID for stack viewport');
            return null;
          }

          const imageIndex = csViewport.getCurrentImageIdIndex();
          console.log('Stack viewport - imageId:', currentImageId, 'index:', imageIndex);

          // Convert world coordinates to image coordinates
          const imagePoint = utilities.worldToImageCoords(currentImageId, worldPoint);
          console.log('Image point:', imagePoint);

          // For stack viewports: z is the image index, x and y are from image coordinates
          // Backend expects (z, y, x) where z is slice, y is row, x is column
          // imagePoint is [x, y] in image space (0-indexed)
          return {
            z: imageIndex, // slice index (0-indexed)
            y: Math.round(imagePoint[1]), // row (0-indexed)
            x: Math.round(imagePoint[0]), // column (0-indexed)
          };
        } else {
          // Handle volume viewport
          const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
          if (!viewportInfo?.viewportData?.data?.[0]?.volume?.imageData) {
            console.log('No volume imageData found for volume viewport');
            return null;
          }

          const { worldToIndex } = viewportInfo.viewportData.data[0].volume.imageData;

          // Convert world to voxel indices (returns [x, y, z] in image space)
          const ijk = worldToIndex(worldPoint);
          console.log('Volume viewport - ijk:', ijk);

          // Map to (z, y, x) - z is slice index, y is row, x is column
          // Cornerstone3D typically returns [x, y, z] where z is the slice index
          // Backend expects (z, y, x) where z is slice, y is row, x is column
          return {
            z: Math.round(ijk[2]), // slice index
            y: Math.round(ijk[1]), // row
            x: Math.round(ijk[0]), // column
          };
        }
      } catch (err) {
        console.error('Error converting click to voxel:', err);
        return null;
      }
    },
    [cornerstoneViewportService]
  );

  // Handle viewport click
  const handleViewportClick = useCallback(
    async (evt: CustomEvent) => {
      console.log('handleViewportClick called, mode:', modeRef.current, 'event:', evt);
      // Use ref to get current mode value
      if (modeRef.current !== 'pickingSeed') {
        console.log('Not in pickingSeed mode, ignoring click');
        return;
      }

      // Stop propagation to prevent other handlers from interfering
      evt.stopPropagation();
      evt.stopImmediatePropagation?.();

      const { detail } = evt;
      const { viewportId, element, currentPoints } = detail;

      console.log('Click event detail:', { viewportId, element: !!element, currentPoints });

      if (!viewportId || !element || !currentPoints?.canvas) {
        console.log('Missing required event data');
        return;
      }

      // Get canvas coordinates from the event
      const canvasPoint = currentPoints.canvas;

      // Get the active viewport's display set
      const viewport = viewportGridService.getState().viewports.get(viewportId);
      if (!viewport?.displaySetInstanceUIDs?.length) {
        uiNotificationService?.show({
          title: 'Magic Wand',
          message: 'No display set found for active viewport.',
          type: 'error',
        });
        cleanup();
        setMode('idle');
        return;
      }

      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      if (!displaySet) {
        uiNotificationService?.show({
          title: 'Magic Wand',
          message: 'No display set found.',
          type: 'error',
        });
        cleanup();
        setMode('idle');
        return;
      }

      const { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesInstanceUID } = displaySet;

      // Convert click to voxel coordinates
      const seed = getVoxelFromClick(viewportId, canvasPoint);
      if (!seed) {
        uiNotificationService?.show({
          title: 'Magic Wand',
          message: 'Failed to convert click to voxel coordinates.',
          type: 'error',
        });
        cleanup();
        setMode('idle');
        return;
      }

      // Store seed marker for display
      const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (csViewport && currentPoints?.world) {
        const worldPoint = currentPoints.world;
        setSeedMarker({
          viewportId,
          worldPoint: Array.from(worldPoint),
          canvasPoint: Array.from(canvasPoint),
        });
      }

      // Cleanup click handlers
      cleanup();

      // Call the segmentation API
      setMode('loading');
      setError(null);

      try {
        const result = await commandsManager.runCommand('magicWandSegmentation', {
          studyInstanceUID,
          seriesInstanceUID,
          seed,
          options: Object.keys(options).length > 0 ? options : undefined,
        });

        const segSeriesInstanceUID = result?.segmentation?.seriesInstanceUID;

        if (!segSeriesInstanceUID) {
          throw new Error('Server did not return segmentation series information.');
        }

        // Refresh study/series metadata (same as preset flow)
        const activeDataSourceArray = extensionManager.getActiveDataSource?.() ?? [];
        const activeDataSource = activeDataSourceArray?.[0];

        if (activeDataSource) {
          const dsConfig = activeDataSource.getConfig?.() ?? {};
          const cacheKey =
            typeof dsConfig.name === 'string'
              ? `${dsConfig.name}:${studyInstanceUID}`
              : studyInstanceUID;

          activeDataSource.deleteStudyMetadataPromise?.(cacheKey);

          if (activeDataSource.retrieve?.series?.metadata) {
            await activeDataSource.retrieve.series.metadata({
              StudyInstanceUID: studyInstanceUID,
            });
          } else if (activeDataSource.query?.series?.metadata) {
            await activeDataSource.query.series.metadata({
              StudyInstanceUID: studyInstanceUID,
            });
          } else if (activeDataSource.query?.studies?.search) {
            await activeDataSource.query.studies.search({
              studyInstanceUID: studyInstanceUID,
            });
          }
        }

        const segDisplaySets = displaySetService.getDisplaySetsForSeries(segSeriesInstanceUID);

        if (!segDisplaySets?.length) {
          uiNotificationService?.show({
            title: 'Magic Wand',
            message: 'SEG series was created but is not yet available in the viewer.',
            type: 'warning',
          });
          setMode('idle');
          setSeedMarker(null);
          return;
        }

        const segDisplaySet = segDisplaySets[0];

        await commandsManager.runCommand('hydrateSecondaryDisplaySet', {
          displaySet: segDisplaySet,
          viewportId,
        });

        // Get the segmentation ID (typically the displaySetInstanceUID)
        const segmentationId = segDisplaySet.displaySetInstanceUID;

        // Activate the newly created segmentation
        if (segmentationId) {
          await commandsManager.runCommand('setActiveSegmentation', {
            segmentationId,
          });

          // Activate the label map segmentation panel to show the new segmentation
          panelService?.activatePanel(
            '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsLabelMap',
            true
          );
        }

        uiNotificationService?.show({
          title: 'Magic Wand',
          message: 'Segmentation created successfully.',
          type: 'success',
        });

        setMode('idle');
        setSeedMarker(null);
      } catch (err: any) {
        console.error('Error in magic wand segmentation:', err);
        const errorMessage = err?.message || 'Segmentation request failed. Check console for details.';
        setError(errorMessage);
        setMode('error');
        uiNotificationService?.show({
          title: 'Magic Wand',
          message: errorMessage,
          type: 'error',
        });
        setSeedMarker(null);
      }
    },
    [
      cleanup,
      getVoxelFromClick,
      viewportGridService,
      displaySetService,
      uiNotificationService,
      commandsManager,
      extensionManager,
      cornerstoneViewportService,
      panelService,
      options,
    ]
  );

  // Handle Escape key
  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      // Use ref to get current mode value
      if (evt.key === 'Escape' && modeRef.current === 'pickingSeed') {
        cleanup();
        setMode('idle');
        setSeedMarker(null);
      }
    },
    [cleanup]
  );

  // Start pick-seed mode
  const startPickingSeed = useCallback(() => {
    // Use ref to check current mode
    if (modeRef.current === 'pickingSeed') {
      // Toggle: if already picking, cancel
      cleanup();
      setMode('idle');
      return;
    }

    if (modeRef.current === 'loading') {
      return; // Prevent starting while loading
    }

    setMode('pickingSeed');
    setError(null);
    setSeedMarker(null);

    // Register click handler for all enabled viewports
    clickHandlerRef.current = handleViewportClick as any;

    // Register key handler for Escape
    keyHandlerRef.current = handleKeyDown;
    document.addEventListener('keydown', keyHandlerRef.current);
    console.log('Magic Wand: Entered picking mode, handlers registered');

    // Add click handlers to currently enabled elements
    const addClickHandlers = () => {
      const viewportIds = viewportGridService.getState().viewports.keys();
      for (const viewportId of viewportIds) {
        const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
        if (viewportInfo?.element && clickHandlerRef.current) {
          console.log('Adding click handler to viewport:', viewportId, 'event:', cs3DToolsEvents.MOUSE_CLICK);
          viewportInfo.element.addEventListener(
            cs3DToolsEvents.MOUSE_CLICK,
            clickHandlerRef.current,
            true // Use capture phase to catch events before other handlers
          );
          enabledElementsRef.current.add(viewportId);
        }
      }
    };

    addClickHandlers();

    // Listen for new enabled elements
    const elementEnabledHandler = (evt: CustomEvent) => {
      const { viewportId, element } = evt.detail;
      // Use ref to check current mode
      if (element && clickHandlerRef.current && modeRef.current === 'pickingSeed') {
        console.log('Adding click handler to newly enabled element:', viewportId);
        element.addEventListener(
          cs3DToolsEvents.MOUSE_CLICK,
          clickHandlerRef.current,
          true // Use capture phase
        );
        enabledElementsRef.current.add(viewportId);
      }
    };

    eventTarget.addEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler);

    // Cleanup listener
    return () => {
      eventTarget.removeEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler);
    };
  }, [handleViewportClick, handleKeyDown, cleanup, viewportGridService, cornerstoneViewportService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    mode,
    error,
    seedMarker,
    options,
    setOptions,
    startPickingSeed,
    cleanup,
  };
}
