import { eventTarget, EVENTS } from '@cornerstonejs/core';
import { Enums, annotation } from '@cornerstonejs/tools';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const { getAnnotation, removeAnnotation } = annotation.state;

const csToolsEvents = Enums.Events;

const CORNERSTONE_TOOLS_3D_SOURCE_NAME = 'CornerstoneTools3D';

const initMeasurementService = (
  MeasurementService,
  DisplaySetService,
  ViewportService
) => {
  /* Initialization */
  const {
    Length,
    Bidirectional,
    EllipticalROI,
    RectangleROI,
  } = measurementServiceMappingsFactory(
    MeasurementService,
    DisplaySetService,
    ViewportService
  );
  const csTools3DVer1MeasurementSource = MeasurementService.createSource(
    CORNERSTONE_TOOLS_3D_SOURCE_NAME,
    '1'
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
    'RectangleROI',
    RectangleROI.matchingCriteria,
    RectangleROI.toAnnotation,
    RectangleROI.toMeasurement
  );

  return csTools3DVer1MeasurementSource;
};

const connectToolsToMeasurementService = (
  MeasurementService,
  DisplaySetService,
  ViewportService
) => {
  const csTools3DVer1MeasurementSource = initMeasurementService(
    MeasurementService,
    DisplaySetService,
    ViewportService
  );
  connectMeasurementServiceToTools(
    MeasurementService,
    ViewportService,
    csTools3DVer1MeasurementSource
  );
  const { annotationToMeasurement, remove } = csTools3DVer1MeasurementSource;
  const elementEnabledEvt = EVENTS.ELEMENT_ENABLED;

  /* Measurement Service Events */
  eventTarget.addEventListener(elementEnabledEvt, evt => {
    function addMeasurement(csToolsEvent) {
      try {
        const evtDetail = csToolsEvent.detail;
        const { annotation } = evtDetail;
        const {
          metadata: { toolName },
          annotationUID,
        } = annotation;

        // setting the evtDetail to be the annotation UID in order for measurement service to
        // NOT creates its own measurementUID. Todo: this should be rethought
        // when we implement the architecture where a measurement can have more than one annotation.
        evtDetail.uid = annotationUID;
        annotationToMeasurement(toolName, evtDetail);
      } catch (error) {
        console.warn('Failed to add measurement:', error);
      }
    }

    function updateMeasurement(csToolsEvent) {
      try {
        if (!csToolsEvent.detail.annotation) {
          return;
        }

        const evtDetail = csToolsEvent.detail;
        const {
          annotation: { metadata, annotationUID },
        } = evtDetail;
        const { toolName } = metadata;

        evtDetail.uid = annotationUID;
        annotationToMeasurement(toolName, evtDetail);
      } catch (error) {
        console.warn('Failed to update measurement:', error);
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
        if (csToolsEvent.detail.toolData.metadata.toolDataUID) {
          // check if measurement service has such tool id
          const id = csToolsEvent.detail.toolData.metadata.toolDataUID;

          const measurement = MeasurementService.getMeasurement(id);

          if (measurement) {
            console.log('~~ removeEvt', csToolsEvent);
            remove(id);
          }
        }
      } catch (error) {
        console.warn('Failed to remove measurement:', error);
      }
    }

    // on display sets added, check if there are any measurements in measurement service that need to be
    // put into cornerstone tools
    const addedEvt = csToolsEvents.ANNOTATION_ADDED;
    const updatedEvt = csToolsEvents.ANNOTATION_MODIFIED;
    const removedEvt = csToolsEvents.ANNOTATION_REMOVED;

    eventTarget.addEventListener(addedEvt, addMeasurement);
    eventTarget.addEventListener(updatedEvt, updateMeasurement);
    eventTarget.addEventListener(removedEvt, removeMeasurement);
  });

  return csTools3DVer1MeasurementSource;
};

const connectMeasurementServiceToTools = (
  MeasurementService,
  ViewportService,
  measurementSource
) => {
  const {
    MEASUREMENT_REMOVED,
    MEASUREMENTS_CLEARED,
    MEASUREMENT_UPDATED,
    RAW_MEASUREMENT_ADDED,
  } = MeasurementService.EVENTS;

  MeasurementService.subscribe(MEASUREMENTS_CLEARED, () => {
    // Todo: handle all measurements cleared
  });

  MeasurementService.subscribe(
    MEASUREMENT_UPDATED,
    ({ source, measurement, notYetUpdatedAtSource }) => {
      if (source.name !== CORNERSTONE_TOOLS_3D_SOURCE_NAME) {
        return;
      }

      if (notYetUpdatedAtSource === false) {
        // This event was fired by cornerstone telling the measurement service to sync.
        // Already in sync.
        return;
      }

      const { id, label } = measurement;
      const toolData = getAnnotation(id);

      if (toolData) {
        if ('label' in toolData.metadata) {
          toolData.metadata.label = label;
        }
      }
    }
  );

  MeasurementService.subscribe(
    RAW_MEASUREMENT_ADDED,
    ({ source, measurement, data, dataSource }) => {
      if (source.name !== CORNERSTONE_TOOLS_3D_SOURCE_NAME) {
        return;
      }
      // Todo: handle raw measurements added (the case where a measurement is added from
      // another source.)
    }
  );

  MeasurementService.subscribe(
    MEASUREMENT_REMOVED,
    ({ source, measurement: removedMeasurementId, element }) => {
      if (source.name !== CORNERSTONE_TOOLS_3D_SOURCE_NAME) {
        return;
      }
      removeAnnotation(element, removedMeasurementId);
      ViewportService.getRenderingEngine().render();
    }
  );
};

export {
  initMeasurementService,
  connectToolsToMeasurementService,
  connectMeasurementServiceToTools,
};
