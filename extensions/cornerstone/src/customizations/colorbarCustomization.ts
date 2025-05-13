import { colormaps } from '../utils/colormaps';
import {
  ColorbarPositionType,
  TickPositionType,
  PositionStylesMapType,
  PositionTickStylesMapType,
  ContainerStyleType,
  TickStyleType,
  ColorbarProperties,
} from '../types/Colorbar';
import { ColorMapPreset } from '../types/Colormap';

const defaultPosition: ColorbarPositionType = 'bottom';
const DefaultColormap = 'Grayscale';

const positionStyles: PositionStylesMapType = {
  left: { width: '15px' },
  right: { width: '15px' },
  bottom: { height: '15px' },
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

// Get recommended tick position for a given colorbar position
const getTickPositionForPosition = (position: ColorbarPositionType): TickPositionType => {
  if (position === 'bottom') {
    return 'top';
  } else if (position === 'top') {
    return 'bottom';
  } else if (position === 'left') {
    return 'right';
  } else if (position === 'right') {
    return 'left';
  }

  return positionTickStyles[position]?.position || 'top';
};

// Container styles for colorbar
const containerStyles: ContainerStyleType = {
  cursor: 'initial',
};

// Tick styling
const tickStyles: TickStyleType = {
  font: '12px Arial',
  color: '#fff',
  maxNumTicks: 6,
  tickSize: 5,
  tickWidth: 1,
};

const colorbarConfig: Partial<ColorbarProperties> = {
  colorbarTickPosition: getTickPositionForPosition(defaultPosition),
  colormaps: colormaps as unknown as Record<string, ColorMapPreset>,
  colorbarContainerPosition: defaultPosition,
  colorbarInitialColormap: DefaultColormap,
  positionStyles,
  positionTickStyles,
  containerStyles,
  tickStyles,
};

export default {
  'cornerstone.colorbar': colorbarConfig,
};
