import { Types } from '@ohif/core';
import { utilities as csUtils } from '@cornerstonejs/tools';
import { DicomMetadataStore } from '@ohif/core';
import { importMeasurementCollection } from './IO/classes/JSONMeasurementImporter';

interface MeasurementCollection {
  workingCollection: any;
  importedCollections: any[];
}

interface CollectionInfo {
  name: string;
  collectionType: string;
  referencedSeriesInstanceUid: string;
  label: string;
  getFilesUri: string;
}

class XNATMeasurementApi {
  private _seriesCollections: Map<string, MeasurementCollection>;
  private _servicesManager: any;

  constructor(servicesManager: any) {
    this._servicesManager = servicesManager;
    this._seriesCollections = new Map();
    this.init();
  }

  init() {
    // Initialize the measurement API with services manager
    console.log('XNATMeasurementApi initialized for OHIF v3');
  }

  /**
   * Get measurement collections for a display set
   */
  getMeasurementCollections(displaySetInstanceUID: string): MeasurementCollection | undefined {
    let seriesCollection = this._seriesCollections.get(displaySetInstanceUID);
    if (!seriesCollection) {
      // Create a new collection for this display set
      seriesCollection = {
        workingCollection: null, // Will be handled by measurement service
        importedCollections: [],
      };
      this._seriesCollections.set(displaySetInstanceUID, seriesCollection);
    }
    return seriesCollection;
  }

  /**
   * Handle measurement completion events
   */
  onMeasurementCompleted(event: any) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;

    if (!measurementData || measurementData.cancelled) return;

    console.log('XNATMeasurementApi: Measurement completed', { toolType, measurementData });

