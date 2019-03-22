import { Meteor } from 'meteor/meteor';

const DICOM_FILE_UPLOADER_ID = 'gcp-dicom-uploader';
const EVENT_NAME = 'onClose';

Template.uploadStudiesDialog.onRendered(() => {
  const instance = Template.instance();
  instance.$('#' + DICOM_FILE_UPLOADER_ID).on(EVENT_NAME, (event, data) => {
    instance
      .$('.modal')
      .one('hidden.bs.modal', event => {
        instance.data.promiseResolve(data);
      })
      .modal('hide');
  });
});

Template.uploadStudiesDialog.helpers({
  dicomFilesUploaderId() {
    return DICOM_FILE_UPLOADER_ID;
  },
  eventName() {
    return EVENT_NAME;
  },
  oidcStorageKey() {
    return OHIF.user.getOidcStorageKey();
  },
  url() {
    return OHIF.gcloud.getConfig().qidoRoot; // FIXME: not QIDO
  }
});
