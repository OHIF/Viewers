/**
 * Magic Wand Worker - 2D Region Growing Algorithm
 *
 * This worker performs flood-fill region growing on a 2D slice based on intensity.
 * Input: scalarData (TypedArray), width, height, seed (x,y), min/max intensity, connectivity (4/8), maxPixels
 * Output: Uint8Array mask (0 or 1) for the slice
 */

interface MagicWandInput {
  scalarData: Float32Array | Int16Array | Uint8Array;
  width: number;
  height: number;
  seedX: number;
  seedY: number;
  minIntensity: number;
  maxIntensity: number;
  connectivity: 4 | 8;
  maxPixels: number;
}

interface MagicWandOutput {
  mask: Uint8Array;
  pixelCount: number;
}

self.onmessage = function(e: MessageEvent<MagicWandInput>) {
  const {
    scalarData,
    width,
    height,
    seedX,
    seedY,
    minIntensity,
    maxIntensity,
    connectivity,
    maxPixels,
  } = e.data;

  console.log('[MagicWandWorker] Starting region growing', {
    width,
    height,
    seedX,
    seedY,
    minIntensity,
    maxIntensity,
    connectivity,
    maxPixels,
  });

  try {
    // Create output mask (0 = background, 1 = foreground)
    const mask = new Uint8Array(width * height);

    // Check if seed is within bounds
    if (seedX < 0 || seedX >= width || seedY < 0 || seedY >= height) {
      console.error('[MagicWandWorker] Seed point out of bounds');
      self.postMessage({ mask, pixelCount: 0 });
      return;
    }

    const seedIndex = seedY * width + seedX;
    const seedValue = scalarData[seedIndex];

    console.log('[MagicWandWorker] Seed value:', seedValue);

    // Check if seed value is within threshold range
    if (seedValue < minIntensity || seedValue > maxIntensity) {
      console.warn('[MagicWandWorker] Seed value outside threshold range');
      self.postMessage({ mask, pixelCount: 0 });
      return;
    }

    // Region growing using queue-based flood fill
    const queue: Array<[number, number]> = [[seedX, seedY]];
    const visited = new Uint8Array(width * height);
    visited[seedIndex] = 1;
    mask[seedIndex] = 1;
    let pixelCount = 1;

    // Define neighbor offsets based on connectivity
    const offsets: Array<[number, number]> = connectivity === 4
      ? [[0, 1], [1, 0], [0, -1], [-1, 0]] // 4-connected
      : [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]; // 8-connected

    while (queue.length > 0 && pixelCount < maxPixels) {
      const [x, y] = queue.shift()!;

      // Check all neighbors
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const nIndex = ny * width + nx;

        // Skip if already visited
        if (visited[nIndex]) {
          continue;
        }

        visited[nIndex] = 1;

        // Check if neighbor value is within threshold
        const nValue = scalarData[nIndex];
        if (nValue >= minIntensity && nValue <= maxIntensity) {
          mask[nIndex] = 1;
          queue.push([nx, ny]);
          pixelCount++;

          if (pixelCount >= maxPixels) {
            console.warn('[MagicWandWorker] Max pixels reached');
            break;
          }
        }
      }
    }

    console.log('[MagicWandWorker] Region growing completed. Pixels:', pixelCount);

    const result: MagicWandOutput = {
      mask,
      pixelCount,
    };

    self.postMessage(result);
  } catch (error) {
    console.error('[MagicWandWorker] Error:', error);
    self.postMessage({ mask: new Uint8Array(width * height), pixelCount: 0 });
  }
};

export {};




