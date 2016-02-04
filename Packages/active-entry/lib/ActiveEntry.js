

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
      requireStrongPasswords: false,
      showPasswordStrengthIndicator: false
    }
  });
}


if (Meteor.isClient) {
  ActiveEntry.errorMessages = new ReactiveDict('errorMessages');
  ActiveEntry.errorMessages.set('signInError', false);

  // Success messages
  ActiveEntry.successMessages = new ReactiveDict('successMessages');

  // Change password warning message according to whether zxcvbn is turned on
  Session.set('passwordWarning', 'Password must have at least 8 characters. It must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character.');
}

ActiveEntry.configure = function (configObject) {
  if (Meteor.isClient) {
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
    //ActiveEntry.errorMessages.set('password', 'Password present');
    ActiveEntry.errorMessages.set('password', null);
    ActiveEntry.successMessages.set('password', 'Password present');
  }

};

ActiveEntry.verifyConfirmPassword = function (password, confirmPassword) {
  if (confirmPassword === password) {
    //ActiveEntry.errorMessages.set('confirm', 'Passwords match');
    ActiveEntry.errorMessages.set('confirm', null);
    ActiveEntry.successMessages.set('confirm', 'Passwords match');
  } else{
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
    //ActiveEntry.errorMessages.set('email', 'Email present');
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

  Meteor.loginWithPassword({email: emailValue}, passwordValue, function (error, result) {
    if (error) {
      ActiveEntry.errorMessages.set('signInError', error.message);
    } else {
      console.log('result', result);
      var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
      console.log('ActiveEntryConfig', JSON.stringify(ActiveEntryConfig));
      Router.go(ActiveEntryConfig.signIn.destination);
    }
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

  Accounts.createUser({
    email: emailValue,
    password: passwordValue,
    profile: {
      fullName: fullName
    }
  }, function (error, result) {
    if (error) {
      console.log(error);
      ActiveEntry.errorMessages.set('signInError', error.message);
    } else {
      var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
      Router.go(ActiveEntryConfig.signUp.destination);
    }
  });

  // Meteor.loginWithPassword({email: emailValue}, passwordValue, function (error, result) {
  //   if (error) {
  //     console.log(error);
  //     Session.set('errorMessage', error);
  //   }
  //
  //   if (result) {
  //     console.log('result', result);
  //   }
  //   var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  //   console.log('ActiveEntryConfig', JSON.stringify(ActiveEntryConfig));
  //   Router.go(ActiveEntryConfig.signIn.destination);
  // });
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
