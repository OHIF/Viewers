import { eventTarget, Types } from '@cornerstonejs/core';
import { Enums, annotation } from '@cornerstonejs/tools';
import { DicomMetadataStore } from '@ohif/core';

import * as CSExtensionEnums from './enums';
import { toolNames } from './initCornerstoneTools';
import { onCompletedCalibrationLine } from './tools/CalibrationLineTool';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';
import getSOPInstanceAttributes from './utils/measurementServiceMappings/utils/getSOPInstanceAttributes';
import {
  setAnnotationLabel,
  triggerAnnotationRenderForViewportIds,
} from '@cornerstonejs/tools/utilities';
import getActiveViewportEnabledElement from './utils/getActiveViewportEnabledElement';

const { CORNERSTONE_3D_TOOLS_SOURCE_NAME, CORNERSTONE_3D_TOOLS_SOURCE_VERSION } = CSExtensionEnums;
const { removeAnnotation } = annotation.state;
const csToolsEvents = Enums.Events;

const initMeasurementService = (
  measurementService,
  displaySetService,
  cornerstoneViewportService,
  customizationService
) => {
  /* Initialization */
  const {
    Length,
    Bidirectional,
    EllipticalROI,
    CircleROI,
    ArrowAnnotate,
    Angle,
    CobbAngle,
    RectangleROI,
    PlanarFreehandROI,
    SplineROI,
    LivewireContour,
    Probe,
    UltrasoundDirectional,
    UltrasoundPleuraBLine,
    SegmentBidirectional,
  } = measurementServiceMappingsFactory(
    measurementService,
    displaySetService,
    cornerstoneViewportService,
    customizationService
  );
  const csTools3DVer1MeasurementSource = measurementService.createSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  /* Mappings */
  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Length',
    Length.matchingCriteria,
    Length.toAnnotation,
    Length.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Crosshairs',
    Length.matchingCriteria,
    () => {
      return null;
    },
    () => {
      return null;
    }
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Bidirectional',
    Bidirectional.matchingCriteria,
    Bidirectional.toAnnotation,
    Bidirectional.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'EllipticalROI',
    EllipticalROI.matchingCriteria,
    EllipticalROI.toAnnotation,
    EllipticalROI.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'CircleROI',
    CircleROI.matchingCriteria,
    CircleROI.toAnnotation,
    CircleROI.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'ArrowAnnotate',
    ArrowAnnotate.matchingCriteria,
    ArrowAnnotate.toAnnotation,
    ArrowAnnotate.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'CobbAngle',
    CobbAngle.matchingCriteria,
    CobbAngle.toAnnotation,
    CobbAngle.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Angle',
    Angle.matchingCriteria,
    Angle.toAnnotation,
    Angle.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'RectangleROI',
    RectangleROI.matchingCriteria,
    RectangleROI.toAnnotation,
    RectangleROI.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'PlanarFreehandROI',
    PlanarFreehandROI.matchingCriteria,
    PlanarFreehandROI.toAnnotation,
    PlanarFreehandROI.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'SplineROI',
    SplineROI.matchingCriteria,
    SplineROI.toAnnotation,
    SplineROI.toMeasurement
  );

  // On the UI side, the Calibration Line tool will work almost the same as the
  // Length tool
  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'CalibrationLine',
    Length.matchingCriteria,
    Length.toAnnotation,
    Length.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'LivewireContour',
    LivewireContour.matchingCriteria,
    LivewireContour.toAnnotation,
    LivewireContour.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Probe',
    Probe.matchingCriteria,
    Probe.toAnnotation,
    Probe.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'UltrasoundDirectionalTool',
    UltrasoundDirectional.matchingCriteria,
    UltrasoundDirectional.toAnnotation,
    UltrasoundDirectional.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'UltrasoundPleuraBLineTool',
    UltrasoundPleuraBLine.matchingCriteria,
    UltrasoundPleuraBLine.toAnnotation,
    UltrasoundPleuraBLine.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'SegmentBidirectional',
    SegmentBidirectional.matchingCriteria,
    SegmentBidirectional.toAnnotation,
    SegmentBidirectional.toMeasurement
  );

  return csTools3DVer1MeasurementSource;
};

