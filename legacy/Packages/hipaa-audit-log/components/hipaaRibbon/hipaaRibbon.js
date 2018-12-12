Template.hipaaRibbon.events({
  'keyup #hipaaSearchFilter': function () {
    Session.set("hipaaSearchFilter", $('#hipaaSearchFilter').val());
  },
  "change #beginDateInput": function (event, template) {
    Session.set("beginDateFilter", $('#beginDateInput').val() + "T00:00:00.000Z");
  },
  "change #endDateInput": function (event, template) {
    Session.set("endDateFilter", $('#endDateInput').val() + "T00:00:00.000Z");
  },
  'change #actionFilter': function(e) {
      var actionType = e.currentTarget.value;
    Session.set("hipaaTypeFilter", actionType);
  },
  'click #filterCreatedButton': function () {
    Session.set("hipaaTypeFilter", 'create');
  },
  'click #filterModifiedButton': function () {
    Session.set("hipaaTypeFilter", 'modify');
  },
  'click #filterViewedButton': function () {
    Session.set("hipaaTypeFilter", 'viewed');
  },
  'click #filterAllButton': function () {
    Session.set("hipaaTypeFilter", '');
  },
  'click #searchClear': function() {
    Session.set("hipaaSearchFilter", '');
  }
});

var ribbonBreakPoint = 760;


Meteor.startup(function(){
  $(window).resize(function(evt) {
    Session.set("ribbonWidth", $('#hipaaRibbon').width());
  });
});

Template.hipaaRibbon.helpers({
  getRibbonClass: function () {
    var hipaaAuditLog = Session.get('HipaaAuditLogConfig');
    if (hipaaAuditLog && hipaaAuditLog.classes) {
      return hipaaAuditLog.classes.ribbon;
    } else {
      return null;
    }
  },
  getSelectClass: function () {
    var hipaaAuditLog = Session.get('HipaaAuditLogConfig');
    if (hipaaAuditLog && hipaaAuditLog.classes) {
      return hipaaAuditLog.classes.select;
    } else {
      return null;
    }
  },
  getInputClass: function () {
    var hipaaAuditLog = Session.get('HipaaAuditLogConfig');
    if (hipaaAuditLog && hipaaAuditLog.classes) {
      return hipaaAuditLog.classes.input;
    } else {
      return null;
    }
  },
  getHipaaSearchFilter: function () {
    return Session.get('hipaaSearchFilter');
  },
  getBeginDate: function () {
    return moment(Session.get("beginDateFilter")).format("YYYY-MM-DD");
  },
  getEndDate: function () {
    return moment(Session.get("endDateFilter")).format("YYYY-MM-DD");
  }
});