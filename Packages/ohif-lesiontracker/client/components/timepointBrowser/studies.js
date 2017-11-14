import { Template } from 'meteor/templating';

Template.timepointBrowserStudies.onRendered(() => {
    Template.instance().$('.timepoint-browser-studies').adjustMax('height');
});
