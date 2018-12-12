
Meteor.publish('HipaaLog', function () {
  return HipaaLog.find();
});
