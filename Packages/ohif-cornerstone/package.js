Package.describe({
    name: 'ohif:cornerstone',
    summary: 'Cornerstone Web-based Medical Imaging libraries',
    version: '0.0.1'
});

Npm.depends({
    hammerjs: '2.0.8',
    'jquery-hammerjs': '2.0.0',
    'cornerstone-core': '1.1.2',
    'cornerstone-tools': '1.0.3',
    'cornerstone-math': '0.1.6',
    'dicom-parser': '1.7.6',
    'cornerstone-wado-image-loader': '1.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.5');

    api.use('ecmascript');
    api.use('jquery');
    api.use('ohif:core');

    api.addAssets('public/js/cornerstoneWADOImageLoaderCodecs.es5.js', 'client');
    api.addAssets('public/js/cornerstoneWADOImageLoaderWebWorker.es5.js', 'client');
    api.addAssets('public/js/cornerstoneWADOImageLoaderWebWorker.min.js.map', 'client');

    api.mainModule('main.js', 'client');

    api.export('cornerstone', 'client');
    api.export('cornerstoneMath', 'client');
    api.export('cornerstoneTools', 'client');
    api.export('cornerstoneWADOImageLoader', 'client');
    api.export('dicomParser', 'client');
});
