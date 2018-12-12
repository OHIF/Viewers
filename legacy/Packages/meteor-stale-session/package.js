Package.describe({
    name:    'zuuk:stale-session',
    summary: 'Stale session and session timeout handling for meteorjs',
    git:     "https://github.com/lindleycb/meteor-stale-session.git",
    version: "1.0.8"
});

Package.onUse(function(api) {
    api.use('accounts-base@1.0.0', ['client','server']);
    api.use('jquery@1.0.0', 'client');
    api.addFiles('client.js', 'client');
    api.addFiles('server.js', 'server');
});