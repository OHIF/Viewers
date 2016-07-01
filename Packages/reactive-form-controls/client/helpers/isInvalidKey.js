import { Template } from 'meteor/templating';

/**
 * A global Blaze UI helper function to return whether or not a key is part of the invalidKeys dictionary
 */
Template.registerHelper('isInvalidKey', function(context, format, options) {
    if (!context) {
        return;
    }

    const instance = Template.instance();
    if (!instance.invalidKeys) {
        return;
    }

    // Show error message if key is at first index
    var firstInvalidKey = instance.invalidKeys.get(0);
    return (firstInvalidKey && firstInvalidKey.name === context)
});