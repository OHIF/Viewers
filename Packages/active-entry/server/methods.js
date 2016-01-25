Meteor.methods({
  initializeEntryUsers: function (){
    console.log('Initializing Users', Meteor.users.find().fetch());

  },
  dropEntryUsers: function (){
    console.log('Drop Users', Meteor.users.find().fetch());
    Meteor.users.find().forEach(function(user){
      Meteor.users.remove({_id: user._id});
    });
  }
});
