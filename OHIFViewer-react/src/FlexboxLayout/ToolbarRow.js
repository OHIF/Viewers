import React, { Component } from "react";
import PropTypes from "prop-types";
import ConnectedToolbarSection from './ConnectedToolbarSection';
import './ToolbarRow.css';

class ToolbarRow extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (<div className="ToolbarRow">
            <div className="clearfix">
                <div className="pull-left m-t-1">
                    {/* > roundedButtonGroup leftSidebarToggleButtonData */}
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

ToolbarRow.propTypes = {
    //studies: PropTypes.array
};

export default ToolbarRow;
