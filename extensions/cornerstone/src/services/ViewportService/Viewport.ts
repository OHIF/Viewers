import {
  Types,
  Enums,
  getEnabledElementByViewportId,
  VolumeViewport,
  utilities,
} from '@cornerstonejs/core';
import { Types as CoreTypes } from '@ohif/core';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import getCornerstoneBlendMode from '../../utils/getCornerstoneBlendMode';
import getCornerstoneOrientation from '../../utils/getCornerstoneOrientation';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import JumpPresets from '../../utils/JumpPresets';
import { SyncGroup } from '../SyncGroupService/SyncGroupService';

export type InitialImageOptions = {
  index?: number;
  preset?: JumpPresets;
  useOnce?: boolean;
};

export type ViewportOptions = {
  id?: string;
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId: string;
  // Presentation ID to store/load presentation state from
  presentationIds?: CoreTypes.PresentationIds;
  orientation?: Enums.OrientationAxis;
  background?: Types.Point3;
  displayArea?: Types.DisplayArea;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportProps?: Record<string, unknown>;
  /*
   * Allows drag and drop of display sets not matching viewport options, but
   * doesn't show them initially.  Displays initially blank if no required match
   */
  allowUnmatchedView?: boolean;
};

export type PublicViewportOptions = {
  id?: string;
  viewportType?: string;
  toolGroupId?: string;
  presentationIds?: CoreTypes.PresentationIds;
  viewportId?: string;
  orientation?: Enums.OrientationAxis;
  background?: Types.Point3;
  displayArea?: Types.DisplayArea;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportProps?: Record<string, unknown>;
  allowUnmatchedView?: boolean;
};

export type DisplaySetSelector = {
  id?: string;
  options?: PublicDisplaySetOptions;
};

export type PublicDisplaySetOptions = {
  /** The display set options can have an id in order to distinguish
   * it from other similar items.
   */
  id?: string;
  voi?: VOI;
  voiInverted?: boolean;
  blendMode?: string;
  slabThickness?: number;
  colormap?: string;
  displayPreset?: string;
};

export type DisplaySetOptions = {
  id?: string;
  voi?: VOI;
  voiInverted: boolean;
  blendMode?: Enums.BlendModes;
  slabThickness?: number;
  colormap?: { name: string; opacity?: number };
  displayPreset?: string;
};

type VOI = {
  windowWidth: number;
  windowCenter: number;
};

export type DisplaySet = {
  displaySetInstanceUID: string;
};

const STACK = 'stack';
const DEFAULT_TOOLGROUP_ID = 'default';

// Return true if the data contains the given display set UID OR the imageId
// if it is a composite object.
const dataContains = ({ data, displaySetUID, imageId, viewport }): boolean => {
  if (imageId && data.isCompositeStack && data.imageIds) {
    return !!data.imageIds.find(dataId => dataId === imageId);
  }

  if (imageId && (data.volumeId || viewport instanceof VolumeViewport)) {
    const isAcquisition = !!viewport.getCurrentImageId();

    if (!isAcquisition) {
      return false;
    }

    const imageURI = utilities.imageIdToURI(imageId);
    const hasImageId = viewport.hasImageURI(imageURI);

    if (hasImageId) {
      return true;
    }
  }

  if (data.displaySetInstanceUID === displaySetUID) {
    return true;
  }

  return false;
};

class ViewportInfo {
  private viewportId = '';
  private element: HTMLDivElement;
  private viewportOptions: ViewportOptions;
  private displaySetOptions: Array<DisplaySetOptions>;
  private viewportData: StackViewportData | VolumeViewportData;
  private renderingEngineId: string;

  constructor(viewportId: string) {
    this.viewportId = viewportId;
    this.setPublicViewportOptions({});
    this.setPublicDisplaySetOptions([{}]);
  }

  /**
   * Return true if the viewport contains the given display set UID,
   * OR if it is a composite stack and contains the given imageId
   */
  public contains(displaySetUID: string, imageId: string): boolean {
    if (!this.viewportData?.data) {
      return false;
    }

    const { viewport } = getEnabledElementByViewportId(this.viewportId) || {};

    if (this.viewportData.data.length) {
      return !!this.viewportData.data.find(data =>
        dataContains({ data, displaySetUID, imageId, viewport })
      );
    }

    return dataContains({
      data: this.viewportData.data,
      displaySetUID,
      imageId,
      viewport,
    });
  }

  public destroy = (): void => {
    this.element = null;
    this.viewportData = null;
    this.viewportOptions = null;
    this.displaySetOptions = null;
  };

  public setRenderingEngineId(renderingEngineId: string): void {
    this.renderingEngineId = renderingEngineId;
  }

  public getRenderingEngineId(): string {
    return this.renderingEngineId;
  }

  public setViewportId(viewportId: string): void {
    this.viewportId = viewportId;
  }

  public setElement(element: HTMLDivElement): void {
    this.element = element;
  }

