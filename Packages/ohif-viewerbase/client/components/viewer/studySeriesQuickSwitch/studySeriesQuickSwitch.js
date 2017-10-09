import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';

Template.studySeriesQuickSwitch.onCreated(() => {
    const instance = Template.instance();

    // Defines the study being shown in the current viewport
    instance.data.currentStudy = new ReactiveVar();

    // Gets the viewport data for the given viewport index
    instance.getViewportData = viewportIndex => {
        const layoutManager = OHIF.viewerbase.layoutManager;
        return layoutManager && layoutManager.viewportData && layoutManager.viewportData[viewportIndex];
    };

    // Gets the current viewport data
    const viewportIndex = instance.data.viewportIndex;

    instance.study = {};
    instance.lastStudy = {};

    instance.autorun(() => {
        Session.get('LayoutManagerUpdated');

        const viewportData = instance.getViewportData(viewportIndex);

        // @TypeSafeStudies
        if (viewportData) {
            // Finds the current study and return it
            instance.study = OHIF.viewer.Studies.findBy({
                studyInstanceUid: viewportData.studyInstanceUid
            });
        } else {
            instance.study = OHIF.viewer.Studies.getElementByIndex(0);
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

const checkScrollArea = element => {
    const { scrollHeight, offsetHeight, scrollTop } = element;

    const matrix = $(element).find('.thumbnailsWrapper').css('transform');

    let translateY = 0;

    if(matrix && matrix !== 'none') {
        translateY = parseInt(matrix.match(/-?[\d\.]+/g)[5]);
    }

    if(scrollHeight > offsetHeight + scrollTop + translateY) {
        element.classList.add('show-scroll-indicator-down');
    }
    else {
        element.classList.remove('show-scroll-indicator-down');
    }

    if(scrollTop > 0) {
        element.classList.add('show-scroll-indicator-up');
    }
    else {
        element.classList.remove('show-scroll-indicator-up');
    }
};

Template.studySeriesQuickSwitch.events({
    'mouseenter .js-quick-switch, mouseenter .js-quick-switch .switchSectionSeries'(event, instance) {
        instance.$('.quickSwitchWrapper').addClass('overlay');
        $(event.currentTarget).addClass('hover');
        instance.$('.scrollArea').each((index, scrollAreaElement) => checkScrollArea(scrollAreaElement));
    },
    'mouseleave .js-quick-switch'(event, instance) {
        instance.$('.js-quick-switch, .switchSectionSeries').removeClass('hover');
        instance.$('.quickSwitchWrapper').removeClass('overlay');
    },
    'click .thumbnailEntry'(event, instance) {
        // Close the quick switch if we have selected a series
        instance.$('.js-quick-switch, .switchSectionSeries').removeClass('hover');
        instance.$('.quickSwitchWrapper').removeClass('overlay');
    },
    'click .study-browser-item'(event, instance) {
        instance.$('.switchSectionSeries').addClass('hover');
    },
    'scroll .scrollArea'(event) {
        checkScrollArea(event.currentTarget);
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
    isMac() {
        return window.navigator.appVersion.indexOf('Mac');
    }
});
