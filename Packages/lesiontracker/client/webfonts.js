WebFontConfig = {
    google: {
        families: [ 'Roboto:400,100,100italic,300,300italic,500,400italic,500italic,700italic,900,900italic,700:latin' ]
    }
};

(function() {
    var wf = document.createElement('script');
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();
