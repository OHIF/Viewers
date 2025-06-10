import {
  imageLoader,
  imageLoadPoolManager,
  metaData,
  eventTarget,
  utilities,
} from '@cornerstonejs/core';
import { RequestType, ImageQualityStatus, Events } from '@cornerstonejs/core/enums';

/**
 * WADORS Progressive Image Loader using Cornerstone infrastructure
 * Loads exactly 4 quality levels: 10 → 30 → 60 → 100
 */

const customImageLoaderScheme = 'wadors';

// Map to track WADORS quality levels for each imageId
const wadorsQualityMap = new Map();

// Stage configurations for 4-level quality progression
// Each image will go through ALL 4 stages: 10 → 30 → 60 → 100
const interleavedRetrieveStages = [
  {
    id: 'quality10',
    priority: 5,
    requestType: RequestType.Interaction,
    // Load all images at quality 10 first (fastest preview)
    decimate: 1,
    quality: 10,
    retrieveType: 'quality10',
  },
  {
    id: 'quality30',
    priority: 4,
    requestType: RequestType.Interaction,
    // Then upgrade all images to quality 30
    decimate: 1,
    quality: 30,
    retrieveType: 'quality30',
  },
  {
    id: 'quality60',
    priority: 3,
    requestType: RequestType.Interaction,
    // Then upgrade all images to quality 60
    decimate: 1,
    quality: 60,
    retrieveType: 'quality60',
  },
  {
    id: 'quality100',
    priority: 2,
    requestType: RequestType.Prefetch,
    // Finally load all images at full quality
    decimate: 1,
    quality: 100,
    retrieveType: 'quality100',
  },
];

/**
 * WADORS Progressive Image Loader - Hardcoded for 4 quality levels
 * Always loads: 10 → 30 → 60 → 100 quality
 */
class WadorsProgressiveImageLoader {
  static interleavedRetrieveStages = {
    stages: interleavedRetrieveStages,
  };

  constructor() {
    // Hardcoded stages - always 4 quality levels
    this.stages = interleavedRetrieveStages;

    // Hardcoded retrieve options for each quality level
    this.retrieveOptions = {
      default: {
        streaming: false,
        quality: 100,
      },
      quality10: {
        streaming: false,
        quality: 10,
      },
      quality30: {
        streaming: false,
        quality: 30,
      },
      quality60: {
        streaming: false,
        quality: 60,
      },
      quality100: {
        streaming: false,
        quality: 100,
      },
    };
  }

  loadImages(imageIds, listener) {
    const instance = new WadorsProgressiveImageLoaderInstance(this, imageIds, listener);
    return instance.loadImages();
  }
}

class WadorsProgressiveImageLoaderInstance {
  constructor(configuration, imageIds, listener) {
    this.stages = configuration.stages;
    this.retrieveOptions = configuration.retrieveOptions;
    this.imageIds = imageIds;
    this.listener = listener;
    this.outstandingRequests = 0;
    this.stageStatusMap = new Map();
  }

  async loadImages() {
    const interleaved = this.createStageRequests();
    this.outstandingRequests = interleaved.length;

    for (const request of interleaved) {
      this.addRequest(request);
    }

    if (this.outstandingRequests === 0) {
      return Promise.resolve(null);
    }

    return new Promise(resolve => {
      this.completionCallback = () => {
        if (this.outstandingRequests <= 0) {
          resolve(null);
        }
      };
    });
  }

