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
    const viewportData = instance.getViewportData(viewportIndex);
    if (!viewportData) {
        return;
    }

    // Finds the current study and return it
    const study = ViewerStudies.findOne({
        studyInstanceUid: viewportData.studyInstanceUid
    });

    // Change the current study to update the thumbnails
    instance.data.currentStudy.set(study);
});

Template.studySeriesQuickSwitch.events({
    'mouseenter .js-quick-switch, mouseenter .js-quick-switch .switchSectionSeries'(event, instance) {
        instance.$('.quickSwitchWrapper').addClass('overlay');
        $(event.currentTarget).addClass('hover');
    },
    'mouseleave .js-quick-switch'(event, instance) {
        instance.$('.js-quick-switch, .switchSectionSeries').removeClass('hover');
        instance.$('.quickSwitchWrapper').removeClass('overlay');
    }
});

Template.studySeriesQuickSwitch.helpers({
    // Get the current study
    currentStudy() {
        return Template.instance().data.currentStudy.get();
    }
});
