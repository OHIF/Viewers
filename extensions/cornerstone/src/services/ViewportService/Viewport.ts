import { Types, Enums, CONSTANTS } from '@cornerstonejs/core';
import getCornerstoneBlendMode from '../../utils/getCornerstoneBlendMode';
import getCornerstoneOrientation from '../../utils/getCornerstoneOrientation';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import JumpPresets from '../../utils/JumpPresets';
import { SyncGroup } from '../SyncGroupService/SyncGroupService';

export type InitialImageOptions = {
  index?: number;
  preset?: JumpPresets;
};

export type ViewportOptions = {
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId: string;
  orientation?: Types.Orientation;
  background?: Types.Point3;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportOptions?: Record<string, unknown>;
};

export type PublicViewportOptions = {
  viewportType?: string;
  toolGroupId?: string;
  viewportId?: string;
  orientation?: string;
  background?: Types.Point3;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportOptions?: Record<string, unknown>;
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
  private renderingEngineId: string;

  constructor(viewportIndex: number, viewportId: string) {
    this.viewportIndex = viewportIndex;
    this.viewportId = viewportId;
    this.setPublicViewportOptions({});
    this.setPublicDisplaySetOptions([{}]);
  }

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
    publicDisplaySetOptions: Array<PublicDisplaySetOptions>
  ): void {
    // map the displaySetOptions and check if they are undefined then set them to default values
    const displaySetOptions = this.mapDisplaySetOptions(
      publicDisplaySetOptions
    );

    this.setDisplaySetOptions(displaySetOptions);
  }

  public setPublicViewportOptions(
    viewportOptionsEntry: PublicViewportOptions
  ): void {
    let viewportType = viewportOptionsEntry.viewportType;
    let toolGroupId = viewportOptionsEntry.toolGroupId;
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
      orientation = CONSTANTS.ORIENTATION.AXIAL;
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

  private mapDisplaySetOptions(
    publicDisplaySetOptions: Array<PublicDisplaySetOptions>
  ): Array<DisplaySetOptions> {
    const displaySetOptions: Array<DisplaySetOptions> = [];

    publicDisplaySetOptions.forEach(option => {
      const blendMode = getCornerstoneBlendMode(option.blendMode);

      displaySetOptions.push({
        voi: option.voi || ({} as VOI),
        voiInverted: option.voiInverted || false,
        colormap: option.colormap || undefined,
        slabThickness: option.slabThickness,
        blendMode,
      });
    });

    return displaySetOptions;
  }
}

export default ViewportInfo;
