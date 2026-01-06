/**
 * Utility functions for Local Segmentation operations
 */

import * as cornerstone3D from '@cornerstonejs/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import type { Types as CornerstoneTypes } from '@cornerstonejs/core';
import { getRenderingEngines, BaseVolumeViewport, Enums as csEnums } from '@cornerstonejs/core';

/**
 * Get the scalar data for the current slice in the active viewport
 */
export function getActiveSliceScalarData(viewport: any): {
  scalarData: Float32Array | Int16Array | Uint8Array;
  width: number;
  height: number;
  sliceIndex: number;
  volumeId: string;
} | null {
  try {
    // Check if this is a volume viewport
    if (!viewport) {
      console.error('[LocalSegmentation] Viewport is null or undefined');
      return null;
    }

    // Check viewport type
    if (!(viewport instanceof BaseVolumeViewport)) {
      console.error('[LocalSegmentation] Not a volume viewport. Local segmentation requires a volume viewport (not stack viewport).');
      console.error('[LocalSegmentation] Viewport type:', viewport.type);
      return null;
    }

    // Get volume IDs from the viewport
    const volumeIds = viewport.getAllVolumeIds();
    if (!volumeIds || volumeIds.length === 0) {
      console.error('[LocalSegmentation] No volumes in viewport');
      return null;
    }

    // Get the primary volume (first one)
    const volumeId = volumeIds[0];
    const volume = cornerstone3D.cache.getVolume(volumeId);

    if (!volume) {
      console.error('[LocalSegmentation] Could not get volume from cache:', volumeId);
      return null;
    }

    // Get current camera and slice
    const camera = viewport.getCamera();
    const { viewPlaneNormal, focalPoint } = camera;

    // Get dimensions
    const { dimensions, direction, origin, spacing } = volume;
    const [width, height, depth] = dimensions;

    // Determine which axis we're viewing (axial, sagittal, coronal)
    const absNormal = viewPlaneNormal.map(Math.abs);
    const maxIndex = absNormal.indexOf(Math.max(...absNormal));

    // Calculate slice index based on focal point and volume orientation
    let sliceIndex: number;
    if (maxIndex === 2) {
      // Axial (Z-axis)
      sliceIndex = Math.round((focalPoint[2] - origin[2]) / spacing[2]);
    } else if (maxIndex === 1) {
      // Coronal (Y-axis)
      sliceIndex = Math.round((focalPoint[1] - origin[1]) / spacing[1]);
    } else {
      // Sagittal (X-axis)
      sliceIndex = Math.round((focalPoint[0] - origin[0]) / spacing[0]);
    }

    // Clamp slice index
    sliceIndex = Math.max(0, Math.min(depth - 1, sliceIndex));

    console.log('[LocalSegmentation] Current slice index:', sliceIndex, 'of', depth);

    // Extract the slice data - use voxelManager if available for better compatibility
    let scalarData;
    if (volume.voxelManager && typeof volume.voxelManager.getCompleteScalarDataArray === 'function') {
      scalarData = volume.voxelManager.getCompleteScalarDataArray();
    } else {
      scalarData = volume.getScalarData();
    }

    if (!scalarData || scalarData.length === 0) {
      console.error('[LocalSegmentation] No scalar data available');
      return null;
    }

    const sliceSize = width * height;
    const sliceData = scalarData.slice(sliceIndex * sliceSize, (sliceIndex + 1) * sliceSize);

    return {
      scalarData: sliceData,
      width,
      height,
      sliceIndex,
      volumeId,
    };
  } catch (error) {
    console.error('[LocalSegmentation] Error getting slice data:', error);
    return null;
  }
}

/**
 * Convert world coordinates (from a click) to volume index coordinates
 */
export function worldToImageIndex(
  worldPoint: CornerstoneTypes.Point3,
  volume: any
): { i: number; j: number; k: number } | null {
  try {
    const { imageData } = volume;
    const index = imageData.worldToIndex(worldPoint);

    return {
      i: Math.round(index[0]),
      j: Math.round(index[1]),
      k: Math.round(index[2]),
    };
  } catch (error) {
    console.error('[LocalSegmentation] Error converting world to index:', error);
    return null;
  }
}

/**
 * Apply a 2D mask to a labelmap segmentation for a specific slice
 */
