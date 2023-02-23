import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
  LoadingIndicatorProgress,
} from '@ohif/ui';

import _hydrateRTdisplaySet from '../utils/_hydrateRT';
import promptHydrateRT from '../utils/promptHydrateRT';
import _getStatusComponent from './_getStatusComponent';
import createRTToolGroupAndAddTools from '../utils/initRTToolGroup';

const { formatDate } = utils;
const RT_TOOLGROUP_BASE_NAME = 'RTToolGroup';

function OHIFCornerstoneRTViewport(props) {
  const {
    children,
    displaySets,
    viewportOptions,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
  } = props;

  const { t } = useTranslation('RTViewport');

  const {
    DisplaySetService,
    ToolGroupService,
    segmentationService,
    UINotificationService,
  } = servicesManager.services;

  const toolGroupId = `${RT_TOOLGROUP_BASE_NAME}-${viewportIndex}`;

  // RT viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('RT viewport should only have a single display set');
  }

  const rtDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();

  // States
  const [isToolGroupCreated, setToolGroupCreated] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(1);

  // Hydration means that the RT is opened and segments are loaded into the
  // segmentation panel, and RT is also rendered on any viewport that is in the
  // same frameOfReferenceUID as the referencedSeriesUID of the RT. However,
  // loading basically means RT loading over network and bit unpacking of the
  // RT data.
  const [isHydrated, setIsHydrated] = useState(rtDisplaySet.isHydrated);
  const [rtIsLoading, setRtIsLoading] = useState(!rtDisplaySet.isLoaded);
  const [element, setElement] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({
    segmentIndex: 1,
    totalSegments: null,
  });

  // refs
  const referencedDisplaySetRef = useRef(null);

  const { viewports, activeViewportIndex } = viewportGrid;

  const referencedDisplaySet = rtDisplaySet.getReferenceDisplaySet();
  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
    referencedDisplaySet
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

  const getCornerstoneViewport = useCallback(() => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    const {
      displaySet: referencedDisplaySet,
    } = referencedDisplaySetRef.current;

    // Todo: jump to the center of the first segment
    return (
      <Component
        {...props}
        displaySets={[referencedDisplaySet, rtDisplaySet]}
        viewportOptions={{
          viewportType: 'volume',
          toolGroupId: toolGroupId,
          orientation: viewportOptions.orientation,
          viewportId: viewportOptions.viewportId,
        }}
        onElementEnabled={onElementEnabled}
        onElementDisabled={onElementDisabled}
        // initialImageIndex={initialImageIndex}
      ></Component>
    );
  }, [viewportIndex, rtDisplaySet, toolGroupId]);

  const onSegmentChange = useCallback(
    direction => {
      direction = direction === 'left' ? -1 : 1;
      const segmentationId = rtDisplaySet.displaySetInstanceUID;
      const segmentation = segmentationService.getSegmentation(segmentationId);

      const { segments } = segmentation;

      const numberOfSegments = Object.keys(segments).length;

      let newSelectedSegmentIndex = selectedSegment + direction;

      if (newSelectedSegmentIndex > numberOfSegments - 1) {
        newSelectedSegmentIndex = 1;
      } else if (newSelectedSegmentIndex === 0) {
        newSelectedSegmentIndex = numberOfSegments - 1;
      }

      segmentationService.jumpToSegmentCenter(
        segmentationId,
        newSelectedSegmentIndex,
        toolGroupId
      );
      setSelectedSegment(newSelectedSegmentIndex);
    },
    [selectedSegment]
  );

  useEffect(() => {
    if (rtIsLoading) {
      return;
    }

    promptHydrateRT({
      servicesManager,
      viewportIndex,
      rtDisplaySet,
    }).then(isHydrated => {
      if (isHydrated) {
        setIsHydrated(true);
      }
    });
  }, [servicesManager, viewportIndex, rtDisplaySet, rtIsLoading]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (
          evt.rtDisplaySet.displaySetInstanceUID ===
          rtDisplaySet.displaySetInstanceUID
        ) {
          setRtIsLoading(false);
        }

        if (evt.overlappingSegments) {
          UINotificationService.show({
            title: 'Overlapping Segments',
            message:
              'Overlapping segments detected which is not currently supported',
            type: 'warning',
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [rtDisplaySet]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENT_LOADING_COMPLETE,
      ({ segmentIndex, numSegments }) => {
        setProcessingProgress({
          segmentIndex,
          totalSegments: numSegments,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [rtDisplaySet]);

  /**
   Cleanup the SEG viewport when the viewport is destroyed
   */
  useEffect(() => {
    const onDisplaySetsRemovedSubscription = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports[activeViewportIndex];
        if (
          displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)
        ) {
          viewportGridService.setDisplaySetsForViewport({
            viewportIndex: activeViewportIndex,
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
    let toolGroup = ToolGroupService.getToolGroup(toolGroupId);

    if (toolGroup) {
      return;
    }

    toolGroup = createRTToolGroupAndAddTools(
      ToolGroupService,
      toolGroupId,
      extensionManager
    );

    setToolGroupCreated(true);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(
        toolGroupId
      );

      ToolGroupService.destroyToolGroup(toolGroupId);
    };
  }, []);

  useEffect(() => {
    setIsHydrated(rtDisplaySet.isHydrated);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(
        toolGroupId
      );
      referencedDisplaySetRef.current = null;
    };
  }, [rtDisplaySet]);

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
          viewportIndex,
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
    SeriesNumber,
  } = referencedDisplaySetRef.current.metadata;

  const onPillClick = () => {
    promptHydrateRT({
      servicesManager,
      viewportIndex,
      rtDisplaySet,
    }).then(isHydrated => {
      if (isHydrated) {
        setIsHydrated(true);
      }
    });
  };

  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onArrowsClick={onSegmentChange}
        getStatusComponent={() => {
          return _getStatusComponent({
            isHydrated,
            onPillClick,
          });
        }}
        studyData={{
          label: viewportLabel,
          useAltStyling: true,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: `RT Viewport ${SeriesDescription}`,
          patientInformation: {
            patientName: PatientName
              ? OHIF.utils.formatPN(PatientName.Alphabetic)
              : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: SliceThickness ? `${SliceThickness.toFixed(2)}mm` : '',
            spacing:
              SpacingBetweenSlices !== undefined
                ? `${SpacingBetweenSlices.toFixed(2)}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />

      <div className="relative flex flex-row w-full h-full overflow-hidden">
        {rtIsLoading && (
          <LoadingIndicatorProgress
            className="w-full h-full"
            progress={
              processingProgress.totalSegments !== null
                ? ((processingProgress.segmentIndex + 1) /
                    processingProgress.totalSegments) *
                  100
                : null
            }
            textBlock={
              !processingProgress.totalSegments ? (
                <span className="text-white text-sm">Loading RTSTRUCT ...</span>
              ) : (
                <span className="text-white text-sm flex items-baseline space-x-2">
                  <div>Loading Segment</div>
                  <div className="w-3">{`${processingProgress.segmentIndex}`}</div>
                  <div>/</div>
                  <div>{`${processingProgress.totalSegments}`}</div>
                </span>
              )
            }
          />
        )}
        {getCornerstoneViewport()}
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
              id="viewport-notification"
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
              onOutsideClick={viewportDialogState.onOutsideClick}
            />
          )}
        </div>
        {childrenWithProps}
      </div>
    </>
  );
}

OHIFCornerstoneRTViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneRTViewport.defaultProps = {
  customProps: {},
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
