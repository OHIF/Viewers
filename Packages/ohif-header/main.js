import { OHIF } from 'meteor/ohif:core';
import { Header } from './client/lib/header';

/*
 * Defines the base OHIF header object
 */
const header = new Header();

OHIF.header = header;

export { header };
