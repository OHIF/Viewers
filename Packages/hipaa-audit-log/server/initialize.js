Meteor.methods({
  initializeDemoLog:function (){
      console.log('initializeDemoLog');

      // hipaaEvent, userId, userName, collectionName, recordId, patientId, patientName, message
      HipaaLogger.logEvent("init", Meteor.userId(), "Ada Lovelace");

      HipaaLogger.logEvent("create", Meteor.userId(), "Ada Lovelace", "Users", Random.id(), Random.id(), "John Doe");

      HipaaLogger.logEvent("viewed", Meteor.userId(), "Mary Shelley", "Users", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("create", Meteor.userId(), "Florence Nightingale", "Vitals", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("viewed", Meteor.userId(), "Florence Nightingale", "Medications", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("create", Meteor.userId(), "Florence Nightingale", "Medications", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("denied", Meteor.userId(), "Kurt Vonnegut", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("create", Meteor.userId(), "Florence Nightingale", "Vitals", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("viewed", Meteor.userId(), "Florence Nightingale", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("modify", Meteor.userId(), "Florence Nightingale", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("viewed", Meteor.userId(), "Edward Doisy", "Users", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("clone", Meteor.userId(), "Edward Doisy", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("publish", Meteor.userId(), "Edward Doisy", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("unpublish", Meteor.userId(), "Edward Doisy", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("delete", Meteor.userId(), "Ada Lovelace", "MedicationPlans", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("viewed", Meteor.userId(), "Florence Nightingale", "Vitals", Random.id(), Random.id(), "John Doe");
      HipaaLogger.logEvent("create", Meteor.userId(), "Florence Nightingale", "Vitals", Random.id(), Random.id(), "John Doe");
  }
});
