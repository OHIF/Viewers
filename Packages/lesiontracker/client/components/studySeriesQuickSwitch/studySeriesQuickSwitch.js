Template.studySeriesQuickSwitch.onCreated(() => {
    const instance = Template.instance();

    // Defines the study being shown in the current viewport
    instance.data.currentStudy = new ReactiveVar();

    // Shows only the key timepoints
    instance.data.timepointViewType = new ReactiveVar('key');

    // Gets the viewport data for the given viewport index
    instance.getViewportData = viewportIndex => {
        const layoutManager = window.layoutManager;
        return layoutManager && layoutManager.viewportData && layoutManager.viewportData[viewportIndex];
    };

    // Get the current study being shown in the current viewport
    instance.getCurrentStudy = () => {
        const viewportIndex = instance.data.viewportIndex;

        // Runs this computation everytime the current viewport is changed
        Session.get('CornerstoneNewImage' + viewportIndex);

        // Gets the current viewport data
        const viewportData = instance.getViewportData(viewportIndex);
        if (!viewportData) {
            return;
        }

        // Fins the current study and return it
        return ViewerStudies.findOne({
            studyInstanceUid: viewportData.studyInstanceUid
        });
    };
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
    // Get the current study and change the reactive variable
    currentStudy() {
        const instance = Template.instance();
        const currentStudy = instance.getCurrentStudy();
        instance.data.currentStudy.set(currentStudy);
        return currentStudy;
    }
});
