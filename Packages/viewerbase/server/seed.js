var users = [
  {
    email: 'admin@ohif.org',
    //username: "admin",
    password: "admin",
    profile: {

    }
  }
];

Meteor.startup(function() {
  users.forEach(function(user) {
    if(!Meteor.users.findOne({username: user.username})) {
      Accounts.createUser(user);
    }
  });
});