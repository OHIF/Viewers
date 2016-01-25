

exports.command = function () {
  this
    .execute(function () {
      return Meteor.logout();
    }).pause(1000);

  return this;
};
