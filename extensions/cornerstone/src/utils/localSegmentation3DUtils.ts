/**
 * Utility functions for Local Segmentation 3D operations
 * Handles full volume operations (not just single slice)
 */

import * as cornerstone3D from '@cornerstonejs/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import { getRenderingEngines, BaseVolumeViewport } from '@cornerstonejs/core';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[LocalSegmentation3D]', ...args);
  }
}

/**
 * Get the full volume scalar data from the active viewport
 */
export function getVolumeScalarData(viewport: any): {
  scalarData: Float32Array | Int16Array | Uint8Array;
  dimensions: [number, number, number];
  volumeId: string;
  spacing: [number, number, number];
  origin: [number, number, number];
} | null {
  try {
    // Check if this is a volume viewport
    if (!viewport) {
      console.error('[LocalSegmentation3D] Viewport is null or undefined');
      return null;
    }

    if (!(viewport instanceof BaseVolumeViewport)) {
      console.error('[LocalSegmentation3D] Not a volume viewport');
      return null;
    }

    // Get volume IDs from the viewport
    const volumeIds = viewport.getAllVolumeIds();
    if (!volumeIds || volumeIds.length === 0) {
      console.error('[LocalSegmentation3D] No volumes in viewport');
      return null;
    }

    // Get the primary volume (first one)
    const volumeId = volumeIds[0];
    const volume = cornerstone3D.cache.getVolume(volumeId);

    if (!volume) {
      console.error('[LocalSegmentation3D] Could not get volume from cache:', volumeId);
      return null;
    }

    // Get dimensions
    const { dimensions, spacing, origin } = volume;
    const [width, height, depth] = dimensions;

    log('Volume dimensions:', dimensions);
    log('Volume spacing:', spacing);

    // Get scalar data - use voxelManager if available
    let scalarData;
    if (volume.voxelManager && typeof volume.voxelManager.getCompleteScalarDataArray === 'function') {
      scalarData = volume.voxelManager.getCompleteScalarDataArray();
    } else {
      scalarData = volume.getScalarData();
    }

    if (!scalarData || scalarData.length === 0) {
      console.error('[LocalSegmentation3D] No scalar data available');
      return null;
    }

    return {
      scalarData,
      dimensions: [width, height, depth],
      volumeId,
      spacing,
      origin,
    };
  } catch (error) {
    console.error('[LocalSegmentation3D] Error getting volume data:', error);
    return null;
  }
}

/**
 * Convert world coordinates (from a click) to volume index coordinates
 */
export function worldToVoxelIndex(
  worldPoint: cornerstone3D.Types.Point3,
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
    console.error('[LocalSegmentation3D] Error converting world to index:', error);
    return null;
  }
}

/**
 * Apply voxel indices to a labelmap segmentation (3D version)
 * Takes an array of linear voxel indices and sets them to the specified segment index
 */
