/**
 * Magic Wand 3D Worker - 3D Region Growing Algorithm
 *
 * Performs flood-fill region growing in 3D volume based on intensity.
 * Supports 6/18/26 connectivity and radius limiting.
 * Reports progress periodically for long-running operations.
 *
 * Input: scalarData, dimensions, seed (i,j,k), min/max intensity, connectivity, limits
 * Output: Progress updates + voxel indices that belong to the region
 */

interface MagicWand3DInput {
  scalarData: Float32Array | Int16Array | Uint8Array;
  dimensions: [number, number, number]; // [width, height, depth]
  seedX: number;
  seedY: number;
  seedZ: number;
  minIntensity: number;
  maxIntensity: number;
  connectivity: 6 | 18 | 26;
  maxRegionVoxels: number;
  maxRadiusVoxels: number;
}

interface MagicWand3DProgress {
  type: 'progress';
  progress: number; // 0-100 (estimated)
  processedVoxels: number;
  acceptedVoxels: number;
}

interface MagicWand3DComplete {
  type: 'complete';
  voxelIndices: Uint32Array;
  voxelCount: number;
}

interface MagicWand3DError {
  type: 'error';
  message: string;
}

type MagicWand3DOutput = MagicWand3DProgress | MagicWand3DComplete | MagicWand3DError;

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[MagicWand3DWorker]', ...args);
  }
}

/**
 * Get 3D neighbor offsets based on connectivity
 * 6-connected: faces only (±1 in one axis)
 * 18-connected: faces + edges (±1 in up to two axes)
 * 26-connected: all (±1 in any axes)
 */
function getNeighborOffsets(connectivity: 6 | 18 | 26): Array<[number, number, number]> {
  if (connectivity === 6) {
    // 6-connected: faces only
    return [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1],
    ];
  } else if (connectivity === 18) {
    // 18-connected: faces + edges
    const offsets: Array<[number, number, number]> = [];

    // Faces (6)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const numNonZero = (dx !== 0 ? 1 : 0) + (dy !== 0 ? 1 : 0) + (dz !== 0 ? 1 : 0);
          if (numNonZero === 1 || numNonZero === 2) {
            offsets.push([dx, dy, dz]);
          }
        }
      }
    }
    return offsets;
  } else {
    // 26-connected: all neighbors
    const offsets: Array<[number, number, number]> = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          offsets.push([dx, dy, dz]);
        }
      }
    }
    return offsets;
  }
}

/**
 * Convert 3D coordinates to linear index
 */
function coordsToIndex(x: number, y: number, z: number, width: number, height: number): number {
  return z * width * height + y * width + x;
}

/**
 * Calculate L-infinity (Chebyshev) distance
 */
function linfinityDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1));
}

self.onmessage = function(e: MessageEvent<MagicWand3DInput>) {
  const {
    scalarData,
    dimensions,
    seedX,
    seedY,
    seedZ,
    minIntensity,
    maxIntensity,
    connectivity,
    maxRegionVoxels,
    maxRadiusVoxels,
  } = e.data;

  log('Starting 3D region growing', {
    dimensions,
    seed: [seedX, seedY, seedZ],
    intensityRange: [minIntensity, maxIntensity],
    connectivity,
    maxRegionVoxels,
    maxRadiusVoxels,
  });

  try {
    const [width, height, depth] = dimensions;

    // Validate seed
    if (seedX < 0 || seedX >= width || seedY < 0 || seedY >= height || seedZ < 0 || seedZ >= depth) {
      throw new Error('Seed point out of bounds');
    }

    const seedIndex = coordsToIndex(seedX, seedY, seedZ, width, height);
    const seedValue = scalarData[seedIndex];

    log('Seed value:', seedValue);

    // Check if seed value is within threshold range
    if (seedValue < minIntensity || seedValue > maxIntensity) {
      log('Seed value outside threshold range');
      const result: MagicWand3DComplete = {
        type: 'complete',
        voxelIndices: new Uint32Array(0),
        voxelCount: 0,
      };
      self.postMessage(result);
      return;
    }

    // Initialize visited array and queue
    const totalVoxels = width * height * depth;
    const visited = new Uint8Array(totalVoxels);
    const acceptedIndices: number[] = [];

    // BFS queue: [x, y, z]
    const queue: Array<[number, number, number]> = [[seedX, seedY, seedZ]];
    visited[seedIndex] = 1;
    acceptedIndices.push(seedIndex);

    const neighborOffsets = getNeighborOffsets(connectivity);
    let processedVoxels = 0;
    let lastProgressReport = 0;
    const progressReportInterval = 1000; // Report every 1000 voxels

    log('Starting BFS with', neighborOffsets.length, 'neighbor directions');

    // BFS flood fill
    while (queue.length > 0 && acceptedIndices.length < maxRegionVoxels) {
      const [x, y, z] = queue.shift()!;
      processedVoxels++;

      // Check all neighbors
      for (const [dx, dy, dz] of neighborOffsets) {
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;

        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || nz < 0 || nz >= depth) {
          continue;
        }

        const nIndex = coordsToIndex(nx, ny, nz, width, height);

        // Skip if already visited
        if (visited[nIndex]) {
          continue;
        }

        visited[nIndex] = 1;

        // Check radius constraint (L-infinity distance)
        const distance = linfinityDistance(seedX, seedY, seedZ, nx, ny, nz);
        if (distance > maxRadiusVoxels) {
          continue;
        }

        // Check if neighbor value is within threshold
        const nValue = scalarData[nIndex];
        if (nValue >= minIntensity && nValue <= maxIntensity) {
          acceptedIndices.push(nIndex);
          queue.push([nx, ny, nz]);

          if (acceptedIndices.length >= maxRegionVoxels) {
            log('Max region voxels reached');
            break;
          }
        }
      }

      // Report progress periodically
      if (processedVoxels - lastProgressReport >= progressReportInterval) {
        // Estimate progress based on accepted voxels vs max
        const progress = Math.min(95, (acceptedIndices.length / maxRegionVoxels) * 100);

        const progressMsg: MagicWand3DProgress = {
          type: 'progress',
          progress,
          processedVoxels,
          acceptedVoxels: acceptedIndices.length,
        };
        self.postMessage(progressMsg);
        lastProgressReport = processedVoxels;
      }
    }

    log('Region growing complete', {
      processedVoxels,
      acceptedVoxels: acceptedIndices.length,
      queueRemaining: queue.length,
    });

    // Convert to Uint32Array for efficient transfer
    const voxelIndicesArray = new Uint32Array(acceptedIndices);

    const result: MagicWand3DComplete = {
      type: 'complete',
      voxelIndices: voxelIndicesArray,
      voxelCount: acceptedIndices.length,
    };

    // Transfer ownership of the array buffer
    self.postMessage(result, [voxelIndicesArray.buffer]);
  } catch (error) {
    log('Error in region growing:', error);

    const errorMsg: MagicWand3DError = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in magic wand worker',
    };
    self.postMessage(errorMsg);
  }
};

export {};




