import { PubSubService } from '@ohif/core';
import { Types as OhifTypes } from '@ohif/core';
import {
  RenderingEngine,
  StackViewport,
  Types,
  getRenderingEngine,
  utilities as csUtils,
  VolumeViewport,
  VolumeViewport3D,
  cache,
  Enums as csEnums,
  BaseVolumeViewport,
} from '@cornerstonejs/core';

import { utilities as csToolsUtils, Enums as csToolsEnums } from '@cornerstonejs/tools';
import { IViewportService } from './IViewportService';
import { RENDERING_ENGINE_ID } from './constants';
import ViewportInfo, { DisplaySetOptions, PublicViewportOptions } from './Viewport';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import { LutPresentation, PositionPresentation, Presentations } from '../../types/Presentation';

import JumpPresets from '../../utils/JumpPresets';

const EVENTS = {
  VIEWPORT_DATA_CHANGED: 'event::cornerstoneViewportService:viewportDataChanged',
  VIEWPORT_VOLUMES_CHANGED: 'event::cornerstoneViewportService:viewportVolumesChanged',
};

/**
 * Handles cornerstone viewport logic including enabling, disabling, and
 * updating the viewport.
 */
class CornerstoneViewportService extends PubSubService implements IViewportService {
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
  viewportsById: Map<string, ViewportInfo> = new Map();
  viewportGridResizeObserver: ResizeObserver | null;
  viewportsDisplaySets: Map<string, string[]> = new Map();
  beforeResizePositionPresentations: Map<string, PositionPresentation> = new Map();

  // Some configs
  enableResizeDetector: true;
  resizeRefreshRateMs: 200;
  resizeRefreshMode: 'debounce';
  servicesManager: AppTypes.ServicesManager = null;

  resizeQueue = [];
  viewportResizeTimer = null;
  gridResizeDelay = 50;
  gridResizeTimeOut = null;

  constructor(servicesManager: AppTypes.ServicesManager) {
    super(EVENTS);
    this.renderingEngine = null;
    this.viewportGridResizeObserver = null;
    this.servicesManager = servicesManager;
  }

  /**
   * Adds the HTML element to the viewportService
   * @param {*} viewportId
   * @param {*} elementRef
   */
  public enableViewport(viewportId: string, elementRef: HTMLDivElement): void {
    const viewportInfo = new ViewportInfo(viewportId);
    viewportInfo.setElement(elementRef);
    this.viewportsById.set(viewportId, viewportInfo);
  }

