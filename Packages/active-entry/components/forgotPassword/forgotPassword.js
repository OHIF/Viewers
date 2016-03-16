//==========================================

Router.route('/forgotPassword', {
  name: "forgotPassword",
  template: "forgotPassword"
});

Router.route('/resetPassword/:token', {
  template: 'resetPassword',
  name: 'resetPassword',
    onBeforeAction: function() {
        var token = this.params.token;
        Session.set('_resetPasswordToken', token);
        this.next();
    }
});

Template.forgotPassword.helpers({
    getForgotPasswordMessageColor: function (){
        if (ActiveEntry.errorMessages.get('forgotPassword')) {
            return "color: #a94442; background-color: #f2dede; border-color: #ebccd1;"
        } else {
            return "color: black;"
        }
    },
    getForgotPasswordMessage: function (){
        return ActiveEntry.errorMessages.get('forgotPassword');
    },
    getForgotPasswordStyle: function (){
        return "border: 1px solid gray";
    },
    forgotPasswordNotification: function() {
        return ActiveEntry.successMessages.get("forgotPassword");
    }
});

Template.forgotPassword.events({
  "submit": function (event, template) {
    event.preventDefault();

    console.log('send reminder!');
    var emailAddress = $('#signInPageEmailInput').val();
    ActiveEntry.forgotPassword(emailAddress);
  }
});

// Reset password template
Template.resetPassword.helpers({
  resetPassword: function(){
      return Session.get('_resetPasswordToken');
  },
  resetPasswordErrorMessages: function() {
    if (ActiveEntry.errorMessages.get("password")) {
      return [ActiveEntry.errorMessages.get("password")];
    }
    if (ActiveEntry.errorMessages.get("confirm")) {
        return [ActiveEntry.errorMessages.get("confirm")];
    }

    return;
  }
});

Template.resetPassword.events({
    'keyup #resetPasswordInput': function (event, template) {
        var password = $('#resetPasswordInput').val();
        ActiveEntry.verifyPassword(password);
        ActiveEntry.errorMessages.set('forgotPassword', null);
    },
    'keyup #resetPasswordConfirmInput': function (event, template) {

        var password = $('#resetPasswordInput').val();
        var confirmPassword = $('#resetPasswordConfirmInput').val();

        ActiveEntry.verifyConfirmPassword(password, confirmPassword);
        ActiveEntry.errorMessages.set('forgotPassword', null);
    },
    'click #resetPasswordButton': function(e, template) {
        e.preventDefault();
        var password = $('#resetPasswordInput').val();
        var passwordConfirm = $('#resetPasswordConfirmInput').val();
        ActiveEntry.resetPassword(password, passwordConfirm);
    }
});
