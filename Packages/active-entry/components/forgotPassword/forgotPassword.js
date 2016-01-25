//==========================================

Router.route('/forgotPassword', {
  name: "forgotPassword",
  template: "forgotPassword"
});


Template.forgotPassword.helpers({
  getForgotPasswordStyle: function (){
    return "border: 1px solid gray";
  }
});

Template.forgotPassword.events({
  "submit": function (event, template) {
    event.preventDefault();

    console.log('send reminder!');
    Accounts.forgotPassword({email: $('#signInPageEmailInput').val()});
  }
});
