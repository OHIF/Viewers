Meteor.methods({
  initializeEntryUsers: function (){
    console.log('Initializing Users', Meteor.users.find().fetch());

  },

  dropEntryUsers: function (){
    console.log('Drop Users', Meteor.users.find().fetch());
    Meteor.users.find().forEach(function(user){
      Meteor.users.remove({_id: user._id});
    });
  },

  insertHashedPassword: function(passwordParameters) {
    var hashedPassword = passwordParameters[0];
    var passwordHistoryCount = passwordParameters[1];

    var userId = Meteor.userId();
    var previousPasswords = Meteor.users.findOne({_id: userId}).previousPasswords;
    if (previousPasswords) {
      if (previousPasswords.length == passwordHistoryCount) {
        // Remove oldest password
        var ascSortedPasswords =  _.sortBy(previousPasswords, function(previousPassword){ return previousPassword.createdAt; });
        ascSortedPasswords.splice(0, 1);
        previousPasswords = ascSortedPasswords;
      }

      previousPasswords.push({hashedPassword: hashedPassword, createdAt: new Date()});
      Meteor.users.update({_id: userId}, {$set: {previousPasswords: previousPasswords}});
    } else {
      Meteor.users.update({_id: userId}, {$set: {previousPasswords: [{hashedPassword: hashedPassword, createdAt: new Date(), select: false}]}});
    }
  },

  checkPasswordExistence: function(hashedPassword) {
    var previousPasswords = Meteor.users.find({_id: Meteor.userId()}).fetch()[0].previousPasswords;
    for(var i=0; i< previousPasswords.length; i++) {
        var recordedHashedPassword = previousPasswords[i].hashedPassword;
        if (recordedHashedPassword == hashedPassword) {
            return true;
        }
    }
    return false;
  },

  getFailedAttemptsCount: function(emailAddress) {
    // Check if the user actually exists, and if not, stop here
    var currentUser = Meteor.users.findOne({"emails.address": emailAddress});
    if (!currentUser) {
      return;
    }
    
    return currentUser.failedPasswordAttempts || 0;
  },

  updateFailedAttempts: function(emailAddress, failedAttemptsLimit) {

    // Check if the user actually exists, and if not, stop here
    var currentUser = Meteor.users.findOne({"emails.address": emailAddress});
    if (!currentUser) {
      return;
    }

    var failedAttemptCount = currentUser.failedPasswordAttempts || 0;
    if (failedAttemptCount == failedAttemptsLimit) {
      return failedAttemptCount;
    } else {
      if (failedAttemptCount == (failedAttemptsLimit - 1)) {
        // Locked user account
        Meteor.users.update({"emails.address": emailAddress}, {$set: {"profile.isLocked": true, failedPasswordAttempts: failedAttemptCount + 1}});
      } else if (failedAttemptCount < (failedAttemptsLimit - 1)) {
        Meteor.users.update({"emails.address": emailAddress}, {$set: {failedPasswordAttempts: failedAttemptCount + 1}});
      }
    }

    return failedAttemptCount + 1;
  },

  lockAccount: function(emailAddress) {
    // Check if the user actually exists, and if not, stop here
    var currentUser = Meteor.users.findOne({"emails.address": emailAddress});
    if (!currentUser) {
      return;
    }

    Meteor.users.update({"emails.address": emailAddress}, {$set: {"profile.isLocked": true}});
  },

  resetFailedAttempts: function(emailAddress) {
    Meteor.users.update({"emails.address": emailAddress}, {$set: {failedPasswordAttempts: 0}});
  },

  updatePasswordSetDate: function() {
    Meteor.users.update({_id: Meteor.userId()}, {$set: {"services.password.setDate": new Date()}});
  },

  isPasswordExpired: function(passwordExpirationDays) {
    var passwordSetDate = Meteor.users.find({_id: Meteor.userId()}).fetch()[0].services.password.setDate;
    if (!passwordSetDate) {
      return false;
    }

    passwordSetDate.setDate(passwordSetDate.getDate() + passwordExpirationDays);

    if (passwordSetDate <= new Date()) {
      return true;
    }

    return false;
  },

  isAccountLocked: function(emailAddress) {
    // Check if the user actually exists, and if not, stop here
    var currentUser = Meteor.users.findOne({"emails.address": emailAddress});
    if (!currentUser) {
      return;
    }

    return currentUser.profile.isLocked || false;
  },

  updateLastLoginDate: function () {
    var user = Meteor.users.findOne(Meteor.userId());
    if (!user) {
      return;
    }
    var priorLoginDate = user.lastLoginDate;
    if (!priorLoginDate) {
      priorLoginDate = new Date();
    }
    // Update priorLoginDate and lastLoginDate
    Meteor.users.update({_id: Meteor.userId()}, {$set: {priorLoginDate: priorLoginDate, lastLoginDate: new Date()}});
  },

  isAccountInactive: function (emailAddress, inactivityPeriodDays) {
    // Check if the user actually exists, and if not, stop here
    var currentUser = Meteor.users.findOne({"emails.address": emailAddress});
    if (!currentUser) {
      return;
    }

    var lastLoginDate = currentUser.lastLoginDate;
    if (!lastLoginDate) {
      return false; 
    }

    lastLoginDate.setDate(lastLoginDate.getDate() + inactivityPeriodDays);

    if (lastLoginDate <= new Date()) {
      return true;
    }

    return false;
  },

  isLDAPSet: function() {
    if (LDAP_DEFAULTS && LDAP_DEFAULTS.url && LDAP_DEFAULTS.port) {
      return true;
    }

    return false;
  },

  checkResetTokenIsExpired: function(token, expireTimeInMinute) {
    var user = Meteor.users.findOne({"services.password.reset.token": token});
    if (!user) {
      return;
    }
    var tokenCreatedTime = user.services.password.reset.when;
    if (!tokenCreatedTime) {
        return;
    }
    // Token will be expired if created time is over 30 min as default
    tokenCreatedTime.setTime(tokenCreatedTime.getTime() + expireTimeInMinute*60000);
    if (tokenCreatedTime < new Date()) {
        // Remove reset token
        Meteor.users.update({_id: user._id}, {$unset: {'services.password.reset': 1}});
        return true;
    }

    return false;
  },

  checkResetPasswordExistence: function(hashedPassword, token) {
    var user = Meteor.users.findOne({"services.password.reset.token": token});
    if (!user) {
      return;
    }
    var previousPasswords = user.previousPasswords;
    if (!previousPasswords) {
      return;
    }
    for(var i=0; i< previousPasswords.length; i++) {
      var recordedHashedPassword = previousPasswords[i].hashedPassword;
      if (recordedHashedPassword == hashedPassword) {
        return true;
      }
    }
    return false;
  },

});
