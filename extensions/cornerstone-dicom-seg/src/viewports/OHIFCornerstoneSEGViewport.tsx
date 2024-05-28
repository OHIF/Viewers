import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingIndicatorTotalPercent, useViewportGrid, ViewportActionArrows } from '@ohif/ui';
import createSEGToolGroupAndAddTools from '../utils/initSEGToolGroup';
import promptHydrateSEG from '../utils/promptHydrateSEG';
import _getStatusComponent from './_getStatusComponent';

const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';

function OHIFCornerstoneSEGViewport(props: withAppTypes) {
  const {
    children,
    displaySets,
    viewportOptions,
    servicesManager,
    extensionManager,
    commandsManager,
  } = props;

  const { t } = useTranslation('SEGViewport');
  const viewportId = viewportOptions.viewportId;

  const {
    displaySetService,
    toolGroupService,
    segmentationService,
    customizationService,
    viewportActionCornersService,
  } = servicesManager.services;

  const toolGroupId = `${SEG_TOOLGROUP_BASE_NAME}-${viewportId}`;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();

  // States
  const [selectedSegment, setSelectedSegment] = useState(1);

  // Hydration means that the SEG is opened and segments are loaded into the
  // segmentation panel, and SEG is also rendered on any viewport that is in the
  // same frameOfReferenceUID as the referencedSeriesUID of the SEG. However,
  // loading basically means SEG loading over network and bit unpacking of the
  // SEG data.
  const [isHydrated, setIsHydrated] = useState(segDisplaySet.isHydrated);
  const [segIsLoading, setSegIsLoading] = useState(!segDisplaySet.isLoaded);
  const [element, setElement] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({
    percentComplete: null,
    totalSegments: null,
  });

  // refs
  const referencedDisplaySetRef = useRef(null);

  const { viewports, activeViewportId } = viewportGrid;

  const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();
  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
    referencedDisplaySet,
    segDisplaySet
  );

  referencedDisplaySetRef.current = {
    displaySet: referencedDisplaySet,
    metadata: referencedDisplaySetMetadata,
  };
  /**
   * OnElementEnabled callback which is called after the cornerstoneExtension
   * has enabled the element. Note: we delegate all the image rendering to
   * cornerstoneExtension, so we don't need to do anything here regarding
   * the image rendering, element enabling etc.
   */
  const onElementEnabled = evt => {
    setElement(evt.detail.element);
  };

  const onElementDisabled = () => {
    setElement(null);
  };

  const storePresentationState = useCallback(() => {
    viewportGrid?.viewports.forEach(({ viewportId }) => {
      commandsManager.runCommand('storePresentation', {
        viewportId,
      });
    });
  }, [viewportGrid]);

  const getCornerstoneViewport = useCallback(() => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    const { displaySet: referencedDisplaySet } = referencedDisplaySetRef.current;

    // Todo: jump to the center of the first segment
    return (
      <Component
        {...props}
        displaySets={[referencedDisplaySet, segDisplaySet]}
        viewportOptions={{
          viewportType: 'volume',
          toolGroupId: toolGroupId,
          orientation: viewportOptions.orientation,
          viewportId: viewportOptions.viewportId,
        }}
        onElementEnabled={evt => {
          props.onElementEnabled?.(evt);
          onElementEnabled(evt);
        }}
        onElementDisabled={onElementDisabled}
      ></Component>
    );
  }, [viewportId, segDisplaySet, toolGroupId]);

  const onSegmentChange = useCallback(
    direction => {
      const segmentationId = segDisplaySet.displaySetInstanceUID;
      const segmentation = segmentationService.getSegmentation(segmentationId);

      const { segments } = segmentation;

      const numberOfSegments = Object.keys(segments).length;

      let newSelectedSegmentIndex = selectedSegment + direction;

      // Segment 0 is always background

      if (newSelectedSegmentIndex > numberOfSegments - 1) {
        newSelectedSegmentIndex = 1;
      } else if (newSelectedSegmentIndex === 0) {
        newSelectedSegmentIndex = numberOfSegments - 1;
      }

      segmentationService.jumpToSegmentCenter(segmentationId, newSelectedSegmentIndex, toolGroupId);
      setSelectedSegment(newSelectedSegmentIndex);
    },
    [selectedSegment]
  );

  useEffect(() => {
    if (segIsLoading) {
      return;
    }

    promptHydrateSEG({
      servicesManager,
      viewportId,
      segDisplaySet,
      preHydrateCallbacks: [storePresentationState],
      hydrateSEGDisplaySet,
    }).then(isHydrated => {
      if (isHydrated) {
        setIsHydrated(true);
      }
    });
  }, [servicesManager, viewportId, segDisplaySet, segIsLoading]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (evt.segDisplaySet.displaySetInstanceUID === segDisplaySet.displaySetInstanceUID) {
          setSegIsLoading(false);
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

    // This creates a custom tool group which has the lifetime of this view
    // only, and does NOT interfere with currently displayed segmentations.
    toolGroup = createSEGToolGroupAndAddTools(toolGroupService, customizationService, toolGroupId);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(toolGroupId);

      // Only destroy the viewport specific implementation
      toolGroupService.destroyToolGroup(toolGroupId);
    };
  }, []);

  useEffect(() => {
    setIsHydrated(segDisplaySet.isHydrated);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(toolGroupId);
      referencedDisplaySetRef.current = null;
    };
  }, [segDisplaySet]);

  const hydrateSEGDisplaySet = useCallback(
    ({ segDisplaySet, viewportId }) => {
      commandsManager.runCommand('loadSegmentationDisplaySetsForViewport', {
        displaySets: [segDisplaySet],
        viewportId,
      });
    },
    [commandsManager]
  );

  const onStatusClick = useCallback(async () => {
    // Before hydrating a SEG and make it added to all viewports in the grid
    // that share the same frameOfReferenceUID, we need to store the viewport grid
    // presentation state, so that we can restore it after hydrating the SEG. This is
    // required if the user has changed the viewport (other viewport than SEG viewport)
    // presentation state (w/l and invert) and then opens the SEG. If we don't store
    // the presentation state, the viewport will be reset to the default presentation
    storePresentationState();
    const isHydrated = await hydrateSEGDisplaySet({
      segDisplaySet,
      viewportId,
    });

    setIsHydrated(isHydrated);
  }, [hydrateSEGDisplaySet, segDisplaySet, storePresentationState, viewportId]);

  useEffect(() => {
    viewportActionCornersService.setComponents([
      {
        viewportId,
        id: 'viewportStatusComponent',
        component: _getStatusComponent({
          isHydrated,
          onStatusClick,
        }),
        indexPriority: -100,
        location: viewportActionCornersService.LOCATIONS.topLeft,
      },
      {
        viewportId,
        id: 'viewportActionArrowsComponent',
        component: (
          <ViewportActionArrows
            key="actionArrows"
            onArrowsClick={onSegmentChange}
            className={
              viewportId === activeViewportId ? 'visible' : 'invisible group-hover:visible'
            }
          ></ViewportActionArrows>
        ),
        indexPriority: 0,
        location: viewportActionCornersService.LOCATIONS.topRight,
      },
    ]);
  }, [
    activeViewportId,
    isHydrated,
    onSegmentChange,
    onStatusClick,
    viewportActionCornersService,
    viewportId,
  ]);

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

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    ManufacturerModelName,
    StudyDate,
    SeriesDescription,
    SpacingBetweenSlices,
  } = referencedDisplaySetRef.current.metadata;

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

OHIFCornerstoneSEGViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
};

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
