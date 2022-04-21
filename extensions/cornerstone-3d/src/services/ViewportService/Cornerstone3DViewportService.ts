import { pubSubServiceInterface } from '@ohif/core';
import {
  RenderingEngine,
  StackViewport,
  Types,
  getRenderingEngine,
  utilities as csUtils,
} from '@cornerstonejs/core';
import { IViewportService } from './IViewportService';
import { RENDERING_ENGINE_ID } from './constants';
import ViewportInfo, { ViewportOptions, DisplaySetOptions } from './Viewport';

const EVENTS = {
  VIEWPORT_INFO_CREATED:
    'event::cornerstone-3d::viewportservice:viewportinfocreated',
};

/**
 * Handles cornerstone-3D viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class Cornerstone3DViewportService implements IViewportService {
  renderingEngine: Types.IRenderingEngine | null;
  viewportsInfo: Map<number, ViewportInfo>;
  viewportGridResizeObserver: ResizeObserver | null;

  /**
   * Service-specific
   */
  EVENTS: { [key: string]: string };
  listeners: { [key: string]: Function[] };
  _broadcastEvent: unknown; // we should be able to extend the PubSub class to get this
  // Some configs
  enableResizeDetector: true;
  resizeRefreshRateMs: 200;
  resizeRefreshMode: 'debounce';

  constructor() {
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.viewportsInfo = new Map();
    //
    this.listeners = {};
    this.EVENTS = EVENTS;
    Object.assign(this, pubSubServiceInterface);
    //
  }

  /**
   * Adds the HTML element to the viewportService
   * @param {*} viewportIndex
   * @param {*} elementRef
   */
  public enableElement(viewportIndex: number, elementRef: HTMLDivElement) {
    const viewportInfo = new ViewportInfo(viewportIndex);
    viewportInfo.setElement(elementRef);
    this.viewportsInfo.set(viewportIndex, viewportInfo);
  }

  /**
   * It retrieves the renderingEngine if it does exist, or creates one otherwise
   * @returns {RenderingEngine} rendering engine
   */
  public getRenderingEngine() {
    // get renderingEngine from cache if it exists
    const renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);

    if (renderingEngine) {
      this.renderingEngine = renderingEngine;
      return this.renderingEngine;
    }

    if (!renderingEngine || renderingEngine.hasBeenDestroyed) {
      this.renderingEngine = new RenderingEngine(RENDERING_ENGINE_ID);
    }

    return this.renderingEngine;
  }

  /**
   * It triggers the resize on the rendering engine.
   */
  public resize() {
    const immediate = true;
    const resetPan = false;
    const resetZoom = false;
    this.renderingEngine.resize(immediate, resetPan, resetZoom);
    this.renderingEngine.render();
  }

  /**
   * Removes the viewport from cornerstone-3D, and destroys the rendering engine
   */
  public destroy() {
    this._removeResizeObserver();
    this.viewportGridResizeObserver = null;
    this.renderingEngine.destroy();
    this.renderingEngine = null;
  }

  /**
   * Disables the viewport inside the renderingEngine, if no viewport is left
   * it destroys the renderingEngine.
   * @param viewportIndex
   */
  public disableElement(viewportIndex: number) {
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    if (!viewportInfo) {
      return;
    }

    const viewportId = viewportInfo.getViewportId();
    this.renderingEngine.disableElement(viewportId);
    this.viewportsInfo.delete(viewportIndex);

    if (this.viewportsInfo.size === 0) {
      this.destroy();
    }
  }

  /**
   * Uses the renderingEngine to enable the element for the given viewport index
   * and sets the displaySet data to the viewport
   * @param {*} viewportIndex
   * @param {*} displaySet
   * @param {*} dataSource
   * @returns
   */
  public setViewportDisplaySets(
    viewportIndex: number,
    viewportData: unknown,
    viewportOptions: ViewportOptions,
    displaySetOptions: DisplaySetOptions[]
  ): void {
    const renderingEngine = this.getRenderingEngine();
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    viewportInfo.setRenderingEngineId(renderingEngine.id);

    // If new viewportOptions are provided and have keys that are not in the
    // current viewportOptions, then we need to update the viewportOptions,
    // else we inherit the current viewportOptions.
    const currentViewportOptions = viewportInfo.getViewportOptions();
    let viewportOptionsToUse = currentViewportOptions;
    if (Object.keys(viewportOptions)) {
      viewportOptionsToUse = {
        ...currentViewportOptions,
        ...viewportOptions,
      };
    }
    viewportInfo.setViewportOptions(viewportOptionsToUse);

    const currentDisplaySetOptions = viewportInfo.getDisplaySetOptions();
    let displaySetOptionsToUse = currentDisplaySetOptions;
    if (displaySetOptions?.length) {
      displaySetOptionsToUse = [...displaySetOptions];
    }
    viewportInfo.setDisplaySetOptions(displaySetOptionsToUse);

    this._broadcastEvent(EVENTS.VIEWPORT_INFO_CREATED, viewportInfo);

    const viewportId = viewportInfo.getViewportId();
    const element = viewportInfo.getElement();
    const type = viewportInfo.getViewportType();
    const background = viewportInfo.getBackground();
    const orientation = viewportInfo.getOrientation();

    const viewportInput: Types.PublicViewportInput = {
      viewportId,
      element,
      type,
      defaultOptions: {
        background,
        orientation,
      },
    };

    renderingEngine.enableElement(viewportInput);
    this._setDisplaySets(viewportId, viewportData, viewportInfo);
  }

  public getCornerstone3DViewport(viewportId: string): StackViewport | null {
    const viewportInfo = this.getViewportInfoById(viewportId);

    if (!viewportInfo) {
      return null;
    }

    const viewport = this.renderingEngine.getViewport(viewportId);

    return viewport;
  }

  /**
   * Returns the viewportIndex for the provided viewportId
   * @param {string} viewportId - the viewportId
   * @returns {number} - the viewportIndex
   */
  public getViewportInfoByIndex(viewportIndex: number): ViewportInfo {
    return this.viewportsInfo.get(viewportIndex);
  }

  public getViewportInfoById(viewportId: string): ViewportInfo {
    // @ts-ignore
    for (const [index, viewport] of this.viewportsInfo.entries()) {
      if (viewport.getViewportId() === viewportId) {
        return viewport;
      }
    }
    return null;
  }

  _setStackViewport(viewport, viewportData, viewportInfo) {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    const { imageIds, initialImageIdIndex } = viewportData.stack;
    const { voi, voiInverted } = displaySetOptions[0];

    const properties = {};
    if (voi.windowWidth || voi.windowCenter) {
      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        voi.windowWidth,
        voi.windowCenter
      );
      properties.voiRange = { lower, upper };
    }

    if (voiInverted !== undefined) {
      properties.invert = voiInverted;
    }

    viewport.setStack(imageIds, initialImageIdIndex).then(() => {
      viewport.setProperties(properties);
      csUtils.prefetchStack(imageIds);
    });
  }

  _setDisplaySets(
    viewportId: string,
    viewportData: unknown,
    viewportInfo: ViewportInfo
  ): void {
    const viewport = this.getCornerstone3DViewport(viewportId);

    if (viewport instanceof StackViewport) {
      this._setStackViewport(viewport, viewportData, viewportInfo);
    } else {
      throw new Error('Unsupported viewport type');
    }
  }

  /**
   * Removes the resize observer from the viewport element
   */
  _removeResizeObserver() {
    if (this.viewportGridResizeObserver) {
      this.viewportGridResizeObserver.disconnect();
    }
  }
}

export default new Cornerstone3DViewportService();
