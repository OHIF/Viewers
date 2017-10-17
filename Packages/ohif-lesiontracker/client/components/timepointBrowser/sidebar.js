import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.timepointBrowserSidebar.onCreated(() => {
    const instance = Template.instance();

    // Reactive variable to control the view type for all or key timepoints
    instance.timepointViewType = new ReactiveVar(instance.data.timepointViewType);
});

Template.timepointBrowserSidebar.onRendered(() => {
    const instance = Template.instance();

    // Collapse all timepoints but first when timepoint view type changes
    instance.autorun(() => {
        // Runs this computation every time the timepointViewType is changed
        const type = instance.timepointViewType.get();

        // Removes all active classes to collapse the timepoints and studies
        instance.$('.timepoint-browser-item, .study-browser-item').removeClass('active');
        if (type === 'key') {
            // Show only first timepoint expanded for key timepoints
            instance.$('.timepoint-browser-item:first .timepoint-item').trigger('click');
        }
    });
});

Template.timepointBrowserSidebar.events({
    'ohif.studies.study.click'(event, instance) {
        const $element = $(event.currentTarget);

        // Defer the active class toggling to wait for child template rendering
        Meteor.defer(() => {
            // Remove max height restriction from studies browser
            const $studiesBrowser = $element.closest('.timepoint-browser-studies');
            $studiesBrowser.css('max-height', '');

            // Remove active class from sibling studies
            $element.siblings().removeClass('active');

            // Toggle the active class on clicked study
            $element.toggleClass('active');

            // Adjust the max height for studiesBrowser when series transition is finished
            const $seriesBrowser = $element.find('.study-browser-series');
            $seriesBrowser.one('transitionend', () => $studiesBrowser.adjustMax('height'));
        });
    },

    'ohif.lesiontracker.timepoint.click'(event, instance) {
        const $element = $(event.currentTarget);

        // Defer the active class toggling to wait for child template rendering
        Meteor.defer(() => $element.toggleClass('active'));
    }
});

Template.timepointBrowserSidebar.helpers({
    viewTypeButtonGroupData() {
        return {
            value: Template.instance().timepointViewType,
            options: [{
                value: 'key',
                text: 'Key Timepoints'
            }, {
                value: 'all',
                text: 'All Timepoints'
            }]
        };
    },

    timepointBrowserData() {
        const instance = Template.instance();
        const { timepointApi } = instance.data;

        const currentTimepoint = timepointApi.current();
        const { patientId } = currentTimepoint;
        let timepoints = [];
        if (instance.timepointViewType.get() === 'key') {
            timepoints = timepointApi.key();
        } else {
            timepoints = timepointApi.all({ patientId });
        }

        return {
            timepointApi,
            timepoints,
            timepointChildTemplate: 'timepointBrowserStudies',
            studyChildTemplate: 'studyBrowserSeries'
        };
    }
});
