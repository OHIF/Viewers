import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const {
  freehandArea,
  calculateFreehandStatistics,
} = cornerstoneTools.importInternal('util/freehandUtils');

const calculateSUV = cornerstoneTools.importInternal('util/calculateSUV');

const NLFreehandRoi = {
  toAnnotation: (measurement, definition) => {},
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

    let data = {};
    let meanStdDev, meanStdDevSUV;

    const { image } = cornerstone.getEnabledElement(element);
    const seriesModule = cornerstone.metaData.get(
      'generalSeriesModule',
      image.imageId
    );
    const modality = seriesModule ? seriesModule.modality : null;

    const points = measurementData.handles.points;
    // If the data has been invalidated, and the tool is not currently active,
    // We need to calculate it again.

    // Retrieve the bounds of the ROI in image coordinates
    const bounds = {
      left: points[0].x,
      right: points[0].x,
      bottom: points[0].y,
      top: points[0].x,
    };

    for (let i = 0; i < points.length; i++) {
      bounds.left = Math.min(bounds.left, points[i].x);
      bounds.right = Math.max(bounds.right, points[i].x);
      bounds.bottom = Math.min(bounds.bottom, points[i].y);
      bounds.top = Math.max(bounds.top, points[i].y);
    }

    const polyBoundingBox = {
      left: bounds.left,
      top: bounds.bottom,
      width: Math.abs(bounds.right - bounds.left),
      height: Math.abs(bounds.top - bounds.bottom),
    };

    // Store the bounding box information for the text box
    data.polyBoundingBox = polyBoundingBox;

    // First, make sure this is not a color image, since no mean / standard
    // Deviation will be calculated for color images.
    if (!image.color) {
      // Retrieve the array of pixels that the ROI bounds cover
      const pixels = cornerstone.getPixels(
        element,
        polyBoundingBox.left,
        polyBoundingBox.top,
        polyBoundingBox.width,
        polyBoundingBox.height
      );

      // Calculate the mean & standard deviation from the pixels and the object shape
      meanStdDev = calculateFreehandStatistics.call(
        this,
        pixels,
        polyBoundingBox,
        measurementData.handles.points
      );

      if (modality === 'PT') {
        // If the image is from a PET scan, use the DICOM tags to
        // Calculate the SUV from the mean and standard deviation.

        // Note that because we are using modality pixel values from getPixels, and
        // The calculateSUV routine also rescales to modality pixel values, we are first
        // Returning the values to storedPixel values before calcuating SUV with them.
        // TODO: Clean this up? Should we add an option to not scale in calculateSUV?
        meanStdDevSUV = {
          mean: calculateSUV(
            image,
            (meanStdDev.mean - image.intercept) / image.slope
          ),
          stdDev: calculateSUV(
            image,
            (meanStdDev.stdDev - image.intercept) / image.slope
          ),
        };
      }

      // If the mean and standard deviation values are sane, store them for later retrieval
      if (meanStdDev && !isNaN(meanStdDev.mean)) {
        data.meanStdDev = meanStdDev;
        data.meanStdDevSUV = meanStdDevSUV;
      }
    }

    // Retrieve the pixel spacing values, and if they are not
    // Real non-zero values, set them to 1
    const columnPixelSpacing = image.columnPixelSpacing || 1;
    const rowPixelSpacing = image.rowPixelSpacing || 1;
    const scaling = columnPixelSpacing * rowPixelSpacing;

    const area = freehandArea(measurementData.handles.points, scaling);

    // If the area value is sane, store it for later retrieval
    if (!isNaN(area)) {
      data.area = area;
    }

    return {
      id: measurementData.id,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.label,
      description: measurementData.description,
      unit: modality === 'CT' ? 'HU' : '',
      area: data.area,
      mean: data.meanStdDev.mean,
      stdDev: data.meanStdDev.stdDev,
      type: getValueTypeFromToolType(tool),
      points: measurementData.handles.points,
      handles: {
        handles: measurementData.handles,
        polyBoundingBox,
      },
    };
  },
};

export default NLFreehandRoi;
