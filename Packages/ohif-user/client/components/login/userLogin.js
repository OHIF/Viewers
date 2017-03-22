import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

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
            console.warn('>>>>Logged in!', formData);
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