export async function apply2DMaskToLabelmap(
  segmentationId: string,
  segmentIndex: number,
  sliceIndex: number,
  mask: Uint8Array,
  width: number,
  height: number
): Promise<boolean> {
  try {
    console.log('[LocalSegmentation] Applying 2D mask to labelmap', {
      segmentationId,
      segmentIndex,
      sliceIndex,
      width,
      height,
    });

    // Get the segmentation
    const segmentation = cornerstone3DTools.segmentation.state.getSegmentation(segmentationId);
    if (!segmentation) {
      console.error('[LocalSegmentation] Segmentation not found');
      return false;
    }

    // Check if this is a labelmap segmentation
    if (!segmentation.representationData?.Labelmap) {
      console.error('[LocalSegmentation] Not a labelmap segmentation');
      return false;
    }

    /**
     * IMPORTANT:
     * In OHIF, labelmap segmentations created for a display set are stored as
     * derived labelmap IMAGES (one per slice) with their own voxelManagers.
     * Brush edits go through those voxelManagers (getScalarData/setScalarData).
     *
     * If we only write to a derived VOLUME buffer, the UI/renderer/stats may not update
     * because the canonical storage is the per-slice derived images.
     */
    const imageIds =
      (cornerstone3DTools as any).segmentation?.getLabelmapImageIds?.(segmentationId) ||
      (segmentation.representationData.Labelmap as any)?.imageIds;

    if (Array.isArray(imageIds) && imageIds.length > 0) {
      const imageId = imageIds[sliceIndex];
      if (!imageId) {
        console.error('[LocalSegmentation] No labelmap imageId for slice', sliceIndex);
        return false;
      }

      const segImage = cornerstone3D.cache.getImage(imageId);
      if (!segImage?.voxelManager) {
        console.error('[LocalSegmentation] Labelmap image not in cache or missing voxelManager', {
          imageId,
        });
        return false;
      }

      const voxelManager = segImage.voxelManager;
      const segScalarData = voxelManager.getScalarData();
      if (!segScalarData || segScalarData.length === 0) {
        console.error('[LocalSegmentation] No scalar data in labelmap image voxelManager');
        return false;
      }

      if (segScalarData.length !== width * height) {
        console.error('[LocalSegmentation] Labelmap slice dimension mismatch', {
          expected: width * height,
          actual: segScalarData.length,
          width,
          height,
        });
        return false;
      }

      // Apply mask to this slice (per-slice buffer)
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          segScalarData[i] = segmentIndex;
        }
      }

      // Commit via voxelManager so Cornerstone/OHIF pipeline sees the update
      voxelManager.setScalarData(segScalarData);
      console.log('[LocalSegmentation] Slice voxelManager updated', {
        sliceIndex,
        imageId,
      });
    } else {
      // Fallback: volume-based labelmap (some conversions create volumeId)
      const labelmapData = segmentation.representationData.Labelmap as any;
      if (!labelmapData?.volumeId) {
        console.error('[LocalSegmentation] Labelmap has neither imageIds nor volumeId', {
          labelmapDataKeys: Object.keys(labelmapData || {}),
        });
        return false;
      }

      const volumeId = labelmapData.volumeId;
      console.log('[LocalSegmentation] Using labelmap volumeId (fallback):', volumeId);

      const volume = cornerstone3D.cache.getVolume(volumeId);
      if (!volume) {
        console.error('[LocalSegmentation] Segmentation volume not found in cache:', volumeId);
        return false;
      }

      let segScalarData;
      if (volume.voxelManager && typeof volume.voxelManager.getCompleteScalarDataArray === 'function') {
        segScalarData = volume.voxelManager.getCompleteScalarDataArray();
      } else {
        segScalarData = volume.getScalarData();
      }

      if (!segScalarData || segScalarData.length === 0) {
        console.error('[LocalSegmentation] No scalar data in segmentation volume');
        return false;
      }

      const { dimensions } = volume;
      const [segWidth, segHeight] = dimensions;

      if (segWidth !== width || segHeight !== height) {
        console.error('[LocalSegmentation] Dimension mismatch', {
          segWidth,
          segHeight,
          width,
          height,
        });
        return false;
      }

      const sliceOffset = sliceIndex * width * height;
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          segScalarData[sliceOffset + i] = segmentIndex;
        }
      }

      volume.modified();
    }

    // Mark the volume as modified
    // For per-slice labelmap images, rendering engines still need a refresh.

    // Get all rendering engines and render viewports that have this segmentation
    const renderingEngines = getRenderingEngines();
    renderingEngines.forEach(engine => {
      engine.render();
    });

    console.log('[LocalSegmentation] Mask applied successfully');

    // Trigger the segmentation modified event (not data modified) which updates the UI
    // but doesn't trigger statistics calculation
    cornerstone3DTools.segmentation.triggerSegmentationEvents.triggerSegmentationModified(
      segmentationId
    );

    return true;
  } catch (error) {
    console.error('[LocalSegmentation] Error applying mask:', error);
    return false;
  }
}

