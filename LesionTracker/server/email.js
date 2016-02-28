
 /*Meteor.startup(function () {

     // Mail server settings
     var username = "";
     var password = "";
     var server = "";
     var port = "";

     Accounts.emailTemplates.siteName = 'Lesion Tracker';
     Accounts.emailTemplates.from = 'Lesion Tracker Admin <'+username+'>';


     process.env.MAIL_URL = 'smtp://' +
            encodeURIComponent(username) + ':' +
            encodeURIComponent(password) + '@' +
            encodeURIComponent(server) + ':' + port;

    // Subject line of the email.
    Accounts.emailTemplates.verifyEmail.subject = function(user) {
        return 'Confirm Your Email Address for Lesion Tracker';
    };

    // Email text
    Accounts.emailTemplates.verifyEmail.text = function(user, url) {
        return 'Thank you for registering.  Please click on the following link to verify your email address: \r\n' + url;
    };

    // Send email when account is created
    Accounts.config({
        sendVerificationEmail: true
    });
});
*/