import { pubSubServiceInterface } from '@ohif/core';
import {
  RenderingEngine,
  StackViewport,
  Enums,
  Types,
  getRenderingEngine,
  utilities as csUtils,
  VolumeViewport,
  cache,
} from '@cornerstonejs/core';

import { utilities as csToolsUtils } from '@cornerstonejs/tools';
import { IViewportService } from './IViewportService';
import { RENDERING_ENGINE_ID } from './constants';
import ViewportInfo, {
  ViewportOptions,
  DisplaySetOptions,
  PublicViewportOptions,
} from './Viewport';
import { StackData, VolumeData } from './CornerstoneCacheService';
import {
  setColormap,
  setLowerUpperColorTransferFunction,
} from '../../utils/colormap/transferFunctionHelpers';

import JumpPresets from '../../utils/JumpPresets';

const EVENTS = {
  VIEWPORT_INFO_CREATED:
    'event::cornerstone::viewportservice:viewportinfocreated',
};

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class CornerstoneViewportService implements IViewportService {
  renderingEngine: Types.IRenderingEngine | null;
  viewportsInfo: Map<number, ViewportInfo>;
  viewportGridResizeObserver: ResizeObserver | null;
  // TODO - get the right type here.
  hangingProtocolService: object;

  /**
   * Service-specific
   */
  EVENTS: { [key: string]: string };
  listeners: { [key: string]: Array<(...args: any[]) => void> };
  _broadcastEvent: unknown; // we should be able to extend the PubSub class to get this
  // Some configs
  enableResizeDetector: true;
  resizeRefreshRateMs: 200;
  resizeRefreshMode: 'debounce';

  constructor(servicesManager) {
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.viewportsInfo = new Map();
    //
    this.listeners = {};
    this.EVENTS = EVENTS;
    const { HangingProtocolService } = servicesManager.services;
    this.hangingProtocolService = HangingProtocolService;
    Object.assign(this, pubSubServiceInterface);
    //
  }

  /**
   * Adds the HTML element to the viewportService
   * @param {*} viewportIndex
   * @param {*} elementRef
   */
  public enableElement(
    viewportIndex: number,
    viewportOptions: PublicViewportOptions,
    elementRef: HTMLDivElement
  ) {
    const viewportId =
      viewportOptions.viewportId || this.getViewportId(viewportIndex);
    const viewportInfo = new ViewportInfo(viewportIndex, viewportId);
    viewportInfo.setElement(elementRef);
    this.viewportsInfo.set(viewportIndex, viewportInfo);
  }

  public getViewportId(viewportIndex: number): string {
    return `viewport-${viewportIndex}`;
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
   * Removes the viewport from cornerstone, and destroys the rendering engine
   */
  public destroy() {
    this._removeResizeObserver();
    this.viewportGridResizeObserver = null;
    this.renderingEngine.destroy();
    this.renderingEngine = null;
    cache.purgeVolumeCache();
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
    viewportData: StackData | VolumeData,
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[]
  ): void {
    const renderingEngine = this.getRenderingEngine();
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    viewportInfo.setRenderingEngineId(renderingEngine.id);

    const {
      viewportOptions,
      displaySetOptions,
    } = this._getViewportAndDisplaySetOptions(
      publicViewportOptions,
      publicDisplaySetOptions,
      viewportInfo
    );

    viewportInfo.setViewportOptions(viewportOptions);
    viewportInfo.setDisplaySetOptions(displaySetOptions);

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

    // Todo: this is not optimal at all, we are re-enabling the already enabled
    // element which is not what we want. But enabledElement as part of the
    // renderingEngine is designed to be used like this. This will trigger
    // ENABLED_ELEMENT again and again, which will run onEnableElement callbacks
    renderingEngine.enableElement(viewportInput);
    this._setDisplaySets(viewportId, viewportData, viewportInfo);
  }

  public getCornerstoneViewport(
    viewportId: string
  ): Types.IStackViewport | Types.IVolumeViewport | null {
    const viewportInfo = this.getViewportInfo(viewportId);

    if (
      !viewportInfo ||
      !this.renderingEngine ||
      this.renderingEngine.hasBeenDestroyed
    ) {
      return null;
    }

    const viewport = this.renderingEngine.getViewport(viewportId);

    return viewport;
  }

  public getCornerstoneViewportByIndex(
    viewportIndex: number
  ): Types.IStackViewport | Types.IVolumeViewport | null {
    const viewportInfo = this.getViewportInfoByIndex(viewportIndex);

    if (
      !viewportInfo ||
      !this.renderingEngine ||
      this.renderingEngine.hasBeenDestroyed
    ) {
      return null;
    }

    const viewport = this.renderingEngine.getViewport(
      viewportInfo.getViewportId()
    );

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

  public getViewportInfo(viewportId: string): ViewportInfo {
    // @ts-ignore
    for (const [index, viewport] of this.viewportsInfo.entries()) {
      if (viewport.getViewportId() === viewportId) {
        return viewport;
      }
    }
    return null;
  }

  _setStackViewport(
    viewport: Types.IStackViewport,
    viewportData: StackData,
    viewportInfo: ViewportInfo
  ) {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();
    const viewportOptions = viewportInfo.getViewportOptions();
    const { imageIds, initialImageIndex } = viewportData;
    const { hangingProtocolService } = this;

    let initialImageIndexToUse = initialImageIndex;

    if (!initialImageIndexToUse) {
      initialImageIndexToUse =
        this._getInitialImageIndexForStackViewport(viewportInfo, imageIds) || 0;
    }

    const { voi, voiInverted } = displaySetOptions[0];
    const properties = {};
    if (voi && (voi.windowWidth || voi.windowCenter)) {
      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        voi.windowWidth,
        voi.windowCenter
      );
      properties.voiRange = { lower, upper };
    }

    if (voiInverted !== undefined) {
      properties.invert = voiInverted;
    }

    viewport.setStack(imageIds, initialImageIndexToUse).then(() => {
      viewport.setProperties(properties);
    });
  }

  private _getInitialImageIndexForStackViewport(
    viewportInfo: ViewportInfo,
    imageIds?: string[]
  ): number {
    const initialImageOptions = viewportInfo.getInitialImageOptions();

    if (!initialImageOptions) {
      return;
    }

    const { index, preset } = initialImageOptions;
    return this._getInitialImageIndex(imageIds.length, index, preset);
  }

  _getInitialImageIndex(
    numberOfSlices: number,
    imageIndex?: number,
    preset?: JumpPresets
  ): number {
    const lastSliceIndex = numberOfSlices - 1;

    if (imageIndex !== undefined) {
      return csToolsUtils.clip(imageIndex, 0, lastSliceIndex);
    }

    if (preset === JumpPresets.First) {
      return 0;
    }

    if (preset === JumpPresets.Last) {
      return lastSliceIndex;
    }

    if (preset === JumpPresets.Middle) {
      return Math.floor(lastSliceIndex / 2);
    }

    return 0;
  }

  async _setVolumeViewport(
    viewport: Types.IVolumeViewport,
    viewportData: VolumeData,
    viewportInfo: ViewportInfo
  ): Promise<void> {
    // TODO: We need to overhaul the way data sources work so requests can be made
    // async. I think we should follow the image loader pattern which is async and
    // has a cache behind it.
    // The problem is that to set this volume, we need the metadata, but the request is
    // already in-flight, and the promise is not cached, so we have no way to wait for
    // it and know when it has fully arrived.
    // loadStudyMetadata(StudyInstanceUID) => Promise([instances for study])
    // loadSeriesMetadata(StudyInstanceUID, SeriesInstanceUID) => Promise([instances for series])
    // If you call loadStudyMetadata and it's not in the DicomMetadataStore cache, it should fire
    // a request through the data source?
    // (This call may or may not create sub-requests for series metadata)
    const volumeInputArray = [];
    const displaySetOptionsArray = viewportInfo.getDisplaySetOptions();
    const { hangingProtocolService } = this;

    for (let i = 0; i < viewportData.imageIds.length; i++) {
      const imageIds = viewportData.imageIds[i];
      const displaySetInstanceUID = viewportData.displaySetInstanceUIDs[i];
      const displaySetOptions = displaySetOptionsArray[i];

      const volumeId = displaySetInstanceUID;

      // if (displaySet.needsRerendering) {
      //   console.warn('Removing volume from cache', volumeId);
      //   cache.removeVolumeLoadObject(volumeId);
      //   displaySet.needsRerendering = false;
      //   this.displaySetsNeedRerendering.add(displaySet.displaySetInstanceUID);
      // }

      const voiCallbacks = this._getVOICallbacks(volumeId, displaySetOptions);

      const callback = ({ volumeActor }) => {
        voiCallbacks.forEach(callback => callback(volumeActor));
      };

      volumeInputArray.push({
        imageIds,
        volumeId,
        callback,
        blendMode: displaySetOptions.blendMode,
        slabThickness: this._getSlabThickness(displaySetOptions, volumeId),
      });
    }

    if (
      hangingProtocolService.hasCustomImageLoadStrategy() &&
      !hangingProtocolService.customImageLoadPerformed
    ) {
      // delegate the volume loading to the hanging protocol service if it has a custom image load strategy
      return hangingProtocolService.runImageLoadStrategy({
        viewportId: viewport.id,
        volumeInputArray,
      });
    }

    viewportData.volumes.forEach(volume => {
      volume.load();
    });

    this.setVolumesForViewport(viewport, volumeInputArray);
  }

  public setVolumesForViewport(viewport, volumeInputArray) {
    viewport.setVolumes(volumeInputArray).then(() => {
      const viewportInfo = this.getViewportInfo(viewport.id);
      const initialImageOptions = viewportInfo.getInitialImageOptions();

      if (
        initialImageOptions &&
        (initialImageOptions.preset !== undefined ||
          initialImageOptions.index !== undefined)
      ) {
        const { index, preset } = initialImageOptions;

        const { numberOfSlices } = csUtils.getImageSliceDataForVolumeViewport(
          viewport
        );

        const imageIndex = this._getInitialImageIndex(
          numberOfSlices,
          index,
          preset
        );

        csToolsUtils.jumpToSlice(viewport.element, {
          imageIndex,
        });
      }

      viewport.render();
    });
  }

  public updateViewport(viewportIndex, viewportData) {
    const viewportInfo = this.getViewportInfoByIndex(viewportIndex);

    const viewportId = viewportInfo.getViewportId();
    const viewport = this.getCornerstoneViewport(viewportId);

    if (viewport instanceof VolumeViewport) {
      this._setVolumeViewport(viewport, viewportData, viewportInfo);
      return;
    }

    if (viewport instanceof StackViewport) {
      this._setStackViewport(viewport, viewportData, viewportInfo);
      return;
    }
  }

  _getVOICallbacks(volumeId, displaySetOptions) {
    const { voi, voiInverted: inverted, colormap } = displaySetOptions;

    const voiCallbackArray = [];

    // If colormap is set, use it to set the color transfer function
    if (colormap) {
      voiCallbackArray.push(volumeActor => setColormap(volumeActor, colormap));
    }

    if (voi instanceof Object && voi.windowWidth && voi.windowCenter) {
      const { windowWidth, windowCenter } = voi;
      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        windowWidth,
        windowCenter
      );
      voiCallbackArray.push(volumeActor =>
        setLowerUpperColorTransferFunction({
          volumeActor,
          lower,
          upper,
          inverted,
        })
      );
    }

    return voiCallbackArray;
  }

  _setDisplaySets(
    viewportId: string,
    viewportData: StackData | VolumeData,
    viewportInfo: ViewportInfo
  ): void {
    const viewport = this.getCornerstoneViewport(viewportId);

    if (viewport instanceof StackViewport) {
      this._setStackViewport(viewport, viewportData as StackData, viewportInfo);
    } else if (viewport instanceof VolumeViewport) {
      this._setVolumeViewport(
        viewport,
        viewportData as VolumeData,
        viewportInfo
      );
    } else {
      throw new Error('Unknown viewport type');
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

  _getSlabThickness(displaySetOptions, volumeId) {
    const { blendMode } = displaySetOptions;
    if (
      blendMode === undefined ||
      displaySetOptions.slabThickness === undefined
    ) {
      return;
    }

    // if there is a slabThickness set as a number then use it
    if (typeof displaySetOptions.slabThickness === 'number') {
      return displaySetOptions.slabThickness;
    }

    if (displaySetOptions.slabThickness.toLowerCase() === 'fullvolume') {
      // calculate the slab thickness based on the volume dimensions
      const imageVolume = cache.getVolume(volumeId);

      const { dimensions } = imageVolume;
      const slabThickness = Math.sqrt(
        dimensions[0] * dimensions[0] +
          dimensions[1] * dimensions[1] +
          dimensions[2] * dimensions[2]
      );

      return slabThickness;
    }
  }

  _getViewportAndDisplaySetOptions(
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[],
    viewportInfo: ViewportInfo
  ): {
    viewportOptions: ViewportOptions;
    displaySetOptions: DisplaySetOptions[];
    } {
    const viewportIndex = viewportInfo.getViewportIndex();

    // Creating a temporary viewportInfo to handle defaults
    const newViewportInfo = new ViewportInfo(
      viewportIndex,
      viewportInfo.getViewportId()
    );

    // To handle setting the default values if missing for the viewportOptions and
    // displaySetOptions
    newViewportInfo.setPublicViewportOptions(publicViewportOptions);
    newViewportInfo.setPublicDisplaySetOptions(publicDisplaySetOptions);

    const newViewportOptions = newViewportInfo.getViewportOptions();
    const newDisplaySetOptions = newViewportInfo.getDisplaySetOptions();

    return {
      viewportOptions: newViewportOptions,
      displaySetOptions: newDisplaySetOptions,
    };
  }
}

export default function ExtendedCornerstoneViewportService(serviceManager) {
  return {
    name: 'CornerstoneViewportService',
    create: ({ configuration = {} }) => {
      return new CornerstoneViewportService(serviceManager);
    },
  };
}
