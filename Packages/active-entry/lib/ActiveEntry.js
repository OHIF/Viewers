

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
      inactivityPeriodDays: 180,
      expireTimeInMinute: 30
    }
  });

  ActiveEntry.errorMessages = new ReactiveDict('errorMessages');
  ActiveEntry.errorMessages.set('signInError', false);

  // Success messages
  ActiveEntry.successMessages = new ReactiveDict('successMessages');

  // Change password warning message according to whether zxcvbn is turned on
  Session.set('passwordWarning', 'Password must have at least 8 characters. It must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character.');

  // Activate LDAP if ldap url and port is set in settings.json
  Meteor.call('isLDAPSet', function(error, isSet) {
    Session.set('isLDAPSet', isSet);
  });
}

if (Meteor.isServer) {
  LDAP_DEFAULTS = {};
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
        inactivityPeriodDays: 180,
        expireTimeInMinute: 30
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

ActiveEntry.verifyLDAPUsername = function(username) {
  if (username === "") {
    ActiveEntry.errorMessages.set("ldapUsername", "Username is required");
    ActiveEntry.successMessages.set("ldapUsername", null);
  } else {
    ActiveEntry.errorMessages.set("ldapUsername", null);
    ActiveEntry.successMessages.set("ldapUsername", "Username present");
  }
};

ActiveEntry.verifyLDAPPassword = function(password) {
  if (password === "") {
    ActiveEntry.errorMessages.set("ldapPassword", "Password is required");
    ActiveEntry.successMessages.set("ldapPassword", null);
  } else {
    ActiveEntry.errorMessages.set("ldapPassword", null);
    ActiveEntry.successMessages.set("ldapPassword", "Password present");
  }
};

ActiveEntry.signIn = function (emailValue, passwordValue){

  ActiveEntry.verifyPassword(passwordValue);
  ActiveEntry.verifyEmail(emailValue);

  var signInArgs = {email: emailValue, password: passwordValue};

  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  var passwordOptions = ActiveEntryConfig && ActiveEntryConfig.passwordOptions;

  Meteor.call("isAccountInactive",emailValue, passwordOptions.inactivityPeriodDays, function(error, isAccountInactive) {
    if (error) {
      console.warn(error.message);
      return;
    }

    if (isAccountInactive) {
      // Lock account
      ActiveEntry.lockAccount(signInArgs);
    } else {
      // Check account is locked
      ActiveEntry.isAccountLocked(signInArgs, passwordOptions);
    }
  });

};

ActiveEntry.lockAccount = function(signInArgs) {
  var emailValue = signInArgs && signInArgs.email;
  if (!emailValue) {
    return;
  }
  Meteor.call("lockAccount", emailValue);
  ActiveEntry.errorMessages.set('signInError', "Your account has been locked due to inactivity.");
};

ActiveEntry.isAccountLocked = function(signInArgs, passwordOptions) {
  var emailValue = signInArgs && signInArgs.email;
  if (!emailValue) {
    return;
  }

  Meteor.call("isAccountLocked", emailValue, function (error, isAccountLocked) {
    if (error) {
      console.warn(error.message);
      return;
    }

    if (isAccountLocked) {
      ActiveEntry.errorMessages.set('signInError', "Your account has been locked.");
      return;
    }

    // Get failed attempts count
    ActiveEntry.getFailedAttemptsCount(signInArgs, passwordOptions);
  });

};

ActiveEntry.getFailedAttemptsCount = function(signInArgs, passwordOptions) {
  var emailValue = signInArgs && signInArgs.email;
  if (!emailValue) {
    return;
  }
  Meteor.call("getFailedAttemptsCount", emailValue, function(error, failedAttemptsCount) {
    if (error) {
      console.warn(error.message);
      return;
    }

    if (failedAttemptsCount != passwordOptions.failedAttemptsLimit) {
      // Login with password
      ActiveEntry.loginWithPassword(signInArgs, passwordOptions);
    } else {
      ActiveEntry.errorMessages.set('signInError', "Your account has been locked.");
    }

  });
};

ActiveEntry.loginWithPassword = function(signInArgs, passwordOptions) {
  var emailValue = signInArgs && signInArgs.email;
  var password = signInArgs && signInArgs.password;

  if (!emailValue || !password) {
    return;
  }

  Meteor.loginWithPassword(emailValue, password, function (loginError, result) {
    if (loginError) {
      // Login failed
      if (loginError.error == 403) {
        ActiveEntry.updateFailedAttempts(signInArgs, passwordOptions, loginError);
      }
      return;
    }

    // Reset failed attempts
    Meteor.call("resetFailedAttempts", emailValue);

    // Check password expiration
    ActiveEntry.isPasswordExpired(passwordOptions);

  });
};

ActiveEntry.isPasswordExpired = function(passwordOptions) {
  // if password expired, route to changePassword page
  Meteor.call("isPasswordExpired", passwordOptions.passwordExpirationDays, function(error, isPasswordExpired) {
    if (error) {
      console.warn(error.message);
      return;
    }

    // Update last login time
    Meteor.call("updateLastLoginDate");

    if (isPasswordExpired) {
      ActiveEntry.errorMessages.set('changePasswordError', 'Your password expired. Please change your password.');
      Router.go('/changePassword');
    } else {
      var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
      Router.go(ActiveEntryConfig.signIn.destination);
    }
  });
};

ActiveEntry.updateFailedAttempts = function(signInArgs, passwordOptions, loginError) {
  var emailValue = signInArgs && signInArgs.email;

  if (!emailValue) {
    return;
  }
  Meteor.call("updateFailedAttempts", emailValue, passwordOptions.failedAttemptsLimit, function(error, failedAttemptCount) {
    if (error) {
      console.warn(error.message);
      return;
    }

    if (failedAttemptCount == passwordOptions.failedAttemptsLimit) {
      ActiveEntry.errorMessages.set('signInError', "Too many failed login attempts. Your account has been locked.");
    } else if (failedAttemptCount < passwordOptions.failedAttemptsLimit) {
      ActiveEntry.errorMessages.set('signInError', loginError.message + "<br />" +(passwordOptions.failedAttemptsLimit - failedAttemptCount) + " attempts remaining.");
    } else {
      ActiveEntry.errorMessages.set('signInError', loginError.message);
    }
  });
};


ActiveEntry.loginWithLDAP = function(username, password) {
  ActiveEntry.verifyLDAPUsername(username);
  ActiveEntry.verifyLDAPPassword(password);
  ActiveEntry.errorMessages.set('signInError', null);

  if (ActiveEntry.errorMessages.get("ldapUsername") || ActiveEntry.errorMessages.get("ldapPassword")) {
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
      return;
    }
    // Add password in previousPasswords field
    ActiveEntry.insertHashedPassword(passwordValue);

    // Update password set date
    ActiveEntry.updatePasswordSetDate();

    // Update last login time
    Meteor.call("updateLastLoginDate");

    var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
    Router.go(ActiveEntryConfig.signUp.destination);

  });
};
ActiveEntry.changePassword = function(oldPassword, password) {
  Meteor.call("checkPasswordExistence", new String(password).hashCode(), function(error, isPasswordExisted) {
    if (error) {
      console.warn(error.message);
      ActiveEntry.errorMessages.set('changePasswordError', error.message);
      return;
    }

    if (isPasswordExisted) {
      ActiveEntry.errorMessages.set('changePasswordError', 'Password is used before. Please change your new password.');
    } else {
      ActiveEntry.errorMessages.set('changePasswordError', null);

      // If password is not found in password history, change the password
      Accounts.changePassword(oldPassword, password, function(error) {
        if (error) {
          console.warn(error);
          ActiveEntry.errorMessages.set('changePasswordError', error.message);
          return;
        }

        // Save the new password
        ActiveEntry.insertHashedPassword(password);

        // Update password expiration date
        ActiveEntry.updatePasswordSetDate();

        // Logout
        ActiveEntry.signOut();
        // Go to signIn page for new entry
        Router.go('/entrySignIn');
      });
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
      ActiveEntry.successMessages.set("forgotPassword", null);
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

  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  var passwordOptions = ActiveEntryConfig && ActiveEntryConfig.passwordOptions;

  // Check token is expired
  Meteor.call('checkResetTokenIsExpired', Session.get('_resetPasswordToken'), passwordOptions.expireTimeInMinute, function(error, isTokenExpired) {
    if (error) {
      console.log(error.message);
      return;
    }

    if (isTokenExpired) {
      console.log("Your link is expired");
      // Go to forgotPassword to create a new reset link
      ActiveEntry.errorMessages.set("forgotPassword", 'Your link is expired. Please create a new reset link.');
      Router.go('/forgotPassword');
      return;
    }

    // Check password history
    Meteor.call("checkResetPasswordExistence", new String(passwordValue).hashCode(), Session.get('_resetPasswordToken'), function(error, isPasswordExisted) {
      if (error) {
        console.warn(error.message);
        ActiveEntry.errorMessages.set('resetPasswordError', error.message);
        return;
      }

      if (isPasswordExisted) {

        ActiveEntry.errorMessages.set('resetPasswordError', 'Password is used before. Please change your new password.');
      } else {

        ActiveEntry.errorMessages.set('resetPasswordError', null);
        Accounts.resetPassword(Session.get('_resetPasswordToken'), passwordValue, function(error) {
          if (error) {
            ActiveEntry.errorMessages.set("resetPassword", error.message);
            return;
          }
          Session.set('_resetPasswordToken', null);
          // Save the new password
          ActiveEntry.insertHashedPassword(passwordValue);

          // Update password expiration date
          ActiveEntry.updatePasswordSetDate();

          // Update last login time
          Meteor.call("updateLastLoginDate");

          var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
          Router.go(ActiveEntryConfig.signIn.destination);
        });
      }
    });

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
