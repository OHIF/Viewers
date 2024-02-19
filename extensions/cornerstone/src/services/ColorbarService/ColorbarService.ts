import { PubSubService } from '@ohif/core';
import { RENDERING_ENGINE_ID } from '../ViewportService/constants';
import { getRenderingEngine } from '@cornerstonejs/core';

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
    width: '2.5%',
    height: '50%',
    right: '5%',
    top: '50%',
    transform: 'translateY(-50%)',
  };

  static positionStyles = {
    left: {
      left: '5%',
      right: 'unset',
    },
    right: {
      right: '5%',
      left: 'unset',
    },
    top: {
      top: '5%',
      bottom: 'unset',
      height: '2.5%',
      width: '50%',
      transform: 'translateX(-50%)',
    },
    bottom: {
      bottom: '5%',
      top: 'unset',
      height: '2.5%',
      width: '50%',
      transform: 'translateX(-50%)',
    },
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

  public addColorbar(viewportId, ViewportColorbar, options = {} as ColorbarOptions) {
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
    const { element } = renderingEngine.getViewport(viewportId);

    const colorbarContainer = document.createElement('div');
    colorbarContainer.id = `ctColorbarContainer-${viewportId}`;

    Object.assign(colorbarContainer.style, {
      ...ColorbarService.defaultStyles,
      width: options.width || ColorbarService.defaultStyles.width,
    });

    if (options.position in ColorbarService.positionStyles) {
      Object.assign(colorbarContainer.style, ColorbarService.positionStyles[options.position]);
    }

    element.appendChild(colorbarContainer);

    const colorbar = new ViewportColorbar({
      id: `ctColorbar-${viewportId}`,
      element,
      colormaps: options.colormaps || {},
      activeColormapName: options.activeColormapName || 'Grayscale',
      container: colorbarContainer,
      ticks: {
        ...ColorbarService.defaultTickStyles,
        ...options.ticks,
      },
    });

    this.colorbars[viewportId] = { colorbar, container: colorbarContainer, needsRefresh: false };

    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      state: ChangeTypes.Added,
    });
  }

  public removeColorbar(viewportId) {
    const colorbarInfo = this.colorbars[viewportId];
    if (!colorbarInfo) {
      return;
    }
    colorbarInfo.container.parentNode.removeChild(colorbarInfo.container);
    delete this.colorbars[viewportId];
    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      state: ChangeTypes.Removed,
    });
  }

  public updateColormap(viewportId, activeColormapName) {
    const colorbarInfo = this.colorbars[viewportId];
    if (colorbarInfo) {
      colorbarInfo.colorbar.activeColormapName = activeColormapName;
    }
    this._broadcastEvent(ColorbarService.EVENTS.STATE_CHANGED, {
      viewportId,
      state: ChangeTypes.Modified,
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
