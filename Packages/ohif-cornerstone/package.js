Package.describe({
    name: 'ohif:cornerstone',
    summary: 'Cornerstone Web-based Medical Imaging libraries',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    
    api.use('jquery');

    api.use('ohif:core');

    api.addFiles('client/cornerstone.js', 'client', {
        bare: true
    });
    api.addFiles('client/cornerstoneMath.js', 'client', {
        bare: true
    });
    api.addFiles('client/cornerstoneTools.js', 'client', {
        bare: true
    });
    api.addFiles('client/cornerstoneWADOImageLoader.js', 'client', {
        bare: true
    });
    api.addFiles('client/dicomParser.js', 'client', {
        bare: true
    });
    api.addFiles('client/hammer.js', 'client', {
        bare: true
    });
    api.addFiles('client/jquery.hammer.js', 'client', {
        bare: true
    });

    api.addAssets('public/js/cornerstoneWADOImageLoaderCodecs.es5.js', 'client');
    api.addAssets('public/js/cornerstoneWADOImageLoaderWebWorker.es5.js', 'client');

    api.export('cornerstone', 'client');
    api.export('cornerstoneMath', 'client');
    api.export('cornerstoneTools', 'client');
    api.export('cornerstoneWADOImageLoader', 'client');
    api.export('dicomParser', 'client');

    api.mainModule('main.js', 'client');
});
