import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

/**
 * Global Blaze UI helpers to work with Blaze
 */

// Return the absolute url
Template.registerHelper('absoluteUrl', path => {
    return Meteor.absoluteUrl(path);
});

// Return the current template instance
Template.registerHelper('instance', () => {
    return Template.instance();
});

// Return the session value for the given key
Template.registerHelper('session', key => {
    return Session.get(key);
});

// Return the value for given parameter regardless if it's reactive or not
Template.registerHelper('reactive', parameter => {
    if (parameter instanceof ReactiveVar) {
        return parameter.get();
    }

    return parameter;
});
