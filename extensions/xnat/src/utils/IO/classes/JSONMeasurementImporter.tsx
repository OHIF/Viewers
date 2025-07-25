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

// Track recently imported measurements to prevent immediate removal
const recentlyImportedMeasurements = new Set();

// Intercept measurement removal events to prevent premature removal
function setupRemovalProtection(measurementService) {
  // Store measurements that are being protected
  const protectedMeasurements = new Map();
  
  // Subscribe to measurement removal events
  const unsubscribe = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_REMOVED,
    (eventData) => {
      const { measurement: measurementId } = eventData;
      
      if (recentlyImportedMeasurements.has(measurementId)) {
        console.log(`🔍 DEBUG: Intercepted removal of recently imported measurement ${measurementId}`);
        console.log(`🔍 DEBUG: Total measurements protected from removal: ${recentlyImportedMeasurements.size}`);
        
        // Get the stored measurement data for re-adding
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement) {
          console.log(`🔍 DEBUG: Re-adding measurement ${measurementId} to prevent premature removal`);
          
          // Re-add the measurement to the service
          try {
            // Get the source for re-adding
            const source = _getMeasurementSource(measurementService);
            
            // Re-add the measurement using the stored data
            measurementService.addRawMeasurement(
              source, 
              storedMeasurement.toolName, 
              storedMeasurement.rawData, 
              identityMapping
            );
            console.log(`🔍 DEBUG: Successfully re-added measurement ${measurementId}`);
          } catch (error) {
            console.error(`❌ Failed to re-add measurement ${measurementId}:`, error);
          }
        } else {
          console.warn(`⚠️ No stored data found for measurement ${measurementId}`);
        }
      }
    }
  );
  
  // Track display text restoration attempts to prevent infinite loops
  const displayTextRestorationAttempts = new Map();
  
  // Subscribe to measurement update events to preserve display text
  const unsubscribeUpdate = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_UPDATED,
    (eventData) => {
      const { measurement } = eventData;
      const measurementId = measurement.uid;
      
      if (recentlyImportedMeasurements.has(measurementId)) {
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement && storedMeasurement.displayText) {
          // Check if we've already tried to restore this measurement too many times
          const attempts = displayTextRestorationAttempts.get(measurementId) || 0;
          if (attempts >= 3) {
            console.log(`🔍 DEBUG: Max display text restoration attempts reached for ${measurementId}, skipping`);
            return;
          }
          
          // Check if display text was reset or changed
          const currentDisplayText = measurement.displayText;
          const storedDisplayText = storedMeasurement.displayText;
          
          // If display text was reset or is empty, restore it
          // For ArrowAnnotate, we want to preserve the label as the primary text
          const needsRestoration = !currentDisplayText || 
              !currentDisplayText.primary || 
              currentDisplayText.primary.length === 0 ||
              (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');
          
          // For ArrowAnnotate, if the primary text is the label, that's actually correct
          const isArrowAnnotateWithLabel = measurement.toolName === 'ArrowAnnotate' && 
              currentDisplayText?.primary?.length === 1 && 
              currentDisplayText.primary[0] === measurement.label;
          
          if (needsRestoration && !isArrowAnnotateWithLabel) {
            
            displayTextRestorationAttempts.set(measurementId, attempts + 1);
            console.log(`🔍 DEBUG: Restoring display text for measurement ${measurementId} (attempt ${attempts + 1}/3)`);
            console.log(`🔍 DEBUG: Current display text:`, currentDisplayText);
            console.log(`🔍 DEBUG: Stored display text:`, storedDisplayText);
            
            // Only directly modify the measurement object to avoid triggering update events
            if (measurement.displayText) {
              measurement.displayText.primary = [...storedDisplayText.primary];
              measurement.displayText.secondary = [...storedDisplayText.secondary];
              console.log(`🔍 DEBUG: Directly modified measurement display text for ${measurementId}`);
            }
            
            console.log(`🔍 DEBUG: Display text restored for measurement ${measurementId}`);
          }
        }
      }
    }
  );
  
  // Also subscribe to RAW_MEASUREMENT_ADDED events to catch when measurements are re-added
  const unsubscribeRawAdded = measurementService.subscribe(
    measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
    (eventData) => {
      const { measurement } = eventData;
      const measurementId = measurement.uid;
      
      if (recentlyImportedMeasurements.has(measurementId)) {
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement && storedMeasurement.displayText) {
          // Check if we've already tried to restore this measurement too many times
          const attempts = displayTextRestorationAttempts.get(measurementId) || 0;
          if (attempts >= 3) {
            console.log(`🔍 DEBUG: Max display text restoration attempts reached for ${measurementId}, skipping`);
            return;
          }
          
          // Check if display text needs restoration
          const currentDisplayText = measurement.displayText;
          const storedDisplayText = storedMeasurement.displayText;
          
          // For ArrowAnnotate, we want to preserve the label as the primary text
          const needsRestoration = !currentDisplayText || 
              !currentDisplayText.primary || 
              currentDisplayText.primary.length === 0 ||
              (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');
          
          // For ArrowAnnotate, if the primary text is the label, that's actually correct
          const isArrowAnnotateWithLabel = measurement.toolName === 'ArrowAnnotate' && 
              currentDisplayText?.primary?.length === 1 && 
              currentDisplayText.primary[0] === measurement.label;
          
          if (needsRestoration && !isArrowAnnotateWithLabel) {
            
            displayTextRestorationAttempts.set(measurementId, attempts + 1);
            console.log(`🔍 DEBUG: Restoring display text after RAW_MEASUREMENT_ADDED for ${measurementId} (attempt ${attempts + 1}/3)`);
            
            // Only directly modify the measurement object to avoid triggering update events
            if (measurement.displayText) {
              measurement.displayText.primary = [...storedDisplayText.primary];
              measurement.displayText.secondary = [...storedDisplayText.secondary];
              console.log(`🔍 DEBUG: Directly modified measurement display text for ${measurementId}`);
            }
            
            console.log(`🔍 DEBUG: Display text restored after RAW_MEASUREMENT_ADDED for ${measurementId}`);
          }
        }
      }
    }
  );
  
  // Create a combined unsubscribe function
  const combinedUnsubscribe = () => {
    try {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (unsubscribeUpdate && typeof unsubscribeUpdate === 'function') {
        unsubscribeUpdate();
      }
      if (unsubscribeRawAdded && typeof unsubscribeRawAdded === 'function') {
        unsubscribeRawAdded();
      }
      console.log(`🔍 DEBUG: Successfully unsubscribed from all measurement events`);
    } catch (error) {
      console.error(`🔍 DEBUG: Error during unsubscribe:`, error);
    }
  };
  
  // Return both unsubscribe functions and the protectedMeasurements map
  return { 
    unsubscribe: combinedUnsubscribe, 
    protectedMeasurements 
  };
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

// Minimal Catmull-Rom spline interpolation helper
function catmullRomSpline(points, numSegments = 20) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1] || points[i];
    const p3 = points[i + 2] || p2;
    for (let t = 0; t < numSegments; t++) {
      const s = t / numSegments;
      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * s +
        (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * s * s +
        (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * s * s * s
      );
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * s +
        (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * s * s +
        (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * s * s * s
      );
      result.push({ x, y });
    }
  }
  return result;
}

