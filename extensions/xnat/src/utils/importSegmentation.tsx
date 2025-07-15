import { adaptersSEG, Enums } from '@cornerstonejs/adapters';
import { Enums as ToolsEnums } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';
import dcmjs from 'dcmjs';

// Color constants for segmentation display
const CONSTANTS = {
  COLOR_LUT: [
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [255, 255, 0, 255],
    [255, 0, 255, 255],
    [0, 255, 255, 255],
    [255, 128, 0, 255],
    [128, 255, 0, 255],
    [0, 128, 255, 255],
    [255, 0, 128, 255],
  ],
};

// Helper function to convert DICOM Lab color to RGB using dcmjs
function dicomlabToRGB(cielab) {
  if (!cielab || cielab.length < 3) return null;
  
  try {
    // Use dcmjs proper DICOM Lab to RGB conversion
    const rgb = dcmjs.data.Colors.dicomlab2RGB(cielab).map(x => Math.round(x * 255));
    return [...rgb, 255]; // Add alpha channel
  } catch (error) {
    console.warn('Failed to convert DICOM Lab to RGB:', error);
    return null;
  }
}

// Helper function to ensure centroids are properly structured
function ensureCentroidsStructure(centroids, segMetadata) {
  if (!centroids || !(centroids instanceof Map)) {
    console.warn('Creating empty centroids map');
    centroids = new Map();
  }

  // Ensure we have centroids for all segments
  if (segMetadata && segMetadata.data) {
    segMetadata.data.forEach((segmentInfo, index) => {
      if (index === 0) return; // Skip background segment
      
      if (!centroids.has(index)) {
        console.warn(`Missing centroid for segment ${index}, creating default`);
        centroids.set(index, {
          image: { x: 0, y: 0, z: 0 },
          world: { x: 0, y: 0, z: 0 }
        });
      } else {
        // Ensure the centroid has the correct structure
        const centroid = centroids.get(index);
        if (!centroid.image) {
          centroid.image = { x: 0, y: 0, z: 0 };
        }
        if (!centroid.world) {
          centroid.world = { x: 0, y: 0, z: 0 };
        }
      }
    });
  }

  return centroids;
}

interface ImportSegmentationParams {
  arrayBuffer: ArrayBuffer;
  studyInstanceUID: string;
  seriesInstanceUID: string;
  servicesManager: any;
  label?: string; // Optional custom label for the imported segmentation
}

/**
 * Imports a DICOM SEG file and creates a segmentation in OHIF
 */
export const importSegmentation = async ({
  arrayBuffer,
  studyInstanceUID,
  seriesInstanceUID,
  servicesManager,
  label,
}: ImportSegmentationParams): Promise<string> => {
  const { segmentationService, displaySetService, viewportGridService, uiNotificationService } = servicesManager.services;

  try {
    // Find the display set for the referenced series
    const displaySets = displaySetService.getActiveDisplaySets();
    const referencedDisplaySet = displaySets.find(
      ds => ds.SeriesInstanceUID === seriesInstanceUID || ds.StudyInstanceUID === studyInstanceUID
    );

    if (!referencedDisplaySet) {
      throw new Error('Referenced display set not found');
    }

    // Get image IDs from the referenced display set
    let { imageIds } = referencedDisplaySet;
    if (!imageIds) {
      // try images
      const { images } = referencedDisplaySet;
      imageIds = images?.map(image => image.imageId);
    }

    if (!imageIds || imageIds.length === 0) {
      throw new Error('No image IDs found in referenced display set');
    }


    // Parse the DICOM SEG file using cornerstone adapters
    const tolerance = 0.001;
    const results = await adaptersSEG.Cornerstone3D.Segmentation.createFromDICOMSegBuffer(
      imageIds,
      arrayBuffer,
      { metadataProvider: metaData, tolerance }
    );

    if (!results) {
      throw new Error('Failed to parse DICOM SEG file');
    }

    // Ensure centroids are properly structured
    results.centroids = ensureCentroidsStructure(results.centroids, results.segMetadata);

    // Debug centroids structure
    results.centroids.forEach((centroid, index) => {
    });

    // Process colors for segments (similar to cornerstone-dicom-seg extension)
    let usedRecommendedDisplayCIELabValue = true;
    if (results.segMetadata && results.segMetadata.data) {
      results.segMetadata.data.forEach((data, i) => {
        if (i > 0) {
          data.rgba = data.RecommendedDisplayCIELabValue;

          if (data.rgba) {
            data.rgba = dicomlabToRGB(data.rgba);
          } else {
            usedRecommendedDisplayCIELabValue = false;
            data.rgba = CONSTANTS.COLOR_LUT[i % CONSTANTS.COLOR_LUT.length];
          }
        }
      });

      if (!usedRecommendedDisplayCIELabValue) {
        // Display a notification about the non-utilization of RecommendedDisplayCIELabValue
        uiNotificationService.show({
          title: 'DICOM SEG import',
          message:
            'RecommendedDisplayCIELabValue not found for one or more segments. The default color was used instead.',
          type: 'warning',
          duration: 5000,
        });
      }
    } else {
      console.warn('No segMetadata.data found in results:', results);
    }

    // Create a unique segmentation ID
    const segmentationId = `imported_seg_${Date.now()}`;
    
    // Create a segDisplaySet object similar to what cornerstone-dicom-seg creates
    const segmentationLabel = label || `XNAT Import ${new Date().toLocaleTimeString()}`;
    const segDisplaySet = {
      displaySetInstanceUID: segmentationId,
      referencedDisplaySetInstanceUID: referencedDisplaySet.displaySetInstanceUID,
      isOverlayDisplaySet: true,
      label: segmentationLabel,
      SeriesDescription: segmentationLabel, // This is what the cornerstone service uses for the segmentation label
      SeriesDate: new Date().toISOString().split('T')[0], // Add SeriesDate for modifiedTime
      ...results, // Include all the parsed SEG data
    };

    // Create segmentation using the segmentation service with correct API
    const createdSegmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
      segDisplaySet,
      {
        segmentationId,
        type: ToolsEnums.SegmentationRepresentations.Labelmap,
      }
    );

    // Get the active viewport ID
    const activeViewportId = viewportGridService.getActiveViewportId();
    
    // Add segmentation representation to the viewport
    await segmentationService.addSegmentationRepresentation(activeViewportId, {
      segmentationId: createdSegmentationId,
      type: ToolsEnums.SegmentationRepresentations.Labelmap,
    });

    // Set the imported segmentation as active
    segmentationService.setActiveSegmentation(activeViewportId, createdSegmentationId);

    const createdSegmentation = segmentationService.getSegmentation(createdSegmentationId);
    if (createdSegmentation && createdSegmentation.config && createdSegmentation.config.segments) {
      Object.keys(createdSegmentation.config.segments).forEach(segmentIndex => {
        const segment = createdSegmentation.config.segments[segmentIndex];
        if (segment && segment.cachedStats) {
          if (segment.cachedStats.center) {
          }
        }
      });
    }

    return createdSegmentationId;
  } catch (error) {
    console.error('Error importing segmentation:', error);
    throw error;
  }
};

export default importSegmentation;