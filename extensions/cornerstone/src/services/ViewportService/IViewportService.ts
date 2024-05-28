import { Types } from '@cornerstonejs/core';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import { DisplaySetOptions, PublicViewportOptions } from './Viewport';
import { Presentations } from '../../types/Presentation';

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
export interface IViewportService {
  servicesManager: AppTypes.ServicesManager;
  hangingProtocolService: unknown;
  renderingEngine: unknown;
  viewportGridResizeObserver: unknown;
  viewportsInfo: unknown;
  sceneVolumeInputs: unknown;
  viewportDivElements: unknown;
  ViewportPropertiesMap: unknown;
  volumeUIDs: unknown;
  listeners: { [key: string]: {} };
  displaySetsNeedRerendering: unknown;
  viewportDisplaySets: unknown;
  EVENTS: { [key: string]: string };
  _broadcastEvent: unknown;
  /**
   * Adds the HTML element to the viewportService
   * @param {*} elementRef
   */
  enableViewport(viewportId: string, elementRef: HTMLDivElement): void;
  /**
   * It retrieves the renderingEngine if it does exist, or creates one otherwise
   * @returns {RenderingEngine} rendering engine
   */
  getRenderingEngine(): Types.IRenderingEngine;
  /**
   * It creates  a resize observer for the viewport element, and observes
   * the element for resizing events
   * @param {*} elementRef
   */
  resize(isGridResize: boolean): void;
  /**
   * Removes the viewport from cornerstone, and destroys the rendering engine
   */
  destroy(): void;
  /**
   * Disables the viewport inside the renderingEngine, if no viewport is left
   * it destroys the renderingEngine.
   * @param viewportId
   */
  disableElement(viewportId: string): void;
  /**
   * Uses the renderingEngine to enable the element for the given viewport index
   * and sets the displaySet data to the viewport
   * @param {*} displaySet
   * @param {*} dataSource
   * @returns
   */
  setViewportData(
    viewportId: string,
    viewportData: StackViewportData | VolumeViewportData,
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[],
    presentations?: Presentations
  ): void;
}
