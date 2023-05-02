import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OHIF, { utils } from '@ohif/core';
import {
  LoadingIndicatorTotalPercent,
  useViewportGrid,
  ViewportActionBar,
} from '@ohif/ui';
import createSEGToolGroupAndAddTools from '../utils/initSEGToolGroup';
import promptHydrateSEG from '../utils/promptHydrateSEG';
import hydrateSEGDisplaySet from '../utils/_hydrateSEG';
import _getStatusComponent from './_getStatusComponent';

const { formatDate } = utils;
const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';

function OHIFCornerstoneSEGViewport(props) {
  const {
    children,
    displaySets,
    viewportOptions,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
  } = props;

  const { t } = useTranslation('SEGViewport');

  const {
    displaySetService,
    toolGroupService,
    segmentationService,
    uiNotificationService,
    customizationService,
  } = servicesManager.services;

  const toolGroupId = `${SEG_TOOLGROUP_BASE_NAME}-${viewportIndex}`;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();

  // States
  const [isToolGroupCreated, setToolGroupCreated] = useState(false);
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

  const { viewports, activeViewportIndex } = viewportGrid;

  const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();
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
        displaySets={[referencedDisplaySet, segDisplaySet]}
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
  }, [viewportIndex, segDisplaySet, toolGroupId]);

  const onSegmentChange = useCallback(
    direction => {
      direction = direction === 'left' ? -1 : 1;
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
    if (segIsLoading) {
      return;
    }

    promptHydrateSEG({
      servicesManager,
      viewportIndex,
      segDisplaySet,
    }).then(isHydrated => {
      if (isHydrated) {
        setIsHydrated(true);
      }
    });
  }, [servicesManager, viewportIndex, segDisplaySet, segIsLoading]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (
          evt.segDisplaySet.displaySetInstanceUID ===
          segDisplaySet.displaySetInstanceUID
        ) {
          setSegIsLoading(false);
        }

        if (evt.overlappingSegments) {
          uiNotificationService.show({
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
    let toolGroup = toolGroupService.getToolGroup(toolGroupId);

    if (toolGroup) {
      return;
    }

    // This creates a custom tool group which has the lifetime of this view
    // only, and does NOT interfere with currently displayed segmentations.
    toolGroup = createSEGToolGroupAndAddTools(
      toolGroupService,
      customizationService,
      toolGroupId
    );

    setToolGroupCreated(true);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(
        toolGroupId
      );

      // Only destroy the viewport specific implementation
      toolGroupService.destroyToolGroup(toolGroupId);
    };
  }, []);

  useEffect(() => {
    setIsHydrated(segDisplaySet.isHydrated);

    return () => {
      // remove the segmentation representations if seg displayset changed
      segmentationService.removeSegmentationRepresentationFromToolGroup(
        toolGroupId
      );
      referencedDisplaySetRef.current = null;
    };
  }, [segDisplaySet]);

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
  } = referencedDisplaySetRef.current.metadata;

  const onStatusClick = async () => {
    const isHydrated = await hydrateSEGDisplaySet({
      segDisplaySet,
      viewportIndex,
      servicesManager,
    });

    setIsHydrated(isHydrated);
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
            onStatusClick,
          });
        }}
        studyData={{
          label: viewportLabel,
          useAltStyling: true,
          studyDate: formatDate(StudyDate),
          seriesDescription: `SEG Viewport ${SeriesDescription}`,
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
        {segIsLoading && (
          <LoadingIndicatorTotalPercent
            className="w-full h-full"
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
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneSEGViewport.defaultProps = {
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

export default OHIFCornerstoneSEGViewport;
