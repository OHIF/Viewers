/**
 * Threshold 3D Worker - Volume-wide intensity thresholding
 *
 * Processes entire volume to create segmentation based on intensity range.
 * Uses chunked processing with progress updates to avoid blocking.
 *
 * Input: scalarData (TypedArray), dimensions, min/max intensity, segmentIndex, chunkSize
 * Output: Progress updates + final voxel indices that match threshold
 */

interface Threshold3DInput {
  scalarData: Float32Array | Int16Array | Uint8Array;
  dimensions: [number, number, number]; // [width, height, depth]
  minIntensity: number;
  maxIntensity: number;
  segmentIndex: number;
  chunkSize?: number;
}

interface Threshold3DProgress {
  type: 'progress';
  progress: number; // 0-100
  processedVoxels: number;
  totalVoxels: number;
  matchedVoxels: number;
}

interface Threshold3DComplete {
  type: 'complete';
  matchedIndices: Uint32Array;
  matchedCount: number;
}

interface Threshold3DError {
  type: 'error';
  message: string;
}

type Threshold3DOutput = Threshold3DProgress | Threshold3DComplete | Threshold3DError;

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Threshold3DWorker]', ...args);
  }
}

self.onmessage = function(e: MessageEvent<Threshold3DInput>) {
  const {
    scalarData,
    dimensions,
    minIntensity,
    maxIntensity,
    segmentIndex,
    chunkSize = 1000000, // Process 1M voxels per chunk
  } = e.data;

  log('Starting threshold 3D processing', {
    dimensions,
    minIntensity,
    maxIntensity,
    totalVoxels: scalarData.length,
    chunkSize,
  });

  try {
    const [width, height, depth] = dimensions;
    const totalVoxels = scalarData.length;
    const matchedIndices: number[] = [];

    let processedVoxels = 0;
    let lastProgressReport = 0;

    // Process in chunks
    for (let start = 0; start < totalVoxels; start += chunkSize) {
      const end = Math.min(start + chunkSize, totalVoxels);

      // Process this chunk
      for (let i = start; i < end; i++) {
        const value = scalarData[i];
        if (value >= minIntensity && value <= maxIntensity) {
          matchedIndices.push(i);
        }
      }

      processedVoxels = end;
      const progress = (processedVoxels / totalVoxels) * 100;

      // Report progress every 5% or every chunk, whichever is less frequent
      if (progress - lastProgressReport >= 5 || end === totalVoxels) {
        const progressMsg: Threshold3DProgress = {
          type: 'progress',
          progress,
          processedVoxels,
          totalVoxels,
          matchedVoxels: matchedIndices.length,
        };
        self.postMessage(progressMsg);
        lastProgressReport = progress;
      }
    }

    log('Threshold processing complete', {
      totalVoxels,
      matchedVoxels: matchedIndices.length,
    });

    // Convert to Uint32Array for efficient transfer
    const matchedIndicesArray = new Uint32Array(matchedIndices);

    const result: Threshold3DComplete = {
      type: 'complete',
      matchedIndices: matchedIndicesArray,
      matchedCount: matchedIndices.length,
    };

    // Transfer ownership of the array buffer
    self.postMessage(result, [matchedIndicesArray.buffer]);
  } catch (error) {
    log('Error in threshold processing:', error);

    const errorMsg: Threshold3DError = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in threshold worker',
    };
    self.postMessage(errorMsg);
  }
};

export {};




