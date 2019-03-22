import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.gcloudDialog.onRendered(() => {
  const instance = Template.instance();

  // Allow options ovewrite
  const modalOptions = _.extend(
    {
      backdrop: 'static',
      keyboard: false,
      width: 650,
    },
    instance.data.modalOptions
  );

  const $modal = instance.$('.modal');

  // Create the bootstrap modal
  $modal.modal(modalOptions);
});
