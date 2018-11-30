import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
// Local Modules
import { unloadHandlers } from '../../../lib/unloadHandlers';
import { ResizeViewportManager } from '../../../lib/classes/ResizeViewportManager';
import { LayoutManager } from '../../../lib/classes/LayoutManager';
import { StudyPrefetcher } from '../../../lib/classes/StudyPrefetcher';
import { StudyLoadingListener } from '../../../lib/classes/StudyLoadingListener';
import './ViewerMain.styl';

import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';

Meteor.startup(() => {
    window.ResizeViewportManager = window.ResizeViewportManager || new ResizeViewportManager();

    // Set initial value for OHIFViewerMainRendered
    // session variable. This can used in viewer main template
    Session.set('OHIFViewerMainRendered', false);
});

class ViewerMain extends Component {
    constructor(props) {
        super(props);

        this.state = {
            contents: ''
        };

        this.setContents = this.setContents.bind(this);
    }

    componentDidMount() {
        // Attach the Window resize listener
        // Don't use jQuery here. "window.onresize" will always be null
        // If its necessary, check all the code for window.onresize getter
        // and change it to jQuery._data(window, 'events')['resize'].
        // Otherwise this function will be probably overrided.
        // See cineDialog instance.setResizeHandler function
        window.addEventListener('resize', window.ResizeViewportManager.getResizeHandler());

        // Add beforeUnload event handler to check for unsaved changes
        window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

        // Set the current context
        OHIF.context.set('viewer');

        const { studies } = this.props;
        this.studyPrefetcher = StudyPrefetcher.getInstance();
        this.studyLoadingListener = StudyLoadingListener.getInstance();
        this.studyLoadingListener.clear();
        this.studyLoadingListener.addStudies(studies);

        OHIF.viewerbase.layoutManager = new LayoutManager(this.setContents, studies);
        this.studyPrefetcher.setStudies(studies);

        Session.set('OHIFViewerMainRendered', Math.random());
    }

    setContents(component, data) {
        const Comp = this.props.component;
        const contents = (<Comp data={data}/>);

        this.setState({
            contents
        });
    }

    render() {
        return (
            <div className="viewerMain">
                {this.state.contents}
            </div>
        );
    }

    componentWillUnmount() {
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

        // Stop prefetching when we close the viewer
        this.studyPrefetcher.destroy();

        // Destroy stack loading listeners when we close the viewer
        this.studyLoadingListener.clear();

        // Clear references to all stacks in the StackManager
        OHIF.viewerbase.stackManager.clearStacks();

        // @TypeSafeStudies
        // Clears OHIF.viewer.Studies collection
        OHIF.viewer.Studies.removeAll();

        // @TypeSafeStudies
        // Clears OHIF.viewer.StudyMetadataList collection
        OHIF.viewer.StudyMetadataList.removeAll();

        // Reset the current context
        OHIF.context.set(null);
    }
}

ViewerMain.propTypes = {
    studies: PropTypes.array.isRequired
}

export default ViewerMain;
