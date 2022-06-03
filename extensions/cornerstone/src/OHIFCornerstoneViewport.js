import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import setCornerstoneMeasurementActive from './_shared/setCornerstoneMeasurementActive';
import ViewportOverlay from './ViewportOverlay';

import { useCine, useViewportGrid } from '@ohif/ui';

const scrollToIndex = csTools.importInternal('util/scrollToIndex');

const { StackManager, nlApi } = OHIF.utils;
const { DicomMetadataStore } = OHIF;

const getQueryParam = key => {
  const urlParams = new URLSearchParams(window.location.search);
  return Number(urlParams.get(key)) || 0;
};

function OHIFCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  onElementEnabled,
  element,
  viewportIndex,
  servicesManager,
  commandsManager,
}) {
  const {
    ToolBarService,
    DisplaySetService,
    MeasurementService,
    HangingProtocolService,
  } = servicesManager.services;
  const [viewportData, setViewportData] = useState(null);
  const [{ cines }, cineService] = useCine();
  const [{ viewports }, viewportGridService] = useViewportGrid();
  const [isParamViewLoaded, setIsParamViewLoaded] = useState(false);
  const isMounted = useRef(false);
  const stageChangedRef = useRef(false);

  const onNewImage = (element, callback) => {
    const handler = () => {
      element.removeEventListener(cornerstone.EVENTS.IMAGE_RENDERED, handler);
      callback(element, ToolBarService);
    };
    element.addEventListener(cornerstone.EVENTS.IMAGE_RENDERED, handler);
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      StackManager.clearStacks();
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.STAGE_CHANGE,
      () => {
        stageChangedRef.current = true;
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    cineService.setCine({ id: viewportIndex });
  }, [viewportIndex]);

  useEffect(() => {
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUids,
    } = displaySet;

    if (!StudyInstanceUID || !displaySetInstanceUID) {
      return;
    }

    if (sopClassUids && sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    _getViewportData(dataSource, displaySet).then(data => {
      if (isMounted.current) {
        const instanceNumberParam = getQueryParam('instance_number');
        const seriesNumberParam = getQueryParam('series_number');

        if (
          !isParamViewLoaded &&
          instanceNumberParam &&
          displaySet.SeriesNumber === seriesNumberParam
        ) {
          data.stack.initialImageIdIndex =
            (instanceNumberParam > displaySet.numImageFrames
              ? displaySet.numImageFrames
              : instanceNumberParam) - 1;
          setIsParamViewLoaded(true);
        }

        setViewportData(data);
      }
    });
  }, [dataSource, displaySet, viewportIndex]);

  useEffect(() => {
    const unsubscribeFromJumpToMeasurementEvents = _subscribeToJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID,
      viewportGridService
    );

    _checkForCachedJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID,
      viewportGridService
    );

    // reseting the HP stage changed flag
    if (element) {
      onNewImage(element, () => {
        stageChangedRef.current = false;

        const { StudyInstanceUID, SeriesInstanceUID } = displaySet;
        const study = DicomMetadataStore.getStudy(StudyInstanceUID);
        nlApi
          .get(`/api/measurement/?study_id=${study.series[0].study_id}`)
          .then(({ data }) => {
            const { VALUE_TYPES } = MeasurementService;
            const VALUE_TYPE_TO_TOOL_TYPE = {
              [VALUE_TYPES.POLYLINE]: 'Length',
              [VALUE_TYPES.ELLIPSE]: 'EllipticalRoi',
              [VALUE_TYPES.BIDIRECTIONAL]: 'Bidirectional',
              [VALUE_TYPES.POINT]: 'ArrowAnnotate',
              [VALUE_TYPES.FREEHAND]: 'NLFreehandRoi',
              [VALUE_TYPES.RECTANGLE]: 'RectangleRoi',
              [VALUE_TYPES.ANGLE]: 'Angle',
            };
            const { results: _measurements } = data;
            if (_measurements.length > 0) {
              const { name, version } = _measurements[0].source;
              const source = MeasurementService.getSource(name, version);
              if (source) {
                const { addOrUpdate } = source;
                _measurements
                  .sort((x, y) => new Date(x.created) - new Date(y.created))
                  .forEach(m => {
                    const toolType = VALUE_TYPE_TO_TOOL_TYPE[m.type];
                    const measurementData = _toMeasurementData(m, toolType);
                    const instance = {
                      StudyInstanceUID: m.reference_study_uid,
                      SeriesInstanceUID: m.reference_series_uid,
                      SOPInstanceUID: m.sop_instance_uid,
                    };
                    const _displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
                      instance.SOPInstanceUID,
                      instance.SeriesInstanceUID
                    );
                    if (m.reference_series_uid === SeriesInstanceUID) {
                      const imageId = dataSource.getImageIdsForInstance({
                        instance,
                      });
                      const { globalImageIdSpecificToolStateManager } = csTools;
                      const {
                        toolState,
                      } = globalImageIdSpecificToolStateManager;
                      if (
                        toolState[imageId] &&
                        toolState[imageId][toolType] &&
                        toolState[imageId][toolType].data.find(
                          x => x.id === m.id
                        )
                      ) {
                        return;
                      }
                      globalImageIdSpecificToolStateManager.addImageIdToolState(
                        imageId,
                        toolType,
                        {
                          ...measurementData,
                          id: m.id,
                        }
                      );
                    }
                    addOrUpdate(toolType, {
                      element,
                      toolName: toolType,
                      toolType,
                      measurementData,
                      id: m.id,
                      instance: {
                        ...instance,
                        FrameOfReferenceUID: m.frame_of_reference_uid,
                        displaySetInstanceUID:
                          _displaySet.displaySetInstanceUID,
                      },
                    });
                  });
                cornerstone.updateImage(element);
              }
            }
          });
      });
    }

    // running HP-defined callbacks: invert, window level ...
    if (element && displaySet.renderedCallback) {
      onNewImage(element, displaySet.renderedCallback);
    }

    return () => {
      unsubscribeFromJumpToMeasurementEvents();
    };
  }, [element, displaySet]);

  let childrenWithProps = null;

  if (!viewportData) {
    return null;
  }

  const {
    imageIds,
    initialImageIdIndex,
    // If this comes from the instance, would be a better default
    // `FrameTime` in the instance
    // frameRate = 0,
  } = viewportData.stack;

  // TODO: Does it make more sense to use Context?
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

  // We have...
  // StudyInstanceUid, DisplaySetInstanceUid
  // Use displaySetInstanceUid --> SeriesInstanceUid
  // Get meta for series, map to actionBar
  // const displaySet = DisplaySetService.getDisplaySetByUID(
  //   dSet.displaySetInstanceUID
  // );
  // TODO: This display contains the meta for all instances.
  // That can't be right...
  // console.log('DISPLAYSET', displaySet);
  // const seriesMeta = DicomMetadataStore.getSeries(this.props.displaySet.StudyInstanceUID, '');
  // console.log(seriesMeta);

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;
  const frameRate = (cine && cine.frameRate) || 24;

  return (
    <div className="relative flex flex-row w-full h-full overflow-hidden">
      <CornerstoneViewport
        onElementEnabled={onElementEnabled}
        viewportIndex={viewportIndex}
        imageIds={imageIds}
        imageIdIndex={initialImageIdIndex}
        initialViewport={displaySet.initialViewport} // from hanging protocol
        stageChanged={stageChangedRef.current}
        // Sync resize throttle w/ sidepanel animation duration to prevent
        // seizure inducing strobe blinking effect
        resizeRefreshRateMs={150}
        // TODO: ViewportGrid Context?
        isActive={true} // todo
        isStackPrefetchEnabled={true} // todo
        isPlaying={isPlaying}
        frameRate={frameRate}
        isOverlayVisible={true}
        loadingIndicatorComponent={ViewportLoadingIndicator}
        viewportOverlayComponent={props => {
          return (
            <ViewportOverlay
              {...props}
              activeTools={ToolBarService.getActiveTools()}
            />
          );
        }}
      />
      {childrenWithProps}
    </div>
  );
}

