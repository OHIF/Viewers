import { colormaps } from '../utils/colormaps';

const DefaultColormap = 'Grayscale';

export default {
  'cornerstone.colorbar': {
    width: '16px',
    colorbarTickPosition: 'left',
    colormaps,
    colorbarContainerPosition: 'right',
    colorbarInitialColormap: DefaultColormap,
  },
};
