import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneMath from "cornerstone-math";
import { OHIF } from 'ohif-core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport.js';
import ConnectedLayoutManager from './ConnectedLayoutManager.js';
import './ViewerMain.css';

// Attempt to fix weird undefined dep issue
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

const { StudyLoadingListener, StudyPrefetcher } = OHIF.classes;
const { StackManager } = OHIF.utils;

function getCornerstoneStack(studies, viewportData) {
    const {
        displaySetInstanceUid,
        studyInstanceUid,
    } = viewportData;

    // Create shortcut to displaySet
    const study = studies.find(study => study.studyInstanceUid === studyInstanceUid);

    const displaySet = study.displaySets.find((set) => {
        return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    return StackManager.findOrCreateStack(study, displaySet);
}

class ViewerMain extends Component {
    state = {
        displaySets: [],
        viewportData: [],
    };

    constructor(props) {
        super(props);
        const contextName = 'viewer';
        OHIF.commands.createContext(contextName);

        const isActiveViewportEmpty = () => {
            // TODO: check if it is empty using redux. Need to put viewportData into redux.
            // const activeViewport = Session.get('activeViewport') || 0;
            // return $('.imageViewerViewport').eq(activeViewport).hasClass('empty');
        };

        // Tools. ex: window/level, zoom, pan etc
        const registerToolCommands = map => Object.keys(map).forEach((toolId) => {
            const commandName = map[toolId];
            OHIF.commands.register(contextName, toolId, {
                name: commandName,
                action: () => {
                    const { setToolActive } = OHIF.redux.actions;
                    window.store.dispatch(setToolActive(commandName));
                },
                params: toolId
            });
        });

        // viewport commands. ex: cine play, pause etc
        const registerViewportCommands = map => Object.keys(map).forEach((toolId) => {
            const commandName = map[toolId];
            OHIF.commands.register(contextName, toolId, {
                name: commandName,
                action: () => {
                    console.log('TODO: viewportUtils[commandId] - viewport set the active tool ->' + commandName)
                },
                params: toolId,
                disabled: isActiveViewportEmpty,
            });
        });

        registerToolCommands({
            wwwc: 'W/L',
            zoom: 'Zoom',
            angle: 'Angle',
            dragProbe: 'Pixel Probe',
            ellipticalRoi: 'Elliptical ROI',
            rectangleRoi: 'Rectangle ROI',
            // magnify: 'Magnify', -- TODO: implement magnify
            annotate: 'Annotate',
            stackScroll: 'StackScroll',
            pan: 'Pan',
            length: 'Length Measurement',
            wwwcRegion: 'W/L by Region',
            crosshairs: 'Crosshairs'
        });

        // Register the viewport commands
        registerViewportCommands({
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
            zoomToFit: 'Zoom to Fit',
            invert: 'Invert',
            flipH: 'Flip Horizontally',
            flipV: 'Flip Vertically',
            rotateR: 'Rotate Right',
            rotateL: 'Rotate Left',
            resetViewport: 'Reset',
            clearTools: 'Clear Tools'
        });

        // TODO: preset wl
        // const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);
        for (let i = 0; i < 10; i++) {
            OHIF.commands.register(contextName, `WLPreset${i}`, {
                name: `W/L Preset ${i + 1}`,
                action: () => { console.log(`TODO: window level preset - WLPreset${i}`) }, // TODO applyPreset,
                params: i
            });
        }

        const canMoveDisplaySets = isNext => {
            return false;
            // TODO
            // if (!OHIF.viewerbase.layoutManager) {
            //     return false;
            // } else {
            //     return OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext);
            // }
        };

        // Register viewport navigation commands
        OHIF.commands.set(contextName, {
            scrollDown: {
                name: 'Scroll Down',
                action: () => console.log('TODO: scroll down')
            },
            scrollUp: {
                name: 'Scroll Up',
                action: () => console.log('TODO: scroll up')
            },
            scrollFirstImage: {
                name: 'Scroll to First Image',
                action: () => console.log('TODO: scroll to first image')
            },
            scrollLastImage: {
                name: 'Scroll to Last Image',
                action: () => console.log('TODO: scroll last image')
            },
            previousDisplaySet: {
                name: 'Previous Series',
                action: () => console.log('TODO: previous series'),
                disabled: () => !canMoveDisplaySets(false),
            },
            nextDisplaySet: {
                name: 'Next Series',
                action: () => console.log('TODO: next display set'),
                disabled: () => !canMoveDisplaySets(true),
            },
            nextPanel: {
                name: 'Next Image Viewport',
                action: () => console.log('TODO: nextpanel'),
            },
            previousPanel: {
                name: 'Previous Image Viewport',
                action: () => console.log('TODO: previous panel'),
            }
        }, true);

        const hotKeys = {};
        const hotKeysPreferences = window.store.getState().preferences.hotKeysData;

        Object.keys(hotKeysPreferences).forEach(key => {
            hotKeys[key] = hotKeysPreferences[key].command;
        });

        OHIF.hotkeys.set(contextName, hotKeys, true);
        const { setCommandContext } = OHIF.redux.actions;
        window.store.dispatch(setCommandContext({ context: contextName }));
    }

    componentDidMount() {
        // Add beforeUnload event handler to check for unsaved changes
        //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

        const { studies } = this.props;
        this.studyPrefetcher = StudyPrefetcher.getInstance(cornerstone, cornerstoneTools);
        this.studyPrefetcher.setStudies(studies);
        this.studyLoadingListener = StudyLoadingListener.getInstance(cornerstone);
        this.studyLoadingListener.clear();
        this.studyLoadingListener.addStudies(studies);

        // Get all the display sets for the viewer studies
        const displaySets = [];
        studies.forEach((study) => {
            study.displaySets.forEach(dSet => dSet.images.length && displaySets.push(dSet));
        });

        // TODO: re-add plugins back in
        // TODO: We shouldn't just hang display sets by default
        const viewportData = displaySets.map((dSet, index) => {
            return this.getCornerstoneViewport(dSet, index);
        });

        this.setState({
            displaySets,
            viewportData
        });
    }

    getCornerstoneViewport = (data, index) => {
        // Clone the stack here so we don't mutate it later
        const stack = Object.assign({}, getCornerstoneStack(this.props.studies, data));
        stack.currentImageIdIndex = 0;
        const viewportData = {
            stack,
            ...data,
            viewportIndex: index
        };

        return (<ConnectedCornerstoneViewport
            key={index}
            viewportData={viewportData}
            cornerstone={cornerstone}
            cornerstoneTools={cornerstoneTools}
        />);
    }

    setViewportData = ({ viewportIndex, item }) => {
        // TODO: Replace this with mapDispatchToProps call
        // if we decide to put viewport info into redux

        // Note: Use Slice because React does a shallow equality check. Mutating the array
        // would not trigger a re-render. We have to create a copy.
        const updatedViewportData = this.state.viewportData.slice(0);
        const data = {
            studyInstanceUid: item.studyInstanceUid,
            displaySetInstanceUid: item.displaySetInstanceUid
        };

        updatedViewportData[viewportIndex] = this.getCornerstoneViewport(data, viewportIndex);

        this.setState({
            viewportData: updatedViewportData
        });
    }

    render() {
        return (
            <div className="ViewerMain">
                <ConnectedLayoutManager viewportData={this.state.viewportData} setViewportData={this.setViewportData} />
            </div>
        );
    }

    componentWillUnmount() {
        // Remove beforeUnload event handler...
        //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

        // Destroy the synchronizer used to update reference lines
        OHIF.viewer.updateImageSynchronizer.destroy();

        // Stop prefetching when we close the viewer
        this.studyPrefetcher.destroy();

        // Destroy stack loading listeners when we close the viewer
        this.studyLoadingListener.clear();

        // Clear references to all stacks in the StackManager
        StackManager.clearStacks();

        // @TypeSafeStudies
        // Clears OHIF.viewer.Studies collection
        //OHIF.viewer.Studies.removeAll();

        // @TypeSafeStudies
        // Clears OHIF.viewer.StudyMetadataList collection
        //OHIF.viewer.StudyMetadataList.removeAll();
    }
}

ViewerMain.propTypes = {
    studies: PropTypes.array.isRequired
};

export default ViewerMain;
