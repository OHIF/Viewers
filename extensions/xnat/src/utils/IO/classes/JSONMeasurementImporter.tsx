/*
 * JSONMeasurementImporter - utility to parse a Measurement Collection JSON (as returned by XNAT)
 * and inject its imageMeasurements into OHIF MeasurementService so they appear in the viewer.
 */

import React from 'react';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';
import { getEnabledElement } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';

// Import utility functions
import { getMeasurementSource } from './utils/measurementSourceUtils';
import { getImageIdAndDisplaySetInfo } from './utils/imageIdUtils';
import { catmullRomSpline } from './utils/splineUtils';
import { identityMapping } from './utils/identityMapping';

// Import protection system
import { setupRemovalProtection, recentlyImportedMeasurements } from './protection/removalProtection';

// Import tool handlers
import { processLengthTool } from './handlers/lengthToolHandler';
import { processRectangleROI, processEllipticalROI } from './handlers/roiToolHandler';

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
      console.warn('Invalid unsubscribe function returned from setupRemovalProtection');
      // Create a dummy unsubscribe function to prevent errors
      unsubscribeProtection = () => {
      };
    }
  } catch (error) {
    console.error('Error setting up removal protection:', error);
    // Create fallback objects to prevent errors
    unsubscribeProtection = () => {
    };
    protectedMeasurements = new Map();
  }
  
  const source = getMeasurementSource(measurementService);

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
    trackedMeasurementsService.addTrackedSeries(seriesUID);
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
    const sopInstanceUID = im.imageReference?.SOPInstanceUID;

    // Get the imageId and display set info for this measurement first
    const initialFrameNumber = (im.imageReference?.frameIndex ?? 0) + 1;
    const { imageId, displaySetInstanceUID } = getImageIdAndDisplaySetInfo(
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
    } catch (e) {
      // If we can't get metadata, use frame 1 as safe default
      frameNumber = 1;
    }

    let measurement;
    try {
      // Ensure we have a valid toolName - try multiple sources
      let toolName = im.type || im.toolType || im.toolName || 'Length';

      if (toolName === 'EllipticalRoi' || toolName === 'EllipticalROI') {
        toolName = 'EllipticalROI';
      }

      console.log(`🔍 DEBUG: Resolved toolName: ${toolName} from im.type=${im.type}, im.toolType=${im.toolType}, im.toolName=${im.toolName}`);

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
        ...(measurementFrameOfReferenceUID ? { FrameOfReferenceUID: measurementFrameOfReferenceUID } : {}),
        label: im.label || im.name || toolName || 'Measurement',
        referencedImageId: imageId,  // Add referencedImageId at top level for isReferenceViewable
        ...cleanIm,  // Spread the clean object without invalid schema fields
        metadata: {
          ...im.metadata,
          referencedImageId: imageId,
          toolName: toolName,
          ...(measurementFrameOfReferenceUID ? { FrameOfReferenceUID: measurementFrameOfReferenceUID } : {}),
        },
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

      if (displayValues.length === 0) {
        displayValues = [measurement.label || 'PlanarFreehandROI'];
      }

      measurement.displayText = {
        primary: displayValues,
        secondary: [],
      };
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
      measurement.displayText = {
        primary: [],
        secondary: [],
      };
    }
    
    if (im.data?.cachedStats) {
      measurement.data = {
        cachedStats: im.data.cachedStats,
      };
    }

    if (im.toolType === 'ArrowAnnotate' && im.data?.text) {
      (measurement.data as any).text = im.data.text;
    }

    // Process tool-specific logic
    if (measurement.toolName === 'Length') {
      processLengthTool(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber, zCoord);
    } else if (measurement.toolName === 'RectangleROI') {
      processRectangleROI(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber);
    } else if (measurement.toolName === 'EllipticalROI' || measurement.toolName === 'CircleROI') {
      processEllipticalROI(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber);
    } else if (measurement.toolName === 'Bidirectional') {
      // TODO: Add bidirectional tool handler
      if (measurement.points && measurement.points.length >= 4) {
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
      } else {
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
      // TODO: Add arrow annotate handler
      if (measurement.points && measurement.points.length >= 2) {
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
      } else {
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
      // TODO: Add freehand tool handler
      if (measurement.points && measurement.points.length > 0) {
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

        measurement.data.contour = {
          polyline: measurement.points,
          closed: true
        };

        if (measurement.toolName === 'SplineROI') {
          let validPoints = [];

          if (measurement.points && measurement.points.length > 0) {  
            validPoints = measurement.points
              .filter(pt => Array.isArray(pt) && pt.length >= 2 &&
                typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                !isNaN(pt[0]) && !isNaN(pt[1]))
              .map(pt => [pt[0], pt[1], pt[2] ?? 0]);
          }

          if (validPoints.length === 0) {
            validPoints = [[100, 100], [150, 100], [150, 150], [100, 150]];
          }

          let _controlPoints = validPoints;
          const splineInstance = {
            type: 'CATMULLROM',
            closed: true,
            resolution: 0.5,
            fixedResolution: false,
            invalidated: false,
            setControlPoints(points) {
              _controlPoints = points.filter(pt =>
                Array.isArray(pt) && pt.length >= 2 &&
                typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
                !isNaN(pt[0]) && !isNaN(pt[1])
              );
            },
            getControlPoints() {
              return _controlPoints;
            },
            get getControlPointsProp() {
              return _controlPoints;
            },
            isPointNearCurve() { return false; },
            getPolylinePoints() {
              const polyline = _controlPoints.map(pt => [
                Number(pt[0]) || 0,
                Number(pt[1]) || 0
              ]);
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
        }

        if (existingCachedStats) {
          measurement.data.cachedStats = existingCachedStats;
        }
      } else {
        const existingCachedStats = measurement.data?.cachedStats;

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

        if (measurement.toolName === 'SplineROI') {
          const validPoints = defaultPoints
            .filter(pt => Array.isArray(pt) && pt.length >= 2 &&
              typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
              !isNaN(pt[0]) && !isNaN(pt[1]))
            .map(pt => [pt[0], pt[1]]);

          if (validPoints.length === 0) {
            validPoints.push([100, 100], [150, 100], [150, 150], [100, 150]);
          }

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
              const polyline = catmullRomSpline(this.controlPoints, 20);
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
        }

        if (existingCachedStats) {
          measurement.data.cachedStats = existingCachedStats;
        }

        measurement.points = defaultPoints;
      }
    }
    
    if (!measurement.data) {
      measurement.data = {};
    }
    if (!measurement.data.handles) {
      measurement.data.handles = {};
    }
    if (measurement.toolName === 'ArrowAnnotate') {
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
    }

    let finalDisplaySetInstanceUID = displaySetInstanceUID;
    if (!finalDisplaySetInstanceUID) {
      finalDisplaySetInstanceUID = findDisplaySetInstanceUID(sopInstanceUID);
    }

    if (finalDisplaySetInstanceUID) {
      measurement.displaySetInstanceUID = finalDisplaySetInstanceUID;
    }

    const rawDataForService = {
      id: measurement.uid,
      measurement: measurement,
      annotation: {
        annotationUID: measurement.uid,
        data: {
          ...measurement.data,
          frameNumber: measurement.frameNumber,
          label: measurement.label,
          uid: measurement.uid,
        },
        metadata: {
          toolName: measurement.toolName,
          ...(measurement.FrameOfReferenceUID ? { FrameOfReferenceUID: measurement.FrameOfReferenceUID } : {}),
          referencedImageId: measurement.metadata.referencedImageId,
          frameNumber: measurement.frameNumber,
        },
      },
    };

    if (measurement.toolName === 'CircleROI' || measurement.toolName === 'EllipticalROI' || measurement.toolName === 'SplineROI') {
      if (measurement.toolName === 'EllipticalROI') {
        if (!rawDataForService.annotation.data.handles.points || !Array.isArray(rawDataForService.annotation.data.handles.points)) {
          rawDataForService.annotation.data.handles.points = [
            [measurement.data.handles.center.x, measurement.data.handles.center.y, measurement.data.handles.center.z || 0],
            [measurement.data.handles.end.x, measurement.data.handles.end.y, measurement.data.handles.end.z || 0]
          ];
        }
      }
    }

    try {
      const debugListener = (eventData) => {
      };
      const unsubscribe = measurementService.subscribe(measurementService.EVENTS.RAW_MEASUREMENT_ADDED, debugListener);

      setTimeout(() => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }, 1000);

      recentlyImportedMeasurements.add(measurement.uid);

      try {
        if (protectedMeasurements && typeof protectedMeasurements.set === 'function') {
          protectedMeasurements.set(measurement.uid, {
            toolName: measurement.toolName,
            rawData: rawDataForService,
            displayText: measurement.displayText
          });
        }
      } catch (error) {
        console.error(`Error storing measurement data for ${measurement.uid}:`, error);
      }

      measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);

      const storedMeasurements = measurementService.getMeasurements();
      const ourMeasurement = storedMeasurements.find(m => m.uid === measurement.uid);

      if (!ourMeasurement) {
        console.warn(`❌ Measurement ${measurement.uid} was not successfully added to the service`);
        recentlyImportedMeasurements.delete(measurement.uid);
        return;
      }

      let displayTextRestorationCount = 0;
      const maxDisplayTextRestorations = 3;

      const restoreDisplayText = () => {
        try {
          if (displayTextRestorationCount >= maxDisplayTextRestorations) {
            return;
          }

          if (!protectedMeasurements || typeof protectedMeasurements.get !== 'function') {
            return;
          }

          const storedMeasurement = protectedMeasurements.get(measurement.uid);
          if (storedMeasurement && storedMeasurement.displayText) {
            const currentMeasurement = measurementService.getMeasurement(measurement.uid);
            if (currentMeasurement) {
              const currentDisplayText = currentMeasurement.displayText;
              const storedDisplayText = storedMeasurement.displayText;

              const needsRestoration = !currentDisplayText ||
                !currentDisplayText.primary ||
                currentDisplayText.primary.length === 0 ||
                (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');

              const isArrowAnnotateWithLabel = currentMeasurement.toolName === 'ArrowAnnotate' &&
                currentDisplayText?.primary?.length === 1 &&
                currentDisplayText.primary[0] === currentMeasurement.label;

              if (needsRestoration && !isArrowAnnotateWithLabel) {
                displayTextRestorationCount++;
                if (currentMeasurement.displayText) {
                  currentMeasurement.displayText.primary = [...storedDisplayText.primary];
                  currentMeasurement.displayText.secondary = [...storedDisplayText.secondary];
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error in restoreDisplayText for ${measurement.uid}:`, error);
        }
      };

      setTimeout(restoreDisplayText, 500);
      setTimeout(restoreDisplayText, 1000);
      setTimeout(restoreDisplayText, 2000);

      setTimeout(() => {
        recentlyImportedMeasurements.delete(measurement.uid);
        protectedMeasurements.delete(measurement.uid);

        const finalCheck = measurementService.getMeasurements().find(m => m.uid === measurement.uid);
        if (finalCheck) {
          try {
            const cornerstoneTools = (window as any).cornerstoneTools;
            if (cornerstoneTools?.annotation?.state) {
              const annotation = cornerstoneTools.annotation.state.getAnnotation(measurement.uid);
            }
          } catch (e) {
            console.warn('Could not verify annotation in Cornerstone Tools:', e);
          }
        } else {
          console.warn(`⚠️ Measurement ${measurement.uid} was removed after protection period`);

          try {
            recentlyImportedMeasurements.add(measurement.uid);
            protectedMeasurements.set(measurement.uid, {
              toolName: measurement.toolName,
              rawData: rawDataForService,
              displayText: measurement.displayText
            });
            measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);
          } catch (e) {
            console.error(`❌ Failed to re-add measurement ${measurement.uid}:`, e);
          }
        }
      }, 3000);

      if (trackedMeasurementsService && seriesUID) {
        const isSeriesTracked = trackedMeasurementsService.isSeriesTracked(seriesUID);
      }

      setTimeout(() => {
        const storedMeasurements = measurementService.getMeasurements();
        const ourMeasurement = storedMeasurements.find(m => m.uid === measurement.uid);

        if (ourMeasurement && ourMeasurement.displayText &&
          ourMeasurement.displayText.primary &&
          ourMeasurement.displayText.primary.length === 0) {

          const correctDisplayText = measurement.displayText;
          ourMeasurement.displayText = correctDisplayText;

          setTimeout(() => {
            const updatedMeasurements = measurementService.getMeasurements();
            const updatedMeasurement = updatedMeasurements.find(m => m.uid === measurement.uid);
          }, 10);
        }
      }, 50);

      // Add viewport management and annotation visibility logic
      try {
        setTimeout(() => {
          const cornerstoneTools = (window as any).cornerstoneTools;
          if (cornerstoneTools?.annotation?.visibility) {
            cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);

            const { cornerstoneViewportService } = servicesManager.services;
            const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
            if (renderingEngine) {
              const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
              try {
                triggerAnnotationRenderForViewportIds(viewportIds);
              } catch (renderErr) {
                console.warn('Failed to trigger render after setting visibility:', renderErr);
              }
            }
          }

          setTimeout(() => {
            try {
              const annotationManager = cornerstoneTools?.annotation?.state?.getAnnotationManager();
              if (annotationManager) {
                const annotation = annotationManager.getAnnotation(measurement.uid);
                if (annotation) {
                  annotation.isVisible = true;
                  annotation.invalidated = false;

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

                      if (!hasMatchingFrameOfRef) {
                        annotation.metadata.FrameOfReferenceUID = undefined;

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
                        const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
                        const annotation = annotationManager.getAnnotation(measurement.uid);

                        if (annotation) {
                          const isVisibleInViewport = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                          const toolAnnotations = cornerstoneTools.annotation.state.getAnnotations(measurement.uid, viewportElement);

                          if (!toolAnnotations || toolAnnotations.length === 0) {
                            try {
                              const { toolGroupService } = servicesManager.services;
                              const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
                              if (toolGroup) {
                                const toolName = measurement.toolName;

                                cornerstoneTools.annotation.state.addAnnotation(annotation, viewportElement);

                                try {
                                  cornerstoneTools.AnnotationTool.createAnnotationMemo(viewportElement, annotation, {
                                    newAnnotation: true,
                                    deleting: false,
                                  });
                                } catch (memoErr) {
                                  console.warn(`Failed to create annotation memo manually:`, memoErr);
                                }

                                if (viewport.render && typeof viewport.render === 'function') {
                                  viewport.render();
                                }
                              }
                            } catch (directAddErr) {
                              console.warn(`Failed to add annotation directly:`, directAddErr);
                            }
                          }

                          if (!isVisibleInViewport) {
                            cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);

                            if (viewport.render && typeof viewport.render === 'function') {
                              viewport.render();
                            }
                          }
                        }
                      }
                    }
                  } catch (viewportErr) {
                    console.warn(`Error checking annotation association with viewport ${viewport.id}:`, viewportErr);
                  }
                });
              }
            } catch (checkErr) {
              console.warn('Failed to check annotation association:', checkErr);
            }
          }, 1000);

          setTimeout(() => {
            const annotationManager = cornerstoneTools?.annotation?.state?.getAnnotationManager();
            if (annotationManager) {
              const annotation = annotationManager.getAnnotation(measurement.uid);
              console.log(`Final annotation state for ${measurement.uid}:`, {
                exists: !!annotation,
                isVisible: annotation?.isVisible,
                invalidated: annotation?.invalidated,
                highlighted: annotation?.highlighted,
                data: annotation?.data,
                metadata: annotation?.metadata
              });

              const { toolGroupService } = servicesManager.services;
              const viewportIds = cornerstoneViewportService.getRenderingEngine().getViewports().map(viewport => viewport.id);

              viewportIds.forEach(viewportId => {
                try {
                  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                  if (toolGroup) {
                    const splineROIToolConfig = toolGroup.getToolConfiguration('SplineROI');
                    const splineROIToolMode = toolGroup.getToolOptions('SplineROI')?.mode;

                    if (splineROIToolMode !== 'Active' && splineROIToolMode !== 'Passive') {
                      toolGroup.setToolPassive('SplineROI');
                    }

                    const lengthToolConfig = toolGroup.getToolConfiguration('Length');
                    const lengthToolMode = toolGroup.getToolOptions('Length')?.mode;

                    if (lengthToolMode !== 'Active' && lengthToolMode !== 'Passive') {
                      toolGroup.setToolPassive('Length');
                    }

                    try {
                      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                      if (viewport && viewport.render) {
                        viewport.render();
                      }
                    } catch (renderErr) {
                      console.warn(`Failed to force render for viewport ${viewportId}:`, renderErr);
                    }

                    try {
                      const isVisibleInTool = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);

                      if (measurement.toolName === 'SplineROI') {
                        const splineROITool = cornerstoneTools.getTool('SplineROI');

                        const toolInstance = toolGroup.getToolInstance('SplineROI');
                      }

                      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                      if (viewport && viewport.element) {
                        try {
                          const toolAnnotations = cornerstoneTools.annotation.state.getAnnotations(measurement.uid, viewport.element);

                          if (!toolAnnotations || toolAnnotations.length === 0) {
                            try {
                              const lengthTool = cornerstoneTools.getTool('Length');
                              if (lengthTool && lengthTool.hydrate && typeof lengthTool.hydrate === 'function') {
                                const annotationData = annotation?.data;
                                if (annotationData?.handles?.points) {
                                  const points = annotationData.handles.points;

                                  lengthTool.hydrate(viewportId, points, {
                                    annotationUID: measurement.uid,
                                    ...annotationData
                                  });

                                  if (viewport.render && typeof viewport.render === 'function') {
                                    viewport.render();
                                  }
                                }
                              } else {
                                console.warn(`🔍 DEBUG: Length tool does not have hydration method`);
                              }
                            } catch (hydrationErr) {
                              console.warn(`🔍 DEBUG: Failed to hydrate annotation with tool:`, hydrationErr);
                            }
                          }

                          let viewportFrameOfRef = viewport.getFrameOfReferenceUID();

                          if (!viewportFrameOfRef && measurement.FrameOfReferenceUID) {
                            try {
                              if (viewport.setFrameOfReferenceUID && typeof viewport.setFrameOfReferenceUID === 'function') {
                                viewport.setFrameOfReferenceUID(measurement.FrameOfReferenceUID);
                                viewportFrameOfRef = viewport.getFrameOfReferenceUID();
                              }
                            } catch (setFrameErr) {
                              console.warn(`Failed to set viewport frame of reference:`, setFrameErr);
                            }
                          }

                          if (viewportFrameOfRef === measurement.FrameOfReferenceUID) {
                            // Frame of reference matches
                          } else {
                            if (annotation && !viewportFrameOfRef) {
                              try {
                                annotation.metadata.FrameOfReferenceUID = undefined;
                                annotation.invalidated = true;
                                annotation.isVisible = true;

                                try {
                                  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                                  if (toolGroup) {
                                    const toolAnnotationState = cornerstoneTools.annotation.state.getAnnotationManager();

                                    const viewportElement = viewport.element;
                                    if (viewportElement) {
                                      const enabledElement = getEnabledElement(viewportElement);
                                      if (enabledElement) {
                                        cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);

                                        const lengthTool = cornerstoneTools.getTool('Length');
                                        if (lengthTool && lengthTool.renderAnnotation) {
                                          lengthTool.renderAnnotation(enabledElement);
                                        }
                                      }
                                    }
                                  }
                                } catch (toolErr) {
                                  console.warn(`Failed to force tool annotation:`, toolErr);
                                }

                                if (viewport.render && typeof viewport.render === 'function') {
                                  viewport.render();
                                }
                              } catch (fallbackErr) {
                                console.warn(`Failed to apply frame of reference fallback:`, fallbackErr);
                              }
                            }
                          }

                          const allViewportAnnotations = cornerstoneTools.annotation.state.getAnnotations(undefined, viewport.element);

                        } catch (elementErr) {
                          console.warn(`Could not get annotations for element in viewport ${viewportId}:`, elementErr);
                        }
                      }
                    } catch (toolCheckErr) {
                      console.warn(`Could not check tool annotation state for viewport ${viewportId}:`, toolCheckErr);
                    }
                  }
                } catch (toolErr) {
                  console.warn(`Could not check Length tool for viewport ${viewportId}:`, toolErr);
                }
              });
            }
          }, 50);
        }, 100);
      } catch (visibilityErr) {
        console.warn('Failed to set annotation visibility:', visibilityErr);
      }

    } catch (error) {
      console.error(`❌ Failed to add measurement ${measurement.uid}:`, error);
    }
  });

  // Add viewport refresh logic
  const { cornerstoneViewportService, toolGroupService } = servicesManager.services;
  if (cornerstoneViewportService && toolGroupService) {
    try {
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      if (renderingEngine) {
        const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);

        viewportIds.forEach(viewportId => {
          try {
            const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
            if (viewport) {
              const currentFrameOfRef = viewport.getFrameOfReferenceUID();
                
              if (!currentFrameOfRef) {
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
                    // Try to set the viewport's frame of reference UID
                    if (viewport.setFrameOfReferenceUID && typeof viewport.setFrameOfReferenceUID === 'function') {
                      viewport.setFrameOfReferenceUID(frameOfRef);
                      const newFrameOfRef = viewport.getFrameOfReferenceUID();
                    }
                  }
                }
              }
            }
          } catch (viewportErr) {
            console.warn(`Error fixing frame of reference for viewport ${viewportId}:`, viewportErr);
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

  // Cleanup: remove protection subscription after a delay
  setTimeout(() => {
    try {
      if (unsubscribeProtection && typeof unsubscribeProtection === 'function') {
        unsubscribeProtection();
      } else {
        console.warn(`No valid unsubscribe function available for cleanup`);
      }

      // Clear any remaining protected measurements
      recentlyImportedMeasurements.clear();
      if (protectedMeasurements && typeof protectedMeasurements.clear === 'function') {
        protectedMeasurements.clear();
      }
    } catch (error) {
      console.error(`Error during cleanup:`, error);
    }
  }, 5000); // 5 second delay to ensure all measurements are stable

  return imageMeasurements.length;
}

export default importMeasurementCollection; 