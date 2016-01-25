

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
    }
  });
}


if (Meteor.isClient) {
  ActiveEntry.errorMessages = new ReactiveDict('errorMessages');
  ActiveEntry.errorMessages.set('signInError', false);

}


ActiveEntry.configure = function (configObject) {
  if (Meteor.isClient) {
    Session.set('Photonic.ActiveEntry', configObject);
  }
};




ActiveEntry.verifyPassword = function (password) {
  if (password.length === 0) {
    ActiveEntry.errorMessages.set('password', 'Password is required');
  } else if (password.length < 8) {
    ActiveEntry.errorMessages.set('password', 'Password is weak');
  } else if (password.length >= 8) {
    ActiveEntry.errorMessages.set('password', 'Password present');
  }
};
ActiveEntry.verifyConfirmPassword = function (password, confirmPassword) {
  if (confirmPassword.length === 0) {
    ActiveEntry.errorMessages.set('confirm', 'Password is required');
  } else if (confirmPassword.length < 8) {
    ActiveEntry.errorMessages.set('confirm', 'Password is weak');
  }

  if (confirmPassword === password) {
    ActiveEntry.errorMessages.set('confirm', 'Passwords match');
  }
};
ActiveEntry.verifyEmail = function (email) {
  if (email.length === 0) {
    ActiveEntry.errorMessages.set('email', 'Email is required');
  } else if (email.indexOf("@") === -1){
    ActiveEntry.errorMessages.set('email', 'Email is poorly formatted');
  } else if (email.indexOf("@") >= 0){
    ActiveEntry.errorMessages.set('email', 'Email present');
  }
};
ActiveEntry.verifyFullName = function (fullName) {
  if (fullName.length === 0) {
    ActiveEntry.errorMessages.set('fullName', 'Name is required');
  } else if (fullName.indexOf(" ") === -1){
    ActiveEntry.errorMessages.set('fullName', 'Name is probably not complete');
  } else if (fullName.indexOf(" ") >= 0){
    ActiveEntry.errorMessages.set('fullName', 'Name present');
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
  ActiveEntry.errorMessages.set('fullName', false);
  ActiveEntry.errorMessages.set('email', false);
  ActiveEntry.errorMessages.set('confirm', false);
  ActiveEntry.errorMessages.set('password', false);
};
ActiveEntry.logoIsDisplayed = function (){
  var ActiveEntryConfig = Session.get('Photonic.ActiveEntry');
  return ActiveEntryConfig.logo.displayed;
}
