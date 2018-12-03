import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import { OHIF } from 'meteor/ohif:core';
import CornerstoneViewport from '../CornerstoneViewport/CornerstoneViewport.js';
import './GridLayout.styl';

const TOP_CLASS = 'top';
const BOTTOM_CLASS = 'bottom';
const MIDDLE_CLASS = 'middle';

class GridLayout extends Component {
    constructor(props) {
        super(props);

        this.getClass = this.getClass.bind(this);
    }

    // Get class for each viewport, so each app
    // using ohif-viewerbase can style on their own
    getClass(index) {
        const { rows, columns } = this.props;

        if (rows === 1) {
            return `${TOP_CLASS} ${BOTTOM_CLASS}`;
        }

        const actualRow = Math.floor(index / columns);

        if ( actualRow === 0 ) {
            return TOP_CLASS;
        }
        if ( actualRow + 1 === rows ) {
            return BOTTOM_CLASS;
        }

        return MIDDLE_CLASS;
    }

    getActiveClass(index) {
        if (this.props.activeViewport === index) {
            return 'active';
        };

        return ''
    }

    render() {
        // Get the height percentage for each viewport
        const rows = this.props.rows || 1;
        const height = 100 / rows;

        // Get the width percentage for each viewport
        const columns = this.props.columns || 1;
        const width = 100 / columns;

        let viewportData = this.props.viewportData;
        const numViewports = rows * columns;
        const numViewportsWithData = viewportData.length;

        // Check if the viewportData length is different from the given
        if (numViewportsWithData < numViewports) {
            // Add the missing viewports
            const difference = numViewports - numViewportsWithData;
            for (let i = 0; i < difference; i++) {
                viewportData.push({
                    viewportIndex: numViewportsWithData + i + 1,
                    rows,
                    columns
                });
            }
        } else if (numViewportsWithData > numViewports) {
            // Remove the additional viewports
            viewportData = viewportData.slice(0, numViewports);
        }

        const viewports = viewportData.map((data, index) => {
            const className = `viewportContainer ${this.getClass(index)} ${this.getActiveClass(index)}`;
            
            // TODO[react]: Not sure why I needed to do this. Looks like
            // empty viewports aren't provided with a viewportIndex normally?
            data.viewportIndex = index;

            const styles = {
                height: `${height}%`,
                width: `${width}%`,
            };

            const cornerstoneViewport = (data) => (
                <CornerstoneViewport viewportData={data}/>
            );

            const pluginViewport = (data) => (
                <div className={`viewport-plugin-${data.plugin}`} style="height:100%; width: 100%">
                </div>
            );

            let contents;            
            if (!data.studyInstanceUid || !data.displaySetInstanceUid) {
                contents = (
                    <div className="CornerstoneViewport">
                        <div className="viewportInstructions">
                        Please drag a stack here to view images.
                        </div>
                    </div>
                );
            } else if (data.plugin === 'cornerstone') {
                contents = cornerstoneViewport(data);
            } else {
                contents = pluginViewport(data);
            }

            return (
                <div key={index} className={className} style={styles}>
                    {contents}
                    {/*{>seriesQuickSwitch (clone this viewport=viewport viewportIndex=@index)}*/}
                </div>
            );
        });

        const layoutClass = `layout-${rows}-${columns}`;

        return (
            <div id='imageViewerViewports' className={layoutClass}>
                { viewports }
            </div>
        )
    }
}

export default GridLayout;
