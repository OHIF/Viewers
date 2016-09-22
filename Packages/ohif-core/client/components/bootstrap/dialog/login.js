import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Template.dialogLogin.onCreated(() => {
    const instance = Template.instance();

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
