Template.studySeriesQuickSwitch.onCreated(function studySeriesQuickSwitchOnCreated() {
    const instance = this;

    var viewportIndex = instance.data.viewportIndex;

    instance.data.timepointViewType = new ReactiveVar();
    instance.data.timepointViewType.set('key');
});

Template.studySeriesQuickSwitch.helpers({
    seriesOpen() {
        return Template.instance().seriesOpen.get();
    },

    currentStudy() {
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
