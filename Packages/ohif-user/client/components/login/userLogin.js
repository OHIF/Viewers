import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Router } from 'meteor/iron:router';

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

            // Call the Meteor's login method
            Meteor.loginWithPassword(formData.username, formData.password, error => {
                if (!error) {
                    const currentRoute = Router.current();
                    const redirect = currentRoute.params.query.redirect;
                    const path = redirect ? decodeURI(redirect) : '/';
                    return Router.go(path);
                }

                const { reason } = error;
                const isPassword = reason && reason.toLowerCase().indexOf('password') > -1;
                const displayComponent = form.item(isPassword ? 'password' : 'username');
                displayComponent.error(reason);
                displayComponent.$element.focus();
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
