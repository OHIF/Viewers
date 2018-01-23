import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.pageError.helpers({
    shallDisplayErrorStack() {
        return Meteor.isDevelopment;
    },

    getDefaultErrorMessage() {
        const instance = Template.instance();
        return instance.view.templateContentBlock ? '' : 'An error has ocurred.';
    }
});
