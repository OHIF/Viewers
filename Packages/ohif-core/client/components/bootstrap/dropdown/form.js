import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

Template.dropdownForm.onRendered(() => {
    const instance = Template.instance();
    const dropdown = instance.$('.dropdown');

    // Show the dropdown
    dropdown.addClass('open');
    dropdown.find('ul.dropdown-menu li a').addClass('noselect');

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
        let target = $(event.target);
        if (target.hasClass('disabled')) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            instance.destroyView();
        }
    }
});