  public getViewportIds(): string[] {
    return Array.from(this.viewportsById.keys());
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
   * It triggers the resize on the rendering engine, and renders the viewports
   *
   * @param isGridResize - if the resize is triggered by a grid resize
   * this is used to avoid double resize of the viewports since if the
   * grid is resized, all viewports will be resized so there is no need
   * to resize them individually which will get triggered by their
   * individual resize observers
   */
  public resize(isGridResize = false) {
    // if there is a grid resize happening, it means the viewport grid
    // has been manipulated (e.g., panels closed, added, etc.) and we need
    // to resize all viewports, so we will add a timeout here to make sure
    // we don't double resize the viewports when viewports in the grid are
    // resized individually
    if (isGridResize) {
      this.performResize();
      this.resetGridResizeTimeout();
      this.resizeQueue = [];
      clearTimeout(this.viewportResizeTimer);
    } else {
      this.enqueueViewportResizeRequest();
    }
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
   * @param viewportId - The viewportId to disable
   */
  public disableElement(viewportId: string): void {
    this.renderingEngine?.disableElement(viewportId);

    // clean up
    this.viewportsById.delete(viewportId);
    this.viewportsDisplaySets.delete(viewportId);
  }

  /**
   * Sets the presentations for a given viewport. Presentations is an object
   * that can define the lut or position for a viewport.
   *
   * @param viewportId - The ID of the viewport.
   * @param presentations - The presentations to apply to the viewport.
   */
  public setPresentations(viewportId: string, presentations?: Presentations): void {
    const viewport = this.getCornerstoneViewport(viewportId) as
      | Types.IStackViewport
      | Types.IVolumeViewport;

    if (!viewport) {
      return;
    }

    if (!presentations) {
      return;
    }

    const { lutPresentation, positionPresentation } = presentations;
    if (lutPresentation) {
      const { presentation } = lutPresentation;
      if (viewport instanceof BaseVolumeViewport) {
        if (presentation instanceof Map) {
          presentation.forEach((properties, volumeId) => {
            viewport.setProperties(properties, volumeId);
          });
        } else {
          viewport.setProperties(presentation);
        }
      } else {
        viewport.setProperties(presentation);
      }
    }

    if (positionPresentation) {
      const { viewPlaneNormal, viewUp, zoom, pan } = positionPresentation.presentation;
      viewport.setCamera({ viewPlaneNormal, viewUp });

      if (zoom !== undefined) {
        viewport.setZoom(zoom);
      }

      if (pan !== undefined) {
        viewport.setPan(pan);
      }
    }
  }

  /**
   * Retrieves the position presentation information for a given viewport.
   * @param viewportId The ID of the viewport.
   * @returns The position presentation object containing various properties
   * such as ID, viewport type, initial image index, view plane normal, view up, zoom, and pan.
   */
  public getPositionPresentation(viewportId: string): PositionPresentation {
    const viewportInfo = this.viewportsById.get(viewportId);
    if (!viewportInfo) {
      return;
    }

    const presentationIds = viewportInfo.getPresentationIds();

    if (!presentationIds) {
      return;
    }

    const { positionPresentationId } = presentationIds;

    const csViewport = this.getCornerstoneViewport(viewportId);
    if (!csViewport) {
      return;
    }

    const { viewPlaneNormal, viewUp } = csViewport.getCamera();
    const initialImageIndex = csViewport.getCurrentImageIdIndex() || 0;
    const zoom = csViewport.getZoom();
    const pan = csViewport.getPan();

    return {
      id: positionPresentationId,
      viewportType: viewportInfo.getViewportType(),
      presentation: {
        initialImageIndex,
        viewUp,
        viewPlaneNormal,
        zoom,
        pan,
      },
    };
  }

  /**
   * Retrieves the LUT (Lookup Table) presentation for a given viewport.
   * @param viewportId The ID of the viewport.
   * @returns The LUT presentation object, or undefined if the viewport does not exist.
   */
  public getLutPresentation(viewportId: string): LutPresentation {
    const viewportInfo = this.viewportsById.get(viewportId);
    if (!viewportInfo) {
      return;
    }

    const presentationIds = viewportInfo.getPresentationIds();

    if (!presentationIds) {
      return;
    }

    const { lutPresentationId } = presentationIds;

    const csViewport = this.getCornerstoneViewport(viewportId) as
      | Types.IStackViewport
      | Types.IVolumeViewport;

    if (!csViewport) {
      return;
    }

    const cleanProperties = properties => {
      if (properties.isComputedVOI) {
        delete properties.voiRange;
        delete properties.VOILUTFunction;
      }
      return properties;
    };

    const presentation =
      csViewport instanceof BaseVolumeViewport
        ? new Map()
        : cleanProperties(csViewport.getProperties());

    if (presentation instanceof Map) {
      csViewport.getActors().forEach(({ uid: volumeId }) => {
        const properties = cleanProperties(csViewport.getProperties(volumeId));
        presentation.set(volumeId, properties);
      });
    }

    return {
      id: lutPresentationId,
      viewportType: viewportInfo.getViewportType(),
      presentation,
    };
  }

  /**
   * Retrieves the presentations for a given viewport.
   * @param viewportId - The ID of the viewport.
   * @returns The presentations for the viewport.
   */
  public getPresentations(viewportId: string): Presentations {
    const viewportInfo = this.viewportsById.get(viewportId);
    if (!viewportInfo) {
      return;
    }

    const positionPresentation = this.getPositionPresentation(viewportId);
    const lutPresentation = this.getLutPresentation(viewportId);

    return {
      positionPresentation,
      lutPresentation,
    };
  }

  /**
   * Stores the presentation state for a given viewport inside the
   * stateSyncService. This is used to persist the presentation state
   * across different scenarios e.g., when the viewport is changing the
   * display set, or when the viewport is moving to a different layout.
   *
   * @param viewportId The ID of the viewport.
   */
  public storePresentation({ viewportId }) {
    let presentations = null as Presentations;
    try {
      presentations = this.getPresentations(viewportId);
      if (!presentations?.positionPresentation && !presentations?.lutPresentation) {
        return;
      }
    } catch (error) {
      console.warn(error);
      return;
    }

    const { stateSyncService, syncGroupService } = this.servicesManager.services;

    const synchronizers = syncGroupService.getSynchronizersForViewport(viewportId);

    const { positionPresentationStore, synchronizersStore, lutPresentationStore } =
      stateSyncService.getState();

    const { lutPresentation, positionPresentation } = presentations;
    const { id: positionPresentationId } = positionPresentation;
    const { id: lutPresentationId } = lutPresentation;

    const updateStore = (store, id, value) => ({ ...store, [id]: value });

    const newState = {} as { [key: string]: any };

    if (lutPresentationId) {
      newState.lutPresentationStore = updateStore(
        lutPresentationStore,
        lutPresentationId,
        lutPresentation
      );
    }

    if (positionPresentationId) {
      newState.positionPresentationStore = updateStore(
        positionPresentationStore,
        positionPresentationId,
        positionPresentation
      );
    }

    if (synchronizers?.length) {
      newState.synchronizersStore = updateStore(
        synchronizersStore,
        viewportId,
        synchronizers.map(synchronizer => ({
          id: synchronizer.id,
          sourceViewports: [...synchronizer.getSourceViewports()],
          targetViewports: [...synchronizer.getTargetViewports()],
        }))
      );
    }

    stateSyncService.store(newState);
  }

  /**
   * Sets the viewport data for a viewport.
   * @param viewportId - The ID of the viewport to set the data for.
   * @param viewportData - The viewport data to set.
   * @param publicViewportOptions - The public viewport options.
   * @param publicDisplaySetOptions - The public display set options.
   * @param presentations - The presentations to set.
   */
  public setViewportData(
    viewportId: string,
    viewportData: StackViewportData | VolumeViewportData,
    publicViewportOptions: PublicViewportOptions,
    publicDisplaySetOptions: DisplaySetOptions[],
    presentations?: Presentations
  ): void {
    const renderingEngine = this.getRenderingEngine();

    // This is the old viewportInfo, which may have old options but we might be
    // using its viewport (same viewportId as the new viewportInfo)
    const viewportInfo = this.viewportsById.get(viewportId);

    // We should store the presentation for the current viewport since we can't only
    // rely to store it WHEN the viewport is disabled since we might keep around the
    // same viewport/element and just change the viewportData for it (drag and drop etc.)
    // the disableElement storePresentation handle would not be called in this case
    // and we would lose the presentation.
    this.storePresentation({ viewportId: viewportInfo.getViewportId() });

    if (!viewportInfo) {
      throw new Error('element is not enabled for the given viewportId');
    }

    // override the viewportOptions and displaySetOptions with the public ones
    // since those are the newly set ones, we set them here so that it handles defaults
    const displaySetOptions = viewportInfo.setPublicDisplaySetOptions(publicDisplaySetOptions);
    const viewportOptions = viewportInfo.setPublicViewportOptions(publicViewportOptions);

    const element = viewportInfo.getElement();
    const type = viewportInfo.getViewportType();
    const background = viewportInfo.getBackground();
    const orientation = viewportInfo.getOrientation();
    const displayArea = viewportInfo.getDisplayArea();

    const viewportInput: Types.PublicViewportInput = {
      viewportId,
      element,
      type,
      defaultOptions: {
        background,
        orientation,
        displayArea,
      },
    };

    // Rendering Engine Id set should happen before enabling the element
    // since there are callbacks that depend on the renderingEngine id
    // Todo: however, this is a limitation which means that we can't change
    // the rendering engine id for a given viewport which might be a super edge
    // case
    viewportInfo.setRenderingEngineId(renderingEngine.id);

    // Todo: this is not optimal at all, we are re-enabling the already enabled
    // element which is not what we want. But enabledElement as part of the
    // renderingEngine is designed to be used like this. This will trigger
    // ENABLED_ELEMENT again and again, which will run onEnableElement callbacks
    renderingEngine.enableElement(viewportInput);

    viewportInfo.setViewportOptions(viewportOptions);
    viewportInfo.setDisplaySetOptions(displaySetOptions);
    viewportInfo.setViewportData(viewportData);
    viewportInfo.setViewportId(viewportId);

    this.viewportsById.set(viewportId, viewportInfo);

    const viewport = renderingEngine.getViewport(viewportId);
    const displaySetPromise = this._setDisplaySets(
      viewport,
      viewportData,
      viewportInfo,
      presentations
    );

    // The broadcast event here ensures that listeners have a valid, up to date
    // viewport to access.  Doing it too early can result in exceptions or
    // invalid data.
    displaySetPromise.then(() => {
      this._broadcastEvent(this.EVENTS.VIEWPORT_DATA_CHANGED, {
        viewportData,
        viewportId,
      });
    });
  }

  /**
   * Retrieves the Cornerstone viewport with the specified ID.
   *
   * @param viewportId - The ID of the viewport.
   * @returns The Cornerstone viewport object if found, otherwise null.
   */
  public getCornerstoneViewport(viewportId: string): Types.IViewport | null {
    const viewportInfo = this.getViewportInfo(viewportId);

    if (!viewportInfo || !this.renderingEngine || this.renderingEngine.hasBeenDestroyed) {
      return null;
    }

    const viewport = this.renderingEngine.getViewport(viewportId);

    return viewport;
  }

  /**
   * Retrieves the viewport information for a given viewport ID. The viewport information
   * is the OHIF construct that holds different options and data for a given viewport and
   * is different from the cornerstone viewport.
   *
   * @param viewportId The ID of the viewport.
   * @returns The viewport information.
   */
  public getViewportInfo(viewportId: string): ViewportInfo {
    return this.viewportsById.get(viewportId);
  }

  /**
   * Looks through the viewports to see if the specified measurement can be
   * displayed in one of the viewports.
   *
   * @param measurement
   *          The measurement that is desired to view.
   * @param activeViewportId - the index that was active at the time the jump
   *          was initiated.
   * @return the viewportId that the measurement should be displayed in.
   */
  public getViewportIdToJump(
    activeViewportId: string,
    displaySetInstanceUID: string,
    cameraProps: unknown
  ): string {
    const viewportInfo = this.getViewportInfo(activeViewportId);

    if (viewportInfo.getViewportType() === csEnums.ViewportType.VOLUME_3D) {
      return null;
    }

    const { referencedImageId } = cameraProps;
    if (viewportInfo?.contains(displaySetInstanceUID, referencedImageId)) {
      return activeViewportId;
    }

    return (
      [...this.viewportsById.values()].find(viewportInfo =>
        viewportInfo.contains(displaySetInstanceUID, referencedImageId)
      )?.viewportId ?? null
    );
  }

  private async _setStackViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
  ): Promise<void> {
    const displaySetOptions = viewportInfo.getDisplaySetOptions();

    const displaySetInstanceUIDs = viewportData.data.map(data => data.displaySetInstanceUID);

    // based on the cache service construct always the first one is the non-overlay
    // and the rest are overlays

    this.viewportsDisplaySets.set(viewport.id, [...displaySetInstanceUIDs]);

    const { initialImageIndex, imageIds } = viewportData.data[0];

    let initialImageIndexToUse =
      presentations?.positionPresentation?.initialImageIndex ?? initialImageIndex;

    if (initialImageIndexToUse === undefined || initialImageIndexToUse === null) {
      initialImageIndexToUse = this._getInitialImageIndexForViewport(viewportInfo, imageIds) || 0;
    }

    const { rotation, flipHorizontal, displayArea } = viewportInfo.getViewportOptions();

    const properties = { ...presentations.lutPresentation?.properties };
    if (!presentations.lutPresentation?.properties) {
      const { voi, voiInverted, colormap } = displaySetOptions[0];
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
    }

    this._handleOverlays(viewport);

    return viewport.setStack(imageIds, initialImageIndexToUse).then(() => {
      viewport.setProperties({ ...properties });
      this.setPresentations(viewport.id, presentations);
      if (displayArea) {
        viewport.setDisplayArea(displayArea);
      }
      if (rotation) {
        viewport.setProperties({ rotation });
      }
      if (flipHorizontal) {
        viewport.setCamera({ flipHorizontal: true });
      }
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
      const viewport = this.getCornerstoneViewport(viewportInfo.getViewportId());
      const imageSliceData = csUtils.getImageSliceDataForVolumeViewport(viewport);

      if (!imageSliceData) {
        return;
      }

      ({ numberOfSlices } = imageSliceData);
    } else {
      return;
    }

    return this._getInitialImageIndex(numberOfSlices, index, preset);
  }

  _getInitialImageIndex(numberOfSlices: number, imageIndex?: number, preset?: JumpPresets): number {
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
      return lastSliceIndex % 2 === 0 ? lastSliceIndex / 2 : (lastSliceIndex + 1) / 2;
    }

    return 0;
  }

  async _setVolumeViewport(
    viewport: Types.IVolumeViewport,
    viewportData: VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
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

    const volumesNotLoaded = volumeToLoad.filter(volume => !volume.loadStatus.loaded);

    if (volumesNotLoaded.length) {
      if (hangingProtocolService.getShouldPerformCustomImageLoad()) {
        // delegate the volume loading to the hanging protocol service if it has a custom image load strategy
        return hangingProtocolService.runImageLoadStrategy({
          viewportId: viewport.id,
          volumeInputArray,
        });
      }

      volumesNotLoaded.forEach(volume => {
        if (!volume.loadStatus.loading) {
          volume.load();
        }
      });
    }

    // This returns the async continuation only
    return this.setVolumesForViewport(viewport, volumeInputArray, presentations);
  }

  public async setVolumesForViewport(viewport, volumeInputArray, presentations) {
    const { displaySetService, toolGroupService, viewportGridService } =
      this.servicesManager.services;

    const viewportInfo = this.getViewportInfo(viewport.id);
    const displaySetOptions = viewportInfo.getDisplaySetOptions();
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewport.id);
    const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
    const displaySetModality = displaySet?.Modality;

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
        properties.preset = displayPreset[displaySetModality] || displayPreset.default;
      }

