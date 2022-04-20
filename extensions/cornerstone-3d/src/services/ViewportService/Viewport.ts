import { Types, Enums } from '@cornerstonejs/core';

export type ViewportOptions = {
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId?: string;
  orientation?: Types.Orientation;
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

class ViewportInfo {
  private viewportId = '';
  private viewportIndex: number;
  private element: HTMLDivElement;
  private viewportOptions: ViewportOptions;
  private displaySetOptions: Array<DisplaySetOptions>;
  private renderingEngineId: string;

  constructor(viewportIndex: number) {
    this.viewportIndex = viewportIndex;
    this.makeViewportId(viewportIndex);
    const viewportOptions = {
      toolGroupId: 'default',
      viewportType: Enums.ViewportType.STACK,
    };
    const displaySetOptions = [{} as DisplaySetOptions];
    this.setViewportOptions(viewportOptions);
    this.setDisplaySetOptions(displaySetOptions);
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

  private makeViewportId(viewportIndex: number): void {
    const viewportId = `viewport-${viewportIndex}`;
    this.setViewportId(viewportId);
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
