import { Template } from 'meteor/templating';

Template.viewerSection.events({
    'transitionend .sidebarMenu'(event) {
        if (!event.target.classList.contains('sidebarMenu')) {
            return;
        }

        window.ResizeViewportManager.handleResize();
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
            studyChildTemplate: 'studyBrowserSeries',

            studyClickCallback(studyInformation, element) {
                const $element = $(element);
                $element.siblings().removeClass('active');
                $element.toggleClass('active');
            }
        };
    }
});
