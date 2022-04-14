import { Types, Enums, CONSTANTS } from '@cornerstonejs/core';

export type ViewportOptions = {
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId?: string;
  orientation?: Types.Orientation;
  background?: Types.Point3;
  blendMode?: number;
  initialView?: string;
  //   syncGroups: string[];
};

export type DisplaySetOptions = {};

export type DisplaySet = {
  displaySetInstanceUID: string;
};

class ViewportInfo {
  private viewportId = '';
  private viewportIndex: number;
  private element: HTMLDivElement;
  private viewportOptions: ViewportOptions;
  private displaySetOptions: Array<DisplaySetOptions>;
  private displaySets: Array<DisplaySet>;
  private renderingEngineId: string;

  constructor(viewportIndex: number) {
    this.viewportIndex = viewportIndex;
    this.makeViewportId(viewportIndex);
    const viewportOptions = {
      toolGroupId: 'default',
      viewportType: Enums.ViewportType.STACK,
    };
    this.setViewportOptions(viewportOptions);
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
    this.displaySetOptions = displaySetOptions;
  }

  public getDisplaySetOptions(): Array<DisplaySetOptions> {
    return this.displaySetOptions;
  }

  public setDisplaySets(
    displaySets: Array<DisplaySet>,
    displaySetOptions: Array<DisplaySetOptions>
  ): void {
    this.displaySets = displaySets;
    this.setDisplaySetOptions(displaySetOptions);
  }

  public getDisplaySets(): Array<DisplaySet> {
    return this.displaySets;
  }

  private makeViewportId(viewportIndex: number): void {
    const viewportId = `viewport-${viewportIndex}`;
    this.setViewportId(viewportId);
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
}

export default ViewportInfo;
