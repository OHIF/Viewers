export interface GridViewportOptions {
  id?: string;
  viewportId?: string;
  viewportType?: string;
  toolGroupId?: string;
  presentationIds?: AppTypes.PresentationIds;
  flipHorizontal?: boolean;
  //
  orientation?: string;
  allowUnmatchedView?: boolean;
  needsRerendering?: boolean;
  background?: [number, number, number];
  syncGroups?: unknown[];
  rotation?: number;
  initialImageOptions?: unknown;
  customViewportProps?: Record<string, unknown>;
  //
  displayArea?: unknown;
  viewReference?: unknown;
}

export interface GridViewport {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions: GridViewportOptions;
  displaySetSelectors: unknown[];
  displaySetOptions: unknown[];
  x: number;
  y: number;
  width: number;
  height: number;
  viewportLabel: string | null;
  isReady: boolean;
}

export interface Layout {
  numRows: number;
  numCols: number;
  layoutType: string;
}

export type GridViewports = Map<string, GridViewport>;

export interface ViewportGridState {
  activeViewportId: string | null;
  layout: Layout;
  isHangingProtocolLayout: boolean;
  viewports: GridViewports;
}

export type SetDisplaySetsForViewportsProps = Array<{
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions?: AppTypes.ViewportGrid.GridViewportOptions;
  displaySetOptions?: Array<{
    id?: string;
    voi?: {
      windowWidth: number;
      windowCenter: number;
    };
    voiInverted?: boolean;
    blendMode?: string;
    slabThickness?: number;
    colormap?: {
      name: string;
      opacity?: number;
    };
    displayPreset?: string;
  }>;
}>;
