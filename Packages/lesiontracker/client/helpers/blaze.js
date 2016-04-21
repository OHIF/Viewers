Template.registerHelper("instance", function() {
    return Template.instance();
});

Template.registerHelper("extend", function(object, extendedProperties){
    const result = {};
    for (let i=0; i<arguments.length; i++) {
        let current = arguments[i];
        if (typeof current !== "object") continue;
        current instanceof Spacebars.kw && (current = current.hash);
        _.extend(result, current);
    }
    return result;
});
