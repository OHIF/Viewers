// var nightwatch = require('nightwatch');

describe('clinical:active-entry', function () {
  var server = meteor();
  var client = browser(server);

  // before(function () {
  //   return server.promise(function (resolve){
  //     Meteor.users.find().forEach(function(user){
  //       Meteor.users.remove({_id: user._id});
  //     }, function(){
  //       resolve();
  //     });
  //   });
  // });

  // afterEach(function (){
  //   return client.promise(function (resolve){
  //     Meteor.logout(function(error, result){
  //       resolve();
  //     });
  //   });
  // });


  it("ActiveEntry object should be loaded on client and server", function () {
    return server.execute(function () {
      expect(ActiveEntry.isAbc()).to.equal('abc');
    }).then(function (data){
      return client.execute(function (a) {
        expect(ActiveEntry.isAbc()).to.equal('abc');
      });
    });
  });

  it("Error messages should be empty by default", function () {
    return client.execute(function () {
      expect(ActiveEntry.errorMessages.get('signInError')).to.equal(false);
    });
  });

  // ActiveEntry.verifyEmail
  it('Email validation confirms it is a properly formatted email.', function () {
    return client.execute(function (a) {
      ActiveEntry.verifyEmail('janedoe@somewhere.com');
      expect(ActiveEntry.successMessages.get('email')).to.equal("Email present");

      ActiveEntry.verifyEmail('');
      expect(ActiveEntry.errorMessages.get('email')).to.equal("Email is required");

      ActiveEntry.verifyEmail('janedoe.somewhere.com');
      expect(ActiveEntry.errorMessages.get('email')).to.equal("Email is poorly formatted");
    });
  });


  // ActiveEntry.verifyPassword
  it('Password validation confirms it is a properly formatted password.', function () {
    return client.execute(function (a) {
      ActiveEntry.verifyPassword('');
      expect(ActiveEntry.errorMessages.get('password')).to.equal("Password is required");

      ActiveEntry.verifyPassword('kittens');
      expect(ActiveEntry.errorMessages.get('password')).to.equal(Session.get('passwordWarning'));

      ActiveEntry.verifyPassword('K1tt#ns123');
      expect(ActiveEntry.successMessages.get('password')).to.equal("Password present");
    });
  });

  // ActiveEntry.verifyConfirmPassword
  it('Password match confirms that two passwords are the same.', function () {
    return client.execute(function (a) {
      ActiveEntry.verifyConfirmPassword('K1tt#kittens', 'kittens');
      expect(ActiveEntry.errorMessages.get('confirm')).to.equal("Passwords do not match");

      ActiveEntry.verifyConfirmPassword('kittens123', 'kittens');
      expect(ActiveEntry.errorMessages.get('confirm')).to.equal("Passwords do not match");

      ActiveEntry.verifyConfirmPassword('kittens123', 'kittens123');
      expect(ActiveEntry.errorMessages.get('confirm')).to.equal("Passwords match");

      ActiveEntry.verifyConfirmPassword('K1tt#ns123', 'K1tt#ns123');
      expect(ActiveEntry.successMessages.get('confirm')).to.equal("Passwords match");

    });
  });

  // ActiveEntry.verifyFullName
  it('Fullname validation confirms that at least a first and last name are entered.', function () {
    return client.execute(function (a) {
      ActiveEntry.verifyFullName('');
      expect(ActiveEntry.errorMessages.get('fullName')).to.equal("Name is required");

      ActiveEntry.verifyFullName('Jane');
      expect(ActiveEntry.errorMessages.get('fullName')).to.equal("Name is probably not complete");

      ActiveEntry.verifyFullName('Jane Doe');
      expect(ActiveEntry.successMessages.get('fullName')).to.equal("Name present");
    });
  });


  // // ActiveEntry.signIn
  // it('Newly created user record should have role, profile, and name set.', function () {
  //   return client.execute(function () {
  //     ActiveEntry.signUp('janedoe@test.org', 'Janed*e123', 'Janed*e123', 'Jane Doe');
  //     expect(ActiveEntry.successMessages.get('fullName')).to.equal("Name present");
  //   }).then(function (){
  //     return server.wait(500, 'until account is created on the server', function () {
  //       return Meteor.users.findOne({'emails.address': 'janedoe@test.org'});
  //     }).then(function (user){
  //       expect(user.role).to.equal('user');
  //       expect(user.profile.fullName).to.equal('Jane Doe');
  //     });
  //   });
  // });
  // ActiveEntry.signIn
  it('Newly created user record should have role, profile, and name set.', function () {
    return client.execute(function () {
      // ActiveEntry.signUp('janedoe@test.org', 'Janed*e123', 'Janed*e123', 'Jane Doe');
      ActiveEntry.signUp('janedoe@test.org', 'Janedoe123', 'Janedoe123', 'Jane Doe');
      expect(ActiveEntry.successMessages.get('fullName')).to.equal("Name present");
    }).then(function (){
      return server.wait(500, 'until account is created on the server', function () {
        return Meteor.users.findOne({'emails.address': 'janedoe@test.org'});
      }).then(function (user){
        expect(user.role).to.equal('user');
        expect(user.profile.fullName).to.equal('Jane Doe');
      });
    });
  });


  it("Newly created user should have fullName(), preferredName(), and familyName() methods.", function () {
    return server.execute(function () {
      var user = Meteor.users.findOne({'emails.address': 'janedoe@test.org'});
      expect(user).to.be.ok;
      expect(user.fullName()).to.equal('Jane Doe');
      expect(user.givenName()).to.equal('Jane');
      expect(user.familyName()).to.equal('Doe');
    }).then(function (){
      // client.wait(500, "until user is logged out", function(){
      //   Meteor.logout();
      // });
      return client.promise(function (resolve){
        Meteor.logout(function (error, result){
          resolve();
        });
      });

    });
  });
  it("Newly created user can sign in to the application.", function () {
    return client.execute(function () {
      expect(Meteor.userId()).to.not.exist;
      ActiveEntry.signIn('janedoe@test.org', 'Janed*e123');
    }).then(function (){
      client.wait(3000, "for user to sign in", function (){
        expect(Meteor.userId()).to.exist;
      });
    });
  });
  it("Newly created user can sign out of the application.", function () {
    return client.execute(function () {
      expect(Meteor.userId()).to.not.exist;
      ActiveEntry.signIn('janedoe@test.org', 'Janed*e123');
    }).then(function (){
      client.wait(3000, "for user to sign in", function (){
        expect(Meteor.userId()).to.exist;
        ActiveEntry.signOut('janedoe@test.org');
      }).then(function (){
        expect(Meteor.userId()).to.not.exist;
      });
    });
  });



  // it("config should be able to change company logo", function () {
  //
  // });
  // it("config should be able to change entry message text", function () {
  //
  // });

  // it("new user should be able to register on desktop", function () {
  //   client.location = "/sign-in";
  //
  //   client.execute(function () {
  //     expect($('#entrySignIn')).to.exist();
  //     expect($('#signInPageEmailInput')).to.exist();
  //     expect($('#signInPagePasswordInput')).to.exist();
  //     expect($('#signInToAppButton')).to.exist();
  //   }).setValue('#signInPageEmailInput', 'house@test.org')
  //     .setValue('#signInPagePasswordInput', 'house@test.org')
  //     .click('#signInToAppButton').execute(function(){
  //       expect($('#entrySignIn')).to.exist();
  //       expect($('#signInPageEmailInput')).to.exist();
  //       expect($('#signInPagePasswordInput')).to.exist();
  //       expect($('#signInToAppButton')).to.exist();
  //       // expect($('#entrySignIn')).to.not.exist();
  //       // expect($('#signInPageEmailInput')).to.not.exist();
  //       // expect($('#signInPagePasswordInput')).to.not.exist();
  //       // expect($('#signInToAppButton')).to.not.exist();
  //     });
  //     // .then(function(data){
  //     //   return server.execute(3000, 'until the account is created', function () {
  //     //     expect(Meteor.users.find().count()).to.be.above(20);
  //     //   });
  //     // });
  // });


});