export async function applyVoxelIndicesToLabelmap(
  segmentationId: string,
  segmentIndex: number,
  voxelIndices: Uint32Array,
  dimensions: [number, number, number]
): Promise<boolean> {
  try {
    log('Applying voxel indices to labelmap', {
      segmentationId,
      segmentIndex,
      voxelCount: voxelIndices.length,
      dimensions,
    });

    // Get the segmentation
    const segmentation = cornerstone3DTools.segmentation.state.getSegmentation(segmentationId);
    if (!segmentation) {
      console.error('[LocalSegmentation3D] Segmentation not found');
      return false;
    }

    log('Segmentation structure:', {
      id: segmentation.segmentationId,
      type: segmentation.type,
      hasRepresentationData: !!segmentation.representationData,
      representationDataKeys: segmentation.representationData ? Object.keys(segmentation.representationData) : []
    });

    // Check if this is a labelmap segmentation
    if (!segmentation.representationData?.Labelmap) {
      console.error('[LocalSegmentation3D] Not a labelmap segmentation');
      console.error('[LocalSegmentation3D] Representation data:', segmentation.representationData);
      return false;
    }

    // Get the actual volume ID from the labelmap representation data
    const labelmapData = segmentation.representationData.Labelmap as any;
    log('Labelmap data structure:', {
      hasVolumeId: !!labelmapData.volumeId,
      labelmapDataKeys: Object.keys(labelmapData || {})
    });

    if (!labelmapData || !labelmapData.volumeId) {
      console.error('[LocalSegmentation3D] Labelmap data or volumeId not found');
      console.error('[LocalSegmentation3D] Labelmap data:', labelmapData);
      return false;
    }

    const volumeId = labelmapData.volumeId;
    log('Using labelmap volumeId:', volumeId);

    const volume = cornerstone3D.cache.getVolume(volumeId);
    if (!volume) {
      console.error('[LocalSegmentation3D] Segmentation volume not found in cache:', volumeId);
      return false;
    }

    // Get the scalar data of the segmentation - use voxelManager if available
    let segScalarData;
    if (volume.voxelManager && typeof volume.voxelManager.getCompleteScalarDataArray === 'function') {
      segScalarData = volume.voxelManager.getCompleteScalarDataArray();
    } else {
      segScalarData = volume.getScalarData();
    }

    if (!segScalarData || segScalarData.length === 0) {
      console.error('[LocalSegmentation3D] No scalar data in segmentation volume');
      return false;
    }

    log('Segmentation scalar data length:', segScalarData.length);
    log('Applying voxel indices, count:', voxelIndices.length);

    // NEW APPROACH: Use boundsIJK to update regions efficiently
    // Convert voxel indices to IJK coordinates and use segmentation utilities
    const [width, height, depth] = dimensions;
    const { imageData } = volume;

    log('Trying segmentation utilities approach');

    // Group voxel indices by slice for efficient processing
    const sliceMap = new Map<number, Set<number>>();

    for (let i = 0; i < voxelIndices.length; i++) {
      const linearIndex = voxelIndices[i];
      const k = Math.floor(linearIndex / (width * height));
      const remainder = linearIndex % (width * height);

      if (!sliceMap.has(k)) {
        sliceMap.set(k, new Set());
      }
      sliceMap.get(k)!.add(remainder);
    }

    log('Processing', sliceMap.size, 'slices');

    // Process each slice
    let totalApplied = 0;
    for (const [sliceK, pixelIndices] of sliceMap.entries()) {
      const sliceOffset = sliceK * width * height;

      for (const pixelIndex of pixelIndices) {
        const linearIndex = sliceOffset + pixelIndex;
        if (linearIndex >= 0 && linearIndex < segScalarData.length) {
          segScalarData[linearIndex] = segmentIndex;
          totalApplied++;
        }
      }
    }

    log('Applied voxels:', totalApplied, 'out of', voxelIndices.length);

    if (totalApplied === 0) {
      console.error('[LocalSegmentation3D] No voxels were applied!');
      return false;
    }

    // CRITICAL: Update the volume's imageData to reflect changes
    if (imageData && imageData.modified) {
      imageData.modified();
      log('ImageData marked as modified');
    }

    // Mark the volume as modified
    volume.modified();
    log('Volume marked as modified');

    // Get all rendering engines and render viewports
    const renderingEngines = getRenderingEngines();
    log('Rendering engines count:', renderingEngines.length);
    renderingEngines.forEach(engine => {
      log('Rendering engine:', engine.id);
      engine.render();
    });

    log('Voxel indices applied successfully');

    // Trigger BOTH events to ensure statistics update
    cornerstone3DTools.segmentation.triggerSegmentationEvents.triggerSegmentationDataModified(
      segmentationId
    );
    log('Segmentation data modified event triggered');

    cornerstone3DTools.segmentation.triggerSegmentationEvents.triggerSegmentationModified(
      segmentationId
    );
    log('Segmentation modified event triggered');

    return true;
  } catch (error) {
    console.error('[LocalSegmentation3D] Error applying voxel indices:', error);
    return false;
  }
}

/**
 * Clear all voxels for a specific segment index in the labelmap (3D)
 */
export async function clearSegment3D(
  segmentationId: string,
  segmentIndex: number
): Promise<boolean> {
  try {
    log('Clearing segment', {
      segmentationId,
      segmentIndex,
    });

    // Get the segmentation
    const segmentation = cornerstone3DTools.segmentation.state.getSegmentation(segmentationId);
    if (!segmentation) {
      console.error('[LocalSegmentation3D] Segmentation not found');
      return false;
    }

    // Check if this is a labelmap segmentation
    if (!segmentation.representationData?.Labelmap) {
      console.error('[LocalSegmentation3D] Not a labelmap segmentation');
      return false;
    }

    // Get the actual volume ID from the labelmap representation data
    const labelmapData = segmentation.representationData.Labelmap;
    if (!labelmapData || !labelmapData.volumeId) {
      console.error('[LocalSegmentation3D] Labelmap data or volumeId not found');
      return false;
    }

    const volumeId = labelmapData.volumeId;
    const volume = cornerstone3D.cache.getVolume(volumeId);
    if (!volume) {
      console.error('[LocalSegmentation3D] Segmentation volume not found in cache');
      return false;
    }

    // Get the scalar data of the segmentation
    let segScalarData;
    if (volume.voxelManager && typeof volume.voxelManager.getCompleteScalarDataArray === 'function') {
      segScalarData = volume.voxelManager.getCompleteScalarDataArray();
    } else {
      segScalarData = volume.getScalarData();
    }

    if (!segScalarData || segScalarData.length === 0) {
      console.error('[LocalSegmentation3D] No scalar data in segmentation volume');
      return false;
    }

    // Clear all voxels with the specified segment index
    let clearedCount = 0;
    const hasVoxelManager = !!volume.voxelManager;

    if (hasVoxelManager && volume.voxelManager.setAtIndex) {
      // Use voxelManager API
      const [width, height, depth] = dimensions;
      for (let linearIndex = 0; linearIndex < segScalarData.length; linearIndex++) {
        if (segScalarData[linearIndex] === segmentIndex) {
          // Convert linear index to i,j,k coordinates
          const k = Math.floor(linearIndex / (width * height));
          const remainder = linearIndex % (width * height);
          const j = Math.floor(remainder / width);
          const i = remainder % width;

          volume.voxelManager.setAtIndex(i, j, k, 0);
          clearedCount++;
        }
      }
    } else {
      // Direct scalar data write
      for (let i = 0; i < segScalarData.length; i++) {
        if (segScalarData[i] === segmentIndex) {
          segScalarData[i] = 0;
          clearedCount++;
        }
      }
    }

    log('Cleared voxels:', clearedCount);

    // Mark the volume as modified
    volume.modified();

    // Get all rendering engines and render viewports
    const renderingEngines = getRenderingEngines();
    renderingEngines.forEach(engine => {
      engine.render();
    });

    // Trigger the segmentation modified event (same as 2D version)
    cornerstone3DTools.segmentation.triggerSegmentationEvents.triggerSegmentationModified(
      segmentationId
    );

    return true;
  } catch (error) {
    console.error('[LocalSegmentation3D] Error clearing segment:', error);
    return false;
  }
}

