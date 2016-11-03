import { Meteor } from 'meteor/meteor';
// import { check } from 'meteor/check';
import { OHIF } from 'meteor/ohif:core';
import { ServerConfiguration } from 'meteor/ohif:study-list/both/schema/servers.js';

Meteor.startup(() => {
    // Save custom properties (if any)...
    // "Meteor.settings" and "Meteor.settings.public" are set by default...
    let custom = {
        private: Meteor.settings.custom,
        public: Meteor.settings.public.custom
    };

    // ... and remove them to prevent clean up
    delete Meteor.settings.custom;
    delete Meteor.settings.public.custom;

    ServerConfiguration.clean(Meteor.settings);

    // TODO: Make the error messages more clear
    // Taking this out for now to prevent confusion.
    // check(Meteor.settings, ServerConfiguration);

    Meteor.settings.custom = custom.private;
    Meteor.settings.public.custom = custom.public;

    OHIF.log.info(JSON.stringify(Meteor.settings, null, 2));
});
