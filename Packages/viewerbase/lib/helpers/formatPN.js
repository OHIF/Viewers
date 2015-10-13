UI.registerHelper('formatDA', function (context, format, options) {
    if (!context) {
        return undefined;
    }
    var pn = context;
    var str = '';
    if(pn.prefix) {
        str = pn.prefix + ' ';
    }
    str +=  (pn.familyName || '') + ', ';
    str +=  (pn.givenName || '');
    if(pn.middleName) {
        str += ' ' + pn.middleName;
    }
    if(pn.suffix) {
        str += ' ' + pn.suffix;
    }

    return str;
});