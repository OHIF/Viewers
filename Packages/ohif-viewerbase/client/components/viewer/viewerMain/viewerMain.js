import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { OHIF } from 'meteor/ohif:core';
// Local Modules
import { unloadHandlers } from '../../../lib/unloadHandlers';
import { hotkeyUtils } from '../../../lib/hotkeyUtils';
import { ResizeViewportManager } from '../../../lib/classes/ResizeViewportManager';
import { LayoutManager } from '../../../lib/classes/LayoutManager';
import { StudyPrefetcher } from '../../../lib/classes/StudyPrefetcher';

Meteor.startup(() => {
    window.ResizeViewportManager = window.ResizeViewportManager || new ResizeViewportManager();

    // Set initial value for OHIFViewerMainRendered
    // session variable. This can used in viewer main template
    Session.set('OHIFViewerMainRendered', false);
});

Template.viewerMain.onCreated(() => {
    // Attach the Window resize listener
    // Don't use jQuery here. "window.onresize" will always be null
    // If its necessary, check all the code for window.onresize getter
    // and change it to jQuery._data(window, 'events')['resize'].
    // Otherwise this function will be probably overrided.
    // See cineDialog instance.setResizeHandler function
    window.addEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Add beforeUnload event handler to check for unsaved changes
    window.addEventListener('beforeunload', unloadHandlers.beforeUnload);
});

Template.viewerMain.onRendered(() => {
    const instance = Template.instance();
    const { studies } = instance.data;
    const parentElement = instance.$('#layoutManagerTarget').get(0);
    const studyPrefetcher = StudyPrefetcher.getInstance();

    OHIF.viewerbase.layoutManager = new LayoutManager(parentElement, studies);
    studyPrefetcher.setStudies(studies);

    // Enable hotkeys
    hotkeyUtils.enableHotkeys();

    Session.set('OHIFViewerMainRendered', Random.id());
});

Template.viewerMain.onDestroyed(() => {
    OHIF.log.info('viewerMain onDestroyed');

    // Remove the Window resize listener
    window.removeEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Remove beforeUnload event handler...
    window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete OHIF.viewerbase.layoutManager;
    ProtocolEngine = null;

    Session.set('OHIFViewerMainRendered', false);
});
