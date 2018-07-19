import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

Template.userLogin.onCreated(() => {
    const instance = Template.instance();

    instance.api = {
        login() {
            // Check if the form has valid data
            const form = instance.$('form').data('component');
            if (!form.validate()) {
                return;
            }

            // Get the form data
            const formData = form.value();

            // Handle errors and display the error message on the respective field
            const errorHandler = error => {
                const reason = (error && error.reason) || 'An error has ocurred';
                const isPassword = reason && reason.toLowerCase().indexOf('password') > -1;
                const displayComponent = form.item(isPassword ? 'password' : 'username');
                displayComponent.error(reason);
                Meteor.defer(() => displayComponent.$element.focus());
            };

            // Call the login method
            return OHIF.user.login(formData).catch(errorHandler);
        }
    };

    instance.schema = OHIF.user.schema;
});

Template.userLogin.helpers({
    additionalLoginButtons() {
        return OHIF.user.additionalLoginButtons || [];
    }
})