  async sendRequest(request, options) {
    const { imageId, next } = request;

    try {
      console.log(`Loading ${imageId} with quality ${options.quality || request.stage.quality}`);

      // Create a unique imageId for each quality level to prevent Cornerstone caching
      const qualityImageId = `${imageId}?q=${options.quality || request.stage.quality}`;

      // Load the image with the quality parameter
      const image = await imageLoader.loadImage(qualityImageId, options);

      if (!image) {
        console.warn('No image retrieved', qualityImageId);
        this.listener.errorCallback(imageId, true, 'No image retrieved');
        return;
      }

      // Check if we already have better quality using WADORS quality parameter
      const currentQuality = options.quality || request.stage.quality;
      const existingQuality = wadorsQualityMap.get(imageId);

      if (existingQuality && existingQuality >= currentQuality) {
        console.log(
          `Skipping ${imageId} - already have better/equal WADORS quality ${existingQuality} >= ${currentQuality}`
        );
        this.updateStageStatus(request.stage, null, true);
        return;
      }

      console.log(
        `Successfully loaded ${imageId} with WADORS quality ${currentQuality} (imageQualityStatus: ${image.imageQualityStatus})`
      );

      // Store the WADORS quality for this imageId
      wadorsQualityMap.set(imageId, currentQuality);

      this.listener.successCallback(imageId, image);
      this.updateStageStatus(request.stage);

      // Always process next quality level if available (progressive enhancement)
      if (next) {
        console.log(`Queuing next quality level for ${imageId}`);
        this.addRequest(next, options.streamingData);
      }
    } catch (error) {
      console.error('Failed to load WADORS image:', imageId, error);
      this.listener.errorCallback(imageId, true, error);
      this.updateStageStatus(request.stage, error);
    } finally {
      this.outstandingRequests--;
      if (this.outstandingRequests <= 0) {
        this.completionCallback?.();
      }
    }
  }

  addRequest(request, streamingData = {}) {
    const { imageId, stage } = request;
    const baseOptions = this.listener.getLoaderImageOptions?.(imageId);

    console.log(`addRequest: imageId=${imageId}, stage=${stage.id}, quality=${stage.quality}`);

    if (!baseOptions) {
      console.log(`addRequest: No base options for ${imageId}, skipping`);
      return; // Image no longer of interest
    }

    const { retrieveType = 'default' } = stage;
    const retrieveOptions =
      this.retrieveOptions[retrieveType] || this.retrieveOptions.default || {};

    const options = {
      ...baseOptions,
      retrieveType,
      retrieveOptions,
      streamingData,
      // Add quality parameter for WADORS URL construction
      quality: stage.quality,
    };

    console.log(`addRequest: options for ${imageId}:`, {
      retrieveType,
      quality: options.quality,
      hasBaseOptions: !!baseOptions,
    });

    const priority = stage.priority ?? -5;
    const requestType = stage.requestType || RequestType.Interaction;
    const additionalDetails = { imageId };

    console.log(
      `addRequest: Adding to pool - imageId=${imageId}, priority=${priority}, requestType=${requestType}`
    );

    imageLoadPoolManager.addRequest(
      () => this.sendRequest(request, options),
      requestType,
      additionalDetails,
      priority
    );
  }

  updateStageStatus(stage, failure, skipped = false) {
    const { id } = stage;
    const stageStatus = this.stageStatusMap.get(id);
    if (!stageStatus) {
      return;
    }

    stageStatus.imageLoadPendingCount--;
    if (failure) {
      stageStatus.imageLoadFailedCount++;
    } else if (!skipped) {
      stageStatus.totalImageCount++;
    }

    if (!skipped && !stageStatus.stageStartTime) {
      stageStatus.stageStartTime = Date.now();
    }

    if (!stageStatus.imageLoadPendingCount) {
      const {
        imageLoadFailedCount: numberOfFailures,
        totalImageCount: numberOfImages,
        stageStartTime = Date.now(),
        startTime,
      } = stageStatus;

      const detail = {
        stageId: id,
        numberOfFailures,
        numberOfImages,
        stageDurationInMS: stageStartTime ? Date.now() - stageStartTime : null,
        startDurationInMS: Date.now() - startTime,
      };

      // Use triggerEvent if available
      if (utilities?.triggerEvent) {
        utilities.triggerEvent(eventTarget, Events.IMAGE_RETRIEVAL_STAGE, detail);
      }
      this.stageStatusMap.delete(id);
    }
  }

  createStageRequests() {
    const interleaved = [];
    const imageRequests = new Map();

    const addStageInstance = (stage, position) => {
      const index =
        position < 0
          ? this.imageIds.length + position
          : position < 1
            ? Math.floor((this.imageIds.length - 1) * position)
            : Math.min(position, this.imageIds.length - 1);

      const imageId = this.imageIds[index];
      if (!imageId) {
        console.warn(`No image found at index ${index} for position ${position}, skipping`);
        return;
      }

      const request = {
        imageId,
        stage,
        index,
      };

      this.addStageStatus(stage);
      const existingRequest = imageRequests.get(imageId);
      if (existingRequest) {
        existingRequest.next = request;
      } else {
        interleaved.push(request);
      }
      imageRequests.set(imageId, request);
    };

    for (const stage of this.stages) {
      const indices =
        stage.positions || this.decimate(this.imageIds, stage.decimate || 1, stage.offset ?? 0);
      indices.forEach(index => {
        addStageInstance(stage, index);
      });
    }

    return interleaved;
  }

