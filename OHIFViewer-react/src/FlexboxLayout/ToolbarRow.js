import React, { Component } from "react";
import ConnectedToolbarSection from './ConnectedToolbarSection';
import { RoundedButtonGroup } from 'react-viewerbase';
import './ToolbarRow.css';

class ToolbarRow extends Component {
    render() {
        const leftSidebarToggle = [{
            value: 'studies',
            svgLink: '/icons.svg#icon-studies',
            svgWidth: 15,
            svgHeight: 13,
            bottomLabel: 'Series',
            onValueChanged: (value) => {
                console.log('value changed: ', value);
            }
        }];

        return (<div className="ToolbarRow">
            <div className="clearfix">
                <div className="pull-left m-t-1">
                    <RoundedButtonGroup options={leftSidebarToggle}/>
                </div>
                <ConnectedToolbarSection/>
                <div className="pull-right m-t-1 rm-x-1">
                    {/* > roundedButtonGroup rightSidebarToggleButtonData */}
                </div>
            </div>
            </div>
        );
    }
}

export default ToolbarRow;
