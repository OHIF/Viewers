Template.registerHelper('concat', function() {
    let result = '';
    _.each(_.initial(arguments, 1), function(value) {
        result += value;
    });
    return result;
});