  public setViewportData(viewportData: StackViewportData | VolumeViewportData): void {
    this.viewportData = viewportData;
  }

  public getViewportData(): StackViewportData | VolumeViewportData {
    return this.viewportData;
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }

  public getViewportId(): string {
    return this.viewportId;
  }

  public setPublicDisplaySetOptions(
    publicDisplaySetOptions: PublicDisplaySetOptions[] | DisplaySetSelector[]
  ): Array<DisplaySetOptions> {
    // map the displaySetOptions and check if they are undefined then set them to default values
    const displaySetOptions = this.mapDisplaySetOptions(publicDisplaySetOptions);

    this.setDisplaySetOptions(displaySetOptions);

    return this.displaySetOptions;
  }

  public hasDisplaySet(displaySetInstanceUID: string): boolean {
    // Todo: currently this does not work for non image & referenceImage displaySets.
    // Since SEG and other derived displaySets are loaded in a different way, and not
    // via cornerstoneViewportService
    let viewportData = this.getViewportData();

    if (
      viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC ||
      viewportData.viewportType === Enums.ViewportType.VOLUME_3D
    ) {
      viewportData = viewportData as VolumeViewportData;
      return viewportData.data.some(
        ({ displaySetInstanceUID: dsUID }) => dsUID === displaySetInstanceUID
      );
    }

    viewportData = viewportData as StackViewportData;
    return viewportData.data.displaySetInstanceUID === displaySetInstanceUID;
  }

  public setPublicViewportOptions(viewportOptionsEntry: PublicViewportOptions): ViewportOptions {
    let viewportType = viewportOptionsEntry.viewportType;
    const { toolGroupId = DEFAULT_TOOLGROUP_ID, presentationIds } = viewportOptionsEntry;
    let orientation;

    if (!viewportType) {
      viewportType = getCornerstoneViewportType(STACK);
    } else {
      viewportType = getCornerstoneViewportType(viewportOptionsEntry.viewportType);
    }

    // map SAGITTAL, AXIAL, CORONAL orientation to be used by cornerstone
    if (viewportOptionsEntry.viewportType?.toLowerCase() !== STACK) {
      orientation = getCornerstoneOrientation(viewportOptionsEntry.orientation);
    }

    if (!toolGroupId) {
      toolGroupId = DEFAULT_TOOLGROUP_ID;
    }

    this.setViewportOptions({
      ...viewportOptionsEntry,
      viewportId: this.viewportId,
      viewportType: viewportType as Enums.ViewportType,
      orientation,
      toolGroupId,
      presentationIds,
    });

    return this.viewportOptions;
  }

  public setViewportOptions(viewportOptions: ViewportOptions): void {
    this.viewportOptions = viewportOptions;
  }

  public getViewportOptions(): ViewportOptions {
    return this.viewportOptions;
  }

  public getPresentationIds(): CoreTypes.PresentationIds {
    const { presentationIds } = this.viewportOptions;
    return presentationIds;
  }

  public setDisplaySetOptions(displaySetOptions: Array<DisplaySetOptions>): void {
    this.displaySetOptions = displaySetOptions;
  }

  public getSyncGroups(): SyncGroup[] {
    this.viewportOptions.syncGroups ||= [];
    return this.viewportOptions.syncGroups;
  }

  public getDisplaySetOptions(): Array<DisplaySetOptions> {
    return this.displaySetOptions;
  }

  public getViewportType(): Enums.ViewportType {
    return this.viewportOptions.viewportType || Enums.ViewportType.STACK;
  }

  public getToolGroupId(): string {
    return this.viewportOptions.toolGroupId;
  }

  public getBackground(): Types.Point3 {
    return this.viewportOptions.background || [0, 0, 0];
  }

  public getOrientation(): Enums.OrientationAxis {
    return this.viewportOptions.orientation;
  }

  public getDisplayArea(): Types.DisplayArea {
    return this.viewportOptions.displayArea;
  }

  public getInitialImageOptions(): InitialImageOptions {
    return this.viewportOptions.initialImageOptions;
  }

  // Handle incoming public display set options or a display set select
  // with a contained options.
  private mapDisplaySetOptions(
    options: PublicDisplaySetOptions[] | DisplaySetSelector[] = [{}]
  ): Array<DisplaySetOptions> {
    const displaySetOptions: Array<DisplaySetOptions> = [];

    options.forEach(item => {
      let option = item?.options || item;
      if (!option) {
        option = {
          blendMode: undefined,
          slabThickness: undefined,
          colormap: undefined,
          voi: {},
          voiInverted: false,
        };
      }
      const blendMode = getCornerstoneBlendMode(option.blendMode);

      displaySetOptions.push({
        voi: option.voi,
        voiInverted: option.voiInverted,
        colormap: option.colormap,
        slabThickness: option.slabThickness,
        blendMode,
        displayPreset: option.displayPreset,
      });
    });

    return displaySetOptions;
  }
}

export default ViewportInfo;