export async function applyVoxelIndicesToLabelmap3D(
  segmentationId: string,
  segmentIndex: number,
  voxelIndices: Uint32Array,
  sourceDimensions?: [number, number, number] // бажано передати!
): Promise<boolean> {
  try {
    const segmentation = cornerstone3DTools.segmentation.state.getSegmentation(segmentationId);
    if (!segmentation?.representationData?.Labelmap) {
      console.error('[LocalSegmentation3D] Not a labelmap segmentation');
      return false;
    }

    const labelmapData = segmentation.representationData.Labelmap as any;
    const volumeId = labelmapData.volumeId;
    if (!volumeId) {
      console.error('[LocalSegmentation3D] Labelmap has no volumeId. Keys:', Object.keys(labelmapData || {}));
      return false;
    }

    const volume = cornerstone3D.cache.getVolume(volumeId);
    if (!volume) {
      console.error('[LocalSegmentation3D] Segmentation volume not in cache:', volumeId);
      return false;
    }

    const segDims = volume.dimensions as [number, number, number];
    const [W, H, D] = segDims;

    // 🔥 ВАЖЛИВО: перевірка що індекси не з іншої розмірності
    if (sourceDimensions) {
      const [sW, sH, sD] = sourceDimensions;
      if (sW !== W || sH !== H || sD !== D) {
        console.error('[LocalSegmentation3D] Dimension mismatch!', { sourceDimensions, segDims });
        return false;
      }
    }

    // Збираємо які slice-k були змінені → щоб оновити тільки їх (або все, якщо лінь)
    const dirtyKs = new Set<number>();
    const sliceSize = W * H;

    const vm = volume.voxelManager;
    if (vm?.setAtIndex) {
      // ✅ Найнадійніше: voxelManager відмітить “dirty” коректно
      for (let idx = 0; idx < voxelIndices.length; idx++) {
        const lin = voxelIndices[idx];
        const k = Math.floor(lin / sliceSize);
        const rem = lin - k * sliceSize;
        const j = Math.floor(rem / W);
        const i = rem - j * W;

        if (i < 0 || i >= W || j < 0 || j >= H || k < 0 || k >= D) continue;

        vm.setAtIndex(i, j, k, segmentIndex);
        dirtyKs.add(k);
      }
    } else {
      // fallback: прямий буфер
      const segScalarData = volume.getScalarData();
      if (!segScalarData?.length) {
        console.error('[LocalSegmentation3D] No scalarData in segmentation volume');
        return false;
      }

      for (let idx = 0; idx < voxelIndices.length; idx++) {
        const lin = voxelIndices[idx];
        if (lin < 0 || lin >= segScalarData.length) continue;

        segScalarData[lin] = segmentIndex;
        dirtyKs.add(Math.floor(lin / sliceSize));
      }
    }

    // ✅ Позначити imageData як modified
    volume.imageData?.modified?.();
    volume.modified?.();

    // ✅ Дуже часто критично: оновити texture frames
    const tex = (volume as any).vtkOpenGLTexture;
    if (tex?.setUpdatedFrame) {
      // або онови лише dirtyKs, або все (простіш)
      // dirtyKs.forEach(k => tex.setUpdatedFrame(k));
      for (let k = 0; k < D; k++) {
        tex.setUpdatedFrame(k);
      }
    }

    // ✅ Сигнали сегментації
    cornerstone3DTools.segmentation.triggerSegmentationEvents?.triggerSegmentationDataModified?.(
      segmentationId
    );
    cornerstone3DTools.segmentation.triggerSegmentationEvents?.triggerSegmentationModified?.(
      segmentationId
    );

    // ✅ Перерендер
    getRenderingEngines().forEach(e => e.render());

    return true;
  } catch (e) {
    console.error('[LocalSegmentation3D] applyVoxelIndicesToLabelmap3D error', e);
    return false;
  }
}