OHIFCornerstoneViewport.propTypes = {
  displaySet: PropTypes.object,
  viewportIndex: PropTypes.number,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
  ToolBarService: PropTypes.object,
};

OHIFCornerstoneViewport.defaultProps = {
  customProps: {},
};

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function _getCornerstoneStack(displaySet, dataSource) {
  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  return stack;
}

async function _getViewportData(dataSource, displaySet) {
  const stack = _getCornerstoneStack(displaySet, dataSource);

  const viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
}

const _toMeasurementData = (measurement, toolType) => {
  if (toolType === 'RectangleRoi' || toolType === 'EllipticalRoi') {
    return {
      handles: measurement.handles,
      cachedStats: {
        area: measurement.area,
        mean: measurement.mean,
        stdDev: measurement.std_dev,
      },
      unit: measurement.unit,
      label: measurement.label || measurement.text,
    };
  } else if (toolType === 'Angle') {
    return {
      handles: measurement.handles,
      rAngle: measurement.angle,
      text: measurement.label || measurement.text,
    };
  } else if (toolType === 'NLFreehandRoi') {
    return {
      handles: measurement.handles.handles,
      polyBoundingBox: measurement.handles.polyBoundingBox,
      meanStdDev: {
        mean: measurement.mean,
        stdDev: measurement.std_dev,
      },
      area: measurement.area,
      unit: measurement.unit,
      label: measurement.label || measurement.text,
    };
  } else if (toolType === 'Bidirectional') {
    return {
      handles: measurement.handles,
      longestDiameter: measurement.longest_diameter,
      shortestDiameter: measurement.shortest_diameter,
      label: measurement.label || measurement.text,
    };
  } else if (toolType === 'ArrowAnnotate') {
    return {
      handles: measurement.handles,
      text: measurement.text || measurement.label,
    };
  } else if (toolType === 'Length') {
    return {
      handles: measurement.handles,
      length: measurement.length,
      unit: measurement.unit,
      label: measurement.label || measurement.text,
    };
  }
};

