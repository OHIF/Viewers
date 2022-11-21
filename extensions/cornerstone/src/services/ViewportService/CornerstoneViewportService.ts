import { pubSubServiceInterface } from '@ohif/core';
import {
  RenderingEngine,
  StackViewport,
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
import {
  StackViewportData,
  VolumeViewportData,
} from '../../types/CornerstoneCacheService';
import {
  setColormap,
  setLowerUpperColorTransferFunction,
} from '../../utils/colormap/transferFunctionHelpers';

import JumpPresets from '../../utils/JumpPresets';

const EVENTS = {
  VIEWPORT_DATA_CHANGED:
    'event::cornerstoneViewportService:viewportDataChanged',
};

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class CornerstoneViewportService implements IViewportService {
  renderingEngine: Types.IRenderingEngine | null;
  viewportsInfo: Map<number, ViewportInfo>;
  viewportGridResizeObserver: ResizeObserver | null;
  viewportsDisplaySets: Map<string, string[]> = new Map();

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
  servicesManager = null;

  constructor(servicesManager) {
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.viewportsInfo = new Map();
    //
    this.listeners = {};
    this.EVENTS = EVENTS;
    this.servicesManager = servicesManager;
    Object.assign(this, pubSubServiceInterface);
    //
  }

  /**
   * Adds the HTML element to the viewportService
   * @param {*} viewportIndex
   * @param {*} elementRef
   */
  public enableViewport(
    viewportIndex: number,
    viewportOptions: PublicViewportOptions,
    elementRef: HTMLDivElement
  ) {
    const viewportInfo = new ViewportInfo(
      viewportIndex,
      viewportOptions.viewportId
    );
    viewportInfo.setElement(elementRef);
    this.viewportsInfo.set(viewportIndex, viewportInfo);
  }

  public getViewportIds(): string[] {
    const viewportIds = [];

    this.viewportsInfo.forEach(viewportInfo => {
      viewportIds.push(viewportInfo.getViewportId());
    });

    return viewportIds;
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
    const keepCamera = true;

    this.renderingEngine.resize(immediate, keepCamera);
    this.renderingEngine.render();
  }

  /**
   * Removes the viewport from cornerstone, and destroys the rendering engine
   */
  public destroy() {
    this._removeResizeObserver();
    this.viewportGridResizeObserver = null;
    this.renderingEngine.destroy();
    this.viewportsDisplaySets.clear();
    this.renderingEngine = null;
    cache.purgeCache();
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

    this.renderingEngine && this.renderingEngine.disableElement(viewportId);

    this.viewportsInfo.get(viewportIndex).destroy();
    this.viewportsInfo.delete(viewportIndex);
  }

  /**
   * Uses the renderingEngine to enable the element for the given viewport index
   * and sets the displaySet data to the viewport
   * @param {*} viewportIndex
   * @param {*} displaySet
   * @param {*} dataSource
   * @returns
   */
  public setViewportData(
    viewportIndex: number,
    viewportData: StackViewportData | VolumeViewportData,
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[]
  ): void {
    const renderingEngine = this.getRenderingEngine();
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    let viewportId = viewportInfo.getViewportId();

    // if currently there is a viewport with the viewportId, but it is not the same
    // as the one we are trying to set, we need to disable the old one
    // and enable the new one, we could ideally change the name of the viewportId
    // but the viewportId is an integral part in renderers map, tools svg cache
    // etc. which would require a lot of refactoring, for now we will just disable
    // the old one and enable the new one at the end of this function
    let newViewportId = null;
    if (publicViewportOptions?.viewportId !== viewportId) {
      newViewportId = publicViewportOptions.viewportId;
      viewportInfo.setViewportId(newViewportId);

      renderingEngine.disableElement(viewportId);
    }

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
    viewportInfo.setViewportData(viewportData);

    this._broadcastEvent(this.EVENTS.VIEWPORT_DATA_CHANGED, {
      viewportData,
      viewportIndex,
    });

    viewportId = viewportInfo.getViewportId();
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

    const viewport = renderingEngine.getViewport(viewportId);
    this._setDisplaySets(viewport, viewportData, viewportInfo);
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
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo
  ) {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    const {
      imageIds,
      initialImageIndex,
      displaySetInstanceUID,
    } = viewportData.data;

    this.viewportsDisplaySets.set(viewport.id, [displaySetInstanceUID]);

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
      // Note: this is a simple but yet very important formula.
      // since viewport reset works with the middle slice
      // if the below formula is not correct, on a viewport reset
      // it will jump to a different slice than the middle one which
      // was the initial slice, and we have some tools such as Crosshairs
      // which rely on a relative camera modifications and those will break.
      return lastSliceIndex % 2 === 0
        ? lastSliceIndex / 2
        : (lastSliceIndex + 1) / 2;
    }

    return 0;
  }

  async _setVolumeViewport(
    viewport: Types.IVolumeViewport,
    viewportData: VolumeViewportData,
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
    const { HangingProtocolService } = this.servicesManager.services;

    const volumeToLoad = [];
    const displaySetInstanceUIDs = [];

    for (const [index, data] of viewportData.data.entries()) {
      const { volume, imageIds, displaySetInstanceUID } = data;

      displaySetInstanceUIDs.push(displaySetInstanceUID);

      if (!volume) {
        continue;
      }

      volumeToLoad.push(volume);

      const displaySetOptions = displaySetOptionsArray[index];
      const { volumeId } = volume;

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

    this.viewportsDisplaySets.set(viewport.id, displaySetInstanceUIDs);

    if (
      HangingProtocolService.hasCustomImageLoadStrategy() &&
      !HangingProtocolService.customImageLoadPerformed
    ) {
      // delegate the volume loading to the hanging protocol service if it has a custom image load strategy
      return HangingProtocolService.runImageLoadStrategy({
        viewportId: viewport.id,
        volumeInputArray,
      });
    }

    volumeToLoad.forEach(volume => {
      volume.load();
    });

    // This returns the async continuation only
    return this.setVolumesForViewport(viewport, volumeInputArray);
  }

  public async setVolumesForViewport(viewport, volumeInputArray) {
    const {
      DisplaySetService,
      SegmentationService,
      ToolGroupService,
    } = this.servicesManager.services;

    await viewport.setVolumes(volumeInputArray);

    // load any secondary displaySets
    const displaySetInstanceUIDs = this.viewportsDisplaySets.get(viewport.id);

    const segDisplaySet = displaySetInstanceUIDs
      .map(DisplaySetService.getDisplaySetByUID)
      .find(displaySet => displaySet && displaySet.Modality === 'SEG');

    if (segDisplaySet) {
      const { referencedVolumeId } = segDisplaySet;
      const referencedVolume = cache.getVolume(referencedVolumeId);
      const segmentationId = segDisplaySet.displaySetInstanceUID;

      const toolGroup = ToolGroupService.getToolGroupForViewport(viewport.id);

      if (referencedVolume) {
        SegmentationService.addSegmentationRepresentationToToolGroup(
          toolGroup.id,
          segmentationId
        );
      }
    } else {
      const toolGroup = ToolGroupService.getToolGroupForViewport(viewport.id);
      const toolGroupSegmentationRepresentations =
        SegmentationService.getSegmentationRepresentationsForToolGroup(
          toolGroup.id
        ) || [];

      // csToolsUtils.segmentation.triggerSegmentationRender(toolGroup.id);
      // If the displaySet is not a SEG displaySet we assume it is a primary displaySet
      // and we can look into hydrated segmentations to check if any of them are
      // associated with the primary displaySet
      // get segmentations only returns the hydrated segmentations
      const segmentations = SegmentationService.getSegmentations();

      for (const segmentation of segmentations) {
        // if there is already a segmentation representation for this segmentation
        // for this toolGroup, don't bother at all
        if (
          toolGroupSegmentationRepresentations.find(
            representation => representation.segmentationId === segmentation.id
          )
        ) {
          continue;
        }

        // otherwise, check if the hydrated segmentations are in the same FOR
        // as the primary displaySet, if so add the representation (since it was not there)
        const { id: segDisplaySetInstanceUID } = segmentation;

        const segFrameOfReferenceUID = this._getFrameOfReferenceUID(
          segDisplaySetInstanceUID
        );

        let shouldDisplaySeg = false;

        for (const displaySetInstanceUID of displaySetInstanceUIDs) {
          const primaryFrameOfReferenceUID = this._getFrameOfReferenceUID(
            displaySetInstanceUID
          );

          if (segFrameOfReferenceUID === primaryFrameOfReferenceUID) {
            shouldDisplaySeg = true;
            break;
          }
        }

        if (shouldDisplaySeg) {
          const toolGroup = ToolGroupService.getToolGroupForViewport(
            viewport.id
          );

          SegmentationService.addSegmentationRepresentationToToolGroup(
            toolGroup.id,
            segmentation.id
          );
        }
      }
    }

    const viewportInfo = this.getViewportInfo(viewport.id);

    const toolGroup = ToolGroupService.getToolGroupForViewport(viewport.id);
    csToolsUtils.segmentation.triggerSegmentationRender(toolGroup.id);

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
  }

  // Todo: keepCamera is an interim solution until we have a better solution for
  // keeping the camera position when the viewport data is changed
  public updateViewport(viewportIndex, viewportData, keepCamera = false) {
    const viewportInfo = this.getViewportInfoByIndex(viewportIndex);

    const viewportId = viewportInfo.getViewportId();
    const viewport = this.getCornerstoneViewport(viewportId);
    const viewportCamera = viewport.getCamera();

    if (viewport instanceof VolumeViewport) {
      this._setVolumeViewport(viewport, viewportData, viewportInfo).then(() => {
        if (keepCamera) {
          viewport.setCamera(viewportCamera);
          viewport.render();
        }
      });

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
    viewport: StackViewport | VolumeViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo
  ): void {
    if (viewport instanceof StackViewport) {
      this._setStackViewport(
        viewport,
        viewportData as StackViewportData,
        viewportInfo
      );
    } else if (viewport instanceof VolumeViewport) {
      this._setVolumeViewport(
        viewport,
        viewportData as VolumeViewportData,
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

  _getFrameOfReferenceUID(displaySetInstanceUID) {
    const { DisplaySetService } = this.servicesManager.services;
    const displaySet = DisplaySetService.getDisplaySetByUID(
      displaySetInstanceUID
    );

    if (!displaySet) {
      return;
    }

    if (displaySet.frameOfReferenceUID) {
      return displaySet.frameOfReferenceUID;
    }

    if (displaySet.Modality === 'SEG') {
      const { instance } = displaySet;
      return instance.FrameOfReferenceUID;
    }

    const { images } = displaySet;
    if (images && images.length) {
      return images[0].FrameOfReferenceUID;
    }
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
