import { PubSubService, Types as OhifTypes } from '@ohif/core';
import { RENDERING_ENGINE_ID } from '../ViewportService/constants';
import { getRenderingEngine } from '@cornerstonejs/core';
import { ColorbarOptions, ChangeTypes } from '../../types/Colorbar';

export default class ColorbarService extends PubSubService {
  static EVENTS = {
    STATE_CHANGED: 'event::ColorbarService:stateChanged',
  };

  public static REGISTRATION = {
    name: 'colorbarService',
    create: ({ servicesManager }: OhifTypes.Extensions.ExtensionParams) => {
      return new ColorbarService(servicesManager);
    },
  };

  /**
   * Structure of colorbars state:
   * {
   *   [viewportId]: [
   *     {
   *       displaySetInstanceUID: string,
   *       colorbar: {
   *         activeColormapName: string,
   *         colormaps: array,
   *         volumeId: string (optional),
   *       }
   *     }
   *   ]
   * }
   */
  colorbars = {};
  servicesManager: AppTypes.ServicesManager;

  constructor(servicesManager: AppTypes.ServicesManager) {
    super(ColorbarService.EVENTS);
    this.servicesManager = servicesManager;
  }

  /**
   * Gets the appropriate data ID for a viewport and display set
   * @param viewport - The viewport instance
   * @param displaySetInstanceUID - The display set instance UID to identify data
   * @returns The appropriate data ID for the viewport type (volumeId for volume viewports, undefined for stack)
   */
  private getDataIdForViewport(viewport, displaySetInstanceUID: string): string | undefined {
    // For volume viewports, find the matching volumeId
    if (viewport.getAllVolumeIds) {
      const volumeIds = viewport.getAllVolumeIds() || [];
      return volumeIds.length > 0
        ? volumeIds.find(id => id.includes(displaySetInstanceUID)) || undefined
        : undefined;
    }

    // For other viewports, no specific dataId is needed for now
    return undefined;
  }

