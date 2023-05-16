import { PubSubService, ServicesManager } from '@ohif/core';
import * as OhifTypes from '@ohif/core/types';
import {
  RenderingEngine,
  StackViewport,
  Types,
  getRenderingEngine,
  utilities as csUtils,
  VolumeViewport,
  VolumeViewport3D,
  cache,
  utilities,
  CONSTANTS,
  Enums as csEnums,
} from '@cornerstonejs/core';

import {
  utilities as csToolsUtils,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
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
import { Presentation, Presentations } from '../../types/Presentation';

import JumpPresets from '../../utils/JumpPresets';

const EVENTS = {
  VIEWPORT_DATA_CHANGED:
    'event::cornerstoneViewportService:viewportDataChanged',
};

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class CornerstoneViewportService extends PubSubService
  implements IViewportService {
  static REGISTRATION = {
    name: 'cornerstoneViewportService',
    altName: 'CornerstoneViewportService',
    create: ({
      servicesManager,
    }: OhifTypes.Extensions.ExtensionParams): CornerstoneViewportService => {
      return new CornerstoneViewportService(servicesManager);
    },
  };

  renderingEngine: Types.IRenderingEngine | null;
  viewportsInfo: Map<number, ViewportInfo> = new Map();
  viewportsById: Map<string, ViewportInfo> = new Map();
  viewportGridResizeObserver: ResizeObserver | null;
  viewportsDisplaySets: Map<string, string[]> = new Map();

  // Some configs
  enableResizeDetector: true;
  resizeRefreshRateMs: 200;
  resizeRefreshMode: 'debounce';
  servicesManager = null;

  constructor(servicesManager: ServicesManager) {
    super(EVENTS);
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.servicesManager = servicesManager;
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
  ): void {
    // Use the provided viewportId
    // Not providing a viewportId is frowned upon because it does weird things
    // on moving them around, but it does mostly work.
    if (!viewportOptions.viewportId) {
      console.warn('Should provide viewport id externally', viewportOptions);
      viewportOptions.viewportId =
        this.getViewportId(viewportIndex) || `viewport-${viewportIndex}`;
    }
    const { viewportId } = viewportOptions;
    const viewportInfo = new ViewportInfo(viewportIndex, viewportId);
    if (!viewportInfo.viewportId) {
      throw new Error('Should have viewport ID afterwards');
    }

    viewportInfo.setElement(elementRef);
    this.viewportsInfo.set(viewportIndex, viewportInfo);
    this.viewportsById.set(viewportId, viewportInfo);
  }

  public getViewportIds(): string[] {
    const viewportIds = [];

    this.viewportsInfo.forEach(viewportInfo => {
      viewportIds.push(viewportInfo.getViewportId());
    });

    return viewportIds;
  }

  public getViewportId(viewportIndex: number): string {
    return this.viewportsInfo[viewportIndex]?.viewportId;
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
    try {
      this.renderingEngine?.destroy?.();
    } catch (e) {
      console.warn('Rendering engine not destroyed', e);
    }
    this.viewportsDisplaySets.clear();
    this.renderingEngine = null;
    cache.purgeCache();
  }

  /**
   * Disables the viewport inside the renderingEngine, if no viewport is left
   * it destroys the renderingEngine.
   *
   * This is called when the element goes away entirely - with new viewportId's
   * created for every new viewport, this will be called whenever the set of
   * viewports is changed, but NOT when the viewport position changes only.
   *
   * @param viewportIndex
   */
  public disableElement(viewportIndex: number): void {
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    if (!viewportInfo) {
      return;
    }

    const viewportId = viewportInfo.getViewportId();

    this.renderingEngine && this.renderingEngine.disableElement(viewportId);

    this.viewportsInfo.get(viewportIndex).destroy();
    this.viewportsInfo.delete(viewportIndex);
    this.viewportsById.delete(viewportId);
  }

  public setPresentations(viewport, presentations?: Presentations): void {
    const properties = presentations?.lutPresentation?.properties;
    if (properties) viewport.setProperties(properties);
    const camera = presentations?.positionPresentation?.camera;
    if (camera) viewport.setCamera(camera);
  }

  public getPresentation(viewportIndex: number): Presentation {
    const viewportInfo = this.viewportsInfo.get(viewportIndex);
    if (!viewportInfo) return;
    const { viewportType, presentationIds } = viewportInfo.getViewportOptions();

    const csViewport = this.getCornerstoneViewportByIndex(viewportIndex);
    if (!csViewport) return;

    const properties = csViewport.getProperties();
    if (properties.isComputedVOI) {
      delete properties.voiRange;
      delete properties.VOILUTFunction;
    }
    const initialImageIndex = csViewport.getCurrentImageIdIndex();
    const camera = csViewport.getCamera();
    return {
      presentationIds,
      viewportType:
        !viewportType || viewportType === 'stack' ? 'stack' : 'volume',
      properties,
      initialImageIndex,
      camera,
    };
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
    publicDisplaySetOptions: DisplaySetOptions[],
    presentations?: Presentations
  ): void {
    const renderingEngine = this.getRenderingEngine();
    const viewportId =
      publicViewportOptions.viewportId || this.getViewportId(viewportIndex);
    if (!viewportId) {
      throw new Error('Must define viewportId externally');
    }

    const viewportInfo = this.viewportsById.get(viewportId);

    if (!viewportInfo) {
      throw new Error('Viewport info not defined');
    }

    // If the viewport has moved index, then record the new index
    if (viewportInfo.viewportIndex !== viewportIndex) {
      this.viewportsInfo.delete(viewportInfo.viewportIndex);
      this.viewportsInfo.set(viewportIndex, viewportInfo);
      viewportInfo.viewportIndex = viewportIndex;
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
    this._setDisplaySets(viewport, viewportData, viewportInfo, presentations);

    // The broadcast event here ensures that listeners have a valid, up to date
    // viewport to access.  Doing it too early can result in exceptions or
    // invalid data.
    this._broadcastEvent(this.EVENTS.VIEWPORT_DATA_CHANGED, {
      viewportData,
      viewportIndex,
      viewportId,
    });
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
    viewportInfo: ViewportInfo,
    presentations: Presentations
  ): void {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    const {
      imageIds,
      initialImageIndex,
      displaySetInstanceUID,
    } = viewportData.data;

    this.viewportsDisplaySets.set(viewport.id, [displaySetInstanceUID]);

    let initialImageIndexToUse =
      presentations?.positionPresentation?.initialImageIndex ??
      initialImageIndex;

    if (
      initialImageIndexToUse === undefined ||
      initialImageIndexToUse === null
    ) {
      initialImageIndexToUse =
        this._getInitialImageIndexForViewport(viewportInfo, imageIds) || 0;
    }

    const properties = { ...presentations.lutPresentation?.properties };
    if (!presentations.lutPresentation?.properties) {
      const { voi, voiInverted } = displaySetOptions[0];
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
    }

    viewport.setStack(imageIds, initialImageIndexToUse).then(() => {
      viewport.setProperties(properties);
      const camera = presentations.positionPresentation?.camera;
      if (camera) viewport.setCamera(camera);
    });
  }

  private _getInitialImageIndexForViewport(
    viewportInfo: ViewportInfo,
    imageIds?: string[]
  ): number {
    const initialImageOptions = viewportInfo.getInitialImageOptions();

    if (!initialImageOptions) {
      return;
    }

    const { index, preset } = initialImageOptions;
    const viewportType = viewportInfo.getViewportType();

    let numberOfSlices;
    if (viewportType === csEnums.ViewportType.STACK) {
      numberOfSlices = imageIds.length;
    } else if (viewportType === csEnums.ViewportType.ORTHOGRAPHIC) {
      const viewport = this.getCornerstoneViewport(
        viewportInfo.getViewportId()
      );
      const imageSliceData = csUtils.getImageSliceDataForVolumeViewport(
        viewport
      );

      if (!imageSliceData) {
        return;
      }

      ({ numberOfSlices } = imageSliceData);
    } else {
      return;
    }

    return this._getInitialImageIndex(numberOfSlices, index, preset);
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
    viewportInfo: ViewportInfo,
    presentations: Presentations
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
    const { hangingProtocolService } = this.servicesManager.services;

    const volumeToLoad = [];
    const displaySetInstanceUIDs = [];

    for (const [index, data] of viewportData.data.entries()) {
      const { volume, imageIds, displaySetInstanceUID } = data;

      displaySetInstanceUIDs.push(displaySetInstanceUID);

      if (!volume) {
        console.log('Volume display set not found');
        continue;
      }

      volumeToLoad.push(volume);

      const displaySetOptions = displaySetOptionsArray[index];
      const { volumeId } = volume;

      volumeInputArray.push({
        imageIds,
        volumeId,
        blendMode: displaySetOptions.blendMode,
        slabThickness: this._getSlabThickness(displaySetOptions, volumeId),
      });
    }

    this.viewportsDisplaySets.set(viewport.id, displaySetInstanceUIDs);

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

    volumeToLoad.forEach(volume => {
      if (!volume.loadStatus.loaded && !volume.loadStatus.loading) {
        volume.load();
      }
    });

    // This returns the async continuation only
    return this.setVolumesForViewport(
      viewport,
      volumeInputArray,
      presentations
    );
  }

  public async setVolumesForViewport(
    viewport,
    volumeInputArray,
    presentations
  ) {
    const {
      displaySetService,
      toolGroupService,
    } = this.servicesManager.services;

    const viewportInfo = this.getViewportInfo(viewport.id);
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    // Todo: use presentations states
    const volumesProperties = volumeInputArray.map((volumeInput, index) => {
      const { volumeId } = volumeInput;
      const displaySetOption = displaySetOptions[index];
      const { voi, voiInverted, colormap, displayPreset } = displaySetOption;
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

      if (colormap !== undefined) {
        properties.colormap = colormap;
      }

      if (displayPreset !== undefined) {
        properties.preset = displayPreset;
      }

      return { properties, volumeId };
    });

    await viewport.setVolumes(volumeInputArray);
    volumesProperties.forEach(({ properties, volumeId }) => {
      viewport.setProperties(properties, volumeId);
    });

    this.setPresentations(viewport, presentations);

    // load any secondary displaySets
    const displaySetInstanceUIDs = this.viewportsDisplaySets.get(viewport.id);

    // can be SEG or RTSTRUCT for now
    const overlayDisplaySet = displaySetInstanceUIDs
      .map(displaySetService.getDisplaySetByUID)
      .find(displaySet => displaySet?.isOverlayDisplaySet);

    if (overlayDisplaySet) {
      this.addOverlayRepresentationForDisplaySet(overlayDisplaySet, viewport);
    } else {
      // If the displaySet is not a SEG displaySet we assume it is a primary displaySet
      // and we can look into hydrated segmentations to check if any of them are
      // associated with the primary displaySet

      // get segmentations only returns the hydrated segmentations
      this._addSegmentationRepresentationToToolGroupIfNecessary(
        displaySetInstanceUIDs,
        viewport
      );
    }

    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
    csToolsUtils.segmentation.triggerSegmentationRender(toolGroup.id);

    const imageIndex = this._getInitialImageIndexForViewport(viewportInfo);

    if (imageIndex !== undefined) {
      csToolsUtils.jumpToSlice(viewport.element, {
        imageIndex,
      });
    }

    viewport.render();
  }

  private _addSegmentationRepresentationToToolGroupIfNecessary(
    displaySetInstanceUIDs: string[],
    viewport: any
  ) {
    const {
      segmentationService,
      toolGroupService,
    } = this.servicesManager.services;

    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);

    // this only returns hydrated segmentations
    const segmentations = segmentationService.getSegmentations();

    for (const segmentation of segmentations) {
      const toolGroupSegmentationRepresentations =
        segmentationService.getSegmentationRepresentationsForToolGroup(
          toolGroup.id
        ) || [];

      // if there is already a segmentation representation for this segmentation
      // for this toolGroup, don't bother at all
      const isSegmentationInToolGroup = toolGroupSegmentationRepresentations.find(
        representation => representation.segmentationId === segmentation.id
      );

      if (isSegmentationInToolGroup) {
        continue;
      }

      // otherwise, check if the hydrated segmentations are in the same FOR
      // as the primary displaySet, if so add the representation (since it was not there)
      const { id: segDisplaySetInstanceUID, type } = segmentation;
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

      if (!shouldDisplaySeg) {
        return;
      }

      segmentationService.addSegmentationRepresentationToToolGroup(
        toolGroup.id,
        segmentation.id,
        false, // already hydrated,
        segmentation.type
      );
    }
  }

  private addOverlayRepresentationForDisplaySet(
    displaySet: any,
    viewport: any
  ) {
    const {
      segmentationService,
      toolGroupService,
    } = this.servicesManager.services;

    const { referencedVolumeId } = displaySet;
    const segmentationId = displaySet.displaySetInstanceUID;

    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);

    const representationType =
      referencedVolumeId && cache.getVolume(referencedVolumeId) !== undefined
        ? csToolsEnums.SegmentationRepresentations.Labelmap
        : csToolsEnums.SegmentationRepresentations.Contour;

    segmentationService.addSegmentationRepresentationToToolGroup(
      toolGroup.id,
      segmentationId,
      false,
      representationType
    );
  }

  // Todo: keepCamera is an interim solution until we have a better solution for
  // keeping the camera position when the viewport data is changed
  public updateViewport(
    viewportIndex: number,
    viewportData,
    keepCamera = false
  ) {
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

  _setDisplaySets(
    viewport: StackViewport | VolumeViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
  ): void {
    if (viewport instanceof StackViewport) {
      this._setStackViewport(
        viewport,
        viewportData as StackViewportData,
        viewportInfo,
        presentations
      );
    } else if (
      viewport instanceof VolumeViewport ||
      viewport instanceof VolumeViewport3D
    ) {
      this._setVolumeViewport(
        viewport,
        viewportData as VolumeViewportData,
        viewportInfo,
        presentations
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
    const { displaySetService } = this.servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(
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

    if (displaySet.Modality === 'RTSTRUCT') {
      const { instance } = displaySet;
      return instance.ReferencedFrameOfReferenceSequence.FrameOfReferenceUID;
    }

    const { images } = displaySet;
    if (images && images.length) {
      return images[0].FrameOfReferenceUID;
    }
  }

  /**
   * Looks through the viewports to see if the specified measurement can be
   * displayed in one of the viewports.
   *
   * @param measurement
   *          The measurement that is desired to view.
   * @param activeViewportIndex - the index that was active at the time the jump
   *          was initiated.
   * @return the viewportIndex to display the given measurement
   */
  public getViewportIndexToJump(
    activeViewportIndex: number,
    displaySetInstanceUID: string,
    cameraProps: unknown
  ): number {
    const viewportInfo = this.viewportsInfo.get(activeViewportIndex);
    const { referencedImageId } = cameraProps;
    if (viewportInfo?.contains(displaySetInstanceUID, referencedImageId)) {
      return activeViewportIndex;
    }

    return (
      [...this.viewportsById.values()].find(viewportInfo =>
        viewportInfo.contains(displaySetInstanceUID, referencedImageId)
      )?.viewportIndex ?? -1
    );
  }
}

export default CornerstoneViewportService;
