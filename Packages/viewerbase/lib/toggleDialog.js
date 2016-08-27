toggleDialog = function(element) {
    var elem = $(element);
    if (elem.css('display') === 'none') {
        elem.css('display', 'block');
    } else {
        elem.css('display', 'none');
    }
};