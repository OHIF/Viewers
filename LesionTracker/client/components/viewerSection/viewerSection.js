import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.viewerSection.onCreated(() => {
    const instance = Template.instance();

    instance.isTimepointBrowser = () => !!OHIF.viewer.data.currentTimepointId;

    OHIF.viewer.quickSwitchStudyBrowserTemplate = 'timepointBrowserQuickSwitch';
    if (!instance.isTimepointBrowser()) {
        OHIF.viewer.quickSwitchStudyBrowserTemplate = 'studyBrowserQuickSwitch';
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
    },

    'ohif.measurements.timepoint.changeViewType .timepoint-browser-list'(event, instance, viewType) {
        const $browserList = $(event.currentTarget);
        const $allBrowserItems = $browserList.find('.timepoint-browser-item');

        // Removes all active classes to collapse the timepoints and studies
        $allBrowserItems.removeClass('active');

        if (viewType === 'key') {
            const { timepointIds, currentTimepointId } = OHIF.viewer.data;
            timepointIds.forEach(timepointId => {
                const $browserItem = $allBrowserItems.filter(`[data-id=${timepointId}]`);
                $browserItem.find('.timepoint-item').trigger('ohif.measurements.timepoint.load');
            });

            // Show only current timepoint expanded on key timepoints tab
            const $browserItem = $allBrowserItems.filter(`[data-id=${currentTimepointId}]`);
            $browserItem.find('.timepoint-item').trigger('click');
        }
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
