import { OHIF } from '../namespace';
import './renderer.js';

import { MetadataProvider } from './lib/classes/MetadataProvider';
OHIF.cornerstone.metadataProvider = new MetadataProvider();
