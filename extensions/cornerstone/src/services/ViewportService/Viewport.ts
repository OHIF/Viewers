import { Types, Enums } from '@cornerstonejs/core';
import getCornerstoneBlendMode from '../../utils/getCornerstoneBlendMode';
import getCornerstoneOrientation from '../../utils/getCornerstoneOrientation';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import JumpPresets from '../../utils/JumpPresets';
import { SyncGroup } from '../SyncGroupService/SyncGroupService';
import {
  StackViewportData,
  VolumeViewportData,
} from '../../types/CornerstoneCacheService';

export type InitialImageOptions = {
  index?: number;
  preset?: JumpPresets;
};

export type ViewportOptions = {
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId: string;
  // Presentation ID to store/load presentation state from
  presentationId?: string;
  orientation?: Types.Orientation;
  background?: Types.Point3;
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
  viewportType?: string;
  toolGroupId?: string;
  presentationId?: string;
  viewportId?: string;
  orientation?: string;
  background?: Types.Point3;
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
  voi?: VOI;
  voiInverted?: boolean;
  blendMode?: string;
  slabThickness?: number;
  colormap?: string;
};

export type DisplaySetOptions = {
  voi?: VOI;
  voiInverted: boolean;
  blendMode?: Enums.BlendModes;
  slabThickness?: number;
  colormap?: string;
};

type VOI = {
  windowWidth: number;
  windowCenter: number;
};

export type DisplaySet = {
  displaySetInstanceUID: string;
};

const STACK = 'stack';
const VOLUME = 'volume';
const DEFAULT_TOOLGROUP_ID = 'default';

class ViewportInfo {
  private viewportId = '';
  private viewportIndex: number;
  private element: HTMLDivElement;
  private viewportOptions: ViewportOptions;
  private displaySetOptions: Array<DisplaySetOptions>;
  private viewportData: StackViewportData | VolumeViewportData;
  private renderingEngineId: string;

  constructor(viewportIndex: number, viewportId: string) {
    this.viewportIndex = viewportIndex;
    this.viewportId = viewportId;
    this.setPublicViewportOptions({});
    this.setPublicDisplaySetOptions([{}]);
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
  public setViewportIndex(viewportIndex: number): void {
    this.viewportIndex = viewportIndex;
  }

  public setElement(element: HTMLDivElement): void {
    this.element = element;
  }

  public setViewportData(
    viewportData: StackViewportData | VolumeViewportData
  ): void {
    this.viewportData = viewportData;
  }

  public getViewportData(): StackViewportData | VolumeViewportData {
    return this.viewportData;
  }

  public getViewportIndex(): number {
    return this.viewportIndex;
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }

  public getViewportId(): string {
    return this.viewportId;
  }

  public setPublicDisplaySetOptions(
    publicDisplaySetOptions: PublicDisplaySetOptions[] | DisplaySetSelector[]
  ): void {
    // map the displaySetOptions and check if they are undefined then set them to default values
    const displaySetOptions = this.mapDisplaySetOptions(
      publicDisplaySetOptions
    );

    this.setDisplaySetOptions(displaySetOptions);
  }

  public hasDisplaySet(displaySetInstanceUID: string): boolean {
    // Todo: currently this does not work for non image & referenceImage displaySets.
    // Since SEG and other derived displaySets are loaded in a different way, and not
    // via cornerstoneViewportService
    let viewportData = this.getViewportData();

    if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      viewportData = viewportData as VolumeViewportData;
      return viewportData.data.some(
        ({ displaySetInstanceUID: dsUID }) => dsUID === displaySetInstanceUID
      );
    }

    viewportData = viewportData as StackViewportData;
    return viewportData.data.displaySetInstanceUID === displaySetInstanceUID;
  }

  public setPublicViewportOptions(
    viewportOptionsEntry: PublicViewportOptions
  ): void {
    let viewportType = viewportOptionsEntry.viewportType;
    const {
      toolGroupId = DEFAULT_TOOLGROUP_ID,
      presentationId,
    } = viewportOptionsEntry;
    let orientation;

    if (!viewportType) {
      viewportType = getCornerstoneViewportType(STACK);
    } else {
      viewportType = getCornerstoneViewportType(
        viewportOptionsEntry.viewportType
      );
    }

    // map SAGITTAL, AXIAL, CORONAL orientation to be used by cornerstone
    if (viewportOptionsEntry.viewportType?.toLowerCase() === VOLUME) {
      orientation = getCornerstoneOrientation(viewportOptionsEntry.orientation);
    } else {
      orientation = Enums.OrientationAxis.AXIAL;
    }

    this.setViewportOptions({
      ...viewportOptionsEntry,
      viewportId: this.viewportId,
      viewportType: viewportType as Enums.ViewportType,
      orientation,
      toolGroupId,
      presentationId,
    });
  }

  public setViewportOptions(viewportOptions: ViewportOptions): void {
    this.viewportOptions = viewportOptions;
  }

  public getViewportOptions(): ViewportOptions {
    return this.viewportOptions;
  }

  public setDisplaySetOptions(
    displaySetOptions: Array<DisplaySetOptions>
  ): void {
    this.displaySetOptions = displaySetOptions;
  }

  public getSyncGroups(): SyncGroup[] {
    return this.viewportOptions.syncGroups || [];
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

  public getOrientation(): Types.Orientation {
    return this.viewportOptions.orientation;
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
      });
    });

    return displaySetOptions;
  }
}

export default ViewportInfo;
