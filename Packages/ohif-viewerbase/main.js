/**
 * Import namespace...
 */

import { OHIF, Viewerbase } from  './namespace.js';

/**
 * Import scripts that will populate the Viewerbase namespace as a side effect only import. This is effectively the public API...
 */

import './client/'; // which is actually: import './client/index.js';

/**
 * Export relevant objects...
 *
 * With the following export it becomes possible to import "OHIF" from "ohif:core" and "Viewerbase"
 * from "ohif:viewerbase" using a single import (a shorthand), like this:
 *
 * import { OHIF } from 'meteor/ohif:viewerbase';
 *
 * Which is equivalent to:
 *
 * import { OHIF } from 'meteor/ohif:core';
 * import 'meteor/ohif:viewerbase';
 *
 * The second (extended) format should be used when other OHIF packages are also to be used within
 * the current module. This makes it explicit that the following imports will populate their
 * respective namespaces within the to "OHIF" namespace. Example:
 *
 * import { OHIF } from 'meteor/ohif:core';
 * import 'meteor/ohif:viewerbase';
 * import 'meteor/ohif:hanging-protocols';
 * [ ... ]
 * OHIF.viewerbase.setActiveViewport(...);
 * OHIF.hangingprotocols.doSomething(...);
 *
 */

export { OHIF, Viewerbase };
