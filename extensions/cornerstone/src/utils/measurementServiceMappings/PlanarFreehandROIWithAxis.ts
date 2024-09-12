import PlanarFreehandROI from './PlanarFreehandROI';

const PlanarFreehandROIWithAxis = {
  ...PlanarFreehandROI,
  toAnnotation: measurement => {
    const annotation = PlanarFreehandROI.toAnnotation(measurement);
    // TODO Add LA SA measurments
    return annotation;
  },
  toMeasurement: (
    csToolsEventDetail,
    displaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    PlanarFreehandROI.toMeasurement(
      csToolsEventDetail,
      displaySetService,
      CornerstoneViewportService,
      getValueTypeFromToolType,
      customizationService
    );
    //TODO Add LA SA measurments
  },
};

export default PlanarFreehandROIWithAxis;
