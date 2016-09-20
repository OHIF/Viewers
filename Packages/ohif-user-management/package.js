Package.describe({
    name: 'ohif:user-management',
    summary: 'OHIF Lesion Tracker Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('random');

    // Schema for Data Models
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:study-list');

    api.addFiles('both/collections.js', ['client', 'server']);
    api.addFiles('both/schema/servers.js', ['client', 'server']);
    //api.addFiles('both/schema/reviewers.js', ['client', 'server']);

    api.addFiles('client/components/serverInformation/serverInformationDicomWeb/serverInformationDicomWeb.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationDicomWeb/serverInformationDicomWeb.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationDimse/serverInformationDimse.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationDimse/serverInformationDimse.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationForm.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationForm.js', 'client');
    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationFormField.html', 'client');

    api.addFiles('client/components/serverInformation/serverInformationList/serverInformationList.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationList/serverInformationList.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.styl', 'client');
    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.js', 'client');

    api.addFiles('client/components/userAccountMenu/userAccountMenu.html', 'client');
    api.addFiles('client/components/userAccountMenu/userAccountMenu.styl', 'client');
    api.addFiles('client/components/userAccountMenu/userAccountMenu.js', 'client');

    api.addFiles('client/active-entry/activeEntry.styl', 'client');
    api.addFiles('client/active-entry/activeEntry.js', 'client');
    api.addFiles('client/active-entry/activeEntrySignIn.js', 'client');

    api.addFiles('client/subscriptions.js', 'client');

    api.addFiles('client/components/emailVerification/emailVerification.html', 'client');
    api.addFiles('client/components/emailVerification/emailVerification.styl', 'client');
    api.addFiles('client/components/emailVerification/emailVerification.js', 'client');

    api.addFiles('client/components/hipaaLogPage/hipaaLogPage.styl', 'client');
    api.addFiles('client/components/hipaaLogPage/hipaaLogPage.js', 'client');

    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.html', 'client');
    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.styl', 'client');
    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.js', 'client');

    api.addFiles('client/components/lastLoginModal/lastLoginModal.html', 'client');

    api.addFiles('server/createDemoUser.js', [ 'server' ]);
    api.addFiles('server/servers.js', [ 'server' ]);
    api.addFiles('server/reviewers.js', [ 'server' ]);
    api.addFiles('server/publications.js', [ 'server' ]);

    api.export('Servers', [ 'client', 'server' ]);
    api.export('Reviewers', [ 'client', 'server' ]);
});
