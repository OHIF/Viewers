Router.route("/audit", {
  name:"hipaaAuditLogRoute",
  template:"hipaaLogPage"
});


Template.hipaaLogPage.helpers({});

Template.hipaaLogPage.events({});

// We probably don't need this, but the subscription in subscriptions.js doesn't seem to be working?
Template.hipaaLogPage.onCreated(function() {
    this.subscribe('HipaaLog');
})