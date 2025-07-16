/*
 * JSONMeasurementImporter - utility to parse a Measurement Collection JSON (as returned by XNAT)
 * and inject its imageMeasurements into OHIF MeasurementService so they appear in the viewer.
 */

import React from 'react';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';
import type { Types as CSExtTypes } from '@cornerstonejs/core';
import { getEnabledElement } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';

// Helper to safely get source that has mappings already registered (Cornerstone3DTools).
function _getMeasurementSource(measurementService) {
  const {
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION,
  } = CSExtensionEnums;

  const source = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  if (!source) {
    throw new Error('Measurement source for Cornerstone3DTools not found – import aborted');
  }
  return source;
}

// Helper to find imageId and display set info using the older OHIF-XNAT approach
function _getImageIdAndDisplaySetInfo(sopInstanceUID, frameNumber, seriesUID, displaySetService, extensionManager) {
  try {

    // Get all display sets for the series
    const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);

    if (!displaySets || displaySets.length === 0) {
      console.warn(`No display sets found for series ${seriesUID}`);
      return { imageId: null, displaySetInstanceUID: null };
    }
    // Find the display set that contains this SOPInstanceUID
    let matchingDisplaySet = null;
    let matchingImage = null;

    for (const displaySet of displaySets) {
      // Try the old approach first: look in displaySet.images
      if (displaySet.images && displaySet.images.length > 0) {
        matchingImage = displaySet.images.find(image =>
          image.SOPInstanceUID === sopInstanceUID
        );
        if (matchingImage) {
          matchingDisplaySet = displaySet;
          console.log(`🔍 DEBUG: Found matching image in displaySet.images`);
          break;
        }
      }

      // Fallback to new approach: look in displaySet.instances
      if (!matchingImage && displaySet.instances && displaySet.instances.length > 0) {
        const matchingInstance = displaySet.instances.find(instance =>
          instance.SOPInstanceUID === sopInstanceUID
        );
        if (matchingInstance) {
          // Convert instance to image-like object for compatibility
          matchingImage = matchingInstance;
          matchingDisplaySet = displaySet;
          break;
        }
      }
    }

    if (!matchingDisplaySet || !matchingImage) {
      console.warn(`No display set found containing SOPInstanceUID ${sopInstanceUID}`);
      return { imageId: null, displaySetInstanceUID: null };
    }

    let imageId = null;

    // Check if this is a multi-frame instance
    const numberOfFrames = matchingImage.NumberOfFrames || matchingDisplaySet.numImageFrames || 1;
    const isMultiFrame = numberOfFrames > 1;

    // Use the old approach: try to get imageId from the image object
    if (matchingImage.getImageId && typeof matchingImage.getImageId === 'function') {
      try {
        imageId = matchingImage.getImageId();

        // Add frame parameter for multi-frame instances (using 0-based frame index)
        if (isMultiFrame && frameNumber > 1) {
          const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
          imageId += `?frame=${frameIndex}`;
        }
      } catch (err) {
        console.warn('Failed to get imageId from getImageId():', err);
        imageId = null;
      }
    }

    // Fallback: use imageId property directly
    if (!imageId && matchingImage.imageId) {
      imageId = matchingImage.imageId;

      // Add frame parameter for multi-frame instances
      if (isMultiFrame && frameNumber > 1) {
        const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
        const frameParam = imageId.includes('?') ? `&frame=${frameIndex}` : `?frame=${frameIndex}`;
        imageId += frameParam;
      }
    }

    // Last resort: construct imageId using data source (new approach)
    if (!imageId) {
      try {
        const dataSource = extensionManager?.getActiveDataSource?.()?.[0];
        if (dataSource && typeof dataSource.getImageIdsForInstance === 'function') {
          const frameParam = isMultiFrame && frameNumber > 1 ? frameNumber - 1 : undefined;
          imageId = dataSource.getImageIdsForInstance({
            instance: matchingImage,
            frame: frameParam
          });
        }
      } catch (err) {
        console.warn('Failed to get imageId from dataSource:', err);
      }
    }

    // Final fallback: construct a basic imageId
    if (!imageId) {
      if (isMultiFrame) {
        imageId = `wadors:${sopInstanceUID}:${frameNumber || 1}`;
      } else {
        imageId = `wadors:${sopInstanceUID}`;
      }
    }

    return {
      imageId,
      displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID
    };

  } catch (error) {
    console.error('Error getting imageId for SOPInstanceUID:', sopInstanceUID, error);
    return { imageId: null, displaySetInstanceUID: null };
  }
}

// Identity mapping that extracts the measurement from the annotation wrapper
const identityMapping = data => {
  // The data object contains the annotation wrapper, we need to extract the actual measurement
  if (data.annotation && data.measurement) {
    console.log(`🔍 DEBUG: identityMapping extracting measurement:`, {
      uid: data.measurement.uid,
      displayText: data.measurement.displayText,
      label: data.measurement.label,
      toolName: data.measurement.toolName
    });
    return data.measurement;
  }
    return data;
};

