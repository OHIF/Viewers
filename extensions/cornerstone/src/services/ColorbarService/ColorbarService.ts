import { PubSubService } from '@ohif/core';
import { RENDERING_ENGINE_ID } from '../ViewportService/constants';
import { StackViewport, VolumeViewport, getRenderingEngine } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';
import { ColorbarOptions, ChangeTypes } from '../../types/Colorbar';
const { ViewportColorbar } = utilities.voi.colorbar;

export default class ColorbarService extends PubSubService {
  static EVENTS = {
    STATE_CHANGED: 'event::ColorbarService:stateChanged',
  };

  static defaultStyles = {
    position: 'absolute',
    boxSizing: 'border-box',
    border: 'solid 1px #555',
    cursor: 'initial',
  };

  static positionStyles = {
    left: { left: '5%' },
    right: { right: '5%' },
    top: { top: '5%' },
    bottom: { bottom: '5%' },
  };

  static defaultTickStyles = {
    position: 'left',
    style: {
      font: '12px Arial',
      color: '#fff',
      maxNumTicks: 8,
      tickSize: 5,
      tickWidth: 1,
      labelMargin: 3,
    },
  };

  public static REGISTRATION = {
    name: 'colorbarService',
    create: () => {
      return new ColorbarService();
    },
  };
  colorbars = {};

  constructor() {
    super(ColorbarService.EVENTS);
  }

  /**
   * Adds a colorbar to a specific viewport identified by `viewportId`, using the provided `displaySetInstanceUIDs` and `options`.
   * This method sets up the colorbar, associates it with the viewport, and applies initial configurations based on the provided options.
   *
   * @param viewportId The identifier for the viewport where the colorbar will be added.
   * @param displaySetInstanceUIDs An array of display set instance UIDs to associate with the colorbar.
   * @param options Configuration options for the colorbar, including position, colormaps, active colormap name, ticks, and width.
   */
  public addColorbar(viewportId, displaySetInstanceUIDs, options = {} as ColorbarOptions) {
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
    const viewport = renderingEngine.getViewport(viewportId);
    const { element } = viewport;
    const actorEntries = viewport.getActors();
    const { position, width: thickness, activeColormapName, colormaps } = options;

    const numContainers = displaySetInstanceUIDs.length;

    const containers = this.createContainers(
      numContainers,
      element,
      position,
      thickness,
      viewportId
    );

    displaySetInstanceUIDs.forEach((displaySetInstanceUID, index) => {
      const actorEntry = actorEntries.find(entry => entry.uid.includes(displaySetInstanceUID));
      const volumeId = actorEntry?.uid;
      const properties = viewport?.getProperties(volumeId);
      const colormap = properties?.colormap;
      // if there's an initial colormap set, and no colormap on the viewport, set it
      if (activeColormapName && !colormap) {
        this.setViewportColormap(
          viewportId,
          displaySetInstanceUID,
          colormaps[activeColormapName],
          true
        );
      }

      const colorbarContainer = containers[index];

      const colorbar = new ViewportColorbar({
        id: `ctColorbar-${viewportId}-${index}`,
        element,
        colormaps: options.colormaps || {},
        // if there's an existing colormap set, we use it, otherwise we use the activeColormapName, otherwise, grayscale
        activeColormapName: colormap?.name || options?.activeColormapName || 'Grayscale',
        container: colorbarContainer,
        ticks: {
          ...ColorbarService.defaultTickStyles,
          ...options.ticks,
        },
        volumeId: viewport instanceof VolumeViewport ? volumeId : undefined,
      });
      if (this.colorbars[viewportId]) {
        this.colorbars[viewportId].push({ colorbar, container: colorbarContainer });
      } else {
        this.colorbars[viewportId] = [{ colorbar, container: colorbarContainer }];
      }
    });

    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      changeType: ChangeTypes.Added,
    });
  }

  /**
   * Removes the colorbar associated with a given viewport ID. This involves cleaning up any created DOM elements and internal references.
   *
   * @param viewportId The identifier for the viewport from which the colorbar will be removed.
   */
  public removeColorbar(viewportId) {
    const colorbarInfo = this.colorbars[viewportId];
    if (!colorbarInfo) {
      return;
    }

    colorbarInfo.forEach(({ colorbar, container }) => {
      container.parentNode.removeChild(container);
    });

    delete this.colorbars[viewportId];

    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
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
    const setViewportProperties = (viewport, uid) => {
      const actorEntry = actorEntries.find(entry => entry.uid.includes(uid));
      const { actor: volumeActor, uid: volumeId } = actorEntry;
      viewport.setProperties({ colormap, volumeActor }, volumeId);
    };

    if (viewport instanceof StackViewport) {
      setViewportProperties(viewport, viewportId);
    }

    if (viewport instanceof VolumeViewport) {
      setViewportProperties(viewport, displaySetInstanceUID);
    }

    if (immediate) {
      viewport.render();
    }
  }

  /**
   * Creates the container elements for colorbars based on the specified parameters. This function dynamically
   * generates and styles DOM elements to host the colorbars, positioning them according to the specified options.
   *
   * @param numContainers The number of containers to create, typically corresponding to the number of colorbars.
   * @param element The DOM element within which the colorbar containers will be placed.
   * @param position The position of the colorbar containers (e.g., 'top', 'bottom', 'left', 'right').
   * @param thickness The thickness of the colorbar containers, affecting their width or height depending on their position.
   * @param viewportId The identifier of the viewport for which the containers are being created.
   * @returns An array of the created container DOM elements.
   */
  private createContainers(numContainers, element, position, thickness, viewportId) {
    const containers = [];
    const dimensions = {
      1: 50,
      2: 33,
    };
    const dimension = dimensions[numContainers] || 50 / numContainers;

    Array.from({ length: numContainers }).forEach((_, i) => {
      const colorbarContainer = document.createElement('div');
      colorbarContainer.id = `ctColorbarContainer-${viewportId}-${i + 1}`;

      Object.assign(colorbarContainer.style, ColorbarService.defaultStyles);

      if (['top', 'bottom'].includes(position)) {
        Object.assign(colorbarContainer.style, {
          width: `${dimension}%`,
          height: thickness || '2.5%',
          left: `${(i + 1) * dimension}%`,
          transform: 'translateX(-50%)',
          ...ColorbarService.positionStyles[position],
        });
      } else if (['left', 'right'].includes(position)) {
        Object.assign(colorbarContainer.style, {
          height: `${dimension}%`,
          width: thickness || '2.5%',
          top: `${(i + 1) * dimension}%`,
          transform: 'translateY(-50%)',
          ...ColorbarService.positionStyles[position],
        });
      }

      element.appendChild(colorbarContainer);
      containers.push(colorbarContainer);
    });

    return containers;
  }
}
