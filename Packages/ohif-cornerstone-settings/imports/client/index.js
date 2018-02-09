import { OHIF } from 'meteor/ohif:core';

import './renderer.js';

import { MetadataProvider } from './lib/classes/MetadataProvider';
OHIF.cornerstone.metadataProvider = new MetadataProvider();
