

ActiveEntry = {};
ActiveEntry.isAbc = function () {
  return "abc";
};



if (Meteor.isClient) {
  Session.setDefault('Photonic.ActiveEntry', {
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Photon-photon_scattering.png",
      displayed: true
    },
    signIn: {
      displayFullName: true,
      destination: "/"
    },
    signUp: {
      destination: "/"
    },
    themeColors: {
      primary: ""
    },
    passwordOptions: {
      showPasswordStrengthIndicator: true,
      requireRegexValidation: true,
      //requireStrongPasswords: false
      passwordHistoryCount: 6,
      failedAttemptsLimit: 5,
      passwordExpirationDays: 90,
      inactivityPeriodDays: 180
    }
  });

  ActiveEntry.errorMessages = new ReactiveDict('errorMessages');
  ActiveEntry.errorMessages.set('signInError', false);

  // Success messages
  ActiveEntry.successMessages = new ReactiveDict('successMessages');

  // Change password warning message according to whether zxcvbn is turned on
  Session.set('passwordWarning', 'Password must have at least 8 characters. It must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character.');

  Meteor.call('isLDAPSet', function(error, isSet) {
    Session.set('isLDAPSet', isSet);
  });
}

if (Meteor.isServer) {
  LDAP_DEFAULTS.url = Meteor.settings.ldap && Meteor.settings.ldap.url;
  LDAP_DEFAULTS.port = Meteor.settings.ldap && Meteor.settings.ldap.port;
}

ActiveEntry.configure = function (configObject) {
  if (Meteor.isClient) {

    // Set passwordOptions if they are not defined
    if (!configObject.passwordOptions) {
      configObject.passwordOptions = {
        showPasswordStrengthIndicator: true,
        requireRegexValidation: false,
        //requireStrongPasswords: false
        passwordHistoryCount: 6,
        failedAttemptsLimit: 5,
        passwordExpirationDays: 90,
        inactivityPeriodDays: 180
      }
    }
    Session.set('Photonic.ActiveEntry', configObject);
  }
};

ActiveEntry.verifyPassword = function (password) {
  if (password.length === 0) {
    ActiveEntry.errorMessages.set('password', 'Password is required');
    ActiveEntry.successMessages.set('password', null);
  } else if (!checkPasswordStrength(password)) {
    ActiveEntry.errorMessages.set('password', Session.get('passwordWarning'));
    ActiveEntry.successMessages.set('password', null);
  } else {
    ActiveEntry.errorMessages.set('password', null);
    ActiveEntry.successMessages.set('password', 'Password present');
  }
};

ActiveEntry.verifyConfirmPassword = function (password, confirmPassword) {
  // we have two different logic checks happening in this function
  // would be reasonable to separate them out into separate functions
  if (confirmPassword === "") {
    ActiveEntry.errorMessages.set('confirm', 'Password is required');
    ActiveEntry.successMessages.set('confirm', null);
  } else if (confirmPassword === password) {
    ActiveEntry.errorMessages.set('confirm', null);
    ActiveEntry.successMessages.set('confirm', 'Passwords match');
  } else {
    ActiveEntry.errorMessages.set('confirm', 'Passwords do not match');
    ActiveEntry.successMessages.set('confirm', null);
  }
};

ActiveEntry.verifyEmail = function (email) {
  if (email.length === 0) {
    ActiveEntry.errorMessages.set('email', 'Email is required');
    ActiveEntry.successMessages.set('email', null);
  } else if (email.indexOf("@") === -1){
    ActiveEntry.errorMessages.set('email', 'Email is poorly formatted');
    ActiveEntry.successMessages.set('email', null);
  } else if (email.indexOf("@") >= 0){
    ActiveEntry.errorMessages.set('email', null);
    ActiveEntry.successMessages.set('email', 'Email present');
  }
};

ActiveEntry.verifyFullName = function (fullName) {
  if (fullName.length === 0) {
    ActiveEntry.errorMessages.set('fullName', 'Name is required');
    ActiveEntry.successMessages.set('fullName', null);
  } else if (fullName.indexOf(" ") === -1){
    ActiveEntry.errorMessages.set('fullName', 'Name is probably not complete');
    ActiveEntry.successMessages.set('fullName', null);
  } else if (fullName.indexOf(" ") >= 0){
    //ActiveEntry.errorMessages.set('fullName', 'Name present');
    ActiveEntry.errorMessages.set('fullName', null);
    ActiveEntry.successMessages.set('fullName', 'Name present');
  }
};

