import { OHIF } from 'meteor/ohif:core';

/*
 * Defines the base OHIF header object
 */
const dropdown = new OHIF.ui.Dropdown();
const header = { dropdown };

OHIF.header = header;

export { header };
