import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

Template.studySeriesQuickSwitch.onCreated(() => {
    const instance = Template.instance();

    // Defines the study being shown in the current viewport
    instance.data.currentStudy = new ReactiveVar();

    // Gets the viewport data for the given viewport index
    instance.getViewportData = viewportIndex => {
        const layoutManager = window.layoutManager;
        return layoutManager && layoutManager.viewportData && layoutManager.viewportData[viewportIndex];
    };

    // Gets the current viewport data
    const viewportIndex = instance.data.viewportIndex;

    instance.study = {};
    instance.lastStudy = {};

    instance.autorun(() => {
        Session.get('LayoutManagerUpdated');

        const viewportData = instance.getViewportData(viewportIndex);

        if (viewportData) {
            // Finds the current study and return it
            instance.study = ViewerStudies.findOne({
                studyInstanceUid: viewportData.studyInstanceUid
            });
        } else {
            instance.study = ViewerStudies.findOne();
        }

        if (!instance.study) {
            return;
        }

        if (instance.study.studyInstanceUid !== instance.lastStudy.studyInstanceUid) {
            // Change the current study to update the thumbnails
            instance.data.currentStudy.set(instance.study);

            instance.lastStudy = instance.study;
        }
    });
});

Template.studySeriesQuickSwitch.events({
    'mouseenter .js-quick-switch, mouseenter .js-quick-switch .switchSectionSeries'(event, instance) {
        instance.$('.quickSwitchWrapper').addClass('overlay');
        $(event.currentTarget).addClass('hover');
    },
    'mouseleave .js-quick-switch'(event, instance) {
        instance.$('.js-quick-switch, .switchSectionSeries').removeClass('hover');
        instance.$('.quickSwitchWrapper').removeClass('overlay');
    },
    'click .studyTimepointStudy'(event, instance) {
        instance.$('.switchSectionSeries').addClass('hover');
    }
});

Template.studySeriesQuickSwitch.helpers({
    // Get the current study
    currentStudy() {
        return Template.instance().data.currentStudy.get();
    },
    // Check if is Mac OS
    // This is necessary due to fix scrollbar space only in browsers in Mac OS:
    // Since Lion version, the scrollbar is visible only when user scrolls a div
    // As scrollbar is hidden, the space added to hide it in Windows browsers
    // is not enough in Mac OS. For WebKit (Safari and Chrome in Mac OS) there is a CSS
    // solution using ::-webkit-scrollbar, but unfortunately doesn't work for Firefox
    // JS seems to be the only solution for now:
    // - http://stackoverflow.com/questions/6165472/custom-css-scrollbar-for-firefox/6165489#6165489
    // - http://stackoverflow.com/questions/18317634/force-visible-scrollbar-in-firefox-on-mac-os-x/18318273
    addMacOSClass() {
        return window.navigator.appVersion.indexOf('Mac') !== -1 ? 'is-mac' : '';
    }
});