  /**
   * Adds a colorbar to a specific viewport identified by `viewportId`, using the provided `displaySetInstanceUIDs` and `options`.
   * This method prepares the colorbar state that will be used by the ViewportColorbarsContainer component.
   *
   * @param viewportId The identifier for the viewport where the colorbar will be added.
   * @param displaySetInstanceUIDs An array of display set instance UIDs to associate with the colorbar.
   * @param options Configuration options for the colorbar, including position, colormaps, active colormap name, ticks, and width.
   */
  public addColorbar(
    viewportId: string,
    displaySetInstanceUIDs: string[],
    options = {} as ColorbarOptions
  ) {
    const { displaySetService } = this.servicesManager.services;
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
    const viewport = renderingEngine.getViewport(viewportId);

    if (!viewport) {
      return;
    }

    const actorEntries = viewport.getActors();
    if (!actorEntries || actorEntries.length === 0) {
      return;
    }

    const { activeColormapName, colormaps } = options;

    displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
      // don't show colorbar for overlay display sets (e.g. segmentation)
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      if (displaySet.isOverlayDisplaySet) {
        return;
      }

      const dataId = this.getDataIdForViewport(viewport, displaySetInstanceUID);
      const properties = dataId ? viewport.getProperties(dataId) : viewport.getProperties();
      const colormap = properties?.colormap;

      if (activeColormapName && !colormap) {
        this.setViewportColormap(
          viewportId,
          displaySetInstanceUID,
          colormaps[activeColormapName],
          true
        );
      }

      // Prepare colorbar data for the React component
      const colorbarData = {
        activeColormapName: colormap?.name || options?.activeColormapName || 'Grayscale',
        colormaps: options.colormaps ? Object.values(options.colormaps) : [],
        volumeId: dataId,
        dataId,
      };

      // Store the colorbar data in the service state
      if (this.colorbars[viewportId]) {
        // Check if there's already an entry for this displaySetInstanceUID
        const existingIndex = this.colorbars[viewportId].findIndex(
          item => item.displaySetInstanceUID === displaySetInstanceUID
        );

        if (existingIndex !== -1) {
          // Update existing colorbar
          this.colorbars[viewportId][existingIndex].colorbar = colorbarData;
        } else {
          // Add new colorbar
          this.colorbars[viewportId].push({
            colorbar: colorbarData,
            displaySetInstanceUID,
          });
        }
      } else {
        // Create new colorbar array for this viewport
        this.colorbars[viewportId] = [
          {
            colorbar: colorbarData,
            displaySetInstanceUID,
          },
        ];
      }
    });

    // Notify listeners about the state change
    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      changeType: ChangeTypes.Added,
    });
  }

  /**
   * Removes a colorbar from a specific viewport. If displaySetInstanceUID is provided,
   * only the colorbar associated with that specific displaySetInstanceUID will be removed.
   * Otherwise, all colorbars for the given viewport will be removed.
   *
   * @param viewportId The identifier for the viewport from which the colorbar will be removed.
   * @param displaySetInstanceUID Optional. The specific display set instance UID associated with the colorbar to remove.
   */
  public removeColorbar(viewportId, displaySetInstanceUID?: string) {
    const colorbarInfo = this.colorbars[viewportId];
    if (!colorbarInfo) {
      return;
    }

    if (displaySetInstanceUID) {
      // Find the index of the colorbar with the matching displaySetInstanceUID
      const index = colorbarInfo.findIndex(
        info => info.displaySetInstanceUID === displaySetInstanceUID
      );

      if (index !== -1) {
        // Remove the colorbar from the array
        colorbarInfo.splice(index, 1);

        // If there are no more colorbars for this viewport, remove the entry
        if (colorbarInfo.length === 0) {
          delete this.colorbars[viewportId];
        }
      }
    } else {
      delete this.colorbars[viewportId];
    }

    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      displaySetInstanceUID,
      changeType: ChangeTypes.Removed,
    });
  }

  /**
   * Checks whether a colorbar is associated with a given viewport ID.
   *
   * @param viewportId The identifier for the viewport to check.
   * @returns `true` if a colorbar exists for the specified viewport, otherwise `false`.
   */
  public hasColorbar(viewportId) {
    return this.colorbars[viewportId] ? true : false;
  }

  /**
   * Retrieves the current state of colorbars, including all active colorbars and their configurations.
   *
   * @returns An object representing the current state of all colorbars managed by this service.
   */
  public getState() {
    return this.colorbars;
  }

  /**
   * Retrieves colorbar information for a specific viewport ID.
   *
   * @param viewportId The identifier for the viewport to retrieve colorbar information for.
   * @returns The colorbar information associated with the specified viewport, if available.
   */
  public getViewportColorbar(viewportId) {
    return this.colorbars[viewportId];
  }

  /**
   * Handles the cleanup and removal of all colorbars from the viewports. This is typically called
   * when exiting the mode or context in which the colorbars are used, ensuring that no DOM
   * elements or references are left behind.
   */
  public onModeExit() {
    const viewportIds = Object.keys(this.colorbars);
    viewportIds.forEach(viewportId => {
      this.removeColorbar(viewportId);
    });
  }

  /**
   * Sets the colormap for a viewport. This function is used internally to update the colormap the viewport
   *
   * @param viewportId The identifier of the viewport to update.
   * @param displaySetInstanceUID The display set instance UID associated with the viewport.
   * @param colormap The colormap object to set on the viewport.
   * @param immediate A boolean indicating whether the viewport should be re-rendered immediately after setting the colormap.
   */
  private setViewportColormap(viewportId, displaySetInstanceUID, colormap, immediate = false) {
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
    const viewport = renderingEngine.getViewport(viewportId);
    const actorEntries = viewport?.getActors();
    if (!viewport || !actorEntries || actorEntries.length === 0) {
      return;
    }

    // Get the appropriate dataId for this viewport/displaySet combination
    const dataId = this.getDataIdForViewport(viewport, displaySetInstanceUID);

    // Set properties with or without dataId based on what the viewport supports
    viewport.setProperties({ colormap }, dataId);

    if (immediate) {
      viewport.render();
    }
  }
}