/**
 * Apply threshold to current slice
 */
export async function applyThresholdToSlice(
  viewport: any,
  segmentationId: string,
  segmentIndex: number,
  minIntensity: number,
  maxIntensity: number
): Promise<boolean> {
  try {
    const sliceData = getActiveSliceScalarData(viewport);
    if (!sliceData) {
      return false;
    }

    const { scalarData, width, height, sliceIndex } = sliceData;

    console.log('[LocalSegmentation] Applying threshold to slice', {
      sliceIndex,
      minIntensity,
      maxIntensity,
    });

    // Create mask based on threshold
    const mask = new Uint8Array(width * height);
    let count = 0;
    for (let i = 0; i < scalarData.length; i++) {
      if (scalarData[i] >= minIntensity && scalarData[i] <= maxIntensity) {
        mask[i] = 1;
        count++;
      }
    }

    console.log('[LocalSegmentation] Threshold matched', count, 'pixels');

    // Apply mask to labelmap
    return await apply2DMaskToLabelmap(segmentationId, segmentIndex, sliceIndex, mask, width, height);
  } catch (error) {
    console.error('[LocalSegmentation] Error applying threshold:', error);
    return false;
  }
}

/**
 * Ensure an active labelmap segmentation exists for the viewport
 * Creates one if it doesn't exist, or ensures the specified segment exists
 */
export async function ensureActiveLabelmapSegmentation(
  servicesManager: any,
  commandsManager: any,
  label: string = 'LocalSeg',
  segmentIndex: number = 1
): Promise<{ segmentationId: string; segmentIndex: number } | null> {
  try {
    const { viewportGridService, segmentationService } = servicesManager.services;
    const viewportId = viewportGridService.getActiveViewportId();

    console.log('[LocalSegmentation] Ensuring active labelmap segmentation');

    // Check if there's an active segmentation
    let activeSegmentation = segmentationService.getActiveSegmentation(viewportId);

    // If no active segmentation, create one
    if (!activeSegmentation) {
      console.log('[LocalSegmentation] Creating new labelmap segmentation');
      const segmentationId = await commandsManager.run('createLabelmapForViewport', {
        viewportId,
        options: {
          label,
          createInitialSegment: true,
        },
      });

      activeSegmentation = segmentationService.getActiveSegmentation(viewportId);

      if (!activeSegmentation) {
        console.error('[LocalSegmentation] Failed to create segmentation');
        return null;
      }
    }

    const segmentationId = activeSegmentation.segmentationId;

    // Get the segmentation to check segments
    const segmentation = segmentationService.getSegmentation(segmentationId);
    if (!segmentation) {
      console.error('[LocalSegmentation] Could not get segmentation');
      return null;
    }

    // Check if the requested segment exists
    if (!segmentation.segments || !segmentation.segments[segmentIndex]) {
      console.log('[LocalSegmentation] Adding segment', segmentIndex);
      await commandsManager.run('addSegment', {
        segmentationId,
        segmentIndex,
        label: `${label} ${segmentIndex}`,
      });
    }

    // Set as active segment
    segmentationService.setActiveSegment(segmentationId, segmentIndex);

    console.log('[LocalSegmentation] Active segmentation ready', {
      segmentationId,
      segmentIndex,
    });

    return { segmentationId, segmentIndex };
  } catch (error) {
    console.error('[LocalSegmentation] Error ensuring segmentation:', error);
    return null;
  }
}