    // The measurement service will handle the actual measurement creation
    // This is just for XNAT-specific logic if needed
  }

  /**
   * Handle measurement modification events
   */
  onMeasurementModified(event: any) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;
    const { measurementReference } = measurementData;

    if (!measurementReference) return;

    console.log('XNATMeasurementApi: Measurement modified', { toolType, measurementReference });

    // Trigger viewport refresh
    this.refreshViewports(element);
  }

  /**
   * Handle measurement removal events
   */
  onMeasurementRemoved(event: any) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;
    const { measurementReference } = measurementData;

    if (!measurementReference) return;

    console.log('XNATMeasurementApi: Measurement removed', { toolType, measurementReference });

    if (this.removeMeasurement(measurementReference)) {
      this.refreshViewports(element);
    }
  }

  /**
   * Remove a measurement
   */
  removeMeasurement(measurementReference: any, removeToolState = false): boolean {
    const { uuid, toolType, imageId, displaySetInstanceUID } = measurementReference;

    console.log('XNATMeasurementApi: Removing measurement', { uuid, toolType, imageId });

    // Use the measurement service to remove the measurement
    if (this._servicesManager?.services?.measurementService) {
      const { measurementService } = this._servicesManager.services;
      measurementService.remove(uuid);
      return true;
    }

    return false;
  }

  /**
   * Add an imported collection
   */
  async addImportedCollection(
    SeriesInstanceUID: string,
    collectionLabel: string,
    collectionObject: any
  ): Promise<void> {
    const displaySetInstanceUID = this.getDisplaySetInstanceUID(SeriesInstanceUID);

    if (!displaySetInstanceUID) {
      console.warn('XNATMeasurementApi: Could not find display set for series', SeriesInstanceUID);
      return;
    }

    console.log('XNATMeasurementApi: Adding imported collection', {
      collectionLabel,
      displaySetInstanceUID,
    });

    // Use the modern importMeasurementCollection function
    try {
      console.log('XNATMeasurementApi: Starting import with collectionObject:', collectionObject);
      
      const importResult = await importMeasurementCollection({
        collectionJSON: collectionObject,
        servicesManager: this._servicesManager,
      });

      console.log('XNATMeasurementApi: Import result:', importResult);

      // Store the collection info for reference
      const seriesCollection = this.getMeasurementCollections(displaySetInstanceUID);
      if (seriesCollection) {
        seriesCollection.importedCollections.push({
          label: collectionLabel,
          collectionObject,
          displaySetInstanceUID,
        });
      }

      // Verify that measurements were added to the measurement service
      if (this._servicesManager?.services?.measurementService) {
        const { measurementService } = this._servicesManager.services;
        const measurements = measurementService.getMeasurements();
        console.log('XNATMeasurementApi: Total measurements in service after import:', measurements.length);
        
        // Log the last few measurements to verify they were added
        const recentMeasurements = measurements.slice(-5);
        console.log('XNATMeasurementApi: Recent measurements:', recentMeasurements.map(m => ({
          uid: m.uid,
          toolName: m.toolName,
          label: m.label
        })));
      }

      console.log('XNATMeasurementApi: Successfully imported collection', collectionLabel);
    } catch (error) {
      console.error('XNATMeasurementApi: Error importing collection', error);
      throw error;
    }
  }

  /**
   * Remove an imported collection
   */
  removeImportedCollection(collectionUuid: string, displaySetInstanceUID: string): void {
    console.log('XNATMeasurementApi: Removing imported collection', { collectionUuid, displaySetInstanceUID });

    const seriesCollection = this.getMeasurementCollections(displaySetInstanceUID);
    if (!seriesCollection) return;

    // Find and remove the collection
    const index = seriesCollection.importedCollections.findIndex(
      collection => collection.collectionObject?.metadata?.uuid === collectionUuid
    );

    if (index >= 0) {
      seriesCollection.importedCollections.splice(index, 1);
      console.log('XNATMeasurementApi: Removed imported collection', collectionUuid);
    }
  }

  /**
   * Check if a collection is eligible for import
   */
  isCollectionEligibleForImport(roiCollectionInfo: any, SeriesInstanceUID: string): boolean {
    const displaySetInstanceUID = this.getDisplaySetInstanceUID(SeriesInstanceUID);

    if (!displaySetInstanceUID) {
      return false;
    }

    const item = roiCollectionInfo.items[0];
    const { collectionType, label } = item.data_fields;

    if (collectionType !== 'MEAS') {
      return false;
    }

    const seriesCollection = this.getMeasurementCollections(displaySetInstanceUID);
    if (!seriesCollection) {
      return true; // No existing collections, so eligible
    }

    const { importedCollections } = seriesCollection;
    const collectionAlreadyImported = importedCollections.some(
      collection => collection.label === label
    );

    return !collectionAlreadyImported;
  }

  /**
   * Get display set instance UID for a series
   */
  getDisplaySetInstanceUID(SeriesInstanceUID: string): string | undefined {
    try {
      const { displaySetService } = this._servicesManager.services;
      
      // Try different methods to get display sets (OHIF v3 compatibility)
      let displaySets = [];
      
      // Method 1: Try getActiveDisplaySets (most common in OHIF v3)
      if (displaySetService.getActiveDisplaySets) {
        displaySets = displaySetService.getActiveDisplaySets();
      }
      // Method 2: Try getAllDisplaySets (alternative OHIF v3 method)
      else if (displaySetService.getAllDisplaySets) {
        displaySets = displaySetService.getAllDisplaySets();
      }
      // Method 3: Try getDisplaySets (legacy method)
      else if (displaySetService.getDisplaySets) {
        displaySets = displaySetService.getDisplaySets();
      }
      // Method 4: Try to get from viewport grid service
      else if (this._servicesManager.services.viewportGridService) {
        const { viewportGridService } = this._servicesManager.services;
        const { viewports } = viewportGridService.getState();
        
        // Get display sets from active viewports
        for (const [viewportId, viewport] of viewports) {
          if (viewport.displaySetInstanceUIDs) {
            for (const displaySetInstanceUID of viewport.displaySetInstanceUIDs) {
              const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
              if (displaySet) {
                displaySets.push(displaySet);
              }
            }
          }
        }
      }

      console.log('XNATMeasurementApi: Found display sets:', displaySets.length);

      for (const displaySet of displaySets) {
        if (displaySet.SeriesInstanceUID === SeriesInstanceUID) {
          console.log('XNATMeasurementApi: Found matching display set:', displaySet.displaySetInstanceUID);
          return displaySet.displaySetInstanceUID;
        }
      }
      
      console.warn('XNATMeasurementApi: No matching display set found for series:', SeriesInstanceUID);
    } catch (error) {
      console.warn('XNATMeasurementApi: Error getting display set UID', error);
    }

    return undefined;
  }

  /**
   * Refresh viewports
   */
  private refreshViewports(element: any): void {
    try {
      if (this._servicesManager?.services?.cornerstoneViewportService) {
        const { cornerstoneViewportService } = this._servicesManager.services;
        const renderingEngine = cornerstoneViewportService.getRenderingEngine();
        
        if (renderingEngine) {
          const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
          viewportIds.forEach(viewportId => {
            const viewport = renderingEngine.getViewport(viewportId);
            if (viewport && viewport.render) {
              viewport.render();
            }
          });
        }
      }
    } catch (error) {
      console.warn('XNATMeasurementApi: Error refreshing viewports', error);
    }
  }
}

export default XNATMeasurementApi; 