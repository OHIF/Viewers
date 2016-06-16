Template.studySeriesQuickSwitch.onCreated(() => {
    const instance = Template.instance();

    instance.data.timepointViewType = new ReactiveVar();
    instance.data.timepointViewType.set('key');

    instance.getViewportData = viewportIndex => {
        return layoutManager && layoutManager.viewportData && layoutManager.viewportData[viewportIndex];
    };

    instance.getCurrentStudy = () => {
        const viewportIndex = instance.data.viewportIndex;
        Session.get('CornerstoneNewImage' + viewportIndex);

        layoutManager = window.layoutManager;
        if (!layoutManager) {
            return;
        }

        const viewportData = instance.getViewportData(viewportIndex);
        if (!viewportData) {
            return;
        }

        const study = ViewerStudies.findOne({
            studyInstanceUid: viewportData.studyInstanceUid
        });

        return study;
    };
});

Template.studySeriesQuickSwitch.helpers({
    seriesOpen() {
        return Template.instance().seriesOpen.get();
    },

    currentStudy() {
        return Template.instance().getCurrentStudy;
    },

    currentTimepoint() {
        const instance = Template.instance();

        const study = instance.getCurrentStudy();

        const timepoint = Timepoint.findOne({
            timepointId: study.timepointId
        });
        console.warn('>>>>TIMEPOINT', timepoint);

        return timepoint;
    },

    thumbnails: function(study) {
        const stacks = createStacks(study);

        const array = [];
        stacks.forEach(function(stack, index) {
            array.push({
                thumbnailIndex: index,
                stack: stack
            });
        });
        return array;
    }
});
