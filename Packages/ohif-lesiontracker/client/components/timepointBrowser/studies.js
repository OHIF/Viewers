import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.timepointBrowserStudies.onRendered(() => {
    const instance = Template.instance();
    const $container = instance.$('.timepoint-browser-studies');
    instance.adjustMaxHeight = () => $container.adjustMax('height');
    instance.adjustMaxHeight();
});

Template.timepointBrowserStudies.events({
    'ohif.studies.study.click'(event, instance) {
        // FIXME disable all transitions during $.tempShow
        Meteor.setTimeout(instance.adjustMaxHeight, 300);
    }
});