ActiveEntry.signIn = function (emailValue, passwordValue){

  ActiveEntry.verifyPassword(passwordValue);
  ActiveEntry.verifyEmail(emailValue);
  // TODO: Find a solution nested  calling

  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  var failedAttemptsLimit = ActiveEntryConfig && ActiveEntryConfig.passwordOptions && ActiveEntryConfig.passwordOptions.failedAttemptsLimit || 5;
  var passwordExpirationDays = ActiveEntryConfig && ActiveEntryConfig.passwordOptions && ActiveEntryConfig.passwordOptions.passwordExpirationDays || 90;
  var inactivityPeriodDays = ActiveEntryConfig && ActiveEntryConfig.passwordOptions && ActiveEntryConfig.passwordOptions.inactivityPeriodDays || 180;

  Meteor.call("isAccountInactive",[emailValue,inactivityPeriodDays], function(error, isAccountInactive) {
    if (error) {
      console.warn(error);
    } else {
      if (isAccountInactive) {
        // Lock account
        Meteor.call("lockAccount", emailValue);
        ActiveEntry.errorMessages.set('signInError', "Your account has been locked due to inactivity.");
        return;
      } else {
        // Check account is locked
        Meteor.call("isAccountLocked", function (error, isAccountLocked) {
          if (error) {
            console.warn(error);
          } else {

            if (isAccountLocked) {
              ActiveEntry.errorMessages.set('signInError', "Your account has been locked.");
              return;
            }

            Meteor.call("getFailedAttemptsCount", emailValue, function(error, failedAttemptsCount) {
              if (error) {
                console.warn(error.message);
              } else {
                if (failedAttemptsCount != failedAttemptsLimit) {
                  Meteor.loginWithPassword({email: emailValue}, passwordValue, function (loginError, result) {
                    if (loginError) {
                      // Login failed
                      Meteor.call("updateFailedAttempts", [emailValue, failedAttemptsLimit], function(error, failedAttemptCount) {
                        if (error) {
                          console.warn(error);
                        } else {
                          if (failedAttemptCount == failedAttemptsLimit) {
                            ActiveEntry.errorMessages.set('signInError', "Too many failed login attempts. Your account has been locked.");

                          } else if (failedAttemptCount < failedAttemptsLimit) {
                            ActiveEntry.errorMessages.set('signInError', loginError.message + "<br />" +(failedAttemptsLimit - failedAttemptCount) + " attempts remaining.");
                          } else {
                            ActiveEntry.errorMessages.set('signInError', loginError.message);
                          }
                        }
                      });
                    } else {
                      // Reset failed attempts
                      Meteor.call("resetFailedAttempts", emailValue);

                      // Check password expiration
                      // if password expired, route to changePassword page
                      Meteor.call("isPasswordExpired", passwordExpirationDays, function(error, isPasswordExpired) {
                        if (error) {
                          console.warn(error);
                        } else {
                          // Update last login time
                          Meteor.call("updateLastLoginDate");

                          if (isPasswordExpired) {
                            ActiveEntry.errorMessages.set('changePasswordError', 'Your password expired. Please change your password.');
                            Router.go('/changePassword');
                          } else {
                            Router.go(ActiveEntryConfig.signIn.destination);
                          }
                        }
                      });

                    }
                  });
                } else {
                  ActiveEntry.errorMessages.set('signInError', "Your account has been locked.");
                }
              }

            });

          }

        });
      }
    }
  });

};

ActiveEntry.loginWithLDAP = function(username, password) {
  if (!username || !password) {
    return;
  }

  Meteor.loginWithLDAP(username, password, {
    // The dn value depends on what you want to search/auth against
    // The structure will depend on how your ldap server
    // is configured or structured.
    dn: "uid=" + username + ",ou=users,ou=system",
    // The search value is optional. Set it if your search does not
    // work with the bind dn.
    searchResultsProfileMap: [
      {
        resultKey: 'cn',
        profileProperty: 'fullName'
      },
      {
        resultKey: 'mail',
        profileProperty: 'email'
      }
    ]
  }, function(error) {
    if (error) {
      ActiveEntry.errorMessages.set('signInError', error.errorType+" ["+error.error+"]");
      return;
    }
    ActiveEntry.errorMessages.set('signInError', null);

    // Update last login time
    Meteor.call("updateLastLoginDate");

    var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
    Router.go(ActiveEntryConfig.signIn.destination);

  });
};

