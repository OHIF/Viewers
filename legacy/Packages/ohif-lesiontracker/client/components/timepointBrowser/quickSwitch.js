import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.timepointBrowserQuickSwitch.onCreated(() => {
    const instance = Template.instance();
    const { timepointApi } = OHIF.viewer;

    instance.selectedTimepoint = new ReactiveVar();
    instance.timepoints = new ReactiveVar([]);

    instance.updateSelectedTimepoint = studyInstanceUid => {
        const selectedTimepoint = timepointApi.study(studyInstanceUid)[0];
        instance.selectedTimepoint.set(selectedTimepoint);
    };

    const currentTimepoint = timepointApi.current();
    const filter = { latestDate: { $lte: currentTimepoint.latestDate } };
    instance.keyTimepoints = timepointApi.key(filter);

    const { viewportIndex } = instance.data;
    instance.autorun(() => {
        OHIF.viewerbase.layoutManager.observer.depend();
        const viewportData = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];
        let { studyInstanceUid } = viewportData;
        if (!studyInstanceUid) {
            Tracker.nonreactive(() => {
                const currentStudy = instance.data.currentStudy.get();
                if (currentStudy) {
                    studyInstanceUid = currentStudy.studyInstanceUid;
                }
            });
        }

        instance.updateSelectedTimepoint(studyInstanceUid);
    });

    instance.autorun(() => {
        const selectedTimepoint = instance.selectedTimepoint.get();
        const timepoints = [selectedTimepoint];
        instance.timepoints.set(timepoints);
    });
});

Template.timepointBrowserQuickSwitch.onRendered(() => {
    const instance = Template.instance();

    instance.updateActiveStudy = () => {
        const currentStudy = instance.data.currentStudy.get();
        const studyInstanceUid = (currentStudy && currentStudy.studyInstanceUid) || '';
        Tracker.afterFlush(() => {
            const $studyBrowserItems = instance.$('.study-browser-item');
            $studyBrowserItems.removeClass('active');
            $studyBrowserItems.filter(`[data-uid="${studyInstanceUid}"]`).addClass('active');
        });
    };

    instance.autorun(() => {
        const selectedTimepoint = instance.selectedTimepoint.get();
        const selectedTimepointId = (selectedTimepoint && selectedTimepoint.timepointId) || '';
        const $allBrowserItems = instance.$('.timepoint-browser-item');
        const $browserItem = $allBrowserItems.filter(`[data-id=${selectedTimepointId}]`);
        if (!$browserItem.hasClass('active')) {
            $browserItem.find('.timepoint-item').trigger('click');
        }
    });

    instance.autorun(instance.updateActiveStudy);
});

Template.timepointBrowserQuickSwitch.events({
    'ohif.measurements.timepoint.click'(event, instance) {
        const $element = $(event.currentTarget);
        $element.toggleClass('active');
        instance.updateActiveStudy();
    },

    'ohif.studies.study.click'(event, instance, studyInformation) {
        const { studyInstanceUid } = studyInformation;
        const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });
        instance.data.currentStudy.set(study);
        const $studySwitch = $(event.currentTarget).closest('.study-switch');
        $studySwitch.siblings('.series-switch').trigger('rescale');
        instance.updateSelectedTimepoint(studyInformation.studyInstanceUid);

        // Create a hover bridge to prevent quick switch from closing due to scroll height
        Meteor.defer(() => {
            const $scrollable = $studySwitch.find('.study-browser>.scrollable');
            const offsetY = $scrollable.offset().top + $scrollable.outerHeight();
            if (event.clientY > offsetY) {
                const hoverHandler = _.throttle(event => {
                    if (event.clientY <= offsetY) {
                        $scrollable.css('padding-bottom', '');
                        $scrollable.off('mousemove', hoverHandler);
                        $scrollable.off('mouseleave', hoverHandler);
                    }
                }, 100);
                $scrollable.css('padding-bottom', event.clientY - offsetY + 20);
                $scrollable.on('mousemove', hoverHandler);
                $scrollable.one('mouseleave', () => $scrollable.off('mousemove', hoverHandler));
            }
        });
    }
});

Template.timepointBrowserQuickSwitch.helpers({
    timepointBrowserData() {
        const instance = Template.instance();
        const { timepointApi } = OHIF.viewer;
        return {
            timepointApi,
            timepoints: instance.timepoints.get(),
            timepointChildTemplate: 'timepointBrowserStudies'
        };
    }
});