function _subscribeToJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID,
  viewportGridService
) {
  const { unsubscribe } = MeasurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
    ({ measurement }) => {
      if (!measurement) return;
      // check if the correct viewport index.
      // if (viewportIndex !== jumpToMeasurementViewportIndex) {
      //   // Event for a different viewport.
      //   return;
      // }

      // Jump the the measurement if the displaySetInstanceUID matches
      if (measurement.displaySetInstanceUID === displaySetInstanceUID) {
        _jumpToMeasurement(
          measurement,
          element,
          viewportIndex,
          MeasurementService,
          DisplaySetService,
          viewportGridService
        );
      }
    }
  );

  return unsubscribe;
}

function _checkForCachedJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID,
  viewportGridService
) {
  // Check if there is a queued jumpToMeasurement event
  const measurementIdToJumpTo = MeasurementService.getJumpToMeasurement(
    viewportIndex
  );

  if (measurementIdToJumpTo && element) {
    // Jump to measurement if the measurement exists
    const measurement = MeasurementService.getMeasurement(
      measurementIdToJumpTo
    );

    if (measurement.displaySetInstanceUID === displaySetInstanceUID) {
      _jumpToMeasurement(
        measurement,
        element,
        viewportIndex,
        MeasurementService,
        DisplaySetService,
        viewportGridService
      );
    }
  }
}

function _jumpToMeasurement(
  measurement,
  targetElement,
  viewportIndex,
  MeasurementService,
  DisplaySetService,
  viewportGridService
) {
  const { displaySetInstanceUID, SOPInstanceUID } = measurement;

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  const imageIndex = referencedDisplaySet.images.findIndex(
    i => i.SOPInstanceUID === SOPInstanceUID
  );

  setCornerstoneMeasurementActive(measurement);
  viewportGridService.setActiveViewportIndex(viewportIndex);
  if (targetElement !== null) {
    const enabledElement = cornerstone.getEnabledElement(targetElement);

    // Wait for the image to update or we get a race condition when the element has only just been enabled.
    const scrollToHandler = evt => {
      scrollToIndex(targetElement, imageIndex);
      targetElement.removeEventListener(
        'cornerstoneimagerendered',
        scrollToHandler
      );
    };
    targetElement.addEventListener('cornerstoneimagerendered', scrollToHandler);

    if (enabledElement.image) {
      cornerstone.updateImage(targetElement);
    }

    // Jump to measurement consumed, remove.
    MeasurementService.removeJumpToMeasurement(viewportIndex);
  }
}

export default OHIFCornerstoneViewport;
