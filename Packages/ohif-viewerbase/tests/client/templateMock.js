import { _ } from 'meteor/underscore';

// IMPORTANT: 
// This code is from https://github.com/xolvio/meteor-template-isolator
// I created this module because the import wasn't working.
// TODO: remove this file and then use the meteor-template-isolator 

Template.prototype._originalEvents = Template.prototype.events;
Template.prototype.events = function(eventMaps) {
    var templateInstance = this;

    templateInstance.__interceptedEvents = _.extend(templateInstance.__interceptedEvents || {}, eventMaps);

    templateInstance.fireEvent = function(key, options) {
        options = options || {};

        if (!templateInstance.__interceptedEvents[key]) {
            throw Error('[xolvio:template-isolator] Could not find event ' +
                this.viewName + '[\'' + key + '\'].' + ' Are you sure you\'re firing the right event?');
        }

        return templateInstance.__interceptedEvents[key].call(
            options.context,
            options.event,
            options.templateInstance
        )
    };

    return Template.prototype._originalEvents.apply(this, arguments);
};
