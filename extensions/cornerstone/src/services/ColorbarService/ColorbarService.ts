import { PubSubService } from '@ohif/core';
import { RENDERING_ENGINE_ID } from '../ViewportService/constants';
import { StackViewport, VolumeViewport, getRenderingEngine } from '@cornerstonejs/core';

type ColorMapPreset = {
  ColorSpace;
  description: string;
  RGBPoints;
  Name;
};

type ColorbarOptions = {
  position: string;
  colormaps: Array<ColorMapPreset>;
  activeColormapName: string;
  ticks: object;
  width: string;
};

enum ChangeTypes {
  Removed = 'removed',
  Added = 'added',
  Modified = 'modified',
}

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

  public addColorbar(
    viewportId,
    ViewportColorbar,
    displaySetInstanceUIDs,
    options = {} as ColorbarOptions
  ) {
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
      if (!actorEntry) {
        return;
      }
      const { uid: volumeId } = actorEntry;
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
      state: ChangeTypes.Added,
    });
  }

  private setViewportColormap(viewportId, displaySetInstanceUID, colormap, immediate = false) {
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
    const viewport = renderingEngine.getViewport(viewportId);
    const actorEntries = viewport.getActors();

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

  private createContainers(numContainers, element, position, thickness, viewportId) {
    const containers = [];
    const dimension = 50 / numContainers;

    for (let i = 0; i < numContainers; i++) {
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
    }

    return containers;
  }

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
      state: ChangeTypes.Removed,
    });
  }

  public hasColorbar(viewportId) {
    return this.colorbars[viewportId] ? true : false;
  }

  public getState() {
    return this.colorbars;
  }

  public getViewportColorbar(viewportId) {
    return this.colorbars[viewportId];
  }

  public onModeExit() {
    const viewportIds = Object.keys(this.colorbars);
    viewportIds.forEach(viewportId => {
      this.removeColorbar(viewportId);
    });
  }
}
