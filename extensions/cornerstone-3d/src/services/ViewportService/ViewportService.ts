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
import ViewportInfo, {
  ViewportOptions,
  DisplaySet,
  DisplaySetOptions,
} from './Viewport';

const EVENTS = {
  VIEWPORT_INFO_CREATED:
    'event::cornerstone-3d::viewportservice:viewportinfocreated',
};

/**
 * Handles cornerstone-3D viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class ViewportService implements IViewportService {
  servicesManager: unknown;
  HangingProtocolService: unknown;
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

  constructor(servicesManager) {
    this.servicesManager = servicesManager;
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.viewportsInfo = new Map();
    //
    this.listeners = {};
    this.EVENTS = EVENTS;
    Object.assign(this, pubSubServiceInterface);
    //
    const { HangingProtocolService } = servicesManager.services;
    this.HangingProtocolService = HangingProtocolService;
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
    const resetPanZoomForViewPlane = false;
    this.renderingEngine.resize(immediate, resetPanZoomForViewPlane);
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
    displaySets: unknown[],
    viewportOptions: ViewportOptions,
    displaySetOptions: unknown[],
    dataSource: unknown
  ) {
    const renderingEngine = this.getRenderingEngine();
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    viewportInfo.setRenderingEngineId(renderingEngine.id);

    const currentViewportOptions = viewportInfo.getViewportOptions();
    // If new viewportOptions are provided and have keys that are not in the
    // current viewportOptions, then we need to update the viewportOptions,
    // else we inherit the current viewportOptions.
    if (Object.keys(viewportOptions)) {
      const newViewportOptions = {
        ...currentViewportOptions,
        ...viewportOptions,
      };
      viewportInfo.setViewportOptions(newViewportOptions);
    } else {
      viewportInfo.setViewportOptions(currentViewportOptions);
    }

    // Todo: handle changed displaySetOptions

    viewportInfo.setDisplaySets(displaySets, displaySetOptions);

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
    this._setDisplaySets(
      viewportId,
      displaySets,
      viewportOptions,
      displaySetOptions,
      dataSource
    );
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

  _setStackViewport(viewport, displaySet, displaySetOptions, dataSource) {
    const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
    viewport.setStack(imageIds).then(() => {
      csUtils.prefetchStack(imageIds);
    });
  }

  _setDisplaySets(
    viewportId: string,
    displaySets: DisplaySet[],
    viewportOptions: ViewportOptions,
    displaySetOptions: DisplaySetOptions,
    dataSource: unknown
  ) {
    const viewport = this.renderingEngine.getViewport(viewportId);

    if (viewport instanceof StackViewport) {
      // Todo: No fusion on StackViewport Yet
      this._setStackViewport(
        viewport,
        displaySets[0],
        displaySetOptions[0],
        dataSource
      );
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

export default ViewportService;
