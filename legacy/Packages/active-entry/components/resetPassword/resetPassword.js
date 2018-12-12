
Router.route('/resetPassword/:token', {
    template: 'resetPassword',
    name: 'resetPassword',
    onBeforeAction: function() {
        var token = this.params.token;
        Session.set('_resetPasswordToken', token);
        this.next();
    }
});

// Reset password template
Template.resetPassword.helpers({
    getResetPasswordInMessageColor: function (){
        if (ActiveEntry.errorMessages.get('resetPasswordError')) {
            return "color: #a94442; background-color: #f2dede; border-color: #ebccd1;"
        } else {
            return "color: black;"
        }
    },
    getResetPasswordMessage: function (){
        if (ActiveEntry.errorMessages.get('resetPasswordError')) {
            return ActiveEntry.errorMessages.get('resetPasswordError');
        } else {
            return Session.get('defaultSignInMessage');
        }
    },
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
        ActiveEntry.errorMessages.set('resetPasswordError', null);
    },
    'keyup #resetPasswordConfirmInput': function (event, template) {

        var password = $('#resetPasswordInput').val();
        var confirmPassword = $('#resetPasswordConfirmInput').val();

        ActiveEntry.verifyConfirmPassword(password, confirmPassword);
        ActiveEntry.errorMessages.set('resetPasswordError', null);
    },
    'click #resetPasswordButton': function(e, template) {
        e.preventDefault();
        var password = $('#resetPasswordInput').val();
        var passwordConfirm = $('#resetPasswordConfirmInput').val();

        if (ActiveEntry.errorMessages.get('password') || ActiveEntry.errorMessages.get('confirm')) {
            return;
        }
        ActiveEntry.resetPassword(password, passwordConfirm);
    }
});