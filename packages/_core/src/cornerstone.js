import MetadataProvider from './classes/MetadataProvider';
import {
  getBoundingBox,
  pixelToPage,
  repositionTextBox,
} from './lib/cornerstone.js';

const cornerstone = {
  MetadataProvider,
  getBoundingBox,
  pixelToPage,
  repositionTextBox,
};

export default cornerstone;
