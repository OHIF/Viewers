Template.studySeriesQuickSwitch.onCreated(function studySeriesQuickSwitchOnCreated() {
    const instance = this;

    instance.seriesOpen = new ReactiveVar(false);
    instance.studiesOpen = new ReactiveVar(false);
});

Template.studySeriesQuickSwitch.events({
    'mouseenter .js-show-series'(event, instance) {
        instance.seriesOpen.set(true);
    },

    'mouseenter .js-show-studies'(event, instance) {
        instance.studiesOpen.set(true);
    },

    'mouseleave .js-hide-series'(event, instance) {
        instance.seriesOpen.set(false);
    },

    'mouseleave .js-hide-studies'(event, instance) {
        instance.studiesOpen.set(false);
    }
});

Template.studySeriesQuickSwitch.helpers({
    seriesOpen() {
        return Template.instance().seriesOpen.get();
    },

    studiesOpen() {
        return Template.instance().studiesOpen.get();
    }
});