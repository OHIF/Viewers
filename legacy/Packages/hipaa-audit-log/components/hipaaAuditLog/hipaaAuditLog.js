//Hipaa =  new Meteor.Collection("hipaa");

Session.setDefault("hipaaSearchFilter", '');
Session.setDefault("hipaaTypeFilter", '');

// search window defaults to seven days in the past and one day in the future
Session.setDefault("beginDateFilter", new Date(moment().subtract(7, "days")).toISOString());
Session.setDefault("endDateFilter", new Date(moment().add(1, "days")).toISOString());




Template.hipaaAuditLog.onRendered(function () {
  Session.set("ribbonWidth", $('#hipaaRibbon').width());
});

Template.hipaaAuditLog.helpers({
  getHipaaSearchFilter: function () {
    return Session.get('hipaaSearchFilter');
  },
  hipaaAudit: function () {
    // return HipaaLog.find();
    return  HipaaLog.find({
      $or: [
        {
          userName: {
            $regex: Session.get('hipaaSearchFilter'),
            $options: 'i'
          }
        },
        {
          patientName: {
            $regex: Session.get('hipaaSearchFilter'),
            $options: 'i'
          }
        },
        {
          recordId: {
            $regex: Session.get('hipaaSearchFilter'),
            $options: 'i'
          }
        },
        {
          collectionName: {
            $regex: Session.get('hipaaSearchFilter'),
            $options: 'i'
          }
        }
      ],
      eventType: {
        $regex: Session.get("hipaaTypeFilter"),
        $options: 'i'
      },
      timestamp: {
        $lte: new Date(Session.get('endDateFilter')),
        $gte: new Date(Session.get('beginDateFilter'))
      }
    }, {
      sort: {
        timestamp: -1
      }
    });
  }
});

Template.hipaaAuditLog.events({
  "keyup #hipaaSearchFilter": function (event, template) {
    Session.set("hipaaSearchFilter", $('#hipaaSearchFilter').val());
  },
  "click .userName": function(event, template) {
    var userName = $(event.currentTarget).text();
    Session.set('hipaaSearchFilter', userName);
  },
  "click .patientName": function(event, template) {
    var patientName = $(event.currentTarget).text();
    var patientNameRegex = patientName.replace(/[!@#$%^&*()+=\-[\]\\';,./{}|":<>?~_]/g, "\\$&");
    Session.set('hipaaSearchFilter', patientNameRegex);
  },
  "click .mongoRecordId": function(event, template) {
    var mongoRecordId = $(event.currentTarget).text();
    Session.set('hipaaSearchFilter', mongoRecordId);
  },
  "click .collectionName": function(event, template) {
    var collectionName = $(event.currentTarget).text();
    Session.set('hipaaSearchFilter', collectionName);
  }
});


//==================================================================================================
// HIPAA EVENT RECORD

Template.hipaaEntry.helpers({
  getHighlightColor: function () {
    var hipaaAuditLog = Session.get('HipaaAuditLogConfig');
    if (hipaaAuditLog) {
      return "color:" + hipaaAuditLog.highlightColor;
    } else {
      return null;
    }
  },
  getUserName: function () {
    if (this.userName) {
      return this.userName;
    } else {
      return "---";
    }
  },
  getPatientName: function () {
    if (this.patientName) {
      return this.patientName;
    } else {
      return "---";
    }
  },
  hasPatientInfo: function () {
    if (this.patientName) {
      return true;
    } else {
      return false;
    }
  },
  getErrorMessage: function () {
    if (this.message) {
      return this.message;
    } else {
      return "---";
    }
  },
  getCollectionName: function () {
    if (this.collectionName) {
      return this.collectionName;
    } else {
      return "---";
    }
  },
  getRecordId: function () {
    if (this.recordId) {
      return this.recordId;
    } else {
      return "---";
    }
  },
  entryTimestamp: function () {
    return moment(this.timestamp).format("YYYY, MMM DD, hh:mm A");
  },
  entryTime: function () {
    return moment(this.timestamp).format("HH:MM A");
  },
  entryDate: function () {
    return moment(this.timestamp).format("YYYY, MMM DD");
  },
  logMessageType: function (eventType) {
    if (this.eventType === eventType) {
      return true;
    } else {
      return false;
    }
  }
});
