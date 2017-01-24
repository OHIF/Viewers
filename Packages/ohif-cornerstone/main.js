/**
 * Import namespace...
 */

import { OHIF, Cornerstone } from  './namespace.js';

/**
 * Import scripts that will populate the Cornerstone namespace as a side effect only import. This is effectively the public API...
 */

import './client/'; // which is actually: import './client/index.js';

export { OHIF, Cornerstone };
