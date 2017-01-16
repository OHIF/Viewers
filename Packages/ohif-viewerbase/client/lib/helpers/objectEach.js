import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';

Blaze.registerHelper('objectEach', function(object) {
    // http://stackoverflow.com/questions/30234732/how-to-print-key-and-values-in-meteor-template
    return _.map(object, function(value, key) {
        return _.extend({key: key}, value);
    });
});
