import {
  imageLoader,
  metaData,
  Types,
} from '@cornerstonejs/core';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { getLabelmapImageIds } from '@cornerstonejs/tools/segmentation';
import { ServicesManager } from '@ohif/core';

/**
 * Creates a segmentation from input labelmap data for the active viewport.
 */
export default async function addSegmentationFromLabelmap({
  servicesManager,
  labelmap,
  segmentationLabel = 'API Segmentation',
  segmentLabel = 'Segment',
  segmentColor = [255, 0, 0, 255] as Types.Color,
}: {
  servicesManager: ServicesManager;
  labelmap: number[][][];  // 3D array of labelmap data [z][y][x]
  segmentationLabel?: string;
  segmentLabel?: string;
  segmentColor?: Types.Color;
}): Promise<string> {
  const { viewportGridService, displaySetService, segmentationService } =
    servicesManager.services;
  const { viewports, activeViewportId } = viewportGridService.getState();
  const viewport = viewports.get(activeViewportId);

  if (!viewport || !viewport.displaySetInstanceUIDs?.length) {
    throw new Error('No active viewport found');
  }

  const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // Create a new segmentation
  const segmentationId = await segmentationService.createLabelmapForDisplaySet(
    displaySet,
    {
      label: segmentationLabel,
    }
  );

  // Add a segment to the segmentation
  segmentationService.addSegment(segmentationId, {
    label: segmentLabel,
    color: segmentColor,
    visibility: true,
    segmentIndex: 1,
  });

  // Get the segmentation data
  const imageIds = getLabelmapImageIds(segmentationId);

  // Get image dimensions from metadata
  const imageMetadata = metaData.get('imagePixelModule', imageIds[0]);
  const { columns, rows } = imageMetadata;

  // Apply the labelmap data
  for (let i = 0; i < imageIds.length && i < labelmap.length; i++) {
    const image = await imageLoader.loadAndCacheImage(imageIds[i]);
    const voxelManager = image.voxelManager;
    const scalarData = voxelManager.getScalarData();

    if (labelmap[i]) {
      for (let y = 0; y < Math.min(rows, labelmap[i].length); y++) {
        if (labelmap[i][y]) {
          for (let x = 0; x < Math.min(columns, labelmap[i][y].length); x++) {
            scalarData[y * columns + x] = labelmap[i][y][x];
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

/**
 * Creates a mock sphere labelmap for testing
 */
export function createSphereLabelmap(depth: number, height: number, width: number): number[][][] {
  const labelmap: number[][][] = Array(depth).fill(0).map(() =>
    Array(height).fill(0).map(() =>
      Array(width).fill(0)
    )
  );

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const centerZ = Math.floor(depth / 2);

  // Use the smallest dimension for the radius (1/4 of the smallest dimension)
  const radius = Math.floor(Math.min(width, height, depth) / 4);

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dz = z - centerZ;

        // If point is inside sphere (using sphere equation x² + y² + z² ≤ r²)
        if (dx * dx + dy * dy + dz * dz <= radius * radius) {
          labelmap[z][y][x] = 1;
        }
      }
    }
  }

  return labelmap;
}

// Example usage:
/*
const mockSphereLabelmap = createSphereLabelmap(100, 100, 100);
await addSegmentationFromLabelmap({
  servicesManager,
  labelmap: mockSphereLabelmap,
  segmentationLabel: 'Sphere Segmentation',
  segmentLabel: 'Sphere',
  segmentColor: [255, 0, 0, 255], // Red color
});
*/
