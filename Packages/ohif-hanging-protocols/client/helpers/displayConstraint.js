function humanize(text) {
    var humanized = text.replace(/([A-Z])/g, ' $1'); // insert a space before all caps
    humanized = humanized.replace(/^./, function(str) { // uppercase the first character
        return str.toUpperCase();
    })
    return humanized;
}

UI.registerHelper('displayConstraint', function(attribute, constraint) {
    if (!constraint) {
        return;
    }

    if (!attribute) {
        return;
    }

    var validatorType = Object.keys(constraint)[0];
    if (!attribute) {
        return;
    }

    var validator = Object.keys(constraint[validatorType])[0];
    if (!attribute) {
        return;
    }

    var value = constraint[validatorType][validator];
    if (value === undefined) {
        return;
    }

    var comparator = validator;
    if (validator === 'value') {
        comparator = validatorType;
    }

    return humanize(attribute) + ' ' + humanize(comparator).toLowerCase() + ' ' + value;
});