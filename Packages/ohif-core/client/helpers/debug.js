import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to development debugging
 */

// Stop here if it's not development environment
if (!Meteor.isDevelopment) {
    return;
}

// Debug some value on console
Template.registerHelper('debug', (...values) => {
    console.debug(...values);
});
