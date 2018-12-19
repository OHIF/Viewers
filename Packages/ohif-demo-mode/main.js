import { OHIF } from 'meteor/ohif:core';
import './client';
import devModeMediator from './client/demoModeMediator.js';

const demoMode = Meteor.settings && Meteor.settings.public && Meteor.settings.public.demoMode;

if (demoMode) {
    OHIF.demoMode = devModeMediator;
}