      return { properties, volumeId };
    });

    await viewport.setVolumes(volumeInputArray);
    volumesProperties.forEach(({ properties, volumeId }) => {
      viewport.setProperties(properties, volumeId);
    });

    this.setPresentations(viewport.id, presentations);

    this._handleOverlays(viewport);

    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
    csToolsUtils.segmentation.triggerSegmentationRender(toolGroup.id);

    const imageIndex = this._getInitialImageIndexForViewport(viewportInfo);

    if (imageIndex !== undefined) {
      csToolsUtils.jumpToSlice(viewport.element, {
        imageIndex,
      });
    }

    viewport.render();

    this._broadcastEvent(this.EVENTS.VIEWPORT_VOLUMES_CHANGED, {
      viewportInfo,
    });
  }

  private _handleOverlays(viewport: Types.IStackViewport | Types.IVolumeViewport) {
    const { displaySetService } = this.servicesManager.services;

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
      this._addSegmentationRepresentationToToolGroupIfNecessary(displaySetInstanceUIDs, viewport);
    }
  }

  private _addSegmentationRepresentationToToolGroupIfNecessary(
    displaySetInstanceUIDs: string[],
    viewport: any
  ) {
    const { segmentationService, toolGroupService } = this.servicesManager.services;

    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);

    // this only returns hydrated segmentations
    const segmentations = segmentationService.getSegmentations();

    for (const segmentation of segmentations) {
      const toolGroupSegmentationRepresentations =
        segmentationService.getSegmentationRepresentationsForToolGroup(toolGroup.id) || [];

      // if there is already a segmentation representation for this segmentation
      // for this toolGroup, don't bother at all
      const isSegmentationInToolGroup = toolGroupSegmentationRepresentations.find(
        representation => representation.segmentationId === segmentation.id
      );

      if (isSegmentationInToolGroup) {
        continue;
      }

      // otherwise, check if the hydrated segmentations are in the same FrameOfReferenceUID
      // as the primary displaySet, if so add the representation (since it was not there)
      const { id: segDisplaySetInstanceUID } = segmentation;
      let segFrameOfReferenceUID = this._getFrameOfReferenceUID(segDisplaySetInstanceUID);

      if (!segFrameOfReferenceUID) {
        // if the segmentation displaySet does not have a FrameOfReferenceUID, we might check the
        // segmentation itself maybe it has a FrameOfReferenceUID
        const { FrameOfReferenceUID } = segmentation;
        if (FrameOfReferenceUID) {
          segFrameOfReferenceUID = FrameOfReferenceUID;
        }
      }

      if (!segFrameOfReferenceUID) {
        return;
      }

      let shouldDisplaySeg = false;

      for (const displaySetInstanceUID of displaySetInstanceUIDs) {
        const primaryFrameOfReferenceUID = this._getFrameOfReferenceUID(displaySetInstanceUID);

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

  private addOverlayRepresentationForDisplaySet(displaySet: any, viewport: any) {
    const { segmentationService, toolGroupService } = this.servicesManager.services;

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
  public updateViewport(viewportId: string, viewportData, keepCamera = false) {
    const viewportInfo = this.getViewportInfo(viewportId);
    const viewport = this.getCornerstoneViewport(viewportId);
    const viewportCamera = viewport.getCamera();

    let displaySetPromise;

    if (viewport instanceof VolumeViewport || viewport instanceof VolumeViewport3D) {
      displaySetPromise = this._setVolumeViewport(viewport, viewportData, viewportInfo).then(() => {
        if (keepCamera) {
          viewport.setCamera(viewportCamera);
          viewport.render();
        }
      });
    }

    if (viewport instanceof StackViewport) {
      displaySetPromise = this._setStackViewport(viewport, viewportData, viewportInfo);
    }

    displaySetPromise.then(() => {
      this._broadcastEvent(this.EVENTS.VIEWPORT_DATA_CHANGED, {
        viewportData,
        viewportId,
      });
    });
  }

  _setDisplaySets(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
  ): Promise<void> {
    if (viewport instanceof StackViewport) {
      return this._setStackViewport(
        viewport,
        viewportData as StackViewportData,
        viewportInfo,
        presentations
      );
    }

    if ([VolumeViewport, VolumeViewport3D].some(type => viewport instanceof type)) {
      return this._setVolumeViewport(
        viewport as Types.IVolumeViewport,
        viewportData as VolumeViewportData,
        viewportInfo,
        presentations
      );
    }

    throw new Error('Unknown viewport type');
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
    if (blendMode === undefined || displaySetOptions.slabThickness === undefined) {
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

  _getFrameOfReferenceUID(displaySetInstanceUID) {
    const { displaySetService } = this.servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

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

  private enqueueViewportResizeRequest() {
    this.resizeQueue.push(false); // false indicates viewport resize

    clearTimeout(this.viewportResizeTimer);
    this.viewportResizeTimer = setTimeout(() => {
      this.processViewportResizeQueue();
    }, this.gridResizeDelay);
  }

  private processViewportResizeQueue() {
    const isGridResizeInQueue = this.resizeQueue.some(isGridResize => isGridResize);
    if (this.resizeQueue.length > 0 && !isGridResizeInQueue && !this.gridResizeTimeOut) {
      this.performResize();
    }

    // Clear the queue after processing viewport resizes
    this.resizeQueue = [];
  }

  private performResize() {
    const isImmediate = false;

    try {
      const viewports = this.getRenderingEngine().getViewports();

      // Store the current position presentations for each viewport.
      viewports.forEach(({ id }) => {
        const presentation = this.getPositionPresentation(id);
        this.beforeResizePositionPresentations.set(id, presentation);
      });

      // Resize the rendering engine and render.
      const renderingEngine = this.renderingEngine;
      renderingEngine.resize(isImmediate);
      renderingEngine.render();

      // Reset the camera for viewports that should reset their camera on resize,
      // which means only those viewports that have a zoom level of 1.
      this.beforeResizePositionPresentations.forEach((positionPresentation, viewportId) => {
        this.setPresentations(viewportId, { positionPresentation });
      });

      // Resize and render the rendering engine again.
      renderingEngine.resize(isImmediate);
      renderingEngine.render();
    } catch (e) {
      // This can happen if the resize is too close to navigation or shutdown
      console.warn('Caught resize exception', e);
    }
  }

  private resetGridResizeTimeout() {
    clearTimeout(this.gridResizeTimeOut);
    this.gridResizeTimeOut = setTimeout(() => {
      this.gridResizeTimeOut = null;
    }, this.gridResizeDelay);
  }
}

export default CornerstoneViewportService;
