import { Session } from 'meteor/session';

if (Meteor.isClient){
    ActiveEntry.configure({
        logo: {
            url: '/mini-circles.png',
            displayed: true
        },
        signIn: {
            displayFullName: true,
            destination: '/studylist'
        },
        signUp: {
            destination: '/studylist'
        },
        themeColors: {
            primary: ""
        },
        passwordOptions: {
            showPasswordStrengthIndicator: false,
            requireRegexValidation: true,
            //requireStrongPasswords: false
            passwordHistoryCount: 6,
            failedAttemptsLimit: 5
        }

    });

  Session.set('ThemeConfig', {
    palette: {
      colorA: "",
      colorB: "",
      colorC: "",
      colorD: "",
      colorE: ""
    }
  });
}

/*
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

    Meteor.startup(function() {
        //process.env.MAIL_URL = 'smtp://sandboxid.mailgun.org:mypassword@smtp.mailgun.org:587';
    });
}
*/
