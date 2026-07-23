import { ColorMapPreset } from './Colormap';

// Position options
export type ColorbarPositionType = 'top' | 'bottom' | 'left' | 'right';

// Tick position options
export type TickPositionType = 'top' | 'bottom' | 'left' | 'right';

// CSS style properties for ticks
export type TickStyleType = {
  font?: string;
  color?: string;
  maxNumTicks?: number;
  tickSize?: number;
  tickWidth?: number;
  labelMargin?: number;
  labelOffset?: number;
};

// Position-specific styles
export type PositionStyleType = {
  [key: string]: string;
};

// Styles for a specific position (like bottom)
export type PositionTickStyleType = {
  position: TickPositionType;
  style?: TickStyleType;
};

// Map of position to position-specific styles
export type PositionTickStylesMapType = {
  [key in ColorbarPositionType]?: PositionTickStyleType;
};

// Map of position to position-specific CSS
export type PositionStylesMapType = {
  [key in ColorbarPositionType]?: PositionStyleType;
};

// Container styles
export type ContainerStyleType = {
  position?: string;
  boxSizing?: string;
  border?: string;
  cursor?: string;
  [key: string]: string | undefined;
};

// Dimension configuration
export type DimensionConfigType = {
  bottomHeight: string;
  defaultVerticalWidth: string;
  defaultHorizontalHeight: string;
};

// Tick configuration
export type TickConfigType = {
  position: TickPositionType;
  style?: TickStyleType;
};

// Base options for colorbar
export type ColorbarOptions = {
  position: ColorbarPositionType;
  colormaps: Record<string, ColorMapPreset>;
  activeColormapName: string;
  ticks?: TickConfigType;
  width: string;
};

// Props for the Colorbar component
export type ColorbarProps = {
  viewportId: string;
  displaySets: Array<any>;
  colorbarProperties: ColorbarProperties;
};

// Extended properties with styling options
export type ColorbarProperties = {
  width: string;
  colorbarTickPosition: TickPositionType;
  colorbarContainerPosition: ColorbarPositionType;
  colormaps: Record<string, ColorMapPreset>;
  colorbarInitialColormap: string;

  // Styling properties
  positionStyles?: PositionStylesMapType;
  positionTickStyles?: PositionTickStylesMapType;
  containerStyles?: ContainerStyleType;
  tickStyles?: TickStyleType;
};

// Type for the customization object from the customization service
export interface ColorbarCustomization {
  width: string;
  colorbarTickPosition: TickPositionType;
  colorbarContainerPosition: ColorbarPositionType;
  colormaps: Record<string, ColorMapPreset>;
  colorbarInitialColormap: string;

  // Styling properties
  positionStyles: PositionStylesMapType;
  positionTickStyles: PositionTickStylesMapType;
  containerStyles: ContainerStyleType;
  tickStyles: TickStyleType;
}

// Event types for colorbar changes
export enum ChangeTypes {
  Removed = 'removed',
  Added = 'added',
  Modified = 'modified',
}
