import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';

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
  } = servicesManager.services;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();

  // States
  const [isSegDisplaySetLoaded, setIsSegDisplaySetLoaded] = useState(false);
  const [toolGroupId, setToolGroupId] = useState(null);
  const [referencedDisplaySet, setReferencedDisplaySet] = useState(null);
  const [
    referencedDisplaySetMetadata,
    setReferencedDisplaySetMetadata,
  ] = useState(null);

  // const [isHydrated, setIsHydrated] = useState(
  //   segDisplaySet.isHydrated
  // );
  const [element, setElement] = useState(null);
  const { viewports, activeViewportIndex } = viewportGrid;

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

    // remove the temporary tool Group from the state
    ToolGroupService.destroyToolGroup(toolGroupId);
  };

  useEffect(() => {
    if (toolGroupId !== null) {
      return;
    }

    const createdToolGroupId = _createToolGroupAndAddTools(
      ToolGroupService,
      viewportIndex,
      extensionManager
    );
    setToolGroupId(createdToolGroupId);

    return () => {
      // we don't need a cleanup function, because the tool group is destroyed
      // when the element is disabled automatically
      // _removeToolGroup(toolGroupId);
    };
  }, [toolGroupId]);

  // const updateViewport = useCallback(
  //   newMeasurementSelected => {
  //     const {
  //       StudyInstanceUID,
  //       displaySetInstanceUID,
  //       sopClassUids,
  //     } = segDisplaySet;

  //     if (!StudyInstanceUID || !displaySetInstanceUID) {
  //       return;
  //     }

  //     if (sopClassUids && sopClassUids.length > 1) {
  //       // Todo: what happens if there are multiple SOP Classes? Why we are
  //       // not throwing an error?
  //       console.warn(
  //         'More than one SOPClassUID in the same series is not yet supported.'
  //       );
  //     }

  //     _getViewportReferencedDisplaySetData(
  //       segDisplaySet,
  //       newMeasurementSelected,
  //       DisplaySetService
  //     ).then(({ referencedDisplaySet, referencedDisplaySetMetadata }) => {
  //       setMeasurementSelected(newMeasurementSelected);
  //       setreferencedDisplaySet(referencedDisplaySet);
  //       setReferencedDisplaySetMetadata(referencedDisplaySetMetadata);

  //       if (
  //         referencedDisplaySet.displaySetInstanceUID ===
  //         referencedDisplaySet?.displaySetInstanceUID
  //       ) {
  //         const { measurements } = segDisplaySet;

  //         // it means that we have a new referenced display set, and the
  //         // imageIdIndex will handle it by updating the viewport, but if they
  //         // are the same we just need to use MeasurementService to jump to the
  //         // new measurement
  //         const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
  //           viewportIndex
  //         );

  //         const csViewport = CornerstoneViewportService.getCornerstoneViewport(
  //           viewportInfo.getViewportId()
  //         );

  //         const imageIds = csViewport.getImageIds();

  //         const imageIdIndex = imageIds.indexOf(
  //           measurements[newMeasurementSelected].imageId
  //         );

  //         if (imageIdIndex !== -1) {
  //           csViewport.setImageIdIndex(imageIdIndex);
  //         }
  //       }
  //     });
  //   },
  //   [dataSource, segDisplaySet, referencedDisplaySet, viewportIndex]
  // );

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
    const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();

    const { referencedDisplaySetMetadata } = _getReferencedDisplaySetMetadata(
      referencedDisplaySet
    );

    setReferencedDisplaySet(referencedDisplaySet);
    setReferencedDisplaySetMetadata(referencedDisplaySetMetadata);
  }, [segDisplaySet]);

  /**
   * Loading the segmentations from the SEG viewport, only when the toolGroup
   * for the viewport is created.
   */
  useEffect(() => {
    const { unsubscribe } = ToolGroupService.subscribe(
      ToolGroupService.EVENTS.VIEWPORT_ADDED,
      ({ toolGroupId: newToolGroupId }) => {
        if (newToolGroupId !== toolGroupId) {
          return;
        }

        const loadSegmentations = async () => {
          await segDisplaySet.load(toolGroupId);
          setIsSegDisplaySetLoaded(true);
        };

        if (!segDisplaySet.isLoaded) {
          loadSegmentations();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolGroupId, segDisplaySet, referencedDisplaySet]);

  /**
   * Hook to update the tracking identifiers when the selected measurement changes or
   * the element changes
   */
  // useEffect(() => {
  //   if (!element || !segDisplaySet.isLoaded) {
  //     return;
  //   }
  //   setTrackingIdentifiers(measurementSelected);
  // }, [measurementSelected, element, setTrackingIdentifiers, segDisplaySet]);

  /**
   * Data fetching for the SEG displaySet
   */
  // useEffect(() => {
  //   updateViewport();
  // }, [dataSource, segDisplaySet]);

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

function _createToolGroupAndAddTools(
  ToolGroupService,
  viewportIndex,
  extensionManager
) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
    ],
    enabled: [{ toolName: toolNames.SegmentationDisplay }],
  };

  const toolGroupId = `${SEG_TOOLGROUP_BASE_NAME}-${viewportIndex}`;
  ToolGroupService.createToolGroupAndAddTools(toolGroupId, tools, {});

  return toolGroupId;
}

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

  return { referencedDisplaySetMetadata, referencedDisplaySet };
}

export default OHIFCornerstoneSEGViewport;
