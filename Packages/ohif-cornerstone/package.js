Package.describe({
    name: 'ohif:cornerstone',
    summary: 'Cornerstone Web-based Medical Imaging libraries',
    version: '0.0.1'
});

Npm.depends({
    hammerjs: '2.0.8',
    'cornerstone-core': '2.2.7',
    'cornerstone-tools': '2.4.0',
    'cornerstone-math': '0.1.6',
    'dicom-parser': '1.8.0',
    'cornerstone-wado-image-loader': '2.1.4',
    'dcmjs': '0.2.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');

    api.addAssets('public/js/cornerstoneWADOImageLoaderCodecs.es5.js', 'client');
    api.addAssets('public/js/cornerstoneWADOImageLoaderWebWorker.es5.js', 'client');
    api.addAssets('public/js/cornerstoneWADOImageLoaderWebWorker.min.js.map', 'client');

    api.mainModule('main.js', 'client');

    api.export('cornerstone', 'client');
    api.export('cornerstoneMath', 'client');
    api.export('cornerstoneTools', 'client');
    api.export('cornerstoneWADOImageLoader', 'client');
    api.export('dicomParser', 'client');
    api.export('dcmjs', 'client');
});
