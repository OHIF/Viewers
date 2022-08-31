import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';

import { eventTarget, cache, Enums } from '@cornerstonejs/core';
import { segmentation as cstSegmentation } from '@cornerstonejs/tools';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';

import createSEGToolGroupAndAddTools from '../utils/initSEGToolGroup';

const { formatDate } = utils;

const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';

function OHIFCornerstoneSEGViewport(props) {
  const {
    children,
    displaySets,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
  } = props;

  const {
    DisplaySetService,
    ToolGroupService,
    CornerstoneViewportService,
    SegmentationService,
  } = servicesManager.services;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();

  // States
  const [toolGroupId, setToolGroupId] = useState(null);
  const [referencedDisplaySet, setReferencedDisplaySet] = useState(null);
  const [segmentationIsLoaded, setSegmentationIsLoaded] = useState(false);
  const [
    referencedDisplaySetMetadata,
    setReferencedDisplaySetMetadata,
  ] = useState(null);

  // const [isHydrated, setIsHydrated] = useState(
  //   segDisplaySet.isHydrated
  // );
  const [element, setElement] = useState(null);
  const { viewports, activeViewportIndex } = viewportGrid;
  const callbackRef = useRef(null);

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

    // remove the segmentation representations as well
    SegmentationService.removeSegmentationRepresentationFromToolGroup(
      toolGroupId
    );

    // Note: toolgroup should be removed after the segmentation representations
    // are removed, since cornerstone need to remove the labelmap before removing
    // the toolgroup
    ToolGroupService.destroyToolGroup(toolGroupId);
  };

  const DisplaySegmentationImage = useCallback(async () => {
    const segmentationId = segDisplaySet.displaySetInstanceUID;
    SegmentationService.addSegmentationRepresentationToToolGroup(
      toolGroupId,
      segmentationId
    );
  }, [segDisplaySet, toolGroupId]);

  const getCornerstoneViewport = useCallback(() => {
    if (!referencedDisplaySet) {
      return null;
    }

    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    // const { measurements } = segDisplaySet;
    // const measurement = measurements[measurementSelected];

    // if (!measurement) {
    //   return null;
    // }

    // const initialImageIndex = referencedDisplaySet.images.findIndex(
    //   image => image.imageId === measurement.imageId
    // );

    return (
      <Component
        {...props}
        displaySets={[referencedDisplaySet, segDisplaySet]}
        viewportOptions={{
          toolGroupId: `${SEG_TOOLGROUP_BASE_NAME}-${viewportIndex}`,
          viewportType: 'volume',
          orientation: 'axial', // todo: make this default orientation
        }}
        onElementEnabled={onElementEnabled}
        onElementDisabled={onElementDisabled}
        // initialImageIndex={initialImageIndex}
      ></Component>
    );
  }, [referencedDisplaySet, viewportIndex]);

  const onMeasurementChange = useCallback(direction => {
    // let newMeasurementSelected = measurementSelected;
    // if (direction === 'right') {
    //   newMeasurementSelected++;
    //   if (newMeasurementSelected >= measurementCount) {
    //     newMeasurementSelected = 0;
    //   }
    // } else {
    //   newMeasurementSelected--;
    //   if (newMeasurementSelected < 0) {
    //     newMeasurementSelected = measurementCount - 1;
    //   }
    // }
    // setTrackingIdentifiers(newMeasurementSelected);
    // updateViewport(newMeasurementSelected);
  }, []);

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
    if (toolGroupId !== null) {
      return;
    }

    const _toolGroupId = createSEGToolGroupAndAddTools(
      ToolGroupService,
      viewportIndex,
      extensionManager
    );

    setToolGroupId(_toolGroupId);

    return () => {
      // we don't need a cleanup function, because the tool group is destroyed
      // when the element is disabled automatically
      // _removeToolGroup(toolGroupId);
    };
  }, [toolGroupId]);

  useEffect(() => {
    const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();

    const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
      referencedDisplaySet
    );

    setReferencedDisplaySet(referencedDisplaySet);
    setReferencedDisplaySetMetadata(referencedDisplaySetMetadata);

    const loadSegmentations = async () => {
      await segDisplaySet.load(toolGroupId);
      setSegmentationIsLoaded(true);
    };

    if (!segDisplaySet.isLoaded) {
      loadSegmentations();
    }
  }, [segDisplaySet]);

  useEffect(() => {
    if (!segmentationIsLoaded) {
      return;
    }

    const { referencedVolumeId } = segDisplaySet;
    const referencedVolume = cache.getVolume(referencedVolumeId);

    if (referencedVolume) {
      DisplaySegmentationImage();
      return;
    }

    eventTarget.addEventListener(Enums.Events.IMAGE_VOLUME_MODIFIED, evt => {
      if (callbackRef.current) {
        return;
      }

      callbackRef.current = true;
      DisplaySegmentationImage();
    });
  }, [segDisplaySet, segmentationIsLoaded]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  if (!referencedDisplaySet || !referencedDisplaySetMetadata) {
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

  const { Modality } = segDisplaySet;

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
  } = referencedDisplaySetMetadata;

  // TODO -> disabled double click for now: onDoubleClick={_onDoubleClick}
  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onPillClick={() => {
          // sendTrackedMeasurementsEvent('RESTORE_PROMPT_HYDRATE_SEG', {
          //   displaySetInstanceUID: segDisplaySet.displaySetInstanceUID,
          //   viewportIndex,
          // });
          console.debug('SEG viewport pill click');
        }}
        onSeriesChange={onMeasurementChange}
        studyData={{
          label: viewportLabel,
          useAltStyling: true,
          isTracked: false,
          isLocked: false,
          isRehydratable: segDisplaySet.isRehydratable,
          isHydrated: false,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: `SEG Viewport ${SeriesDescription}`,
          modality: Modality,
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
        {getCornerstoneViewport()}
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
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
