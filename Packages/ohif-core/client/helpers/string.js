import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to work with Strings
 */

// Concatenate the give strings
Template.registerHelper('concat', (...args) => {
    const values = _.initial(args, 1);
    let result = '';
    _.each(values, value => {
        result += typeof value !== 'undefined' ? value : '';
    });
    return result;
});

// Encode any string into a safe format for HTML id attribute
Template.registerHelper('encodeId', OHIF.string.encodeId);
