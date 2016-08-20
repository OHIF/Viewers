import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers
 */

// Access OHIF.uiSettings object
Template.registerHelper('uiSettings', () => {
    return OHIF.uiSettings;
});
