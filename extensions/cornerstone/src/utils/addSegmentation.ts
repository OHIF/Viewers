import {
  imageLoader,
  metaData,
  Types,
} from '@cornerstonejs/core';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { getLabelmapImageIds } from '@cornerstonejs/tools/segmentation';
import { ServicesManager } from '@ohif/core';

/**
 * Generates a color from an index using a perceptually distinct colormap
 * @param index The index to generate a color for
 * @returns RGBA color array
 */
function generateColorFromIndex(index: number): Types.Color {
  // HSL provides better perceptual distinction than RGB
  // We use golden ratio to spread the hues evenly
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio) % 1;

  // Use fixed saturation and lightness for good visibility
  const saturation = 0.85;
  const lightness = 0.5;

  // Convert HSL to RGB
  const h = hue;
  const s = saturation;
  const l = lightness;

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const r = Math.round(hueToRgb(h + 1/3) * 255);
  const g = Math.round(hueToRgb(h) * 255);
  const b = Math.round(hueToRgb(h - 1/3) * 255);

  return [r, g, b, 255] as Types.Color;
}

/**
 * Creates a segmentation from input labelmap data for the active viewport.
 */
export async function addSegmentationFromLabelmap({
  servicesManager,
  labelmap,
  segmentationLabel = 'API Segmentation',
  segmentations,
}: {
  servicesManager: ServicesManager;
  labelmap: number[][][];  // 3D array of labelmap data [z][y][x]
  segmentationLabel?: string;
  segmentations: { [key: string]: number };  // Dictionary mapping segment labels to labelmap values
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

  // Get all segment values and ensure they match what's in the labelmap
  const segmentValues = Object.values(segmentations);
  const segmentLabels = Object.keys(segmentations);

  // Set undefined values to 0 in the labelmap
  for (let z = 0; z < labelmap.length; z++) {
    for (let y = 0; y < labelmap[z].length; y++) {
      for (let x = 0; x < labelmap[z][y].length; x++) {
        const value = labelmap[z][y][x];
        if (value > 0 && !segmentValues.includes(value)) {
          // If the value is not in our segmentations dictionary, set it to 0
          labelmap[z][y][x] = 0;
        }
      }
    }
  }

  // Add segments in the order they appear in the dictionary
  segmentLabels.forEach((label, i) => {
    const segmentIndex = segmentations[label];
    // Generate color based on the segment index to ensure consistent colors
    const color = generateColorFromIndex(segmentIndex);

    segmentationService.addSegment(segmentationId, {
      label,
      color,
      visibility: true,
      segmentIndex,
    });
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
 * Fetches segmentation data from the Python server and adds it to the viewport
 */
export default async function addSegmentation(servicesManager: ServicesManager): Promise<string> {
  try {
    console.time('Total frontend processing time');
    const fetchStartTime = performance.now();

    const response = await fetch('http://localhost:8081/api/segmentation');
    if (!response.ok) {
      throw new Error('Failed to fetch segmentation data');
    }

    const fetchEndTime = performance.now();
    console.log(`Network fetch time: ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);

    const jsonStartTime = performance.now();
    const data = await response.json();
    const jsonEndTime = performance.now();
    console.log(`JSON parsing time: ${(jsonEndTime - jsonStartTime).toFixed(2)}ms`);

    const decompressStartTime = performance.now();

    // Convert base64 directly to binary array
    const binaryString = atob(data.segmentation.labelmap);
    const decodedData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      decodedData[i] = binaryString.charCodeAt(i);
    }

    // Create a 3D array from the binary data
    const [depth, height, width] = data.segmentation.dimensions;
    const totalSize = depth * height * width;

    // Pre-allocate arrays for better performance
    const labelmap = new Array(depth);
    for (let z = 0; z < depth; z++) {
      labelmap[z] = new Array(height);
      for (let y = 0; y < height; y++) {
        labelmap[z][y] = new Array(width);
      }
    }

    // Fill the arrays in a single pass
    for (let i = 0; i < totalSize; i++) {
      const z = Math.floor(i / (width * height));
      const remainder = i % (width * height);
      const y = Math.floor(remainder / width);
      const x = remainder % width;
      labelmap[z][y][x] = decodedData[i];
    }

    const decompressEndTime = performance.now();
    console.log(`Decoding time: ${(decompressEndTime - decompressStartTime).toFixed(2)}ms`);

    const segmentationStartTime = performance.now();
    const result = await addSegmentationFromLabelmap({
      servicesManager,
      labelmap,
      segmentationLabel: data.segmentation.label,
      segmentations: data.segmentation.segments,
    });
    const segmentationEndTime = performance.now();
    console.log(`Segmentation processing time: ${(segmentationEndTime - segmentationStartTime).toFixed(2)}ms`);

    // Handle measurements if they exist
    if (data.measurements && data.measurements.length > 0) {
      // TODO: Process measurements when implemented
      console.log('Measurements received:', data.measurements);
    }

    console.timeEnd('Total frontend processing time');
    return result;
  } catch (error) {
    console.error('Error fetching segmentation data:', error);
    throw error;
  }
}
