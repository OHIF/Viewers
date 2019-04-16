import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedToolbarSection from './ConnectedToolbarSection';
import { ToolbarButton } from 'react-viewerbase';
import ConnectedCineDialog from './ConnectedCineDialog';

class ToolbarModule extends Component {
  state = {
    cineDialogOpen: false
  }

  onClickCineToolbarButton = () => {
    this.setState({
      cineDialogOpen: !this.state.cineDialogOpen
    });
  };

  render() {
    const cineDialogContainerStyle = {
      display: this.state.cineDialogOpen ? 'inline-block' : 'none'
    };

    return (<div className="ToolbarModule">
      <ConnectedToolbarSection />
      <ToolbarButton
        active={this.state.cineDialogOpen}
        onClick={this.onClickCineToolbarButton}
        text={'CINE'}
        iconClasses={'fab fa-youtube'}
        />
        <div className="CineDialogContainer" style={cineDialogContainerStyle}>
          <ConnectedCineDialog />
        </div>
      </div>
    );
  }
}

export default ToolbarModule;
