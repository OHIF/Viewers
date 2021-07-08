import SUPPORTED_TOOLS from './constants/supportedTools';
import getHandlesFromPoints from './utils/getHandlesFromPoints';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const RectangleRoi = {
  toAnnotation: (measurement, definition) => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsAnnotation,
    DisplaySetService,
    getValueTypeFromToolType
  ) => {
    const { element, measurementData } = csToolsAnnotation;
    const tool =
      csToolsAnnotation.toolType ||
      csToolsAnnotation.toolName ||
      measurementData.toolType;

    const validToolType = toolName => SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType(tool)) {
      throw new Error('Tool not supported');
    }

    const {
      SOPInstanceUID,
      FrameOfReferenceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = getSOPInstanceAttributes(element);

    const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID
    );

    return {
      id: measurementData.id,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.label,
      description: measurementData.description,
      unit: measurementData.unit,
      length: measurementData.length,
      type: getValueTypeFromToolType(tool),
      points: getPointsFromHandles(measurementData.handles),
    };
  },
};

export default RectangleRoi;

/**
 *  {
      "data": [
          {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 191.15890083632019,
                      "y": 108.51135005973717,
                      "highlight": true,
                      "active": false
                  },
                  "end": {
                      "x": 254.77658303464756,
                      "y": 150.71923536439667,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "initialRotation": 0,
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 254.77658303464756,
                      "y": 129.61529271206692,
                      "boundingBox": {
                          "width": 149.6158905029297,
                          "height": 65,
                          "left": 625,
                          "top": 179.39062500000003
                      }
                  }
              },
              "uuid": "71509b93-1c6f-4acb-88ba-b67a4debc8a3",
              "cachedStats": {
                  "area": 1364.6373162386578,
                  "count": 2752,
                  "mean": -483.00981104651163,
                  "variance": 169503.0307903713,
                  "stdDev": 411.7074577784222,
                  "min": -1024,
                  "max": 1386
              },
              "unit": "HU"
          }
      ]
  }
 */