  addStageStatus(stage) {
    const { id } = stage;
    const stageStatus = this.stageStatusMap.get(id) || {
      stageId: id,
      startTime: Date.now(),
      stageStartTime: null,
      totalImageCount: 0,
      imageLoadFailedCount: 0,
      imageLoadPendingCount: 0,
    };
    stageStatus.imageLoadPendingCount++;
    this.stageStatusMap.set(id, stageStatus);
    return stageStatus;
  }

  decimate(array, factor, offset = 0) {
    const result = [];
    for (let i = offset; i < array.length; i += factor) {
      result.push(i);
    }
    return result;
  }
}

/**
 * Custom WADORS image loader that handles quality parameters
 */
function wadorsImageLoader(imageId, options = {}) {
  console.log(`wadorsImageLoader called: imageId=${imageId}, quality=${options.quality || 100}`);

  try {
    // Remove custom scheme prefix
    let actualImageId = imageId.replace(`${customImageLoaderScheme}:`, '');

    // Extract quality from imageId if present (format: imageId?q=30)
    let quality = options.quality || 100;
    const qualityMatch = actualImageId.match(/\?q=(\d+)$/);
    if (qualityMatch) {
      quality = parseInt(qualityMatch[1], 10);
      actualImageId = actualImageId.replace(/\?q=\d+$/, ''); // Remove quality parameter from URL
    }

    // Parse WADORS URL and add quality parameter
    const qualityUrl = buildQualityUrl(actualImageId, quality);

    console.log('Loading WADORS image with quality:', quality);
    console.log('Making network request to:', qualityUrl);

    // Use standard fetch-based loading for JPEG images
    const promise = fetch(qualityUrl, {
      headers: {
        Accept: 'image/jpeg, image/png, image/*',
      },
      // Disable caching to ensure fresh requests
      cache: 'no-cache',
    })
      .then(response => {
        console.log(
          `Network response for quality ${quality}:`,
          response.status,
          response.statusText
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log(`Creating image from blob for quality ${quality}, blob size:`, blob.size);
        // Use original imageId format (without ?q= parameter) for the image object
        const originalImageId = imageId.replace(/\?q=\d+$/, '');
        return createImageFromBlob(blob, originalImageId, quality);
      });

    return {
      promise,
      cancelFn: undefined,
      decache: undefined,
    };
  } catch (error) {
    console.error(`Error in wadorsImageLoader for quality ${options.quality || 100}:`, error);
    throw error;
  }
}

function buildQualityUrl(imageId, quality) {
  // Parse WADORS URL components - handle both with and without /frames/1
  let match = imageId.match(
    /(.*?)\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/frames\/1$/
  );

  if (match) {
    // URL already includes /frames/1
    const [, baseUrl, studyUID, seriesUID, instanceUID] = match;
    const qualityUrl = `${baseUrl}/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/frames/1/rendered?quality=${quality}`;
    console.log(
      `buildQualityUrl: original=${imageId}, quality=${quality}, constructed=${qualityUrl}`
    );
    return qualityUrl;
  }

  // Try without /frames/1
  match = imageId.match(/(.*?)\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)$/);
  if (match) {
    const [, baseUrl, studyUID, seriesUID, instanceUID] = match;
    const qualityUrl = `${baseUrl}/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/frames/1/rendered?quality=${quality}`;
    console.log(
      `buildQualityUrl: original=${imageId}, quality=${quality}, constructed=${qualityUrl}`
    );
    return qualityUrl;
  }

  throw new Error('Invalid WADORS URL format');
}

