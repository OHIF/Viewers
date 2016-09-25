import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ServerConfiguration } from '../both/schema.js';

Meteor.startup(() => {

    console.log('------ Testing Meteor Settings ------');

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
    check(Meteor.settings, ServerConfiguration);

    Meteor.settings.custom = custom.private;
    Meteor.settings.public.custom = custom.public;

    console.log(JSON.stringify(Meteor.settings, null, 2));

});
