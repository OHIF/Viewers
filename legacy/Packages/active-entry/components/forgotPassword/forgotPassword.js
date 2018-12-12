//==========================================

Router.route('/forgotPassword', {
  name: "forgotPassword",
  template: "forgotPassword"
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
    ActiveEntry.successMessages.set("forgotPassword", "Your password reset email is sending...");
    var emailAddress = $('#signInPageEmailInput').val();
    ActiveEntry.forgotPassword(emailAddress);
  }
});

