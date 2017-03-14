import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.header.onCreated(() => {
    const instance = Template.instance();

    instance.dropdownItems = [];
    instance.autorun(() => {
        OHIF.header.dropdown.observer.depend();
        instance.dropdownItems = OHIF.header.dropdown.getItems();
    });
});

Template.header.events({
    'click .header-menu'(event, instance) {
        event.preventDefault();

        // Prevent dropdown from being opened if there's one already opened
        if ($(event.currentTarget).find('.dropdown').length) return;

        // Show the dropdown
        OHIF.ui.showDropdown(instance.dropdownItems, {
            parentElement: event.currentTarget,
            menuClasses: 'dropdown-menu-right',
            marginTop: '25px'
        });
    }
});
