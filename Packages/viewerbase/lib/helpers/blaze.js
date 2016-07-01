// Return the current template instance
Template.registerHelper('instance', () => {
    return Template.instance();
});

// Return the session value for the given key
Template.registerHelper('session', key => {
    return Session.get(key);
});

// Create a new object and extends it with the argument objects
Template.registerHelper('extend', (...argsArray) => {
    // Create the resulting object
    const result = {};

    // Extract the Spacebars kw hash
    const kwHash = _.last(argsArray).hash;

    // Extract the given objects
    const objects = _.initial(argsArray);

    // Iterate over the given objects
    _.each(objects, current => {
        // Stop here if the current argument is not an object
        if (typeof current !== 'object') {
            return;
        }

        // Extend the resulting object with the current argument object
        _.extend(result, current);
    });

    // Extend the resulting object with the Spacebars kw hash
    _.extend(result, kwHash);

    // Return the resulting object
    return result;
});
