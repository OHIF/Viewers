import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

WADOProxy.settings = Object.assign({
    uri : OHIF.utils.absoluteUrl("/__wado_proxy"),
    enabled: true
}, (Meteor.settings && Meteor.settings.public && Meteor.settings.public.proxy) ? Meteor.settings.public.proxy : {});