export async function importMeasurementCollection({
  collectionJSON,
  servicesManager,
}) {
  if (!collectionJSON || !servicesManager) {
    throw new Error('importMeasurementCollection: missing parameters');
  }

  const { measurementService, displaySetService } = servicesManager.services;
  const source = _getMeasurementSource(measurementService);

  // Try to get extensionManager for data source access
  let extensionManager;
  try {
    extensionManager = (servicesManager as any)._extensionManager;
  } catch (e) {
    console.warn('Could not access extensionManager:', e);
  }

  const imageRef = collectionJSON.imageReference || {};
  const studyUID = imageRef.StudyInstanceUID || imageRef.studyInstanceUID;
  const seriesUID = imageRef.SeriesInstanceUID || imageRef.seriesInstanceUID;

  // Build a lookup for SOP -> frameIndex
  const sopToFrame = {};
  (imageRef.imageCollection || []).forEach(img => {
    sopToFrame[img.SOPInstanceUID] = (img.frameIndex ?? img.frameNumber ?? 0);
  });

  const imageMeasurements = collectionJSON.imageMeasurements || [];

  // Try to obtain an active dataSource (needed for downstream callbacks)
  let dataSource: any = undefined;
  try {
    // `ServicesManager` keeps a private reference to the ExtensionManager.
    const extMgr = (servicesManager as any)._extensionManager;
    if (extMgr && typeof extMgr.getActiveDataSource === 'function') {
      const activeDS = extMgr.getActiveDataSource();
      if (Array.isArray(activeDS) && activeDS.length) {
        dataSource = activeDS[0];
      }
    }
  } catch (e) {
    // Ignore – we will fall back to undefined which is acceptable for most tools
  }

  const findDisplaySetInstanceUID = (sopInstanceUID) => {
    const displaySets = displaySetService.getDisplaySets();

    for (const displaySet of displaySets) {
      // Try old approach first: check displaySet.images
      if (displaySet.images && displaySet.images.length > 0) {
        const found = displaySet.images.some(image => image.SOPInstanceUID === sopInstanceUID);
        if (found) {
          return displaySet.displaySetInstanceUID;
        }
      }

      // Fallback: check displaySet.instances 
      if (displaySet.instances && displaySet.instances.length > 0) {
        const found = displaySet.instances.some(instance => instance.SOPInstanceUID === sopInstanceUID);
        if (found) {
          return displaySet.displaySetInstanceUID;
        }
      }
    }

    return undefined;
  };

  imageMeasurements.forEach(im => {
    console.log(`🔍 DEBUG: Processing raw measurement from XNAT:`, im);
    console.log(`🔍 DEBUG: Measurement properties: uuid=${im.uuid}, type=${im.type}, toolType=${im.toolType}, toolName=${im.toolName}, label=${im.label}, name=${im.name}`);

    const sopInstanceUID = im.imageReference?.SOPInstanceUID;

    // Get the imageId and display set info for this measurement first
    // We'll determine the correct frame number based on the actual instance
    const initialFrameNumber = (im.imageReference?.frameIndex ?? 0) + 1;
    const { imageId, displaySetInstanceUID } = _getImageIdAndDisplaySetInfo(
      sopInstanceUID,
      initialFrameNumber,
      seriesUID,
      displaySetService,
      extensionManager
    );

    if (!imageId) {
      console.warn(`Failed to get imageId for measurement ${im.uuid}, skipping`);
      return;
    }

    // Get the z-coordinate from the image plane to ensure annotation is on the correct slice
    let zCoord = 0;
    try {
      const metaData = (window as any).cornerstone?.metaData;
      if (metaData) {
        const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
        if (imagePlaneModule && imagePlaneModule.imagePositionPatient) {
          zCoord = imagePlaneModule.imagePositionPatient[2];  
        } else {
          console.warn(`Could not find imagePlaneModule for imageId: ${imageId}`);
        }
      }
    } catch (e) {
      console.warn('Failed to get z-coordinate from Cornerstone metadata:', e);
    }

    // Simplified FrameOfReferenceUID handling - make it optional
    let measurementFrameOfReferenceUID = im.frameOfReferenceUID || '';

    // Only try to resolve FrameOfReferenceUID if it's not already provided
    if (!measurementFrameOfReferenceUID && imageId) {
      try {
        const metaData = (window as any).cornerstone?.metaData;
        if (metaData) {
          const instanceMeta = metaData.get('instance', imageId);
          measurementFrameOfReferenceUID = instanceMeta?.FrameOfReferenceUID || instanceMeta?.frameOfReferenceUID || '';
          
          // Try hex format as fallback
          if (!measurementFrameOfReferenceUID && instanceMeta) {
            const forUIDHex = instanceMeta['00200052'] || instanceMeta['x00200052'];
            if (forUIDHex?.Value && Array.isArray(forUIDHex.Value) && forUIDHex.Value.length > 0) {
              measurementFrameOfReferenceUID = forUIDHex.Value[0];
            } else if (typeof forUIDHex === 'string') {
              measurementFrameOfReferenceUID = forUIDHex;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to get FrameOfReferenceUID from metadata:', e);
      }
    }
    
    // If we still don't have a frame of reference, check if any viewport has one
    // If no viewport has a frame of reference, we'll create the annotation without one
    if (!measurementFrameOfReferenceUID) {
      try {
        const { cornerstoneViewportService } = servicesManager.services;
        const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
        if (renderingEngine) {
          const viewports = renderingEngine.getViewports();
          let hasAnyFrameOfRef = false;
          
          viewports.forEach(viewport => {
            const viewportFrameOfRef = viewport.getFrameOfReferenceUID();
            if (viewportFrameOfRef) {
              hasAnyFrameOfRef = true;
              // Use the first available frame of reference
              if (!measurementFrameOfReferenceUID) {
                measurementFrameOfReferenceUID = viewportFrameOfRef;
              }
            }
          });
          
          if (!hasAnyFrameOfRef) {
            console.log(`🔍 DEBUG: No viewport has frame of reference, will create annotation without one`);
            measurementFrameOfReferenceUID = null; // Use null instead of undefined to be explicit
          }
        }
      } catch (e) {
        console.warn('Failed to check viewport frame of references:', e);
        measurementFrameOfReferenceUID = null;
      }
    }
    
    // Final check: if we still have a frame of reference but no viewport has one, remove it
    if (measurementFrameOfReferenceUID) {
      try {
        const { cornerstoneViewportService } = servicesManager.services;
        const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
        if (renderingEngine) {
          const viewports = renderingEngine.getViewports();
          let hasMatchingFrameOfRef = false;
          
          viewports.forEach(viewport => {
            const viewportFrameOfRef = viewport.getFrameOfReferenceUID();
            if (viewportFrameOfRef === measurementFrameOfReferenceUID) {
              hasMatchingFrameOfRef = true;
            }
          });
          
          if (!hasMatchingFrameOfRef) {
            console.log(`🔍 DEBUG: No viewport has matching frame of reference ${measurementFrameOfReferenceUID}, removing it`);
            measurementFrameOfReferenceUID = null;
          }
        }
      } catch (e) {
        console.warn('Failed to check frame of reference matching:', e);
        measurementFrameOfReferenceUID = null;
      }
    }

    // For the measurement object, determine the correct frame number
    // For single-frame instances, frame number should always be 1
    // For multi-frame instances, use the provided frame number
    let frameNumber = 1; // Default for single-frame

    try {
      // Check if this is a multi-frame instance
      const instanceMetadata = DicomMetadataStore.getInstance(
        studyUID,
        seriesUID,
        sopInstanceUID
      );

      const numberOfFrames = instanceMetadata?.NumberOfFrames || 1;
      if (numberOfFrames > 1) {
        // Multi-frame instance - use the provided frame number (ensure it's 1-based)
        frameNumber = Math.max(1, initialFrameNumber);

        // Validate frame number is within bounds
        if (frameNumber > numberOfFrames) {
          frameNumber = 1;
        }
      }
      // For single-frame instances, frameNumber stays 1
    } catch (e) {
      // If we can't get metadata, use frame 1 as safe default
      frameNumber = 1;
    }

    let measurement;
    try {
      // Ensure we have a valid toolName - try multiple sources
      const toolName = im.type || im.toolType || im.toolName || 'Length';
      console.log(`🔍 DEBUG: Resolved toolName: ${toolName} from im.type=${im.type}, im.toolType=${im.toolType}, im.toolName=${im.toolName}`);

      // Create a clean copy of im without fields that are not in MEASUREMENT_SCHEMA_KEYS to avoid conflicts
      const {
        uuid,
        toolType,
        name,
        codingSequence,
        color,
        lineThickness,
        dashedLine,
        visible,
        imageReference,
        viewport,
        measurements,
        ...cleanIm
      } = im;

      measurement = identityMapping({
        uid: im.uuid,  // Use uid instead of uuid for OHIF
        toolName: toolName,
        SOPInstanceUID: sopInstanceUID,
        referenceStudyUID: studyUID,
        referenceSeriesUID: seriesUID,
        frameNumber: frameNumber,
        // Only include FrameOfReferenceUID if we have one
        ...(measurementFrameOfReferenceUID ? { FrameOfReferenceUID: measurementFrameOfReferenceUID } : {}),
        label: im.label || im.name || toolName || 'Measurement',
        referencedImageId: imageId,  // Add referencedImageId at top level for isReferenceViewable
        ...cleanIm,  // Spread the clean object without invalid schema fields
        metadata: {
          ...im.metadata,
          referencedImageId: imageId,
          toolName: toolName,
          // Only include FrameOfReferenceUID if we have one and at least one viewport has one
          ...(measurementFrameOfReferenceUID ? { FrameOfReferenceUID: measurementFrameOfReferenceUID } : {}),
        },
        // Ensure referencedImageId is also at the top level for viewport matching
        displaySetInstanceUID: displaySetInstanceUID,
      });
    } catch (e) {
      console.error('Failed to create measurement object:', e);
      return;
    }

    // Extract points from handles
    const handles = im.data?.handles;
    console.log(`DEBUG: Initial handles for ${im.uuid}:`, handles);
    console.log(`DEBUG: Initial im.data for ${im.uuid}:`, im.data);

    if (handles) {
      const pointHandles = Object.values(handles).filter(
        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
      );
      measurement.points = pointHandles.map((p: any) => [p.x, p.y, p.z || zCoord]);
    }

    // Extract displayText from the measurements array (skip for Length tools as we'll set it later)
    const stats = im.measurements;
    if (stats && stats.length > 0 && measurement.toolName !== 'Length') {
      const mainStat = stats[0];
      if (typeof mainStat.value === 'number' && isFinite(mainStat.value)) {
        const displayValue = `${mainStat.value.toFixed(2)} ${mainStat.unit || ''}`.trim();
        measurement.displayText = {
          primary: [displayValue],
          secondary: [],
        };
      } else if (mainStat.comment) {
        measurement.displayText = {
          primary: [mainStat.comment],
          secondary: [],
        };
      } else {
        measurement.displayText = {
          primary: [],
          secondary: [],
        };
      }
    } else if (measurement.toolName !== 'Length') {
      // Initialize empty displayText for non-Length tools
      measurement.displayText = {
        primary: [],
        secondary: [],
      };
    }

    // Pass through cachedStats for ROI tools
    if (im.data?.cachedStats) {
      measurement.data = {
        cachedStats: im.data.cachedStats,
      };
    }

    if (im.toolType === 'ArrowAnnotate' && im.data?.text) {
      (measurement.data as any).text = im.data.text;
    }

    // Ensure handles are present for supported tools
    if (measurement.toolName === 'Length') {
      if (measurement.points.length >= 2) {
        // Use the 3D coordinates directly from the handles (these are already world coordinates)
        // measurement.points now contains [x, y, z] coordinates extracted from handles
        const point1World = [measurement.points[0][0], measurement.points[0][1], measurement.points[0][2]];
        const point2World = [measurement.points[1][0], measurement.points[1][1], measurement.points[1][2]];
        // Calculate textBox position as midpoint between the two measurement points
        const textBoxWorldPosition = [
          (point1World[0] + point2World[0]) / 2,
          (point1World[1] + point2World[1]) / 2,
          (point1World[2] + point2World[2]) / 2,
        ];

        // Calculate proper worldBoundingBox for the text box
        // This is essential for Cornerstone3D rendering
        const textBoxSize = 50; // Approximate text box size in world coordinates
        const halfSize = textBoxSize / 2;
        
        const worldBoundingBox = {
          topLeft: [
            textBoxWorldPosition[0] - halfSize,
            textBoxWorldPosition[1] + halfSize,
            textBoxWorldPosition[2]
          ],
          topRight: [
            textBoxWorldPosition[0] + halfSize,
            textBoxWorldPosition[1] + halfSize,
            textBoxWorldPosition[2]
          ],
          bottomLeft: [
            textBoxWorldPosition[0] - halfSize,
            textBoxWorldPosition[1] - halfSize,
            textBoxWorldPosition[2]
          ],
          bottomRight: [
            textBoxWorldPosition[0] + halfSize,
            textBoxWorldPosition[1] - halfSize,
            textBoxWorldPosition[2]
          ],
        };

        // Cornerstone3D LengthTool expects data.handles.points as array of 3D world coordinates
        measurement.data.handles = {
          points: [point1World, point2World],
          textBox: {
            hasMoved: false,
            worldPosition: textBoxWorldPosition,
            worldBoundingBox: worldBoundingBox,
          },
          // Add additional properties that Length tool might expect
          activeHandleIndex: null,
          start: { x: point1World[0], y: point1World[1], z: point1World[2] },
          end: { x: point2World[0], y: point2World[1], z: point2World[2] },
        };
      }

      // Ensure length value is available for measurement panel display
      let lengthValue = null;

      // Try to get from im.measurements first
      const stat = Array.isArray(im.measurements) && im.measurements.find((m: any) => m.name === 'length');
      if (stat && typeof stat.value === 'number' && stat.value > 0) {
        lengthValue = stat.value;
        measurement.data.length = stat.value;
      }

      // If no length from measurements, calculate from world coordinates
      if (!lengthValue && measurement.data.handles?.points?.length >= 2) {
        const p1 = measurement.data.handles.points[0];
        const p2 = measurement.data.handles.points[1];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dz = p2[2] - p1[2];
        lengthValue = Math.sqrt(dx * dx + dy * dy + dz * dz);
        measurement.data.length = lengthValue;
      }

      // Set displayText for the measurement panel - AFTER calculating length
      if (lengthValue && lengthValue > 0) {
        // Generate secondary text like the Length tool mapping does
        let secondaryText = '';
        try {
          // Get series and instance information from the display set
          const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
          if (displaySets && displaySets.length > 0) {
            const displaySet = displaySets[0];
            const SeriesNumber = displaySet.SeriesNumber || '0';
            
            // Find the instance for this SOPInstanceUID
            let InstanceNumber = '';
            if (displaySet.instances && displaySet.instances.length > 0) {
              const instance = displaySet.instances.find(img => img.SOPInstanceUID === sopInstanceUID);
              if (instance) {
                InstanceNumber = instance.InstanceNumber || '';
              }
            }
            
            const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
            const frameText = displaySet.isMultiFrame && frameNumber > 1 ? ` F: ${frameNumber}` : '';
            
            secondaryText = `S: ${SeriesNumber}${instanceText}${frameText}`;
          }
        } catch (e) {
          console.warn('Failed to generate secondary text:', e);
          secondaryText = 'S: 0 I: 1'; // Fallback
        }
        
        measurement.displayText = {
          primary: [`${lengthValue.toFixed(2)} mm`],
          secondary: [secondaryText],
        };
      } else {
        measurement.displayText = {
          primary: [measurement.label || 'Length'],
          secondary: ['S: 0 I: 1'], // Fallback secondary text
        };
      }

    } else if (measurement.toolName === 'RectangleROI') {
      if (measurement.points.length >= 4) {
        // Calculate textBox position as center of the rectangle
        const avgX = measurement.points.reduce((sum, point) => sum + point[0], 0) / measurement.points.length;
        const avgY = measurement.points.reduce((sum, point) => sum + point[1], 0) / measurement.points.length;
        const avgZ = measurement.points.reduce((sum, point) => sum + (point[2] || 0), 0) / measurement.points.length;
        const textBoxWorldPosition = [avgX, avgY, avgZ];

        // Calculate proper worldBoundingBox for the text box
        const textBoxSize = 50; // Approximate text box size in world coordinates
        const halfSize = textBoxSize / 2;
        
        const worldBoundingBox = {
          topLeft: [
            textBoxWorldPosition[0] - halfSize,
            textBoxWorldPosition[1] + halfSize,
            textBoxWorldPosition[2]
          ],
          topRight: [
            textBoxWorldPosition[0] + halfSize,
            textBoxWorldPosition[1] + halfSize,
            textBoxWorldPosition[2]
          ],
          bottomLeft: [
            textBoxWorldPosition[0] - halfSize,
            textBoxWorldPosition[1] - halfSize,
            textBoxWorldPosition[2]
          ],
          bottomRight: [
            textBoxWorldPosition[0] + halfSize,
            textBoxWorldPosition[1] - halfSize,
            textBoxWorldPosition[2]
          ],
        };

        // Cornerstone3D RectangleROI expects data.handles.points as array of 4 3D coordinates for rectangle corners
        measurement.data.handles = {
          points: measurement.points.map(point => [point[0], point[1], point[2] || 0]),
          textBox: {
            hasMoved: false,
            worldPosition: textBoxWorldPosition,
            worldBoundingBox: worldBoundingBox,
          },
        };
      } else if (im.data?.handles) {
        measurement.data.handles = im.data.handles;

        // Extract points from handles for RectangleROI
        if (im.data.handles.corner1 && im.data.handles.corner2) {
          // RectangleROI typically has corner1 and corner2
          measurement.points = [
            [im.data.handles.corner1.x, im.data.handles.corner1.y, im.data.handles.corner1.z || 0],
            [im.data.handles.corner2.x, im.data.handles.corner2.y, im.data.handles.corner2.z || 0],
          ];
        } else {
          // Try to extract from any available handle points
          const handleValues = Object.values(im.data.handles).filter(
            (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
          );
          measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
        }
      }

      // Ensure displayText for RectangleROI measurement panel display
      if (im.measurements && im.measurements.length > 0) {
        const stats = im.measurements;
        const displayValues = [];

        stats.forEach(stat => {
          if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
            displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
          }
        });

        // Generate secondary text like the ROI tool mappings do
        let secondaryText = '';
        try {
          const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
          if (displaySets && displaySets.length > 0) {
            const displaySet = displaySets[0];
            const SeriesNumber = displaySet.SeriesNumber || '0';
            
            let InstanceNumber = '';
            if (displaySet.instances && displaySet.instances.length > 0) {
              const instance = displaySet.instances.find(img => img.SOPInstanceUID === sopInstanceUID);
              if (instance) {
                InstanceNumber = instance.InstanceNumber || '';
              }
            }
            
            const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
            const frameText = displaySet.isMultiFrame && frameNumber > 1 ? ` F: ${frameNumber}` : '';
            
            secondaryText = `S: ${SeriesNumber}${instanceText}${frameText}`;
          }
        } catch (e) {
          console.warn('Failed to generate secondary text for RectangleROI:', e);
          secondaryText = 'S: 0 I: 1';
        }

        measurement.displayText = {
          primary: displayValues.length > 0 ? displayValues : [measurement.label || 'RectangleROI'],
          secondary: [secondaryText],
        };
      } else {
        measurement.displayText = {
          primary: [measurement.label || 'RectangleROI'],
          secondary: ['S: 0 I: 1'],
        };
      }
    } else if (measurement.toolName === 'EllipticalROI' || measurement.toolName === 'CircleROI') {
      // Handle other ROI tools
      if (im.data?.handles) {
        measurement.data.handles = im.data.handles;

        // Extract points from handles for other ROI tools
        if (im.data.handles.center && im.data.handles.end) {
          // CircleROI/EllipticalROI typically have center and end
          measurement.points = [
            [im.data.handles.center.x, im.data.handles.center.y, im.data.handles.center.z || 0],
            [im.data.handles.end.x, im.data.handles.end.y, im.data.handles.end.z || 0],
          ];

          // For circle/ellipse, textBox should be at the center point
          if (measurement.data.handles.textBox) {
            measurement.data.handles.textBox.worldPosition = [
              im.data.handles.center.x,
              im.data.handles.center.y,
              im.data.handles.center.z || 0
            ];
          }
        } else {
          // Try to extract from any available handle points
          const handleValues = Object.values(im.data.handles).filter(
            (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
          );
          measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);

          // Calculate average position for textBox if we have multiple points
          if (measurement.points.length > 0) {
            const avgX = measurement.points.reduce((sum, point) => sum + point[0], 0) / measurement.points.length;
            const avgY = measurement.points.reduce((sum, point) => sum + point[1], 0) / measurement.points.length;
            const avgZ = measurement.points.reduce((sum, point) => sum + (point[2] || 0), 0) / measurement.points.length;

            if (measurement.data.handles.textBox) {
              measurement.data.handles.textBox.worldPosition = [avgX, avgY, avgZ];
            }
          }
        }
      }

      // Set displayText for other ROI tools
      if (im.measurements && im.measurements.length > 0) {
        const stats = im.measurements;
        const displayValues = [];

        stats.forEach(stat => {
          if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
            displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
          }
        });

        // Generate secondary text like the ROI tool mappings do
        let secondaryText = '';
        try {
          const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
          if (displaySets && displaySets.length > 0) {
            const displaySet = displaySets[0];
            const SeriesNumber = displaySet.SeriesNumber || '0';
            
            let InstanceNumber = '';
            if (displaySet.instances && displaySet.instances.length > 0) {
              const instance = displaySet.instances.find(img => img.SOPInstanceUID === sopInstanceUID);
              if (instance) {
                InstanceNumber = instance.InstanceNumber || '';
              }
            }
            
            const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
            const frameText = displaySet.isMultiFrame && frameNumber > 1 ? ` F: ${frameNumber}` : '';
            
            secondaryText = `S: ${SeriesNumber}${instanceText}${frameText}`;
          }
        } catch (e) {
          console.warn('Failed to generate secondary text for ROI tool:', e);
          secondaryText = 'S: 0 I: 1';
        }

        measurement.displayText = {
          primary: displayValues.length > 0 ? displayValues : [measurement.label || measurement.toolName],
          secondary: [secondaryText],
        };
      } else {
        measurement.displayText = {
          primary: [measurement.label || measurement.toolName],
          secondary: ['S: 0 I: 1'],
        };
      }

      // Ensure cachedStats for ROI tools
      if (im.data?.cachedStats) {
        measurement.data.cachedStats = im.data.cachedStats;
      }
    } else if (measurement.toolName === 'Bidirectional') {
      if (!measurement.data.handles || !measurement.data.handles.start || !measurement.data.handles.end || !measurement.data.handles.perpendicularStart || !measurement.data.handles.perpendicularEnd) {
        if (measurement.points.length >= 4) {
          measurement.data.handles = {
            start: { x: measurement.points[0][0], y: measurement.points[0][1] },
            end: { x: measurement.points[1][0], y: measurement.points[1][1] },
            perpendicularStart: { x: measurement.points[2][0], y: measurement.points[2][1] },
            perpendicularEnd: { x: measurement.points[3][0], y: measurement.points[3][1] },
          };
        }
      }
    } // Add more tool types as needed

    // Defensive: ensure data and handles always exist
    if (!measurement.data) {
      measurement.data = {};
    }
    if (!measurement.data.handles) {
      measurement.data.handles = {};
    }

    // For ArrowAnnotate, try to reconstruct a start handle if possible
    if (measurement.toolName === 'ArrowAnnotate') {
      if (!measurement.data.handles.start && measurement.points.length > 0) {
        measurement.data.handles.start = { x: measurement.points[0][0], y: measurement.points[0][1] };
      }
      if (!measurement.data.handles.end && measurement.points.length > 1) {
        measurement.data.handles.end = { x: measurement.points[1][0], y: measurement.points[1][1] };
      }
    }

    // Set displaySetInstanceUID if we found it, otherwise try the fallback method
    let finalDisplaySetInstanceUID = displaySetInstanceUID;
    if (!finalDisplaySetInstanceUID) {
      finalDisplaySetInstanceUID = findDisplaySetInstanceUID(sopInstanceUID);
    }

    if (finalDisplaySetInstanceUID) {
      measurement.displaySetInstanceUID = finalDisplaySetInstanceUID;
      console.log(`🔍 DEBUG: Set measurement displaySetInstanceUID to: ${finalDisplaySetInstanceUID}`);
    } else {
      console.warn(`🔍 DEBUG: Could not find displaySetInstanceUID for measurement ${measurement.uid}`);
    }

    // The FrameOfReferenceUID was already resolved and set in the measurement object above,
    // so we can skip the redundant resolution here and use the value we already have
    console.log(`DEBUG: Using FrameOfReferenceUID: ${measurement.FrameOfReferenceUID || 'empty'} for measurement ${measurement.uid}`);

    /*
     * MeasurementService.addRawMeasurement expects the third argument (`data`)
     * to contain an `annotation` object with a `data` field, and the fourth argument
     * (`toMeasurementSchema`) should transform the data into a measurement object.
     * We store the pre-built measurement object in the data structure so that
     * identityMapping can extract it.
     */
    const rawDataForService = {
      // Pass the measurement UID at the top level for MeasurementService
      id: measurement.uid,
      // Store the pre-built measurement for identityMapping to extract
      measurement: measurement,
      annotation: {
        // Cornerstone3D requires an annotationUID to track the annotation
        annotationUID: measurement.uid,
        // Only the data field is required for the MeasurementService logic
        data: {
          ...measurement.data,
          // Ensure frameNumber is present for multi-frame instances
          frameNumber: measurement.frameNumber,
          // Add label for annotation display
          label: measurement.label,
          // Add the UID here instead of at the root level
          uid: measurement.uid,
        },
        // Some tools (e.g. ArrowAnnotate) take their label/text from here
        // so we include it if available.
        metadata: {
          toolName: measurement.toolName,
          // Only include FrameOfReferenceUID if we have one
          ...(measurement.FrameOfReferenceUID ? { FrameOfReferenceUID: measurement.FrameOfReferenceUID } : {}),
          referencedImageId: measurement.metadata.referencedImageId,
          // Add frameNumber to metadata as well
          frameNumber: measurement.frameNumber,
        },
      },
    };

    // Add debug logging to see what displayText is being passed
    console.log(`🔍 DEBUG: measurement.displayText before adding to service:`, measurement.displayText);
    console.log(`🔍 DEBUG: measurement object being stored:`, {
      uid: measurement.uid,
      displayText: measurement.displayText,
      label: measurement.label,
      toolName: measurement.toolName
    });

    console.log(`DEBUG: Creating annotation for ${measurement.toolName} measurement ${measurement.uid}:`);
    console.log('- handles:', rawDataForService.annotation.data.handles);
    console.log('- referencedImageId:', rawDataForService.annotation.metadata.referencedImageId);
    console.log('- frameNumber:', rawDataForService.annotation.data.frameNumber);
    console.log('- toolName:', measurement.toolName);
    console.log('- FrameOfReferenceUID:', rawDataForService.annotation.metadata.FrameOfReferenceUID);
    console.log('- annotation data being passed to Cornerstone3D:', rawDataForService.annotation.data);

    try {
      // Add measurement to the measurement service
      // The RAW_MEASUREMENT_ADDED event handler in the cornerstone extension
      // will automatically create the annotation and add it to Cornerstone3D

      // Add a one-time listener to see if RAW_MEASUREMENT_ADDED event fires
      const debugListener = (eventData) => {
        console.log('🔍 DEBUG: RAW_MEASUREMENT_ADDED event fired:', eventData);
        console.log('🔍 DEBUG: Event measurement uid:', eventData.measurement?.uid);
        console.log('🔍 DEBUG: Event source:', eventData.source);
        console.log('🔍 DEBUG: Event data:', eventData.data);
      };
      const unsubscribe = measurementService.subscribe(measurementService.EVENTS.RAW_MEASUREMENT_ADDED, debugListener);

      // Clean up listener after a delay
      setTimeout(() => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }, 1000);

      // Add the measurement to the measurement service
      console.log(`🔍 DEBUG: Adding measurement to service with displayText:`, measurement.displayText);
      console.log(`🔍 DEBUG: Full measurement object before service:`, measurement);

      measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);

      // Immediately check what the measurement service stored and try to fix displayText
      setTimeout(() => {
        const storedMeasurements = measurementService.getMeasurements();
        const ourMeasurement = storedMeasurements.find(m => m.uid === measurement.uid);
        console.log(`🔍 DEBUG: Measurement as stored in service:`, ourMeasurement);
        console.log(`🔍 DEBUG: Stored measurement displayText:`, ourMeasurement?.displayText);

        // If displayText was reset, try to restore it
        if (ourMeasurement && ourMeasurement.displayText &&
          ourMeasurement.displayText.primary &&
          ourMeasurement.displayText.primary.length === 0) {

          console.log(`🔍 DEBUG: DisplayText was reset, attempting to restore it`);

          // Try to update the measurement with the correct displayText
          const correctDisplayText = measurement.displayText;
          console.log(`🔍 DEBUG: Restoring displayText to:`, correctDisplayText);

          // Update the measurement object directly (this should be enough)
          ourMeasurement.displayText = correctDisplayText;
          console.log(`🔍 DEBUG: Updated measurement displayText directly`);

          // Verify the fix
          setTimeout(() => {
            const updatedMeasurements = measurementService.getMeasurements();
            const updatedMeasurement = updatedMeasurements.find(m => m.uid === measurement.uid);
            console.log(`🔍 DEBUG: After restoration attempt, displayText is:`, updatedMeasurement?.displayText);
          }, 10);
        }
      }, 50);

      // The RAW_MEASUREMENT_ADDED event should trigger the cornerstone extension 
      // to create the annotation automatically, so we don't need manual annotation creation

      // CRITICAL: Ensure annotation visibility is set after creation
      try {
        // Wait a moment for the annotation to be created
        setTimeout(() => {
          const cornerstoneTools = (window as any).cornerstoneTools;
          if (cornerstoneTools?.annotation?.visibility) {
            console.log(`🔍 DEBUG: Setting annotation visibility for ${measurement.uid}`);
            cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);

            // Also try to force render after setting visibility
            const { cornerstoneViewportService } = servicesManager.services;
            const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
            if (renderingEngine) {
              const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
              try {
                triggerAnnotationRenderForViewportIds(viewportIds);
                console.log(`🔍 DEBUG: Triggered render after setting visibility for ${measurement.uid}`);
              } catch (renderErr) {
                console.warn('Failed to trigger render after setting visibility:', renderErr);
              }
            }
          }
          
          // Additional: Try to force annotation to be visible even if frame of reference doesn't match
          setTimeout(() => {
            try {
              const annotationManager = cornerstoneTools?.annotation?.state?.getAnnotationManager();
              if (annotationManager) {
                const annotation = annotationManager.getAnnotation(measurement.uid);
                if (annotation) {
                  console.log(`🔍 DEBUG: Found annotation ${measurement.uid}, ensuring it's visible`);
                  
                  // Force the annotation to be visible regardless of frame of reference
                  annotation.isVisible = true;
                  annotation.invalidated = false;
                  
                  // If the annotation has a frame of reference but viewport doesn't, 
                  // try to remove the frame of reference requirement
                  if (annotation.metadata.FrameOfReferenceUID) {
                    const { cornerstoneViewportService } = servicesManager.services;
                    const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
                    if (renderingEngine) {
                      const viewports = renderingEngine.getViewports();
                      let hasMatchingFrameOfRef = false;
                      
                      viewports.forEach(viewport => {
                        const viewportFrameOfRef = viewport.getFrameOfReferenceUID();
                        if (viewportFrameOfRef === annotation.metadata.FrameOfReferenceUID) {
                          hasMatchingFrameOfRef = true;
                        }
                      });
                      
                      // If no viewport has a matching frame of reference, remove the requirement
                      if (!hasMatchingFrameOfRef) {
                        console.log(`🔍 DEBUG: No viewport has matching frame of reference, removing requirement for ${measurement.uid}`);
                        annotation.metadata.FrameOfReferenceUID = undefined;
                        
                        // Force re-render of all viewports
                        viewports.forEach(viewport => {
                          if (viewport.render && typeof viewport.render === 'function') {
                            viewport.render();
                          }
                        });
                      }
                    }
                  }
                }
              }
            } catch (forceVisibleErr) {
              console.warn('Failed to force annotation visibility:', forceVisibleErr);
            }
          }, 200);
          
          
          
          // Additional: Verify annotation is properly associated with viewport
          setTimeout(() => {
            try {
              const { cornerstoneViewportService } = servicesManager.services;
              const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
              if (renderingEngine) {
                const viewports = renderingEngine.getViewports();
                
                viewports.forEach(viewport => {
                  try {
                    const viewportElement = viewport.element;
                    if (viewportElement) {
                      const enabledElement = getEnabledElement(viewportElement);
                      if (enabledElement) {
                        // Check if the annotation is properly associated with this viewport
                        const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
                        const annotation = annotationManager.getAnnotation(measurement.uid);
                        
                        if (annotation) {
                          console.log(`🔍 DEBUG: Checking annotation association with viewport ${viewport.id}`);
                          
                          // Check if the annotation is visible in this viewport
                          const isVisibleInViewport = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                          console.log(`🔍 DEBUG: Annotation ${measurement.uid} visible in viewport ${viewport.id}: ${isVisibleInViewport}`);
                          
                          // If not visible, try to force visibility
                          if (!isVisibleInViewport) {
                            console.log(`🔍 DEBUG: Forcing annotation visibility in viewport ${viewport.id}`);
                            cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);
                            
                            // Force the viewport to render
                            if (viewport.render && typeof viewport.render === 'function') {
                              viewport.render();
                              console.log(`🔍 DEBUG: Forced viewport render after visibility fix for ${viewport.id}`);
                            }
                          }
                        }
                      }
                    }
                  } catch (viewportErr) {
                    console.warn(`🔍 DEBUG: Error checking annotation association with viewport ${viewport.id}:`, viewportErr);
                  }
                });
              }
            } catch (checkErr) {
              console.warn('Failed to check annotation association:', checkErr);
            }
          }, 1000);
          
          // Additional debug: check if annotation is actually visible
          setTimeout(() => {
            const annotationManager = cornerstoneTools?.annotation?.state?.getAnnotationManager();
            if (annotationManager) {
              const annotation = annotationManager.getAnnotation(measurement.uid);
              console.log(`🔍 DEBUG: Final annotation state for ${measurement.uid}:`, {
                exists: !!annotation,
                isVisible: annotation?.isVisible,
                invalidated: annotation?.invalidated,
                highlighted: annotation?.highlighted,
                data: annotation?.data,
                metadata: annotation?.metadata
              });
              
              // Check if the Length tool is properly configured and can render annotations
              const { toolGroupService } = servicesManager.services;
              const viewportIds = cornerstoneViewportService.getRenderingEngine().getViewports().map(viewport => viewport.id);
              
              // Check if the annotation is properly associated with the viewport
              console.log(`🔍 DEBUG: Checking annotation viewport association for ${measurement.uid}`);
              console.log(`🔍 DEBUG: Annotation metadata:`, annotation?.metadata);
              console.log(`🔍 DEBUG: Available viewport IDs:`, viewportIds);
              
              viewportIds.forEach(viewportId => {
                try {
                  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                  if (toolGroup) {
                    const lengthToolConfig = toolGroup.getToolConfiguration('Length');
                    console.log(`🔍 DEBUG: Length tool config for viewport ${viewportId}:`, lengthToolConfig);
                    
                    // Check if Length tool is active or passive
                    const lengthToolMode = toolGroup.getToolOptions('Length')?.mode;
                    console.log(`🔍 DEBUG: Length tool mode for viewport ${viewportId}:`, lengthToolMode);
                    
                                         // Ensure Length tool is at least passive so it can render annotations
                     if (lengthToolMode !== 'Active' && lengthToolMode !== 'Passive') {
                       console.log(`🔍 DEBUG: Setting Length tool to passive mode for viewport ${viewportId}`);
                       toolGroup.setToolPassive('Length');
                     }
                     
                     // Force the Length tool to render annotations
                     console.log(`🔍 DEBUG: Forcing Length tool to render annotations for viewport ${viewportId}`);
                     try {
                       // Try to trigger annotation rendering specifically for this tool
                       const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                       if (viewport && viewport.render) {
                         viewport.render();
                         console.log(`🔍 DEBUG: Forced viewport render for ${viewportId}`);
                       }
                     } catch (renderErr) {
                       console.warn(`🔍 DEBUG: Failed to force render for viewport ${viewportId}:`, renderErr);
                     }
                     
                     // Check if the annotation is visible in the tool's perspective
                     try {
                       const isVisibleInTool = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                       console.log(`🔍 DEBUG: Annotation visibility in tool for viewport ${viewportId}:`, isVisibleInTool);
                       
                       // Check if the annotation is in the tool's annotation list for this specific viewport
                       const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                       if (viewport && viewport.element) {
                         try {
                           const toolAnnotations = cornerstoneTools.annotation.state.getAnnotations(measurement.uid, viewport.element);
                           console.log(`🔍 DEBUG: Tool annotations for ${measurement.uid} in viewport ${viewportId}:`, toolAnnotations);
                           
                           // Check if the annotation is in the tool's annotation list for the specific frame of reference
                           let viewportFrameOfRef = viewport.getFrameOfReferenceUID();
                           console.log(`🔍 DEBUG: Viewport frame of reference: ${viewportFrameOfRef}`);
                           console.log(`🔍 DEBUG: Annotation frame of reference: ${measurement.FrameOfReferenceUID}`);
                           
                           // If viewport has no frame of reference but annotation does, try to set it
                           if (!viewportFrameOfRef && measurement.FrameOfReferenceUID) {
                             console.log(`🔍 DEBUG: Viewport has no frame of reference, attempting to set it to match annotation`);
                             try {
                               // Try to set the viewport's frame of reference UID
                               if (viewport.setFrameOfReferenceUID && typeof viewport.setFrameOfReferenceUID === 'function') {
                                 viewport.setFrameOfReferenceUID(measurement.FrameOfReferenceUID);
                                 viewportFrameOfRef = viewport.getFrameOfReferenceUID();
                                 console.log(`🔍 DEBUG: Successfully set viewport frame of reference to: ${viewportFrameOfRef}`);
                               } else {
                                 console.warn(`🔍 DEBUG: Viewport does not have setFrameOfReferenceUID method`);
                               }
                             } catch (setFrameErr) {
                               console.warn(`🔍 DEBUG: Failed to set viewport frame of reference:`, setFrameErr);
                             }
                           }
                           
                           if (viewportFrameOfRef === measurement.FrameOfReferenceUID) {
                             console.log(`🔍 DEBUG: Frame of reference matches, annotation should be visible`);
                           } else {
                             console.warn(`🔍 DEBUG: Frame of reference mismatch, annotation may not be visible`);
                             
                                                        // As a fallback, try to make the annotation work without frame of reference matching
                           if (annotation && !viewportFrameOfRef) {
                             console.log(`🔍 DEBUG: Attempting to make annotation visible without frame of reference matching`);
                             try {
                               // Remove frame of reference requirement for this annotation
                               annotation.metadata.FrameOfReferenceUID = undefined;
                               annotation.invalidated = true;
                               
                               // Force the annotation to be visible
                               annotation.isVisible = true;
                               
                               // Try to directly add the annotation to the tool's annotation list for this viewport
                               try {
                                 const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                                 if (toolGroup) {
                                   // Get the tool's annotation state
                                   const toolAnnotationState = cornerstoneTools.annotation.state.getAnnotationManager();
                                   
                                   // Force the annotation to be associated with this viewport's frame of reference
                                   // Since the viewport has no frame of reference, we'll use a special approach
                                   const viewportElement = viewport.element;
                                   if (viewportElement) {
                                     // Try to add the annotation directly to the enabled element
                                     const enabledElement = getEnabledElement(viewportElement);
                                     if (enabledElement) {
                                       // Force the annotation to be visible in this viewport
                                       cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);
                                       
                                       // Try to trigger a tool-specific render
                                       const lengthTool = cornerstoneTools.getTool('Length');
                                       if (lengthTool && lengthTool.renderAnnotation) {
                                         lengthTool.renderAnnotation(enabledElement);
                                         console.log(`🔍 DEBUG: Triggered Length tool render for annotation`);
                                       }
                                     }
                                   }
                                 }
                               } catch (toolErr) {
                                 console.warn(`🔍 DEBUG: Failed to force tool annotation:`, toolErr);
                               }
                               
                               // Trigger a re-render
                               if (viewport.render && typeof viewport.render === 'function') {
                                 viewport.render();
                                 console.log(`🔍 DEBUG: Forced re-render after removing frame of reference requirement`);
                               }
                             } catch (fallbackErr) {
                               console.warn(`🔍 DEBUG: Failed to apply frame of reference fallback:`, fallbackErr);
                             }
                           }
                           }
                           
                           // Try to get all annotations for this viewport
                           const allViewportAnnotations = cornerstoneTools.annotation.state.getAnnotations(undefined, viewport.element);
                           console.log(`🔍 DEBUG: All annotations in viewport ${viewportId}:`, Object.keys(allViewportAnnotations || {}));
                           
                         } catch (elementErr) {
                           console.log(`🔍 DEBUG: Could not get annotations for element in viewport ${viewportId}:`, elementErr);
                         }
                       }
                     } catch (toolCheckErr) {
                       console.warn(`🔍 DEBUG: Could not check tool annotation state for viewport ${viewportId}:`, toolCheckErr);
                     }
                  }
                } catch (toolErr) {
                  console.warn(`🔍 DEBUG: Could not check Length tool for viewport ${viewportId}:`, toolErr);
                }
              });
            }
          }, 50);
        }, 100);
      } catch (visibilityErr) {
        console.warn('Failed to set annotation visibility:', visibilityErr);
      }

      console.log(`✅ Successfully added measurement ${measurement.uid} to measurement service`);
    } catch (error) {
      console.error(`❌ Failed to add measurement ${measurement.uid}:`, error);
    }
  });

  // Trigger viewport refresh to display the imported measurements - following old approach
  const { cornerstoneViewportService, toolGroupService } = servicesManager.services;
  if (cornerstoneViewportService && toolGroupService) {
    try {
      // Get the rendering engine
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      if (renderingEngine) {
        // Get all viewport IDs from the rendering engine
        const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);

        // First, try to fix viewport frame of reference UIDs
        viewportIds.forEach(viewportId => {
          try {
            const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
            if (viewport) {
              const currentFrameOfRef = viewport.getFrameOfReferenceUID();
              console.log(`🔍 DEBUG: Viewport ${viewportId} current frame of reference: ${currentFrameOfRef}`);
              
              // If viewport has no frame of reference, try to get it from the display set
              if (!currentFrameOfRef) {
                console.log(`🔍 DEBUG: Viewport ${viewportId} has no frame of reference, attempting to fix`);
                
                // Get the display sets for this viewport
                const displaySets = cornerstoneViewportService.getViewportDisplaySets(viewportId);
                if (displaySets && displaySets.length > 0) {
                  const displaySet = displaySets[0]; // Use the first display set
                  
                  // Try to get frame of reference from display set
                  let frameOfRef = displaySet.frameOfReferenceUID || displaySet.FrameOfReferenceUID;
                  
                  // If not found, try to get from the first image
                  if (!frameOfRef && displaySet.images && displaySet.images.length > 0) {
                    frameOfRef = displaySet.images[0].FrameOfReferenceUID;
                  }
                  
                  // If not found, try to get from instances
                  if (!frameOfRef && displaySet.instances && displaySet.instances.length > 0) {
                    frameOfRef = displaySet.instances[0].FrameOfReferenceUID;
                  }
                  
                  if (frameOfRef) {
                    console.log(`🔍 DEBUG: Found frame of reference ${frameOfRef} for viewport ${viewportId}, attempting to set it`);
                    
                    // Try to set the viewport's frame of reference UID
                    if (viewport.setFrameOfReferenceUID && typeof viewport.setFrameOfReferenceUID === 'function') {
                      viewport.setFrameOfReferenceUID(frameOfRef);
                      const newFrameOfRef = viewport.getFrameOfReferenceUID();
                      console.log(`🔍 DEBUG: Successfully set viewport ${viewportId} frame of reference to: ${newFrameOfRef}`);
                    } else {
                      console.warn(`🔍 DEBUG: Viewport ${viewportId} does not have setFrameOfReferenceUID method`);
                    }
                  } else {
                    console.warn(`🔍 DEBUG: Could not find frame of reference for viewport ${viewportId}`);
                  }
                }
              }
            }
          } catch (viewportErr) {
            console.warn(`🔍 DEBUG: Error fixing frame of reference for viewport ${viewportId}:`, viewportErr);
          }
        });

        // Ensure tools are set to passive mode (like old refreshToolStateManager)
        const toolTypes = ['Length', 'RectangleROI', 'EllipticalROI', 'ArrowAnnotate', 'Bidirectional'];
        viewportIds.forEach(viewportId => {
          try {
            const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
            if (toolGroup) {
              toolTypes.forEach(toolType => {
                try {
                  const toolConfig = toolGroup.getToolConfiguration(toolType);
                  if (toolConfig) {
                    // Ensure the tool is active or passive so measurements render
                    const currentMode = toolGroup.getToolOptions(toolType)?.mode;
                    if (currentMode !== 'Active' && currentMode !== 'Passive') {
                      toolGroup.setToolPassive(toolType);
                      console.log(`🔍 DEBUG: Set ${toolType} to passive mode for viewport ${viewportId}`);
                    }
                  }
                } catch (toolErr) {
                  // Tool might not be available, skip
                }
              });
            }
          } catch (toolGroupErr) {
            console.warn(`Could not get tool group for viewport ${viewportId}:`, toolGroupErr);
          }
        });

        // Use the imported triggerAnnotationRenderForViewportIds function
        try {
          triggerAnnotationRenderForViewportIds(viewportIds);
        } catch (error) {
          console.error('Failed to trigger annotation rendering:', error);
        }

        // Force a render of all viewports (like old cornerstone.updateImage)
        try {
          renderingEngine.render();
        } catch (error) {
          console.error('Failed to force render:', error);
        }

        // Additional: try to refresh individual viewports
        viewportIds.forEach(viewportId => {
          try {
            const viewport = renderingEngine.getViewport(viewportId);
            if (viewport && typeof viewport.render === 'function') {
              viewport.render();
              console.log(`✅ DEBUG: Rendered individual viewport ${viewportId}`);
            }
          } catch (vpErr) {
            console.warn(`Failed to render viewport ${viewportId}:`, vpErr);
          }
        });
      }
    } catch (error) {
      console.error('Error during viewport refresh:', error);
    }
  }

  // Try to force annotation state synchronization
  try {
    // Get all measurements and log the total count
    const allMeasurements = measurementService.getMeasurements();
    console.log(`DEBUG: Total measurements in service: ${allMeasurements.length}`);

    // Debug measurement service data
    allMeasurements.forEach((serviceMeasurement, index) => {
      console.log(`🔍 DEBUG: Service measurement ${index}:`, {
        uid: serviceMeasurement.uid,
        toolName: serviceMeasurement.toolName,
        displayText: serviceMeasurement.displayText,
        baseDisplayText: serviceMeasurement.baseDisplayText,
        label: serviceMeasurement.label,
        data: serviceMeasurement.data,
        referenceSeriesUID: serviceMeasurement.referenceSeriesUID
      });

      // Debug display sets for this measurement
      if (serviceMeasurement.referenceSeriesUID) {
        console.log(`🔍 DEBUG: Service measurement ${index} referenceSeriesUID:`, serviceMeasurement.referenceSeriesUID);

        const { displaySetService } = servicesManager.services;
        const displaySets = displaySetService.getDisplaySetsForSeries(serviceMeasurement.referenceSeriesUID);
        console.log(`🔍 DEBUG: Display sets for series ${serviceMeasurement.referenceSeriesUID}:`, displaySets);

        if (displaySets && displaySets.length > 0) {
          console.log(`🔍 DEBUG: First display set has instances:`, !!displaySets[0]?.instances);
          console.log(`🔍 DEBUG: First display set instances count:`, displaySets[0]?.instances?.length);
          console.log(`🔍 DEBUG: First display set:`, displaySets[0]);
        } else {
          console.log(`🔍 DEBUG: No display sets found for series ${serviceMeasurement.referenceSeriesUID}`);
        }
      }
    });

    // Add debug logging to check annotation state
    try {
      // Check if annotations exist in Cornerstone3D state
      const cornerstoneTools = (window as any).cornerstoneTools;
      if (cornerstoneTools && cornerstoneTools.annotation && cornerstoneTools.annotation.state) {
        const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
        const allAnnotations = annotationManager.getAllAnnotations();
        console.log(`🔍 DEBUG: Total annotations in Cornerstone3D: ${Object.keys(allAnnotations).length}`);
        console.log(`🔍 DEBUG: Annotation UIDs:`, Object.keys(allAnnotations));

        // Check for our specific measurements and get detailed annotation data
        allMeasurements.forEach(measurement => {
          console.log(`🔍 DEBUG: Looking for annotation with UID: ${measurement.uid}`);
          const annotation = annotationManager.getAnnotation(measurement.uid);
          if (annotation) {
            console.log(`🔍 DEBUG: Found annotation for ${measurement.uid}:`, annotation);
            console.log(`🔍 DEBUG: Annotation metadata:`, annotation.metadata);
            console.log(`🔍 DEBUG: Annotation data:`, annotation.data);
            console.log(`🔍 DEBUG: Annotation isVisible:`, annotation.isVisible);
            console.log(`🔍 DEBUG: Annotation highlighted:`, annotation.highlighted);
            console.log(`🔍 DEBUG: Annotation invalidated:`, annotation.invalidated);

            // Check visibility state using the visibility manager
            try {
              const isVisibleFromManager = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
              console.log(`🔍 DEBUG: Visibility from visibility manager: ${isVisibleFromManager}`);

              // If not visible, try to set it visible
              if (!isVisibleFromManager) {
                console.log(`🔍 DEBUG: Annotation ${measurement.uid} is not visible, attempting to make it visible`);
                cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);
                const newVisibilityState = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                console.log(`🔍 DEBUG: After setting visibility: ${newVisibilityState}`);
              }
            } catch (visErr) {
              console.warn('Failed to check/set visibility:', visErr);
            }

            // Check if annotation data has required fields for Length tool
            if (annotation.metadata.toolName === 'Length') {
              console.log(`🔍 DEBUG: Length annotation handles:`, annotation.data.handles);
              console.log(`🔍 DEBUG: Length annotation points:`, annotation.data.handles?.points);
              console.log(`🔍 DEBUG: Length annotation textBox:`, annotation.data.handles?.textBox);

              // Check if the points are valid world coordinates
              if (annotation.data.handles?.points) {
                annotation.data.handles.points.forEach((point, index) => {
                  console.log(`🔍 DEBUG: Point ${index}:`, point, `(type: ${typeof point}, isArray: ${Array.isArray(point)})`);
                });
              }
            }
          } else {
            console.log(`🔍 DEBUG: NO annotation found for measurement ${measurement.uid}`);
          }
        });

        // Also check all annotations by their actual keys
        Object.keys(allAnnotations).forEach(annotationKey => {
          const annotation = allAnnotations[annotationKey];
          console.log(`🔍 DEBUG: Annotation ${annotationKey} details:`, {
            uid: annotation.annotationUID || annotation.uid,
            toolName: annotation.metadata?.toolName,
            referencedImageId: annotation.metadata?.referencedImageId,
            isVisible: annotation.isVisible,
            highlighted: annotation.highlighted,
            invalidated: annotation.invalidated,
            data: annotation.data
          });
        });
      }
    } catch (annotationErr) {
      console.log('🔍 DEBUG: Could not access Cornerstone3D annotation state:', annotationErr);
    }

    // Check tool state
    try {
      const { toolGroupService, cornerstoneViewportService } = servicesManager.services;
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      if (renderingEngine) {
        const viewports = renderingEngine.getViewports();
        viewports.forEach(viewport => {
          console.log(`🔍 DEBUG: Checking viewport ${viewport.id}`);

          // Check current image in viewport
          try {
            const currentImageId = viewport.getCurrentImageId ? viewport.getCurrentImageId() : null;
            console.log(`🔍 DEBUG: Current imageId in viewport ${viewport.id}:`, currentImageId);

            // Check if this matches any of our measurement imageIds
            allMeasurements.forEach(measurement => {
              const measurementImageId = measurement.metadata?.referencedImageId;
              const matches = currentImageId === measurementImageId;
              console.log(`🔍 DEBUG: Measurement ${measurement.uid} imageId match: ${matches}`);
              console.log(`🔍 DEBUG: - Expected: ${measurementImageId}`);
              console.log(`🔍 DEBUG: - Current: ${currentImageId}`);

              // Check if annotation is associated with this viewport
              if (matches) {
                try {
                  // Simplified viewport matching - use image-based matching instead of complex FrameOfReferenceUID checks
                  const measurementImageId = measurement.metadata?.referencedImageId;
                  const currentImageId = viewport.getCurrentImageId?.();
                  
                  // Simple image-based matching - if the measurement is for the current image, it should be viewable
                  if (currentImageId && measurementImageId && currentImageId === measurementImageId) {
                    console.log(`🔍 DEBUG: ImageId matches - measurement should be viewable in this viewport`);
                    
                    // For measurements without FrameOfReferenceUID, we can still display them
                    // by ensuring the annotation is properly registered with the viewport
                    try {
                      const cornerstoneTools = (window as any).cornerstoneTools;
                      if (cornerstoneTools?.annotation?.state) {
                        const annotation = cornerstoneTools.annotation.state.getAnnotation(measurement.uid);
                        if (annotation) {
                          
                          // Ensure the annotation is visible and valid
                          annotation.isVisible = true;
                          annotation.invalidated = false;
                          
                          // If no FrameOfReferenceUID is set, try to get it from the current image
                          if (!annotation.metadata.FrameOfReferenceUID && currentImageId) {
                            const metaData = (window as any).cornerstone?.metaData;
                            if (metaData) {
                              const instanceMeta = metaData.get('instance', currentImageId);
                              const imageFrameOfRef = instanceMeta?.FrameOfReferenceUID || instanceMeta?.frameOfReferenceUID;
                              if (imageFrameOfRef) {
                                annotation.metadata.FrameOfReferenceUID = imageFrameOfRef;
                                console.log(`🔍 DEBUG: Set annotation FrameOfReferenceUID to ${imageFrameOfRef}`);
                              }
                            }
                          }
                        }
                      }
                    } catch (annotationErr) {
                      console.warn('Failed to update annotation state:', annotationErr);
                    }
                  } else {
                    console.log(`🔍 DEBUG: ImageId mismatch - measurement not viewable in this viewport`);
                  }
                } catch (renderCheckErr) {
                  console.warn('Failed to check viewport compatibility:', renderCheckErr);
                }
              }
            });
          } catch (imageErr) {
            console.log(`🔍 DEBUG: Could not get current imageId for viewport ${viewport.id}:`, imageErr);
          }

          try {
            const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
            if (toolGroup) {
              const lengthToolState = toolGroup.getToolConfiguration('Length');
              console.log(`🔍 DEBUG: Length tool state for viewport ${viewport.id}:`, lengthToolState);
            }
          } catch (toolErr) {
            console.log(`🔍 DEBUG: Could not get tool state for viewport ${viewport.id}:`, toolErr);
          }
        });
      }
    } catch (toolStateErr) {
      console.log('🔍 DEBUG: Could not check tool state:', toolStateErr);
    }

  } catch (err) {
    console.warn('Failed to get measurements count:', err);
  }

  return imageMeasurements.length;
}

export default importMeasurementCollection;