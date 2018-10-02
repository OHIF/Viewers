import { Meteor } from 'meteor/meteor';

Template.dicomStorePicker.onCreated(() => {});

Template.dicomStorePicker.events({
  'click #selectDicomStore': function () {
    const result = {
      "wadoUriRoot": "https://healthcare.googleapis.com/v1alpha/projects/healthcare-api-215503/locations/us-central1/datasets/mydataset/dicomStores/mydicomstore/dicomWeb",
      "qidoRoot": "https://healthcare.googleapis.com/v1alpha/projects/healthcare-api-215503/locations/us-central1/datasets/mydataset/dicomStores/mydicomstore/dicomWeb",
      "wadoRoot": "https://healthcare.googleapis.com/v1alpha/projects/healthcare-api-215503/locations/us-central1/datasets/mydataset/dicomStores/mydicomstore/dicomWeb",
    };
    // Hide the modal, removing the backdrop
    Template.instance().$('.modal').on('hidden.bs.modal', event => {
        instance.data.promiseResolve(value);
    }).modal('hide');
  }
});