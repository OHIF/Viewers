import * as cs3dTools from '@cornerstonejs/tools';
import { AnnotationData, Measurement } from '../types';

export const annotationService = () => {
  /**
   *
   * @param measurementService
   * @param annotationDataArray
   * @param annotationMeasurementDataArray
   *
   * We are not only displaying annotations on screen, we are also registering their measurements
   * so that we could manipulate them.
   *
   * @returns void
   */
  const registerRetrievedAnnotations = (
    measurementService,
    annotationDataArray,
    annotationMeasurementDataArray
  ) => {
    for (let i = 0; i < annotationDataArray?.length; i++) {
      // displaying annotations
      cs3dTools.annotation.state.addAnnotation(annotationDataArray[i]);
      measurementService.setMeasurementDataForAnnotations(annotationMeasurementDataArray[i]);
    }
  };

  const extractAnnotationDataFromMeasurement = (measurement: Measurement) => {
    const annotationData = cs3dTools.annotation.state.getAnnotation(measurement.uid);
    return annotationData;
  };

  /**
   *
   * @param {AnnotationData} annotationData
   * serializeAnnotationData function is used to remove unnecessary
   * points in shape array. This array contains large amount of unncessary data
   * which is not required to draw annotations
   *
   * @returns annotationData (annotation data object without pointsInShape property)
   */

  const serializeAnnotationData = (annotationData: AnnotationData) => {
    const dynamicKeyImageId = Object.keys(annotationData.data.cachedStats)[0];

    delete annotationData.data.cachedStats[dynamicKeyImageId].pointsInShape;

    if (!annotationData.data.cachedStats[dynamicKeyImageId].pointsInShape) {
      return annotationData;
    }
  };

  /**
   *
   * @param {AnnotationData[]} annotationDataArray
   *  getAnnotationDataArray returns an array that contains all serialized (ready to store in DB)
   * annotaion data. Already existing annotations retrieved from backend (if any) will also be
   * included in this array. Making easier for us to have all the annotations which are currently
   * displaying on image.
   * @returns
   */

  const getAnnotationDataArray = async (annotationDataArray: AnnotationData[]) => {
    return new Promise(resolve => {
      const toolsNeedToBeSerialized = ['RectangleROI', 'CircleROI', 'EllipticalROI'];
      const serializedAnnotationDataArray = annotationDataArray.map(annotationData => {
        if (toolsNeedToBeSerialized.includes(annotationData.metadata.toolName)) {
          return serializeAnnotationData(annotationData);
        } else {
          return annotationData;
        }
      });
      resolve(serializedAnnotationDataArray);
    });
  };

  return {
    registerRetrievedAnnotations,
    extractAnnotationDataFromMeasurement,
    serializeAnnotationData,
    getAnnotationDataArray,
  };
};

export default annotationService;
