Meteor.methods({
  'WorklistSearch' : function(filter) {
    var server = Meteor.settings.dicomWeb.endpoints[0];
    return Services.QIDO.Studies(server, filter);
  }
});