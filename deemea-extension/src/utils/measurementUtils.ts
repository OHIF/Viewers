// Importez les types nécessaires si vous utilisez TypeScript
// import { Types } from '@ohif/core';

import { annotation, Enums } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';
import {
  initMeasurementService,
  connectToolsToMeasurementService,
  connectMeasurementServiceToTools,
} from '../../../../extensions/cornerstone/src/initMeasurementService';
import * as cs3dTools from '@cornerstonejs/tools';

export async function demonstrateMeasurementService(servicesManager) {
  console.log('Demonstrating MeasurementService functionality');
  const { ViewportGridService, CornerstoneViewportService } = servicesManager.services;

  const viewportId = ViewportGridService.getActiveViewportId();
  const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);
  const imageId = viewport.getCurrentImageId();
  const imageMetadata = viewport.getImageData(imageId);

  console.log('imageMetadata:', imageMetadata);

  if (!imageId) {
    console.error('No image ID found');
    return;
  }

  const imageSize = imageMetadata.dimensions.map(
    (dimension, index) => dimension * imageMetadata.spacing[index]
  );
  console.log('imageSize', imageSize, imageMetadata);

  const testMeasurement = createTestMeasurement(imageId, imageSize);

  try {
    const annotation: cs3dTools.Types.Annotation = {
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

    cs3dTools.annotation.state.addAnnotation(annotation, 'CORNERSTONE_3D_TOOLS');

    viewport.render();
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
