import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

Template.viewerSection.onCreated(() => {
    const instance = Template.instance();

    instance.isTimepointBrowser = () => !!OHIF.viewer.data.currentTimepointId;

    if (!instance.isTimepointBrowser()) {
        instance.loading = new ReactiveVar(true);
        instance.studiesInformation = new ReactiveVar([]);
        const filter = { studyInstanceUid: OHIF.viewer.data.studyInstanceUids };
        OHIF.studies.searchStudies(filter).then(studiesData => {
            instance.loading.set(false);
            instance.studiesInformation.set(studiesData);
        }).catch(error => {
            instance.loading.set(false);
            const text = 'An error has occurred while retrieving studies information';
            OHIF.ui.notifications.danger({ text });
            OHIF.log.error(error);
        });
    }
});

Template.viewerSection.events({
    'transitionend .sidebarMenu'(event) {
        if (!event.target.classList.contains('sidebarMenu')) return;

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

    isTimepointBrowser() {
        return Template.instance().isTimepointBrowser();
    },

    studiesInformation() {
        return Template.instance().studiesInformation.get();
    }
});
