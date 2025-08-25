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
import ViewportInfo, {
  DisplaySetOptions,
  PublicViewportOptions,
  ViewportOptions,
} from './Viewport';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import {
  LutPresentation,
  PositionPresentation,
  Presentations,
  SegmentationPresentation,
  SegmentationPresentationItem,
} from '../../types/Presentation';

import JumpPresets from '../../utils/JumpPresets';
import { ViewportProperties } from '@cornerstonejs/core/types';
import { useLutPresentationStore } from '../../stores/useLutPresentationStore';
import { usePositionPresentationStore } from '../../stores/usePositionPresentationStore';
import { useSynchronizersStore } from '../../stores/useSynchronizersStore';
import { useSegmentationPresentationStore } from '../../stores/useSegmentationPresentationStore';

const EVENTS = {
  VIEWPORT_DATA_CHANGED: 'event::cornerstoneViewportService:viewportDataChanged',
  VIEWPORT_VOLUMES_CHANGED: 'event::cornerstoneViewportService:viewportVolumesChanged',
};

const MIN_STACK_VIEWPORTS_TO_ENQUEUE_RESIZE = 12;
const MIN_VOLUME_VIEWPORTS_TO_ENQUEUE_RESIZE = 6;

export const WITH_NAVIGATION = { withNavigation: true, withOrientation: false };
export const WITH_ORIENTATION = { withNavigation: true, withOrientation: true };

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
  hangingProtocolService: unknown;
  viewportsInfo: unknown;
  sceneVolumeInputs: unknown;
  viewportDivElements: unknown;
  ViewportPropertiesMap: unknown;
  volumeUIDs: unknown;
  displaySetsNeedRerendering: unknown;
  viewportDisplaySets: unknown;

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
   */
  public resize() {
    // https://stackoverflow.com/a/26279685
    // This resize() call, among other things, rerenders the viewports. But when the entire viewer is
    // display: none'd, it makes the size of all hidden elements 0, including the viewport canvas and its containers.
    // Even if the viewer is later displayed again, trying to render when the size is 0 permanently "breaks" the
    // viewport, making it fully black even after the size is normal again. So just ignore resize events when hidden:
    const areViewportsHidden = Array.from(this.viewportsById.values()).every(viewportInfo => {
      const element = viewportInfo.getElement();

      return element.clientWidth === 0 && element.clientHeight === 0;
    });
    if (areViewportsHidden) {
      console.warn('Ignoring resize when viewports have size 0');
      return;
    }

    const numStackViewportsInViewportGrid = Array.from(this.viewportsById.values()).filter(
      viewportInfo => viewportInfo.getViewportType() === csEnums.ViewportType.STACK
    ).length;

    const numVolumeViewportsInViewportGrid = Array.from(this.viewportsById.values()).filter(
      viewportInfo => viewportInfo.getViewportType() === csEnums.ViewportType.ORTHOGRAPHIC
    ).length;

    const isEasyResize =
      numStackViewportsInViewportGrid <= MIN_STACK_VIEWPORTS_TO_ENQUEUE_RESIZE &&
      numVolumeViewportsInViewportGrid <= MIN_VOLUME_VIEWPORTS_TO_ENQUEUE_RESIZE;

    // if there is a grid resize happening, it means the viewport grid
    // has been manipulated (e.g., panels closed, added, etc.) and we need
    // to resize all viewports, so we will add a timeout here to make sure
    // we don't double resize the viewports when viewports in the grid are
    // resized individually
    if (isEasyResize) {
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
   * @param viewportInfo - Contains a view reference for immediate application
   */
  public setPresentations(viewportId: string, presentations: Presentations): void {
    const viewport = this.getCornerstoneViewport(viewportId) as
      | Types.IStackViewport
      | Types.IVolumeViewport;

    if (!viewport || !presentations) {
      return;
    }

    const { lutPresentation, positionPresentation, segmentationPresentation } = presentations;

    // Always set the segmentation presentation first, since there might be some
    // lutpresentation states that need to be set on the segmentation
    // Todo: i think we should even await this
    this._setSegmentationPresentation(viewport, segmentationPresentation);

    this._setLutPresentation(viewport, lutPresentation);
    this._setPositionPresentation(viewport, { ...positionPresentation, viewportId });
  }

  /**
   * Stores the presentation state for a given viewport inside the
   * each store. This is used to persist the presentation state
   * across different scenarios e.g., when the viewport is changing the
   * display set, or when the viewport is moving to a different layout.
   *
   * @param viewportId The ID of the viewport.
   */
  public storePresentation({ viewportId }) {
    const presentationIds = this.getPresentationIds(viewportId);
    const { syncGroupService } = this.servicesManager.services;
    const synchronizers = syncGroupService.getSynchronizersForViewport(viewportId);

    if (!presentationIds || Object.keys(presentationIds).length === 0) {
      return null;
    }

    const { lutPresentationId, positionPresentationId, segmentationPresentationId } =
      presentationIds;

    const positionPresentation = this._getPositionPresentation(viewportId);
    const lutPresentation = this._getLutPresentation(viewportId);
    const segmentationPresentation = this._getSegmentationPresentation(viewportId);

    const { setLutPresentation } = useLutPresentationStore.getState();
    const { setPositionPresentation } = usePositionPresentationStore.getState();
    const { setSynchronizers } = useSynchronizersStore.getState();
    const { setSegmentationPresentation } = useSegmentationPresentationStore.getState();

    if (lutPresentationId) {
      setLutPresentation(lutPresentationId, lutPresentation);
    }

    if (positionPresentationId) {
      setPositionPresentation(positionPresentationId, positionPresentation);
    }

    if (segmentationPresentationId) {
      setSegmentationPresentation(segmentationPresentationId, segmentationPresentation);
    }

    if (synchronizers?.length) {
      setSynchronizers(
        viewportId,
        synchronizers.map(synchronizer => ({
          id: synchronizer.id,
          sourceViewports: [...synchronizer.getSourceViewports()],
          targetViewports: [...synchronizer.getTargetViewports()],
        }))
      );
    }
  }

  /**
   * Retrieves the presentations for a given viewport.
   * @param viewportId - The ID of the viewport.
   * @returns The presentations for the viewport.
   */
  public getPresentations(viewportId: string): Presentations {
    const positionPresentation = this._getPositionPresentation(viewportId);
    const lutPresentation = this._getLutPresentation(viewportId);
    const segmentationPresentation = this._getSegmentationPresentation(viewportId);

    return {
      positionPresentation,
      lutPresentation,
      segmentationPresentation,
    };
  }

  private getPresentationIds(viewportId: string): AppTypes.PresentationIds | null {
    const viewportInfo = this.viewportsById.get(viewportId);
    if (!viewportInfo) {
      return null;
    }

    return viewportInfo.getPresentationIds();
  }

  private _getPositionPresentation(viewportId: string): PositionPresentation {
    const csViewport = this.getCornerstoneViewport(viewportId);
    if (!csViewport) {
      return;
    }

    const viewportInfo = this.viewportsById.get(viewportId);

    return {
      viewportType: viewportInfo.getViewportType(),
      viewReference: csViewport instanceof VolumeViewport3D ? null : csViewport.getViewReference(),
      viewPresentation: csViewport.getViewPresentation({ pan: true, zoom: true }),
      viewportId,
    };
  }

  private _getLutPresentation(viewportId: string): LutPresentation {
    const csViewport = this.getCornerstoneViewport(viewportId) as
      | Types.IStackViewport
      | Types.IVolumeViewport;

    if (!csViewport) {
      return;
    }

    const cleanProperties = properties => {
      if (properties?.isComputedVOI) {
        delete properties?.voiRange;
        delete properties?.VOILUTFunction;
      }
      if (properties?.colormap) {
        if (properties.colormap?.opacity?.length === 0) {
          delete properties.colormap.opacity;
        }
      }
      return properties;
    };

    const properties =
      csViewport instanceof BaseVolumeViewport
        ? new Map()
        : cleanProperties(csViewport.getProperties());

    if (properties instanceof Map) {
      const volumeIds = (csViewport as Types.IBaseVolumeViewport).getAllVolumeIds();
      volumeIds?.forEach(volumeId => {
        const csProps = cleanProperties(csViewport.getProperties(volumeId));
        properties.set(volumeId, csProps);
      });
    }

    const viewportInfo = this.viewportsById.get(viewportId);

    return {
      viewportType: viewportInfo.getViewportType(),
      properties,
    };
  }

  private _getSegmentationPresentation(viewportId: string): SegmentationPresentation {
    const { segmentationService } = this.servicesManager.services;

    const presentation = segmentationService.getPresentation(viewportId);
    return presentation;
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

    // if not valid viewportData then return early
    if (viewportData.viewportType === csEnums.ViewportType.STACK) {
      // check if imageIds is valid
      if (!viewportData.data[0].imageIds?.length) {
        return;
      }
    }

    // This is the old viewportInfo, which may have old options but we might be
    // using its viewport (same viewportId as the new viewportInfo)
    const viewportInfo = this.viewportsById.get(viewportId);

    // We should store the presentation for the current viewport since we can't only
    // rely to store it WHEN the viewport is disabled since we might keep around the
    // same viewport/element and just change the viewportData for it (drag and drop etc.)
    // the disableElement storePresentation handle would not be called in this case
    // and we would lose the presentation.
    this.storePresentation({ viewportId: viewportInfo.getViewportId() });

    // Todo: i don't like this here, move it
    this.servicesManager.services.segmentationService.clearSegmentationRepresentations(
      viewportInfo.getViewportId()
    );

    if (!viewportInfo) {
      throw new Error('element is not enabled for the given viewportId');
    }

    // override the viewportOptions and displaySetOptions with the public ones
    // since those are the newly set ones, we set them here so that it handles defaults
    const displaySetOptions = viewportInfo.setPublicDisplaySetOptions(publicDisplaySetOptions);
    // Specify an over-ride for the viewport type, even though it is in the public
    // viewport options, because the one in the viewportData is a requirement based on the
    // type of data being displayed.
    const viewportOptions = viewportInfo.setPublicViewportOptions(
      publicViewportOptions,
      viewportData.viewportType
    );

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

  public getViewportOptions(viewportId: string): ViewportOptions {
    return this.viewportsById.get(viewportId).getViewportOptions();
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

  public getOrientation(viewportId: string): string {
    const viewportInfo = this.getViewportInfo(viewportId);
    return viewportInfo.getOrientation();
  }

  /**
   * Looks through the viewports to see if the specified measurement can be
   * displayed in one of the viewports. This function tries to get a "best fit"
   * viewport to display the image in where it matches, in order:
   *   * Active viewport that can be navigated to the given image without orientation change
   *   * Other viewport that can be navigated to the given image without orientation change
   *   * Active viewport that can change orientation to display the image
   *   * Other viewport that can change orientation to display the image
   *
   * It returns `null` otherwise, indicating that a viewport needs display set/type
   * changes in order to display the image.
   *
   * Notes:
   *   * If the display set is displayed in multiple viewports all needing orientation change,
   *     then the active one or first one listed will be modified.  This can create unexpected
   *     behaviour for MPR views.
   *   * If the image is contained in multiple display sets, then the first one
   *     found will be navigated (active first, followed by first found)
   *
   * @param measurement - The measurement that is desired to view.
   * @param activeViewportId - the index that was active at the time the jump
   *          was initiated.
   * @return the viewportId that the measurement should be displayed in.
   */
  public findNavigationCompatibleViewportId(activeViewportId: string, metadata): string {
    // First check if the active viewport can just be navigated to show the given item
    const activeViewport = this.getCornerstoneViewport(activeViewportId);
    if (!activeViewport) {
      console.warn('No active viewport found for', activeViewportId);
    }
    if (activeViewport?.isReferenceViewable(metadata, { withNavigation: true })) {
      return activeViewportId;
    }

    // Next, see if any viewport could be navigated to show the given item,
    // without considering orientation changes.
    for (const id of this.viewportsById.keys()) {
      const viewport = this.getCornerstoneViewport(id);
      if (viewport?.isReferenceViewable(metadata, { withNavigation: true })) {
        return id;
      }
    }

    // No viewport is in the right display set/orientation to show this, so see if
    // the active viewport could change orientations to show this
    if (
      activeViewport?.isReferenceViewable(metadata, { withNavigation: true, withOrientation: true })
    ) {
      return activeViewportId;
    }

    // See if any viewport could show this with an orientation change
    for (const id of this.viewportsById.keys()) {
      const viewport = this.getCornerstoneViewport(id);
      if (
        viewport?.isReferenceViewable(metadata, { withNavigation: true, withOrientation: true })
      ) {
        return id;
      }
    }

    // No luck, need to update the viewport itself
    return null;
  }

  /**
   * Figures out which viewport to update when the viewport type needs to change.
   * This may not be the active viewport if there is already a viewport showing
   * the display set, but in the wrong orientation.
   *
   * The viewport will need to update the viewport type and/or display set to
   * display the resulting data.
   *
   * The first choice will be a viewport already showing the correct display set,
   * but showing it as a stack.
   *
   * Second choice is to see if there is a viewport already showing the right
   * orientation for the image, but the wrong display set.  This fixes the
   * case where the user is in MPR and a viewport other than active should be
   * the one to change to display the iamge.
   *
   * Final choice is to use the provide activeViewportId.  This will cover
   * changes to/from video and wsi viewports and other cases where no
   * viewport is really even close to being able to display the measurement.
   */
  public findUpdateableViewportConfiguration(activeViewportId: string, measurement) {
    const { metadata, displaySetInstanceUID } = measurement;
    const { volumeId, referencedImageId } = metadata;
    const { displaySetService, viewportGridService } = this.servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    let { viewportType } = displaySet;
    if (!viewportType) {
      if (referencedImageId && !displaySet.isReconstructable) {
        viewportType = csEnums.ViewportType.STACK;
      } else if (volumeId) {
        viewportType = 'volume';
      }
    }

    // Find viewports that could be updated to be volumes to show this view
    // That prefers a viewport already showing the right display set.
    if (volumeId) {
      for (const id of this.viewportsById.keys()) {
        const viewport = this.getCornerstoneViewport(id);
        if (viewport?.isReferenceViewable(metadata, { asVolume: true, withNavigation: true })) {
          return {
            viewportId: id,
            displaySetInstanceUID,
            viewportOptions: { viewportType },
          };
        }
      }
    }

    // Find a viewport in the correct orientation showing a different display set
    // which could be used to display the annotation.
    const altMetadata = { ...metadata, volumeId: null, referencedImageId: null };
    for (const id of this.viewportsById.keys()) {
      const viewport = this.getCornerstoneViewport(id);
      const viewportDisplaySetUID = viewportGridService.getDisplaySetsUIDsForViewport(id)?.[0];
      if (!viewportDisplaySetUID || !viewport) {
        continue;
      }
      if (volumeId) {
        altMetadata.volumeId = viewportDisplaySetUID;
      }
      altMetadata.FrameOfReferenceUID = this._getFrameOfReferenceUID(viewportDisplaySetUID);
      if (viewport.isReferenceViewable(altMetadata, { asVolume: true, withNavigation: true })) {
        return {
          viewportId: id,
          displaySetInstanceUID,
          viewportOptions: { viewportType },
        };
      }
    }

    // Just display in the active viewport
    return {
      viewportId: activeViewportId,
      displaySetInstanceUID,
      viewportOptions: { viewportType },
    };
  }

  /**
   * Sets the image data for the given viewport.
   */
  private async _setOtherViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    _presentations: Presentations = {}
  ): Promise<void> {
    const [displaySet] = viewportData.data;
    return viewport.setDataIds(displaySet.imageIds, {
      groupId: displaySet.displaySetInstanceUID,
      viewReference: viewportInfo.getViewReference(),
    });
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

    // Use the slice index from any provided view reference, as the view reference
    // is being used to navigate to the initial view position for measurement
    // navigation and other navigation forcing specific views.
    let initialImageIndexToUse =
      presentations?.positionPresentation?.initialImageIndex ?? <number>initialImageIndex;

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

      properties.invert = voiInverted ?? properties.invert;
      properties.colormap = colormap ?? properties.colormap;
    }

    viewport.element.addEventListener(csEnums.Events.VIEWPORT_NEW_IMAGE_SET, evt => {
      const { element } = evt.detail;

      if (element !== viewport.element) {
        return;
      }

      csToolsUtils.stackContextPrefetch.enable(element);
    });

    const overlayProcessingResults = this._processExtraDisplaySetsForViewport(viewport);

    const referencedImageId = presentations?.positionPresentation?.viewReference?.referencedImageId;
    if (referencedImageId) {
      initialImageIndexToUse = imageIds.indexOf(referencedImageId);
    }

    if (
      initialImageIndexToUse === undefined ||
      initialImageIndexToUse === null ||
      initialImageIndexToUse < 0
    ) {
      initialImageIndexToUse = this._getInitialImageIndexForViewport(viewportInfo, imageIds) || 0;
    }

    return viewport.setStack(imageIds, initialImageIndexToUse).then(() => {
      viewport.setProperties({ ...properties });
      this.setPresentations(viewport.id, presentations, viewportInfo);

      if (overlayProcessingResults?.length) {
        overlayProcessingResults.forEach(overlayProcessingResult => {
          if (overlayProcessingResult?.addOverlayFn) {
            overlayProcessingResult.addOverlayFn();
          }
        });
      }

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
      return csUtils.clip(imageIndex, 0, lastSliceIndex);
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
    const { displaySetService } = this.servicesManager.services;
    const volumeInputArray = [];
    const displaySetOptionsArray = viewportInfo.getDisplaySetOptions();
    const { hangingProtocolService } = this.servicesManager.services;

    const volumeToLoad = [];
    const displaySetInstanceUIDs = [];

    for (const [index, data] of viewportData.data.entries()) {
      const { imageIds, displaySetInstanceUID } = data;
      let volume = data.volume;

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      if (!volume && displaySet.images) {
        volume = csToolsUtils.getOrCreateImageVolume(displaySet.images.map(image => image.imageId));
      }

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
        modality: displaySet.Modality,
        displaySetInstanceUID,
        blendMode: displaySetOptions.blendMode,
        slabThickness: this._getSlabThickness(displaySetOptions, volumeId),
      });
    }

    this.viewportsDisplaySets.set(viewport.id, displaySetInstanceUIDs);

    const volumesNotLoaded = volumeToLoad.filter(volume => !volume.loadStatus?.loaded);
    if (volumesNotLoaded.length) {
      if (hangingProtocolService.getShouldPerformCustomImageLoad()) {
        // delegate the volume loading to the hanging protocol service if it has a custom image load strategy
        return hangingProtocolService.runImageLoadStrategy({
          viewportId: viewport.id,
          volumeInputArray,
        });
      }

      volumesNotLoaded.forEach(volume => {
        if (!volume.loadStatus?.loading && volume.load instanceof Function) {
          volume.load();
        }
      });
    }

    // It's crucial not to return here because the volume may be loaded,
    // but the viewport also needs to set the volume.
    // if (!volumesNotLoaded.length) {
    //   return;
    // }

    // This returns the async continuation only
    return this.setVolumesForViewport(viewport, volumeInputArray, presentations);
  }

  public async setVolumesForViewport(viewport, volumeInputArray, presentations) {
    const { displaySetService, viewportGridService } = this.servicesManager.services;

    const viewportInfo = this.getViewportInfo(viewport.id);
    const displaySetOptions = viewportInfo.getDisplaySetOptions();
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewport.id);
    const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
    const displaySetModality = displaySet?.Modality;

    // filter overlay display sets (e.g. segmentation) since they will get handled below via the segmentation service
    const filteredVolumeInputArray = volumeInputArray
      .map((volumeInput, index) => {
        return { volumeInput, displaySetOptions: displaySetOptions[index] };
      })
      .filter(({ volumeInput }) => {
        const displaySet = displaySetService.getDisplaySetByUID(volumeInput.displaySetInstanceUID);
        return !displaySet?.isOverlayDisplaySet;
      });

    // Todo: use presentations states
    const volumesProperties = filteredVolumeInputArray.map(({ volumeInput, displaySetOptions }) => {
      const { volumeId } = volumeInput;
      const { voi, voiInverted, colormap, displayPreset } = displaySetOptions;
      const properties = {} as ViewportProperties;

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

    // For SEG and RT viewports
    const overlayProcessingResults = this._processExtraDisplaySetsForViewport(viewport) || [];
    if (!filteredVolumeInputArray.length && overlayProcessingResults?.length) {
      overlayProcessingResults.forEach(({ imageIds, addOverlayFn }) => {
        if (addOverlayFn) {
          // if there is no volume input array, and there is an addOverlayFn, means we need to take
          // care of the background overlay display set first then the addOverlayFn will add the
          // SEG displaySet
          const sampleImageId = imageIds[0];
          const backgroundDisplaySet = displaySetService.getDisplaySetsBy(
            displaySet =>
              !displaySet.isOverlayDisplaySet &&
              displaySet.images.some(image => image.imageId === sampleImageId)
          );

          if (backgroundDisplaySet.length !== 1) {
            throw new Error('Background display set not found');
          }
        }
      });
    }

    await viewport.setVolumes(volumeInputArray);

    if (overlayProcessingResults?.length) {
      overlayProcessingResults.forEach(({ addOverlayFn }) => {
        if (addOverlayFn) {
          addOverlayFn();
        }
      });
    }
    viewport.render();

    volumesProperties.forEach(({ properties, volumeId }) => {
      setTimeout(() => {
        // seems like a hack but we need the actor to be ready first before
        // we set the properties
        viewport.setProperties(properties, volumeId);
        viewport.render();
      }, 0);
    });

    this.setPresentations(viewport.id, presentations, viewportInfo);

    if (!presentations.positionPresentation) {
      const imageIndex = this._getInitialImageIndexForViewport(viewportInfo);

      if (imageIndex !== undefined) {
        csUtils.jumpToSlice(viewport.element, {
          imageIndex,
        });
      }
    }

    this._broadcastEvent(this.EVENTS.VIEWPORT_VOLUMES_CHANGED, {
      viewportInfo,
    });
  }

  private _processExtraDisplaySetsForViewport(
    viewport: Types.IStackViewport | Types.IVolumeViewport
  ) {
    const { displaySetService } = this.servicesManager.services;

    // load any secondary displaySets
    const displaySetInstanceUIDs = this.viewportsDisplaySets.get(viewport.id);

    // Find overlay display sets (e.g. SEG, RTSTRUCT)
    const overlayDisplaySets = displaySetInstanceUIDs
      .map(displaySetService.getDisplaySetByUID)
      .filter(displaySet => displaySet?.isOverlayDisplaySet);

    // if it is only the overlay displaySet, then we need to get the reference
    // displaySet imageIds and set them as the imageIds for the viewport,
    // here we can do some logic if the reference is missing
    // then find the most similar match of displaySet instead
    if (!overlayDisplaySets?.length) {
      return;
    }

    return overlayDisplaySets.map(overlayDisplaySet => {
      let imageIds;
      if (overlayDisplaySet.referencedDisplaySetInstanceUID) {
        const referenceDisplaySet = displaySetService.getDisplaySetByUID(
          overlayDisplaySet.referencedDisplaySetInstanceUID
        );
        imageIds = referenceDisplaySet.images.map(image => image.imageId);
      }
      return {
        imageIds,
        addOverlayFn: () => this.addOverlayRepresentationForDisplaySet(overlayDisplaySet, viewport),
      };
    });
  }

  private addOverlayRepresentationForDisplaySet(
    displaySet: OhifTypes.DisplaySet,
    viewport: Types.IViewport
  ) {
    const { segmentationService } = this.servicesManager.services;
    const segmentationId = displaySet.displaySetInstanceUID;

    const representationType =
      displaySet.Modality === 'SEG'
        ? csToolsEnums.SegmentationRepresentations.Labelmap
        : csToolsEnums.SegmentationRepresentations.Contour;

    segmentationService.addSegmentationRepresentation(viewport.id, {
      segmentationId,
      type: representationType,
    });

    // store the segmentation presentation id in the viewport info
    this.storePresentation({ viewportId: viewport.id });
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

    return this._setOtherViewport(
      viewport,
      viewportData as StackViewportData,
      viewportInfo,
      presentations
    );
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

      const { dimensions, spacing } = imageVolume;
      const slabThickness = Math.sqrt(
        Math.pow(dimensions[0] * spacing[0], 2) +
          Math.pow(dimensions[1] * spacing[1], 2) +
          Math.pow(dimensions[2] * spacing[2], 2)
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
      viewports.forEach(({ id: viewportId }) => {
        const presentation = this._getPositionPresentation(viewportId);

        // During a resize, the slice index should remain unchanged. This is a temporary fix for
        // a larger issue regarding the definition of slice index with slab thickness.
        // We need to revisit this to make it more robust and understandable.
        delete presentation.viewReference?.sliceIndex;
        this.beforeResizePositionPresentations.set(viewportId, presentation);
      });

      // Resize the rendering engine and render.
      const renderingEngine = this.renderingEngine;
      renderingEngine.resize(isImmediate);
      renderingEngine.render();

      // Reset the camera for all viewports using position presentation to maintain relative size/position
      // which means only those viewports that have a zoom level of 1.
      this.beforeResizePositionPresentations.forEach((positionPresentation, viewportId) => {
        this.setPresentations(viewportId, {
          positionPresentation,
        });
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

  private _setLutPresentation(
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    lutPresentation: LutPresentation
  ): void {
    if (!lutPresentation) {
      return;
    }

    const { properties } = lutPresentation;
    if (viewport instanceof BaseVolumeViewport) {
      if (properties instanceof Map) {
        properties.forEach((propertiesEntry, volumeId) => {
          viewport.setProperties(propertiesEntry, volumeId);
        });
      } else {
        viewport.setProperties(properties);
      }
    } else {
      viewport.setProperties(properties);
    }
  }

  private _setPositionPresentation(
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    positionPresentation: PositionPresentation
  ): void {
    const viewRef = positionPresentation?.viewReference;
    if (viewRef) {
      // The orientation can be updated here to navigate to the specified
      // measurement or previous item, but this will not switch to volume
      // or to stack from the other type
      if (viewport.isReferenceViewable(viewRef, WITH_ORIENTATION)) {
        viewport.setViewReference(viewRef);
      } else {
        console.warn('Unable to apply reference viewable', viewRef);
      }
    }

    const viewPresentation = positionPresentation?.viewPresentation;
    if (viewPresentation) {
      viewport.setViewPresentation(viewPresentation);
    }
  }

  private _setSegmentationPresentation(
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    segmentationPresentation: SegmentationPresentation
  ): void {
    if (!segmentationPresentation) {
      return;
    }

    const { segmentationService } = this.servicesManager.services;

    segmentationPresentation.forEach((presentationItem: SegmentationPresentationItem) => {
      const { segmentationId, type, hydrated } = presentationItem;

      if (hydrated) {
        segmentationService.addSegmentationRepresentation(viewport.id, {
          segmentationId,
          type,
        });
      }
    });
  }

  /**
   * Gets the display sets for a given viewport
   * @param viewportId - The ID of the viewport to get display sets for
   * @returns Array of display sets for the viewport
   */
  public getViewportDisplaySets(viewportId: string): OhifTypes.DisplaySet[] {
    const { displaySetService } = this.servicesManager.services;
    const displaySetInstanceUIDs = this.viewportsDisplaySets.get(viewportId) || [];

    return displaySetInstanceUIDs
      .map(uid => displaySetService.getDisplaySetByUID(uid))
      .filter(Boolean);
  }
}

export default CornerstoneViewportService;
