Template.viewerMain.onCreated(() => {
    // Attach the Window resize listener
    // Don't use jQuery here. "window.onresize" will always be null
    // If its necessary, check all the code for window.onresize getter
    // and change it to jQuery._data(window, 'events')['resize']. 
    // Otherwise this function will be probably overrided.
    // See cineDialog instance.setResizeHandler function
    window.addEventListener('resize', handleResize);

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);
});

Template.viewerMain.onRendered(() => {
    const instance = Template.instance();

    instance.subscribe('hangingprotocols', () => {
        const studies = instance.data.studies;
        const parentElement = instance.$('#layoutManagerTarget').get(0);
        window.layoutManager = new LayoutManager(parentElement, studies);

        ProtocolEngine = new HP.ProtocolEngine(window.layoutManager, studies);
        HP.setEngine(ProtocolEngine);

        // Enable hotkeys
        enableHotkeys();
    });
});

Template.viewerMain.onDestroyed(() => {
    log.info('viewerMain onDestroyed');
    
    // Remove the Window resize listener
    window.removeEventListener('resize', handleResize);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete window.layoutManager;
    delete ProtocolEngine;
});
