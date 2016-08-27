Meteor.startup(function() {
    if (Meteor.isClient){
        ActiveEntry.configure({
            logo: {
                url: '/images/logo.png',
                displayed: true
            },
            signIn: {
                displayFullName: true,
                destination: '/'
            },
            signUp: {
                destination: '/'
            },
            themeColors: {
                primary: ''
            }
        });
    }

    if (Meteor.isServer){
        Accounts.emailTemplates.siteName = 'AwesomeSite';
        Accounts.emailTemplates.from = 'AwesomeSite Admin <accounts@example.com>';
        Accounts.emailTemplates.enrollAccount.subject = function(user) {
            return 'Welcome to Awesome Town, ' + user.profile.name;
        };

        Accounts.emailTemplates.enrollAccount.text = function(user, url) {
            return 'You have been selected to participate in building a better future!'
                + ' To activate your account, simply click the link below:\n\n'
                + url;
        };

        process.env.MAIL_URL = 'smtp://sandboxid.mailgun.org:mypassword@smtp.mailgun.org:587';
    }
});
