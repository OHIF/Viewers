import { Template } from 'meteor/templating';

Template.dialogLoading.onRendered(() => {
    const instance = Template.instance();

    const $modal = instance.$('.modal');

    // Create the bootstrap modal
    $modal.modal({
        backdrop: 'static',
        keyboard: false,
        show: true
    });
});
