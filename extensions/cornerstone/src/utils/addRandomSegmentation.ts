import {
  init as coreInit,
  RenderingEngine,
  Enums,
  volumeLoader,
  setVolumesForViewports,
  imageLoader,
  metaData,
  Types,
} from '@cornerstonejs/core';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { getLabelmapImageIds } from '@cornerstonejs/tools/segmentation';
import { ServicesManager } from '@ohif/core';

interface LabelmapRepresentationData {
  Labelmap: {
    imageIds: string[];
  };
}

/**
 * Creates a spherical segmentation in the center of the volume
 * for the active viewport.
 */
export default async function addRandomSegmentation({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): Promise<string> {
  const { viewportGridService, displaySetService, segmentationService } =
    servicesManager.services;
  const { viewports, activeViewportId } = viewportGridService.getState();
  const viewport = viewports.get(activeViewportId);

  if (!viewport || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // Create a new segmentation
  const segmentationId = await segmentationService.createLabelmapForDisplaySet(
    displaySet,
    {
      label: 'Sphere Segmentation',
    }
  );

  // Add a segment to the segmentation
  segmentationService.addSegment(segmentationId, {
    label: 'Sphere',
    color: [255, 0, 0, 255] as Types.Color, // Red color with alpha
    visibility: true,
    segmentIndex: 1,
  });

  // Get the segmentation data
  const imageIds = getLabelmapImageIds(segmentationId);

  // Get image dimensions from metadata
  const imageMetadata = metaData.get('imagePixelModule', imageIds[0]);
  const { columns, rows } = imageMetadata;
  const numSlices = imageIds.length;

  // Get pixel spacing information
  const spacingMetadata = metaData.get('imagePlaneModule', imageIds[0]);
  const { rowPixelSpacing, columnPixelSpacing } = spacingMetadata;
  const sliceSpacing = spacingMetadata.sliceThickness || Math.abs(spacingMetadata.imagePositionPatient[2] - metaData.get('imagePlaneModule', imageIds[1]).imagePositionPatient[2]);

  // Calculate sphere center in pixel coordinates
  const centerX = Math.floor(columns / 2);
  const centerY = Math.floor(rows / 2);
  const centerZ = Math.floor(numSlices / 2);

  // Calculate radius in mm (use 1/4 of smallest physical dimension)
  const physicalWidth = columns * columnPixelSpacing;
  const physicalHeight = rows * rowPixelSpacing;
  const physicalDepth = numSlices * sliceSpacing;
  const radiusInMm = Math.min(physicalWidth, physicalHeight, physicalDepth) / 4;

  // Create sphere in the segmentation
  for (let i = 0; i < imageIds.length; i++) {
    const image = await imageLoader.loadAndCacheImage(imageIds[i]);
    const voxelManager = image.voxelManager;
    const scalarData = voxelManager.getScalarData();

    // Calculate z distance from center in mm
    const zDistanceInMm = Math.abs(i - centerZ) * sliceSpacing;

    // Only process slices that intersect with the sphere
    if (zDistanceInMm <= radiusInMm) {
      // Calculate the radius of the circle at this z-position using the sphere equation
      const circleRadiusInMm = Math.sqrt(radiusInMm * radiusInMm - zDistanceInMm * zDistanceInMm);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          // Calculate distance from center of circle in mm
          const dxInMm = (x - centerX) * columnPixelSpacing;
          const dyInMm = (y - centerY) * rowPixelSpacing;
          const distanceInMm = Math.sqrt(dxInMm * dxInMm + dyInMm * dyInMm);

          // If point is inside circle, set it to segment 1
          if (distanceInMm <= circleRadiusInMm) {
            scalarData[y * columns + x] = 1;
          }
        }
      }
    }

    voxelManager.setScalarData(scalarData);
  }

  // Add the segmentation to the viewport
  await segmentationService.addSegmentationRepresentation(activeViewportId, {
    segmentationId,
    type: SegmentationRepresentations.Labelmap,
  });

  return segmentationId;
}
