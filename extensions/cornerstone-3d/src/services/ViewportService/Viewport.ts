import { Types, Enums, CONSTANTS } from '@cornerstonejs/core';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';

export type ViewportOptions = {
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId: string;
  orientation?: Types.Orientation;
  background?: Types.Point3;
  blendMode?: number;
  initialView?: string;
};

export type PublicViewportOptions = {
  viewportType?: string;
  toolGroupId?: string;
  viewportId?: string;
  orientation?: string;
  background?: Types.Point3;
  blendMode?: number;
  initialView?: string;
};

type VOI = {
  windowWidth: number;
  windowCenter: number;
};

export type DisplaySetOptions = {
  voi: 'default' | VOI;
  voiInverted: boolean;
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
      orientation = this._getCornerstone3DViewportOrientation(
        viewportOptionsEntry.orientation
      );
    } else {
      orientation = CONSTANTS.ORIENTATION.AXIAL;
    }

    if (!toolGroupId) {
      toolGroupId = DEFAULT_TOOLGROUP_ID;
    }

    this.viewportOptions = {
      ...viewportOptionsEntry,
      viewportId: this.viewportId,
      viewportType: viewportType as Enums.ViewportType,
      orientation,
      toolGroupId,
    };
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
    // validate the displaySetOptions and check if they are undefined then set them to default values
    this.validateDisplaySetOptions(displaySetOptions);
    this.displaySetOptions = displaySetOptions;
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

  private _getCornerstone3DViewportOrientation(
    orientation: string
  ): Types.Orientation {
    if (!orientation) {
      return CONSTANTS.ORIENTATION.AXIAL;
    }
  }

  private validateDisplaySetOptions(
    displaySetOptions: Array<DisplaySetOptions>
  ): void {
    for (const displaySetOption of displaySetOptions) {
      displaySetOption.voi = displaySetOption.voi || 'default';
      displaySetOption.voiInverted = displaySetOption.voiInverted || false;
    }
  }
}

export default ViewportInfo;
