import * as cs3dTools from '@cornerstonejs/tools';
import { axis } from './axisColors';
import { Palette } from './palette';

function convertFromDicomCoordinates(
  dicomX,
  dicomY,
  dicomZ,
  imageWidth,
  imageHeight,
  pixelSpacingX,
  pixelSpacingY,
  imagePositionPatient,
  orientationMatrix
) {
  // Step 1: Calculate the difference vector from the Image Position (Patient)
  const diffX = dicomX - imagePositionPatient[0];
  const diffY = dicomY - imagePositionPatient[1];
  const diffZ = dicomZ - imagePositionPatient[2];

  // Step 2: Extract row and column direction vectors from the orientation matrix
  const rowDir = [orientationMatrix[0], orientationMatrix[1], orientationMatrix[2]]; // [rx, ry, rz]
  const colDir = [orientationMatrix[3], orientationMatrix[4], orientationMatrix[5]]; // [cx, cy, cz]

  // Step 3: Project the difference vector onto the row and column directions to get physical coordinates
  const physicalX = diffX * rowDir[0] + diffY * rowDir[1] + diffZ * rowDir[2];
  const physicalY = diffX * colDir[0] + diffY * colDir[1] + diffZ * colDir[2];

  // Step 4: Convert physical coordinates to pixel coordinates using pixel spacing
  const pixelX = physicalX / pixelSpacingX;
  const pixelY = physicalY / pixelSpacingY;

  // Step 5: Normalize pixel coordinates to the range [0, 1]
  const normalizedX = pixelX / imageWidth;
  const normalizedY = pixelY / imageHeight;

  return [normalizedX, normalizedY];
}

function convertToDicomCoordinates(
  normalizedX,
  normalizedY,
  imageWidth,
  imageHeight,
  pixelSpacingX,
  pixelSpacingY,
  imagePositionPatient,
  orientationMatrix
) {
  // Step 1: Convert normalized coordinates (0 to 1) to pixel coordinates (0 to imageWidth/Height)
  const pixelX = normalizedX * imageWidth;
  const pixelY = normalizedY * imageHeight;

  // Step 2: Convert pixel coordinates to physical distance in mm using pixel spacing
  const physicalX = pixelX * pixelSpacingX;
  const physicalY = pixelY * pixelSpacingY;

  // Step 3: Use the Image Orientation (Patient) matrix to convert to physical coordinates
  const rowDir = [orientationMatrix[0], orientationMatrix[1], orientationMatrix[2]]; // [rx, ry, rz]
  const colDir = [orientationMatrix[3], orientationMatrix[4], orientationMatrix[5]]; // [cx, cy, cz]

  // Compute DICOM coordinates
  const dicomX = imagePositionPatient[0] + physicalX * rowDir[0] + physicalY * colDir[0];
  const dicomY = imagePositionPatient[1] + physicalX * rowDir[1] + physicalY * colDir[1];
  const dicomZ = imagePositionPatient[2] + physicalX * rowDir[2] + physicalY * colDir[2];

  return [dicomX, dicomY, dicomZ];
}

async function matchNameWithAxis(
  pointName1,
  pointName2
): Promise<{ color: string; highlighted: string; dotted?: boolean } | null> {
  const matchedAxis = axis.find(
    axe =>
      (pointName1 === axe.head && pointName2 === axe.tail) ||
      (pointName2 === axe.head && pointName1 === axe.tail)
  );

  return matchedAxis ? matchedAxis : null;
}

async function setMeasurementStyle() {
  const annotations = cs3dTools.annotation.state.getAllAnnotations();
  annotations?.map(async annotation => {
    let style = {
      color: '#00ff00',
      colorHighlighted: '#fff000',
      colorSelected: '#fff000',
      lineDash: '',
    };
    if (annotation.data.handles?.type === 'rectangle') {
      style = {
        color: Palette.Turquoise,
        colorHighlighted: Palette.DarkTurquoise,
        colorSelected: Palette.Turquoise,
        lineDash: '',
      };
    }
    if (annotation.data.handles?.type === 'probe') {
      style = {
        color: Palette.Red,
        colorHighlighted: Palette.DarkRed,
        colorSelected: Palette.Red,
        lineDash: '',
      };
    }
    const axisColor = await matchNameWithAxis(
      annotation.data.handles?.headName,
      annotation.data.handles?.tailName
    );

    if (axisColor) {
      style = {
        ...style,
        color: axisColor.color,
        colorHighlighted: axisColor.highlighted,
        colorSelected: axisColor.highlighted,
        lineDash: axisColor.dotted ? '3,2' : '',
      };
    }
    cs3dTools.annotation.config.style.setAnnotationStyles(annotation.annotationUID!, style);
  });
}

export async function demonstrateMeasurementService(
  servicesManager,
  relatedPoints,
  imageStatus = false
) {
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);

  const imageId = viewport.getCurrentImageId();

  const imageMetadata = viewport.getImageData(imageId);

  if (!imageId) {
    console.error('No image ID found');
    return;
  }

  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  relatedPoints?.forEach(data => {
    if (data.points.length === 1) {
      createPoint(viewport, imageMetadata, imageId, data, imageStatus);
    } else if (data.points.length === 2) {
      createLength(viewport, imageMetadata, imageId, data, imageStatus);
    } else if (data.points.length === 3) {
      createAngleROI(viewport, imageMetadata, imageId, data, imageStatus);
    } else if (data.points.length === 4) {
      createRectangleROI(viewport, imageMetadata, imageId, data, imageStatus);
    }
  });
  setMeasurementStyle();
}

