import { OHIF } from 'meteor/ohif:core';

Settings = Object.assign({
    uri : OHIF.utils.absoluteUrl("/__wado_proxy"),
    enabled: true
}, (Meteor.settings && Meteor.settings.proxy) ? Meteor.settings.proxy : {});

http = require("http");
url = require("url");
querystring = require("querystring");