function createImageFromBlob(blob, imageId, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixelData = convertToGrayscale(imageData.data);

        // Map quality to image quality status
        let imageQualityStatus = ImageQualityStatus.FULL_RESOLUTION;
        if (quality === 10) {
          imageQualityStatus = ImageQualityStatus.SUBRESOLUTION;
        } else if (quality === 30 || quality === 60) {
          imageQualityStatus = ImageQualityStatus.LOSSY;
        }

        resolve({
          imageId,
          minPixelValue: 0,
          maxPixelValue: 255,
          slope: 1,
          intercept: 0,
          windowCenter: 128,
          windowWidth: 256,
          getPixelData: () => pixelData,
          rows: img.height,
          columns: img.width,
          height: img.height,
          width: img.width,
          color: false,
          columnPixelSpacing: 1,
          rowPixelSpacing: 1,
          sizeInBytes: pixelData.length,
          imageQualityStatus,
          quality,
          // Required metadata
          pixelRepresentation: 0,
          bitsAllocated: 8,
          bitsStored: 8,
          highBit: 7,
          photometricInterpretation: 'MONOCHROME2',
          samplesPerPixel: 1,
          planarConfiguration: 0,
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load image from blob'));
    };

    img.crossOrigin = 'anonymous';
    img.src = blobUrl;
  });
}

function convertToGrayscale(rgbaData) {
  const grayscaleData = new Uint8Array(rgbaData.length / 4);
  for (let i = 0; i < rgbaData.length; i += 4) {
    const gray = Math.round(
      0.299 * rgbaData[i] + 0.587 * rgbaData[i + 1] + 0.114 * rgbaData[i + 2]
    );
    grayscaleData[i / 4] = gray;
  }
  return grayscaleData;
}

/**
 * Custom metadata provider for WADORS rendered images
 */
function customMetadataProvider(type, imageId) {
  if (!imageId.startsWith(`${customImageLoaderScheme}:`)) {
    return;
  }

  if (type === 'generalImageModule') {
    return {
      rows: 512,
      columns: 512,
      pixelSpacing: [1, 1],
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      imagePositionPatient: [0, 0, 0],
      sliceThickness: 1,
      sliceLocation: 0,
    };
  }

  if (type === 'imagePlaneModule') {
    return {
      frameOfReferenceUID: '1.2.3.4.5.6.7.8.9.10.11.12.13.14.15.16.17.18.19.20',
      rows: 512,
      columns: 512,
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      imagePositionPatient: [0, 0, 0],
      pixelSpacing: [1, 1],
      columnCosines: [1, 0, 0],
      rowCosines: [0, 1, 0],
    };
  }

  if (type === 'imagePixelModule') {
    return {
      pixelRepresentation: 0,
      bitsAllocated: 8,
      bitsStored: 8,
      highBit: 7,
      photometricInterpretation: 'MONOCHROME2',
      samplesPerPixel: 1,
      planarConfiguration: 0,
    };
  }

  if (type === 'voiLutModule') {
    return {
      windowCenter: [128],
      windowWidth: [256],
    };
  }

  if (type === 'modalityLutModule') {
    return {
      rescaleIntercept: 0,
      rescaleSlope: 1,
      rescaleType: 'US',
    };
  }

  return undefined;
}

/**
 * Factory function for progressive loading - no configuration needed
 */
function createWadorsProgressive() {
  return new WadorsProgressiveImageLoader();
}

/**
 * Initialize the WADORS rendered image loader
 */
export function initCustomImageLoader() {
  imageLoader.registerImageLoader(customImageLoaderScheme, wadorsImageLoader);
  metaData.addProvider(customMetadataProvider, 10000);
  console.log('WADORS Image Loader registered with scheme:', customImageLoaderScheme);
}

/**
 * Create a custom image ID with the custom scheme
 */
export function createCustomImageId(url) {
  return `${customImageLoaderScheme}:${url}`;
}

/**
 * WADORS Progressive Loader configuration for stack loading - hardcoded
 */
const wadorsStackRetrieveOptions = {
  stages: interleavedRetrieveStages,
  create: createWadorsProgressive,
  createProgressive: createWadorsProgressive,
  // Hardcoded retrieve options - always 4 quality levels
  retrieveOptions: {
    default: {
      streaming: false,
      quality: 100,
    },
    quality10: {
      streaming: false,
      quality: 10,
    },
    quality30: {
      streaming: false,
      quality: 30,
    },
    quality60: {
      streaming: false,
      quality: 60,
    },
    quality100: {
      streaming: false,
      quality: 100,
    },
  },
};

export {
  WadorsProgressiveImageLoader,
  customImageLoaderScheme,
  interleavedRetrieveStages,
  wadorsStackRetrieveOptions,
};
