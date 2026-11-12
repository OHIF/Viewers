// Window-level related types

export interface Range {
  min: number;
  max: number;
}

export interface VOIRange {
  min: number;
  max: number;
}

export interface VOI {
  windowWidth: number;
  windowCenter: number;
}

export interface Histogram {
  bins: number[] | Int32Array;
  numBins: number;
  maxBin: number;
  maxBinValue: number;
  range: Range;
}

export interface Colormap {
  Name: string;
  RGBPoints: number[];
}

export interface WindowLevelData {
  volumeId: string;
  viewportId: string;
  modality: string;
  voi: VOI;
  step: number;
  histogram: Histogram;
  showOpacitySlider: boolean;
  opacity?: number;
  colormap?: Colormap;
}