ActiveEntry.signUp = function (emailValue, passwordValue, confirmPassword, fullName){
  ActiveEntry.verifyEmail(emailValue);
  ActiveEntry.verifyPassword(passwordValue);
  ActiveEntry.verifyConfirmPassword(passwordValue, confirmPassword);
  ActiveEntry.verifyFullName(fullName);
  ActiveEntry.errorMessages.set('signInError', null);

  var errorIsFound = false;
  Object.keys(ActiveEntry.errorMessages.keys).forEach(function(key) {
    if (ActiveEntry.errorMessages.get(key) !== "null" && ActiveEntry.errorMessages.get(key) !== null) {
      errorIsFound = true;
    }
  });

  if(errorIsFound) {
    return;
  }

  // Capitalize first letter of every word in fullName
  var capitalizedFullName = fullName.replace(/[^\s]+/g, function(str){
    return str.substr(0,1).toUpperCase()+str.substr(1).toLowerCase();
  });

  Accounts.createUser({
    email: emailValue,
    password: passwordValue,
    profile: {
      fullName: capitalizedFullName
    }
  }, function (error, result) {
    if (error) {
      ActiveEntry.errorMessages.set('signInError', error.message);
    } else {
      // Add password in previousPasswords field
      ActiveEntry.insertHashedPassword(passwordValue);

      // Update password set date
      ActiveEntry.updatePasswordSetDate();

      // Update last login time
      Meteor.call("updateLastLoginDate");

      var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
      Router.go(ActiveEntryConfig.signUp.destination);
    }
  });
};

ActiveEntry.forgotPassword = function(emailAddress) {
  ActiveEntry.verifyEmail(emailAddress);
  ActiveEntry.errorMessages.set("forgotPassword", null);
  ActiveEntry.successMessages.set("forgotPassword", null);

  if (ActiveEntry.errorMessages.get("email")) {
    return;
  }

  Accounts.forgotPassword({email:emailAddress }, function(error){
    if (error) {
      console.warn(error.message);
      ActiveEntry.errorMessages.set("forgotPassword", error.message);
      return;
    }
    // Show email sent notification
    ActiveEntry.successMessages.set("forgotPassword", "Your password reset email is sent  to <strong>"+emailAddress+"</strong>");
  });
};

ActiveEntry.resetPassword = function(passwordValue, confirmPassword) {
  ActiveEntry.verifyPassword(passwordValue);
  ActiveEntry.verifyConfirmPassword(passwordValue, confirmPassword);
  ActiveEntry.errorMessages.set("resetPassword", null);

  // Check error messages
  if (ActiveEntry.errorMessages.get("password") ||  ActiveEntry.errorMessages.get("confirm")) {
    return;
  }

  Accounts.resetPassword(Session.get('_resetPasswordToken'), passwordValue, function(error) {
    if (error) {
      ActiveEntry.errorMessages.set("resetPassword", error.message);
      return;
    }
    Session.set('_resetPasswordToken', null);
    var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
    Router.go(ActiveEntryConfig.signIn.destination);
  });
};

// Insert hashed password in previousPasswords fields
ActiveEntry.insertHashedPassword =  function(passwordValue) {
  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  var passwordHistoryCount = ActiveEntryConfig && ActiveEntryConfig.passwordOptions && ActiveEntryConfig.passwordOptions.passwordHistoryCount || 6;
  Meteor.call("insertHashedPassword", [new String(passwordValue).hashCode(),passwordHistoryCount]);
};

ActiveEntry.updatePasswordSetDate = function() {
  Meteor.call("updatePasswordSetDate");
};

ActiveEntry.signOut = function (){
  Meteor.logout();
};

ActiveEntry.reset = function (){
  ActiveEntry.errorMessages.set('signInError', false);
  ActiveEntry.errorMessages.set('fullName', false);
  ActiveEntry.errorMessages.set('email', false);
  ActiveEntry.errorMessages.set('confirm', false);
  ActiveEntry.errorMessages.set('password', false);
};

ActiveEntry.logoIsDisplayed = function (){
  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  return ActiveEntryConfig.logo.displayed;
};
