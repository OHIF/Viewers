import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.viewerSection.events({
    'transitionend .sidebarMenu'(event) {
        if (!event.target.classList.contains('sidebarMenu')) {
            return;
        }

        window.ResizeViewportManager.handleResize();
    },

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

Template.viewerSection.helpers({
    leftSidebarOpen() {
        return Template.instance().data.state.get('leftSidebar');
    },

    rightSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar');
    },

    timepointBrowserData() {
        const instance = Template.instance();
        const { timepointApi } = instance.data;
        const timepoints = timepointApi.all();
        return {
            timepointApi,
            timepoints,
            timepointChildTemplate: 'timepointBrowserStudies',
            studyChildTemplate: 'studyBrowserSeries'
        };
    }
});
