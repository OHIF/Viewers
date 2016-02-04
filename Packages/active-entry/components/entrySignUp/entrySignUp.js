//==================================================================================================
// ROUTER

Router.route('/entrySignUp', {
  template: 'entrySignUp',
  name: 'entrySignUp'
});
Router.route('/sign-up', {
  template: 'entrySignUp',
  name: 'signUpRoute'
});

//==================================================================================================



Template.entrySignUp.helpers({
  getSignUpMessageColor: function (){
    if (ActiveEntry.errorMessages.get('signInError')) {
      return "color: #a94442; background-color: #f2dede; border-color: #ebccd1;";
    } else {
      return "color: black;";
    }
  },
  getSignUpMessage: function (){
    if (ActiveEntry.errorMessages.get('signInError')) {
      return ActiveEntry.errorMessages.get('signInError');
    } else {
      return Session.get('defaultSignInMessage');
    }
  },
  entryErrorMessages: function () {
    var errorMessages = [];
    Object.keys(ActiveEntry.errorMessages.all()).forEach(function(key) {
      if (key !== "signInError" && ActiveEntry.errorMessages.get(key)) {
        errorMessages.push(ActiveEntry.errorMessages.get(key));
      }
    });
    return errorMessages;
  },
  getButtonText: function () {
    if (ActiveEntry.errorMessages.get('signInError')) {
      return ActiveEntry.errorMessages.get('signInError').message;
    } else {
      return "Sign In";
    }
  },
  getEmailStyling: function () {
    if (ActiveEntry.errorMessages.equals('email', "Email is required")) {
      return "border: 1px solid #a94442";
    } else if (ActiveEntry.errorMessages.equals('email', "Email is poorly formatted")) {
      return "border: 1px solid #f2dede";
    } else if (ActiveEntry.successMessages.equals('email', "Email present")) {
      return "border: 1px solid green";
    } else {
      return "border: 1px solid gray";
    }
  },
  getPasswordStyling: function () {
    if (ActiveEntry.errorMessages.equals('password', "Password is required")) {
      return "border: 1px solid #a94442";
    } else if (ActiveEntry.errorMessages.equals('password', Session.get('passwordWarning'))) {
      return "border: 1px solid #f2dede";
    } else if (ActiveEntry.successMessages.equals('password', "Password present")) {
      return "border: 1px solid green";
    } else {
      return "border: 1px solid gray";
    }
  },
  getConfirmPasswordStyling: function () {
    if (ActiveEntry.errorMessages.equals('confirm', "Password is required")) {
      return "border: 1px solid #a94442";
    } else if (ActiveEntry.errorMessages.equals('confirm', "Passwords do not match")) {
      return "border: 1px solid #f2dede";
    } else if (ActiveEntry.successMessages.equals('confirm', "Passwords match")) {
      return "border: 1px solid green";
    } else {
      return "border: 1px solid gray";
    }
  },
  getFullNameStyling: function () {
    if (ActiveEntry.errorMessages.equals('fullName', "Name is required")) {
      return "border: 1px solid #a94442";
    } else if (ActiveEntry.errorMessages.equals('fullName', "Name is probably not complete")) {
      return "border: 1px solid #f2dede";
    } else if (ActiveEntry.successMessages.equals('fullName', "Name present")) {
      return "border: 1px solid green";
    } else {
      return "border: 1px solid gray";
    }
  }
});

Template.entrySignUp.events({
  "click #signUpPageSignInButton": function (event) {
    event.preventDefault();
    ActiveEntry.reset();
    Router.go('/entrySignIn');
  },
  'change, keyup #signUpPageEmailInput': function (event, template) {
    var email = $('[name="email"]').val();

    ActiveEntry.verifyEmail(email);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'change, keyup #signUpPagePasswordInput': function (event, template) {
    var password = $('[name="password"]').val();

    ActiveEntry.verifyPassword(password);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'change, keyup #signUpPagePasswordConfirmInput': function (event, template) {

    var password = $('[name="password"]').val();
    var confirmPassword = $('[name="confirm"]').val();
    // var password = $('#signUpPagePasswordInput').val();
    // var confirmPassword = $('#signUpPagePasswordConfirmInput').val();

    ActiveEntry.verifyConfirmPassword(password, confirmPassword);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'change, keyup #signUpPageFullNameInput': function (event, template) {
    var fullName = template.$('[name="fullName"]').val();

    ActiveEntry.verifyFullName(fullName);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'click #signUpPageJoinNowButton': function (event, template) {
    ActiveEntry.signUp(
      $('#signUpPageEmailInput').val(),
      $('#signUpPagePasswordInput').val(),
      $('#signUpPagePasswordConfirmInput').val(),
      $('#signUpPageFullNameInput').val()
    );
  },
  'keypress #entrySignUp': function(event, template) {
    if(event.keyCode == 13) {
      ActiveEntry.verifyFullName($("#signUpPageFullNameInput").val());
      ActiveEntry.verifyEmail($("#signUpPageEmailInput").val());
      ActiveEntry.verifyPassword($("#signUpPagePasswordInput").val());
      ActiveEntry.verifyConfirmPassword($("#signUpPagePasswordInput").val(), $("#signUpPagePasswordConfirmInput").val());

      if (!ActiveEntry.errorMessages.get('signInError') &&
          ActiveEntry.successMessages.get('fullName') &&
          ActiveEntry.successMessages.get('email') &&
          ActiveEntry.successMessages.get('password') &&
          ActiveEntry.successMessages.get('confirm')) {
        $("#signUpPageJoinNowButton").click();
      }
    }
  }
});

Template.entrySignUp.onRendered(function() {
  // Password strength meter for password inputs
  if (passwordValidationSettings.requireStrongPasswords) {
    this.$('#signUpPagePasswordInput').pwstrength(passwordValidationSettings.pwstrengthOptions);
  }

  // Update password warning message if zxcvbn is active
  if(passwordValidationSettings.showPasswordStrengthIndicator) {
    Session.set('passwordWarning', 'Password is weak');
  }
});

