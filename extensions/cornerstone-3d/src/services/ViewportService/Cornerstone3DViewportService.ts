import { pubSubServiceInterface } from '@ohif/core';
import {
  RenderingEngine,
  StackViewport,
  Types,
  getRenderingEngine,
  utilities as csUtils,
  Enums,
  volumeLoader,
  VolumeViewport,
} from '@cornerstonejs/core';
import { IViewportService } from './IViewportService';
import { RENDERING_ENGINE_ID } from './constants';
import ViewportInfo, {
  ViewportOptions,
  DisplaySetOptions,
  PublicViewportOptions,
} from './Viewport';
import { StackData, VolumeData } from './Cornerstone3DCacheService';
import {
  setColorTransferFunctionFromVolumeMetadata,
  setColormap,
  setLowerUpperColorTransferFunction,
} from '../../utils/colormap/transferFunctionHelpers';

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
  listeners: { [key: string]: Array<(...args: any[]) => void> };
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
    const viewportId = this.getViewportId(viewportIndex);
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

  public getCornerstone3DViewport(
    viewportId: string
  ): Types.IStackViewport | null {
    const viewportInfo = this.getViewportInfoById(viewportId);

    if (
      !viewportInfo ||
      !this.renderingEngine ||
      this.renderingEngine.hasBeenDestroyed
    ) {
      return null;
    }

    const viewport = this.renderingEngine.getViewport(
      viewportId
    ) as Types.IStackViewport;

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

  _setStackViewport(
    viewport: Types.IStackViewport,
    viewportData: StackData,
    viewportInfo: ViewportInfo
  ) {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    const { imageIds, initialImageIdIndex } = viewportData;
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

    viewport.setStack(imageIds, initialImageIdIndex).then(() => {
      viewport.setProperties(properties);
      csUtils.prefetchStack(imageIds);
    });
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
    //
    // If you call loadSeriesMetadata and a request is ongoing for the study, you have to wait for
    // that? Or should it force a separate request? May be slower?
    // For the moment I just stuck this whole operation in a setTimeout so we are sure the
    // metadata has arrived
    // const viewportVolumeInputs = {};
    // const displaySetOptionsArray = viewportInfo.getDisplaySetOptions();

    // for (let i = 0; i < viewportData.imageIds.length; i++) {
    //   const imageIds = viewportData.imageIds[i];
    //   const displaySetInstanceUID = viewportData.displaySetInstanceUIDs[i];
    //   const displaySetOptions = displaySetOptionsArray[i];

    //   // We need to get the volumeId again here since, for toolGroups
    //   // right now we only have one volume per viewport, but for
    //   // rendering we can have multiple volumes per viewport
    //   const volumeId = displaySetInstanceUID;

    //   // if (displaySet.needsRerendering) {
    //   //   console.warn('Removing volume from cache', volumeId);
    //   //   cache.removeVolumeLoadObject(volumeId);
    //   //   displaySet.needsRerendering = false;
    //   //   this.displaySetsNeedRerendering.add(displaySet.displaySetInstanceUID);
    //   // }

    //   // let blendMode = option.blendMode ? option.blendMode : undefined;
    //   // let sbThickness = option.slabThickness ? option.slabThickness : undefined;

    //   const callback = this._getVOICallback(volumeId, displaySetOptions);

    //   viewportVolumeInputs[volumeId] = {
    //     imageIds,
    //     volumeId,
    //     callback,
    //     blendMode: displaySetOptions.blendMode,
    //     slabThickness: displaySetOptions.blendMode
    //       ? displaySetOptions.slabThickness || 500
    //       : undefined,
    //   };
    // }

    // const volumes = [];

    // for (const viewportVolumeInput of Object.values(viewportVolumeInputs)) {
    //   const { imageIds, volumeId } = viewportVolumeInput;
    //   const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    //     imageIds,
    //   });

    //   volumes.push(volume);
    // }

    // // Todo: this is only for the first load from hanging protocol, if
    // // viewport gets a new display set (from drag and drop) we don't want to
    // // use the hanging protocol image loading strategy
    // // const hasCustomLoad = this.HangingProtocolService.hasCustomImageLoadStrategy();

    // // If the hangingProtocol has specified a custom image loading strategy, use it.
    // // Otherwise, use the default image loading strategy which is based on the
    // // sorted imageIds in the volume. In addition, if displaysets has been
    // // invalidated and need to be re-rendered, we need to use the default image
    // // loading strategy.
    // // const displaySetShouldReRender = displaySets.some(displaySet => {
    // //   return this.displaySetsNeedRerendering.has(
    // //     displaySet.displaySetInstanceUID
    // //   );
    // // });

    // // if (!displaySetShouldReRender && hasCustomLoad) {
    // //   return;
    // // }

    // volumes.forEach(volume => {
    //   volume.load();
    // });

    // // this.initiateLoad(viewport.uid);

    // // const volumeInputs = this.sceneVolumeInputs.get(sceneUID);
    // // const viewportOptions = this.viewportOptions.get(viewportUID);

    // // if (viewportOptions && viewportOptions.initialView) {
    // //   this._setInitialView(viewportUID, sceneUID, viewportOptions.initialView);
    // // }
    // viewport.setVolumes(Object.values(viewportVolumeInputs));

    const callbacks = [];
    const blendModes = [];
    const slabThickness = [];
    const viewportVolumeInputs = {};
    const volumeIds = [];
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    for (let i = 0; i < viewportData.imageIds.length; i++) {
      const imageIds = viewportData.imageIds[i];
      const displaySetInstanceUID = viewportData.displaySetInstanceUIDs[i];

      // We need to get the volumeId again here since, for toolGroups
      // right now we only have one volume per viewport, but for
      // rendering we can have multiple volumes per viewport
      const volumeId = displaySetInstanceUID;

      viewportVolumeInputs[volumeId] = {
        imageIds,
      };

      // if (displaySet.needsRerendering) {
      //   console.warn('Removing volume from cache', volumeId);
      //   cache.removeVolumeLoadObject(volumeId);
      //   displaySet.needsRerendering = false;
      //   this.displaySetsNeedRerendering.add(displaySet.displaySetInstanceUID);
      // }

      // let blendMode = option.blendMode ? option.blendMode : undefined;
      // let sbThickness = option.slabThickness ? option.slabThickness : undefined;

      // if (blendMode && blendMode === MIP) {
      //   // Only make the MIP as large as it needs to be.
      //   blendMode = BlendMode.MAXIMUM_INTENSITY_BLEND;

      //   if (sbThickness) {
      //     // const { dimensions } = volume;
      //     // Todo: We don't have the volume dimensions yet.
      //     // we are setting it to a high value for now, but we need to get the
      //     // volume dimensions from the volume or from options
      //     sbThickness = 500;
      //   }
      // }

      const callback = this._getVOICallback(volumeId, displaySetOptions[i]);

      volumeIds.push(volumeId);
      callbacks.push(callback);
      // blendModes.push(blendMode);
      // slabThickness.push(sbThickness);
    }

    const volumeInputs = [];
    volumeIds.forEach((volumeId, index) => {
      volumeInputs.push({
        volumeId: volumeIds[index],
        callback: callbacks[index],
        // blendMode: blendModes[index],
        // slabThickness: slabThickness[index],
      });
    });

    const volumes = [];
    for (const volumeId of Object.keys(viewportVolumeInputs)) {
      const { imageIds } = viewportVolumeInputs[volumeId];
      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
      });
      volumes.push(volume);

      volume.load();
    }

    // Todo: this is only for the first load from hanging protocol, if
    // viewport gets a new display set (from drag and drop) we don't want to
    // use the hanging protocol image loading strategy
    // const hasCustomLoad = this.HangingProtocolService.hasCustomImageLoadStrategy();

    // If the hangingProtocl has specified a custom image loading strategy, use it.
    // Otherwise, use the default image loading strategy which is based on the
    // sorted imageIds in the volume. In addition, if displaysets has been
    // invalidated and need to be re-rendered, we need to use the default image
    // loading strategy.
    // const displaySetShouldReRender = displaySets.some(displaySet => {
    //   return this.displaySetsNeedRerendering.has(
    //     displaySet.displaySetInstanceUID
    //   );
    // });

    // if (!displaySetShouldReRender && hasCustomLoad) {
    //   return;
    // }

    volumes.forEach(volume => {
      volume.load();
    });

    // this.initiateLoad(viewport.uid);

    // const volumeInputs = this.sceneVolumeInputs.get(sceneUID);
    // const viewportOptions = this.viewportOptions.get(viewportUID);

    // if (viewportOptions && viewportOptions.initialView) {
    //   this._setInitialView(viewportUID, sceneUID, viewportOptions.initialView);
    // }
    viewport.setVolumes([
      ...volumeInputs.map(({ volumeId, callback }) => {
        return {
          volumeId,
          callback,
        };
      }),
    ]);
  }

  _getVOICallback(volumeId, displaySetOptions) {
    const { voi, voiInverted: inverted, colormap } = displaySetOptions;

    // If colormap is set, use it to set the color transfer function
    let voiCallback;
    if (colormap) {
      voiCallback = ({ volumeActor }) => setColormap(volumeActor, colormap);
      return voiCallback;
    }

    if (voi instanceof Object && voi.windowWidth && voi.windowCenter) {
      const { windowWidth, windowCenter } = voi;
      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        windowWidth,
        windowCenter
      );
      voiCallback = ({ volumeActor }) =>
        setLowerUpperColorTransferFunction({
          volumeActor,
          lower,
          upper,
          inverted,
        });
    } else {
      voiCallback = ({ volumeActor }) =>
        setColorTransferFunctionFromVolumeMetadata({
          volumeActor,
          volumeId,
          inverted,
        });
    }

    return voiCallback;
  }

  _setDisplaySets(
    viewportId: string,
    viewportData: StackData | VolumeData,
    viewportInfo: ViewportInfo
  ): void {
    const viewport = this.getCornerstone3DViewport(viewportId);

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

  _getViewportAndDisplaySetOptions(
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[],
    viewportInfo: ViewportInfo
  ): {
    viewportOptions: ViewportOptions;
    displaySetOptions: DisplaySetOptions[];
  } {
    const viewportIndex = viewportInfo.getViewportIndex();
    // If new viewportOptions are provided and have keys that are not in the
    // current viewportOptions, then we need to update the viewportOptions,
    // else we inherit the current viewportOptions.
    const currentViewportOptions = viewportInfo.getViewportOptions();
    const currentDisplaySetOptions = viewportInfo.getDisplaySetOptions();

    let viewportOptionsToUse = currentViewportOptions;

    // Creating a temporary viewportInfo to handle defaults
    const newViewportInfo = new ViewportInfo(
      viewportIndex,
      viewportInfo.getViewportId()
    );
    newViewportInfo.setPublicViewportOptions(publicViewportOptions);
    newViewportInfo.setPublicDisplaySetOptions(publicDisplaySetOptions);

    const newViewportOptions = newViewportInfo.getViewportOptions();
    const newDisplaySetOptions = newViewportInfo.getDisplaySetOptions();

    viewportOptionsToUse = {
      ...currentViewportOptions,
      ...newViewportOptions,
    };

    const displaySetOptionsToUse = [];
    for (const index in newDisplaySetOptions) {
      const newDisplaySetOption = newDisplaySetOptions[index];
      const currentDisplaySetOption = currentDisplaySetOptions[index];

      if (newDisplaySetOption) {
        displaySetOptionsToUse.push({
          ...currentDisplaySetOption,
          ...newDisplaySetOption,
        });
      }
    }

    return {
      viewportOptions: viewportOptionsToUse,
      displaySetOptions: displaySetOptionsToUse,
    };
  }
}

const cornerstone3DViewportService = new Cornerstone3DViewportService();
window.cornerstone3DViewportService = cornerstone3DViewportService;
export default cornerstone3DViewportService;
