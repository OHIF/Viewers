//Generate UUID to create unique tabs
generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r =(d + Math.random()*8)%8 | 0;
        d = Math.floor(d/8);
        return(c=='x' ? r :(r&0x3|0x8)).toString(8);
    });
    return uuid;
};