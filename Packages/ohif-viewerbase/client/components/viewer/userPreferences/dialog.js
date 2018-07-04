import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.userPreferencesDialog.onCreated(() => {
    const instance = Template.instance();
    instance.activeTab = new ReactiveVar('hotkeys');
});

Template.userPreferencesDialog.events({
    'click .nav-tabs li a'(event, instance) {
        const tabId = $(event.currentTarget).attr('data-id');
        instance.activeTab.set(tabId);
    }
});

Template.userPreferencesDialog.helpers({
    tabClasses(tabId) {
        const instance = Template.instance();
        const activeTab = instance.activeTab.get();
        return tabId === activeTab ? 'active' : '';
    }
});
