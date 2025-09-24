import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useViewportGrid } from '@ohif/ui-next';
import createSEGToolGroupAndAddTools from '../utils/initSEGToolGroup';
import promptHydrateSEG from '../utils/promptHydrateSEG';
import { usePositionPresentationStore, OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { useSystem } from '@ohif/core/src/contextProviders/SystemProvider';

const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';

function OHIFCornerstoneSEGViewport(props: withAppTypes) {
  const { servicesManager, commandsManager } = useSystem();
  const { children, displaySets, viewportOptions } = props as {
    children: React.ReactNode;
    displaySets: AppTypes.DisplaySet[];
    viewportOptions: AppTypes.ViewportOptions;
  };
  const viewportId = viewportOptions.viewportId;

  const { displaySetService, toolGroupService, segmentationService, customizationService } =
    servicesManager.services;

  const LoadingIndicatorTotalPercent = customizationService.getCustomization(
    'ui.loadingIndicatorTotalPercent'
  );

  const toolGroupId = `${SEG_TOOLGROUP_BASE_NAME}-${viewportId}`;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];
  const [viewportGrid, viewportGridService] = useViewportGrid();

  // States
  const { setPositionPresentation } = usePositionPresentationStore();

  // Hydration means that the SEG is opened and segments are loaded into the
  // segmentation panel, and SEG is also rendered on any viewport that is in the
  // same frameOfReferenceUID as the referencedSeriesUID of the SEG. However,
  // loading basically means SEG loading over network and bit unpacking of the
  // SEG data.
  const [segIsLoading, setSegIsLoading] = useState(!segDisplaySet.isLoaded);
  const [processingProgress, setProcessingProgress] = useState({
    percentComplete: null,
    totalSegments: null,
  });

  // refs
  const referencedDisplaySetRef = useRef(null);

  const { viewports, activeViewportId } = viewportGrid;

  const referencedDisplaySetInstanceUID = segDisplaySet.referencedDisplaySetInstanceUID;
  // If the referencedDisplaySetInstanceUID is not found, it means the SEG series is being
  // launched without its corresponding referenced display set (e.g., the SEG series is launched using
  // series launch /mode?StudyInstanceUIDs=&SeriesInstanceUID).
  // In such cases, we attempt to handle this scenario gracefully by
  // invoking a custom handler. Ideally, if a user tries to launch a series that isn't viewable,
  // (eg.: we can prompt them with an explanation and provide a link to the full study).
  if (!referencedDisplaySetInstanceUID) {
    const missingReferenceDisplaySetHandler = customizationService.getCustomization(
      'missingReferenceDisplaySetHandler'
    );
    const { handled } = missingReferenceDisplaySetHandler();
    if (handled) {
      return;
    }
  }
  const referencedDisplaySet = displaySetService.getDisplaySetByUID(
    referencedDisplaySetInstanceUID
  );

  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
    referencedDisplaySet,
    segDisplaySet
  );

  referencedDisplaySetRef.current = {
    displaySet: referencedDisplaySet,
    metadata: referencedDisplaySetMetadata,
  };

  const getCornerstoneViewport = useCallback(() => {
    return (
      <OHIFCornerstoneViewport
        {...props}
        displaySets={[segDisplaySet]}
        viewportOptions={{
          viewportType: viewportOptions.viewportType,
          toolGroupId: toolGroupId,
          orientation: viewportOptions.orientation,
          viewportId: viewportOptions.viewportId,
          presentationIds: viewportOptions.presentationIds,
        }}
        onElementEnabled={evt => {
          props.onElementEnabled?.(evt);
        }}
      />
    );
  }, [viewportId, segDisplaySet, toolGroupId, props, viewportOptions]);

  useEffect(() => {
    if (segIsLoading) {
      return;
    }

    // if not active viewport, return
    if (viewportId !== activeViewportId) {
      return;
    }

    promptHydrateSEG({
      servicesManager,
      viewportId,
      segDisplaySet,
      hydrateCallback: async () => {
        await commandsManager.runCommand('hydrateSecondaryDisplaySet', {
          displaySet: segDisplaySet,
          viewportId,
        });

        return true;
      },
    });
  }, [servicesManager, viewportId, segDisplaySet, segIsLoading, commandsManager, activeViewportId]);

  useEffect(() => {
    // on new seg display set, remove all segmentations from all viewports
    segmentationService.clearSegmentationRepresentations(viewportId);

    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (evt.segDisplaySet.displaySetInstanceUID === segDisplaySet.displaySetInstanceUID) {
          setSegIsLoading(false);
        }

        if (segDisplaySet?.firstSegmentedSliceImageId && viewportOptions?.presentationIds) {
          const { firstSegmentedSliceImageId } = segDisplaySet;
          const { presentationIds } = viewportOptions;

          setPositionPresentation(presentationIds.positionPresentationId, {
            viewReference: {
              referencedImageId: firstSegmentedSliceImageId,
            },
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [segDisplaySet]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENT_LOADING_COMPLETE,
      ({ percentComplete, numSegments }) => {
        setProcessingProgress({
          percentComplete,
          totalSegments: numSegments,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [segDisplaySet]);

  /**
   Cleanup the SEG viewport when the viewport is destroyed
   */
  useEffect(() => {
    const onDisplaySetsRemovedSubscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports.get(activeViewportId);
        if (displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)) {
          viewportGridService.setDisplaySetsForViewport({
            viewportId: activeViewportId,
            displaySetInstanceUIDs: [],
          });
        }
      }
    );

    return () => {
      onDisplaySetsRemovedSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let toolGroup = toolGroupService.getToolGroup(toolGroupId);

    if (toolGroup) {
      return;
    }

    // keep the already stored segmentationPresentation for this viewport in memory
    // so that we can restore it after hydrating the SEG
    commandsManager.runCommand('updateStoredSegmentationPresentation', {
      displaySet: segDisplaySet,
      type: SegmentationRepresentations.Labelmap,
    });

    // always start fresh for this viewport since it is special type of viewport
    // that should only show one segmentation at a time.
    segmentationService.clearSegmentationRepresentations(viewportId);

    // This creates a custom tool group which has the lifetime of this view
    // only, and does NOT interfere with currently displayed segmentations.
    toolGroup = createSEGToolGroupAndAddTools({
      commandsManager,
      toolGroupService,
      customizationService,
      toolGroupId,
    });

    return () => {
      // remove the segmentation representations if seg displayset changed
      // e.g., another seg displayset is dragged into the viewport
      segmentationService.clearSegmentationRepresentations(viewportId);

      // Only destroy the viewport specific implementation
      toolGroupService.destroyToolGroup(toolGroupId);
    };
  }, []);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  if (
    !referencedDisplaySetRef.current ||
    referencedDisplaySet.displaySetInstanceUID !==
      referencedDisplaySetRef.current.displaySet.displaySetInstanceUID
  ) {
    return null;
  }

  if (children && children.length) {
    childrenWithProps = children.map((child, index) => {
      return (
        child &&
        React.cloneElement(child, {
          viewportId,
          key: index,
        })
      );
    });
  }

  return (
    <>
      <div className="relative flex h-full w-full flex-row overflow-hidden">
        {segIsLoading && (
          <LoadingIndicatorTotalPercent
            className="h-full w-full"
            totalNumbers={processingProgress.totalSegments}
            percentComplete={processingProgress.percentComplete}
            loadingText="Loading SEG..."
          />
        )}
        {getCornerstoneViewport()}
        {childrenWithProps}
      </div>
    </>
  );
}

function _getReferencedDisplaySetMetadata(referencedDisplaySet, segDisplaySet) {
  const { SharedFunctionalGroupsSequence } = segDisplaySet.instance;

  const SharedFunctionalGroup = Array.isArray(SharedFunctionalGroupsSequence)
    ? SharedFunctionalGroupsSequence[0]
    : SharedFunctionalGroupsSequence;

  const { PixelMeasuresSequence } = SharedFunctionalGroup;

  const PixelMeasures = Array.isArray(PixelMeasuresSequence)
    ? PixelMeasuresSequence[0]
    : PixelMeasuresSequence;

  const { SpacingBetweenSlices, SliceThickness } = PixelMeasures;

  const image0 = referencedDisplaySet.images[0];
  const referencedDisplaySetMetadata = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness || SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices || SpacingBetweenSlices,
  };

  return referencedDisplaySetMetadata;
}

export default OHIFCornerstoneSEGViewport;