const connectToolsToMeasurementService = ({
  commandsManager,
  servicesManager,
  extensionManager,
}: {
  commandsManager: AppTypes.CommandsManager;
  servicesManager: AppTypes.ServicesManager;
  extensionManager: AppTypes.ExtensionManager;
}) => {
  const {
    measurementService,
    displaySetService,
    cornerstoneViewportService,
    customizationService,
  } = servicesManager.services;
  const csTools3DVer1MeasurementSource = initMeasurementService(
    measurementService,
    displaySetService,
    cornerstoneViewportService,
    customizationService
  );
  connectMeasurementServiceToTools({ servicesManager, commandsManager, extensionManager });
  const { annotationToMeasurement, remove } = csTools3DVer1MeasurementSource;

  //
  function addMeasurement(csToolsEvent) {
    try {
      const annotationAddedEventDetail = csToolsEvent.detail;
      const {
        annotation: { metadata, annotationUID },
      } = annotationAddedEventDetail;
      const { toolName } = metadata;

      if (csToolsEvent.type === completedEvt && toolName === toolNames.CalibrationLine) {
        // show modal to input the measurement (mm)
        onCompletedCalibrationLine(servicesManager, csToolsEvent)
          .then(
            () => {
              console.log('Calibration applied.');
            },
            () => true
          )
          .finally(() => {
            // we don't need the calibration line lingering around, remove the
            // annotation from the display
            removeAnnotation(annotationUID);
            removeMeasurement(csToolsEvent);
            // this will ensure redrawing of annotations
            cornerstoneViewportService.resize();
          });
      } else {
        // To force the measurementUID be the same as the annotationUID
        // Todo: this should be changed when a measurement can include multiple annotations
        // in the future
        annotationAddedEventDetail.uid = annotationUID;
        annotationToMeasurement(toolName, annotationAddedEventDetail);
      }
    } catch (error) {
      console.warn('Failed to add measurement:', error);
    }
  }

  function updateMeasurement(csToolsEvent) {
    try {
      const annotationModifiedEventDetail = csToolsEvent.detail;

      const {
        annotation: { metadata, annotationUID },
      } = annotationModifiedEventDetail;

      // If the measurement hasn't been added, don't modify it
      const measurement = measurementService.getMeasurement(annotationUID);

      if (!measurement) {
        return;
      }
      const { toolName } = metadata;

      annotationModifiedEventDetail.uid = annotationUID;
      // Passing true to indicate this is an update and NOT a annotation (start) completion.
      annotationToMeasurement(toolName, annotationModifiedEventDetail, true);
    } catch (error) {
      console.warn('Failed to update measurement:', error);
    }
  }

  function selectMeasurement(csToolsEvent) {
    try {
      const annotationSelectionEventDetail = csToolsEvent.detail;

      const { added: addedSelectedAnnotationUIDs, removed: removedSelectedAnnotationUIDs } =
        annotationSelectionEventDetail;

      if (removedSelectedAnnotationUIDs) {
        removedSelectedAnnotationUIDs.forEach(annotationUID =>
          measurementService.setMeasurementSelected(annotationUID, false)
        );
      }

      if (addedSelectedAnnotationUIDs) {
        addedSelectedAnnotationUIDs.forEach(annotationUID =>
          measurementService.setMeasurementSelected(annotationUID, true)
        );
      }
    } catch (error) {
      console.warn('Failed to select/unselect measurements:', error);
    }
  }

  /**
   * When csTools fires a removed event, remove the same measurement
   * from the measurement service
   *
   * @param {*} csToolsEvent
   */
  function removeMeasurement(csToolsEvent) {
    try {
      const annotationRemovedEventDetail = csToolsEvent.detail;
      const {
        annotation: { annotationUID },
      } = annotationRemovedEventDetail;
      const measurement = measurementService.getMeasurement(annotationUID);
      if (measurement) {
        remove(annotationUID, annotationRemovedEventDetail);
      }
    } catch (error) {
      console.warn('Failed to remove measurement:', error);
    }
  }

  // on display sets added, check if there are any measurements in measurement service that need to be
  // put into cornerstone tools
  const addedEvt = csToolsEvents.ANNOTATION_ADDED;
  const completedEvt = csToolsEvents.ANNOTATION_COMPLETED;
  const updatedEvt = csToolsEvents.ANNOTATION_MODIFIED;
  const removedEvt = csToolsEvents.ANNOTATION_REMOVED;
  const selectionEvt = csToolsEvents.ANNOTATION_SELECTION_CHANGE;

  eventTarget.addEventListener(addedEvt, addMeasurement);
  eventTarget.addEventListener(completedEvt, addMeasurement);
  eventTarget.addEventListener(updatedEvt, updateMeasurement);
  eventTarget.addEventListener(removedEvt, removeMeasurement);
  eventTarget.addEventListener(selectionEvt, selectMeasurement);

  return csTools3DVer1MeasurementSource;
};

