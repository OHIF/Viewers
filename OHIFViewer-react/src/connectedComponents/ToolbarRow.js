import React, { Component } from "react";
import ConnectedToolbarSection from './ConnectedToolbarSection';
import ConnectedLayoutButton from './ConnectedLayoutButton';
import ConnectedCineDialog from './ConnectedCineDialog.js';
import PropTypes from 'prop-types';
import { RoundedButtonGroup } from 'react-viewerbase';
import './ToolbarRow.css';
//import Icons from "../images/icons.svg"

const Icons = '/icons.svg';

class ToolbarRow extends Component {
    static propTypes = {
        leftSidebarOpen: PropTypes.bool.isRequired,
        rightSidebarOpen: PropTypes.bool.isRequired,
        setLeftSidebarOpen: PropTypes.func,
        setRightSidebarOpen: PropTypes.func
    };

    static defaultProps = {
        leftSidebarOpen: false,
        rightSidebarOpen: false
    };

    onLeftSidebarValueChanged = (value) => {
        this.props.setLeftSidebarOpen(!!value);
    }

    render() {
        const leftSidebarToggle = [{
            value: 'studies',
            svgLink: `${Icons}#icon-studies`,
            svgWidth: 15,
            svgHeight: 13,
            bottomLabel: 'Series',
        }];

        const leftSidebarValue = this.props.leftSidebarOpen ? leftSidebarToggle[0].value : null;

        return (<div className="ToolbarRow">
            <div className="pull-left m-t-1 p-y-1" style={{ padding: '10px' }}>
                <RoundedButtonGroup options={leftSidebarToggle} value={leftSidebarValue} onValueChanged={this.onLeftSidebarValueChanged}/>
            </div>
            <ConnectedToolbarSection/>
            <ConnectedLayoutButton/>
            {/* TODO: Putting cine dialog here for now */}
            <div style={{ marginLeft: '100px', display: 'inline-block'}}>
                <ConnectedCineDialog/>
            </div>
            <div className="pull-right m-t-1 rm-x-1">
                {/* > roundedButtonGroup rightSidebarToggleButtonData */}
            </div>
            </div>
        );
    }
}

export default ToolbarRow;
