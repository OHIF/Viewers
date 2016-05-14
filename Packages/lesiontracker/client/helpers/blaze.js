Template.registerHelper('instance', function() {
    return Template.instance();
});

Template.registerHelper('extend', function() {
    const result = {};
    const kw = arguments.pop();
    _.each(arguments, function(current) {
        if (typeof current !== 'object') {
            return;
        }

        _.extend(result, current);
    });
    _.extend(result, kw.hash);
    return result;
});
