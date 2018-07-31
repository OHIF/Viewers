import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

WADOProxy.settings = Object.assign({
    uri : OHIF.utils.absoluteUrl("/__wado_proxy"),
}, (Meteor.settings && Meteor.settings.proxy) ? Meteor.settings.proxy : {});
