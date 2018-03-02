import { OHIF } from 'meteor/ohif:core';

import './renderer.js';

import { MetadataProvider } from './lib/classes/MetadataProvider';
OHIF.cornerstone.MetadataProvider = MetadataProvider;

// TODO: Remove this after all viewers are updated to create an instance of OHIF.cornerstone.MetadataProvider
OHIF.cornerstone.metadataProvider = new MetadataProvider();
