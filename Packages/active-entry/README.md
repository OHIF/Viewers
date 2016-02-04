## clinical:active-entry

This package provides the SignIn, SignUp, and ForgotPassword pages.  

[![Circle CI](https://circleci.com/gh/clinical-meteor/active-entry/tree/master.svg?style=svg)](https://circleci.com/gh/clinical-meteor/active-entry/tree/master)

===============================
#### Installation

````
meteor add clinical:active-entry
````

===============================
#### Entry Flowchart

The following diagram represents the entry workflow that is being implemented in this package.  This package is under active development, and is about half completed.  Pull requests which help implement the following workflow will be fast-tracked and accepted into the package.

![entry-workflow](https://raw.githubusercontent.com/clinical-meteor/active-entry/master/docs/Entry%20Workflow.png)



===============================
#### Routing API

````
/entrySignIn
/entrySignUp
/forgotPassword
````

===============================
#### Component API

````
{{> entrySignIn }}
{{> entrySignUp }}
{{> forgotPassword }}
````


===============================
#### ActiveEntry Configuration

````js

if(Meteor.isClient){
  ActiveEntry.configure({
    logo: {
      url: "/mini-circles.png",
      displayed: true
    },
    signIn: {
      displayFullName: true,
      destination: "/table/users"
    },
    signUp: {
      destination: "/table/users"
    },
    themeColors: {
      primary: ""
    }
  });
}

if(Meteor.isServer){
  Accounts.emailTemplates.siteName = "AwesomeSite";
  Accounts.emailTemplates.from = "AwesomeSite Admin <accounts@example.com>";
  Accounts.emailTemplates.enrollAccount.subject = function (user) {
      return "Welcome to Awesome Town, " + user.profile.name;
  };
  Accounts.emailTemplates.enrollAccount.text = function (user, url) {
     return "You have been selected to participate in building a better future!"
       + " To activate your account, simply click the link below:\n\n"
       + url;
  };  

  Meteor.startup(function(){
    process.env.MAIL_URL = 'smtp://sandboxid.mailgun.org:mypassword@smtp.mailgun.org:587';
  })  
}
````
Alternatively, you may want to set the ``MAIL_URL`` via an external environment variable, particularly if you're using a SaaS hosting provider.

````sh
MAIL_URL = 'smtp://sandboxid.mailgun.org:mypassword@smtp.mailgun.org:587' meteor
````

===============================
#### Local Development

Simply clone the repository into your ``/packages`` directory.  You can also specify the packages you want to develop locally in your ``.git-packages.json`` file, and use starrynight to fetch them.

````bash
# clone a single package into your application
git clone http://github.com/clinical-meteor/clinical-active-entry packages/active-entry

# fetch all the packages listed in git-packages.json
starrynight fetch
````

===============================
#### Quality Assurance Testing

There are two types of quality assurance tests you can run:  verification and validation tests.  Verification tests are similar to unit or integration tests; and can run either at the application or package level.  Validation tests are application-wide, but often require commands exposed in packages.  So you'll need to run the ``autoconfig`` command to scan the filesystem for validation commands.  See [http://starrynight.meteor.com/](http://starrynight.meteor.com/) for more details.

````bash
# install the testing utility
npm install -g starrynight

# verification testing (a.k.a. package-level unit/integration testing)
starrynight run-tests --type package-verification

#to run validation tests, you'll need an ``.initializeUsers()`` function
meteor add clinical:accounts-housemd

#validation testing (a.k.a. application acceptance/end-to-end testing)
starrynight autoscan
starrynight run-tests --type validation
````

===============================
#### Contributing

See our [notes on contributing](https://github.com/clinical-meteor/clinical-active-entry/blob/master/Contributing.md).

===============================
#### Licensing  

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
