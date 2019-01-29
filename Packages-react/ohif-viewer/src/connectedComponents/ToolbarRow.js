import React, { Component } from "react";
import ConnectedToolbarSection from './ConnectedToolbarSection';
import ConnectedLayoutButton from './ConnectedLayoutButton';
import ConnectedCineDialog from './ConnectedCineDialog.js';
import PropTypes from 'prop-types';
import { ToolbarButton, RoundedButtonGroup } from 'react-viewerbase';
import './ToolbarRow.css';
//import Icons from "../images/icons.svg"

const Icons = '/icons.svg';

class ToolbarRow extends Component {
    state = {
      cineDialogOpen: false
    };

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

    onClickCineToolbarButton = () => {
      this.setState({
        cineDialogOpen: !this.state.cineDialogOpen
      });
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

        const cineDialogContainerStyle = {
            display: this.state.cineDialogOpen ? 'inline-block' : 'none'
        }

        return (<div className="ToolbarRow">
            <div className="pull-left m-t-1 p-y-1" style={{ padding: '10px' }}>
                <RoundedButtonGroup options={leftSidebarToggle} value={leftSidebarValue} onValueChanged={this.onLeftSidebarValueChanged}/>
            </div>
            <ConnectedToolbarSection/>
            <ConnectedLayoutButton/>
            <ToolbarButton
              active={this.state.cineDialogOpen}
              onClick={this.onClickCineToolbarButton}
              text={'CINE'}
              iconClasses={'fa fa-youtube'}
              />
            <div className='CineDialogContainer' style={cineDialogContainerStyle}>
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
