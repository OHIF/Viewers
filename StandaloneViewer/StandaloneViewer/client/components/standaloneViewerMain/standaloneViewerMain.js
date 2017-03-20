import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

Meteor.startup(() => {
    window.ResizeViewportManager = window.ResizeViewportManager || new OHIF.viewerbase.ResizeViewportManager();
});

Template.standaloneViewerMain.onCreated(() => {
    // Attach the Window resize listener
    window.addEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);

    OHIF.viewer.metadataProvider = OHIF.cornerstone.metadataProvider;
    // Metadata configuration
    const metadataProvider = OHIF.viewer.metadataProvider;
    cornerstoneTools.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));
});

Template.standaloneViewerMain.onRendered(() => {
    const instance = Template.instance();

    const studies = instance.data.studies;
    const parentElement = instance.$('#layoutManagerTarget').get(0);
    OHIF.viewerbase.layoutManager = new OHIF.viewerbase.LayoutManager(parentElement, studies);
    OHIF.viewerbase.layoutManager.updateViewports();

    // Enable hotkeys
    OHIF.viewerbase.hotkeyUtils.enableHotkeys();
});

Template.standaloneViewerMain.onDestroyed(() => {

    // Remove the Window resize listener
    window.removeEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete OHIF.viewerbase.layoutManager;
});
