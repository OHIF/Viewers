import { Meteor } from 'meteor/meteor';

const DATASET_PICKER_ID = 'gcp-dataset-picker';
const EVENT_NAME = 'onSelect';

Template.dicomStorePicker.onRendered(() => {
  const instance = Template.instance();
  instance.$('#' + DATASET_PICKER_ID).on(EVENT_NAME, (event, data) => {
    instance
      .$('.modal')
      .one('hidden.bs.modal', event => {
        instance.data.promiseResolve(data);
      })
      .modal('hide');
  });
});

Template.dicomStorePicker.helpers({
  datasetPickerId() {
    return DATASET_PICKER_ID;
  },
  eventName() {
    return EVENT_NAME;
  },
  oidcStorageKey() {
    return OHIF.user.getOidcStorageKey();
  },
});
