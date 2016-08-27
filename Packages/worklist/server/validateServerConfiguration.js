import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ServerConfiguration } from '../both/schema.js';

Meteor.startup(() => {
    console.log('------ Testing Meteor Settings ------');
    let config = ServerConfiguration.clean(Meteor.settings);
    console.log(JSON.stringify(config, null, 2));

    Meteor.settings = config;
    check(config, ServerConfiguration);
});
