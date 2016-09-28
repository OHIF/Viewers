import { OHIF } from 'meteor/ohif:core';

Template.standaloneViewerMain.onCreated(() => {
    // Attach the Window resize listener

    // TODO: Check why this seems to need to be in a defer clause
    // here, but not in the other viewers...
    Meteor.defer(() => {
        $(window).on('resize', handleResize);
    });

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);
});

Template.standaloneViewerMain.onRendered(() => {
    const instance = Template.instance();

    const studies = instance.data.studies;
    const parentElement = instance.$('#layoutManagerTarget').get(0);
    window.layoutManager = new LayoutManager(parentElement, studies);
    window.layoutManager.updateViewports();
    
    // Enable hotkeys
    enableHotkeys();
});

Template.standaloneViewerMain.onDestroyed(() => {    
    // Remove the Window resize listener
    $(window).off('resize', handleResize);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete window.layoutManager;
});
