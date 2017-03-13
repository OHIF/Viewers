import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.header.onCreated(() => {
    const instance = Template.instance();

    instance.dropdownOpen = new ReactiveVar(false);
    instance.dropdownItems = [];
    instance.autorun(() => {
        OHIF.header.dropdownObserver.depend();
        instance.dropdownItems = OHIF.header.getDropdownItems();
    });
});

Template.header.events({
    'mousedown .header-menu'(event, instance) {
        if (instance.dropdownOpen.get()) {
            event.preventDefault();
            return $(event.currentTarget).focus();
        }
    },

    'click .header-menu'(event, instance) {
        event.preventDefault();
        if (instance.dropdownOpen.get()) return;
        instance.dropdownOpen.set(true);
        const closeHandler = () => Meteor.setTimeout(() => instance.dropdownOpen.set(false), 200);
        OHIF.ui.showDropdown(instance.dropdownItems, {
            parentElement: event.currentTarget,
            menuClasses: 'dropdown-menu-right',
            marginTop: '25px'
        }).then(closeHandler).catch(closeHandler);
    }
});
