import { Template } from 'meteor/templating';

Template.registerHelper('getSchema', function(context) {
    const instance = Template.instance();
    if (!instance.currentSchema) {
        return;
    }

    if (!context) {
        return;
    }

    return instance.currentSchema.schema(context);
});