import { eventTarget } from '@cornerstonejs/core';
import { Enums, annotation } from '@cornerstonejs/tools';
import { DicomMetadataStore } from '@ohif/core';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';
import getSOPInstanceAttributes from './utils/measurementServiceMappings/utils/getSOPInstanceAttributes';

const { removeAnnotation } = annotation.state;

const csToolsEvents = Enums.Events;

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

const initMeasurementService = (
  MeasurementService,
  DisplaySetService,
  CornerstoneViewportService
) => {
  /* Initialization */
  const {
    Length,
    Bidirectional,
    EllipticalROI,
    ArrowAnnotate,
  } = measurementServiceMappingsFactory(
    MeasurementService,
    DisplaySetService,
    CornerstoneViewportService
  );
  const csTools3DVer1MeasurementSource = MeasurementService.createSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  /* Mappings */
  MeasurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Length',
    Length.matchingCriteria,
    Length.toAnnotation,
    Length.toMeasurement
  );

  MeasurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'Bidirectional',
    Bidirectional.matchingCriteria,
    Bidirectional.toAnnotation,
    Bidirectional.toMeasurement
  );

  MeasurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'EllipticalROI',
    EllipticalROI.matchingCriteria,
    EllipticalROI.toAnnotation,
    EllipticalROI.toMeasurement
  );

  MeasurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'ArrowAnnotate',
    ArrowAnnotate.matchingCriteria,
    ArrowAnnotate.toAnnotation,
    ArrowAnnotate.toMeasurement
  );

  return csTools3DVer1MeasurementSource;
};

const connectToolsToMeasurementService = (
  MeasurementService,
  DisplaySetService,
  CornerstoneViewportService
) => {
  const csTools3DVer1MeasurementSource = initMeasurementService(
    MeasurementService,
    DisplaySetService,
    CornerstoneViewportService
  );
  connectMeasurementServiceToTools(
    MeasurementService,
    CornerstoneViewportService,
    csTools3DVer1MeasurementSource
  );
  const { annotationToMeasurement, remove } = csTools3DVer1MeasurementSource;

  //
  function addMeasurement(csToolsEvent) {
    try {
      const annotationAddedEventDetail = csToolsEvent.detail;
      const {
        annotation: { metadata, annotationUID },
      } = annotationAddedEventDetail;
      const { toolName } = metadata;

      // To force the measurementUID be the same as the annotationUID
      // Todo: this should be changed when a measurement can include multiple annotations
      // in the future
      annotationAddedEventDetail.uid = annotationUID;
      annotationToMeasurement(toolName, annotationAddedEventDetail);
    } catch (error) {
      console.warn('Failed to update measurement:', error);
    }
  }
  function updateMeasurement(csToolsEvent) {
    try {
      const annotationModifiedEventDetail = csToolsEvent.detail;

      const {
        annotation: { metadata, annotationUID },
      } = annotationModifiedEventDetail;

      // If the measurement hasn't been added, don't modify it
      const measurement = MeasurementService.getMeasurement(annotationUID);

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

      const {
        added: addedSelectedAnnotationUIDs,
        removed: removedSelectedAnnotationUIDs,
      } = annotationSelectionEventDetail;

      if (removedSelectedAnnotationUIDs) {
        removedSelectedAnnotationUIDs.forEach(annotationUID =>
          MeasurementService.setMeasurementSelected(annotationUID, false)
        );
      }

      if (addedSelectedAnnotationUIDs) {
        addedSelectedAnnotationUIDs.forEach(annotationUID =>
          MeasurementService.setMeasurementSelected(annotationUID, true)
        );
      }
    } catch (error) {
      console.warn('Failed to select and unselect measurements:', error);
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
      try {
        const annotationRemovedEventDetail = csToolsEvent.detail;
        const {
          annotation: { annotationUID },
        } = annotationRemovedEventDetail;

        const measurement = MeasurementService.getMeasurement(annotationUID);

        if (measurement) {
          console.log('~~ removeEvt', csToolsEvent);
          remove(annotationUID, annotationRemovedEventDetail);
        }
      } catch (error) {
        console.warn('Failed to update measurement:', error);
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

const connectMeasurementServiceToTools = (
  MeasurementService,
  CornerstoneViewportService,
  measurementSource
) => {
  const {
    MEASUREMENT_REMOVED,
    MEASUREMENTS_CLEARED,
    MEASUREMENT_UPDATED,
    RAW_MEASUREMENT_ADDED,
  } = MeasurementService.EVENTS;

  const csTools3DVer1MeasurementSource = MeasurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  MeasurementService.subscribe(MEASUREMENTS_CLEARED, ({ measurements }) => {
    if (!Object.keys(measurements).length) {
      return;
    }

    for (const measurement of Object.values(measurements)) {
      const { uid, source } = measurement;
      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        continue;
      }

      removeAnnotation(uid);
    }
  });

  MeasurementService.subscribe(
    MEASUREMENT_UPDATED,
    ({ source, measurement, notYetUpdatedAtSource }) => {
      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }

      if (notYetUpdatedAtSource === false) {
        // This event was fired by cornerstone telling the measurement service to sync.
        // Already in sync.
        return;
      }

      const { uid, label } = measurement;

      const sourceAnnotation = annotation.state.getAnnotation(uid);
      const { data, metadata } = sourceAnnotation;

      if (!data) {
        return;
      }

      if (data.label !== label) {
        data.label = label;
      }

      if (metadata.toolName === 'ArrowAnnotate') {
        data.text = label;
      }

      // Todo: trigger render for annotation
    }
  );

  MeasurementService.subscribe(
    RAW_MEASUREMENT_ADDED,
    ({ source, measurement, data, dataSource }) => {
      if (source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }

      const {
        referenceSeriesUID,
        referenceStudyUID,
        SOPInstanceUID,
      } = measurement;

      const instance = DicomMetadataStore.getInstance(
        referenceStudyUID,
        referenceSeriesUID,
        SOPInstanceUID
      );

      let imageId;
      let frameNumber = 1;

      if (measurement?.metadata?.referencedImageId) {
        imageId = measurement.metadata.referencedImageId;
        frameNumber = getSOPInstanceAttributes(
          measurement.metadata.referencedImageId
        ).frameNumber;
      } else {
        imageId = dataSource.getImageIdsForInstance({ instance });
      }

      const annotationManager = annotation.state.getDefaultAnnotationManager();
      annotationManager.addAnnotation({
        annotationUID: measurement.uid,
        highlighted: false,
        isLocked: false,
        invalidated: false,
        metadata: {
          toolName: measurement.toolName,
          FrameOfReferenceUID: measurement.FrameOfReferenceUID,
          referencedImageId: imageId,
        },
        data: {
          text: data.annotation.data.text,
          handles: { ...data.annotation.data.handles },
          cachedStats: { ...data.annotation.data.cachedStats },
          label: data.annotation.data.label,
          frameNumber: frameNumber,
        },
      });
    }
  );

  MeasurementService.subscribe(
    MEASUREMENT_REMOVED,
    ({ source, measurement: removedMeasurementId }) => {
      if (source?.name && source.name !== CORNERSTONE_3D_TOOLS_SOURCE_NAME) {
        return;
      }
      removeAnnotation(removedMeasurementId);
      const renderingEngine = CornerstoneViewportService.getRenderingEngine();
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
