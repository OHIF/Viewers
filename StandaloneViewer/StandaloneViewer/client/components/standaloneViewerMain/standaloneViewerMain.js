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
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.updateImageSynchronizer);

    OHIF.viewer.metadataProvider = new OHIF.cornerstone.MetadataProvider();
    // Metadata configuration
    const metadataProvider = OHIF.viewer.metadataProvider;
    cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));

    // Set the current context
    OHIF.context.set('viewer');
});

Template.standaloneViewerMain.onRendered(() => {
    const instance = Template.instance();

    const studies = instance.data.studies;
    const parentElement = instance.$('#layoutManagerTarget').get(0);
    const studyPrefetcher = OHIF.viewerbase.StudyPrefetcher.getInstance();
    instance.studyPrefetcher = studyPrefetcher;

    instance.studyLoadingListener = OHIF.viewerbase.StudyLoadingListener.getInstance();
    instance.studyLoadingListener.clear();
    instance.studyLoadingListener.addStudies(studies);

    OHIF.viewerbase.layoutManager = new OHIF.viewerbase.LayoutManager(parentElement, studies);
    OHIF.viewerbase.layoutManager.updateViewports();

    studyPrefetcher.setStudies(studies);

    // Enable hotkeys
    OHIF.viewerbase.hotkeyUtils.enableHotkeys();
});

Template.standaloneViewerMain.onDestroyed(() => {
    // Remove the Window resize listener
    window.removeEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete OHIF.viewerbase.layoutManager;

    // Stop prefetching when we close the viewer
    instance.studyPrefetcher.destroy();

    // Destroy stack loading listeners when we close the viewer
    instance.studyLoadingListener.clear();

    // Clear references to all stacks in the StackManager
    OHIF.viewerbase.stackManager.clearStacks();

    // Reset the current context
    OHIF.context.set(null);
});
