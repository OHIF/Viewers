// Importez les types nécessaires si vous utilisez TypeScript
// import { Types } from '@ohif/core';

import { metaData } from '@cornerstonejs/core';
import * as cs3dTools from '@cornerstonejs/tools';

/*
{
    "id": 35133,
    "name": "patella_transverse_interior_left",
    "x": null,
    "y": null,
    "xOrigin": "0.6696428656578064",
    "yOrigin": "0.8514971137046814",
    "lastModificationUserId": null,
    "lastModificationDate": "2024-10-22T07:52:00.716Z"
}
{
    "id": 35128,
    "name": "patella_transverse_exterior_left",
    "x": null,
    "y": null,
    "xOrigin": "0.7879464030265808",
    "yOrigin": "0.8514971137046814",
    "lastModificationUserId": null,
    "lastModificationDate": "2024-10-22T07:52:00.714Z"
}

8ca9e2a6-42d3-48aa-b2d0-92e05d62149c
*/

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

export async function demonstrateMeasurementService(servicesManager) {
  console.log('Demonstrating MeasurementService functionality');
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  console.log(viewportId);
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);

  const imageId = viewport.getCurrentImageId();

  const imageMetadata = viewport.getImageData(imageId);

  console.log('imageMetadata:', imageMetadata, imageId);

  console.log('test', cs3dTools.state.enabledElements);

  if (!imageId) {
    console.error('No image ID found');
    return;
  }

  if (!imageMetadata) {
    console.error('No image metadata found');
    return;
  }

  const imageSize = imageMetadata.dimensions.map(
    (dimension, index) => dimension * imageMetadata.spacing[index]
  );
  console.log('imageSize', imageSize, imageMetadata);

  const normalizedX = '0.6696428656578064';
  const normalizedY = '0.8514971137046814';
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
  console.log(dicomCoords); // Outputs the DICOM coordinates (x, y, z)

  const normalizedX2 = '0.7879464030265808';
  const normalizedY2 = '0.8514971137046814';
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

  console.log(dicomCoords2); // Outputs the DICOM coordinates (x, y, z)

  //const testMeasurement = createTestMeasurement(imageId, imageSize);

  try {
    cs3dTools.LengthTool.createAndAddAnnotation(viewport, {
      data: {
        handles: {
          points: [dicomCoords, dicomCoords2],
        },
        cachedStats: {
          [`imageId:${imageId}`]: {
            length: '114',
            unit: 'mm',
          },
        },
      },
    });
    /*const annotation: cs3dTools.Types.Annotation = {
      metadata: {
        toolName: testMeasurement.toolName,
        FrameOfReferenceUID: testMeasurement.metadata.FrameOfReferenceUID,
        referencedImageId: imageId,
      },
      data: {
        handles: {
          points: testMeasurement.data.handles.points.map(point => [point.x, point.y, point.z]),
        },
        cachedStats: testMeasurement.data.cachedStats,
      },
      highlighted: false,
      isLocked: false,
      isVisible: true,
      invalidated: false,
    };

    cs3dTools.annotation.state.addAnnotation(annotation, 'CORNERSTONE_3D_TOOLS');*/

    //viewport.render();
  } catch (error) {
    console.error('Error adding measurement:', error);
  }
}

function createTestMeasurement(imageId, imageSize) {
  const instanceMetadata = metaData.get('instance', imageId);
  const imageWidth = imageSize[0];
  const imageHeight = imageSize[1];

  console.log('imageWidth:', imageSize[0]);
  console.log('imageHeight:', imageSize[1]);

  return {
    toolName: 'Length',
    lesionNamingNumber: 1,
    finding: {},
    metadata: {
      toolName: 'Length',
      FrameOfReferenceUID: instanceMetadata.FrameOfReferenceUID,
      referencedImageId: imageId,
    },
    data: {
      handles: {
        // y: is like a x in a orthonormed plan
        // z: is like a y in a orthonormed plan
        // x: is like a z in a orthonormed plan (not sure)
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: imageWidth, z: -imageHeight },
        ],
      },
      cachedStats: {
        [`imageId:${imageId}`]: {
          length: '114',
          unit: 'mm',
        },
      },
    },
  };
}

/*
// Example usage
const normalizedX = 0.5;  // Example: center of the image
const normalizedY = 0.5;
const imageWidth = 512;  // Example image size in pixels
const imageHeight = 512;
const pixelSpacingX = 0.5;  // mm
const pixelSpacingY = 0.5;  // mm
const imagePositionPatient = [100, 200, -50];  // Example DICOM origin in mm
const orientationMatrix = [1, 0, 0, 0, 1, 0];  // Identity matrix: rows and columns aligned with X and Y axis

const dicomCoords = convertToDicomCoordinates(normalizedX, normalizedY, imageWidth, imageHeight, pixelSpacingX, pixelSpacingY, imagePositionPatient, orientationMatrix);
console.log(dicomCoords);  // Outputs the DICOM coordinates (x, y, z)*/