export async function importMeasurementCollection({
  collectionJSON,
  servicesManager,
}) {
  if (!collectionJSON || !servicesManager) {
    throw new Error('importMeasurementCollection: missing parameters');
  }

  const { measurementService, displaySetService, trackedMeasurementsService } = servicesManager.services;
  
  // Setup removal protection for recently imported measurements
  let protection;
  let unsubscribeProtection;
  let protectedMeasurements;
  
  try {
    protection = setupRemovalProtection(measurementService);
    if (protection && typeof protection === 'object') {
      unsubscribeProtection = protection.unsubscribe;
      protectedMeasurements = protection.protectedMeasurements;
    }
    
    // Ensure we have a valid unsubscribe function
    if (!unsubscribeProtection || typeof unsubscribeProtection !== 'function') {
      console.warn('🔍 DEBUG: Invalid unsubscribe function returned from setupRemovalProtection');
      // Create a dummy unsubscribe function to prevent errors
      unsubscribeProtection = () => {
        console.log('🔍 DEBUG: Dummy unsubscribe function called');
      };
    }
  } catch (error) {
    console.error('🔍 DEBUG: Error setting up removal protection:', error);
    // Create fallback objects to prevent errors
    unsubscribeProtection = () => {
      console.log('🔍 DEBUG: Fallback unsubscribe function called');
    };
    protectedMeasurements = new Map();
  }
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

  // CRITICAL: Add the series to tracking to ensure measurements appear in the panel
  if (trackedMeasurementsService && seriesUID) {
    console.log(`🔍 DEBUG: Adding series ${seriesUID} to measurement tracking`);
    trackedMeasurementsService.addTrackedSeries(seriesUID);
    
    // The TrackedMeasurementsService will automatically broadcast events
    // that will be picked up by the measurement tracking context
    console.log(`🔍 DEBUG: Series ${seriesUID} added to tracking service`);
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
      let toolName = im.type || im.toolType || im.toolName || 'Length';
      
      // Map OHIFv2 tool names to Cornerstone3D tool names
      if (toolName === 'EllipticalRoi' || toolName === 'EllipticalROI') {
        toolName = 'EllipticalROI';
      }
      
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
        // Note: isTracked is handled by the tracking service, not as a measurement property
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
      // Check if handles has a points array (like PlanarFreehandROI)
      if (handles.points && Array.isArray(handles.points)) {
        console.log(`DEBUG: Found points array in handles with ${handles.points.length} points`);
        measurement.points = handles.points.map((p: any) => {
          if (Array.isArray(p)) {
            return [p[0], p[1], p[2] || zCoord];
          } else if (p && typeof p.x === 'number' && typeof p.y === 'number') {
            return [p.x, p.y, p.z || zCoord];
          } else {
            console.warn('Unexpected point format in handles.points:', p);
            return [0, 0, zCoord];
          }
        });
      } else {
        // Fallback to the old method for other tools
        const pointHandles = Object.values(handles).filter(
          (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
        );
        measurement.points = pointHandles.map((p: any) => [p.x, p.y, p.z || zCoord]);
      }
    }
    
    console.log(`DEBUG: After points extraction, measurement.points for ${im.uuid}:`, measurement.points);

    // Extract displayText from the measurements array (skip for Length tools as we'll set it later)
    const stats = im.measurements;
    
    // Special handling for ArrowAnnotate - use the text from data or label
    if (measurement.toolName === 'ArrowAnnotate') {
      const arrowText = im.data?.text || im.name || measurement.label || '';
      measurement.displayText = {
        primary: [arrowText],
        secondary: [],
      };
      console.log(`🔍 DEBUG: ArrowAnnotate display text set to:`, measurement.displayText);
    } else if (measurement.toolName === 'PlanarFreehandROI' || measurement.toolName === 'SplineROI' || measurement.toolName === 'LivewireContour') {
      // Special handling for PlanarFreehandROI/SplineROI/LivewireContour - extract area and other stats
      let displayValues = [];
      
      if (stats && stats.length > 0) {
        stats.forEach(stat => {
          if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
            displayValues.push(`${stat.value.toFixed(2)} ${stat.unit || ''}`);
          }
        });
      }
      
      // If no stats, use the label
      if (displayValues.length === 0) {
        displayValues = [measurement.label || 'PlanarFreehandROI'];
      }
      
      measurement.displayText = {
        primary: displayValues,
        secondary: [],
      };
      console.log(`🔍 DEBUG: PlanarFreehandROI/SplineROI/LivewireContour display text set to:`, measurement.displayText);
    } else if (stats && stats.length > 0 && measurement.toolName !== 'Length' && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
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
    } else if (measurement.toolName !== 'Length' && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
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
    console.log(`🔍 DEBUG: Processing tool: ${measurement.toolName}`);
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
        // Handle both array and object point formats
        const avgX = measurement.points.reduce((sum, point) => {
          const x = Array.isArray(point) ? point[0] : (point && typeof point === 'object' ? point.x : 0);
          return sum + x;
        }, 0) / measurement.points.length;
        
        const avgY = measurement.points.reduce((sum, point) => {
          const y = Array.isArray(point) ? point[1] : (point && typeof point === 'object' ? point.y : 0);
          return sum + y;
        }, 0) / measurement.points.length;
        
        const avgZ = measurement.points.reduce((sum, point) => {
          const z = Array.isArray(point) ? (point[2] || 0) : (point && typeof point === 'object' ? (point.z || 0) : 0);
          return sum + z;
        }, 0) / measurement.points.length;
        
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
        // Convert points to the expected format - handle both array and object formats
        console.log('🔍 DEBUG: RectangleROI points before formatting:', measurement.points);
        
        const formattedPoints = measurement.points.map(point => {
          if (Array.isArray(point)) {
            return [point[0], point[1], point[2] || 0];
          } else if (point && typeof point === 'object' && 'x' in point) {
            return [point.x, point.y, point.z || 0];
          } else {
            console.warn('Unexpected point format for RectangleROI:', point);
            return [0, 0, 0];
          }
        });
        
        console.log('🔍 DEBUG: RectangleROI formatted points:', formattedPoints);
        
        // Also update the measurement.points to be consistent
        measurement.points = formattedPoints;
        
        measurement.data.handles = {
          points: formattedPoints,
          textBox: {
            hasMoved: false,
            worldPosition: textBoxWorldPosition,
            worldBoundingBox: worldBoundingBox,
          },
        };
        
        console.log('🔍 DEBUG: RectangleROI final handles structure:', measurement.data.handles);
      } else if (im.data?.handles) {
        console.log('🔍 DEBUG: RectangleROI using im.data.handles:', im.data.handles);
        
        // Extract points from handles for RectangleROI
        if (im.data.handles.points && Array.isArray(im.data.handles.points)) {
          // Points are already in the correct format
          const formattedPoints = im.data.handles.points.map((point: any) => {
            if (Array.isArray(point)) {
              return [point[0], point[1], point[2] || 0];
            } else if (point && typeof point === 'object' && 'x' in point) {
              return [point.x, point.y, point.z || 0];
            } else {
              console.warn('Unexpected point format in handles.points:', point);
              return [0, 0, 0];
            }
          });
          
          measurement.points = formattedPoints;
          measurement.data.handles = {
            ...im.data.handles,
            points: formattedPoints
          };
        } else if (im.data.handles.corner1 && im.data.handles.corner2) {
          // RectangleROI typically has corner1 and corner2
          measurement.points = [
            [im.data.handles.corner1.x, im.data.handles.corner1.y, im.data.handles.corner1.z || 0],
            [im.data.handles.corner2.x, im.data.handles.corner2.y, im.data.handles.corner2.z || 0],
          ];
          measurement.data.handles = im.data.handles;
        } else {
          // Try to extract from any available handle points
          const handleValues = Object.values(im.data.handles).filter(
            (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
          );
          measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
          measurement.data.handles = im.data.handles;
        }
        
        console.log('🔍 DEBUG: RectangleROI final points from handles:', measurement.points);
        console.log('🔍 DEBUG: RectangleROI final handles from im.data.handles:', measurement.data.handles);
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
      console.log(`🔍 DEBUG: Processing EllipticalROI/CircleROI with toolName: ${measurement.toolName}`);
      // Handle CircleROI and EllipticalROI tools
      console.log(`🔍 DEBUG: Processing ${measurement.toolName} with im.data:`, im.data);
      
      // Initialize handles structure and preserve cachedStats
      measurement.data.handles = {};
      
      // Preserve cachedStats if they exist
      if (im.data?.cachedStats) {
        measurement.data.cachedStats = im.data.cachedStats;
        console.log(`🔍 DEBUG: Preserved cachedStats for ${measurement.toolName}:`, im.data.cachedStats);
      }
      
      // Try to get handles from multiple sources
      let hasValidHandles = false;
      
      // Check for handles in the exported data structure
      const exportedHandles = im.data?.handles;
      console.log(`🔍 DEBUG: Exported handles for ${measurement.toolName}:`, exportedHandles);
      
      if (exportedHandles) {
        // If we have existing handles, try to use them
        if (exportedHandles.center && exportedHandles.end) {
          // CircleROI/EllipticalROI typically have center and end
          measurement.data.handles = {
            center: {
              x: exportedHandles.center.x,
              y: exportedHandles.center.y,
              z: exportedHandles.center.z || 0
            },
            end: {
              x: exportedHandles.end.x,
              y: exportedHandles.end.y,
              z: exportedHandles.end.z || 0
            }
          };
          
          measurement.points = [
            [exportedHandles.center.x, exportedHandles.center.y, exportedHandles.center.z || 0],
            [exportedHandles.end.x, exportedHandles.end.y, exportedHandles.end.z || 0],
          ];
          hasValidHandles = true;
        } else if (exportedHandles.points && Array.isArray(exportedHandles.points)) {
          // Handle the case where we have points array
          console.log(`🔍 DEBUG: Found points array in exported handles:`, exportedHandles.points);
          
          if (exportedHandles.points.length >= 4) {
            // For EllipticalROI, we typically have 4 points defining the ellipse
            measurement.data.handles = {
              points: exportedHandles.points.map((pt: any) => ({
                x: pt.x,
                y: pt.y,
                z: pt.z || 0
              }))
            };
            measurement.points = exportedHandles.points.map((pt: any) => [pt.x, pt.y, pt.z || 0]);
            hasValidHandles = true;
          } else if (exportedHandles.points.length >= 2) {
            // Use first two points as center and end
            const firstPoint = exportedHandles.points[0];
            const secondPoint = exportedHandles.points[1];
            
            measurement.data.handles = {
              center: {
                x: firstPoint.x,
                y: firstPoint.y,
                z: firstPoint.z || 0
              },
              end: {
                x: secondPoint.x,
                y: secondPoint.y,
                z: secondPoint.z || 0
              }
            };
            
            measurement.points = exportedHandles.points.map((pt: any) => [pt.x, pt.y, pt.z || 0]);
            hasValidHandles = true;
          }
        } else {
          // Try to extract from any available handle points
          const handleValues = Object.values(exportedHandles).filter(
            (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
          );
          
          if (handleValues.length >= 2) {
            // Use first two points as center and end
            const firstHandle = handleValues[0] as any;
            const secondHandle = handleValues[1] as any;
            
            measurement.data.handles = {
              center: {
                x: firstHandle.x,
                y: firstHandle.y,
                z: firstHandle.z || 0
              },
              end: {
                x: secondHandle.x,
                y: secondHandle.y,
                z: secondHandle.z || 0
              }
            };
            
            measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
            hasValidHandles = true;
          }
        }
      }
      
      // If we still don't have valid handles, try to create them from points
      if (!hasValidHandles && measurement.points && measurement.points.length >= 2) {
        console.log(`🔍 DEBUG: Creating ${measurement.toolName} handles from points:`, measurement.points);
        
        if (measurement.toolName === 'RectangleROI' && measurement.points.length >= 4) {
          // RectangleROI expects 4 corner points
          measurement.data.handles = {
            points: measurement.points.map((pt: any) => ({
              x: pt[0],
              y: pt[1],
              z: pt[2] || 0
            }))
          };
        } else {
          // Other tools expect center/end handles
          measurement.data.handles = {
            center: {
              x: measurement.points[0][0],
              y: measurement.points[0][1],
              z: measurement.points[0][2] || 0
            },
            end: {
              x: measurement.points[1][0],
              y: measurement.points[1][1],
              z: measurement.points[1][2] || 0
            }
          };
        }
        hasValidHandles = true;
      }
      
      // Last resort: create default handles if we have no data at all
      if (!hasValidHandles) {
        console.warn(`🔍 DEBUG: ${measurement.toolName} has no valid data, creating default handles`);
        
        if (measurement.toolName === 'RectangleROI') {
          // RectangleROI needs 4 corner points
          const defaultPoints = [
            { x: 100, y: 100, z: 0 },
            { x: 200, y: 100, z: 0 },
            { x: 100, y: 200, z: 0 },
            { x: 200, y: 200, z: 0 }
          ];
          
          measurement.data.handles = {
            points: defaultPoints
          };
          
          measurement.points = defaultPoints.map(pt => [pt.x, pt.y, pt.z]);
        } else {
          // Other tools expect center/end handles
          const defaultCenter = { x: 100, y: 100, z: 0 };
          const defaultEnd = { x: 150, y: 100, z: 0 };
          
          measurement.data.handles = {
            center: defaultCenter,
            end: defaultEnd
          };
          
          measurement.points = [
            [defaultCenter.x, defaultCenter.y, defaultCenter.z],
            [defaultEnd.x, defaultEnd.y, defaultEnd.z]
          ];
        }
        
        hasValidHandles = true;
      }
      
      // Ensure textBox is properly set for ROI tools
      if (!measurement.data.handles.textBox) {
        measurement.data.handles.textBox = {
          hasMoved: false,
          worldPosition: [0, 0, 0],
          worldBoundingBox: {
            topLeft: [0, 0, 0],
            topRight: [0, 0, 0],
            bottomLeft: [0, 0, 0],
            bottomRight: [0, 0, 0]
          }
        };
      }
      
      // Set textBox position to center if we have center handle
      if (measurement.data.handles.center && measurement.data.handles.textBox) {
        measurement.data.handles.textBox.worldPosition = [
          measurement.data.handles.center.x,
          measurement.data.handles.center.y,
          measurement.data.handles.center.z || 0
        ];
        
        // Calculate proper worldBoundingBox for the text box
        const textBoxSize = 50; // Approximate text box size in world coordinates
        const halfSize = textBoxSize / 2;
        const centerX = measurement.data.handles.center.x;
        const centerY = measurement.data.handles.center.y;
        const centerZ = measurement.data.handles.center.z || 0;
        
        measurement.data.handles.textBox.worldBoundingBox = {
          topLeft: [centerX - halfSize, centerY + halfSize, centerZ],
          topRight: [centerX + halfSize, centerY + halfSize, centerZ],
          bottomLeft: [centerX - halfSize, centerY - halfSize, centerZ],
          bottomRight: [centerX + halfSize, centerY - halfSize, centerZ],
        };
      }
      
      // For Bidirectional tool, set textBox position to center of the measurement
      if (measurement.toolName === 'Bidirectional' && measurement.data.handles.start && measurement.data.handles.end && measurement.data.handles.textBox) {
        const centerX = (measurement.data.handles.start.x + measurement.data.handles.end.x) / 2;
        const centerY = (measurement.data.handles.start.y + measurement.data.handles.end.y) / 2;
        const centerZ = (measurement.data.handles.start.z + measurement.data.handles.end.z) / 2;
        
        measurement.data.handles.textBox.worldPosition = [centerX, centerY, centerZ];
        
        // Calculate proper worldBoundingBox for the text box
        const textBoxSize = 50;
        const halfSize = textBoxSize / 2;
        
        measurement.data.handles.textBox.worldBoundingBox = {
          topLeft: [centerX - halfSize, centerY + halfSize, centerZ],
          topRight: [centerX + halfSize, centerY + halfSize, centerZ],
          bottomLeft: [centerX - halfSize, centerY - halfSize, centerZ],
          bottomRight: [centerX + halfSize, centerY - halfSize, centerZ],
        };
      }
      
      console.log(`🔍 DEBUG: Final ${measurement.toolName} handles:`, measurement.data.handles);
      console.log(`🔍 DEBUG: ${measurement.toolName} points:`, measurement.points);
      console.log(`🔍 DEBUG: ${measurement.toolName} hasValidHandles:`, hasValidHandles);

          // Set displayText for other ROI tools (excluding PlanarFreehandROI, SplineROI, and LivewireContour which have their own handling)
    if (im.measurements && im.measurements.length > 0 && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
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
      
      // Ensure ROI tools have all required properties
          // Skip this for PlanarFreehandROI, SplineROI, and LivewireContour as they have their own specific handling
    if ((!measurement.data.handles.center || !measurement.data.handles.end) && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
        console.warn(`🔍 DEBUG: ${measurement.toolName} missing required handles, creating fallback`);
        
        // Create fallback handles if missing
        if (!measurement.data.handles.center && measurement.points && measurement.points.length > 0) {
          measurement.data.handles.center = {
            x: measurement.points[0][0],
            y: measurement.points[0][1],
            z: measurement.points[0][2] || 0
          };
        }
        
        if (!measurement.data.handles.end && measurement.points && measurement.points.length > 1) {
          measurement.data.handles.end = {
            x: measurement.points[1][0],
            y: measurement.points[1][1],
            z: measurement.points[1][2] || 0
          };
        }
      }
      
      // Ensure ROI tools have the required activeHandleIndex property
      if (measurement.data.handles.activeHandleIndex === undefined) {
        measurement.data.handles.activeHandleIndex = null;
      }
      
      // Ensure ROI tools have all the properties that Cornerstone3D expects
      // These are additional properties that might be needed for rendering
          // Skip this for PlanarFreehandROI, SplineROI, and LivewireContour as they have their own specific handling
    if (!measurement.data.handles.points && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
        measurement.data.handles.points = [
          [measurement.data.handles.center.x, measurement.data.handles.center.y, measurement.data.handles.center.z || 0],
          [measurement.data.handles.end.x, measurement.data.handles.end.y, measurement.data.handles.end.z || 0]
        ];
      }
      
      // Ensure we have the required properties for ROI tool rendering
      if (!measurement.data.handles.invalidated) {
        measurement.data.handles.invalidated = false;
      }
      
      if (!measurement.data.handles.highlighted) {
        measurement.data.handles.highlighted = false;
      }
      
      // Add any missing properties that might be expected by the ROI tools
      if (!measurement.data.handles.locked) {
        measurement.data.handles.locked = false;
      }
      
      if (!measurement.data.handles.visible) {
        measurement.data.handles.visible = true;
      }
      
      // EllipticalROI specific handling - simplified to match successful tools
      if (measurement.toolName === 'EllipticalROI' || measurement.toolName === 'EllipticalRoi') {
        console.log(`🔍 DEBUG: Processing EllipticalROI with points:`, measurement.points);
        
        // Simplified approach: create handles directly from points like other successful tools
        if (measurement.points && measurement.points.length >= 4) {
          // Use the 4 points directly as handles
          const [point1, point2, point3, point4] = measurement.points;
          
          // Calculate center as average of all points
          const centerX = (point1[0] + point2[0] + point3[0] + point4[0]) / 4;
          const centerY = (point1[1] + point2[1] + point3[1] + point4[1]) / 4;
          const centerZ = (point1[2] + point2[2] + point3[2] + point4[2]) / 4;
          
          // Create simple handles structure like other successful tools
          measurement.data.handles = {
            center: { x: centerX, y: centerY, z: centerZ },
            end: { x: point1[0], y: point1[1], z: point1[2] },
            start: { x: point2[0], y: point2[1], z: point2[2] },
            perpendicularStart: { x: point3[0], y: point3[1], z: point3[2] },
            perpendicularEnd: { x: point4[0], y: point4[1], z: point4[2] },
            points: measurement.points,
            activeHandleIndex: null,
            invalidated: false,
            highlighted: false,
            locked: false,
            visible: true
          };
          
          console.log(`🔍 DEBUG: Created EllipticalROI handles from 4 points:`, measurement.data.handles);
        } else if (measurement.points && measurement.points.length >= 2) {
          // Fallback: create ellipse from 2 points (center and end)
          const [point1, point2] = measurement.points;
          
          measurement.data.handles = {
            center: { x: point1[0], y: point1[1], z: point1[2] },
            end: { x: point2[0], y: point2[1], z: point2[2] },
            start: { x: point1[0], y: point1[1], z: point1[2] },
            perpendicularStart: { x: point1[0], y: point1[1], z: point1[2] },
            perpendicularEnd: { x: point2[0], y: point2[1], z: point2[2] },
            points: [
              [point1[0], point1[1], point1[2]],
              [point2[0], point2[1], point2[2]],
              [point1[0], point1[1], point1[2]],
              [point2[0], point2[1], point2[2]]
            ],
            activeHandleIndex: null,
            invalidated: false,
            highlighted: false,
            locked: false,
            visible: true
          };
          
          console.log(`🔍 DEBUG: Created EllipticalROI handles from 2 points:`, measurement.data.handles);
        } else {
          // Last resort: create default handles
          console.warn(`🔍 DEBUG: EllipticalROI has insufficient points, creating default handles`);
          
          const defaultCenter = { x: 100, y: 100, z: 0 };
          const defaultEnd = { x: 150, y: 100, z: 0 };
          
          measurement.data.handles = {
            center: defaultCenter,
            end: defaultEnd,
            start: defaultCenter,
            perpendicularStart: defaultCenter,
            perpendicularEnd: defaultEnd,
            points: [
              [defaultCenter.x, defaultCenter.y, defaultCenter.z],
              [defaultEnd.x, defaultEnd.y, defaultEnd.z],
              [defaultCenter.x, defaultCenter.y, defaultCenter.z],
              [defaultEnd.x, defaultEnd.y, defaultEnd.z]
            ],
            activeHandleIndex: null,
            invalidated: false,
            highlighted: false,
            locked: false,
            visible: true
          };
        }
        
        console.log(`🔍 DEBUG: EllipticalROI final data structure:`, {
          center: measurement.data.handles.center,
          end: measurement.data.handles.end,
          start: measurement.data.handles.start,
          perpendicularStart: measurement.data.handles.perpendicularStart,
          perpendicularEnd: measurement.data.handles.perpendicularEnd,
          points: measurement.data.handles.points
        });
      }
    } else if (measurement.toolName === 'Bidirectional') {
      console.log(`🔍 DEBUG: Processing Bidirectional with points:`, measurement.points);
      
      if (measurement.points && measurement.points.length >= 4) {
        // Create proper handles structure for Bidirectional tool
        measurement.data.handles = {
          start: { x: measurement.points[0][0], y: measurement.points[0][1], z: measurement.points[0][2] || 0 },
          end: { x: measurement.points[1][0], y: measurement.points[1][1], z: measurement.points[1][2] || 0 },
          perpendicularStart: { x: measurement.points[2][0], y: measurement.points[2][1], z: measurement.points[2][2] || 0 },
          perpendicularEnd: { x: measurement.points[3][0], y: measurement.points[3][1], z: measurement.points[3][2] || 0 },
          points: measurement.points,
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true
        };
        
        console.log(`🔍 DEBUG: Created Bidirectional handles:`, measurement.data.handles);
      } else {
        console.warn(`🔍 DEBUG: Bidirectional has insufficient points (${measurement.points?.length || 0}), creating default handles`);
        
        const defaultCenter = { x: 100, y: 100, z: 0 };
        const defaultEnd = { x: 150, y: 100, z: 0 };
        
        measurement.data.handles = {
          start: defaultCenter,
          end: defaultEnd,
          perpendicularStart: defaultCenter,
          perpendicularEnd: defaultEnd,
          points: [
            [defaultCenter.x, defaultCenter.y, defaultCenter.z],
            [defaultEnd.x, defaultEnd.y, defaultEnd.z],
            [defaultCenter.x, defaultCenter.y, defaultCenter.z],
            [defaultEnd.x, defaultEnd.y, defaultEnd.z]
          ],
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true
        };
      }
    } else if (measurement.toolName === 'ArrowAnnotate') {
      console.log(`🔍 DEBUG: Processing ArrowAnnotate with points:`, measurement.points);
      
      if (measurement.points && measurement.points.length >= 2) {
        // Create proper handles structure for ArrowAnnotate tool
        measurement.data.handles = {
          start: { x: measurement.points[0][0], y: measurement.points[0][1], z: measurement.points[0][2] || 0 },
          end: { x: measurement.points[1][0], y: measurement.points[1][1], z: measurement.points[1][2] || 0 },
          points: measurement.points,
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true
        };
        
        console.log(`🔍 DEBUG: Created ArrowAnnotate handles:`, measurement.data.handles);
      } else {
        console.warn(`🔍 DEBUG: ArrowAnnotate has insufficient points (${measurement.points?.length || 0}), creating default handles`);
        
        const defaultStart = { x: 100, y: 100, z: 0 };
        const defaultEnd = { x: 150, y: 100, z: 0 };
        
        measurement.data.handles = {
          start: defaultStart,
          end: defaultEnd,
          points: [
            [defaultStart.x, defaultStart.y, defaultStart.z],
            [defaultEnd.x, defaultEnd.y, defaultEnd.z]
          ],
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true
        };
      }
    } else if (measurement.toolName === 'PlanarFreehandROI' || measurement.toolName === 'SplineROI' || measurement.toolName === 'LivewireContour') {
      console.log(`🔍 DEBUG: Processing PlanarFreehandROI/SplineROI/LivewireContour with points:`, measurement.points);
      console.log(`🔍 DEBUG: Tool name is: ${measurement.toolName}`);
      
      if (measurement.points && measurement.points.length > 0) {
        // Create proper handles structure for PlanarFreehandROI tool
        // PlanarFreehandROI uses a points array for the freehand contour
        
        // Preserve existing cachedStats if they exist
        const existingCachedStats = measurement.data?.cachedStats;
        
        measurement.data.handles = {
          points: measurement.points,
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true,
          textBox: {
            hasMoved: false,
            worldPosition: [0, 0, 0],
            worldBoundingBox: {
              topLeft: [0, 0, 0],
              topRight: [0, 0, 0],
              bottomLeft: [0, 0, 0],
              bottomRight: [0, 0, 0]
            }
          }
        };
        
        // Also create contour structure for compatibility with some Cornerstone tools
        measurement.data.contour = {
          polyline: measurement.points,
          closed: true
        };
        
        // For SplineROI, add the required spline object
        if (measurement.toolName === 'SplineROI') {
          console.log(`🔍 DEBUG: SplineROI processing - original measurement.points:`, measurement.points);
          console.log(`🔍 DEBUG: SplineROI processing - measurement.points length:`, measurement.points?.length);
          
          // Check if points are in world coordinates and need conversion
          let validPoints = [];
          
          if (measurement.points && measurement.points.length > 0) {
            // First, let's see what we're working with
            console.log(`🔍 DEBUG: First few points:`, measurement.points.slice(0, 3));
            
            // Use original world coordinates, ensure [x, y, z] format
            console.log(`🔍 DEBUG: Using original world coordinates with [x, y, z] formatting`);
            validPoints = measurement.points
              .filter(pt => Array.isArray(pt) && pt.length >= 2 &&
                           typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                           !isNaN(pt[0]) && !isNaN(pt[1]))
              .map(pt => [pt[0], pt[1], pt[2] ?? 0]);
          }
          
          console.log(`🔍 DEBUG: SplineROI valid 2D points after conversion:`, validPoints);
          console.log(`🔍 DEBUG: SplineROI valid points count:`, validPoints.length);
          
          if (validPoints.length === 0) {
            console.warn(`🔍 DEBUG: No valid points found for SplineROI, using fallback`);
            validPoints = [[100, 100], [150, 100], [150, 150], [100, 150]];
          }
          
          // Test each point to ensure they're valid numbers
          console.log(`🔍 DEBUG: Testing each valid point:`);
          
          // Enhanced mock spline instance for SplineROI
          let _controlPoints = validPoints;
          const splineInstance = {
            type: 'CATMULLROM',
            // Required properties that the SplineROI tool expects
            closed: true, // Our contour is closed
            resolution: 0.5, // Match the resolution in the spline object
            fixedResolution: false,
            invalidated: false,
            setControlPoints(points) {
              console.log('🔍 DEBUG: setControlPoints called with', points);
              _controlPoints = points.filter(pt =>
                Array.isArray(pt) && pt.length >= 2 &&
                typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                !isNaN(pt[0]) && !isNaN(pt[1])
              );
            },
            getControlPoints() {
              console.log('🔍 DEBUG: getControlPoints called, returning', _controlPoints);
              return _controlPoints;
            },
            get getControlPointsProp() {
              console.log('🔍 DEBUG: controlPoints property accessed, returning', _controlPoints);
              return _controlPoints;
            },
            isPointNearCurve() { return false; },
            getPolylinePoints() {
              // Return the current control points (which are canvas coordinates after setControlPoints)
              const polyline = _controlPoints.map(pt => [
                Number(pt[0]) || 0,
                Number(pt[1]) || 0
              ]);
              console.log('🔍 DEBUG: getPolylinePoints called, returning', polyline.slice(0, 3), `... (${polyline.length} total)`);
              return polyline;
            },
            getPoints() { return _controlPoints; },
            getNumberOfPoints() { return _controlPoints.length; },
            getPoint(index) { return _controlPoints[index] || [0, 0]; },
            addPoint(point) {
              if (Array.isArray(point) && point.length >= 2 &&
                  typeof point[0] === 'number' && typeof point[1] === 'number' &&
                  !isNaN(point[0]) && !isNaN(point[1])) {
                _controlPoints.push([point[0], point[1]]);
              }
            },
            removePoint(index) {
              if (index >= 0 && index < _controlPoints.length) {
                _controlPoints.splice(index, 1);
              }
            },
            clear() { _controlPoints = []; },
            isEmpty() { return _controlPoints.length === 0; }
          };
          measurement.data.spline = {
            type: 'CATMULLROM',
            instance: splineInstance,
            resolution: 0.5
          };
          console.log(`🔍 DEBUG: Added complete spline object for SplineROI:`, measurement.data.spline);
          console.log(`🔍 DEBUG: Spline instance controlPoints:`, splineInstance.getControlPoints().slice(0, 3), `... (${splineInstance.getControlPoints().length} total)`);
          // Log the annotation object after adding to measurement service (simulate, if needed)
          setTimeout(() => {
            try {
              console.log('🔍 DEBUG: Annotation object after add:', measurement);
            } catch (e) {}
          }, 1000);
        }
        
        // Restore cachedStats if they existed
        if (existingCachedStats) {
          measurement.data.cachedStats = existingCachedStats;
        }
        
        console.log(`🔍 DEBUG: Created PlanarFreehandROI/SplineROI/LivewireContour handles:`, measurement.data.handles);
        console.log(`🔍 DEBUG: Created PlanarFreehandROI/SplineROI/LivewireContour contour:`, measurement.data.contour);
      } else {
        console.warn(`🔍 DEBUG: PlanarFreehandROI/SplineROI/LivewireContour has no points (${measurement.points?.length || 0}), creating default handles`);
        
        // Preserve existing cachedStats if they exist
        const existingCachedStats = measurement.data?.cachedStats;
        
        // Create a simple default contour
        const defaultPoints = [
          [100, 100, 0],
          [150, 100, 0],
          [150, 150, 0],
          [100, 150, 0]
        ];
        
        measurement.data.handles = {
          points: defaultPoints,
          activeHandleIndex: null,
          invalidated: false,
          highlighted: false,
          locked: false,
          visible: true,
          textBox: {
            hasMoved: false,
            worldPosition: [0, 0, 0],
            worldBoundingBox: {
              topLeft: [0, 0, 0],
              topRight: [0, 0, 0],
              bottomLeft: [0, 0, 0],
              bottomRight: [0, 0, 0]
            }
          }
        };
        
        measurement.data.contour = {
          polyline: defaultPoints,
          closed: true
        };
        
        // For SplineROI, add the required spline object
        if (measurement.toolName === 'SplineROI') {
          // Ensure we have valid 2D points for the spline (fallback case)
          const validPoints = defaultPoints
            .filter(pt => Array.isArray(pt) && pt.length >= 2 && 
                         typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                         !isNaN(pt[0]) && !isNaN(pt[1]))
            .map(pt => [pt[0], pt[1]]);
          
          console.log(`🔍 DEBUG: SplineROI fallback original points:`, defaultPoints);
          console.log(`🔍 DEBUG: SplineROI fallback valid 2D points:`, validPoints);
          
          if (validPoints.length === 0) {
            console.warn(`🔍 DEBUG: No valid points found for SplineROI fallback, using default`);
            validPoints.push([100, 100], [150, 100], [150, 150], [100, 150]);
          }
          
          // Create a complete spline-like object with all required methods
          const splineInstance = {
            type: 'CATMULLROM',
            controlPoints: validPoints,
            setControlPoints(points) { 
              this.controlPoints = points.filter(pt => 
                Array.isArray(pt) && pt.length >= 2 && 
                typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                !isNaN(pt[0]) && !isNaN(pt[1])
              );
            },
            getControlPoints() { return this.controlPoints; },
            isPointNearCurve() { return false; },
            getPolylinePoints() { 
              // Return interpolated points for SVG path
              const polyline = catmullRomSpline(this.controlPoints, 20);
              console.log('🔍 DEBUG: getPolylinePoints returning', polyline.slice(0, 5), '...');
              return polyline;
            },
            getPoints() { return this.controlPoints; },
            getNumberOfPoints() { return this.controlPoints.length; },
            getPoint(index) { return this.controlPoints[index] || [0, 0]; },
            addPoint(point) { 
              if (Array.isArray(point) && point.length >= 2 && 
                  typeof point[0] === 'number' && typeof point[1] === 'number' &&
                  !isNaN(point[0]) && !isNaN(point[1])) {
                this.controlPoints.push([point[0], point[1]]);
              }
            },
            removePoint(index) { 
              if (index >= 0 && index < this.controlPoints.length) {
                this.controlPoints.splice(index, 1);
              }
            },
            clear() { this.controlPoints = []; },
            isEmpty() { return this.controlPoints.length === 0; }
          };
          measurement.data.spline = {
            type: 'CATMULLROM',
            instance: splineInstance,
            resolution: 0.5
          };
          console.log(`🔍 DEBUG: Added complete spline object for SplineROI (fallback):`, measurement.data.spline);
        }
        
        // Restore cachedStats if they existed
        if (existingCachedStats) {
          measurement.data.cachedStats = existingCachedStats;
        }
        
        measurement.points = defaultPoints;
      }
    } 
    // Defensive: ensure data and handles always exist
    if (!measurement.data) {
      measurement.data = {};
    }
    if (!measurement.data.handles) {
      measurement.data.handles = {};
    }

    // For ArrowAnnotate, try to reconstruct handles if possible
    if (measurement.toolName === 'ArrowAnnotate') {
      console.log('🔍 DEBUG: ArrowAnnotate import - points:', measurement.points);
      console.log('🔍 DEBUG: ArrowAnnotate import - existing handles:', measurement.data.handles);
      
      if (!measurement.data.handles.start && measurement.points.length > 0) {
        measurement.data.handles.start = { 
          x: measurement.points[0][0], 
          y: measurement.points[0][1], 
          z: measurement.points[0][2] || 0 
        };
      }
      if (!measurement.data.handles.end && measurement.points.length > 1) {
        measurement.data.handles.end = { 
          x: measurement.points[1][0], 
          y: measurement.points[1][1], 
          z: measurement.points[1][2] || 0 
        };
      }
      
      console.log('🔍 DEBUG: ArrowAnnotate import - final handles:', measurement.data.handles);
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
    console.log(`�� DEBUG: measurement object being stored:`, {
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
    
    // Additional debug for ROI tools
    if (measurement.toolName === 'CircleROI' || measurement.toolName === 'EllipticalROI' || measurement.toolName === 'SplineROI') {
      console.log(`🔍 DEBUG: ${measurement.toolName} final data structure:`, {
        handles: measurement.data.handles,
        center: measurement.data.handles?.center,
        end: measurement.data.handles?.end,
        textBox: measurement.data.handles?.textBox,
        activeHandleIndex: measurement.data.handles?.activeHandleIndex,
        points: measurement.data.handles?.points
      });
      
      // Additional safety check for EllipticalROI
      if (measurement.toolName === 'EllipticalROI') {
        console.log(`🔍 DEBUG: EllipticalROI annotation data being passed to Cornerstone3D:`, rawDataForService.annotation.data);
        
        // Ensure the annotation data has all required properties
        if (!rawDataForService.annotation.data.handles.points || !Array.isArray(rawDataForService.annotation.data.handles.points)) {
          console.warn(`🔍 DEBUG: EllipticalROI annotation data missing points array, adding it`);
          rawDataForService.annotation.data.handles.points = [
            [measurement.data.handles.center.x, measurement.data.handles.center.y, measurement.data.handles.center.z || 0],
            [measurement.data.handles.end.x, measurement.data.handles.end.y, measurement.data.handles.end.z || 0]
          ];
        }
      }
    }

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

      // Add to recently imported set to prevent immediate removal
      recentlyImportedMeasurements.add(measurement.uid);
      console.log(`🔍 DEBUG: Added ${measurement.uid} to recently imported set. Total protected: ${recentlyImportedMeasurements.size}`);
      
      // Store the measurement data for potential re-adding
      try {
        if (protectedMeasurements && typeof protectedMeasurements.set === 'function') {
          protectedMeasurements.set(measurement.uid, {
            toolName: measurement.toolName,
            rawData: rawDataForService,
            displayText: measurement.displayText // Store the display text separately
          });
        } else {
          console.warn(`🔍 DEBUG: protectedMeasurements is not available for ${measurement.uid}`);
        }
      } catch (error) {
        console.error(`🔍 DEBUG: Error storing measurement data for ${measurement.uid}:`, error);
      }
      
      measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);

      // Check if the measurement was actually added successfully
      const storedMeasurements = measurementService.getMeasurements();
      const ourMeasurement = storedMeasurements.find(m => m.uid === measurement.uid);
      
      if (!ourMeasurement) {
        console.warn(`❌ Measurement ${measurement.uid} was not successfully added to the service`);
        recentlyImportedMeasurements.delete(measurement.uid);
        return; // Skip the rest of the processing for this measurement
      }

      console.log(`✅ Successfully added measurement ${measurement.uid} to measurement service`);
      
      // Proactively restore display text multiple times to ensure it persists
      let displayTextRestorationCount = 0;
      const maxDisplayTextRestorations = 3;
      
      const restoreDisplayText = () => {
        try {
          // Prevent infinite loops by limiting restoration attempts
          if (displayTextRestorationCount >= maxDisplayTextRestorations) {
            console.log(`🔍 DEBUG: Max display text restorations reached for ${measurement.uid}, skipping`);
            return;
          }
          
          if (!protectedMeasurements || typeof protectedMeasurements.get !== 'function') {
            return; // Skip if protectedMeasurements is not available
          }
          
          const storedMeasurement = protectedMeasurements.get(measurement.uid);
          if (storedMeasurement && storedMeasurement.displayText) {
            const currentMeasurement = measurementService.getMeasurement(measurement.uid);
            if (currentMeasurement) {
              const currentDisplayText = currentMeasurement.displayText;
              const storedDisplayText = storedMeasurement.displayText;
              
              // Check if display text needs restoration
              // For ArrowAnnotate, we want to preserve the label as the primary text
              const needsRestoration = !currentDisplayText || 
                  !currentDisplayText.primary || 
                  currentDisplayText.primary.length === 0 ||
                  (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');
              
              // For ArrowAnnotate, if the primary text is the label, that's actually correct
              const isArrowAnnotateWithLabel = currentMeasurement.toolName === 'ArrowAnnotate' && 
                  currentDisplayText?.primary?.length === 1 && 
                  currentDisplayText.primary[0] === currentMeasurement.label;
              
              if (needsRestoration && !isArrowAnnotateWithLabel) {
                
                displayTextRestorationCount++;
                console.log(`🔍 DEBUG: Proactively restoring display text for measurement ${measurement.uid} (attempt ${displayTextRestorationCount}/${maxDisplayTextRestorations})`);
                console.log(`🔍 DEBUG: Current display text:`, currentDisplayText);
                console.log(`🔍 DEBUG: Stored display text:`, storedDisplayText);
                
                // Only directly modify the measurement object to avoid triggering update events
                if (currentMeasurement.displayText) {
                  currentMeasurement.displayText.primary = [...storedDisplayText.primary];
                  currentMeasurement.displayText.secondary = [...storedDisplayText.secondary];
                  console.log(`🔍 DEBUG: Directly modified measurement object display text for ${measurement.uid}`);
                }
                
                console.log(`🔍 DEBUG: Display text proactively restored for measurement ${measurement.uid}`);
              } else {
                console.log(`🔍 DEBUG: Display text already correct for ${measurement.uid}, no restoration needed`);
              }
            }
          }
        } catch (error) {
          console.error(`🔍 DEBUG: Error in restoreDisplayText for ${measurement.uid}:`, error);
        }
      };
      
      // Run display text restoration multiple times with different delays
      setTimeout(restoreDisplayText, 500); // 500ms delay to allow annotation creation to complete
      setTimeout(restoreDisplayText, 1000); // 1 second delay
      setTimeout(restoreDisplayText, 2000); // 2 second delay
      
      // Remove from recently imported set after a delay to allow annotation to stabilize
      setTimeout(() => {
        recentlyImportedMeasurements.delete(measurement.uid);
        protectedMeasurements.delete(measurement.uid);
        console.log(`🔍 DEBUG: Removed ${measurement.uid} from recently imported set. Total protected: ${recentlyImportedMeasurements.size}`);
        
        // Verify the measurement is still in the service after protection period
        const finalCheck = measurementService.getMeasurements().find(m => m.uid === measurement.uid);
        if (finalCheck) {
          console.log(`✅ Measurement ${measurement.uid} successfully stabilized and remains in service`);
          
          // Also verify the annotation exists in Cornerstone Tools
          try {
            const cornerstoneTools = (window as any).cornerstoneTools;
            if (cornerstoneTools?.annotation?.state) {
              const annotation = cornerstoneTools.annotation.state.getAnnotation(measurement.uid);
              if (annotation) {
                console.log(`✅ Annotation ${measurement.uid} also exists in Cornerstone Tools`);
              } else {
                console.warn(`⚠️ Annotation ${measurement.uid} missing from Cornerstone Tools but measurement exists in service`);
              }
            }
          } catch (e) {
            console.warn('Could not verify annotation in Cornerstone Tools:', e);
          }
        } else {
          console.warn(`⚠️ Measurement ${measurement.uid} was removed after protection period`);
          
          // Try to re-add the measurement if it was removed prematurely
          console.log(`🔍 DEBUG: Attempting to re-add measurement ${measurement.uid} to service`);
          try {
            recentlyImportedMeasurements.add(measurement.uid);
            protectedMeasurements.set(measurement.uid, {
              toolName: measurement.toolName,
              rawData: rawDataForService,
              displayText: measurement.displayText
            });
            measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);
            console.log(`🔍 DEBUG: Re-added measurement ${measurement.uid} to service`);
          } catch (e) {
            console.error(`❌ Failed to re-add measurement ${measurement.uid}:`, e);
          }
        }
      }, 3000); // 3 second delay to be more conservative
      
      // Verify the measurement is properly associated with the tracked series
      if (trackedMeasurementsService && seriesUID) {
        const isSeriesTracked = trackedMeasurementsService.isSeriesTracked(seriesUID);
        console.log(`🔍 DEBUG: Series ${seriesUID} tracked status: ${isSeriesTracked}`);
        
        if (!isSeriesTracked) {
          console.warn(`⚠️ Series ${seriesUID} is not tracked, measurement may not appear in panel`);
        }
      }

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
                          
                          // Check if the annotation is in the tool's annotation list for this viewport
                          const toolAnnotations = cornerstoneTools.annotation.state.getAnnotations(measurement.uid, viewportElement);
                          console.log(`🔍 DEBUG: Tool annotations for ${measurement.uid} in viewport ${viewport.id}:`, toolAnnotations);
                          
                          // If the annotation is not in the tool's list, try to add it directly
                          if (!toolAnnotations || toolAnnotations.length === 0) {
                            console.log(`🔍 DEBUG: Annotation not in tool list, attempting to add it directly`);
                            
                            try {
                              // Try to add the annotation directly to the tool's annotation list
                              const { toolGroupService } = servicesManager.services;
                              const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
                              if (toolGroup) {
                                const toolName = measurement.toolName;
                                console.log(`🔍 DEBUG: Adding annotation directly to ${toolName} tool for viewport ${viewport.id}`);
                                
                                // Force the annotation to be associated with this viewport
                                cornerstoneTools.annotation.state.addAnnotation(annotation, viewportElement);
                                
                                // Also try to create the annotation memo manually
                                try {
                                  cornerstoneTools.AnnotationTool.createAnnotationMemo(viewportElement, annotation, {
                                    newAnnotation: true,
                                    deleting: false,
                                  });
                                  console.log(`🔍 DEBUG: Manually created annotation memo for viewport ${viewport.id}`);
                                } catch (memoErr) {
                                  console.warn(`🔍 DEBUG: Failed to create annotation memo manually:`, memoErr);
                                }
                                
                                // Force the tool to render
                                if (viewport.render && typeof viewport.render === 'function') {
                                  viewport.render();
                                  console.log(`🔍 DEBUG: Forced viewport render after direct annotation addition`);
                                }
                              }
                            } catch (directAddErr) {
                              console.warn(`🔍 DEBUG: Failed to add annotation directly:`, directAddErr);
                            }
                          }
                          
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
                    // Check SplineROI tool configuration specifically
                    const splineROIToolConfig = toolGroup.getToolConfiguration('SplineROI');
                    
                    // Check if SplineROI tool is active or passive
                    const splineROIToolMode = toolGroup.getToolOptions('SplineROI')?.mode;
                    
                    // Ensure SplineROI tool is at least passive so it can render annotations
                    if (splineROIToolMode !== 'Active' && splineROIToolMode !== 'Passive') {
                      console.log(`🔍 DEBUG: Setting SplineROI tool to passive mode for viewport ${viewportId}`);
                      toolGroup.setToolPassive('SplineROI');
                    }
                    
                    // Force the SplineROI tool to render annotations
                    
                    const lengthToolConfig = toolGroup.getToolConfiguration('Length');
                    
                    // Check if Length tool is active or passive
                    const lengthToolMode = toolGroup.getToolOptions('Length')?.mode;
                    
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
                      
                      // Check if SplineROI tool exists and is properly configured
                      if (measurement.toolName === 'SplineROI') {
                        const splineROITool = cornerstoneTools.getTool('SplineROI');
                        console.log(`🔍 DEBUG: SplineROI tool exists:`, !!splineROITool);
                        console.log(`🔍 DEBUG: SplineROI tool configuration:`, splineROITool);
                        
                        // Check if the tool is properly registered with the tool group
                        const toolInstance = toolGroup.getToolInstance('SplineROI');
                        console.log(`🔍 DEBUG: SplineROI tool instance in tool group:`, !!toolInstance);
                      }
                      
                      // Check if the annotation is in the tool's annotation list for this specific viewport
                      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                      if (viewport && viewport.element) {
                        try {
                          const toolAnnotations = cornerstoneTools.annotation.state.getAnnotations(measurement.uid, viewport.element);
                          console.log(`🔍 DEBUG: Tool annotations for ${measurement.uid} in viewport ${viewportId}:`, toolAnnotations);
                          
                          // If the annotation is not in the tool's list, try to use the tool's hydration method
                          if (!toolAnnotations || toolAnnotations.length === 0) {
                            console.log(`🔍 DEBUG: Annotation not in tool list, attempting tool hydration for viewport ${viewportId}`);
                            
                            try {
                              // Try to use the tool's hydration method
                              const lengthTool = cornerstoneTools.getTool('Length');
                              if (lengthTool && lengthTool.hydrate && typeof lengthTool.hydrate === 'function') {
                                console.log(`🔍 DEBUG: Using Length tool hydration method for viewport ${viewportId}`);
                                
                                // Get the annotation data for hydration
                                const annotationData = annotation?.data;
                                if (annotationData?.handles?.points) {
                                  const points = annotationData.handles.points;
                                  console.log(`🔍 DEBUG: Hydrating with points:`, points);
                                  
                                  // Use the tool's hydration method
                                  lengthTool.hydrate(viewportId, points, {
                                    annotationUID: measurement.uid,
                                    ...annotationData
                                  });
                                  
                                  console.log(`🔍 DEBUG: Tool hydration completed for viewport ${viewportId}`);
                                  
                                  // Force render after hydration
                                  if (viewport.render && typeof viewport.render === 'function') {
                                    viewport.render();
                                    console.log(`🔍 DEBUG: Forced render after tool hydration for ${viewportId}`);
                                  }
                                } else {
                                  console.warn(`🔍 DEBUG: No valid points found for tool hydration`);
                                }
                              } else {
                                console.warn(`🔍 DEBUG: Length tool does not have hydration method`);
                              }
                            } catch (hydrationErr) {
                              console.warn(`🔍 DEBUG: Failed to hydrate annotation with tool:`, hydrationErr);
                            }
                          }
                          
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

    // CRITICAL: Force refresh the measurement panel to show the new measurements
    try {
      const { panelService } = servicesManager.services;
      if (panelService) {
        // Try to refresh the measurement panel
        console.log(`🔍 DEBUG: Attempting to refresh measurement panel`);
        
        // Trigger a measurement service event to refresh the panel
        // Use the correct method to trigger events
        if (measurementService._broadcastEvent) {
          measurementService._broadcastEvent(measurementService.EVENTS.MEASUREMENTS_LOADED, {
            measurements: allMeasurements,
            source: source,
          });
          console.log(`🔍 DEBUG: Triggered MEASUREMENTS_LOADED event via _broadcastEvent`);
        } else if (measurementService.broadcastEvent) {
          measurementService.broadcastEvent(measurementService.EVENTS.MEASUREMENTS_LOADED, {
            measurements: allMeasurements,
            source: source,
          });
          console.log(`🔍 DEBUG: Triggered MEASUREMENTS_LOADED event via broadcastEvent`);
        } else {
          // Fallback: try to trigger a custom event
          console.log(`🔍 DEBUG: Using fallback method to refresh measurement panel`);
          // The measurement service should automatically notify subscribers when measurements are added
        }
      }
    } catch (panelErr) {
      console.warn('Could not refresh measurement panel:', panelErr);
    }

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

  // FINAL STEP: Ensure the measurement panel shows the tracked measurements
  console.log(`🔍 DEBUG: Import completed. Total measurements imported: ${imageMeasurements.length}`);
  console.log(`🔍 DEBUG: Series ${seriesUID} has been added to tracking`);
  console.log(`🔍 DEBUG: Measurements should now appear in the measurement panel`);

  // Final verification: check that measurements are properly tracked
  if (trackedMeasurementsService && seriesUID) {
    const isSeriesTracked = trackedMeasurementsService.isSeriesTracked(seriesUID);
    const trackedSeries = trackedMeasurementsService.getTrackedSeries();
    console.log(`🔍 DEBUG: Final verification - Series ${seriesUID} tracked: ${isSeriesTracked}`);
    console.log(`🔍 DEBUG: All tracked series:`, trackedSeries);
    
    // Check measurements for this series
    const seriesMeasurements = measurementService.getMeasurements(
      measurement => measurement.referenceSeriesUID === seriesUID
    );
    console.log(`🔍 DEBUG: Measurements for series ${seriesUID}:`, seriesMeasurements.length);
    seriesMeasurements.forEach((m, index) => {
      console.log(`🔍 DEBUG: Series measurement ${index}:`, {
        uid: m.uid,
        toolName: m.toolName,
        label: m.label,
        displayText: m.displayText
      });
    });
  }

  // Cleanup: remove protection subscription after a delay
  setTimeout(() => {
    try {
      if (unsubscribeProtection && typeof unsubscribeProtection === 'function') {
        unsubscribeProtection();
        console.log(`🔍 DEBUG: Removed measurement removal protection subscription`);
      } else {
        console.warn(`🔍 DEBUG: No valid unsubscribe function available for cleanup`);
      }
      
      // Clear any remaining protected measurements
      recentlyImportedMeasurements.clear();
      if (protectedMeasurements && typeof protectedMeasurements.clear === 'function') {
        protectedMeasurements.clear();
      }
      console.log(`🔍 DEBUG: Cleared all protection data`);
    } catch (error) {
      console.error(`🔍 DEBUG: Error during cleanup:`, error);
    }
  }, 5000); // 5 second delay to ensure all measurements are stable

  return imageMeasurements.length;
}

export default importMeasurementCollection;