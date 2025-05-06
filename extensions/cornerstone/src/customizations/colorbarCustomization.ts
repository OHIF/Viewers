import { colormaps } from '../utils/colormaps';
import {
  ColorbarPositionType,
  TickPositionType,
  PositionStylesMapType,
  PositionTickStylesMapType,
  ContainerStyleType,
  TickStyleType,
  DimensionConfigType,
  ColorbarProperties,
} from '../types/Colorbar';
import { ColorMapPreset } from '../types/Colormap';

const defaultPosition: ColorbarPositionType = 'bottom';
const DefaultColormap = 'Grayscale';

// Typed position styles
const positionStyles: PositionStylesMapType = {
  left: { left: '5%' },
  right: { right: '5%' },
  top: { top: '5%' },
  bottom: { bottom: '8%' },
};

// Typed position-specific tick styles
const positionTickStyles: PositionTickStylesMapType = {
  bottom: {
    position: 'top',
    style: {
      labelOffset: 5,
      labelMargin: 13,
    },
  },
  right: {
    position: 'left',
    style: {
      labelMargin: 5,
    },
  },
  left: {
    position: 'right',
    style: {
      labelMargin: 5,
    },
  },
  top: {
    position: 'bottom',
    style: {
      labelMargin: 5,
    },
  },
};

// Default position

// Get recommended tick position for a given colorbar position
const getTickPositionForPosition = (position: ColorbarPositionType): TickPositionType => {
  return (
    positionTickStyles[position]?.position ||
    (position === 'bottom'
      ? 'top'
      : position === 'top'
        ? 'bottom'
        : position === 'left'
          ? 'right'
          : 'left')
  );
};

// Container styles for colorbar
const containerStyles: ContainerStyleType = {
  cursor: 'initial',
};

// Tick styling
const tickStyles: TickStyleType = {
  font: '12px Arial',
  color: '#fff',
  maxNumTicks: 8,
  tickSize: 5,
  tickWidth: 1,
};

// Dimension configuration
const dimensionConfig: DimensionConfigType = {
  bottomHeight: '20px',
  defaultVerticalWidth: '2.5%',
  defaultHorizontalHeight: '2.5%',
};

const colorbarConfig: Partial<ColorbarProperties> = {
  width: '20px',
  colorbarTickPosition: getTickPositionForPosition(defaultPosition),
  colormaps: colormaps as unknown as Record<string, ColorMapPreset>,
  colorbarContainerPosition: defaultPosition,
  colorbarInitialColormap: DefaultColormap,
  positionStyles,
  positionTickStyles,
  containerStyles,
  tickStyles,
  dimensionConfig,
};

export default {
  'cornerstone.colorbar': colorbarConfig,
};
