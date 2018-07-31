import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Settings = Object.assign({
    uri : OHIF.utils.absoluteUrl("/__wado_proxy"),
    enabled: true
}, (Meteor.settings && Meteor.settings.proxy) ? Meteor.settings.proxy : {});