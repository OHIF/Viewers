import { eventTarget, EVENTS } from '@cornerstonejs/core';
import { Enums, annotation } from '@cornerstonejs/tools';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const { removeAnnotation } = annotation.state;

const csToolsEvents = Enums.Events;

const CORNERSTONE_TOOLS_3D_SOURCE_NAME = 'CornerstoneTools3D';

const initMeasurementService = (
  MeasurementService,
  DisplaySetService,
  Cornerstone3DViewportService
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
    Cornerstone3DViewportService
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
  Cornerstone3DViewportService
) => {
  const csTools3DVer1MeasurementSource = initMeasurementService(
    MeasurementService,
    DisplaySetService,
    Cornerstone3DViewportService
  );
  connectMeasurementServiceToTools(
    MeasurementService,
    Cornerstone3DViewportService,
    csTools3DVer1MeasurementSource
  );
  const { annotationToMeasurement, remove } = csTools3DVer1MeasurementSource;
  const elementEnabledEvt = EVENTS.ELEMENT_ENABLED;

  /* Measurement Service Events */
  eventTarget.addEventListener(elementEnabledEvt, evt => {
    function updateMeasurement(csToolsEvent) {
      try {
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
        try {
          const evtDetail = csToolsEvent.detail;
          const {
            annotation: { annotationUID },
          } = evtDetail;

          const measurement = MeasurementService.getMeasurement(annotationUID);

          if (measurement) {
            console.log('~~ removeEvt', csToolsEvent);
            remove(annotationUID, evtDetail);
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
    const updatedEvt = csToolsEvents.ANNOTATION_MODIFIED;
    const removedEvt = csToolsEvents.ANNOTATION_REMOVED;

    eventTarget.addEventListener(addedEvt, updateMeasurement);
    eventTarget.addEventListener(updatedEvt, updateMeasurement);
    eventTarget.addEventListener(removedEvt, removeMeasurement);
  });

  return csTools3DVer1MeasurementSource;
};

const connectMeasurementServiceToTools = (
  MeasurementService,
  Cornerstone3DViewportService,
  measurementSource
) => {
  const {
    MEASUREMENT_REMOVED,
    MEASUREMENTS_CLEARED,
    MEASUREMENT_UPDATED,
    RAW_MEASUREMENT_ADDED,
  } = MeasurementService.EVENTS;

  const csTools3DVer1MeasurementSource = MeasurementService.getSource(
    CORNERSTONE_TOOLS_3D_SOURCE_NAME,
    '1'
  );

  const { measurementToAnnotation } = csTools3DVer1MeasurementSource;

  MeasurementService.subscribe(MEASUREMENTS_CLEARED, ({ measurements }) => {
    if (!Object.keys(measurements).length) {
      return;
    }

    for (const measurement of Object.values(measurements)) {
      const { uid, source } = measurement;
      if (source.name !== CORNERSTONE_TOOLS_3D_SOURCE_NAME) {
        continue;
      }

      removeAnnotation(uid);
    }
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

      const annotationType = measurement.metadata.toolName;
      measurementToAnnotation(annotationType, measurement);
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
    ({ source, measurement: removedMeasurementId }) => {
      if (source.name !== CORNERSTONE_TOOLS_3D_SOURCE_NAME) {
        return;
      }
      removeAnnotation(removedMeasurementId);
      const renderingEngine = Cornerstone3DViewportService.getRenderingEngine();
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