export function createRectangleROI(viewport, imageMetadata, imageId, data, imageStatus) {
  try {
    const normalizedPoints = data.points.map(point => {
      const normalizedX = point.x ? point.x : point.xOrigin;
      const normalizedY = point.y ? point.y : point.yOrigin;
      const imageWidth = imageMetadata.dimensions[0];
      const imageHeight = imageMetadata.dimensions[1];
      const pixelSpacingX = imageMetadata.spacing[0];
      const pixelSpacingY = imageMetadata.spacing[1];
      const imagePositionPatient = imageMetadata.origin;
      const orientationMatrix = imageMetadata.direction;

      return convertToDicomCoordinates(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        pixelSpacingX,
        pixelSpacingY,
        imagePositionPatient,
        orientationMatrix
      );
    });

    cs3dTools.RectangleROITool.createAndAddAnnotation(viewport, {
      data: {
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
          hide: data.hide,
        },
        handles: {
          points: normalizedPoints,
          type: 'rectangle',
          name: data.points[0].name,
          activeHandleIndex: null,
        },
      },

      isVisible: !data.hide,
      isLocked: imageStatus || data.locked,
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createPoint(viewport, imageMetadata, imageId, data, imageStatus) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedX = data.points[0].x ? data.points[0].x : data.points[0].xOrigin;
    const normalizedY = data.points[0].y ? data.points[0].y : data.points[0].yOrigin;
    const imageWidth = imageMetadata.dimensions[0];
    const imageHeight = imageMetadata.dimensions[1];
    const pixelSpacingX = imageMetadata.spacing[0];
    const pixelSpacingY = imageMetadata.spacing[1];
    const imagePositionPatient = imageMetadata.origin;
    const orientationMatrix = imageMetadata.direction;

    const dicomCoords = convertToDicomCoordinates(
      normalizedX,
      normalizedY,
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );

    cs3dTools.ProbeTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: [dicomCoords],
          type: 'probe',
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
      isVisible: !data.hide,
      isLocked: imageStatus || data.locked,
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createLength(viewport, imageMetadata, imageId, data, imageStatus) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedX = data.points[0].x ? data.points[0].x : data.points[0].xOrigin;
    const normalizedY = data.points[0].y ? data.points[0].y : data.points[0].yOrigin;
    const imageWidth = imageMetadata.dimensions[0];
    const imageHeight = imageMetadata.dimensions[1];
    const pixelSpacingX = imageMetadata.spacing[0];
    const pixelSpacingY = imageMetadata.spacing[1];
    const imagePositionPatient = imageMetadata.origin;
    const orientationMatrix = imageMetadata.direction;

    const dicomCoords = convertToDicomCoordinates(
      normalizedX,
      normalizedY,
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );

    const normalizedX2 = data.points[1].x ? data.points[1].x : data.points[1].xOrigin;
    const normalizedY2 = data.points[1].y ? data.points[1].y : data.points[1].yOrigin;
    const imageWidth2 = imageMetadata.dimensions[0];
    const imageHeight2 = imageMetadata.dimensions[1];
    const pixelSpacingX2 = imageMetadata.spacing[0];
    const pixelSpacingY2 = imageMetadata.spacing[1];
    const imagePositionPatient2 = imageMetadata.origin;
    const orientationMatrix2 = imageMetadata.direction;

    const dicomCoords2 = convertToDicomCoordinates(
      normalizedX2,
      normalizedY2,
      imageWidth2,
      imageHeight2,
      pixelSpacingX2,
      pixelSpacingY2,
      imagePositionPatient2,
      orientationMatrix2
    );

    cs3dTools.LengthTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: [dicomCoords, dicomCoords2],
          headName: data.points[0].name,
          tailName: data.points[1].name,
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
      isVisible: !data.hide,
      isLocked: imageStatus || data.locked,
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export function createAngleROI(viewport, imageMetadata, imageId, data, imageStatus) {
  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  try {
    const normalizedPoints = data.points.map(point => {
      const normalizedX = point.x ? point.x : point.xOrigin;
      const normalizedY = point.y ? point.y : point.yOrigin;
      const imageWidth = imageMetadata.dimensions[0];
      const imageHeight = imageMetadata.dimensions[1];
      const pixelSpacingX = imageMetadata.spacing[0];
      const pixelSpacingY = imageMetadata.spacing[1];
      const imagePositionPatient = imageMetadata.origin;
      const orientationMatrix = imageMetadata.direction;

      return convertToDicomCoordinates(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        pixelSpacingX,
        pixelSpacingY,
        imagePositionPatient,
        orientationMatrix
      );
    });

    cs3dTools.AngleTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: normalizedPoints,
          headName: data.points[0].name,
          tailName: data.points[1].name,
          name: data.points[0].name,
        },
        label: {
          measurementId: data?.measurementId,
          pointsInfo: data.points,
          predicted: true,
          imagingData: data?.imagingData,
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: 'X',
            unit: 'px',
          },
        },
      },
      isVisible: !data.hide,
      isLocked: imageStatus || data.locked,
    });
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

export async function createMeasurement(servicesManager, points) {
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);

  const imageId = viewport.getCurrentImageId();

  const imageMetadata = viewport.getImageData(imageId);

  const imageWidth = imageMetadata.dimensions[0];
  const imageHeight = imageMetadata.dimensions[1];
  const pixelSpacingX = imageMetadata.spacing[0];
  const pixelSpacingY = imageMetadata.spacing[1];
  const imagePositionPatient = imageMetadata.origin;
  const orientationMatrix = imageMetadata.direction;

  const normalizedPoints: number[][] = [];
  points?.forEach(point => {
    const normalizedCoords = convertFromDicomCoordinates(
      point[0],
      point[1],
      point[2],
      imageWidth,
      imageHeight,
      pixelSpacingX,
      pixelSpacingY,
      imagePositionPatient,
      orientationMatrix
    );
    normalizedPoints.push(normalizedCoords);
  });

  return normalizedPoints;
}
