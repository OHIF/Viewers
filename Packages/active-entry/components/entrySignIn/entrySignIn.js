
// REFACTOR:  Move to ActiveRecord object
Session.set("defaultSignInMessage", "Improve your clinical practice with checklists.");

//==================================================================================================
// ROUTER

Router.route('/entrySignIn', {
  template: 'entrySignIn',
  name: 'entrySignIn'
});
Router.route('/sign-in', {
  template: 'entrySignIn',
  name: 'signInRoute'
});

//==================================================================================================
// COMPONENT OUTPUTS




Template.entrySignIn.helpers({
  getSignInMessageColor: function (){
    if (ActiveEntry.errorMessages.get('signInError')) {
      return "color: #a94442; background-color: #f2dede; border-color: #ebccd1;"
    } else {
      return "color: black;"
    }
  },
  getSignInMessage: function (){
    if (ActiveEntry.errorMessages.get('signInError')) {
      return ActiveEntry.errorMessages.get('signInError');
    } else {
      return Session.get('defaultSignInMessage');
    }
  },
  getButtonText: function () {
    return "Sign In";
    // if (ActiveEntry.errorMessages.get('signInError')){
    //   return ActiveEntry.errorMessages.get('signInError');
    // } else {
    //   return "Sign In";
    // }
  },
  getEmailValidationStyling: function () {
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
  getPasswordValidationStyling: function () {
    if (ActiveEntry.errorMessages.equals('password', "Password is required")) {
      return "border: 1px solid #a94442";
    } else if (ActiveEntry.errorMessages.equals('password', Session.get('passwordWarning'))) {
      return "border: 1px solid #f2dede";
    } else if (ActiveEntry.successMessages.equals('password', "Password present")) {
      return "border: 1px solid green";
    } else {
      return "border: 1px solid gray";
    }
  }
});


//==================================================================================================
// COMPONENT OUTPUTS

Template.entrySignIn.events({
  'click #logoutButton': function () {
    Meteor.logout();
  },
  'click #forgotPasswordButton': function (event) {
    event.preventDefault();
    ActiveEntry.reset();
    Router.go('/forgotPassword');
  },
  "click #needAnAccountButton": function (event) {
    event.preventDefault();
    ActiveEntry.reset();
    Router.go('/entrySignUp');
  },
  'keyup input[name="email"]': function (event, template) {
    var email = $('input[name="email"]').val();

    ActiveEntry.verifyEmail(email);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'change input[name="email"]': function (event, template) {
    var email = $('input[name="email"]').val();

    ActiveEntry.verifyEmail(email);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'keyup #signInPagePasswordInput': function (event, template) {
    var password = $('input[name="password"]').val();

    ActiveEntry.verifyPassword(password);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  'change #signInPagePasswordInput': function (event, template) {
    var password = $('input[name="password"]').val();

    ActiveEntry.verifyPassword(password);
    ActiveEntry.errorMessages.set('signInError', null);
  },
  // 'submit': function (event, template) {
  //   event.preventDefault();
  //   var emailValue = template.$('[name=email]').val();
  //   var passwordValue = template.$('[name=password]').val();
  //
  //   ActiveEntry.signIn(emailValue, passwordValue);
  // },
  'click #signInToAppButton': function (event, template){
    ActiveEntry.reset();
    // var emailValue = template.$('[name=email]').val();
    // var passwordValue = template.$('[name=password]').val();
    var emailValue = template.$('#signInPageEmailInput').val();
    var passwordValue = template.$('#signInPagePasswordInput').val();

    ActiveEntry.signIn(emailValue, passwordValue);
    event.preventDefault();
  },
  'keypress #entrySignIn': function(event, template) {
    if(event.keyCode == 13) {
      ActiveEntry.verifyEmail($("#signInPageEmailInput").val());
      ActiveEntry.verifyPassword($("#signInPagePasswordInput").val());

      if (!ActiveEntry.errorMessages.get('signInError') &&
          ActiveEntry.successMessages.get('email') &&
          ActiveEntry.successMessages.get('password')) {
        $("#signInToAppButton").click();
      }
    }
  }
});



//==================================================================================================
