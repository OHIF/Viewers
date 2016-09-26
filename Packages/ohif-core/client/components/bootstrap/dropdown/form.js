import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';

Template.dropdownForm.onRendered(() => {
    const instance = Template.instance();

    // Show the dropdown
    instance.$('.dropdown').addClass('open');

    // Destroy the Blaze created view (either created with template calls or with renderWithData)
    instance.destroyView = () => {
        if (_.isFunction(instance.data.destroyView)) {
            instance.data.destroyView();
        } else {
            Blaze.remove(instance.view);
        }
    };
});

Template.dropdownForm.events({
    'click .dropdown'(event, instance) {
        instance.destroyView();
    }
});
