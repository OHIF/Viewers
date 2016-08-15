Settings = Object.assign((Meteor.settings && Meteor.settings.proxy) ? Meteor.settings.proxy : {}, {
    uri : "/__wado_proxy",
    enabled: true
})

http = require("http");
url = require("url");
querystring = require("querystring");