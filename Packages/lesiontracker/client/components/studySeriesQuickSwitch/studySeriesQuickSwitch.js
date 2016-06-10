Template.studySeriesQuickSwitch.onCreated(function studySeriesQuickSwitchOnCreated() {
    const instance = this;

    var viewportIndex = instance.data.viewportIndex;

    instance.seriesOpen = new ReactiveVar(false);
    instance.studiesOpen = new ReactiveVar(false);

    instance.data.timepointViewType = new ReactiveVar();
    instance.data.timepointViewType.set('key');
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
    },

    currentStudy() {
        console.log('currentStudy');
        var viewportIndex = Template.instance().data.viewportIndex;
        Session.get('CornerstoneNewImage' + viewportIndex);

        layoutManager = window.layoutManager;
        if (!layoutManager) {
            return;
        }

        var studyInstanceUid = layoutManager.viewportData[viewportIndex].studyInstanceUid;
        var study = ViewerStudies.findOne({
            studyInstanceUid: studyInstanceUid
        });

        return study;
    },

    currentTimepoint() {
        console.log('currentStudy');
        var viewportIndex = Template.instance().data.viewportIndex;
        Session.get('CornerstoneNewImage' + viewportIndex);

        layoutManager = window.layoutManager;
        if (!layoutManager) {
            return;
        }

        var studyInstanceUid = layoutManager.viewportData[viewportIndex].studyInstanceUid;
        var study = ViewerStudies.findOne({
            studyInstanceUid: studyInstanceUid
        });

        var timepoint = Timepoint.findOne({
            timepointId: study.timepointId
        });

        return timepoint;
    },

    thumbnails: function(study) {
        var stacks = createStacks(study);

        var array = [];
        stacks.forEach(function(stack, index) {
            array.push({
                thumbnailIndex: index,
                stack: stack
            });
        });
        return array;
    }
});
