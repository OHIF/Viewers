import { Template } from 'meteor/templating';

/**
 * A global Blaze UI helper function to return whether or not a
 * field is required based on the Template's specified currentSchema
 */
Template.registerHelper('stateDataWithKey', function(context) {
    const instance = Template.instance();

    if (!context) {
        return {
            state: instance.state,
            invalidKeys: instance.invalidKeys,
            validationContext: instance.validationContext,
            currentSchema: instance.currentSchema,
            isModified: instance.isModified
        };
    }

    return {
        key: context,
        state: instance.state,
        invalidKeys: instance.invalidKeys,
        validationContext: instance.validationContext,
        currentSchema: instance.currentSchema,
        isModified: instance.isModified
    };
});