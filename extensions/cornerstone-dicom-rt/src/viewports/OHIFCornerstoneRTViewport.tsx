import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useViewportGrid } from '@ohif/ui-next';
import {
  utils,
  usePositionPresentationStore,
  OHIFCornerstoneViewport,
} from '@ohif/extension-cornerstone';

import promptHydrateRT from '../utils/promptHydrateRT';
import createRTToolGroupAndAddTools from '../utils/initRTToolGroup';
import { useSystem } from '@ohif/core/src';
const RT_TOOLGROUP_BASE_NAME = 'RTToolGroup';

function OHIFCornerstoneRTViewport(props: withAppTypes) {
  const { servicesManager, commandsManager } = useSystem();
  const { children, displaySets, viewportOptions } = props as {
    children: React.ReactNode;
    displaySets: AppTypes.DisplaySet[];
    viewportOptions: AppTypes.ViewportOptions;
  };

  const { displaySetService, toolGroupService, segmentationService, customizationService } =
    servicesManager.services;

  const viewportId = viewportOptions.viewportId;

  const toolGroupId = `${RT_TOOLGROUP_BASE_NAME}-${viewportId}`;

  // RT viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('RT viewport should only have a single display set');
  }

  const LoadingIndicatorTotalPercent = customizationService.getCustomization(
    'ui.loadingIndicatorTotalPercent'
  );

  const rtDisplaySet = displaySets[0];

  const [{ viewports, activeViewportId }, viewportGridService] = useViewportGrid();

  // States
  const { setPositionPresentation } = usePositionPresentationStore();
  const [rtIsLoading, setRtIsLoading] = useState(!rtDisplaySet.isLoaded);
  const [processingProgress, setProcessingProgress] = useState({
    percentComplete: null,
    totalSegments: null,
  });

  const referencedDisplaySetRef = useRef(null);

  const referencedDisplaySetInstanceUID = rtDisplaySet.referencedDisplaySetInstanceUID;
  // If the referencedDisplaySetInstanceUID is not found, it means the RTStruct series is being
  // launched without its corresponding referenced display set (e.g., the RTStruct series is launched using
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
  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(referencedDisplaySet);

  referencedDisplaySetRef.current = {
    displaySet: referencedDisplaySet,
    metadata: referencedDisplaySetMetadata,
  };

  useEffect(() => {
    if (rtIsLoading) {
      return;
    }

    // if not active viewport, return
    if (viewportId !== activeViewportId) {
      return;
    }

    promptHydrateRT({
      servicesManager,
      viewportId,
      rtDisplaySet,
      hydrateRTDisplaySet: async () => {
        return commandsManager.runCommand('hydrateSecondaryDisplaySet', {
          displaySet: rtDisplaySet,
          viewportId,
        });
      },
    });
  }, [servicesManager, viewportId, rtDisplaySet, rtIsLoading, commandsManager, activeViewportId]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (evt.rtDisplaySet.displaySetInstanceUID === rtDisplaySet.displaySetInstanceUID) {
          setRtIsLoading(false);
        }

        if (rtDisplaySet?.firstSegmentedSliceImageId && viewportOptions?.presentationIds) {
          const { firstSegmentedSliceImageId } = rtDisplaySet;
          const { presentationIds } = viewportOptions;

          setPositionPresentation(presentationIds.positionPresentationId, {
            viewportType: 'stack',
            viewReference: {
              referencedImageId: firstSegmentedSliceImageId,
            },
            viewPresentation: {},
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [rtDisplaySet]);

  useEffect(() => {
    const segmentLoadingSubscription = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENT_LOADING_COMPLETE,
      ({ percentComplete, numSegments }) => {
        setProcessingProgress({
          percentComplete,
          totalSegments: numSegments,
        });
      }
    );

    const displaySetsRemovedSubscription = displaySetService.subscribe(
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
      segmentLoadingSubscription.unsubscribe();
      displaySetsRemovedSubscription.unsubscribe();
    };
  }, [rtDisplaySet, displaySetService, viewports, activeViewportId, viewportGridService]);

  useEffect(() => {
    let toolGroup = toolGroupService.getToolGroup(toolGroupId);

    if (toolGroup) {
      return;
    }

    toolGroup = createRTToolGroupAndAddTools(toolGroupService, customizationService, toolGroupId);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentations(viewportId);
      referencedDisplaySetRef.current = null;
      toolGroupService.destroyToolGroup(toolGroupId);
    };
  }, []);

  const getCornerstoneViewport = useCallback(() => {
    const { displaySet: referencedDisplaySet } = referencedDisplaySetRef.current;

    // Todo: jump to the center of the first segment
    return (
      <OHIFCornerstoneViewport
        {...props}
        displaySets={[referencedDisplaySet, rtDisplaySet]}
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
  }, [viewportId, rtDisplaySet, toolGroupId]);

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
        {rtIsLoading && (
          <LoadingIndicatorTotalPercent
            className="h-full w-full"
            totalNumbers={processingProgress.totalSegments}
            percentComplete={processingProgress.percentComplete}
            loadingText="Loading RTSTRUCT..."
          />
        )}
        {getCornerstoneViewport()}
        {childrenWithProps}
      </div>
    </>
  );
}

OHIFCornerstoneRTViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
};

function _getReferencedDisplaySetMetadata(referencedDisplaySet) {
  const image0 = referencedDisplaySet.images[0];
  const referencedDisplaySetMetadata = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices,
  };

  return referencedDisplaySetMetadata;
}

export default OHIFCornerstoneRTViewport;
