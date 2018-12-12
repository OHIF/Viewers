

if (Meteor.isClient) {


  Accounts.onResetPasswordLink(function (token, done){
    console.log('Accounts.onResearchPasswordLink');
    console.log('Sending reset password email...');
    console.log('NOT IMPLEMENTED YET.  PLEASE LOG AN ISSUE');
    console.log('token: ' + token);
    done();
  });


  Accounts.onEnrollmentLink(function (token, done){
    console.log('Accounts.onResearchPasswordLink');
    console.log('Sending enrollment email...');
    console.log('NOT IMPLEMENTED YET.  PLEASE LOG AN ISSUE');
    console.log('token: ' + token);
    done();
  });

  Accounts.onEmailVerificationLink(function (token, done){
    console.log('Accounts.onEmailVerificationLink');
    console.log('Sending verification email...');
    console.log('NOT IMPLEMENTED YET.  PLEASE LOG AN ISSUE');
    console.log('token: ' + token);
    done();
  });
}


if (Meteor.isServer){
  // Support for playing D&D: Roll 3d6 for dexterity
  Accounts.onCreateUser(function(options, user) {

    var d6 = function () { return Math.floor(Random.fraction() * 6) + 1; };
    user.dexterity = d6() + d6() + d6();
    user.role = "user";

    // We still want the default hook's 'profile' behavior.
    if (options.profile){
      user.profile = options.profile;
    }

    return user;
  });
}
