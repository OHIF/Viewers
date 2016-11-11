HipaaAuditLog = {
  configure: function (configObject) {
    if (Meteor.isClient) {
      Session.set('HipaaAuditLogConfig', configObject);
    }
    //console.log("HipaaAuditLogConfig.configObject", configObject);
  }
}

if (Meteor.isClient) {
  Session.setDefault('HipaaAuditLogConfig', {
    classes: {
      input: "",
      select: "",
      ribbon: ""
    },
    highlightColor: "",
    closeButton: false
  });
}