const connectMeasurementServiceToTools = ({
  servicesManager,
  commandsManager,
  extensionManager,
}) => {
  const { measurementService, cornerstoneViewportService, viewportGridService } =
    servicesManager.services;
  const { MEASUREMENT_REMOVED, MEASUREMENTS_CLEARED, MEASUREMENT_UPDATED, RAW_MEASUREMENT_ADDED } =
    measurementService.EVENTS;

  measurementService.subscribe(MEASUREMENTS_CLEARED, ({ measurements }) => {
    if (!Object.keys(measurements).length) {
      return;
    }

    commandsManager.run('startRecordingForAnnotationGroup');
    for (const measurement of Object.values(measurements)) {
      const { uid, source } = measurement;
      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        continue;
      }
      const removedAnnotation = annotation.state.getAnnotation(uid);
      removeAnnotation(uid);
      commandsManager.run('triggerCreateAnnotationMemo', {
        annotation: removedAnnotation,
        FrameOfReferenceUID: removedAnnotation.metadata.FrameOfReferenceUID,
        options: { deleting: true },
      });
    }
    commandsManager.run('endRecordingForAnnotationGroup');

    // trigger a render
    cornerstoneViewportService.getRenderingEngine().render();
  });

  measurementService.subscribe(
    MEASUREMENT_UPDATED,
    ({ source, measurement, notYetUpdatedAtSource }) => {
      if (!source) {
        return;
      }

      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }

      if (notYetUpdatedAtSource === false) {
        // This event was fired by cornerstone telling the measurement service to sync.
        // Already in sync.
        return;
      }

      const { uid, label, isLocked, isVisible } = measurement;
      const sourceAnnotation = annotation.state.getAnnotation(uid);
      const { data, metadata } = sourceAnnotation;

      if (!data) {
        return;
      }

      if (data.label !== label) {
        const element = getActiveViewportEnabledElement(viewportGridService)?.viewport.element;
        setAnnotationLabel(sourceAnnotation, element, label);
      }

      // update the isLocked state
      annotation.locking.setAnnotationLocked(uid, isLocked);

      // update the isVisible state
      annotation.visibility.setAnnotationVisibility(uid, isVisible);

      // annotation.config.style.setAnnotationStyles(uid, {
      //   color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
      // });

      // I don't like this but will fix later
      const renderingEngine =
        cornerstoneViewportService.getRenderingEngine() as Types.IRenderingEngine;
      // Note: We could do a better job by triggering the render on the
      // viewport itself, but the removeAnnotation does not include that info...
      const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
      triggerAnnotationRenderForViewportIds(viewportIds);
    }
  );

  measurementService.subscribe(
    RAW_MEASUREMENT_ADDED,
    ({ source, measurement, data, dataSource }) => {
      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }

      const { referenceSeriesUID, referenceStudyUID, SOPInstanceUID, metadata } = measurement;

      const instance = DicomMetadataStore.getInstance(
        referenceStudyUID,
        referenceSeriesUID,
        SOPInstanceUID
      );

      let imageId;
      let frameNumber = 1;

      if (measurement?.metadata?.referencedImageId) {
        imageId = measurement.metadata.referencedImageId;
        frameNumber = getSOPInstanceAttributes(measurement.metadata.referencedImageId).frameNumber;
      } else {
        imageId = dataSource.getImageIdsForInstance({ instance });
      }

      /**
       * This annotation is used by the cornerstone viewport.
       * This is not the read-only annotation rendered by the SR viewport.
       */
      const annotationManager = annotation.state.getAnnotationManager();
      const newAnnotation = {
        annotationUID: measurement.uid,
        highlighted: false,
        isLocked: false,
        // This is used to force a re-render of the annotation to
        // re-calculate cached stats since sometimes in SR we
        // get empty cached stats
        invalidated: true,
        metadata: {
          ...metadata,
          toolName: measurement.toolName,
          FrameOfReferenceUID: measurement.FrameOfReferenceUID,
          referencedImageId: imageId,
        },
        data: {
          /**
           * Don't remove this destructuring of data here.
           * This is used to pass annotation specific data forward e.g. contour
           */
          ...(data.annotation.data || {}),
          text: data.annotation.data.text,
          handles: { ...data.annotation.data.handles },
          cachedStats: { ...data.annotation.data.cachedStats },
          label: data.annotation.data.label,
          frameNumber,
        },
      };
      annotationManager.addAnnotation(newAnnotation);
      commandsManager.run('triggerCreateAnnotationMemo', {
        annotation: newAnnotation,
        FrameOfReferenceUID: newAnnotation.metadata.FrameOfReferenceUID,
        options: { newAnnotation: true },
      });
    }
  );

  measurementService.subscribe(
    MEASUREMENT_REMOVED,
    ({ source, measurement: removedMeasurementId }) => {
      if (source?.name && source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }
      const removedAnnotation = annotation.state.getAnnotation(removedMeasurementId);
      removeAnnotation(removedMeasurementId);
      commandsManager.run('triggerCreateAnnotationMemo', {
        annotation: removedAnnotation,
        FrameOfReferenceUID: removedAnnotation.metadata.FrameOfReferenceUID,
        options: { deleting: true },
      });
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      // Note: We could do a better job by triggering the render on the
      // viewport itself, but the removeAnnotation does not include that info...
      renderingEngine.render();
    }
  );
};

export {
  initMeasurementService,
  connectToolsToMeasurementService,
  connectMeasurementServiceToTools,
};
