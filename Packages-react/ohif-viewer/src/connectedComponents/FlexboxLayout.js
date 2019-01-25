import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ViewerMain from './ViewerMain.js';
import './FlexboxLayout.css';

class FlexboxLayout extends Component {
    static propTypes = {
        studies: PropTypes.array.isRequired,
        leftSidebarOpen: PropTypes.bool.isRequired,
        rightSidebarOpen: PropTypes.bool.isRequired,
    };

    state = {
        studiesForBrowser: []
    };

    componentDidMount() {
        const studiesForBrowser = this.getStudiesForBrowser();

        this.setState({
            studiesForBrowser
        });
    }

    getStudiesForBrowser = () => {
        const { studies } = this.props;

        // TODO[react]:
        // - Add sorting of display sets
        // - Add useMiddleSeriesInstanceAsThumbnail
        // - Add showStackLoadingProgressBar option
        return studies.map((study) => {
            const { studyInstanceUid } = study;

            const thumbnails = study.displaySets.map((displaySet) => {
                const { displaySetInstanceUid, seriesDescription, seriesNumber, instanceNumber, numImageFrames } = displaySet;
                const imageId = displaySet.images[0].getImageId();

                return {
                    imageId,
                    displaySetInstanceUid,
                    seriesDescription,
                    seriesNumber,
                    instanceNumber,
                    numImageFrames,
                };
            });

            return {
                studyInstanceUid,
                thumbnails
            };
        });
    }

    render() {
        let mainContentClassName = "main-content"
        if (this.props.leftSidebarOpen) {
            mainContentClassName += ' sidebar-left-open';
        }

        if (this.props.rightSidebarOpen) {
            mainContentClassName += ' sidebar-right-open';
        }

        // TODO[react]: Add measurementLightTable
        return (
            <div className="FlexboxLayout">
                <div className={this.props.leftSidebarOpen ? "sidebar-menu sidebar-left sidebar-open" : "sidebar-menu sidebar-left"}>
                    <ConnectedStudyBrowser studies={this.state.studiesForBrowser}/>
                </div>
                <div className={mainContentClassName}>
                    <ViewerMain studies={this.props.studies}/>
                </div>
                {/* <div className={this.props.rightSidebarOpen ? "sidebar-menu sidebar-right sidebar-open" : "sidebar-menu sidebar-right"}>
                    {{> measurementLightTable (clone this)}}
                </div> */}
            </div>
        );
    }
}

export default FlexboxLayout;
