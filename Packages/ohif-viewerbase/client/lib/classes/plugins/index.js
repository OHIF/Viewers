import { OHIF } from 'meteor/ohif:core';

import { OHIFPlugin } from './OHIFPlugin';
import { ViewportPlugin } from './ViewportPlugin';

// Each plugin registers an entry point function to be called
// when the loading is complete.

const plugins = {
    OHIFPlugin,
    ViewportPlugin,
    entryPoints: {}
};

// TODO: When we reorganize the packages, we should figure out where to put this.
OHIF.plugins = plugins;

export default plugins;
