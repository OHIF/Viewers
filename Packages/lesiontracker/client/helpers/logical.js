Template.registerHelper("choose", function() {
    let result;
    _.each(arguments, value => {
        if (result || value instanceof Spacebars.kw) return;
        value && (result = value);
    });
    return result;
});

Template.registerHelper("bool", function(value) {
    return !!value;
});

Template.registerHelper("equals", function(a, b) {
    return a === b;
});

Template.registerHelper("not", function(value) {
    return !value;
});

Template.registerHelper("and", function() {
    let result = true;
    _.each(arguments, value => value || (result = false));
    return result;
});

Template.registerHelper("or", function() {
    let result = false;
    _.each(arguments, value => {
        if (value instanceof Spacebars.kw) return;
        value && (result = true);
    });
    return result;
});
