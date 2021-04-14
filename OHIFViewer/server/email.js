import {Meteor} from 'meteor/meteor';
import {OHIF} from 'meteor/ohif:core';

Meteor.startup(function () {
    // Mail server settings
    var username = Meteor.settings && Meteor.settings.mailServerSettings && Meteor.settings.mailServerSettings.username || null;
    var password = Meteor.settings && Meteor.settings.mailServerSettings && Meteor.settings.mailServerSettings.password || null;
    var server = Meteor.settings && Meteor.settings.mailServerSettings && Meteor.settings.mailServerSettings.server || null;
    var port = Meteor.settings && Meteor.settings.mailServerSettings && Meteor.settings.mailServerSettings.port || null;
    var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;
    var siteName = Meteor.settings && Meteor.settings.public && Meteor.settings.public.siteName || "OHIF Viewer";

    Accounts.emailTemplates.from = siteName + ' Admin';

    if (username && password && server && port) {
        Accounts.emailTemplates.from = siteName + ' Admin <' + username + '>';

        process.env.MAIL_URL = 'smtp://' +
            encodeURIComponent(username) + ':' +
            encodeURIComponent(password) + '@' +
            encodeURIComponent(server) + ':' + port;
    } else if (process.env.MAIL_URL !== undefined) {
        const regExp = /^smtp:\/\/(.+):(.+)@(\b((?:[a-z0-9]+(-[a-z0-9]+)*\.)+)[a-z]{2,}\b):(\d+)$/i;

        if (regExp.test(process.env.MAIL_URL)) {
            var matches = process.env.MAIL_URL.match(regExp);
            username = decodeURIComponent(matches[1]);
            password = decodeURIComponent(matches[2]);
            server = decodeURIComponent(matches[3]);
            port = matches[6];
            Accounts.emailTemplates.from = siteName + ' Admin <' + username + '>';
        }
    }

    Accounts.emailTemplates.siteName = siteName;
    // Subject line of the email.
    Accounts.emailTemplates.verifyEmail.subject = function (user) {
        return 'Confirm Your Email Address for ' + siteName;
    };

    // Email text
    Accounts.emailTemplates.verifyEmail.text = function (user, url) {
        return 'Thank you for registering.  Please click on the following link to verify your email address: \r\n' + url;
    };

    // Reset password mail
    Accounts.emailTemplates.resetPassword.subject = function () {
        return 'Reset your ' + siteName + ' password'
    };

    Accounts.urls.resetPassword = function (token) {
        return Meteor.absoluteUrl('resetPassword/' + token);
    };

    Accounts.urls.verifyEmail = function (token) {
        return Meteor.absoluteUrl('verify-email/' + token);
    };

    Accounts.emailTemplates.resetPassword.text = function (user, url) {
        return "Hello " + user.profile.fullName + ",\n\n" +
            "Click the following link to set your new password:\n" +
            url + "\n\n";
    };

    // Send email when account is created
    Accounts.config({
        sendVerificationEmail: verifyEmail
    });
});
