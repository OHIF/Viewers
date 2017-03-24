import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Router } from 'meteor/iron:router';
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

            // Handle success and redirect the user
            const successHandler = () => {
                const currentRoute = Router.current();
                const redirect = currentRoute.params.query.redirect;
                const path = redirect ? decodeURI(redirect) : '/';
                return Router.go(path);
            };

            // Call the login method
            const promise = OHIF.user.login(formData).then(successHandler).catch(errorHandler);

            // Display loading state
            OHIF.ui.showDialog('dialogLoading', {
                text: 'Signing in...',
                promise
            });
        }
    };

    instance.schema = new SimpleSchema({
        username: {
            type: String,
            label: 'Username'
        },
        password: {
            type: String,
            label: 'Password'
        }
    });
});
