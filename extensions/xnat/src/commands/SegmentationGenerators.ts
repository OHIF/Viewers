/**
 * Segmentation generation and creation utilities
 * Extracted from segmentationCommands.ts
 */

import { cache } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import { adaptersSEG } from '@cornerstonejs/adapters';

export interface SegmentationGeneratorParams {
  segmentationService: any;
}

/**
 * Generates a DICOM SEG dataset from a segmentation
 * Uses a more robust approach that works with XNAT segmentation structure
 */
export function generateSegmentation(
  { segmentationId, options = {} }: { segmentationId: string; options?: any },
  { segmentationService }: SegmentationGeneratorParams
) {
  // Get segmentation from both sources to ensure compatibility
  const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
  const cornerstoneSegmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);

  if (!segmentationInOHIF || !cornerstoneSegmentation) {
    throw new Error('Segmentation not found');
  }

  // Get the labelmap representation data
  const { representationData } = cornerstoneSegmentation;
  const labelmapData = representationData.Labelmap;

  if (!labelmapData) {
    throw new Error('No labelmap data found in segmentation');
  }

  // Get image IDs - handle both volumeId and imageIds cases
  let imageIds: string[] = [];
  if ('imageIds' in labelmapData && labelmapData.imageIds) {
    imageIds = labelmapData.imageIds;
  } else if ('volumeId' in labelmapData && labelmapData.volumeId) {
    // Get imageIds from volume cache
    const volume = cache.getVolume(labelmapData.volumeId);
    if (volume && volume.imageIds) {
      imageIds = volume.imageIds;
    }
  }

  if (!imageIds || imageIds.length === 0) {
    throw new Error('No image IDs found for segmentation');
  }

  const segImages = imageIds.map(imageId => cache.getImage(imageId));
  const referencedImages = segImages.map(image => cache.getImage(image.referencedImageId));

  const labelmaps2D = [];
  let z = 0;

  for (const segImage of segImages) {
    const segmentsOnLabelmap = new Set();
    const pixelData = segImage.getPixelData();
    const { rows, columns } = segImage;

    // Use a single pass through the pixel data
    for (let i = 0; i < pixelData.length; i++) {
      const segment = pixelData[i];
      if (segment !== 0) {
        segmentsOnLabelmap.add(segment);
      }
    }

    labelmaps2D[z++] = {
      segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
      pixelData,
      rows,
      columns,
    };
  }

  const allSegmentsOnLabelmap = labelmaps2D.map(labelmap => labelmap.segmentsOnLabelmap);

  const labelmap3D = {
    segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
    metadata: [],
    labelmaps2D,
  };

  // Get representations for color information
  const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);

  // Build segment metadata
  Object.entries(segmentationInOHIF.segments || {}).forEach(([segmentIndex, segment]) => {
    if (!segment) {
      return;
    }
    const segmentLabel = (segment as any).label || `Segment ${segmentIndex}`;

    // Use the first representation to get color information
    const representation = representations && representations.length > 0 ? representations[0] : null;
    const color = representation
      ? representation.colorLUT?.[segmentIndex] || [255, 0, 0, 255] // Default red
      : [255, 0, 0, 255];

    labelmap3D.metadata[parseInt(segmentIndex)] = {
      SegmentNumber: segmentIndex,
      SegmentLabel: segmentLabel,
      SegmentAlgorithmType: 'MANUAL',
      SegmentAlgorithmName: 'Manual',
      RecommendedDisplayCIELabValue: color,
      SegmentedPropertyCategoryCodeSequence: {
        CodeValue: 'T-D000A',
        CodingSchemeDesignator: 'SRT',
        CodeMeaning: 'Anatomical Structure',
      },
      SegmentedPropertyTypeCodeSequence: {
        CodeValue: 'T-D000A',
        CodingSchemeDesignator: 'SRT',
        CodeMeaning: 'Anatomical Structure',
      },
    };
  });

  // Generate the segmentation using cornerstone adapters
  const {
    Cornerstone3D: {
      Segmentation: { generateSegmentation: csGenerateSegmentation },
    },
  } = adaptersSEG;

  const dataset = csGenerateSegmentation({
    labelmap3D,
    imageIds: referencedImages.map(img => img.imageId),
    options: {
      ...options,
      SeriesDescription: options.SeriesDescription || 'AI Segmentation',
      SeriesNumber: options.SeriesNumber || '300',
      InstanceNumber: options.InstanceNumber || '1',
      Manufacturer: options.Manufacturer || 'Cornerstone.js',
      ManufacturerModelName: options.ManufacturerModelName || 'Cornerstone3D',
      SoftwareVersions: options.SoftwareVersions || '1.0.0',
    },
  });

  return { dataset };
}
