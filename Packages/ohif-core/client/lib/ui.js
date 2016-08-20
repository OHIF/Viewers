import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';

// Get the UI settings
const ui = Meteor.settings && Meteor.settings.public && Meteor.settings.public.ui;
OHIF.uiSettings = ui || {};
