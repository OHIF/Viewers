import { Types } from '@cornerstonejs/core';
import { StackData, VolumeData } from '../../types/CornerstoneCacheService';
import {
  DisplaySetOptions,
  PublicViewportOptions,
  ViewportOptions,
} from './Viewport';

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
export interface IViewportService {
  servicesManager: unknown;
  hangingProtocolService: unknown;
  renderingEngine: unknown;
  viewportGridResizeObserver: unknown;
  viewportsInfo: unknown;
  sceneVolumeInputs: unknown;
  viewportIndexUIDMap: unknown;
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
   * @param {*} viewportIndex
   * @param {*} elementRef
   */
  enableViewport(
    viewportIndex: number,
    viewportOptions: ViewportOptions,
    elementRef: HTMLDivElement
  ): void;
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
  resize(element: HTMLDivElement): void;
  /**
   * Removes the viewport from cornerstone, and destroys the rendering engine
   */
  destroy(): void;
  /**
   * Disables the viewport inside the renderingEngine, if no viewport is left
   * it destroys the renderingEngine.
   * @param viewportIndex
   */
  disableElement(viewportIndex: number): void;
  /**
   * Uses the renderingEngine to enable the element for the given viewport index
   * and sets the displaySet data to the viewport
   * @param {*} viewportIndex
   * @param {*} displaySet
   * @param {*} dataSource
   * @returns
   */
  setViewportData(
    viewportIndex: number,
    viewportData: StackData | VolumeData,
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[]
  ): void;
}
