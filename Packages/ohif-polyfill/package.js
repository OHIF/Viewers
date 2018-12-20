Package.describe({
    name: 'ohif:polyfill',
    summary: 'OHIF polyfills to keep compatibility with older browsers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    // Meteor packages
    api.use('ecmascript');
    api.use('jquery');

    // Assets to be imported dynamically
    api.addAssets('public/js/svgxuse.min.js', 'client');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
